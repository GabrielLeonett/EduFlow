import z from "zod";

const seccionSchema = z.object({
    id_trayecto: z
    .number({
      invalid_type_error: "El id de trayecto tiene que ser un numero",
      required_error: "El id de trayecto es obligatorio",
    })
    .positive("El id de trayecto tiene que se positivo"),
    
    id_turno: z
    .number({
      invalid_type_error: "El id de turno tiene que ser un numero",
      required_error: "El id de turno es obligatorio",
    })
    .positive("El id de turno tiene que se positivo").optional(),

    poblacion_estudiantil: z.number({
      invalid_type_error: "La poblacion estudiantil tiene que ser un numero.",
      required_error: "La poblacion estudiantil es obligatoria",
    })
    .min(8,"La poblacion tiene que ser mayor a 8")
    .max(400,"La poblacion tiene que ser menor a 400")
    .positive("La poblacion tiene que ser positiva"),
});


export default seccionSchema;