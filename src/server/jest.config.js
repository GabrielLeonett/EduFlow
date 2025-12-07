export default {
  testEnvironment: "node",
  
  // OPCIÓN A: Si quieres usar Babel (RECOMENDADO)
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  
  // OPCIÓN B: Si NO quieres Babel
  // transform: {},
  // extensionsToTreatAsEsm: ['.js'],
  
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
    "!src/docs/**/*",  // Excluye docs con errores
    "!__tests__/**/*"   // Excluye los tests mismos
  ],
  
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"],
  
  testMatch: [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  
  // Excluye archivos con errores de cobertura
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/docs/",
    "/__tests__/"
  ],
  
  // Configuración específica para ES Modules
  moduleFileExtensions: ['js', 'json'],

  // INDICA explícitamente que .js son ES Modules
  extensionsToTreatAsEsm: ['.js'],
  
  // Para versiones de Node < 20
  runner: "jest-runner"
};