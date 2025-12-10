import express from 'express';
import cors from 'cors';
import http from 'http';
import {
  createWebSocketServer,
  setupWebSocketHandlers,
  broadcastMessage,
  broadcastMessageExcept,
  getConnectedClientsCount,
  broadcastClientCount
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
  onConnection: (ws) => {
    console.log(`Total connected clients: ${getConnectedClientsCount(wss)}`);
    
    // Notify all clients about new connection
    broadcastMessage(wss, {
      type: 'user-joined',
      message: 'A new user has joined',
      clientCount: getConnectedClientsCount(wss)
    });
    
    // Send client count to all
    broadcastClientCount(wss);
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
    console.log(`Total connected clients: ${getConnectedClientsCount(wss)}`);
    
    // Notify all clients about disconnection
    broadcastMessage(wss, {
      type: 'user-left',
      message: 'A user has left',
      clientCount: getConnectedClientsCount(wss)
    });
    
    // Send client count to all
    broadcastClientCount(wss);
  },

  onError: (ws, error) => {
    console.error('WebSocket connection error:', error);
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SUMMAI Challenge API' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    connectedClients: getConnectedClientsCount(wss)
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
});
