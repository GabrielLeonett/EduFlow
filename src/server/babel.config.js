export default {
  presets: [
    ["@babel/preset-env", {
      targets: {
        node: "current"
      },
      // IMPORTANTE: 'auto' para detectar automáticamente ES Modules
      modules: 'auto'
    }]
  ],
  // Plugin opcional para mejor compatibilidad
  plugins: [
    ["@babel/plugin-transform-modules-commonjs", {
      allowTopLevelThis: true
    }]
  ]
};