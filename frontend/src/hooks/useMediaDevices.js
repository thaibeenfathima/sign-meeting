import { useState, useEffect, useCallback } from 'react';
import { MEDIA_CONSTRAINTS } from '../utils/constants';

/**
 * Custom hook for managing media devices (camera/microphone)
 * @returns {Object} Media devices state and controls
 */
export const useMediaDevices = () => {
  const [devices, setDevices] = useState({
    videoInputs: [],
    audioInputs: [],
    audioOutputs: []
  });
  const [selectedDevices, setSelectedDevices] = useState({
    videoInput: '',
    audioInput: '',
    audioOutput: ''
  });
  const [permissions, setPermissions] = useState({
    camera: 'prompt',
    microphone: 'prompt'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get available media devices
  const getDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request permissions first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Stop the stream immediately - we just needed permissions
      stream.getTracks().forEach(track => track.stop());

      // Now get the device list
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = deviceList.filter(device => device.kind === 'videoinput');
      const audioInputs = deviceList.filter(device => device.kind === 'audioinput');
      const audioOutputs = deviceList.filter(device => device.kind === 'audiooutput');

      setDevices({
        videoInputs,
        audioInputs,
        audioOutputs
      });

      // Set default devices if not already selected
      setSelectedDevices(prev => ({
        videoInput: prev.videoInput || (videoInputs[0]?.deviceId || ''),
        audioInput: prev.audioInput || (audioInputs[0]?.deviceId || ''),
        audioOutput: prev.audioOutput || (audioOutputs[0]?.deviceId || '')
      }));

      setPermissions({
        camera: 'granted',
        microphone: 'granted'
      });

    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError(error.message);
      
      // Check specific permission errors
      if (error.name === 'NotAllowedError') {
        setPermissions({
          camera: 'denied',
          microphone: 'denied'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get user media with selected devices
  const getUserMedia = useCallback(async (constraints = {}) => {
    try {
      const mediaConstraints = {
        video: constraints.video !== false ? {
          ...MEDIA_CONSTRAINTS.video,
          deviceId: selectedDevices.videoInput ? { exact: selectedDevices.videoInput } : undefined,
          ...constraints.video
        } : false,
        audio: constraints.audio !== false ? {
          ...MEDIA_CONSTRAINTS.audio,
          deviceId: selectedDevices.audioInput ? { exact: selectedDevices.audioInput } : undefined,
          ...constraints.audio
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }, [selectedDevices]);

  // Switch camera (front/back on mobile)
  const switchCamera = useCallback(async () => {
    const videoInputs = devices.videoInputs;
    if (videoInputs.length < 2) return null;

    const currentIndex = videoInputs.findIndex(
      device => device.deviceId === selectedDevices.videoInput
    );
    const nextIndex = (currentIndex + 1) % videoInputs.length;
    const nextDevice = videoInputs[nextIndex];

    setSelectedDevices(prev => ({
      ...prev,
      videoInput: nextDevice.deviceId
    }));

    return nextDevice;
  }, [devices.videoInputs, selectedDevices.videoInput]);

  // Check if device supports media
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      await getDevices();
      return true;
    } catch (error) {
      return false;
    }
  }, [getDevices]);

  // Update selected device
  const selectDevice = useCallback((type, deviceId) => {
    setSelectedDevices(prev => ({
      ...prev,
      [type]: deviceId
    }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (isSupported()) {
      getDevices();
    } else {
      setError('Media devices not supported in this browser');
      setIsLoading(false);
    }

    // Listen for device changes
    const handleDeviceChange = () => {
      getDevices();
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [getDevices, isSupported]);

  return {
    devices,
    selectedDevices,
    permissions,
    isLoading,
    error,
    getUserMedia,
    switchCamera,
    selectDevice,
    requestPermissions,
    isSupported: isSupported(),
    refresh: getDevices
  };
};

export default useMediaDevices;
