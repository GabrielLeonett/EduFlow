import { z } from "zod";

const sedeSchema = z.object({
  nombre_sede: z
    .string({
      invalid_type_error: "El nombre de la sede debe ser un texto",
      required_error: "El nombre de la sede es obligatorio",
    })
    .min(3, {
      message: "El nombre de la sede debe tener al menos 3 caracteres",
    })
    .max(100, {
      message: "El nombre de la sede debe tener como máximo 100 caracteres",
    }),
  ubicacion_sede: z
    .string({
      invalid_type_error: "La ubicación de la sede debe ser un texto",
      required_error: "La ubicación de la sede es obligatoria",
    })
    .min(5, {
      message: "La ubicación de la sede debe tener al menos 5 caracteres",
    })
    .max(200, {
      message: "La ubicación de la sede debe tener como máximo 200 caracteres",
    }),
  google_sede: z
    .string({
      invalid_type_error: "El enlace de Google Maps debe ser un texto",
      required_error: "El enlace de Google Maps es obligatorio",
    })
    .url({ message: "El enlace de Google Maps debe ser una URL válida" })
    .max(300, {
      message: "El enlace de Google Maps debe tener como máximo 300 caracteres",
    }),
  ciudad_sede: z.enum(["Los Teques", "Carrizal", "San Antonio de los Altos"], {
    invalid_type_error:
      "La ciudad de la sede debe ser una de las opciones predefinidas",
    required_error: "La ciudad de la sede es obligatoria",
  }),
});

export default sedeSchema;