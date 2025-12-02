export default {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: {}, // No usar Babel, Node ya entiende ESM
  moduleFileExtensions: ["js", "json"],
};
