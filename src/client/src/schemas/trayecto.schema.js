import { z } from "zod";

const TrayectoSchema = z.object({
  descripcionTrayecto: z
    .string({
      invalid_type_error: "La descripción debe ser un texto",
      required_error: "La descripción es obligatoria",
    })
    .min(20, "La descripción debe tener al menos 20 caracteres")
    .max(500, "La descripción no puede exceder los 500 caracteres"),
});

export default TrayectoSchema;
