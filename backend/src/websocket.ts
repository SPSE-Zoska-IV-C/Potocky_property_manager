import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http'; // Import Server type from http

let wss: WebSocketServer;

// function to initialize the websocket server
export const initWebSocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected via WebSocket');

    // keep connection alive
    const interval = setInterval(() => {
      ws.ping();
    }, 30000); // ping every 30 seconds

    ws.on('pong', () => {
      // console.log('Client pong received');
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      clearInterval(interval);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(interval);
    });

    // send a welcome message
    ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to WebSocket server' }));
  });

  console.log('WebSocket server initialized');
};

// function to broadcast messages to all connected clients
export const broadcast = (data: object) => {
  if (!wss) {
    console.error('WebSocket server not initialized.');
    return;
  }

  const message = JSON.stringify(data);
  console.log('Broadcasting message:', message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
