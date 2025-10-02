// backend/socket/socketHandler.js

import Room from '../models/Room.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { translateText, transcribeAudio } from '../services/translationService.js';

const connectedUsers = new Map(); // socket.id -> { user, currentRoomId }

export const handleSocketConnection = (socket, io) => {
  const user = socket.user;
  const userId = user._id.toString();

  connectedUsers.set(socket.id, { user });
  socket.join(userId);
  User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).exec();
  console.log(`✅ User connected: ${user.username} (Socket ID: ${socket.id})`);

  socket.on('join_room', async ({ roomId }) => {
    try {
      // --- DEBUG LOGGING ---
      console.log(`[DEBUG] User '${user.username}' is attempting to join room '${roomId}'`);
      const room = await Room.findOne({ roomId }).populate('participants.user', 'username profile preferences');
      
      if (!room) {
        console.log(`[DEBUG] Room not found in database for roomId: ${roomId}`);
        return socket.emit('error', { message: 'Room not found' });
      }
      console.log(`[DEBUG] Successfully found room '${roomId}' in database.`);

      const connection = connectedUsers.get(socket.id);
      if (connection?.currentRoomId) {
        await handleLeaveRoom(socket, io, connection.currentRoomId);
      }

      socket.join(roomId);
      connection.currentRoomId = roomId;
      connectedUsers.set(socket.id, connection);
      
      const roomSockets = await io.in(roomId).fetchSockets();
      const participants = roomSockets.map(s => connectedUsers.get(s.id)?.user).filter(Boolean);

      console.log(`[DEBUG] Emitting 'room_joined' to socket ${socket.id}`);
      socket.emit('room_joined', { room, participants });
      
      socket.to(roomId).emit('user_joined', { user });
      console.log(`[Room: ${roomId}] User ${user.username} joined successfully.`);
    } catch (error) {
      console.error('CRASH in join_room handler:', error);
      socket.emit('error', { message: 'Internal server error while joining room' });
    }
  });

  socket.on('leave_room', async ({ roomId }) => await handleLeaveRoom(socket, io, roomId));
  socket.on('webrtc_offer', ({ offer, targetUserId }) => io.to(targetUserId).emit('webrtc_offer', { offer, fromUserId: userId }));
  socket.on('webrtc_answer', ({ answer, targetUserId }) => io.to(targetUserId).emit('webrtc_answer', { answer, fromUserId: userId }));
  socket.on('webrtc_ice_candidate', ({ candidate, targetUserId }) => io.to(targetUserId).emit('webrtc_ice_candidate', { candidate, fromUserId: userId }));
  
  // User preference updates
  socket.on('user_preferences_updated', ({ roomId, preferences }) => {
    console.log(`[Preferences] User ${user.username} updated preferences in room ${roomId}:`, preferences);
    socket.to(roomId).emit('user_preferences_updated', {
      userId,
      preferences
    });
  });
  
  socket.on('disconnect', () => handleDisconnect(socket, io));

  // Other handlers (send_message, audio_data) can be placed here...
};

// --- Helper Functions ---
const handleLeaveRoom = async (socket, io, roomId) => {
  const connection = connectedUsers.get(socket.id);
  if (!connection || connection.currentRoomId !== roomId) return;
  
  socket.leave(roomId);
  connection.currentRoomId = null;
  connectedUsers.set(socket.id, connection);
  
  io.to(roomId).emit('user_left', { userId: connection.user._id.toString() });
  console.log(`[Room: ${roomId}] User ${connection.user.username} left`);
};

const handleDisconnect = async (socket, io) => {
  const connection = connectedUsers.get(socket.id);
  if (connection) {
    if (connection.currentRoomId) {
      await handleLeaveRoom(socket, io, connection.currentRoomId);
    }
    await User.findByIdAndUpdate(connection.user._id, { isOnline: false, lastSeen: new Date() });
    connectedUsers.delete(socket.id);
    console.log(`❌ User disconnected: ${connection.user.username}`);
  }
};