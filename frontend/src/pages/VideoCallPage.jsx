import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useWebRTC } from '../contexts/WebRTCContext';
import SignLanguageAvatar from '../components/SignLanguageAvatar';
import { TranslationPipeline, processSubtitle, getLanguageName } from '../utils/translationService';

const VideoCallPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user, updatePreferences } = useAuth(); // Assuming updatePreferences exists in AuthContext
    
    // --- THIS IS THE FIX ---
    // Added `connected` back to the list.
    const { 
        currentRoom, 
        participants, 
        messages, 
        subtitles, 
        joinRoom, 
        leaveRoom, 
        sendMessage,
        connected,
        broadcastPreferences 
    } = useSocket();
    // --- END OF FIX ---

    const {
        localStream,
        remoteStreams,
        videoEnabled,
        audioEnabled,
        screenSharing,
        toggleVideo,
        toggleAudio,
        startScreenShare,
        stopScreenShare
    } = useWebRTC();

    const [showSettings, setShowSettings] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [currentSubtitle, setCurrentSubtitle] = useState('');
    const [lastSubtitle, setLastSubtitle] = useState('Welcome to the video call');
    const [isLoading, setIsLoading] = useState(true);
    const [roomReady, setRoomReady] = useState(false);
    const [translationPipeline] = useState(() => new TranslationPipeline(user?.preferences?.language || 'en'));
    const [isTranslating, setIsTranslating] = useState(false);
    const [showSignLanguageAvatar, setShowSignLanguageAvatar] = useState(false);
    
    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});

    useEffect(() => {
        // Initialize room with smooth loading - only run once per roomId
        const initializeRoom = async () => {
            if (!roomId || roomReady) return; // Prevent re-initialization
            
            setIsLoading(true);
            
            const isDemoMode = localStorage.getItem('demoMode') === 'true';
            
            if (isDemoMode || !connected) {
                // Demo mode - quick initialization
                console.log('Working in offline demo mode');
                setTimeout(() => {
                    setRoomReady(true);
                    setIsLoading(false);
                }, 800);
            } else {
                // Real mode - try to join room
                try {
                    joinRoom(roomId);
                    // Wait for room to be joined
                    setTimeout(() => {
                        setRoomReady(true);
                        setIsLoading(false);
                    }, 1500);
                } catch (error) {
                    console.error('Failed to join room:', error);
                    setIsLoading(false);
                }
            }
        };

        // Only initialize if we have a roomId and haven't initialized yet
        if (roomId && !roomReady) {
            initializeRoom();
        }
        
        return () => {
            if (currentRoom && connected && !localStorage.getItem('demoMode')) {
                leaveRoom(currentRoom.roomId);
            }
        };
    }, [roomId]); // Only depend on roomId to prevent re-initialization

    // Real-time translation and subtitle effect
    useEffect(() => {
        const demoSubtitles = [
            "Hello, how are you?",
            "I am fine, thank you", 
            "What is your name?",
            "Nice to meet you",
            "வணக்கம், எப்படி இருக்கீங்க?",
            "நான் நல்லா இருக்கேன்",
            "Thank you very much",
            "Good morning everyone"
        ];

        let index = 0;
        const interval = setInterval(() => {
            const originalText = demoSubtitles[index];
            
            // Process subtitle with translation
            setIsTranslating(true);
            setTimeout(() => {
                const processed = processSubtitle(originalText, user?.preferences?.language || 'en');
                setCurrentSubtitle(processed.translated);
                setLastSubtitle(processed.translated); // Keep for sign language avatar
                setIsTranslating(false);
                
                // Clear subtitle after showing for 3 seconds (but keep lastSubtitle)
                setTimeout(() => {
                    setCurrentSubtitle('');
                }, 3000);
            }, 500);
            
            index = (index + 1) % demoSubtitles.length;
        }, 6000);

        return () => clearInterval(interval);
    }, [user?.preferences?.language]);

    // Effect to handle deaf mode changes during the meeting
    useEffect(() => {
        if (user?.preferences?.deafMode) {
            console.log('Deaf mode enabled - Sign language avatar should appear');
            setShowSignLanguageAvatar(true);
            // Force a re-render to ensure avatar appears immediately
            setLastSubtitle(prev => prev || 'Sign language mode enabled');
        } else {
            console.log('Deaf mode disabled - Sign language avatar should hide');
            setShowSignLanguageAvatar(false);
        }
    }, [user?.preferences?.deafMode]);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        Object.entries(remoteStreams).forEach(([userId, stream]) => {
            const videoElement = remoteVideoRefs.current[userId];
            if (videoElement && stream) {
                videoElement.srcObject = stream;
            }
        });
    }, [remoteStreams]);
    
    const handleLeaveRoom = () => {
        if (currentRoom) {
            leaveRoom(currentRoom.roomId);
        }
        navigate('/dashboard');
    };

    // Show enhanced loading screen while initializing
    if (isLoading || !roomReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center text-white animate-fade-in">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2 animate-pulse">Joining Room</h2>
                    <p className="text-gray-300 mb-4">Room ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{roomId}</span></p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>Setting up video call...</span>
                    </div>
                    {!connected && (
                        <div className="mt-4 text-yellow-400 text-sm animate-bounce">
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span>Working in offline demo mode</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const remoteParticipants = participants?.filter(p => p._id !== user?._id) || [];

    return (
        <div className="h-screen bg-gray-900 flex flex-col text-white relative animate-fade-in">
            <header className="bg-gray-800 px-6 py-3 flex justify-between items-center z-10">
                <div>
                    <h1 className="text-lg font-semibold">{currentRoom?.name || `Room ${roomId}`}</h1>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm">{participants?.length || 1} participants</span>
                        <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                            <span className="text-xs text-gray-300">
                                {connected ? 'Connected' : 'Demo Mode'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex">
                    {/* Video Area */}
                    <div className="flex-1 relative p-4 grid gap-4 grid-cols-1 md:grid-cols-2">
                        {/* Local Video */}
                        <div className="relative bg-black rounded-lg overflow-hidden min-h-[300px]">
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover"
                                onLoadedMetadata={() => console.log('Local video loaded')}
                                onError={(e) => console.error('Local video error:', e)}
                            />
                            {!localStream && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                    <div className="text-center text-white">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-sm">Camera starting...</p>
                                        <p className="text-xs text-gray-400 mt-1">Please allow camera access</p>
                                        <button 
                                            onClick={() => {
                                                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                                                    .then(stream => {
                                                        if (localVideoRef.current) {
                                                            localVideoRef.current.srcObject = stream;
                                                        }
                                                    })
                                                    .catch(err => console.error('Camera error:', err));
                                            }}
                                            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                        >
                                            Enable Camera
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-white">
                                You ({user?.username})
                                {localStream && <span className="ml-2 text-green-400">🔴 Live</span>}
                            </div>
                            
                            {/* Enhanced Subtitle Display with Translation Status */}
                            {(currentSubtitle || isTranslating) && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-center animate-slide-in-up">
                                    {isTranslating ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-blue-300 text-sm">Translating...</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-sm font-medium mb-1">{currentSubtitle}</div>
                                            <div className="text-xs opacity-75 flex items-center justify-center space-x-2">
                                                <span>Auto-translated to {getLanguageName(user?.preferences?.language || 'en')}</span>
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Remote Videos */}
                        {remoteParticipants.map(participant => (
                            <div key={participant._id} className="relative bg-black rounded-lg overflow-hidden min-h-[300px]"> 
                                <video
                                    ref={el => (remoteVideoRefs.current[participant._id] = el)}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-white">
                                    {participant.username}
                                </div>
                            </div>
                        ))}
                        
                        {/* Show placeholder if no remote participants */}
                        {remoteParticipants.length === 0 && (
                            <div className="relative bg-gray-800 rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center">
                                <div className="text-center text-gray-400 space-y-4">
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-lg font-medium text-white">Waiting for participants...</p>
                                    
                                    <div className="space-y-3">
                                        <p className="text-sm">Room ID:</p>
                                        <div className="flex items-center justify-center space-x-2">
                                            <span className="font-mono bg-gray-700 px-3 py-2 rounded text-lg text-white">{roomId}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(roomId);
                                                    const toast = document.createElement('div');
                                                    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in';
                                                    toast.textContent = 'Room ID copied!';
                                                    document.body.appendChild(toast);
                                                    setTimeout(() => document.body.removeChild(toast), 2000);
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors text-white"
                                                title="Copy Room ID"
                                            >
                                                📋 Copy
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    const shareUrl = `${window.location.origin}/room/${roomId}`;
                                                    navigator.clipboard.writeText(shareUrl);
                                                    const toast = document.createElement('div');
                                                    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in';
                                                    toast.textContent = 'Room link copied!';
                                                    document.body.appendChild(toast);
                                                    setTimeout(() => document.body.removeChild(toast), 2000);
                                                }}
                                                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs transition-colors text-white"
                                            >
                                                🔗 Copy Link
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const shareUrl = `${window.location.origin}/room/${roomId}`;
                                                    if (navigator.share) {
                                                        navigator.share({
                                                            title: 'Join my video call',
                                                            text: `Join my multilingual video call room: ${roomId}`,
                                                            url: shareUrl
                                                        });
                                                    } else {
                                                        navigator.clipboard.writeText(`Join my video call: ${shareUrl}`);
                                                        const toast = document.createElement('div');
                                                        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in';
                                                        toast.textContent = 'Share text copied!';
                                                        document.body.appendChild(toast);
                                                        setTimeout(() => document.body.removeChild(toast), 2000);
                                                    }
                                                }}
                                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs transition-colors text-white"
                                            >
                                                📤 Share
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Chat Panel */}
                    {showChat && (
                        <div className="w-80 bg-white border-l border-gray-200 flex flex-col animate-slide-in-right">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Chat</h3>
                                <button 
                                    onClick={() => setShowChat(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No messages yet</p>
                                        <p className="text-sm">Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((message, index) => (
                                        <div key={index} className={`p-3 rounded-lg max-w-xs ${
                                            message.sender._id === user?.id 
                                                ? 'bg-blue-600 text-white ml-auto' 
                                                : 'bg-gray-100 text-gray-900'
                                        }`}>
                                            <div className="text-xs opacity-75 mb-1">
                                                {message.sender.username} • {new Date(message.createdAt).toLocaleTimeString()}
                                            </div>
                                            <div className="text-sm">
                                                {message.content.original.text}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <div className="p-4 border-t border-gray-200">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (chatMessage.trim() && currentRoom) {
                                        sendMessage(currentRoom.roomId, chatMessage.trim());
                                        setChatMessage('');
                                    }
                                }} className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!chatMessage.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="bg-gray-800 px-6 py-4 flex justify-center items-center space-x-4 z-10">
                {/* Control Buttons */}
                <button 
                    onClick={toggleAudio} 
                    title={audioEnabled ? 'Mute' : 'Unmute'} 
                    className={`p-3 rounded-full text-white transition-colors ${audioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    {audioEnabled ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    )}
                </button>
                
                <button 
                    onClick={toggleVideo} 
                    title={videoEnabled ? 'Stop Video' : 'Start Video'} 
                    className={`p-3 rounded-full text-white transition-colors ${videoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    {videoEnabled ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                    )}
                </button>
                
                <button 
                    onClick={screenSharing ? stopScreenShare : startScreenShare} 
                    title={screenSharing ? 'Stop Sharing' : 'Share Screen'} 
                    className={`p-3 rounded-full text-white transition-colors ${screenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </button>
                
                <button 
                    onClick={() => setShowChat(!showChat)} 
                    title="Toggle Chat" 
                    className={`p-3 rounded-full text-white transition-colors ${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a9.863 9.863 0 01-4.906-1.289l-3.637 1.212a.75.75 0 01-.92-.921l1.213-3.636A9.863 9.863 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                </button>
                
                {/* Sign Language Toggle Button */}
                {user?.preferences?.deafMode && (
                    <button 
                        onClick={() => {
                            setShowSignLanguageAvatar(!showSignLanguageAvatar);
                            console.log('Sign language avatar toggled:', !showSignLanguageAvatar);
                        }} 
                        title={showSignLanguageAvatar ? 'Hide Sign Language' : 'Show Sign Language'} 
                        className={`p-3 rounded-full text-white transition-colors ${showSignLanguageAvatar ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 14h8M10 16h4" />
                        </svg>
                    </button>
                )}
                
                <button 
                    onClick={() => setShowSettings(true)} 
                    title="Settings" 
                    className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                
                <button 
                    onClick={handleLeaveRoom} 
                    title="Leave Room" 
                    className="p-3 rounded-full bg-red-700 hover:bg-red-800 text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </footer>

            {showSettings && (
                <div className="animate-scale-in">
                    <SettingsPanel 
                        onClose={() => setShowSettings(false)} 
                        updatePreferences={updatePreferences} 
                        currentUser={user}
                        broadcastPreferences={broadcastPreferences}
                        currentRoom={currentRoom}
                    />
                </div>
            )}
            
            {/* Sign Language Avatar - Show only for current user when they have deaf mode enabled */}
            {user?.preferences?.deafMode && showSignLanguageAvatar && (
                <SignLanguageAvatar
                    key="user-avatar"
                    text={currentSubtitle || lastSubtitle}
                    isVisible={true}
                    participantName={user.username}
                    isCurrentUser={true}
                    onClose={() => {
                        console.log('Sign language avatar closed by user');
                        setShowSignLanguageAvatar(false);
                    }}
                    onMinimize={(minimized) => {
                        console.log('Sign language avatar minimized:', minimized);
                    }}
                />
            )}
        </div>
    );
};

const SettingsPanel = ({ onClose, updatePreferences, currentUser, broadcastPreferences, currentRoom }) => {
    const [language, setLanguage] = useState(currentUser?.preferences?.language || 'en');
    const [deafMode, setDeafMode] = useState(currentUser?.preferences?.deafMode || false);

    const handleSave = async () => {
        if (updatePreferences) {
            console.log('Saving preferences:', { language, deafMode });
            const result = await updatePreferences({ language, deafMode });
            if (result?.success) {
                console.log('Preferences updated successfully');
                if (broadcastPreferences && currentRoom) {
                    // Broadcast preference changes to other participants
                    broadcastPreferences(currentRoom.roomId, { language, deafMode });
                }
                
                // Provide immediate visual feedback
                if (deafMode) {
                    console.log('Deaf mode enabled - Sign language avatar will appear');
                } else {
                    console.log('Deaf mode disabled - Sign language avatar will disappear');
                }
            } else {
                console.error('Failed to update preferences:', result?.error);
            }
        }
        onClose();
    };

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setLanguage(newLanguage);
        // Update translation pipeline immediately for real-time effect
        if (window.translationPipeline) {
            window.translationPipeline.setTargetLanguage(newLanguage);
        }
    };

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="language-select" className="block text-sm font-medium text-gray-700">Subtitle Language</label>
                        <select
                            id="language-select"
                            value={language}
                            onChange={handleLanguageChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors"
                        >
                            <option value="en">🇺🇸 English</option>
                            <option value="es">🇪🇸 Spanish (Español)</option>
                            <option value="fr">🇫🇷 French (Français)</option>
                            <option value="de">🇩🇪 German (Deutsch)</option>
                            <option value="hi">🇮🇳 Hindi (हिंदी)</option>
                            <option value="ta">🇮🇳 Tamil (தமிழ்)</option>
                            <option value="zh">🇨🇳 Chinese (中文)</option>
                            <option value="ja">🇯🇵 Japanese (日本語)</option>
                            <option value="ar">🇸🇦 Arabic (العربية)</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            Enable Deaf Mode
                            {deafMode && <span className="ml-2 text-blue-600">🤟 Active</span>}
                        </span>
                        <button
                            onClick={() => {
                                const newDeafMode = !deafMode;
                                setDeafMode(newDeafMode);
                                console.log('Deaf mode toggled:', newDeafMode);
                            }}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${deafMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${deafMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                </div>
            </div>
        </div>
    );
};

export default VideoCallPage;