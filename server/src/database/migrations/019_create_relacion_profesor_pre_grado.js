// migrations/018_create_relacion_profesor_pre_grado.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('relacion_profesor_pre_grado', (table) => {
    table.increments('id_r_pre_grado_profesor').primary().comment('ID de la relación del pre-grado con el profesor');
    table.integer('profesor_id').notNullable().comment('ID del profesor que está en la relación');
    table.integer('pre_grado_id').notNullable().comment('ID del pre-grado que está en la relación');
    
    // Soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo de la relación');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría básicos
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización');

    // Relaciones (CASCADE para ambas como especificaste)
    table.foreign('profesor_id')
      .references('id_profesor')
      .inTable('profesores')
      .onDelete('CASCADE');
    
    table.foreign('pre_grado_id')
      .references('id_pre_grado')
      .inTable('pre_grado')
      .onDelete('CASCADE');

    // Índices
    table.unique(['profesor_id', 'pre_grado_id'], 'rel_prof_pre_grado_unique');
    table.index('profesor_id', 'idx_rel_prof_pre_grado_profesor');
    table.index('pre_grado_id', 'idx_rel_prof_pre_grado_pregrado');
    table.index('activo', 'idx_rel_prof_pre_grado_activo');
  });

  await knex.raw(`
    COMMENT ON TABLE relacion_profesor_pre_grado IS 'Tabla de la relación de los profesores y sus pre-grado';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('relacion_profesor_pre_grado');
};