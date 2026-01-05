// services/imageProcessing.service.js
import sharp from "sharp";
import { extname, join, parse } from "path";
import { existsSync, unlinkSync } from "fs";
import { access, stat } from "fs/promises";
import fs from "fs";

export default class ImagenService {
  constructor(storage) {
    this.storageImage = "src/uploads/" + storage;
  }

  async validateImage(originalName, options = {}) {
    try {
      console.log(`🔍 [validateImage] Validando imagen: ${originalName}`);
      const fullPath = join(this.storageImage, originalName);
      console.log(`🔍 [validateImage] Ruta completa: ${fullPath}`);

      try {
        await access(fullPath);
      } catch (accessError) {
        throw new Error(`El archivo no existe o no es accesible: ${fullPath}`);
      }

      if (!originalName || typeof originalName !== "string") {
        throw new Error("El nombre del archivo es requerido");
      }

      const fileExtension = extname(originalName).toLowerCase();
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(
          `Formato de archivo no permitido. Formatos aceptados: ${allowedExtensions.join(
            ", "
          )}`
        );
      }

      try {
        const metadata = await sharp(fullPath).metadata();
        const maxWidth = options.maxWidth || 5000;
        const maxHeight = options.maxHeight || 5000;

        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          throw new Error(
            `Las dimensiones de la imagen exceden el máximo permitido (${maxWidth}x${maxHeight})`
          );
        }

        if (!metadata.format) {
          throw new Error("El formato de imagen no es soportado");
        }
      } catch (sharpError) {
        if (
          sharpError.message.includes("unsupported image format") ||
          sharpError.message.includes(
            "Input file contains unsupported image format"
          )
        ) {
          throw new Error(
            "Formato de imagen no soportado. Use JPEG, JPG, PNG, WebP."
          );
        }
        throw sharpError;
      }

      const maxSize = options.maxSize || 10 * 1024 * 1024;
      const fileStats = await stat(fullPath);

      if (fileStats.size > maxSize) {
        throw new Error(
          `El archivo es demasiado grande. Tamaño máximo permitido: ${
            maxSize / 1024 / 1024
          }MB`
        );
      }

      if (options.width && (options.width < 1 || options.width > maxWidth)) {
        throw new Error(`El ancho debe estar entre 1 y ${maxWidth} píxeles`);
      }

      if (
        options.height &&
        (options.height < 1 || options.height > maxHeight)
      ) {
        throw new Error(`El alto debe estar entre 1 y ${maxHeight} píxeles`);
      }

      if (options.quality && (options.quality < 1 || options.quality > 100)) {
        throw new Error("La calidad debe estar entre 1 y 100");
      }

      if (options.format) {
        const allowedFormats = ["jpeg", "jpg", "png", "webp"];
        const formatLower = options.format.toLowerCase();

        if (!allowedFormats.includes(formatLower)) {
          throw new Error(
            `Formato de salida no permitido. Formatos aceptados: ${allowedFormats.join(
              ", "
            )}`
          );
        }
      }

      return {
        isValid: true,
        fileExtension,
        message: "Archivo válido para procesamiento",
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

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
      tempImagePath = fullInputPath; // Guardar referencia para limpieza

      // 2. Generar nombre único PARA LA IMAGEN PROCESADA
      let outputFormat = options.format ? options.format.toLowerCase() : "jpeg";
      if (outputFormat === "jpg") outputFormat = "jpeg";

      const fileExtension =
        outputFormat === "jpeg" ? ".jpg" : `.${outputFormat}`;
      const uniqueName = this.generateUniqueName(originalName);
      const fileName = uniqueName + fileExtension;
      const outputPath = join(this.storageImage, fileName);

      // 3. Configurar opciones de procesamiento
      const {
        width = 800,
        height = 600,
        quality = 80,
        fit = "inside",
        withoutEnlargement = true,
      } = options;

      let image = sharp(fullInputPath);

      // 4. Procesar la imagen
      image = image.resize(width, height, {
        fit,
        withoutEnlargement,
      });

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
          image = image.jpeg({ quality });
          outputFormat = "jpeg";
      }

      await image.toFile(outputPath);

      // 5. ELIMINAR LA IMAGEN ORIGINAL (la temporal)
      await this.deleteImage(originalName);
      tempImagePath = null; // Ya no necesitamos limpiar

      return {
        success: true,
        fileName: fileName, // ← Este es el nombre ÚNICO de la imagen procesada
        originalName: originalName, // ← Guardar el nombre original por si acaso
        outputPath: outputPath,
        format: outputFormat === "jpeg" ? "jpg" : outputFormat,
        dimensions: { width, height },
      };
    } catch (error) {
      // 6. Limpiar en caso de error
      if (tempImagePath) {
        try {
          await fs.promises.unlink(tempImagePath);
        } catch (deleteError) {
          console.error("Error limpiando imagen temporal:", deleteError);
        }
      }

      // 7. Manejar errores específicos de formato
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

      throw `Error procesando imagen: ${error.message}`;
    }
  }

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
      throw `Error eliminando imagen: ${error.message}`;
    }
  }

  // Método para obtener/leer una imagen
  async getImage(fileName, options = {}) {
    try {
      console.log(`🔍 [getImage] Buscando imagen: ${fileName}`);

      if (!fileName || typeof fileName !== "string") {
        throw {
          message:
            "El nombre del archivo es requerido y debe ser una cadena de texto",
          code: "INVALID_FILENAME",
          status: 400,
          details: { fileName },
        };
      }

      // Limpiar el nombre del archivo (remover path traversal attempts)
      const cleanFileName = fileName.replace(/\.\.\//g, "").replace(/\\/g, "");

      const filePath = join(this.storageImage, cleanFileName);

      // Verificar que el archivo existe
      try {
        await access(filePath);
      } catch (accessError) {
        throw {
          message: `La imagen no existe: ${cleanFileName}`,
          code: "IMAGE_NOT_FOUND",
          status: 404,
          details: {
            fileName: cleanFileName,
            filePath: filePath,
            storagePath: this.storageImage,
          },
        };
      }

      // Obtener estadísticas del archivo
      const fileStats = await stat(filePath);

      // Verificar que es un archivo válido
      if (!fileStats.isFile()) {
        throw {
          message: `La ruta especificada no es un archivo válido: ${cleanFileName}`,
          code: "INVALID_FILE",
          status: 400,
          details: { fileName: cleanFileName },
        };
      }

      // Verificar tamaño del archivo (máximo 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (fileStats.size > MAX_FILE_SIZE) {
        throw {
          message: `La imagen es demasiado grande: ${(
            fileStats.size /
            1024 /
            1024
          ).toFixed(2)}MB (máximo 10MB)`,
          code: "FILE_TOO_LARGE",
          status: 400,
          details: {
            fileName: cleanFileName,
            fileSize: fileStats.size,
            maxSize: MAX_FILE_SIZE,
          },
        };
      }

      if (fileStats.size === 0) {
        throw {
          message: `La imagen está vacía: ${cleanFileName}`,
          code: "EMPTY_FILE",
          status: 400,
          details: { fileName: cleanFileName },
        };
      }

      // Leer el archivo como buffer
      const imageBuffer = await fs.promises.readFile(filePath);

      // Verificar que el buffer no esté vacío
      if (!imageBuffer || imageBuffer.length === 0) {
        throw {
          message: `No se pudo leer la imagen: ${cleanFileName}`,
          code: "FILE_READ_ERROR",
          status: 500,
          details: { fileName: cleanFileName },
        };
      }

      // Validar que sea una imagen válida usando Sharp
      let metadata;
      try {
        metadata = await sharp(imageBuffer).metadata();
      } catch (sharpError) {
        throw {
          message: `El archivo no es una imagen válida: ${cleanFileName}`,
          code: "INVALID_IMAGE_FORMAT",
          status: 400,
          details: {
            fileName: cleanFileName,
            originalError: sharpError.message,
          },
        };
      }

      // Validar formatos soportados
      const supportedFormats = [
        "jpeg",
        "jpg",
        "png",
        "webp",
        "gif",
        "tiff",
        "avif",
        "heif",
      ];
      if (!supportedFormats.includes(metadata.format)) {
        throw {
          message: `Formato de imagen no soportado: ${metadata.format}`,
          code: "UNSUPPORTED_FORMAT",
          status: 400,
          details: {
            fileName: cleanFileName,
            format: metadata.format,
            supportedFormats: supportedFormats,
          },
        };
      }

      // Si se solicitan opciones de procesamiento, procesar la imagen
      if (Object.keys(options).length > 0) {
        const {
          width,
          height,
          quality = 80,
          format,
          fit = "inside",
          withoutEnlargement = true,
        } = options;


        // Validar opciones de procesamiento
        if (width && (width < 1 || width > 10000)) {
          throw {
            message: "El ancho debe estar entre 1 y 10000 píxeles",
            code: "INVALID_WIDTH",
            status: 400,
            details: { width },
          };
        }

        if (height && (height < 1 || height > 10000)) {
          throw {
            message: "El alto debe estar entre 1 y 10000 píxeles",
            code: "INVALID_HEIGHT",
            status: 400,
            details: { height },
          };
        }

        if (quality < 1 || quality > 100) {
          throw {
            message: "La calidad debe estar entre 1 y 100",
            code: "INVALID_QUALITY",
            status: 400,
            details: { quality },
          };
        }

        let processedImage = sharp(imageBuffer);

        // Aplicar resize si se especifica
        if (width || height) {
          processedImage = processedImage.resize(width, height, {
            fit,
            withoutEnlargement,
          });
        }

        // Aplicar formato si se especifica
        let outputFormat = format ? format.toLowerCase() : metadata.format;
        if (outputFormat === "jpg") outputFormat = "jpeg";

        // Validar formato de salida
        if (!supportedFormats.includes(outputFormat)) {
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

        try {
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
            case "gif":
              processedImage = processedImage.gif();
              break;
            case "tiff":
              processedImage = processedImage.tiff({ quality });
              break;
            case "avif":
              processedImage = processedImage.avif({ quality });
              break;
            case "heif":
              processedImage = processedImage.heif({ quality });
              break;
            default:
              outputFormat = metadata.format;
          }

          const processedBuffer = await processedImage.toBuffer();
          const processedMetadata = await sharp(processedBuffer).metadata();

          console.log(`✅ Imagen procesada exitosamente: ${cleanFileName}`);

          return {
            success: true,
            buffer: processedBuffer,
            metadata: processedMetadata,
            fileName: cleanFileName,
            fileSize: processedBuffer.length,
            mimeType: this.getMimeType(
              outputFormat === "jpeg" ? "jpg" : outputFormat
            ),
            format: outputFormat === "jpeg" ? "jpg" : outputFormat,
            dimensions: {
              width: processedMetadata.width,
              height: processedMetadata.height,
            },
            processed: true,
            originalSize: fileStats.size,
            compressionRatio: `${(
              (1 - processedBuffer.length / fileStats.size) *
              100
            ).toFixed(1)}%`,
          };
        } catch (processingError) {
          throw {
            message: `Error al procesar la imagen: ${processingError.message}`,
            code: "IMAGE_PROCESSING_ERROR",
            status: 500,
            details: {
              fileName: cleanFileName,
              originalError: processingError.message,
            },
          };
        }
      }

      // Retornar imagen original sin procesar
      console.log(`✅ Imagen obtenida exitosamente: ${cleanFileName}`);

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
      };
    } catch (error) {
      console.error(`💥 Error en getImage:`, error);

      // Si el error ya está formateado, re-lanzarlo
      if (error.code && error.status) {
        throw error;
      }

      // Si es un error genérico, formatearlo
      throw {
        message: error.message || "Error desconocido al obtener la imagen",
        code: "IMAGE_SERVICE_ERROR",
        status: 500,
        details: {
          fileName: fileName,
          originalError: error.message,
        },
      };
    }
  }

  // Método auxiliar para obtener MIME type
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
