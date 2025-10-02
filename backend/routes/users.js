import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile by ID
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, bio } = req.body;

    const user = await User.findById(req.user._id);
    
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (bio !== undefined) user.profile.bio = bio;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Internal server error'
    });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { language, deafMode, notifications } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Update preferences
    if (language !== undefined) user.preferences.language = language;
    if (deafMode !== undefined) user.preferences.deafMode = deafMode;
    if (notifications !== undefined) user.preferences.notifications = notifications;

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({
      error: 'Preferences update failed',
      message: 'Internal server error'
    });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    res.json({
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Preferences fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch preferences',
      message: 'Internal server error'
    });
  }
});

// Search users
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { 'profile.firstName': { $regex: query, $options: 'i' } },
        { 'profile.lastName': { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('username email profile isOnline lastSeen')
    .limit(parseInt(limit))
    .sort({ isOnline: -1, lastSeen: -1 });

    res.json({ users });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Internal server error'
    });
  }
});

// Get online users
router.get('/status/online', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const users = await User.find({ 
      isOnline: true,
      _id: { $ne: req.user._id }
    })
    .select('username profile isOnline lastSeen')
    .limit(parseInt(limit))
    .sort({ lastSeen: -1 });

    res.json({ users });

  } catch (error) {
    console.error('Online users fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch online users',
      message: 'Internal server error'
    });
  }
});

export default router;
