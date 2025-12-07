// services/imageProcessing.service.js
import sharp from "sharp";
import { extname, join, parse } from "path";
import { existsSync, unlinkSync } from "fs";
import { access, stat } from "fs/promises";
import fs from "fs";
import config from "../config/index.js";

export default class ImagenService {
  constructor(storage = "") {
    // Usar config.files para construir el path de almacenamiento
    this.storageImage = config.files.basePath || "./src/uploads";
    
    // Si se especifica un storage adicional, añadirlo al path
    if (storage) {
      this.storageImage = join(this.storageImage, storage);
    }
    
    console.log(`📁 ImagenService configurado con path: ${this.storageImage}`);
    
    // Crear directorio si no existe
    this.ensureStorageDirectory();
  }

  /**
   * Asegura que el directorio de almacenamiento exista
   * @private
   */
  ensureStorageDirectory() {
    try {
      if (!existsSync(this.storageImage)) {
        fs.mkdirSync(this.storageImage, { recursive: true });
        console.log(`✅ Directorio creado: ${this.storageImage}`);
      }
    } catch (error) {
      console.error(`❌ Error creando directorio: ${error.message}`);
      throw new Error(`No se pudo crear el directorio de almacenamiento: ${this.storageImage}`);
    }
  }

  /**
   * Valida una imagen antes de procesarla
   * @param {string} originalName - Nombre del archivo original
   * @param {Object} options - Opciones de validación
   * @returns {Promise<Object>} Resultado de la validación
   */
  async validateImage(originalName, options = {}) {
    try {
      console.log(`🔍 [validateImage] Validando imagen: ${originalName}`);
      const fullPath = join(this.storageImage, originalName);
      console.log(`🔍 [validateImage] Ruta completa: ${fullPath}`);

      // Validar existencia del archivo
      try {
        await access(fullPath);
      } catch (accessError) {
        throw new Error(`El archivo no existe o no es accesible: ${fullPath}`);
      }

      // Validar nombre del archivo
      if (!originalName || typeof originalName !== "string") {
        throw new Error("El nombre del archivo es requerido");
      }

      // Validar extensión del archivo
      const fileExtension = extname(originalName).toLowerCase();
      const allowedExtensions = this.getAllowedExtensions(options.fileType);
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(
          `Formato de archivo no permitido. Formatos aceptados: ${allowedExtensions.join(", ")}`
        );
      }

      // Obtener metadata de la imagen con Sharp
      let metadata;
      try {
        metadata = await sharp(fullPath).metadata();
      } catch (sharpError) {
        if (
          sharpError.message.includes("unsupported image format") ||
          sharpError.message.includes("Input file contains unsupported image format")
        ) {
          throw new Error(
            "Formato de imagen no soportado. Use JPEG, JPG, PNG, WebP."
          );
        }
        throw sharpError;
      }

      // Validar dimensiones máximas
      const maxWidth = options.maxWidth || this.getMaxDimension('width', options.fileType);
      const maxHeight = options.maxHeight || this.getMaxDimension('height', options.fileType);

      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        throw new Error(
          `Las dimensiones de la imagen exceden el máximo permitido (${maxWidth}x${maxHeight})`
        );
      }

      // Validar formato de metadata
      if (!metadata.format) {
        throw new Error("El formato de imagen no es soportado");
      }

      // Validar tamaño del archivo
      const maxSize = options.maxSize || this.getMaxSize(options.fileType);
      const fileStats = await stat(fullPath);

      if (fileStats.size > maxSize) {
        throw new Error(
          `El archivo es demasiado grande. Tamaño máximo permitido: ${this.formatFileSize(maxSize)}`
        );
      }

      // Validaciones adicionales de opciones
      this.validateOptions(options, maxWidth, maxHeight);

      return {
        isValid: true,
        fileExtension,
        metadata,
        fileSize: fileStats.size,
        message: "Archivo válido para procesamiento",
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Procesa y guarda una imagen
   * @param {string} originalName - Nombre del archivo original
   * @param {Object} options - Opciones de procesamiento
   * @returns {Promise<Object>} Información de la imagen procesada
   */
  async processAndSaveImage(originalName, options = {}) {
    let tempImagePath = null;
    console.log(`🔄 [processAndSaveImage] Procesando imagen: ${originalName}`);
    
    try {
      // 1. Validar la imagen primero
      const validation = await this.validateImage(originalName, options);

      if (!validation.isValid) {
        throw new Error(validation.error || "Error de validación desconocido");
      }

      const fullInputPath = join(this.storageImage, originalName);
      tempImagePath = fullInputPath;

      // 2. Determinar formato de salida
      let outputFormat = options.format ? options.format.toLowerCase() : "jpeg";
      if (outputFormat === "jpg") outputFormat = "jpeg";

      // Validar formato de salida
      const allowedOutputFormats = this.getAllowedFormats(options.fileType);
      if (!allowedOutputFormats.includes(outputFormat) && outputFormat !== "jpeg") {
        throw new Error(`Formato de salida no permitido: ${outputFormat}`);
      }

      const fileExtension = outputFormat === "jpeg" ? ".jpg" : `.${outputFormat}`;
      const uniqueName = this.generateUniqueName(originalName);
      const fileName = uniqueName + fileExtension;
      const outputPath = join(this.storageImage, fileName);

      // 3. Configurar opciones de procesamiento
      const {
        width = 800,
        height = 600,
        quality = this.getDefaultQuality(outputFormat),
        fit = "inside",
        withoutEnlargement = true,
      } = options;

      let image = sharp(fullInputPath);

      // 4. Procesar la imagen
      image = image.resize(width, height, {
        fit,
        withoutEnlargement,
      });

      // Aplicar configuraciones específicas del formato
      switch (outputFormat) {
        case "jpeg":
          image = image.jpeg({ quality, mozjpeg: true });
          break;
        case "png":
          image = image.png({ compressionLevel: Math.floor(quality / 10) });
          break;
        case "webp":
          image = image.webp({ quality, lossless: quality === 100 });
          break;
        default:
          // Si no es un formato soportado, usar JPEG como fallback
          outputFormat = "jpeg";
          image = image.jpeg({ quality: 80 });
      }

      await image.toFile(outputPath);

      // 5. Eliminar la imagen original si está configurado
      if (config.files.deleteOriginalAfterProcess || options.deleteOriginal) {
        await this.deleteImage(originalName);
        console.log(`🗑️ Imagen original eliminada: ${originalName}`);
      }
      tempImagePath = null;

      // 6. Obtener metadata de la imagen procesada
      const processedMetadata = await sharp(outputPath).metadata();
      const processedStats = await stat(outputPath);

      return {
        success: true,
        fileName: fileName,
        originalName: originalName,
        outputPath: outputPath,
        format: outputFormat === "jpeg" ? "jpg" : outputFormat,
        dimensions: { 
          width: processedMetadata.width, 
          height: processedMetadata.height 
        },
        fileSize: processedStats.size,
        mimeType: this.getMimeType(outputFormat === "jpeg" ? "jpg" : outputFormat),
        compressionRatio: validation.fileSize ? 
          `${((1 - processedStats.size / validation.fileSize) * 100).toFixed(1)}%` : null,
        storagePath: this.storageImage,
      };
    } catch (error) {
      // Limpieza en caso de error
      if (tempImagePath) {
        try {
          await fs.promises.unlink(tempImagePath);
        } catch (deleteError) {
          console.error("Error limpiando imagen temporal:", deleteError);
        }
      }

      // Manejar errores específicos de formato
      if (
        error.message.includes("unsupported image format") ||
        error.message.includes("Input file contains unsupported image format")
      ) {
        return await this.convertToSupportedFormat(
          tempImagePath,
          originalName,
          options
        );
      }

      throw new Error(`Error procesando imagen: ${error.message}`);
    }
  }

  /**
   * Obtiene una imagen
   * @param {string} fileName - Nombre del archivo
   * @param {Object} options - Opciones de procesamiento
   * @returns {Promise<Object>} Imagen procesada o original
   */
  async getImage(fileName, options = {}) {
    try {
      console.log(`🔍 [getImage] Buscando imagen: ${fileName}`);

      // Validar nombre del archivo
      if (!fileName || typeof fileName !== "string") {
        throw {
          message: "El nombre del archivo es requerido y debe ser una cadena de texto",
          code: "INVALID_FILENAME",
          status: 400,
          details: { fileName },
        };
      }

      // Limpiar el nombre del archivo
      const cleanFileName = this.sanitizeFileName(fileName);
      const filePath = join(this.storageImage, cleanFileName);

      // Verificar existencia del archivo
      await this.validateFileExists(filePath, cleanFileName);

      // Obtener estadísticas del archivo
      const fileStats = await stat(filePath);

      // Validar tamaño del archivo
      const maxSize = this.getMaxSize(options.fileType);
      if (fileStats.size > maxSize) {
        throw {
          message: `La imagen es demasiado grande: ${this.formatFileSize(fileStats.size)} (máximo ${this.formatFileSize(maxSize)})`,
          code: "FILE_TOO_LARGE",
          status: 400,
          details: {
            fileName: cleanFileName,
            fileSize: fileStats.size,
            maxSize: maxSize,
          },
        };
      }

      // Leer el archivo
      const imageBuffer = await fs.promises.readFile(filePath);

      if (!imageBuffer || imageBuffer.length === 0) {
        throw {
          message: `No se pudo leer la imagen: ${cleanFileName}`,
          code: "FILE_READ_ERROR",
          status: 500,
          details: { fileName: cleanFileName },
        };
      }

      // Obtener metadata
      const metadata = await this.getImageMetadata(imageBuffer, cleanFileName);

      // Procesar imagen si se especifican opciones
      if (Object.keys(options).length > 0) {
        return await this.processImageForResponse(imageBuffer, metadata, cleanFileName, options);
      }

      // Retornar imagen original
      return {
        success: true,
        buffer: imageBuffer,
        metadata: metadata,
        fileName: cleanFileName,
        fileSize: fileStats.size,
        mimeType: this.getMimeType(metadata.format),
        format: metadata.format,
        dimensions: {
          width: metadata.width,
          height: metadata.height,
        },
        processed: false,
        storagePath: this.storageImage,
      };
    } catch (error) {
      console.error(`💥 Error en getImage:`, error);
      throw this.formatError(error, fileName);
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Obtiene las extensiones permitidas según el tipo de archivo
   * @private
   */
  getAllowedExtensions(fileType = 'image') {
    const extensionMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    if (fileType === 'document') {
      return ['.pdf', '.doc', '.docx', '.txt'];
    }

    return Object.keys(extensionMap);
  }

  /**
   * Obtiene los formatos permitidos según el tipo de archivo
   * @private
   */
  getAllowedFormats(fileType = 'image') {
    const formats = ['jpeg', 'jpg', 'png', 'webp'];
    
    if (fileType === 'image' && config.files.allowedTypes?.image) {
      return config.files.allowedTypes.image
        .map(type => type.split('/')[1])
        .filter(Boolean);
    }
    
    return formats;
  }

  /**
   * Obtiene el tamaño máximo permitido según el tipo de archivo
   * @private
   */
  getMaxSize(fileType = 'image') {
    if (fileType === 'document' && config.files.maxSize?.document) {
      return config.files.maxSize.document * 1024 * 1024;
    }
    
    if (fileType === 'image' && config.files.maxSize?.image) {
      return config.files.maxSize.image * 1024 * 1024;
    }
    
    return (config.files.maxSize?.default || 5) * 1024 * 1024;
  }

  /**
   * Obtiene la dimensión máxima permitida
   * @private
   */
  getMaxDimension(dimension, fileType = 'image') {
    const defaults = {
      width: 5000,
      height: 5000,
    };
    
    return defaults[dimension] || 5000;
  }

  /**
   * Obtiene la calidad por defecto según el formato
   * @private
   */
  getDefaultQuality(format) {
    const qualityMap = {
      'jpeg': 80,
      'jpg': 80,
      'png': 90,
      'webp': 85,
    };
    
    return qualityMap[format] || 80;
  }

  /**
   * Valida las opciones de procesamiento
   * @private
   */
  validateOptions(options, maxWidth, maxHeight) {
    if (options.width && (options.width < 1 || options.width > maxWidth)) {
      throw new Error(`El ancho debe estar entre 1 y ${maxWidth} píxeles`);
    }

    if (options.height && (options.height < 1 || options.height > maxHeight)) {
      throw new Error(`El alto debe estar entre 1 y ${maxHeight} píxeles`);
    }

    if (options.quality && (options.quality < 1 || options.quality > 100)) {
      throw new Error("La calidad debe estar entre 1 y 100");
    }

    if (options.format) {
      const allowedFormats = this.getAllowedFormats(options.fileType);
      const formatLower = options.format.toLowerCase();

      if (!allowedFormats.includes(formatLower) && formatLower !== 'jpeg') {
        throw new Error(
          `Formato de salida no permitido. Formatos aceptados: ${allowedFormats.join(", ")}`
        );
      }
    }
  }

  /**
   * Sanitiza el nombre del archivo
   * @private
   */
  sanitizeFileName(fileName) {
    return fileName
      .replace(/\.\.\//g, "")
      .replace(/\\/g, "")
      .replace(/\//g, "")
      .trim();
  }

  /**
   * Valida que un archivo exista
   * @private
   */
  async validateFileExists(filePath, fileName) {
    try {
      await access(filePath);
    } catch (accessError) {
      throw {
        message: `La imagen no existe: ${fileName}`,
        code: "IMAGE_NOT_FOUND",
        status: 404,
        details: {
          fileName: fileName,
          filePath: filePath,
          storagePath: this.storageImage,
        },
      };
    }
  }

  /**
   * Obtiene metadata de una imagen
   * @private
   */
  async getImageMetadata(imageBuffer, fileName) {
    try {
      return await sharp(imageBuffer).metadata();
    } catch (sharpError) {
      throw {
        message: `El archivo no es una imagen válida: ${fileName}`,
        code: "INVALID_IMAGE_FORMAT",
        status: 400,
        details: {
          fileName: fileName,
          originalError: sharpError.message,
        },
      };
    }
  }

  /**
   * Procesa una imagen para respuesta
   * @private
   */
  async processImageForResponse(imageBuffer, metadata, fileName, options) {
    const {
      width,
      height,
      quality = this.getDefaultQuality(metadata.format),
      format,
      fit = "inside",
      withoutEnlargement = true,
    } = options;

    // Validar opciones
    this.validateOptions(options, this.getMaxDimension('width'), this.getMaxDimension('height'));

    let processedImage = sharp(imageBuffer);

    // Aplicar resize si se especifica
    if (width || height) {
      processedImage = processedImage.resize(width, height, {
        fit,
        withoutEnlargement,
      });
    }

    // Determinar formato de salida
    let outputFormat = format ? format.toLowerCase() : metadata.format;
    if (outputFormat === "jpg") outputFormat = "jpeg";

    // Validar formato de salida
    const supportedFormats = this.getAllowedFormats(options.fileType);
    if (!supportedFormats.includes(outputFormat) && outputFormat !== "jpeg") {
      throw {
        message: `Formato de salida no soportado: ${outputFormat}`,
        code: "UNSUPPORTED_OUTPUT_FORMAT",
        status: 400,
        details: {
          outputFormat,
          supportedFormats: supportedFormats,
        },
      };
    }

    // Aplicar formato
    switch (outputFormat) {
      case "jpeg":
        processedImage = processedImage.jpeg({ quality, mozjpeg: true });
        break;
      case "png":
        processedImage = processedImage.png({
          compressionLevel: Math.floor((100 - quality) / 10),
        });
        break;
      case "webp":
        processedImage = processedImage.webp({
          quality,
          lossless: quality === 100,
        });
        break;
      default:
        outputFormat = metadata.format;
    }

    const processedBuffer = await processedImage.toBuffer();
    const processedMetadata = await sharp(processedBuffer).metadata();

    return {
      success: true,
      buffer: processedBuffer,
      metadata: processedMetadata,
      fileName: fileName,
      fileSize: processedBuffer.length,
      mimeType: this.getMimeType(outputFormat === "jpeg" ? "jpg" : outputFormat),
      format: outputFormat === "jpeg" ? "jpg" : outputFormat,
      dimensions: {
        width: processedMetadata.width,
        height: processedMetadata.height,
      },
      processed: true,
      originalSize: imageBuffer.length,
      compressionRatio: `${((1 - processedBuffer.length / imageBuffer.length) * 100).toFixed(1)}%`,
      storagePath: this.storageImage,
    };
  }

  /**
   * Formatea un error
   * @private
   */
  formatError(error, fileName) {
    if (error.code && error.status) {
      return error;
    }

    return {
      message: error.message || "Error desconocido al obtener la imagen",
      code: "IMAGE_SERVICE_ERROR",
      status: 500,
      details: {
        fileName: fileName,
        originalError: error.message,
      },
    };
  }

  /**
   * Formatea el tamaño del archivo
   * @private
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ========== MÉTODOS PÚBLICOS ==========

  async convertToSupportedFormat(inputPath, originalName, options = {}) {
    const uniqueName = this.generateUniqueName(originalName);
    const fileName = `${uniqueName}.jpg`;
    const outputPath = join(this.storageImage, fileName);

    const {
      width = 800,
      height = 600,
      quality = 80,
      fit = "inside",
      withoutEnlargement = true,
    } = options;

    try {
      await sharp(inputPath)
        .resize(width, height, { fit, withoutEnlargement })
        .jpeg({ quality, mozjpeg: true })
        .toFile(outputPath);

      return {
        success: true,
        fileName: fileName,
        outputPath: outputPath,
        format: "jpg",
        dimensions: { width, height },
        converted: true,
        message: "Imagen convertida a JPG por formato no soportado",
      };
    } catch (error) {
      throw new Error(`Error convirtiendo imagen: ${error.message}`);
    }
  }

  generateUniqueName(originalName) {
    const nameWithoutExt = parse(originalName).name;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "-");
    return `${cleanName}-${timestamp}-${random}`;
  }

  async deleteImage(fileName) {
    try {
      const filePath = join(this.storageImage, fileName);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        return { success: true, message: "Imagen eliminada correctamente" };
      }
      throw { success: false, message: "La imagen no existe" };
    } catch (error) {
      throw new Error(`Error eliminando imagen: ${error.message}`);
    }
  }

  getMimeType(format) {
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      tiff: "image/tiff",
      avif: "image/avif",
      heif: "image/heif",
    };
    return mimeTypes[format.toLowerCase()] || "application/octet-stream";
  }
}