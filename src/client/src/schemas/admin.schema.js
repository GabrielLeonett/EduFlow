import { z } from "zod";
import userSchema from "./user.schema.js";

const rolSchema = z.object({
  id_rol: z.number({
    required_error: "El id del rol es requerido",
    invalid_type_error: "El id del rol debe ser un número",
  }),
  nombre_rol: z
    .string({
      required_error: "El nombre del rol es requerido",
      invalid_type_error: "El nombre del rol debe ser un texto",
    })
    .min(1, "El nombre del rol no puede estar vacío"),
});

const adminSchema = userSchema.extend({
  roles: rolSchema,
});

export default adminSchema; // ✅ Exporta adminSchema, no aulaSchema
