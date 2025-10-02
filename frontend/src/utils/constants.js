// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// WebRTC Configuration
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
];

// Room Settings
export const ROOM_SETTINGS = {
  MAX_PARTICIPANTS: {
    FREE: 10,
    PREMIUM: 50
  },
  DEFAULT_ROOM_NAME: 'Video Call Room',
  ROOM_ID_LENGTH: 8
};

// Media Constraints
export const MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100
  }
};

// Feature Flags
export const FEATURES = {
  SIGN_LANGUAGE: import.meta.env.VITE_ENABLE_SIGN_LANGUAGE === 'true',
  TRANSLATION: import.meta.env.VITE_ENABLE_TRANSLATION === 'true',
  SCREEN_SHARE: import.meta.env.VITE_ENABLE_SCREEN_SHARE === 'true',
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  AUTH_FAILED: 'Authentication failed. Please log in again.',
  ROOM_NOT_FOUND: 'Room not found. Please check the room ID.',
  ROOM_FULL: 'Room is full. Maximum participants reached.',
  MEDIA_ACCESS_DENIED: 'Camera/microphone access denied. Please allow permissions.',
  WEBRTC_NOT_SUPPORTED: 'Your browser does not support video calling.',
  TRANSLATION_FAILED: 'Translation service unavailable. Please try again later.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  REGISTER_SUCCESS: 'Account created successfully!',
  ROOM_CREATED: 'Room created successfully!',
  ROOM_JOINED: 'Joined room successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth_error',
  
  // Room Management
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  
  // Communication
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  AUDIO_DATA: 'audio_data',
  NEW_SUBTITLE: 'new_subtitle',
  
  // WebRTC Signaling
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  
  // Errors
  ERROR: 'error'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  ROOM_HISTORY: 'room_history',
  AVATAR_POSITION: 'avatar_position'
};
