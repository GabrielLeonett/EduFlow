// migrations/019_create_relacion_profesor_pos_grado.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('relacion_profesor_pos_grado', (table) => {
    table.increments('id_r_pos_grado_profesor').primary().comment('ID de la relación del pos-grado con el profesor');
    table.integer('profesor_id').notNullable().comment('ID del profesor que está en la relación');
    table.integer('pos_grado_id').notNullable().comment('ID del pos-grado que está en la relación');
    
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
    
    table.foreign('pos_grado_id')
      .references('id_pos_grado')
      .inTable('pos_grado')
      .onDelete('CASCADE');

    // Índices
    table.unique(['profesor_id', 'pos_grado_id'], 'rel_prof_pos_grado_unique');
    table.index('profesor_id', 'idx_rel_prof_pos_grado_profesor');
    table.index('pos_grado_id', 'idx_rel_prof_pos_grado_posgrado');
    table.index('activo', 'idx_rel_prof_pos_grado_activo');
  });

  await knex.raw(`
    COMMENT ON TABLE relacion_profesor_pos_grado IS 'Tabla de la relación de los profesores y sus pos-grado';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('relacion_profesor_pos_grado');
};