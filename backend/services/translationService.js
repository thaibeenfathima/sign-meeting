import OpenAI from 'openai';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Language code mappings
const LANGUAGE_CODES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'ar': 'Arabic'
};

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {Buffer} audioBuffer - Audio data buffer
 * @param {string} format - Audio format (webm, mp3, wav, etc.)
 * @returns {Object} Transcription result
 */
export const transcribeAudio = async (audioBuffer, format = 'webm') => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using mock transcription');
      return mockTranscription();
    }

    // Create form data for Whisper API
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: `audio.${format}`,
      contentType: `audio/${format}`
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'auto'); // Auto-detect language
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      text: result.text,
      language: result.language || 'auto',
      confidence: result.confidence || 0.9,
      duration: result.duration || 0,
      segments: result.segments || []
    };

  } catch (error) {
    console.error('Audio transcription error:', error);
    
    // Fallback to mock transcription for development
    return mockTranscription();
  }
};

/**
 * Translate text using OpenAI GPT or Google Translate
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Object} Translation result
 */
export const translateText = async (text, targetLanguage, sourceLanguage = 'auto') => {
  try {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // If source and target are the same, return original
    if (sourceLanguage === targetLanguage) {
      return {
        text,
        confidence: 1.0,
        sourceLanguage,
        targetLanguage
      };
    }

    // Try OpenAI translation first
    if (process.env.OPENAI_API_KEY) {
      return await translateWithOpenAI(text, targetLanguage, sourceLanguage);
    }

    // Fallback to Google Translate
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      return await translateWithGoogle(text, targetLanguage, sourceLanguage);
    }

    // Mock translation for development
    console.warn('No translation API configured, using mock translation');
    return mockTranslation(text, targetLanguage, sourceLanguage);

  } catch (error) {
    console.error('Translation error:', error);
    return mockTranslation(text, targetLanguage, sourceLanguage);
  }
};

/**
 * Translate using OpenAI GPT
 */
const translateWithOpenAI = async (text, targetLanguage, sourceLanguage) => {
  try {
    const targetLangName = LANGUAGE_CODES[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage !== 'auto' 
      ? LANGUAGE_CODES[sourceLanguage] || sourceLanguage 
      : 'the detected language';

    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
Only return the translated text, nothing else:

"${text}"`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the given text accurately and naturally.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const translatedText = response.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('No translation received from OpenAI');
    }

    return {
      text: translatedText,
      confidence: 0.9,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      provider: 'openai'
    };

  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw error;
  }
};

/**
 * Translate using Google Translate API
 */
const translateWithGoogle = async (text, targetLanguage, sourceLanguage) => {
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`;
    
    const requestBody = {
      q: text,
      target: targetLanguage,
      format: 'text'
    };

    if (sourceLanguage !== 'auto') {
      requestBody.source = sourceLanguage;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`);
    }

    const result = await response.json();
    const translation = result.data.translations[0];

    return {
      text: translation.translatedText,
      confidence: 0.95,
      sourceLanguage: translation.detectedSourceLanguage || sourceLanguage,
      targetLanguage: targetLanguage,
      provider: 'google'
    };

  } catch (error) {
    console.error('Google Translate error:', error);
    throw error;
  }
};

/**
 * Detect language of text
 */
export const detectLanguage = async (text) => {
  try {
    if (!text || text.trim().length < 3) {
      return 'en'; // Default to English
    }

    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a language detection expert. Return only the ISO 639-1 language code (2 letters) for the given text.'
          },
          {
            role: 'user',
            content: `Detect the language of this text: "${text}"`
          }
        ],
        max_tokens: 10,
        temperature: 0
      });

      const detectedLang = response.choices[0]?.message?.content?.trim().toLowerCase();
      return LANGUAGE_CODES[detectedLang] ? detectedLang : 'en';
    }

    // Simple heuristic detection for common languages
    return detectLanguageHeuristic(text);

  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
};

/**
 * Simple heuristic language detection
 */
const detectLanguageHeuristic = (text) => {
  const lowerText = text.toLowerCase();
  
  // Tamil detection
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  
  // Hindi detection
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  
  // Chinese detection
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  
  // Arabic detection
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  
  // Spanish common words
  if (/\b(el|la|de|que|y|es|en|un|se|no|te|lo|le|da|su|por|son|con|para|al|una|ser|como|todo|pero|más|hacer|muy|puede|estar|también|ya|así|hasta|donde|cuando|porque|desde|sobre|entre|cada|tanto|algunos|mucho|después|tiempo|vida|nada|otro|antes|mismo|sin|mi|mayor|sólo|aquí|hay|debe|puede|decir|cada|nuevo|trabajo|fin|dar|nos|llegar|pasar|tiempo|bien|cada|gobierno|último|hablar|país|agua|más|nuevo|forma|equipo|madre|cualquier|nosotros|hora|tipo|empresa|caso|mano|contra|partido|grupo|momento|lugar|hecho|durante|siempre|guerra|menos|días|estados|noche|vivir|tanto|aire|tener|campo|trabajo|dinero|fuerza|mientras|valor|luz|nadie|cama|marido|producir|esperar|comprar|sistema|historia|árbol|variar|ponerse|hablar|señor|alto|tanto|libro|cambiar|llamar|pedir|número|parte|pequeño|derecho|hombre|ojo|vez|gobierno|mundo|año|trabajar|día|usar|hombre|agua|escribir|madre|área|nacional|dinero|historia|manera|derecho|casa|mostrar|empresa|lugar|grupo|problema|mano|sistema|programa|pregunta|seguir|trabajo|vida|llevar|niño|punto|creer|semana|ojo|caso|tiempo|persona|año|gobierno|día|hombre|mundo|vida|parte|lugar|estado|forma|estar|tener|hacer|decir|todo|cada|gran|otro|mismo|alguno|mucho|tanto|poco|más|muy|bien|donde|cuando|como|porque|pero|aunque|mientras|hasta|desde|entre|contra|durante|según|bajo|sobre|tras|mediante|excepto|salvo|incluso|además|tampoco|sino|sólo|aún|ya|todavía|siempre|nunca|jamás|acaso|quizá|tal|vez|claro|bueno|mejor|peor|mayor|menor|primero|último|único|solo|propio|mismo|otro|cierto|verdadero|falso|posible|imposible|fácil|difícil|simple|complicado|importante|necesario|suficiente|bastante|demasiado|poco|mucho|todo|nada|algo|alguien|nadie|cualquier|varios|ambos|cada|otro|mismo|propio|tal|tanto|cuanto|más|menos|muy|bien|mal|mejor|peor|así|aquí|ahí|allí|donde|cuando|como|porque|para|por|con|sin|entre|sobre|bajo|tras|desde|hasta|durante|mediante|según|excepto|salvo|incluso|además|tampoco|sino|pero|aunque|mientras|si|que|cual|quien|cuyo|donde|cuando|como|cuanto|más|menos|tanto|muy|bien|mal|mejor|peor|primero|último|único|solo|propio|mismo|otro|cierto|verdadero|falso|posible|imposible|fácil|difícil|simple|complicado|importante|necesario|suficiente|bastante|demasiado|poco|mucho|todo|nada|algo|alguien|nadie|cualquier|varios|ambos)\b/gi.test(lowerText)) {
    return 'es';
  }
  
  // French common words
  if (/\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|par|grand|ce|me|même|te|des|ces|vous|votre|foi|avoir|son|mot|où|comment|était|chaque|elle|faire|leur|temps|très|lui|bien|autre|depuis|pourrait|là|première|aussi|après|retour|autre|beaucoup|notre|bien|où|par|venir|son|maintenant|que|homme|grand|devenir|ici|main|haute|vieux|voir|lui|deux|façon|qui|huile|asseoir|maintenant|trouver|tête|debout|dans|fait|moins|dire|partie|tourner|problème|lieu|droit|grand|main|haut|petit|pourquoi|demander|homme|grand|essayer|encore|chemin|utilisation|elle|beaucoup|écrire|droite|essayer|gauche|aussi|chaque|elle|tourner|ici|pourquoi|demander|aller|homme|nouveau|travail|partie|prendre|obtenir|lieu|fait|vivre|où|après|retour|peu|seulement|tour|homme|travail|vie|chemin|même|dire|grand|groupe|droit|garçon|vieux|savoir|temps|eau|très|quand|beaucoup|peut|dire|chaque|dire|juste|nom|phrase|maison|mouvement|essayer|encore|animal|point|mère|monde|près|construire|soi|terre|père|tout|nouveau|travail|partie|prendre|obtenir|lieu|fait|vivre|où|après|retour|peu|seulement|tour|homme|travail|vie|chemin|même|dire|grand|groupe|droit|garçon|vieux|savoir|temps|eau|très|quand|beaucoup|peut|dire|chaque|dire|juste|nom|phrase|maison|mouvement|essayer|encore|animal|point|mère|monde|près|construire|soi|terre|père)\b/gi.test(lowerText)) {
    return 'fr';
  }
  
  // Default to English
  return 'en';
};

/**
 * Mock functions for development/testing
 */
const mockTranscription = () => ({
  text: "This is a mock transcription for development purposes.",
  language: 'en',
  confidence: 0.85,
  duration: 3.5,
  segments: []
});

const mockTranslation = (text, targetLanguage, sourceLanguage) => {
  const mockTranslations = {
    'ta': `[Tamil translation of: ${text}]`,
    'hi': `[Hindi translation of: ${text}]`,
    'es': `[Spanish translation of: ${text}]`,
    'fr': `[French translation of: ${text}]`,
    'de': `[German translation of: ${text}]`,
    'zh': `[Chinese translation of: ${text}]`,
    'ar': `[Arabic translation of: ${text}]`
  };

  return {
    text: mockTranslations[targetLanguage] || `[${targetLanguage} translation of: ${text}]`,
    confidence: 0.8,
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
    provider: 'mock'
  };
};
