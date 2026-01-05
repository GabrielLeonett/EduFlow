import { profesorSchema } from "./profesor.schema.js";
import z from "zod";

// Esquema principal para Coordinadores
const coordinadorSchema = profesorSchema.extend({
  id_pnf: z
    .number({
      invalid_type_error: "El ID del PNF debe ser un número",
      required_error: "El ID del PNF es obligatorio",
    })
    .positive("El ID del PNF debe ser un número positivo"),
});

export const asignarCoordinadorSchema = z.object({
  id_profesor: z
    .number({
      invalid_type_error: "Debe seleccionar un profesor válido",
      required_error: "El profesor es obligatorio",
    })
    .int(),

  id_pnf: z
    .number({
      invalid_type_error: "Debe seleccionar un PNF válido",
      required_error: "El PNF es obligatorio",
    })
    .int(),
});

export default coordinadorSchema;