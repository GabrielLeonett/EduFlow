import { z } from "zod";
import userSchema from "./user.schema.js";

// Regex común para validación de texto
const textoRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.,()\-]+$/;
const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

// Esquema para Pre-Grados
export const preGradoSchema = z.object({
  id_pre_grado: z
    .number({
      invalid_type_error: "El ID del Pre-Grado debe ser un número",
      required_error: "El ID del Pre-Grado es obligatorio",
    })
    .positive("El ID del Pre-Grado debe ser un número positivo")
    .optional(),

  nombre_pre_grado: z
    .string({
      invalid_type_error: "El nombre del Pre-Grado debe ser texto",
      required_error: "El nombre del Pre-Grado es obligatorio",
    })
    .regex(textoRegex, {
      message:
        "El nombre del Pre-Grado solo puede contener letras, espacios y caracteres básicos",
    })
    .optional(),

  tipo_pre_grado: z
    .string({
      invalid_type_error: "El tipo del Pre-Grado debe ser texto",
      required_error: "El tipo del Pre-Grado es obligatorio",
    })
    .regex(soloLetrasRegex, {
      message: "El tipo del Pre-Grado solo puede contener letras y espacios",
    })
    .optional(),
});

// Esquema para Pos-Grados
export const posGradoSchema = z.object({
  id_pos_grado: z
    .number({
      invalid_type_error: "El ID del Pos-Grado debe ser un número",
      required_error: "El ID del Pos-Grado es obligatorio",
    })
    .positive("El ID del Pos-Grado debe ser un número positivo")
    .optional(),

  nombre_pos_grado: z
    .string({
      invalid_type_error: "El nombre del Pos-Grado debe ser texto",
      required_error: "El nombre del Pos-Grado es obligatorio",
    })
    .regex(textoRegex, {
      message:
        "El nombre del Pos-Grado solo puede contener letras, espacios y caracteres básicos",
    })
    .optional(),

  tipo_pos_grado: z
    .string({
      invalid_type_error: "El tipo del Pos-Grado debe ser texto",
      required_error: "El tipo del Pos-Grado es obligatorio",
    })
    .regex(soloLetrasRegex, {
      message: "El tipo del Pos-Grado solo puede contener letras y espacios",
    })
    .optional(),
});

// Esquema para Áreas de Conocimiento
export const areaConocimientoSchema = z.object({
  id_area_conocimiento: z
    .number({
      invalid_type_error: "El ID del Área de Conocimiento debe ser un número",
      required_error: "El ID del Área de Conocimiento es obligatorio",
    })
    .positive("El ID del Área de Conocimiento debe ser un número positivo")
    .optional(),

  nombre_area_conocimiento: z
    .string({
      invalid_type_error: "El área de conocimiento debe ser texto",
      required_error: "El área de conocimiento es obligatoria",
    })
    .regex(soloLetrasRegex, {
      message: "El área de conocimiento solo puede contener letras y espacios",
    })
    .optional(),
});

// Esquema para crear nueva Área de Conocimiento (sin ID)
export const nuevaAreaConocimientoSchema = z.object({
  area_conocimiento: z
    .string({
      invalid_type_error: "El área de conocimiento debe ser texto",
      required_error: "El área de conocimiento es obligatoria",
    })
    .min(1, "El área de conocimiento no puede estar vacía")
    .regex(soloLetrasRegex, {
      message: "El área de conocimiento solo puede contener letras y espacios",
    }),
});

// Esquema para crear nuevo Pregrado (sin ID)
export const nuevoPregradoSchema = z.object({
  nombre: z
    .string({
      invalid_type_error: "El nombre del Pre-Grado debe ser texto",
      required_error: "El nombre del Pre-Grado es obligatorio",
    })
    .min(1, "El nombre del Pre-Grado no puede estar vacío")
    .regex(textoRegex, {
      message:
        "El nombre del Pre-Grado solo puede contener letras, espacios y caracteres básicos",
    }),

  tipo: z
    .string({
      invalid_type_error: "El tipo del Pre-Grado debe ser texto",
      required_error: "El tipo del Pre-Grado es obligatorio",
    })
    .min(1, "El tipo del Pre-Grado no puede estar vacío")
    .regex(soloLetrasRegex, {
      message: "El tipo del Pre-Grado solo puede contener letras y espacios",
    }),
});

// Esquema para crear nuevo Posgrado (sin ID)
export const nuevoPosgradoSchema = z.object({
  nombre: z
    .string({
      invalid_type_error: "El nombre del Pos-Grado debe ser texto",
      required_error: "El nombre del Pos-Grado es obligatorio",
    })
    .min(1, "El nombre del Pos-Grado no puede estar vacío")
    .regex(textoRegex, {
      message:
        "El nombre del Pos-Grado solo puede contener letras, espacios y caracteres básicos",
    }),

  tipo: z
    .string({
      invalid_type_error: "El tipo del Pos-Grado debe ser texto",
      required_error: "El tipo del Pos-Grado es obligatorio",
    })
    .min(1, "El tipo del Pos-Grado no puede estar vacío")
    .regex(soloLetrasRegex, {
      message: "El tipo del Pos-Grado solo puede contener letras y espacios",
    }),
});

// Esquema principal para Profesores
export const profesorSchema = userSchema.extend({
  fecha_ingreso: z
    .string({
      required_error: "La fecha de ingreso es obligatoria",
      invalid_type_error: "La fecha de ingreso debe ser texto",
    })
    .regex(/^\d{2}-\d{2}-\d{4}$/, "La fecha debe tener el formato DD-MM-AAAA")
    .nonempty("La fecha de ingreso no puede estar vacía"),

  dedicacion: z.enum(
    ["Convencional", "Tiempo Completo", "Medio Tiempo", "Exclusivo"],
    {
      required_error: "La dedicación es obligatoria",
      invalid_type_error:
        "La dedicación debe ser: Convencional, Tiempo Completo, Medio Tiempo o Exclusivo",
    }
  ),

  categoria: z.enum(
    ["Instructor", "Asistente", "Asociado", "Agregado", "Titular"],
    {
      required_error: "La categoría es obligatoria",
      invalid_type_error:
        "La categoría debe ser: Instructor, Asistente, Asociado, Agregado o Titular",
    }
  ),

  areas_de_conocimiento: z
    .array(areaConocimientoSchema, {
      required_error: "Las areas de conocimiento son requeridas",
    })
    .nonempty("Debe tener al menos un area de conocimiento"),

  pre_grado: z
    .array(preGradoSchema, { required_error: "El Pre-Grado es requerido" })
    .nonempty("Debe tener al menos un Pre-grado"),

  pos_grado: z.array(posGradoSchema).optional(),
});
