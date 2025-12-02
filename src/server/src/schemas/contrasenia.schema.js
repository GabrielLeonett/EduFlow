import z from "zod";

const contraseniaSchema = z.object({
  antigua_password: z
    .string({
      required_error: "La contraseña es requerida",
      invalid_type_error: "La contraseña debe ser texto",
    })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(40, "La contraseña no puede exceder 40 caracteres")
    .regex(/[a-zA-Z]/, "La contraseña debe contener al menos una letra")
    .regex(/\d/, "La contraseña debe contener al menos un número")
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+=[\]{};':"|,.<>/?-]*$/, "La contraseña solo puede contener caracteres alfanuméricos y símbolos especiales")
    .nonempty("La contraseña no puede estar vacía"),

  password: z
    .string({
      required_error: "La contraseña es requerida",
      invalid_type_error: "La contraseña debe ser texto",
    })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(40, "La contraseña no puede exceder 40 caracteres")
    .regex(/[a-zA-Z]/, "La contraseña debe contener al menos una letra")
    .regex(/\d/, "La contraseña debe contener al menos un número")
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+=[\]{};':"|,.<>/?-]*$/, "La contraseña solo puede contener caracteres alfanuméricos y símbolos especiales")
    .nonempty("La contraseña no puede estar vacía"),
  
  repetir_password: z
    .string({
      required_error: "Debes repetir la contraseña",
      invalid_type_error: "La contraseña debe ser texto",
    })
    .optional()
})
.refine((data) => data.password === data.repetir_password, {
  message: "Las contraseñas no coinciden",
  path: ["repetir_password"],
});

export default contraseniaSchema;