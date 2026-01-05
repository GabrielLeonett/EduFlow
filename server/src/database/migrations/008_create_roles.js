// migrations/008_create_roles.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('roles', (table) => {
    // Primary Key
    table.smallint('id_rol').primary().notNullable().comment('Identificador único del rol (valor entre 1-255)');
    
    // Campos principales
    table.string('nombre_rol', 50).unique().notNullable().comment('Nombre descriptivo del rol (profesor, coordinador, etc.)');
    table.text('descripcion').nullable().comment('Descripción detallada del rol');
    
    // Campos de estado y soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo del rol');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha y hora de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha y hora de última actualización');
    
    // Índices
    table.index('nombre_rol', 'idx_rol_nombre');
  });

  await knex.raw(`
    COMMENT ON TABLE roles IS 'Tabla de los roles del sistema';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('roles');
}