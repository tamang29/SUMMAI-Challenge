import express from 'express';
import cors from 'cors';
import http from 'http';
import {
  createWebSocketServer,
  setupWebSocketHandlers,
  broadcastMessage,
  broadcastMessageExcept,
  getConnectedUsers
} from './services/websocketService.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize WebSocket server
const wss = createWebSocketServer(server);

setupWebSocketHandlers(wss, {
  onUserIdentified: (ws, wss) => {
    console.log(`User ${ws.userId} identified. Total users: ${getConnectedUsers(wss).length}`);
    
    // Notify all clients about new user connection
    broadcastMessage(wss, {
      type: 'user-joined',
      message: 'A new user has joined',
      connectedUsers: getConnectedUsers(wss)
    });
  },

  onMessage: (ws, data) => {
    try {
      const message = JSON.parse(data);
      console.log('Parsed message:', message);

      // Broadcast message to all clients except sender
      broadcastMessageExcept(wss, ws, {
        type: message.type || 'message',
        data: message.data,
        timestamp: new Date().toISOString()
      });

      // Send acknowledgment to sender
      ws.send(JSON.stringify({
        type: 'message-received',
        message: 'Your message was received'
      }));
    } catch (err) {
      console.error('Error parsing message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  },

  onClose: (ws) => {
    console.log(`Client disconnected. Total users: ${getConnectedUsers(wss).length}`);
    
    // Notify all clients about disconnection
    broadcastMessage(wss, {
      type: 'user-left',
      message: 'A user has left',
      connectedUsers: getConnectedUsers(wss)
    });
  },

  onError: (ws, error) => {
    console.error('WebSocket connection error:', error);
  }
});


app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    connectedUsers: getConnectedUsers(wss).length
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
