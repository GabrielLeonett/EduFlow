// frontend-server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createFrontendServer() {
  const app = express();

  // Buscar build de React
  const possiblePaths = [
    path.resolve(__dirname, "../client/dist"),
    path.resolve(__dirname, "../../client/dist"),
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(process.cwd(), "dist"),
  ];

  let buildPath = null;

  for (const possiblePath of possiblePaths) {
    if (
      fs.existsSync(possiblePath) &&
      fs.existsSync(path.join(possiblePath, "index.html"))
    ) {
      buildPath = possiblePath;
      console.log(`✅ Encontrada build de React en: ${buildPath}`);
      break;
    }
  }

  if (!buildPath) {
    console.error("❌ ERROR: No se encontró la build de React");
    console.error(
      "⚠️  Ejecuta 'npm run build' en el proyecto de React primero"
    );
    process.exit(1);
  }

  // Servir archivos estáticos
  app.use(
    express.static(buildPath, {
      maxAge: "1y",
      etag: true,
    })
  );

  app.use((req, res, next) => {
    // Verificar si ya es un archivo estático
    const staticExtensions = [".js", ".css", ".jpg" /* ... */];
    const hasExtension = staticExtensions.some((ext) =>
      req.path.toLowerCase().endsWith(ext)
    );

    if (hasExtension) {
      // Si es archivo estático, Express.static ya lo manejó
      return next();
    }

    // Cualquier otra ruta → index.html
    res.sendFile(path.join(buildPath, "index.html"));
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      service: "frontend",
      buildPath: buildPath,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export function startServerFrontend(port = 3000) {
  const app = createFrontendServer();

  app.listen(port, () => {
    console.log("=".repeat(50));
    console.log(`🚀 Frontend corriendo en: http://localhost:${port}`);
    console.log(`📁 Sirviendo desde: ${app.locals.buildPath || "build"}`);
    console.log(`🔧 Modo: ${process.env.NODE_ENV || "production"}`);
    console.log(`📊 Health: http://localhost:${port}/health`);
    console.log("=".repeat(50));
  });

  return app;
}
