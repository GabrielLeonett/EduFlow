// src/schemas/passwordRecovery.schema.js
import { z } from 'zod';

export const passwordRecoverySchema = z.object({
  email: z.string()
    .email("El email debe ser válido")
    .min(1, "El email es requerido"),
  
  token: z.string()
    .min(6, "El token debe tener al menos 6 caracteres")
    .min(1, "El token es requerido"),
  
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .min(1, "La nueva contraseña es requerida")
});

export default passwordRecoverySchema;