import { z } from "zod";

// Schema para reingreso
const reingresoSchema = z.object({
  id_reingreso: z.number({
    required_error: "El ID del profesor es requerido",
    invalid_type_error: "El ID del profesor debe ser un número"
  }).int().positive("El ID del profesor debe ser un número positivo"),
  
  tipo_reingreso: z.enum(['REINGRESO', 'REINCORPORACION', 'REINTEGRO'], {
    required_error: "El tipo de reingreso es requerido",
    invalid_type_error: "Tipo de reingreso debe ser: REINGRESO, REINCORPORACION o REINTEGRO"
  }),
  
  motivo_reingreso: z.string({
    required_error: "El motivo de reingreso es requerido",
    invalid_type_error: "El motivo de reingreso debe ser un texto"
  })
  .min(10, "El motivo de reingreso debe tener al menos 10 caracteres")
  .max(1000, "El motivo de reingreso no puede exceder 1000 caracteres"),
  
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
  .default(null),
  
  registro_anterior_id: z.number({
    invalid_type_error: "El ID del registro anterior debe ser un número"
  })
  .int().positive("El ID del registro anterior debe ser un número positivo")
  .optional()
  .nullable()
  .default(null)
});

export default reingresoSchema;