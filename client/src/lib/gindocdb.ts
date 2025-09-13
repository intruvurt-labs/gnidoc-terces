interface GindocDBClient {
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): void;
  add(collection: string, data: any, id?: string): Promise<string>;
  update(collection: string, id: string, data: any): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  get(collection: string, id: string): Promise<any>;
  query(collection: string, query?: Record<string, any>): Promise<any[]>;
  subscribe(collection: string, callback: (data: any) => void, query?: Record<string, any>): string;
  unsubscribe(subscriptionId: string): void;
}

export class GindocDB implements GindocDBClient {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, (data: any) => void> = new Map();
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();
  public connected = false;

  constructor(private url: string = `ws://${window.location.host}/gindocdb`) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.connected = true;
          console.log('🔥 Connected to GindocDB');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          this.connected = false;
          console.log('GindocDB connection closed');
          // Auto-reconnect after 3 seconds
          setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = (error) => {
          console.error('GindocDB connection error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'connected':
        console.log('GindocDB:', message.message);
        break;
        
      case 'realtime_update':
        // Handle real-time updates
        this.subscriptions.forEach(callback => {
          callback(message);
        });
        break;
        
      case 'add_success':
      case 'update_success':
      case 'delete_success':
      case 'get_result':
      case 'query_result':
        // Handle request responses
        const requestId = message.requestId;
        if (requestId && this.pendingRequests.has(requestId)) {
          const { resolve } = this.pendingRequests.get(requestId)!;
          this.pendingRequests.delete(requestId);
          resolve(message);
        }
        break;
        
      case 'error':
        console.error('GindocDB error:', message.error);
        break;
        
      default:
        console.log('Unknown GindocDB message:', message);
    }
  }

  private sendMessage(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('GindocDB not connected'));
        return;
      }

      const requestId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : (Date.now().toString() + '-' + (performance.now()|0).toString(36));
      this.pendingRequests.set(requestId, { resolve, reject });

      this.ws.send(JSON.stringify({
        type,
        requestId,
        ...data
      }));

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  async add(collection: string, data: any, id?: string): Promise<string> {
    const response = await this.sendMessage('add', { collection, data, id });
    return response.id;
  }

  async update(collection: string, id: string, data: any): Promise<void> {
    await this.sendMessage('update', { collection, id, data });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.sendMessage('delete', { collection, id });
  }

  async get(collection: string, id: string): Promise<any> {
    const response = await this.sendMessage('get', { collection, id });
    return response.data;
  }

  async query(collection: string, query?: Record<string, any>): Promise<any[]> {
    const response = await this.sendMessage('query', { collection, query });
    return response.data;
  }

  subscribe(collection: string, callback: (data: any) => void, query?: Record<string, any>): string {
    const subscriptionId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : (Date.now().toString() + '-' + (performance.now()|0).toString(36));
    this.subscriptions.set(subscriptionId, callback);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        collection,
        query,
        subscriptionId
      }));
    }

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        subscriptionId
      }));
    }
  }
}

// Create a singleton instance
export const gindocDB = new GindocDB();

// Auto-connect when the module loads
if (typeof window !== 'undefined') {
  gindocDB.connect().catch(error => {
    console.warn('Initial GindocDB connection failed:', error);
  });
}

// React hook for easy integration
import { useState, useEffect } from 'react';

export function useGindocDB() {
  const [connected, setConnected] = useState(gindocDB.connected);

  useEffect(() => {
    const checkConnection = () => setConnected(gindocDB.connected);
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    db: gindocDB,
    connected,
    add: gindocDB.add.bind(gindocDB),
    update: gindocDB.update.bind(gindocDB),
    delete: gindocDB.delete.bind(gindocDB),
    get: gindocDB.get.bind(gindocDB),
    query: gindocDB.query.bind(gindocDB),
    subscribe: gindocDB.subscribe.bind(gindocDB),
    unsubscribe: gindocDB.unsubscribe.bind(gindocDB)
  };
}

export default gindocDB;
