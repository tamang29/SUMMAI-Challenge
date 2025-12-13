/**
 * WebSocket Server Service
 */

import { WebSocketServer, WebSocket } from 'ws';

// Store the latest diagram state
let latestDiagramXML = null;

// Track connected users - map of userId to count of active connections
const connectedUsers = new Map();

export const createWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server });
  console.log('WebSocket server initialized');
  return wss;
};

export const setupWebSocketHandlers = (wss, handlers) => {
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      // Handle user identification and send initial diagram
      if (message.type === 'user-identify' && message.userId) {
        ws.userId = message.userId;
        // Increment connection count for this user
        if (connectedUsers.has(message.userId)) {
          connectedUsers.set(message.userId, connectedUsers.get(message.userId) + 1);
        } else {
          connectedUsers.set(message.userId, 1);
        }
        
        console.log(`User ${message.userId} connected. User connections: ${connectedUsers.get(message.userId)}. Total unique users: ${connectedUsers.size}`);
        
        // Send latest diagram to new user
        if (latestDiagramXML) {
          sendMessage(ws, {
            type: 'initial-diagram',
            xml: latestDiagramXML,
            timestamp: new Date().toISOString()
          });
          console.log(`Sent latest diagram to user ${message.userId}`);
        }
        
        // Broadcast updated user count to all clients
        if (handlers.onUserCountChange) {
          handlers.onUserCountChange(wss, connectedUsers.size);
        }

        return;
      }
      
      // Handle other messages
      if (handlers.onMessage) {
        handlers.onMessage(ws, data);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        // Decrement connection count for this user
        const currentCount = connectedUsers.get(ws.userId);
        if (currentCount && currentCount > 1) {
          connectedUsers.set(ws.userId, currentCount - 1);
        } else {
          connectedUsers.delete(ws.userId);
        }
        
        console.log(`Client disconnected. Remaining unique users: ${connectedUsers.size}`);
        
        // Broadcast updated user count to all clients
        if (handlers.onUserCountChange) {
          handlers.onUserCountChange(wss, connectedUsers.size);
        }
      }
      
      if (handlers.onClose) {
        handlers.onClose(ws);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (handlers.onError) {
        handlers.onError(ws, error);
      }
    });
  });
};

export const sendMessage = (ws, message) => {
  if (ws.readyState === WebSocket.OPEN) {
    const jsonMessage = typeof message === 'string' ? message : JSON.stringify(message);
    ws.send(jsonMessage);
  }
};

export const broadcastMessage = (wss, message) => {
  const jsonMessage = typeof message === 'string' ? message : JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  });
};

export const broadcastMessageExcept = (wss, sender, message) => {
  const jsonMessage = typeof message === 'string' ? message : JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  });
};

export const updateLatestDiagram = (xml) => {
  latestDiagramXML = xml;
  console.log('Latest diagram updated on backend');
};

export const getConnectedUsersList = () => {
  return connectedUsers;
};
