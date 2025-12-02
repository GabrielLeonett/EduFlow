// migrations/012_create_turnos.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('turnos', (table) => {
    // Primary Key
    table.smallint('id_turno').primary().notNullable().comment('ID único del turno');
    
    // Campos principales
    table.string('nombre_turno', 100).unique().notNullable().comment('Nombre del turno (ej: Matutino, Vespertino, Nocturno)');
    table.time('inicio_hora').notNullable().comment('Hora de inicio del turno');
    table.time('fin_hora').notNullable().comment('Hora de fin del turno');
    
    // Campos de estado y soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo del turno');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización del registro');
    
    // Índices
    table.index('nombre_turno', 'idx_turno_nombre');
    table.index('inicio_hora', 'idx_turno_inicio');
  });

  await knex.raw(`
    COMMENT ON TABLE turnos IS 'Tabla de turnos académicos';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('turnos');
}