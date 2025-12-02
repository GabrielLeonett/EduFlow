// migrations/021_create_relacion_dedicacion_profesor.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('relacion_dedicacion_profesor', (table) => {
    table.increments('id').primary().comment('ID de la relación de profesor y sus dedicaciones');
    table.integer('profesor_id').notNullable().comment('ID del profesor que está en la relación');
    table.integer('dedicacion_id').notNullable().comment('ID de la dedicación que está en la relación');
    table.date('fecha_inicio').notNullable().comment('Fecha en la que se inició esa dedicación');
    table.date('fecha_fin').nullable().comment('Fecha en la que se terminó esa dedicación');
    
    // Campos de estado
    table.boolean('activo').notNullable().defaultTo(true).comment('Indica si la relación está activa');
    
    // Campos de auditoría básicos
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización');

    // Relaciones (RESTRICT para dedicacion_id y CASCADE para profesor_id)
    table.foreign('profesor_id')
      .references('id_profesor')
      .inTable('profesores')
      .onDelete('CASCADE');
    
    table.foreign('dedicacion_id')
      .references('id_dedicacion')
      .inTable('dedicaciones')
      .onDelete('RESTRICT');

    // Índices
    table.unique(['profesor_id', 'dedicacion_id', 'fecha_inicio'], 'rel_ded_profesor_unique');
    table.index('profesor_id', 'idx_rel_ded_profesor_id');
    table.index('dedicacion_id', 'idx_rel_ded_dedicacion_id');
    table.index('fecha_inicio', 'idx_rel_ded_fecha_inicio');
    table.index('activo', 'idx_rel_ded_activo');
  });

  await knex.raw(`
    COMMENT ON TABLE relacion_dedicacion_profesor IS 'Tabla de relación histórica entre profesores y dedicaciones';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('relacion_dedicacion_profesor');
};