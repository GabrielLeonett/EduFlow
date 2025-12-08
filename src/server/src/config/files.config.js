export default function filesConfig(env) {
  return {
    // Rutas base
    basePath: env.PATH_FILES || 'src/uploads',
    tempPath: env.PATH_TEMP_FILES || 'src/uploads/temp',
    
    // Tamaños límite (en MB)
    maxSize: {
      image: parseInt(env.MAX_SIZE_IMAGE_FILES) || 5,
      document: parseInt(env.MAX_SIZE_DOCUMENT_FILES) || 10,
      video: parseInt(env.MAX_SIZE_VIDEO_FILES) || 50,
      default: parseInt(env.MAX_SIZE_FILES) || 5,
    },
    
    // Tipos permitidos
    allowedTypes: {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'],
      document: ['application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'],
      video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    },
    
    // Configuración por destino
    destinations: {
      profesores: 'profesores',
      estudiantes: 'estudiantes',
      cursos: 'cursos',
      general: 'general',
    },
    
    // Validación adicional
    validation: {
      maxFiles: parseInt(env.MAX_FILES_UPLOAD) || 10,
      generateUniqueName: env.GENERATE_UNIQUE_NAME !== 'false',
    }
  };
}