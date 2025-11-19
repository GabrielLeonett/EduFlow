import { z } from "zod";

// Schema corregido
const destitucionSchema = z.object({
  id_usuario: z.number({
    required_error: "El ID del usuario es requerido",
    invalid_type_error: "El ID del usuario debe ser un número"
  }).int().positive("El ID del usuario debe ser un número positivo"),
  
  tipo_accion: z.enum(['DESTITUCION', 'ELIMINACION', 'RENUNCIA', 'RETIRO'], {
    required_error: "El tipo de acción es requerido",
    invalid_type_error: "Tipo de acción debe ser: DESTITUCION, ELIMINACION, RENUNCIA o RETIRO"
  }),
  
  razon: z.string({
    required_error: "La razón es requerida",
    invalid_type_error: "La razón debe ser un texto"
  })
  .min(10, "La razón debe tener al menos 10 caracteres")
  .max(1000, "La razón no puede exceder 1000 caracteres"),
  
  observaciones: z.string({
    invalid_type_error: "Las observaciones deben ser un texto"
  })
  .max(2000, "Las observaciones no pueden exceder 2000 caracteres")
  .optional()
  .nullable()
  .default(null),
  
  fecha_efectiva: z.string({
    invalid_type_error: "La fecha efectiva debe ser un texto"
  })
  .regex(/^\d{2}-\d{2}-\d{4}$/, "Formato de fecha inválido (DD-MM-YYYY)")
  .optional()
  .nullable()
  .default(null)
});

export default destitucionSchema;