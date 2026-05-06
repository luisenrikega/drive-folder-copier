/**
 * i18n — Lightweight internationalization for Drive Folder Copier
 * Auto-detects browser language. Falls back to English.
 */

const translations = {
  es: {
    // Header
    appTitle: 'Drive Copier',
    subtitle: 'Copia carpetas con elegancia',

    // Input
    inputLabel: 'URL o ID de la Carpeta',
    inputPlaceholder: 'Pega el enlace aquí...',

    // Buttons
    startCopy: 'Iniciar Copia',
    copying: 'Copiando...',
    newCopy: 'Nueva Copia',
    connect: 'Conectar',
    disconnect: 'Salir',

    // Auth
    connected: 'Conectado',
    notConnected: 'No conectado',

    // Status messages
    preparing: 'Preparando...',
    verifyingSession: 'Verificando sesión...',
    analyzingFolder: 'Analizando carpeta...',
    verifyingPermissions: 'Verificando permisos...',
    creatingRoot: 'Creando carpeta raíz...',
    copyingContent: 'Copiando contenido...',
    copyingProgress: 'Copiando ({current}/{total}): {name}',
    completedSuccess: '¡Completado con éxito!',
    copyFinished: 'Copia Finalizada',
    folderCreated: 'La carpeta "{name}" se ha creado.',
    copyError: 'Error en la copia',
    criticalError: 'Error crítico: {message}',

    // Errors
    notAFolder: 'El ID proporcionado no corresponde a una carpeta.',
    sessionExpired: 'Sesión expirada. Por favor, reintenta.',
    driveApiError: 'Error en la API de Drive',
    enterUrl: 'Por favor, introduce una URL o ID de carpeta.',
    invalidId: 'ID de carpeta no válido.',
    alreadyRunning: 'Ya hay una copia en curso.',
    authError: 'Error: {message}',
  },

  en: {
    // Header
    appTitle: 'Drive Copier',
    subtitle: 'Copy folders with style',

    // Input
    inputLabel: 'Folder URL or ID',
    inputPlaceholder: 'Paste the link here...',

    // Buttons
    startCopy: 'Start Copy',
    copying: 'Copying...',
    newCopy: 'New Copy',
    connect: 'Connect',
    disconnect: 'Disconnect',

    // Auth
    connected: 'Connected',
    notConnected: 'Not connected',

    // Status messages
    preparing: 'Preparing...',
    verifyingSession: 'Verifying session...',
    analyzingFolder: 'Analyzing folder...',
    verifyingPermissions: 'Verifying permissions...',
    creatingRoot: 'Creating root folder...',
    copyingContent: 'Copying content...',
    copyingProgress: 'Copying ({current}/{total}): {name}',
    completedSuccess: 'Completed successfully!',
    copyFinished: 'Copy Finished',
    folderCreated: 'Folder "{name}" has been created.',
    copyError: 'Copy Error',
    criticalError: 'Critical error: {message}',

    // Errors
    notAFolder: 'The provided ID does not correspond to a folder.',
    sessionExpired: 'Session expired. Please try again.',
    driveApiError: 'Drive API error',
    enterUrl: 'Please enter a folder URL or ID.',
    invalidId: 'Invalid folder ID.',
    alreadyRunning: 'A copy is already in progress.',
    authError: 'Error: {message}',
  }
};

// Detect language: Spanish if browser starts with 'es', else English
const detectedLang = (typeof navigator !== 'undefined' && navigator.language || 'en').startsWith('es') ? 'es' : 'en';
const currentLang = detectedLang;

/**
 * Get a translated string by key.
 * Supports placeholders like {name}, {current}, {total}, {message}.
 * @param {string} key - Translation key
 * @param {Object} [params] - Replacement values
 * @returns {string}
 */
function t(key, params = {}) {
  let str = (translations[currentLang] && translations[currentLang][key])
    || (translations['en'] && translations['en'][key])
    || key;

  for (const [k, v] of Object.entries(params)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}

// Export for both window (popup) and service worker (background)
if (typeof window !== 'undefined') {
  window.t = t;
  window.currentLang = currentLang;
} else {
  self.t = t;
  self.currentLang = currentLang;
}
