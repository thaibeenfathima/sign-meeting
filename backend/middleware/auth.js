// backend/middleware/auth.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware for authenticating REST API requests.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.name);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * Middleware for Socket.IO connection authentication.
 * This runs on every new socket connection attempt.
 */
export const socketAuthMiddleware = async (socket, next) => {
  // Token is sent from the client in the `auth` object during connection
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found.'));
    }

    // Attach user to the socket object for use in event handlers
    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket authentication failed:', err.message);
    return next(new Error('Authentication error: Invalid token.'));
  }
};

/**
 * Generates a new JWT for a given user ID.
 */
export const generateToken = (userId, username) => {
  return jwt.sign(
    { userId, username }, // Include username for easier debugging and logging
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};