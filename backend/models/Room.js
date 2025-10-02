import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    maxParticipants: {
      type: Number,
      default: 10,
      min: 2,
      max: 50
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    password: String,
    allowRecording: {
      type: Boolean,
      default: false
    },
    enableSubtitles: {
      type: Boolean,
      default: true
    },
    enableSignLanguage: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  },
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in minutes
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTranslations: {
      type: Number,
      default: 0
    },
    languages: [String] // Languages detected during the call
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ host: 1, status: 1 });
roomSchema.index({ 'participants.user': 1 });
roomSchema.index({ createdAt: -1 });

// Generate unique room ID
roomSchema.statics.generateRoomId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Add participant to room
roomSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString() && p.isActive
  );
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Remove participant from room
roomSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString() && p.isActive
  );
  
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
  
  return this.save();
};

// Get active participants count
roomSchema.virtual('activeParticipantsCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

export default mongoose.model('Room', roomSchema);
