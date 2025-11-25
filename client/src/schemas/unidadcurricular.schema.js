import z from "zod";
import { lineaInvestigacionSchema } from "./lineasInves.schema.js";
import { areaConocimientoSchema } from "./profesor.schema.js";

// Función auxiliar para validar campos numéricos de horas con soporte decimal.
const hourSchema = z.number({
    invalid_type_error: "El valor de horas debe ser un número.",
    required_error: "Este campo de horas es obligatorio y debe ser 0 si no aplica."
}).min(0, "El valor de horas no puede ser negativo.").default(0);

export const unidadcurricularSchema = z.object({
    // --- IDENTIFICACIÓN ---
    id_trayecto: z.number({
        invalid_type_error: "El ID de trayecto debe ser un número.",
        required_error: "El ID de trayecto es obligatorio.",
    }).positive("El ID debe ser positivo."),

    // --- INFORMACIÓN BÁSICA ---
    nombre_unidad_curricular: z.string({
        invalid_type_error: "El nombre debe ser texto.",
        required_error: "El nombre es obligatorio.",
    })
    .min(5, "El nombre debe tener al menos 5 caracteres.")
    .max(100, "El nombre no puede exceder los 100 caracteres.")
    .regex(
        /^[A-Za-zÁ-ÿ0-9\s\-\(\)\/\.\,]+$/,
        "Solo se permiten letras, números, espacios y signos comunes (guion, paréntesis, etc)."
    )
    .trim(),

    codigo_unidad_curricular: z.string({
        invalid_type_error: "El código debe ser un texto.",
        required_error: "El código es obligatorio.",
    })
    .min(3, "El código debe tener mínimo 3 caracteres.")
    .max(7, "El código debe tener máximo 7 caracteres.")
    .regex(/^[A-Z0-9]{3,7}$/, "Formato inválido. Use A-Z y 0-9, sin guiones.")
    .trim()
    .toUpperCase(),

    tipo_unidad: z.enum(["Taller", "Proyecto", "Asignatura", "Seminario", "Curso"], {
        invalid_type_error: "El tipo de unidad curricular es inválido.",
        required_error: "El tipo de unidad curricular es obligatorio.",
    }),

    // --- DESCRIPCIÓN Y CONTENIDO ---
    descripcion_unidad_curricular: z.string({
        invalid_type_error: "El propósito (descripción) debe ser texto.",
        required_error: "El propósito (descripción) es obligatorio.",
    })
    .min(30, "El propósito debe tener al menos 30 caracteres.")
    .max(500, "El propósito no puede exceder los 500 caracteres.")
    .trim(),

    // --- CARGA ACADÉMICA ---
    carga_horas_academicas: z.number({
        invalid_type_error: "El valor de la hora académica debe ser un número.",
        required_error: "La carga de horas académicas es obligatoria.",
    })
    .min(1, "Lo mínimo es 1 (45min).")
    .max(6, "Lo máximo es 6 (4h 30min).")
    .int("Debe ser un número entero (1, 2, 3, 4, 5 o 6)"),

    creditos: z.number({
        invalid_type_error: "Los créditos deben ser un número.",
        required_error: "La cantidad de créditos es obligatoria.",
    })
    .int("Los créditos deben ser un número entero.")
    .min(0, "Los crédito deben ser un número positivo.")
    .max(10, "Los créditos no pueden exceder de 10."),

    semanas: z.number({
        invalid_type_error: "La duración en semanas debe ser un número.",
        required_error: "La duración en semanas es obligatoria.",
    })
    .int("Las semanas deben ser un número entero.")
    .min(1, "La duración mínima es 1 semana.")
    .max(50, "La duración máxima es de 50 semanas."),

    // --- RELACIONES ---
    areas_conocimiento: z.array(areaConocimientoSchema, {
        invalid_type_error: "Las áreas de conocimiento deben ser una lista (array).",
        required_error: "Las Áreas de Conocimiento son obligatorias.",
    })
    .min(1, "Debe seleccionar al menos una Área de Conocimiento."),

    lineas_investigacion: z.array(lineaInvestigacionSchema, {
        invalid_type_error: "Las líneas de investigación deben ser una lista (array).",
        required_error: "Las líneas de investigación son obligatorias.",
    })
    .min(1, "Debe seleccionar al menos una Línea de Investigación."),

    // --- DISTRIBUCIÓN DE HORAS ---
    hte: hourSchema, // Horas Teóricas Presenciales
    hse: hourSchema, // Horas Semipresenciales
    hta: hourSchema, // Horas Trabajo Autónomo
    hsa: hourSchema, // Horas Servicio/Seminario
    hti: hourSchema, // Horas Tutoría/Taller
    hsi: hourSchema, // Horas Seminario Investigación

}).refine((data) => {
    // Validación de consistencia: La suma total de horas detalladas debe ser mayor que cero.
    const totalHours = data.hte + data.hse + data.hta + data.hsa + data.hti + data.hsi;
    return totalHours > 0;
}, {
    message: "La suma total de todas las categorías de horas (HTE, HSE, etc.) debe ser mayor a 0.",
    path: ["hte"],
});

export default unidadcurricularSchema;