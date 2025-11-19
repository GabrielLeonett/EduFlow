import z from "zod";

export const lineaInvestigacionSchema = z.object({
    // --- Campo Clave Principal (ID) ---
    id_linea_investigacion: z
        .number({
            invalid_type_error: "El ID de la línea debe ser un número entero.",
        })
        .int("El ID debe ser un número entero.")
        .positive("El ID debe ser positivo.")
        .optional(), // Es opcional al crear (lo genera la BD), pero presente al obtener.

    // --- Campos Obligatorios ---
    nombre_linea_investigacion: z
        .string({
            invalid_type_error: "El nombre debe ser texto.",
            required_error: "El nombre de la Línea de Investigación es obligatorio.",
        })
        .min(10, "El nombre debe tener al menos 10 caracteres.")
        .max(150, "El nombre no puede exceder los 150 caracteres.")
        .trim(),

    // --- Campos Opcionales / Metadata ---
    descripcion: z
        .string({
            invalid_type_error: "La descripción debe ser texto.",
        })
        .min(20, "La descripción debe tener al menos 20 caracteres.")
        .max(500, "La descripción no puede exceder los 500 caracteres.")
        .optional()
        .or(z.literal(null)), // Permite que el campo sea nulo en la BD.

    activo: z
        .boolean({
            invalid_type_error: "El estado activo debe ser un booleano (true/false).",
        })
        .default(true)
        .optional(),

    created_at: z
        .string({
            invalid_type_error: "La fecha de creación debe ser una cadena de fecha/hora válida.",
        })
        .datetime()
        .optional(),

    updated_at: z
        .string({
            invalid_type_error: "La fecha de actualización debe ser una cadena de fecha/hora válida.",
        })
        .datetime()
        .optional(),
});

// Exportar solo el esquema de la tabla si es necesario
export default lineaInvestigacionSchema;