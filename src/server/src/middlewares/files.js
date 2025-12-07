import multer from "multer";
import path from "path";
import fs from "fs";
import config from "../config/index.js";

/**
 * Crea una carpeta recursivamente si no existe
 * @param {string} dirPath - Ruta del directorio a crear
 * @returns {void}
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Genera un nombre único para un archivo
 * @param {string} originalname - Nombre original del archivo
 * @param {boolean} [generateUnique=true] - Si debe generar nombre único
 * @returns {string} Nombre del archivo generado
 */
const generateUniqueFilename = (originalname, generateUnique = true) => {
  if (!generateUnique) {
    return originalname;
  }

  const timestamp = Date.now();
  const randomString = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  const fileExtension = path.extname(originalname);
  const baseName = path
    .basename(originalname, fileExtension)
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 50);

  return `${baseName}_${timestamp}_${randomString}${fileExtension}`;
};

/**
 * Opciones para configurar el middleware de upload
 * @typedef {Object} UploadOptions
 * @property {string} [destination="general"] - Carpeta destino (debe estar en config.files.destinations)
 * @property {string} [fileType="default"] - Tipo de archivo (image, document, video, default)
 * @property {number} [maxFiles=1] - Número máximo de archivos permitidos
 * @property {string} [fieldName="file"] - Nombre del campo en el formulario
 * @property {boolean} [useOriginalName=false] - Usar nombre original en lugar de generar uno único
 */

/**
 * Factory para crear middlewares de upload personalizados
 * @param {UploadOptions} options - Opciones de configuración del upload
 * @returns {multer.Middleware} Middleware de Multer configurado
 * @throws {Error} Si hay error en la configuración
 */
export const createUploader = (options = {}) => {
  const {
    destination = "general",
    fileType = "default",
    maxFiles = 1,
    fieldName = "file",
    useOriginalName = false,
  } = options;

  // Determinar ruta de destino
  const destFolder = config.files.destinations[destination] || destination;
  const uploadPath = path.join(config.files.basePath, destFolder);

  // Crear directorio si no existe
  ensureDirectoryExists(uploadPath);

  // Configurar storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const newFilename = generateUniqueFilename(
        file.originalname,
        config.files.validation.generateUniqueName && !useOriginalName
      );
      cb(null, newFilename);
    },
  });

  // Configurar filtro de archivos
  const fileFilter = (req, file, cb) => {
    const allowedTypes =
      config.files.allowedTypes[fileType] ||
      Object.values(config.files.allowedTypes).flat();
    const maxSize =
      config.files.maxSize[fileType] || config.files.maxSize.default;

    // Validar tipo MIME
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(
            ", "
          )}`
        ),
        false
      );
    }

    // Validar extensión
    const extname = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = allowedTypes.map(
      (type) => type.split("/")[1] || type.split("/")[0]
    );

    if (!allowedExtensions.some((ext) => extname.includes(ext))) {
      return cb(new Error(`Extensión de archivo no permitida`), false);
    }

    cb(null, true);
  };

  // Crear instancia de multer
  const multerInstance = multer({
    storage,
    limits: {
      fileSize:
        (config.files.maxSize[fileType] || config.files.maxSize.default) *
        1024 *
        1024,
      files: maxFiles,
    },
    fileFilter,
  });

  // Retornar middleware basado en el número de archivos
  if (maxFiles > 1) {
    return multerInstance.array(fieldName, maxFiles);
  }

  return multerInstance.single(fieldName);
};

/**
 * Middleware para manejar errores de upload de forma centralizada
 * @param {Error} err - Error capturado
 * @param {import('express').Request} req - Objeto Request de Express
 * @param {import('express').Response} res - Objeto Response de Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @returns {import('express').Response} Respuesta JSON con error
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Errores específicos de Multer
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          error: `El archivo es demasiado grande. Tamaño máximo: ${config.files.maxSize.default}MB`,
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          error: `Demasiados archivos. Máximo: ${config.files.validation.maxFiles}`,
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          error: "Campo de archivo inesperado",
        });
      default:
        return res.status(400).json({
          success: false,
          error: `Error al subir archivo: ${err.message}`,
        });
    }
  } else if (err) {
    // Otros errores
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  next();
};

/**
 * Objeto principal del middleware de upload
 * @namespace uploadMiddleware
 * @property {Function} createUploader - Factory para crear uploaders personalizados
 * @property {Function} handleUploadError - Middleware para manejar errores
 */
export default {
  createUploader,
  handleUploadError,
};