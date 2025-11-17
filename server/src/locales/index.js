// src/i18n/index.js
import i18next from 'i18next';
import i18nextMiddleware from 'i18next-http-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadNamespace = (lng, ns) => {
  try {
    const filePath = join(__dirname, lng, `${ns}.json`);
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`No se pudo cargar ${lng}/${ns}.json:`, error.message);
    return {};
  }
};

const resources = {
  es: {
    // Asegúrate que estos nombres coincidan con lo que usas en req.t()
    admins: loadNamespace('es', 'admins'),
    messages: loadNamespace('es', 'messages'),
    formatter: loadNamespace('es', 'formatter')
  },
  en: {
    admins: loadNamespace('en', 'admins'),
    messages: loadNamespace('en', 'messages'),
    formatter: loadNamespace('en', 'formatter')
  },
  pt: {
    admins: loadNamespace('en', 'admins'),
  }
};

i18next
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    resources,
    fallbackLng: 'en', // Cambié a 'en' para coincidir con tu default
    supportedLngs: ['es', 'en', 'pt'],
    
    detection: {
      order: ['querystring', 'header', 'cookie'],
      caches: ['cookie'],
      // Estos deben coincidir con tu middleware
      lookupHeader: 'x-app-language',
      lookupCookie: 'language', 
      lookupQuerystring: 'lang'
    },
    
    // Asegúrate que estos namespaces existen en tus archivos
    ns: ['admins', 'messages', 'formatter'],
    defaultNS: 'formatter', // O el namespace que uses más
    
    
    // Configuración adicional importante
    interpolation: {
      escapeValue: false
    }
  });

// Middleware wrapper para i18next
export const i18nMiddleware  = i18nextMiddleware.handle(i18next);
export default i18next;