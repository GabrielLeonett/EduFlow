// migrations/006_create_pos_grado.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('pos_grado', (table) => {
    // Primary Key
    table.increments('id_pos_grado').primary().notNullable().comment('ID del Pos-Grado');
    
    // Campos principales
    table.string('nombre_pos_grado', 100).notNullable().comment('Nombre del Pos-Grado');
    table.enum('tipo_pos_grado', [
      'Especialización', 'Maestría', 'Doctorado', 'Diplomado', 
      'Posdoctorado', 'Certificación', 'Curso Avanzado', 
      'Residencia Médica', 'Fellowship'
    ]).notNullable().comment('Tipo de Pos-Grado');
    table.text('descripcion').nullable().comment('Descripción del Pos-Grado');
    
    // Campos de estado y soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo del Pos-Grado');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización del registro');
    
    // Índices
    table.index('nombre_pos_grado', 'idx_pos_grado_nombre');
    table.index('tipo_pos_grado', 'idx_pos_grado_tipo');
  });

  await knex.raw(`
    COMMENT ON TABLE pos_grado IS 'Tabla de los Pos-Grados de los profesores';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('pos_grado');
}