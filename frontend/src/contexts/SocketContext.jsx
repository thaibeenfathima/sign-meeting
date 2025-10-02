import React, { createContext, useContext, useEffect, useReducer, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const socketReducer = (state, action) => {
  // ... (reducer logic is correct and remains the same)
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'SET_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'ADD_PARTICIPANT':
      if (state.participants.some(p => p._id === action.payload._id)) {
        return state;
      }
      return { ...state, participants: [...state.participants, action.payload] };
    case 'REMOVE_PARTICIPANT':
      return { ...state, participants: state.participants.filter(p => p._id !== action.payload) };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'ADD_SUBTITLE':
      return { ...state, subtitles: [...state.subtitles.slice(-10), action.payload] };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'CLEAR_ROOM_STATE':
        return { ...state, currentRoom: null, participants: [], messages: [], subtitles: [] };
    case 'UPDATE_PARTICIPANT_PREFERENCES':
      return {
        ...state,
        participants: state.participants.map(participant =>
          participant._id === action.payload.userId
            ? { ...participant, preferences: { ...participant.preferences, ...action.payload.preferences } }
            : participant
        )
      };
    default:
      return state;
  }
};

const initialState = {
  connected: false,
  currentRoom: null,
  participants: [],
  messages: [],
  subtitles: [],
  error: null
};

export const SocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && token && !localStorage.getItem('demoMode')) {
      // Don't create new socket if one already exists and is connected
      if (socketRef.current?.connected) {
        return;
      }

      // Clean up existing socket before creating new one
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        forceNew: false, // Don't force new connection if existing one works
        autoConnect: true
      });
      socketRef.current = newSocket;

      // Event listeners with better error handling
      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        dispatch({ type: 'SET_CONNECTED', payload: false });
      });
      
      newSocket.on('connect_error', (error) => {
        console.log('Socket connection error:', error);
        dispatch({ type: 'SET_CONNECTED', payload: false });
        // Don't set error immediately to prevent loops, let it retry first
        setTimeout(() => {
          if (!newSocket.connected) {
            dispatch({ type: 'SET_ERROR', payload: 'Connection failed. Working in offline mode.' });
          }
        }, 5000);
      });
      
      newSocket.on('room_joined', (data) => {
        dispatch({ type: 'SET_ROOM', payload: data.room });
        dispatch({ type: 'SET_PARTICIPANTS', payload: data.participants || [] });
      });
      
      newSocket.on('error', (data) => {
        console.log('Socket error:', data);
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Connection error' });
      });
      
      newSocket.on('user_joined', (data) => dispatch({ type: 'ADD_PARTICIPANT', payload: data.user }));
      newSocket.on('user_left', (data) => dispatch({ type: 'REMOVE_PARTICIPANT', payload: data.userId }));
      
      // Add subtitle and message handlers
      newSocket.on('new_message', (data) => dispatch({ type: 'ADD_MESSAGE', payload: data.message }));
      newSocket.on('new_subtitle', (data) => dispatch({ type: 'ADD_SUBTITLE', payload: data }));
      
      // Handle preference updates from other participants
      newSocket.on('user_preferences_updated', (data) => {
        dispatch({ type: 'UPDATE_PARTICIPANT_PREFERENCES', payload: data });
      });
      
      return () => {
        newSocket.disconnect();
        dispatch({ type: 'SET_CONNECTED', payload: false });
      };
    } else {
      // Demo mode or no user - ensure clean state
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      dispatch({ type: 'SET_CONNECTED', payload: false });
      
      // Only clear room state if we're not in demo mode
      if (!localStorage.getItem('demoMode')) {
        dispatch({ type: 'CLEAR_ROOM_STATE' });
      }
    }
  }, [user, token]);

  // --- Functions to emit events to the server (memoized to prevent re-renders) ---
  const joinRoom = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { roomId });
    }
  }, []);

  const leaveRoom = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', { roomId });
      dispatch({ type: 'CLEAR_ROOM_STATE' });
    }
  }, []);
  
  const sendMessage = useCallback((roomId, message) => {
      if (socketRef.current?.connected) {
          socketRef.current.emit('send_message', { roomId, message });
      }
  }, []);

  // --- FIX #1: CREATE THE sendAudioData FUNCTION ---
  const sendAudioData = useCallback((roomId, audioBlob) => {
    if (socketRef.current?.connected) {
        // This emits the 'audio_data' event that our backend is listening for.
        socketRef.current.emit('audio_data', { roomId, audioBlob });
    }
  }, []);

  // WebRTC signaling functions
  const sendOffer = useCallback((roomId, offer, targetUserId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('webrtc_offer', { roomId, offer, targetUserId });
    }
  }, []);

  const sendAnswer = useCallback((roomId, answer, targetUserId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('webrtc_answer', { roomId, answer, targetUserId });
    }
  }, []);

  const sendIceCandidate = useCallback((roomId, candidate, targetUserId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('webrtc_ice_candidate', { roomId, candidate, targetUserId });
    }
  }, []);

  // Broadcast user preference changes to room participants
  const broadcastPreferences = useCallback((roomId, preferences) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user_preferences_updated', { roomId, preferences });
    }
  }, []);

  const value = {
    ...state,
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendAudioData, // --- FIX #2: ADD THE FUNCTION TO THE CONTEXT VALUE ---
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    broadcastPreferences
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within an AuthProvider');
  }
  return context;
};