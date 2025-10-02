// backend/server.js

import 'dotenv/config'; 
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import userRoutes from './routes/users.js';
import { handleSocketConnection } from './socket/socketHandler.js';
import { socketAuthMiddleware } from './middleware/auth.js';

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const app = express();
    const server = createServer(app);
    const PORT = process.env.PORT || 5000;
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

    const io = new Server(server, {
      cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    app.use(cors({
      origin: FRONTEND_URL,
      credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use('/api/auth', authRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/users', userRoutes);

    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        message: 'Video Call Server is running',
        timestamp: new Date().toISOString()
      });
    });

    // Apply the socket authentication middleware to all incoming connections
    io.use(socketAuthMiddleware);

    // The 'connection' event will now only fire for successfully authenticated sockets
    io.on('connection', (socket) => {
      handleSocketConnection(socket, io);
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO server ready for connections`);
      console.log(`🌐 Accepting requests from: ${FRONTEND_URL}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default {};