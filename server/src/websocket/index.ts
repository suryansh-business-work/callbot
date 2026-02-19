import http from 'http';
import { Server, Socket } from 'socket.io';
import { envConfig } from '../config';

let io: Server | null = null;

/**
 * Initialize Socket.io server on a dedicated WebSocket port.
 */
export const initSocketIO = (port: number): Server => {
  const wsServer = http.createServer();
  io = new Server(wsServer, {
    cors: {
      origin: envConfig.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Client joins a room for a specific call to receive live updates
    socket.on('join:call', (callSid: string) => {
      socket.join(`call:${callSid}`);
      console.log(`[Socket] ${socket.id} joined room call:${callSid}`);
    });

    socket.on('leave:call', (callSid: string) => {
      socket.leave(`call:${callSid}`);
      console.log(`[Socket] ${socket.id} left room call:${callSid}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  wsServer.listen(port, () => {
    console.log(`[Socket] WebSocket server running on port ${port}`);
  });

  return io;
};

/**
 * Get the Socket.io server instance.
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocketIO first.');
  }
  return io;
};

/**
 * Emit a conversation event to all clients watching a specific call.
 */
export const emitToCall = (callSid: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`call:${callSid}`).emit(event, data);
  }
};

/**
 * Emit an event to ALL connected clients (global broadcast).
 */
export const emitGlobal = (event: string, data?: unknown): void => {
  if (io) {
    io.emit(event, data);
  }
};
