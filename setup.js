#!/usr/bin/env node

/**
 * Setup Script for Multilingual Video Call App
 * 
 * This script helps users set up the development environment
 * and configure the necessary environment variables.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Multilingual Video Call App Setup\n');

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  console.log(`📋 Checking Node.js version: ${nodeVersion}`);
  
  if (majorVersion < 18) {
    console.error('❌ Node.js 18 or higher is required');
    console.log('   Please update Node.js: https://nodejs.org/');
    process.exit(1);
  }
  
  console.log('✅ Node.js version is compatible\n');
}

// Create environment files
function createEnvFiles() {
  console.log('📝 Creating environment files...\n');
  
  // Backend .env file
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  const backendEnvContent = `# Database
MONGODB_URI=mongodb://localhost:27017/video-call-app

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI API (for speech-to-text and translation)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-api-key-here

# Google Translate API (optional fallback)
# Get your API key from: https://cloud.google.com/translate/docs/setup
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
`;

  // Frontend .env file
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  const frontendEnvContent = `# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# WebRTC Configuration
VITE_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# Feature Flags
VITE_ENABLE_SIGN_LANGUAGE=true
VITE_ENABLE_TRANSLATION=true
VITE_ENABLE_SCREEN_SHARE=true

# Development
VITE_DEBUG_MODE=true
`;

  // Create backend .env if it doesn't exist
  if (!fs.existsSync(backendEnvPath)) {
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('✅ Created backend/.env');
  } else {
    console.log('⚠️  backend/.env already exists, skipping...');
  }

  // Create frontend .env if it doesn't exist
  if (!fs.existsSync(frontendEnvPath)) {
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log('✅ Created frontend/.env');
  } else {
    console.log('⚠️  frontend/.env already exists, skipping...');
  }
  
  console.log('');
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing dependencies...\n');
  
  try {
    console.log('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('\nInstalling frontend dependencies...');
    execSync('cd frontend && npm install', { stdio: 'inherit', shell: true });
    
    console.log('\nInstalling backend dependencies...');
    execSync('cd backend && npm install', { stdio: 'inherit', shell: true });
    
    console.log('\n✅ All dependencies installed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Check MongoDB connection
function checkMongoDB() {
  console.log('🗄️  Checking MongoDB...\n');
  
  try {
    // Try to connect to MongoDB
    execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet', { stdio: 'pipe' });
    console.log('✅ MongoDB is running and accessible\n');
  } catch (error) {
    console.log('⚠️  MongoDB is not running or not accessible');
    console.log('   Please ensure MongoDB is installed and running:');
    console.log('   - Install: https://docs.mongodb.com/manual/installation/');
    console.log('   - Start: mongod');
    console.log('   - Or use MongoDB Atlas: https://www.mongodb.com/atlas\n');
  }
}

// Display next steps
function displayNextSteps() {
  console.log('🎉 Setup completed!\n');
  console.log('📋 Next steps:\n');
  
  console.log('1. 🔑 Configure API Keys (Required for translation):');
  console.log('   - Edit backend/.env');
  console.log('   - Add your OpenAI API key (get from: https://platform.openai.com/api-keys)');
  console.log('   - Optionally add Google Translate API key\n');
  
  console.log('2. 🗄️  Start MongoDB (if using local installation):');
  console.log('   mongod\n');
  
  console.log('3. 🚀 Start the development servers:');
  console.log('   npm run dev\n');
  
  console.log('4. 🌐 Open your browser:');
  console.log('   Frontend: http://localhost:5173');
  console.log('   Backend API: http://localhost:5000\n');
  
  console.log('5. 🧪 Test the demo:');
  console.log('   npm run demo\n');
  
  console.log('📚 For more information, see README.md');
  console.log('🐛 Issues? Check the troubleshooting section in README.md');
  console.log('💬 Need help? Create an issue on GitHub\n');
  
  console.log('🌟 Features available:');
  console.log('   ✓ Real-time video calling with WebRTC');
  console.log('   ✓ Speech-to-text transcription');
  console.log('   ✓ Multi-language translation (13+ languages)');
  console.log('   ✓ Sign language avatar for accessibility');
  console.log('   ✓ Real-time chat with translation');
  console.log('   ✓ Screen sharing');
  console.log('   ✓ Room management\n');
}

// Main setup function
function main() {
  try {
    checkNodeVersion();
    createEnvFiles();
    installDependencies();
    checkMongoDB();
    displayNextSteps();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkNodeVersion,
  createEnvFiles,
  installDependencies,
  checkMongoDB,
  displayNextSteps,
  main
};
