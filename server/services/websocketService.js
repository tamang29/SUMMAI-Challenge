/**
 * WebSocket Server Service
 */

import { WebSocketServer, WebSocket } from 'ws';

// Track unique users by session
const userSessions = new Map(); // userId -> Set of connections

// Store the latest diagram state
let latestDiagramXML = null;

export const createWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server });
  console.log('WebSocket server initialized');
  return wss;
};

export const setupWebSocketHandlers = (wss, handlers) => {
  wss.on('connection', (ws) => {
    ws.userId = null;

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'user-identify' && message.userId) {
        registerUserSession(ws, message.userId);
        
        // Send latest diagram to new user
        if (latestDiagramXML) {
          sendMessage(ws, {
            type: 'initial-diagram',
            xml: latestDiagramXML,
            timestamp: new Date().toISOString()
          });
          console.log(`Sent latest diagram to user ${message.userId}`);
        }
        
        // Broadcast after user registration
        if (handlers.onUserIdentified) {
          handlers.onUserIdentified(ws, wss);
        }
      }
      
      if (handlers.onMessage) {
        handlers.onMessage(ws, data);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      if (ws.userId) {
        unregisterUserSession(ws, ws.userId);
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


// Register user session
const registerUserSession = (ws, userId) => {
  ws.userId = userId;
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new Set());
  }
  userSessions.get(userId).add(ws);
  console.log(`User ${userId} registered. Unique users: ${userSessions.size}`);
};

// Unregister user session
const unregisterUserSession = (ws, userId) => {
  if (userSessions.has(userId)) {
    userSessions.get(userId).delete(ws);
    if (userSessions.get(userId).size === 0) {
      userSessions.delete(userId);
      console.log(`User ${userId} left. Unique users: ${userSessions.size}`);
    }
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

export const sendMessage = (ws, message) => {
  if (ws.readyState === WebSocket.OPEN) {
    const jsonMessage = typeof message === 'string' ? message : JSON.stringify(message);
    ws.send(jsonMessage);
  }
};

export const broadcastMessageExcept = (wss, sender, message) => {
  const jsonMessage = typeof message === 'string' ? message : JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  });
};

export const getConnectedUsers = (wss) => {
  return Array.from(userSessions.keys());
};

export const closeWebSocketServer = (wss) => {
  wss.close(() => {
    console.log('WebSocket server closed');
  });
};

export const updateLatestDiagram = (xml) => {
  latestDiagramXML = xml;
  console.log('Latest diagram updated on backend');
};

export const getLatestDiagram = () => {
  return latestDiagramXML;
};
