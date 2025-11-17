// migrations/015_create_aulas.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('aulas', (table) => {
    table.increments('id_aula').primary().comment('ID del aula');
    table.integer('id_sede').notNullable().comment('ID de la sede en la que está el aula');
    table.string('codigo_aula', 8).notNullable().comment('Código del aula ejemplo: 75');
    table.enum('tipo_aula', [
      'Convencional', 'Interactiva', 'Computación', 'Exterior', 'Laboratorio'
    ]).notNullable().comment('Tipo de aula');
    table.integer('capacidad_aula').notNullable().comment('Capacidad del aula');
    
    // Soft delete
    table.boolean('activa').defaultTo(true).comment('Estado activo/inactivo del aula');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría básicos
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del aula');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de actualización del aula');

    // Índice único compuesto
    table.unique(['id_sede', 'codigo_aula'], 'aulas_id_sede_codigo_unique');

    // Relación con sedes (cascade como especificaste)
    table.foreign('id_sede')
      .references('id_sede')
      .inTable('sedes')
      .onDelete('CASCADE');

    // Índices adicionales
    table.index('tipo_aula', 'idx_aulas_tipo');
    table.index('capacidad_aula', 'idx_aulas_capacidad');
    table.index('activa', 'idx_aulas_activa');
  });

  await knex.raw(`
    COMMENT ON TABLE aulas IS 'Tabla para las aulas';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('aulas');
};