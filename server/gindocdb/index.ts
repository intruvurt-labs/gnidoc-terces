import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { randomUUID } from 'crypto';
import { storage } from '../storage';

interface GindocDBDocument {
  id: string;
  collection: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface GindocDBSubscription {
  id: string;
  collection: string;
  query?: Record<string, any>;
  callback: (data: any) => void;
}

interface ClientConnection {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  isAlive: boolean;
}

export class GindocDB {
  private wss: WebSocketServer;
  private collections: Map<string, Map<string, GindocDBDocument>> = new Map();
  private subscriptions: Map<string, GindocDBSubscription> = new Map();
  private clients: Map<string, ClientConnection> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/gindocdb',
      perMessageDeflate: false
    });
    
    this.setupWebSocketServer();
    this.setupHeartbeat();
    
    console.log('🔥 GindocDB initialized - Firebase clone ready!');
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = randomUUID();
      const client: ClientConnection = {
        id: clientId,
        ws,
        subscriptions: new Set(),
        isAlive: true
      };
      
      this.clients.set(clientId, client);
      
      // Send welcome message
      this.sendToClient(client, {
        type: 'connected',
        clientId,
        message: 'Welcome to GindocDB - Real-time Firebase Clone'
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error) {
          console.error('GindocDB message parse error:', error);
        }
      });

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('close', () => {
        this.handleClientDisconnect(client);
      });

      ws.on('error', (error) => {
        console.error('GindocDB WebSocket error:', error);
        this.handleClientDisconnect(client);
      });
    });
  }

  private setupHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          this.handleClientDisconnect(client);
          return;
        }
        
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000); // 30 seconds
  }

  private handleMessage(client: ClientConnection, message: any) {
    switch (message.type) {
      case 'add':
        this.handleAdd(client, message);
        break;
      case 'update':
        this.handleUpdate(client, message);
        break;
      case 'delete':
        this.handleDelete(client, message);
        break;
      case 'get':
        this.handleGet(client, message);
        break;
      case 'query':
        this.handleQuery(client, message);
        break;
      case 'subscribe':
        this.handleSubscribe(client, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(client, message);
        break;
      default:
        this.sendError(client, `Unknown message type: ${message.type}`);
    }
  }

  private async handleAdd(client: ClientConnection, message: any) {
    try {
      const { collection, data, id } = message;
      const docId = id || randomUUID();
      
      const document: GindocDBDocument = {
        id: docId,
        collection,
        data,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      if (!this.collections.has(collection)) {
        this.collections.set(collection, new Map());
      }
      
      this.collections.get(collection)!.set(docId, document);
      
      // Persist to database
      await this.persistToDatabase(document);
      
      // Notify all subscribers
      this.notifySubscribers(collection, 'add', document);
      
      this.sendToClient(client, {
        type: 'add_success',
        id: docId,
        data: document
      });
    } catch (error) {
      this.sendError(client, `Add failed: ${error}`);
    }
  }

  private async handleUpdate(client: ClientConnection, message: any) {
    try {
      const { collection, id, data } = message;
      
      const collectionMap = this.collections.get(collection);
      if (!collectionMap || !collectionMap.has(id)) {
        this.sendError(client, `Document not found: ${collection}/${id}`);
        return;
      }
      
      const document = collectionMap.get(id)!;
      document.data = { ...document.data, ...data };
      document.updatedAt = new Date();
      document.version += 1;
      
      // Persist to database
      await this.persistToDatabase(document);
      
      // Notify all subscribers
      this.notifySubscribers(collection, 'update', document);
      
      this.sendToClient(client, {
        type: 'update_success',
        id,
        data: document
      });
    } catch (error) {
      this.sendError(client, `Update failed: ${error}`);
    }
  }

  private handleGet(client: ClientConnection, message: any) {
    try {
      const { collection, id } = message;
      
      const collectionMap = this.collections.get(collection);
      if (!collectionMap || !collectionMap.has(id)) {
        this.sendToClient(client, {
          type: 'get_result',
          id,
          data: null
        });
        return;
      }
      
      const document = collectionMap.get(id)!;
      this.sendToClient(client, {
        type: 'get_result',
        id,
        data: document
      });
    } catch (error) {
      this.sendError(client, `Get failed: ${error}`);
    }
  }

  private handleQuery(client: ClientConnection, message: any) {
    try {
      const { collection, query = {} } = message;
      
      const collectionMap = this.collections.get(collection);
      if (!collectionMap) {
        this.sendToClient(client, {
          type: 'query_result',
          data: []
        });
        return;
      }
      
      const results = Array.from(collectionMap.values()).filter(doc => 
        this.matchesQuery(doc.data, query)
      );
      
      this.sendToClient(client, {
        type: 'query_result',
        data: results
      });
    } catch (error) {
      this.sendError(client, `Query failed: ${error}`);
    }
  }

  private handleSubscribe(client: ClientConnection, message: any) {
    try {
      const { collection, query } = message;
      const subscriptionId = randomUUID();
      
      const subscription: GindocDBSubscription = {
        id: subscriptionId,
        collection,
        query,
        callback: (data) => this.sendToClient(client, data)
      };
      
      this.subscriptions.set(subscriptionId, subscription);
      client.subscriptions.add(subscriptionId);
      
      this.sendToClient(client, {
        type: 'subscribed',
        subscriptionId,
        collection
      });
      
      // Send initial data
      this.handleQuery(client, { collection, query });
    } catch (error) {
      this.sendError(client, `Subscribe failed: ${error}`);
    }
  }

  private handleUnsubscribe(client: ClientConnection, message: any) {
    try {
      const { subscriptionId } = message;
      
      this.subscriptions.delete(subscriptionId);
      client.subscriptions.delete(subscriptionId);
      
      this.sendToClient(client, {
        type: 'unsubscribed',
        subscriptionId
      });
    } catch (error) {
      this.sendError(client, `Unsubscribe failed: ${error}`);
    }
  }

  private notifySubscribers(collection: string, action: string, document: GindocDBDocument) {
    this.subscriptions.forEach((subscription) => {
      if (subscription.collection === collection) {
        if (!subscription.query || this.matchesQuery(document.data, subscription.query)) {
          subscription.callback({
            type: 'realtime_update',
            action,
            collection,
            data: document
          });
        }
      }
    });
  }

  private matchesQuery(data: any, query: Record<string, any>): boolean {
    return Object.entries(query).every(([key, value]) => {
      return data[key] === value;
    });
  }

  private async persistToDatabase(document: GindocDBDocument) {
    // For now, we'll use the existing storage for persistence
    // In a real Firebase clone, this would be more sophisticated
    try {
      if (document.collection === 'projects') {
        await storage.createProject({
          name: document.data.name || 'Untitled',
          description: document.data.description,
          type: document.data.type || 'code',
          prompt: document.data.prompt || '',
          result: document.data.result,
          aiModel: document.data.aiModel || 'gemini'
        });
      }
    } catch (error) {
      console.error('Persistence error:', error);
    }
  }

  private sendToClient(client: ClientConnection, data: any) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  private sendError(client: ClientConnection, error: string) {
    this.sendToClient(client, {
      type: 'error',
      error
    });
  }

  private handleClientDisconnect(client: ClientConnection) {
    // Clean up subscriptions
    client.subscriptions.forEach(subId => {
      this.subscriptions.delete(subId);
    });
    
    this.clients.delete(client.id);
    client.ws.terminate();
  }

  // Public API methods
  public async add(collection: string, data: any, id?: string): Promise<string> {
    const docId = id || randomUUID();
    const document: GindocDBDocument = {
      id: docId,
      collection,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    if (!this.collections.has(collection)) {
      this.collections.set(collection, new Map());
    }
    
    this.collections.get(collection)!.set(docId, document);
    await this.persistToDatabase(document);
    this.notifySubscribers(collection, 'add', document);
    
    return docId;
  }

  public get(collection: string, id: string): GindocDBDocument | null {
    const collectionMap = this.collections.get(collection);
    return collectionMap?.get(id) || null;
  }

  public query(collection: string, query: Record<string, any> = {}): GindocDBDocument[] {
    const collectionMap = this.collections.get(collection);
    if (!collectionMap) return [];
    
    return Array.from(collectionMap.values()).filter(doc => 
      this.matchesQuery(doc.data, query)
    );
  }
}
