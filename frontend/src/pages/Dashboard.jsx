import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout, updatePreferences } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  // Load user's rooms on component mount
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/rooms/user/my-rooms');
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Multilingual Video Call
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Demo Mode Toggle */}
              <button
                onClick={() => {
                  const isDemoMode = localStorage.getItem('demoMode') === 'true';
                  if (isDemoMode) {
                    localStorage.removeItem('demoMode');
                    localStorage.removeItem('demoLanguage');
                    localStorage.removeItem('demoDeafMode');
                    window.location.reload();
                  } else {
                    localStorage.setItem('demoMode', 'true');
                    navigate('/room/demo123');
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  localStorage.getItem('demoMode') === 'true'
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
                title={localStorage.getItem('demoMode') === 'true' ? 'Exit Demo Mode' : 'Enter Demo Mode'}
              >
                {localStorage.getItem('demoMode') === 'true' ? '🚫 Demo' : '🎮 Demo'}
              </button>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.profile?.firstName || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.preferences?.language?.toUpperCase() || 'EN'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(user?.profile?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2"
                title="Logout"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.profile?.firstName || user?.username}!
          </h2>
          <p className="text-gray-600">
            Start a video call with real-time translation and sign language support.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create Room Card */}
          <div className="room-card group hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Room</h3>
                <p className="text-sm text-gray-600">Start a new video call</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="w-full btn-primary group-hover:bg-primary-700"
            >
              Create New Room
            </button>
          </div>

          {/* Join Room Card */}
          <div className="room-card group hover:shadow-xl transition-all duration-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Join Room</h3>
                <p className="text-sm text-gray-600">Enter an existing room</p>
              </div>
            </div>
            <button
              onClick={() => setShowJoinRoom(true)}
              className="w-full btn-secondary group-hover:bg-gray-300"
            >
              Join Existing Room
            </button>
          </div>
        </div>

        {/* User Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
          <UserPreferences />
        </div>

        {/* Recent Rooms */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Rooms</h3>
            <button
              onClick={loadRooms}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadRooms}
                className="btn-primary mt-4"
              >
                Try Again
              </button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-600">No rooms yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first room to get started</p>
            </div>
          ) : (
            <RoomList rooms={rooms} onRoomSelect={(roomId) => navigate(`/room/${roomId}`)} />
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onRoomCreated={(roomId) => {
            setShowCreateRoom(false);
            navigate(`/room/${roomId}`);
          }}
        />
      )}

      {showJoinRoom && (
        <JoinRoomModal
          onClose={() => setShowJoinRoom(false)}
          onRoomJoined={(roomId) => {
            setShowJoinRoom(false);
            navigate(`/room/${roomId}`);
          }}
        />
      )}
    </div>
  );
};

// User Preferences Component
const UserPreferences = () => {
  const { user, updatePreferences } = useAuth();
  const [preferences, setPreferences] = useState({
    language: user?.preferences?.language || 'en',
    deafMode: user?.preferences?.deafMode || false,
    avatarStyle: user?.preferences?.avatarStyle || 'default'
  });

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ar', name: 'Arabic' }
  ];

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await updatePreferences(newPreferences);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Language Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Language
        </label>
        <select
          value={preferences.language}
          onChange={(e) => handlePreferenceChange('language', e.target.value)}
          className="form-input"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Deaf Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sign Language Avatar
        </label>
        <div className="flex items-center">
          <button
            onClick={() => handlePreferenceChange('deafMode', !preferences.deafMode)}
            className={`toggle-switch ${preferences.deafMode ? 'active' : ''}`}
          />
          <span className="ml-3 text-sm text-gray-600">
            {preferences.deafMode ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Avatar Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Avatar Style
        </label>
        <select
          value={preferences.avatarStyle}
          onChange={(e) => handlePreferenceChange('avatarStyle', e.target.value)}
          className="form-input"
        >
          <option value="default">Default</option>
          <option value="animated">Animated</option>
          <option value="realistic">Realistic</option>
        </select>
      </div>
    </div>
  );
};

// Room List Component
const RoomList = ({ rooms, onRoomSelect }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'ended': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-3">
      {rooms.map(room => (
        <div
          key={room._id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => onRoomSelect(room.roomId)}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h4 className="font-medium text-gray-900">{room.name}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status)}`}>
                {room.status}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              <span>Room ID: {room.roomId}</span>
              <span className="mx-2">•</span>
              <span>Created: {formatDate(room.createdAt)}</span>
              {room.activeParticipantsCount > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span>{room.activeParticipantsCount} participants</span>
                </>
              )}
            </div>
          </div>
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      ))}
    </div>
  );
};

// Create Room Modal Component
const CreateRoomModal = ({ onClose, onRoomCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxParticipants: 10,
    isPrivate: false,
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/rooms/create', formData);
      onRoomCreated(response.data.room.roomId);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create New Room</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="error-message">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter room name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Room description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
            <select
              className="form-input"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
            >
              {[2, 5, 10, 20, 50].map(num => (
                <option key={num} value={num}>{num} participants</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">Private room (requires password)</label>
          </div>

          {formData.isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter room password"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 btn-primary">
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Join Room Modal Component
const JoinRoomModal = ({ onClose, onRoomJoined }) => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Clean and validate room ID
      const cleanRoomId = roomId.trim().replace(/\s+/g, '');
      if (!cleanRoomId) {
        setError('Please enter a valid room ID');
        setIsLoading(false);
        return;
      }

      await axios.post(`/rooms/join/${encodeURIComponent(cleanRoomId)}`, { password });
      onRoomJoined(cleanRoomId);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Join Room</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="error-message">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
            <input
              type="text"
              required
              className="form-input"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter room ID (e.g., ABC12345)"
              maxLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (if required)</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 btn-primary">
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
