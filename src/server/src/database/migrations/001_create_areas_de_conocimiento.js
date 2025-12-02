// migrations/001_create_areas_de_conocimiento.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('areas_de_conocimiento', (table) => {
    // Primary Key
    table.increments('id_area_conocimiento').primary().comment('ID del área de conocimiento');
    
    // Campos principales
    table.string('nombre_area_conocimiento', 100).unique().notNullable().comment('Nombre del área de conocimiento');
    table.text('descripcion').nullable().comment('Descripción del área de conocimiento');
    
    // Campos de estado y soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo del área');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización del registro');
    
  });

  await knex.raw(`
    COMMENT ON TABLE areas_de_conocimiento IS 'Tabla para las áreas de conocimiento del sistema';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('areas_de_conocimiento');
}