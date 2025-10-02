import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // --- FIX #1: MANAGE THE TOKEN IN REACT STATE ---
  // We initialize it from localStorage.
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This effect sets the auth header and checks for a valid token on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      // Check for demo mode - only enable if explicitly requested
      const isDemoMode = localStorage.getItem('demoMode') === 'true';
      const isRoomPath = window.location.pathname.includes('/room/');
      
      if (isDemoMode && isRoomPath) {
        // Enable demo mode for testing
        const demoUser = {
          id: 'demo-user',
          username: 'Demo User',
          email: 'demo@example.com',
          preferences: {
            language: localStorage.getItem('demoLanguage') || 'en',
            deafMode: localStorage.getItem('demoDeafMode') === 'true'
          }
        };
        setUser(demoUser);
        setToken('demo-token');
        setLoading(false);
        return;
      } else if (isRoomPath && !storedToken) {
        // If accessing room without token, redirect to login
        window.location.href = '/login';
        return;
      }
      
      if (storedToken) {
        // --- FIX #2: SET TOKEN IN STATE AND AXIOS HEADER ---
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          const response = await axios.get('/auth/me');
          setUser(response.data.user);
        } catch (err) {
          // Handle invalid/expired token
          console.error('Auth check failed, logging out.', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []); // Run only once on initial load

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data;

      // --- FIX #3: UPDATE BOTH TOKEN AND USER STATE ---
      localStorage.setItem('token', authToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      setToken(authToken);
      setUser(userData);
      setLoading(false);
      return { success: true, user: userData };

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed, but logging out locally anyway.', err);
    } finally {
      // Clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('demoMode');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    }
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      if (localStorage.getItem('demoMode') === 'true') {
        // Demo mode - update local state and localStorage only
        const updatedUser = {
          ...user,
          preferences: { ...user.preferences, ...preferences }
        };
        setUser(updatedUser);
        
        // Store in localStorage for persistence
        if (preferences.language) localStorage.setItem('demoLanguage', preferences.language);
        if (preferences.deafMode !== undefined) localStorage.setItem('demoDeafMode', preferences.deafMode.toString());
        
        return { success: true };
      }
      
      // Real mode - make API call
      const response = await axios.put('/users/preferences', preferences);
      setUser(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...preferences }
      }));
      return { success: true };
    } catch (err) {
      console.error('Failed to update preferences:', err);
      return { success: false, error: err.message };
    }
  };
  
  // Register function (similar to login)
  const register = async (userData) => {
    try {
        setLoading(true);
        setError(null);
        const response = await axios.post('/auth/register', userData);
        const { user: newUser, token: authToken } = response.data;

        localStorage.setItem('token', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        setToken(authToken);
        setUser(newUser);
        setLoading(false);
        return { success: true, user: newUser };
    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Registration failed';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    token, // --- FIX #4: PROVIDE THE TOKEN TO THE REST OF THE APP ---
    loading,
    error,
    login,
    register,
    logout,
    updatePreferences,
    clearError,
  }), [user, token, loading, error]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};