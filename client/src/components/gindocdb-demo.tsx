import { useState, useEffect } from 'react';
import { useGindocDB } from '@/lib/gindocdb';
import { Button } from '@/components/ui/button';

export function GindocDBDemo() {
  const { db, connected, add, query, subscribe } = useGindocDB();
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    if (connected && !subscriptionId) {
      // Subscribe to real-time updates
      const subId = subscribe('demo', (data) => {
        console.log('Real-time update:', data);
        if (data.action === 'add') {
          setRealtimeData(prev => [...prev, data.data]);
        }
      });
      setSubscriptionId(subId);
    }

    return () => {
      if (subscriptionId) {
        db.unsubscribe(subscriptionId);
      }
    };
  }, [connected, subscribe, subscriptionId, db]);

  const addDemoData = async () => {
    try {
      const newData = {
        message: `Hello from GindocDB! ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toISOString(),
        type: 'demo',
        user: 'GINDOC User'
      };
      
      await add('demo', newData);
    } catch (error) {
      console.error('Error adding demo data:', error);
    }
  };

  const loadDemoData = async () => {
    try {
      const data = await query('demo');
      setRealtimeData(data.map(doc => doc.data));
    } catch (error) {
      console.error('Error loading demo data:', error);
    }
  };

  return (
    <div className="glass-morph rounded-xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-orbitron font-bold text-cyber-cyan">
          <i className="fas fa-database mr-2"></i>
          GindocDB Demo
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red'}`}></div>
          <span className={`text-xs ${connected ? 'text-cyber-green' : 'text-cyber-red'}`}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button
            onClick={addDemoData}
            disabled={!connected}
            className="flex-1"
            size="sm"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Real-time Data
          </Button>
          <Button
            onClick={loadDemoData}
            disabled={!connected}
            variant="outline"
            size="sm"
          >
            <i className="fas fa-refresh mr-2"></i>
            Load Data
          </Button>
        </div>

        <div className="bg-dark-card rounded-lg p-4 max-h-48 overflow-y-auto">
          <div className="text-xs text-cyber-green mb-2 font-orbitron">
            REAL-TIME UPDATES:
          </div>
          {realtimeData.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              No real-time data yet. Add some to see live updates!
            </div>
          ) : (
            <div className="space-y-2">
              {realtimeData.slice(-5).map((item, index) => (
                <div
                  key={index}
                  className="bg-dark-panel rounded p-2 border-l-2 border-cyber-cyan animate-fade-in"
                >
                  <div className="text-xs text-cyber-cyan font-fira">
                    {item.user}
                  </div>
                  <div className="text-sm text-white">
                    {item.message}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Firebase Clone Features:</span>
            <span className="text-cyber-green">✓ Active</span>
          </div>
          <div className="flex justify-between">
            <span>Real-time Sync:</span>
            <span className="text-cyber-green">✓ Enabled</span>
          </div>
          <div className="flex justify-between">
            <span>WebSocket Connection:</span>
            <span className={connected ? 'text-cyber-green' : 'text-cyber-red'}>
              {connected ? '✓ Connected' : '✗ Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GindocDBDemo;
