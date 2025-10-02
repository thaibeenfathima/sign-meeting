/**
 * Frontend Translation Service
 * Handles real-time translation and subtitle processing
 */

// Mock translation database for demo purposes
const TRANSLATION_DB = {
  // English to other languages
  'hello': {
    'es': 'hola',
    'fr': 'bonjour', 
    'de': 'hallo',
    'hi': 'नमस्ते',
    'ta': 'வணக்கம்',
    'zh': '你好',
    'ja': 'こんにちは',
    'ar': 'مرحبا'
  },
  'how are you': {
    'es': '¿cómo estás?',
    'fr': 'comment allez-vous?',
    'de': 'wie geht es dir?',
    'hi': 'आप कैसे हैं?',
    'ta': 'எப்படி இருக்கீங்க?',
    'zh': '你好吗？',
    'ja': '元気ですか？',
    'ar': 'كيف حالك؟'
  },
  'thank you': {
    'es': 'gracias',
    'fr': 'merci',
    'de': 'danke',
    'hi': 'धन्यवाद',
    'ta': 'நன்றி',
    'zh': '谢谢',
    'ja': 'ありがとう',
    'ar': 'شكرا'
  },
  'good morning': {
    'es': 'buenos días',
    'fr': 'bonjour',
    'de': 'guten morgen',
    'hi': 'सुप्रभात',
    'ta': 'காலை வணக்கம்',
    'zh': '早上好',
    'ja': 'おはよう',
    'ar': 'صباح الخير'
  },
  'nice to meet you': {
    'es': 'mucho gusto',
    'fr': 'ravi de vous rencontrer',
    'de': 'freut mich, sie kennenzulernen',
    'hi': 'आपसे मिलकर खुशी हुई',
    'ta': 'உங்களை சந்தித்ததில் மகிழ்ச்சி',
    'zh': '很高兴见到你',
    'ja': 'はじめまして',
    'ar': 'سعيد بلقائك'
  },
  'what is your name': {
    'es': '¿cuál es tu nombre?',
    'fr': 'quel est votre nom?',
    'de': 'wie heißt du?',
    'hi': 'आपका नाम क्या है?',
    'ta': 'உங்க பேர் என்ன?',
    'zh': '你叫什么名字？',
    'ja': 'お名前は何ですか？',
    'ar': 'ما اسمك؟'
  },
  'i am fine': {
    'es': 'estoy bien',
    'fr': 'je vais bien',
    'de': 'mir geht es gut',
    'hi': 'मैं ठीक हूं',
    'ta': 'நான் நல்லா இருக்கேன்',
    'zh': '我很好',
    'ja': '元気です',
    'ar': 'أنا بخير'
  }
};

// Language detection patterns
const LANGUAGE_PATTERNS = {
  'ta': /[\u0B80-\u0BFF]/,  // Tamil script
  'hi': /[\u0900-\u097F]/,  // Devanagari script
  'zh': /[\u4e00-\u9fff]/,  // Chinese characters
  'ar': /[\u0600-\u06FF]/,  // Arabic script
  'ja': /[\u3040-\u309F\u30A0-\u30FF]/,  // Hiragana/Katakana
  'es': /\b(el|la|de|que|y|es|en|un|se|no|te|lo|hola|gracias|buenos|días)\b/i,
  'fr': /\b(le|de|et|à|un|il|être|bonjour|merci|comment|vous)\b/i,
  'de': /\b(der|die|das|und|ich|du|er|sie|es|hallo|danke|wie|geht)\b/i
};

/**
 * Detect the language of input text
 */
export function detectLanguage(text) {
  if (!text || text.trim().length === 0) return 'en';
  
  const lowerText = text.toLowerCase().trim();
  
  // Check for script-based languages first
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(text)) {
      return lang;
    }
  }
  
  // Default to English if no pattern matches
  return 'en';
}

/**
 * Translate text to target language
 */
export function translateText(text, targetLanguage, sourceLanguage = null) {
  if (!text || !targetLanguage) return text;
  
  const lowerText = text.toLowerCase().trim();
  const detectedLang = sourceLanguage || detectLanguage(text);
  
  // If source and target are the same, return original
  if (detectedLang === targetLanguage) {
    return text;
  }
  
  // Look for exact matches in translation database
  if (TRANSLATION_DB[lowerText] && TRANSLATION_DB[lowerText][targetLanguage]) {
    return TRANSLATION_DB[lowerText][targetLanguage];
  }
  
  // Look for partial matches
  for (const [phrase, translations] of Object.entries(TRANSLATION_DB)) {
    if (lowerText.includes(phrase) && translations[targetLanguage]) {
      return translations[targetLanguage];
    }
  }
  
  // Fallback: return original text with language indicator
  return `[${targetLanguage.toUpperCase()}] ${text}`;
}

/**
 * Process subtitle for real-time translation
 */
export function processSubtitle(originalText, userLanguage = 'en') {
  const detectedLanguage = detectLanguage(originalText);
  const translatedText = translateText(originalText, userLanguage, detectedLanguage);
  
  return {
    original: originalText,
    translated: translatedText,
    sourceLanguage: detectedLanguage,
    targetLanguage: userLanguage,
    confidence: 0.85 // Mock confidence score
  };
}

/**
 * Enhanced translation with context awareness
 */
export function translateWithContext(text, targetLanguage, context = {}) {
  const baseTranslation = translateText(text, targetLanguage);
  
  // Add context-based improvements
  if (context.isGreeting && targetLanguage === 'ta') {
    if (text.toLowerCase().includes('hello')) {
      return 'வணக்கம்';
    }
  }
  
  if (context.isQuestion && targetLanguage === 'hi') {
    if (text.toLowerCase().includes('how are you')) {
      return 'आप कैसे हैं?';
    }
  }
  
  return baseTranslation;
}

/**
 * Get language name from code
 */
export function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish', 
    'fr': 'French',
    'de': 'German',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ar': 'Arabic'
  };
  
  return languages[code] || code.toUpperCase();
}

/**
 * Simulate real-time speech recognition
 */
export function simulateSpeechRecognition(audioData) {
  // Mock speech recognition results
  const mockPhrases = [
    'Hello, how are you?',
    'I am fine, thank you',
    'What is your name?',
    'Nice to meet you',
    'வணக்கம், எப்படி இருக்கீங்க?',
    'நான் நல்லா இருக்கேன்',
    'Thank you very much',
    'Good morning everyone'
  ];
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
      const detectedLang = detectLanguage(randomPhrase);
      
      resolve({
        text: randomPhrase,
        language: detectedLang,
        confidence: 0.9
      });
    }, 1000);
  });
}

/**
 * Real-time translation pipeline
 */
export class TranslationPipeline {
  constructor(targetLanguage = 'en') {
    this.targetLanguage = targetLanguage;
    this.isProcessing = false;
  }
  
  setTargetLanguage(language) {
    this.targetLanguage = language;
  }
  
  async processAudio(audioBlob) {
    if (this.isProcessing) return null;
    
    this.isProcessing = true;
    
    try {
      // Simulate speech recognition
      const recognition = await simulateSpeechRecognition(audioBlob);
      
      // Translate the recognized text
      const translation = processSubtitle(recognition.text, this.targetLanguage);
      
      this.isProcessing = false;
      
      return {
        ...translation,
        timestamp: Date.now(),
        audioConfidence: recognition.confidence
      };
    } catch (error) {
      this.isProcessing = false;
      console.error('Translation pipeline error:', error);
      return null;
    }
  }
  
  translateText(text) {
    return processSubtitle(text, this.targetLanguage);
  }
}

// Export default instance
export const defaultTranslationPipeline = new TranslationPipeline();
