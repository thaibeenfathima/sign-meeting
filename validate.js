#!/usr/bin/env node

/**
 * Comprehensive Validation Script for Multilingual Video Call App
 * 
 * This script validates the entire project setup and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Multilingual Video Call App - Comprehensive Validation\n');

let validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// Helper functions
function checkPassed(message) {
  console.log(`✅ ${message}`);
  validationResults.passed++;
}

function checkFailed(message, error = null) {
  console.log(`❌ ${message}`);
  validationResults.failed++;
  if (error) {
    validationResults.errors.push({ message, error: error.toString() });
  }
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
  validationResults.warnings++;
}

// 1. Node.js Version Check
function validateNodeVersion() {
  console.log('📋 Checking Node.js version...');
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      checkPassed(`Node.js version ${nodeVersion} is compatible`);
    } else {
      checkFailed(`Node.js version ${nodeVersion} is too old. Requires 18+`);
    }
  } catch (error) {
    checkFailed('Failed to check Node.js version', error);
  }
  console.log('');
}

// 2. Project Structure Validation
function validateProjectStructure() {
  console.log('📂 Validating project structure...');
  
  const requiredFiles = [
    'package.json',
    'README.md',
    'demo-test.js',
    'setup.js',
    'frontend/package.json',
    'frontend/src/App.jsx',
    'frontend/src/main.jsx',
    'frontend/tailwind.config.js',
    'backend/package.json',
    'backend/server.js',
    'backend/models/User.js',
    'backend/models/Room.js',
    'backend/models/Message.js',
    'backend/routes/auth.js',
    'backend/routes/rooms.js',
    'backend/services/translationService.js',
    'backend/socket/socketHandler.js'
  ];

  const requiredDirectories = [
    'frontend',
    'backend',
    'frontend/src',
    'frontend/src/components',
    'frontend/src/contexts',
    'frontend/src/pages',
    'frontend/src/hooks',
    'frontend/src/utils',
    'backend/models',
    'backend/routes',
    'backend/middleware',
    'backend/socket',
    'backend/services'
  ];

  // Check files
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      checkPassed(`File exists: ${file}`);
    } else {
      checkFailed(`Missing file: ${file}`);
    }
  });

  // Check directories
  requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      checkPassed(`Directory exists: ${dir}`);
    } else {
      checkFailed(`Missing directory: ${dir}`);
    }
  });

  console.log('');
}

// 3. Dependencies Check
function validateDependencies() {
  console.log('📦 Checking dependencies...');
  
  try {
    // Check root dependencies
    if (fs.existsSync('node_modules')) {
      checkPassed('Root node_modules exists');
    } else {
      checkWarning('Root node_modules missing - run npm install');
    }

    // Check frontend dependencies
    if (fs.existsSync('frontend/node_modules')) {
      checkPassed('Frontend node_modules exists');
    } else {
      checkWarning('Frontend node_modules missing - run npm install in frontend/');
    }

    // Check backend dependencies
    if (fs.existsSync('backend/node_modules')) {
      checkPassed('Backend node_modules exists');
    } else {
      checkWarning('Backend node_modules missing - run npm install in backend/');
    }

    // Validate key dependencies in package.json files
    const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));

    // Frontend key dependencies
    const frontendDeps = ['react', 'react-dom', 'react-router-dom', 'axios', 'socket.io-client', 'tailwindcss'];
    frontendDeps.forEach(dep => {
      if (frontendPkg.dependencies?.[dep] || frontendPkg.devDependencies?.[dep]) {
        checkPassed(`Frontend has ${dep}`);
      } else {
        checkFailed(`Frontend missing ${dep}`);
      }
    });

    // Backend key dependencies
    const backendDeps = ['express', 'socket.io', 'mongoose', 'jsonwebtoken', 'bcryptjs', 'cors', 'dotenv'];
    backendDeps.forEach(dep => {
      if (backendPkg.dependencies?.[dep]) {
        checkPassed(`Backend has ${dep}`);
      } else {
        checkFailed(`Backend missing ${dep}`);
      }
    });

  } catch (error) {
    checkFailed('Failed to validate dependencies', error);
  }
  
  console.log('');
}

// 4. Build Validation
function validateBuild() {
  console.log('🔨 Testing build process...');
  
  try {
    // Test frontend build
    console.log('   Testing frontend build...');
    execSync('cd frontend && npm run build', { stdio: 'pipe' });
    checkPassed('Frontend builds successfully');
    
    // Check if dist folder was created
    if (fs.existsSync('frontend/dist')) {
      checkPassed('Frontend dist folder created');
    } else {
      checkFailed('Frontend dist folder not created');
    }

  } catch (error) {
    checkFailed('Frontend build failed', error);
  }

  try {
    // Test backend syntax
    console.log('   Testing backend syntax...');
    execSync('cd backend && node -c server.js', { stdio: 'pipe' });
    checkPassed('Backend syntax is valid');
  } catch (error) {
    checkFailed('Backend syntax check failed', error);
  }

  console.log('');
}

// 5. Configuration Validation
function validateConfiguration() {
  console.log('⚙️ Checking configuration...');

  // Check for example files
  const configFiles = [
    { file: 'backend/env.example', name: 'Backend env example' },
    { file: 'frontend/env.example', name: 'Frontend env example' }
  ];

  configFiles.forEach(({ file, name }) => {
    if (fs.existsSync(file)) {
      checkPassed(`${name} exists`);
    } else {
      checkWarning(`${name} missing`);
    }
  });

  // Check TailwindCSS config
  try {
    const tailwindConfig = fs.readFileSync('frontend/tailwind.config.js', 'utf8');
    if (tailwindConfig.includes('content:') && tailwindConfig.includes('./src/**/*.{js,ts,jsx,tsx}')) {
      checkPassed('TailwindCSS configuration is valid');
    } else {
      checkWarning('TailwindCSS configuration may be incomplete');
    }
  } catch (error) {
    checkFailed('Failed to validate TailwindCSS config', error);
  }

  console.log('');
}

// 6. Feature Validation
function validateFeatures() {
  console.log('🌟 Validating key features...');

  // Check for key components
  const keyComponents = [
    'frontend/src/components/SignLanguageAvatar.jsx',
    'frontend/src/components/LoadingSpinner.jsx',
    'frontend/src/components/ErrorBoundary.jsx',
    'frontend/src/contexts/AuthContext.jsx',
    'frontend/src/contexts/SocketContext.jsx',
    'frontend/src/contexts/WebRTCContext.jsx',
    'frontend/src/pages/LoginPage.jsx',
    'frontend/src/pages/RegisterPage.jsx',
    'frontend/src/pages/Dashboard.jsx',
    'frontend/src/pages/VideoCallPage.jsx'
  ];

  keyComponents.forEach(component => {
    if (fs.existsSync(component)) {
      checkPassed(`Component exists: ${path.basename(component)}`);
    } else {
      checkFailed(`Missing component: ${component}`);
    }
  });

  // Check for utility functions
  const utilityFiles = [
    'frontend/src/utils/constants.js',
    'frontend/src/utils/helpers.js',
    'frontend/src/hooks/useLocalStorage.js',
    'frontend/src/hooks/useMediaDevices.js'
  ];

  utilityFiles.forEach(util => {
    if (fs.existsSync(util)) {
      checkPassed(`Utility exists: ${path.basename(util)}`);
    } else {
      checkWarning(`Missing utility: ${util}`);
    }
  });

  console.log('');
}

// 7. Demo Test
function validateDemo() {
  console.log('🧪 Running demo test...');
  
  try {
    const output = execSync('node demo-test.js', { encoding: 'utf8' });
    if (output.includes('✅ Demo completed successfully!')) {
      checkPassed('Demo test passed');
    } else {
      checkWarning('Demo test completed but may have issues');
    }
  } catch (error) {
    checkFailed('Demo test failed', error);
  }

  console.log('');
}

// 8. Security Check
function validateSecurity() {
  console.log('🔒 Basic security validation...');

  // Check for sensitive files that shouldn't be committed
  const sensitiveFiles = ['.env', 'backend/.env', 'frontend/.env'];
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      checkWarning(`Sensitive file exists: ${file} (ensure it's in .gitignore)`);
    }
  });

  // Check if .gitignore exists
  if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    if (gitignore.includes('.env') && gitignore.includes('node_modules')) {
      checkPassed('.gitignore properly configured');
    } else {
      checkWarning('.gitignore may be incomplete');
    }
  } else {
    checkWarning('.gitignore file missing');
  }

  console.log('');
}

// Main validation function
function runValidation() {
  console.log('Starting comprehensive validation...\n');

  validateNodeVersion();
  validateProjectStructure();
  validateDependencies();
  validateBuild();
  validateConfiguration();
  validateFeatures();
  validateDemo();
  validateSecurity();

  // Summary
  console.log('📊 Validation Summary');
  console.log('═'.repeat(50));
  console.log(`✅ Passed: ${validationResults.passed}`);
  console.log(`❌ Failed: ${validationResults.failed}`);
  console.log(`⚠️  Warnings: ${validationResults.warnings}`);
  console.log('');

  if (validationResults.failed === 0) {
    console.log('🎉 All critical validations passed!');
    console.log('🚀 Your multilingual video call app is ready to run!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Add your OpenAI API key to backend/.env');
    console.log('2. Start MongoDB (or configure MongoDB Atlas)');
    console.log('3. Run: npm run dev');
    console.log('4. Open: http://localhost:5173');
  } else {
    console.log('❌ Some critical issues need to be resolved.');
    console.log('');
    console.log('🔧 Issues to fix:');
    validationResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.message}`);
    });
  }

  if (validationResults.warnings > 0) {
    console.log('');
    console.log('💡 Consider addressing the warnings for optimal setup.');
  }

  console.log('');
  return validationResults.failed === 0;
}

// Run validation if called directly
if (require.main === module) {
  const success = runValidation();
  process.exit(success ? 0 : 1);
}

module.exports = { runValidation };
