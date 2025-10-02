import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Sign language gesture mappings for common words/phrases
const SIGN_GESTURES = {
  // Greetings
  'hello': '👋',
  'hi': '👋',
  'goodbye': '👋',
  'bye': '👋',
  'good morning': '🌅',
  'good evening': '🌆',
  'good night': '🌙',
  
  // Common words
  'yes': '👍',
  'no': '👎',
  'please': '🙏',
  'thank you': '🙏',
  'thanks': '🙏',
  'sorry': '😔',
  'excuse me': '✋',
  
  // Questions
  'what': '❓',
  'when': '⏰',
  'where': '📍',
  'who': '👤',
  'why': '🤔',
  'how': '❓',
  
  // Numbers
  'one': '☝️',
  'two': '✌️',
  'three': '🤟',
  'four': '🖖',
  'five': '🖐️',
  
  // Emotions
  'happy': '😊',
  'sad': '😢',
  'angry': '😠',
  'surprised': '😲',
  'confused': '😕',
  'love': '❤️',
  
  // Actions
  'eat': '🍽️',
  'drink': '🥤',
  'sleep': '😴',
  'work': '💼',
  'study': '📚',
  'play': '🎮',
  'help': '🆘',
  'stop': '✋',
  'go': '➡️',
  'come': '👈',
  
  // Family
  'mother': '👩',
  'father': '👨',
  'family': '👨‍👩‍👧‍👦',
  'friend': '👫',
  
  // Default gestures for unknown words
  'default': '🤲'
};

const SignLanguageAvatar = ({ 
  text = '', 
  isVisible = true, 
  onClose, 
  onMinimize,
  className = '',
  participantName = 'User',
  isCurrentUser = false,
  style = {}
}) => {
  const [currentGesture, setCurrentGesture] = useState('🤲');
  const [currentText, setCurrentText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  // Smart initial positioning to avoid overlaps
  const getInitialPosition = () => {
    const baseX = window.innerWidth - 280; // Start from right side
    const baseY = 100;
    const existingAvatars = document.querySelectorAll('.sign-avatar-container');
    const offset = existingAvatars.length * 60; // Stagger by 60px
    
    return {
      x: Math.max(20, baseX - offset),
      y: baseY + offset
    };
  };

  const [position, setPosition] = useState(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { user } = useAuth();
  const avatarRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  // Process text and convert to sign gestures
  useEffect(() => {
    if (text && text.trim()) {
      processTextToSigns(text.toLowerCase().trim());
    } else {
      // Show default message when no text
      setCurrentText('Listening...');
      setCurrentGesture('👂');
    }
  }, [text]);

  const processTextToSigns = async (inputText) => {
    setCurrentText(inputText);
    setIsAnimating(true);

    // Split text into words and find matching gestures
    const words = inputText.split(/\s+/);
    const gestures = [];

    for (const word of words) {
      // Check for exact matches first
      if (SIGN_GESTURES[word]) {
        gestures.push({ gesture: SIGN_GESTURES[word], word });
        continue;
      }

      // Check for partial matches (for phrases)
      let found = false;
      for (const [phrase, gesture] of Object.entries(SIGN_GESTURES)) {
        if (phrase.includes(' ') && inputText.includes(phrase)) {
          gestures.push({ gesture, word: phrase });
          found = true;
          break;
        }
      }

      if (!found) {
        // Use default gesture for unknown words
        gestures.push({ gesture: SIGN_GESTURES.default, word });
      }
    }

    // Animate through gestures
    for (let i = 0; i < gestures.length; i++) {
      await new Promise(resolve => {
        setTimeout(() => {
          setCurrentGesture(gestures[i].gesture);
          resolve();
        }, i * 1500); // 1.5 seconds per gesture
      });
    }

    // Return to neutral position
    setTimeout(() => {
      setCurrentGesture('🤲');
      setIsAnimating(false);
    }, gestures.length * 1500 + 1000);
  };

  // Drag functionality
  const handleMouseDown = (e) => {
    // Allow dragging from anywhere on the avatar header
    if (e.target.closest('.sign-avatar-header')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = avatarRef.current.getBoundingClientRect();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && avatarRef.current) {
      e.preventDefault();
      const newX = e.clientX - dragRef.current.offsetX;
      const newY = e.clientY - dragRef.current.offsetY;
      
      // Keep avatar within viewport bounds
      const maxX = window.innerWidth - avatarRef.current.offsetWidth;
      const maxY = window.innerHeight - avatarRef.current.offsetHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Set up global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Handle minimize
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (onMinimize) onMinimize(!isMinimized);
  };

  // Handle close
  const handleClose = () => {
    if (onClose) onClose();
  };

  // Cleanup event listeners and add global drag style
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'move';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={avatarRef}
      className={`sign-avatar-container ${isDragging ? 'dragging' : ''} ${className}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '16rem',
        height: isMinimized ? '2rem' : '12rem',
        zIndex: 1000,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        borderRadius: '0.5rem',
        userSelect: 'none',
        ...style
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header - Draggable */}
      <div 
        className="sign-avatar-header draggable-handle"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: isDragging ? '#374151' : '#1F2937',
          color: 'white',
          cursor: 'move',
          borderRadius: '6px 6px 0 0',
          borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
          userSelect: 'none',
          fontSize: '12px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
        onMouseLeave={(e) => e.target.style.backgroundColor = isDragging ? '#374151' : '#1F2937'}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '8px', opacity: 0.7 }}>⋮⋮</span>
          {isMinimized 
            ? `🤟 ${isCurrentUser ? 'Your' : participantName}'s Avatar` 
            : `${isCurrentUser ? 'Your' : participantName}'s Sign Language Avatar`
          }
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMinimize();
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '3px',
              fontSize: '14px',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            {isMinimized ? '□' : '−'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '3px',
              fontSize: '14px',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="sign-avatar-content">
          <div className="sign-avatar-figure">
            <div className="sign-avatar-animation">
              <div className={`sign-gesture ${isAnimating ? 'animating' : ''}`}>
                {currentGesture}
              </div>
            </div>
          </div>

          {/* Text Display - Always show with fallback */}
          <div className="sign-text-display" style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px',
            borderRadius: '6px',
            marginTop: '8px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minHeight: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              lineHeight: '1.4',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}>
              {currentText || 'Waiting for speech...'}
            </div>
            {isAnimating && (
              <div style={{
                fontSize: '12px',
                color: '#34D399',
                marginTop: '4px',
                fontWeight: '500'
              }}>
                🎭 Translating to sign language...
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="absolute top-2 right-2">
            <div className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-green-400' : 'bg-gray-400'}`} />
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Sign Language Avatar with more features
export const AdvancedSignLanguageAvatar = ({ 
  text = '', 
  isVisible = true, 
  onClose, 
  onMinimize,
  avatarStyle = 'default',
  speed = 'normal',
  className = '' 
}) => {
  const [gestureQueue, setGestureQueue] = useState([]);
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const speeds = {
    slow: 2000,
    normal: 1500,
    fast: 1000
  };

  // Enhanced gesture processing with context awareness
  const processAdvancedText = (inputText) => {
    const sentences = inputText.split(/[.!?]+/).filter(s => s.trim());
    const allGestures = [];

    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().trim().split(/\s+/);
      const sentenceGestures = [];

      // Process each word with context
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const prevWord = i > 0 ? words[i - 1] : '';
        const nextWord = i < words.length - 1 ? words[i + 1] : '';
        
        // Check for compound phrases first
        const twoWordPhrase = `${word} ${nextWord}`.trim();
        const threeWordPhrase = `${prevWord} ${word} ${nextWord}`.trim();
        
        if (SIGN_GESTURES[threeWordPhrase]) {
          sentenceGestures.push({ 
            gesture: SIGN_GESTURES[threeWordPhrase], 
            word: threeWordPhrase,
            duration: speeds[speed] * 1.5 
          });
          i += 2; // Skip next two words
        } else if (SIGN_GESTURES[twoWordPhrase]) {
          sentenceGestures.push({ 
            gesture: SIGN_GESTURES[twoWordPhrase], 
            word: twoWordPhrase,
            duration: speeds[speed] * 1.2 
          });
          i += 1; // Skip next word
        } else if (SIGN_GESTURES[word]) {
          sentenceGestures.push({ 
            gesture: SIGN_GESTURES[word], 
            word,
            duration: speeds[speed] 
          });
        } else {
          // Finger spelling for unknown words
          sentenceGestures.push({ 
            gesture: '🤲', 
            word: `[${word}]`,
            duration: speeds[speed] * 0.8 
          });
        }
      }

      allGestures.push(...sentenceGestures);
      
      // Add pause between sentences
      if (sentences.length > 1) {
        allGestures.push({ 
          gesture: '🤲', 
          word: '[pause]',
          duration: speeds[speed] * 0.5 
        });
      }
    });

    return allGestures;
  };

  return (
    <SignLanguageAvatar
      text={text}
      isVisible={isVisible}
      onClose={onClose}
      onMinimize={onMinimize}
      className={className}
    />
  );
};

export default SignLanguageAvatar;
