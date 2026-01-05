// migrations/010_create_profesores.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("profesores", (table) => {
    // Primary Key
    table.increments("id_profesor").primary().notNullable().comment("ID único del profesor");
    
    // Foreign Key a users
    table.bigInteger("id_cedula").unique().notNullable().comment("Relación con la tabla de usuarios (1 a 1)");
    
    // Campos principales
    table.date("fecha_ingreso").notNullable().comment("Fecha de ingreso a la institución");
    table.enum("municipio", ["Carrizal", "Guaicaipuro", "Los Salias", "Sucre", "Baruta", "El Hatillo", "Libertador"])
      .notNullable().comment("Municipio donde vive el profesor");
      
    // Campos de estado y soft delete
    table.boolean("activo").defaultTo(true).comment("Indica si el usuario está activo en el sistema como profesor");
    table.timestamp("deleted_at").nullable().comment("Fecha de eliminación soft delete");
    
    // Campos de auditoría
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now()).comment("Fecha de creación del registro");
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now()).comment("Fecha de última actualización");
    
    // Foreign Keys
    table.foreign("id_cedula")
      .references("cedula")
      .inTable("users")
      .onDelete("CASCADE");
    
    // Índices
    table.index("fecha_ingreso", "idx_profesores_antiguedad");
    table.index("id_cedula", "idx_profesores_usuario");
    table.index("municipio", "idx_profesores_municipio");
    table.index("activo", "idx_profesores_activo");
  });

  await knex.raw(`
    COMMENT ON TABLE profesores IS 'Tabla de los profesores del sistema';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("profesores");
}