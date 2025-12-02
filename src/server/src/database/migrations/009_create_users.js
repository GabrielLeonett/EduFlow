// migrations/009_create_users.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("users", (table) => {
    // Primary Key
    table.bigInteger("cedula").primary().notNullable().comment("Número de cédula como identificador único");
    
    // Campos principales
    table.string("nombres", 50).notNullable().comment("Nombres del usuario");
    table.string("apellidos", 50).notNullable().comment("Apellidos del usuario");
    table.string("imagen", 255).nullable().comment("Ruta de la imagen del usuario");
    table.string("direccion", 200).notNullable().comment("Dirección completa del usuario");
    table.string("password", 255).notNullable().comment("Contraseña encriptada");
    table.string("telefono_movil", 15).notNullable().comment("Teléfono móvil principal");
    table.string("telefono_local", 15).nullable().comment("Teléfono local (opcional)");
    table.date("fecha_nacimiento").notNullable().comment("Fecha de nacimiento del usuario");
    table.enum("genero", ['masculino', 'femenino']).notNullable().comment("Género del usuario");
    table.string("email", 100).unique().notNullable().comment("Correo electrónico único");
    
    // Campos de estado y soft delete
    table.boolean("activo").defaultTo(true).comment("Indica si el usuario está activo en el sistema");
    table.boolean("primera_vez").defaultTo(true).comment("Indica si el usuario ya ingresó al sistema");
    table.timestamp("deleted_at").nullable().comment("Fecha de eliminación soft delete");
    
    // Campos de sesión y seguridad
    table.timestamp("last_login").nullable().comment("Último inicio de sesión");
    table.string("reset_password_token", 255).nullable().comment("Token para resetear contraseña");
    table.timestamp("reset_password_expires").nullable().comment("Expiración del token de reset");
    
    // Campos de auditoría
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now()).comment("Fecha de creación del registro");
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now()).comment("Fecha de última actualización");
    
    // Índices
    table.index("activo", "idx_users_activo");
    table.index("email", "idx_users_email");
    table.index(["nombres", "apellidos"], "idx_users_nombre_completo");
    table.index("genero", "idx_users_genero");
    table.index("fecha_nacimiento", "idx_users_fecha_nacimiento");
  });

  await knex.raw(`
    COMMENT ON TABLE users IS 'Tabla de usuarios del sistema';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("users");
}