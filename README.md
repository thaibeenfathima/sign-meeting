# 🌐 Multilingual Video Calling App

A full-stack multilingual video calling application with real-time speech translation and sign language avatar support. Built with React.js, Node.js, WebRTC, and AI-powered translation services.

![App Preview](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Multilingual+Video+Call+App)

## ✨ Features

### 🎥 Video Calling
- **WebRTC-based** peer-to-peer video/audio calls
- **Multi-participant** support (up to 50 users per room)
- **Screen sharing** capabilities
- **Camera/microphone** controls
- **Responsive design** for desktop and mobile

### 🗣️ Real-time Translation
- **Speech-to-text** transcription using OpenAI Whisper
- **Live translation** to multiple languages
- **Real-time subtitles** displayed during calls
- **Language auto-detection**
- **Support for 13+ languages** including Tamil, Hindi, Arabic, Chinese, etc.

### 🤟 Sign Language Support
- **Interactive sign language avatar** component
- **Deaf Mode** toggle for accessibility
- **Real-time gesture animation** based on translated text
- **Draggable and resizable** avatar window
- **Customizable avatar styles**

### 🔐 Authentication & User Management
- **JWT-based authentication**
- **User registration/login**
- **Profile management**
- **Language preferences**
- **Room creation and joining**

### 💬 Communication Features
- **Real-time chat** with translation
- **Message history**
- **Typing indicators**
- **Emoji reactions**
- **File sharing** (planned)

## 🏗️ Architecture

```
multilingual-video-call-app/
├── frontend/                 # React.js + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Socket, WebRTC)
│   │   ├── pages/           # Main application pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utility functions
│   └── package.json
├── backend/                 # Node.js + Express backend
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── middleware/          # Authentication middleware
│   ├── socket/              # Socket.IO handlers
│   ├── services/            # Translation services
│   └── server.js
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or cloud)
- **OpenAI API key** (for translation services)
- **Modern web browser** with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multilingual-video-call-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   **Backend (.env):**
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/video-call-app
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # OpenAI API (for speech-to-text and translation)
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

   **Frontend (.env):**
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   
   # Feature Flags
   VITE_ENABLE_SIGN_LANGUAGE=true
   VITE_ENABLE_TRANSLATION=true
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 🔧 Configuration

### Translation Services

The app supports multiple translation providers:

1. **OpenAI GPT** (Primary)
   - Set `OPENAI_API_KEY` in backend environment
   - Supports all major languages
   - High accuracy translation

2. **Google Translate API** (Fallback)
   - Set `GOOGLE_TRANSLATE_API_KEY` in backend environment
   - Fast and reliable
   - Wide language support

3. **Mock Translation** (Development)
   - Used when no API keys are configured
   - Useful for testing without API costs

### WebRTC Configuration

The app uses STUN servers for NAT traversal:
- Google STUN servers (default)
- Configurable in frontend environment

For production, consider adding TURN servers for better connectivity.

### MongoDB Setup

**Local MongoDB:**
```bash
# Install MongoDB
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod
```

**MongoDB Atlas (Cloud):**
1. Create account at https://www.mongodb.com/atlas
2. Create cluster and get connection string
3. Update `MONGODB_URI` in backend .env

## 📱 Usage

### Creating a Room

1. **Register/Login** to your account
2. **Click "Create Room"** on the dashboard
3. **Configure room settings:**
   - Room name and description
   - Maximum participants
   - Private room with password (optional)
4. **Share the Room ID** with participants

### Joining a Room

1. **Click "Join Room"** on the dashboard
2. **Enter the Room ID** provided by the host
3. **Enter password** if the room is private
4. **Allow camera/microphone** permissions

### Using Translation Features

1. **Set your preferred language** in user preferences
2. **Speak during the call** - your speech will be automatically:
   - Transcribed to text
   - Translated to other participants' languages
   - Displayed as real-time subtitles
3. **Enable "Deaf Mode"** to show sign language avatar

### Sign Language Avatar

1. **Enable "Deaf Mode"** in settings
2. **Avatar appears** in bottom-right corner during calls
3. **Displays sign gestures** for translated speech
4. **Drag to reposition** or minimize the avatar window

## 🛠️ Development

### Project Structure

**Frontend Components:**
- `AuthContext` - User authentication state
- `SocketContext` - WebSocket connection management
- `WebRTCContext` - Video call functionality
- `SignLanguageAvatar` - Sign language display component
- `VideoCallPage` - Main video call interface
- `Dashboard` - Room management interface

**Backend Services:**
- `authRoutes` - User authentication API
- `roomRoutes` - Room management API
- `socketHandler` - WebRTC signaling and real-time communication
- `translationService` - Speech-to-text and translation logic

### Adding New Languages

1. **Update language lists** in:
   - `frontend/src/pages/RegisterPage.jsx`
   - `frontend/src/pages/Dashboard.jsx`
   - `backend/models/User.js`

2. **Add translation mappings** in:
   - `backend/services/translationService.js`

3. **Update sign language gestures** in:
   - `frontend/src/components/SignLanguageAvatar.jsx`

### Testing

**Manual Testing:**
1. Open two browser windows/tabs
2. Register different users
3. Create room in one window
4. Join room from second window
5. Test video call and translation features

**Automated Testing:**
```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. **Build the frontend:**
   ```bash
   cd frontend && npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard

### Backend (Railway/Heroku)

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY backend/package*.json ./
   RUN npm install
   COPY backend/ .
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Deploy to Railway:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway deploy
   ```

3. **Set environment variables** in Railway dashboard

### Database (MongoDB Atlas)

1. **Create MongoDB Atlas cluster**
2. **Whitelist deployment IPs**
3. **Update connection string** in production environment

## 🔒 Security Considerations

- **JWT tokens** expire after 7 days
- **Password hashing** with bcrypt (12 rounds)
- **CORS protection** configured for frontend domain
- **Input validation** on all API endpoints
- **Rate limiting** on authentication endpoints (recommended)
- **HTTPS enforcement** in production (required)

## 🌍 Supported Languages

| Language | Code | Speech Recognition | Translation | Sign Language |
|----------|------|-------------------|-------------|---------------|
| English | en | ✅ | ✅ | ✅ |
| Spanish | es | ✅ | ✅ | ✅ |
| French | fr | ✅ | ✅ | ✅ |
| German | de | ✅ | ✅ | ✅ |
| Hindi | hi | ✅ | ✅ | ✅ |
| Tamil | ta | ✅ | ✅ | ✅ |
| Chinese | zh | ✅ | ✅ | ✅ |
| Japanese | ja | ✅ | ✅ | ✅ |
| Korean | ko | ✅ | ✅ | ✅ |
| Arabic | ar | ✅ | ✅ | ✅ |
| Portuguese | pt | ✅ | ✅ | ✅ |
| Russian | ru | ✅ | ✅ | ✅ |
| Italian | it | ✅ | ✅ | ✅ |

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- **Follow ESLint** configuration
- **Write meaningful commit** messages
- **Add tests** for new features
- **Update documentation** as needed
- **Test across browsers** and devices

## 📝 API Documentation

### Authentication Endpoints

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/preferences
```

### Room Management Endpoints

```
POST /api/rooms/create
POST /api/rooms/join/:roomId
POST /api/rooms/leave/:roomId
GET  /api/rooms/:roomId
GET  /api/rooms/user/my-rooms
```

### WebSocket Events

```
// Client to Server
authenticate
join_room
leave_room
send_message
audio_data
webrtc_offer
webrtc_answer
webrtc_ice_candidate

// Server to Client
authenticated
room_joined
user_joined
user_left
new_message
new_subtitle
webrtc_offer
webrtc_answer
webrtc_ice_candidate
```

## 🐛 Troubleshooting

### Common Issues

**Camera/Microphone not working:**
- Check browser permissions
- Ensure HTTPS in production
- Try different browser

**Connection issues:**
- Check firewall settings
- Verify STUN/TURN server configuration
- Test network connectivity

**Translation not working:**
- Verify OpenAI API key
- Check API quota and billing
- Review server logs for errors

**Sign language avatar not showing:**
- Enable "Deaf Mode" in settings
- Check browser console for errors
- Verify component is receiving text

### Debug Mode

Enable debug logging:
```env
VITE_DEBUG_MODE=true
NODE_ENV=development
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for Whisper API and GPT translation
- **WebRTC** community for real-time communication standards
- **Socket.IO** for WebSocket implementation
- **React** and **Node.js** communities
- **MongoDB** for database solutions
- **TailwindCSS** for styling framework

## 📞 Support

For support, email support@example.com or create an issue in the repository.

---

**Built with ❤️ for global communication and accessibility**
