import z from "zod";
const loginSchema = z.object({
  email: z
    .string({
      required_error: "El email es requerido",
      invalid_type_error: "El email debe ser texto",
    })
    .email("El email no es válido")
    .max(150, "El email no puede exceder 150 caracteres")
    .nonempty("El email no puede estar vacío"),

  password: z
    .string({
      required_error: "La contraseña es requerida",
      invalid_type_error: "La contraseña debe ser texto",
    })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(40, "La contraseña no puede exceder 40 caracteres")
    .regex(/[a-zA-Z]/, "La contraseña debe contener al menos una letra")
    .regex(/\d/, "La contraseña debe contener al menos un número")
    .regex(
      /^[a-zA-Z0-9!@#$%^&*()_+=[\]{};':"|,.<>/?-]*$/,
      "La contraseña solo puede contener caracteres alfanuméricos y símbolos especiales"
    )
    .nonempty("La contraseña no puede estar vacía"),
});

export default loginSchema;