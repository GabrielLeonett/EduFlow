// migrations/014_create_unidades_curriculares.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('unidades_curriculares', (table) => {
    table.increments('id_unidad_curricular').primary().notNullable().comment('ID único de la unidad curricular');
    table.bigInteger('id_trayecto').notNullable().comment('Trayecto al que pertenece la unidad curricular');
    table.string('codigo_unidad', 20).unique().notNullable().comment('Código único identificador de la unidad (ej: MAT-101)');
    table.string('nombre_unidad_curricular', 100).notNullable().comment('Nombre completo de la unidad curricular');
    table.text('descripcion_unidad_curricular').notNullable().comment('Descripción detallada de los contenidos y objetivos');
    table.smallint('horas_clase').notNullable().comment('Duración de horas de clase');
    
    // Soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo de la unidad curricular');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría básicos
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización');

    // Índices
    table.index('codigo_unidad', 'idx_uc_codigo');
    table.index('nombre_unidad_curricular', 'idx_uc_nombre');
    table.index('id_trayecto', 'idx_uc_trayecto');
    table.index('activo', 'idx_uc_activo');

    // Relación con trayectos (CASCADE como especificaste)
    table.foreign('id_trayecto')
      .references('id_trayecto')
      .inTable('trayectos')
      .onDelete('CASCADE');
  });

  await knex.raw(`
    COMMENT ON TABLE unidades_curriculares IS 'Tabla de unidades curriculares por trayecto';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('unidades_curriculares');
};