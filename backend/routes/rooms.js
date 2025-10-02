import express from 'express';
import Room from '../models/Room.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new room
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, maxParticipants, isPrivate, password } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid room name',
        message: 'Room name is required'
      });
    }

    // Generate unique room ID
    let roomId;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      roomId = Room.generateRoomId();
      const existingRoom = await Room.findOne({ roomId });
      if (!existingRoom) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        error: 'Room creation failed',
        message: 'Unable to generate unique room ID'
      });
    }

    const room = new Room({
      roomId,
      name: name.trim(),
      description: description?.trim() || '',
      host: req.user._id,
      settings: {
        maxParticipants: maxParticipants || 10,
        isPrivate: isPrivate || false,
        password: isPrivate ? password : undefined
      }
    });

    // Add host as first participant
    room.participants.push({
      user: req.user._id,
      joinedAt: new Date(),
      isActive: true
    });

    await room.save();
    await room.populate('host', 'username email profile');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });

  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({
      error: 'Room creation failed',
      message: 'Internal server error'
    });
  }
});

// Join a room
router.post('/join/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;

    const room = await Room.findOne({ roomId })
      .populate('host', 'username email profile')
      .populate('participants.user', 'username email profile');

    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        message: 'The specified room does not exist'
      });
    }

    if (room.status === 'ended') {
      return res.status(400).json({
        error: 'Room ended',
        message: 'This room has already ended'
      });
    }

    // Check if room is private and password is required
    if (room.settings.isPrivate && room.settings.password !== password) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Incorrect room password'
      });
    }

    // Check if room is full
    if (room.activeParticipantsCount >= room.settings.maxParticipants) {
      return res.status(400).json({
        error: 'Room full',
        message: 'This room has reached its maximum capacity'
      });
    }

    // Add user to room
    await room.addParticipant(req.user._id);
    
    // Update room status to active if it was waiting
    if (room.status === 'waiting') {
      room.status = 'active';
      room.startedAt = new Date();
      await room.save();
    }

    // Populate the updated room
    await room.populate('participants.user', 'username email profile');

    res.json({
      message: 'Joined room successfully',
      room
    });

  } catch (error) {
    console.error('Room join error:', error);
    res.status(500).json({
      error: 'Failed to join room',
      message: 'Internal server error'
    });
  }
});

// Leave a room
router.post('/leave/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        message: 'The specified room does not exist'
      });
    }

    await room.removeParticipant(req.user._id);

    // End room if no active participants
    if (room.activeParticipantsCount === 0) {
      room.status = 'ended';
      room.endedAt = new Date();
      if (room.startedAt) {
        room.duration = Math.round((room.endedAt - room.startedAt) / (1000 * 60));
      }
      await room.save();
    }

    res.json({
      message: 'Left room successfully'
    });

  } catch (error) {
    console.error('Room leave error:', error);
    res.status(500).json({
      error: 'Failed to leave room',
      message: 'Internal server error'
    });
  }
});

// Get room details
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId })
      .populate('host', 'username email profile')
      .populate('participants.user', 'username email profile preferences');

    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        message: 'The specified room does not exist'
      });
    }

    res.json({ room });

  } catch (error) {
    console.error('Room fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch room',
      message: 'Internal server error'
    });
  }
});

// Get user's rooms
router.get('/user/my-rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id }
      ]
    })
    .populate('host', 'username email profile')
    .populate('participants.user', 'username email profile')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({ rooms });

  } catch (error) {
    console.error('User rooms fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch rooms',
      message: 'Internal server error'
    });
  }
});

export default router;
