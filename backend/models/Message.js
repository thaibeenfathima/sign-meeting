import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'audio', 'subtitle', 'system'],
    default: 'text'
  },
  content: {
    original: {
      text: String,
      language: String
    },
    translations: [{
      language: String,
      text: String,
      confidence: Number // Translation confidence score
    }]
  },
  audioData: {
    duration: Number, // in seconds
    format: String,
    size: Number,
    transcription: {
      text: String,
      language: String,
      confidence: Number
    }
  },
  metadata: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      emoji: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ type: 1, room: 1 });

// Add translation to message
messageSchema.methods.addTranslation = function(language, text, confidence = 1.0) {
  const existingTranslation = this.content.translations.find(
    t => t.language === language
  );
  
  if (existingTranslation) {
    existingTranslation.text = text;
    existingTranslation.confidence = confidence;
  } else {
    this.content.translations.push({
      language,
      text,
      confidence
    });
  }
  
  return this.save();
};

// Get translation for specific language
messageSchema.methods.getTranslation = function(language) {
  return this.content.translations.find(t => t.language === language);
};

// Add reaction to message
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.metadata.reactions.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.timestamp = new Date();
  } else {
    this.metadata.reactions.push({
      user: userId,
      emoji,
      timestamp: new Date()
    });
  }
  
  return this.save();
};

export default mongoose.model('Message', messageSchema);
