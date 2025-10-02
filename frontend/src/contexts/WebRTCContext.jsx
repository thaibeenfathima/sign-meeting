import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const WebRTCContext = createContext();

// WebRTC configuration
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

// WebRTC reducer
const webrtcReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOCAL_STREAM':
      return { ...state, localStream: action.payload };
    case 'ADD_REMOTE_STREAM':
      return {
        ...state,
        remoteStreams: {
          ...state.remoteStreams,
          [action.payload.userId]: action.payload.stream
        }
      };
    case 'REMOVE_REMOTE_STREAM':
      const newRemoteStreams = { ...state.remoteStreams };
      delete newRemoteStreams[action.payload];
      return { ...state, remoteStreams: newRemoteStreams };
    case 'SET_VIDEO_ENABLED':
      return { ...state, videoEnabled: action.payload };
    case 'SET_AUDIO_ENABLED':
      return { ...state, audioEnabled: action.payload };
    case 'SET_SCREEN_SHARING':
      return { ...state, screenSharing: action.payload };
    case 'SET_CONNECTION_STATE':
      return {
        ...state,
        connectionStates: {
          ...state.connectionStates,
          [action.payload.userId]: action.payload.state
        }
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  localStream: null,
  remoteStreams: {},
  connectionStates: {},
  videoEnabled: true,
  audioEnabled: true,
  screenSharing: false,
  error: null
};

export const WebRTCProvider = ({ children }) => {
  const [state, dispatch] = useReducer(webrtcReducer, initialState);
  const { user } = useAuth();
  const { socket, currentRoom, participants, sendOffer, sendAnswer, sendIceCandidate, sendAudioData } = useSocket();

  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);

  // Main effect to initialize and clean up media and listeners
  useEffect(() => {
    const initialize = async () => {
      await initializeMedia();
    };
    initialize();

    return () => {
      cleanup();
    };
  }, []);
  
  // Effect for handling socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleOffer = async ({ offer, fromUserId }) => {
      console.log('Received offer from:', fromUserId);
      
      // Close existing connection if it exists to avoid state conflicts
      if (peerConnectionsRef.current[fromUserId]) {
        peerConnectionsRef.current[fromUserId].close();
        delete peerConnectionsRef.current[fromUserId];
      }
      
      const peerConnection = createPeerConnection(fromUserId);
      
      try {
        // Check if we can set remote description
        if (peerConnection.signalingState === 'stable' || peerConnection.signalingState === 'have-local-offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          if (currentRoom) {
            sendAnswer(currentRoom.roomId, answer, fromUserId);
          }
        } else {
          console.warn('Cannot handle offer in current signaling state:', peerConnection.signalingState);
        }
      } catch (error) {
        console.error('Failed to handle offer:', error);
        // Recreate connection on error
        if (peerConnectionsRef.current[fromUserId]) {
          peerConnectionsRef.current[fromUserId].close();
          delete peerConnectionsRef.current[fromUserId];
        }
      }
    };

    const handleAnswer = async ({ answer, fromUserId }) => {
      const peerConnection = peerConnectionsRef.current[fromUserId];
      if (peerConnection) {
        try {
          // Check if we're in the right state to receive an answer
          if (peerConnection.signalingState === 'have-local-offer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Successfully set remote answer for:', fromUserId);
          } else {
            console.warn('Cannot handle answer in current signaling state:', peerConnection.signalingState);
          }
        } catch (error) {
          console.error('Failed to handle answer:', error);
          // Reset connection on error
          if (peerConnectionsRef.current[fromUserId]) {
            peerConnectionsRef.current[fromUserId].close();
            delete peerConnectionsRef.current[fromUserId];
          }
        }
      }
    };
    
    const handleIceCandidate = async ({ candidate, fromUserId }) => {
      const peerConnection = peerConnectionsRef.current[fromUserId];
      if (peerConnection && candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Failed to add ICE candidate:', error);
        }
      }
    };

    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
    };
  }, [socket, currentRoom, sendAnswer]);

  // Handle participant changes to create/destroy peer connections
  useEffect(() => {
    if (currentRoom && user) {
      const currentPeerIds = Object.keys(peerConnectionsRef.current);
      const participantIds = participants.map(p => p._id).filter(id => id !== user._id);

      // Connect to new participants
      for (const pId of participantIds) {
        if (!currentPeerIds.includes(pId)) {
          console.log(`New participant found: ${pId}. Creating peer connection.`);
          const peerConnection = createPeerConnection(pId);
          // The initiator will send the offer
          if (peerConnection) {
             handleNegotiationNeeded(peerConnection, pId);
          }
        }
      }

      // Disconnect from left participants
      for (const peerId of currentPeerIds) {
        if (!participantIds.includes(peerId)) {
          console.log(`Participant left: ${peerId}. Closing peer connection.`);
          closePeerConnection(peerId);
        }
      }
    }
  }, [participants, currentRoom, user]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      localStreamRef.current = stream;
      dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
      setupAudioProcessing(stream);
    } catch (error) {
      console.error('Failed to get user media:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to access camera/microphone.' });
    }
  };

  const setupAudioProcessing = async (stream) => {
    if (!stream.getAudioTracks().length) {
      console.warn("No audio tracks found in stream to process.");
      return;
    }
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = context;
      await context.audioWorklet.addModule('/audio-processor.js');
      const source = context.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(context, 'audio-processor');
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event) => {
        if (!state.audioEnabled || !currentRoom) return;
        
        const pcmData = event.data;
        const audioBlob = new Blob([pcmData.buffer], { type: 'audio/webm' }); // Sending raw buffer
        sendAudioData(currentRoom.roomId, audioBlob);
      };

      source.connect(workletNode);
      // We don't connect the worklet to the destination, to avoid hearing ourselves.
    } catch (error) {
      console.error('Failed to setup Audio Worklet:', error);
    }
  };

  const createPeerConnection = (userId) => {
    if (peerConnectionsRef.current[userId]) {
        return peerConnectionsRef.current[userId];
    }
    try {
      const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      localStreamRef.current?.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

      peerConnection.ontrack = (event) => {
        console.log('Received remote stream from:', userId);
        dispatch({ type: 'ADD_REMOTE_STREAM', payload: { userId, stream: event.streams[0] } });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && currentRoom) {
          sendIceCandidate(currentRoom.roomId, event.candidate, userId);
        }
      };
      
      peerConnection.onnegotiationneeded = () => handleNegotiationNeeded(peerConnection, userId);

      peerConnection.onconnectionstatechange = () => {
        dispatch({ type: 'SET_CONNECTION_STATE', payload: { userId, state: peerConnection.connectionState } });
        if (peerConnection.connectionState === 'failed') {
          peerConnection.restartIce();
        }
      };

      peerConnectionsRef.current[userId] = peerConnection;
      return peerConnection;
    } catch (error) {
      console.error(`Failed to create peer connection for ${userId}:`, error);
      return null;
    }
  };
  
  const handleNegotiationNeeded = async (peerConnection, userId) => {
    try {
        // Only create offer if we're in stable state
        if (peerConnection.signalingState === 'stable') {
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await peerConnection.setLocalDescription(offer);
            if (currentRoom) {
                sendOffer(currentRoom.roomId, offer, userId);
            }
        } else {
            console.log('Skipping negotiation - not in stable state:', peerConnection.signalingState);
        }
    } catch(error) {
        console.error("Negotiation needed error:", error);
    }
  }

  const closePeerConnection = (userId) => {
    const peerConnection = peerConnectionsRef.current[userId];
    if (peerConnection) {
      peerConnection.close();
      delete peerConnectionsRef.current[userId];
      dispatch({ type: 'REMOVE_REMOTE_STREAM', payload: userId });
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !state.videoEnabled;
      dispatch({ type: 'SET_VIDEO_ENABLED', payload: !state.videoEnabled });
    }
  };

  const toggleAudio = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !state.audioEnabled;
      dispatch({ type: 'SET_AUDIO_ENABLED', payload: !state.audioEnabled });
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      
      Object.values(peerConnectionsRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });
      
      screenTrack.onended = () => stopScreenShare();
      dispatch({ type: 'SET_SCREEN_SHARING', payload: true });
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
    }
  };

  const stopScreenShare = () => {
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (cameraTrack) {
      Object.values(peerConnectionsRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      });
    }
    dispatch({ type: 'SET_SCREEN_SHARING', payload: false });
  };
  
  const cleanup = () => {
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    
    workletNodeRef.current?.port.close();
    workletNodeRef.current?.disconnect();
    audioContextRef.current?.close();
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    localStream: state.localStream,
    remoteStreams: state.remoteStreams,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    clearError
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};