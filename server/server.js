import express from 'express';
import cors from 'cors';
import http from 'http';
import {
  createWebSocketServer,
  setupWebSocketHandlers,
  broadcastMessage,
  broadcastMessageExcept,
  updateLatestDiagram,
  getConnectedUsersList
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
  onUserCountChange: (wss, count) => {
    broadcastMessage(wss, {
      type: 'user-count-update',
      count: count,
      users: Array.from(getConnectedUsersList())
    });
  },

  onMessage: (ws, data) => {
    try {
      const message = JSON.parse(data);

      // Handle diagram updates with Yjs global room
      if (message.type === 'diagram-update') {
        // Save the latest diagram state on backend
        if (message.xml) {
          updateLatestDiagram(message.xml);
        }
        
        // Broadcast diagram updates to all clients except sender
        broadcastMessageExcept(wss, ws, {
          type: 'diagram-update',
          xml: message.xml,
          room: message.room,
          timestamp: message.timestamp || new Date().toISOString()
        });
      } else {
        // Handle other message types
        broadcastMessageExcept(wss, ws, {
          type: message.type || 'message',
          data: message.data,
          timestamp: new Date().toISOString()
        });
      }

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
    console.log('Client disconnected');
  },

  onError: (ws, error) => {
    console.error('WebSocket connection error:', error);
  }
});


app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running'
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
