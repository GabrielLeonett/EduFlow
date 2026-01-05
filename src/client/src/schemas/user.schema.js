import z from "zod";

const userSchema = z.object({
  cedula: z
    .number({
      required_error: "La cedula es requerida",
      invalid_type_error: "La cedula debe ser un numero",
    })
    .int("La cédula debe ser un número entero")
    .positive("La cédula debe ser un número positivo")
    .min(1000000, "La cédula debe tener al menos 7 dígitos")
    .max(99999999, "La cédula no puede tener más de 8 dígitos"),

  municipio: z.enum(["Carrizal", "Los Salias", "Guaicaipuro"], {
    error_map: () => ({
      message: "El municipio debe ser: Carrizal, Los Salias o Guaicaipuro",
    }),
  }),

  nombres: z
    .string({ invalid_type_error: "Nombres tiene que ser un string" })
    .min(3, { message: "Nombres tiene que tener al menos 3 caracteres" })
    .max(150, { message: "Nombres tiene que tener menos de 150 caracteres" })
    .nonempty({ message: "Nombres no puede estar vacio" }),

  apellidos: z
    .string({ invalid_type_error: "Apellidos tiene que ser un string" })
    .min(3, { message: "Apellidos tiene que tener al menos 3 caracteres" })
    .max(150, { message: "Apellidos tiene que tener menos de 150 caracteres" })
    .nonempty({ message: "Apellidos no puede estar vacio" }),

  email: z
    .string({ invalid_type_error: "Email tiene que ser un string" })
    .email({ message: "Email no es valido" })
    .max(150, { message: "Email tiene que tener menos de 150 caracteres" })
    .nonempty({ message: "Email no puede estar vacio" }),

  password: z
    .string({ invalid_type_error: "Password tiene que ser un string" })
    .min(8, { message: "Password tiene que tener al menos 8 caracteres" })
    .max(40, { message: "Password tiene que tener menos de 40 caracteres" })
    .optional(),

  direccion: z
    .string({ invalid_type_error: "Direccion tiene que ser un string" })
    .min(3, { message: "Direccion tiene que tener al menos 3 caracteres" })
    .max(150, { message: "Direccion tiene que tener menos de 150 caracteres" })
    .nonempty({ message: "Direccion no puede estar vacio" }),

  telefono_movil: z
    .string({ invalid_type_error: "Telefono movil tiene que ser un string" })
    .regex(/^\d{11}$/, {
      message: "Telefono movil tiene que tener 11 digitos",
    }),

  telefono_local: z
    .string({ invalid_type_error: "Telefono local tiene que ser un string" })
    .regex(/^\d{11}$/, { message: "Telefono local tiene que tener 11 digitos" })
    .optional(),

  fecha_nacimiento: z
    .string({
      invalid_type_error: "Fecha de nacimiento tiene que ser un string",
    })
    .regex(/^\d{2}-\d{2}-\d{4}$/, {
      message: "Fecha de nacimiento tiene que tener el formato DD-MM-YYYY",
    })
    .nonempty({ message: "Fecha de nacimiento no puede estar vacio" }),

  genero: z.enum(["masculino", "femenino"], {
    error_map: () => ({ message: "Genero tiene que ser masculino o femenino" }),
  }),
});

export default userSchema;
