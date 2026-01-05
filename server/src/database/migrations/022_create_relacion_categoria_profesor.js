// migrations/022_create_relacion_categoria_profesor.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('relacion_categoria_profesor', (table) => {
    table.increments('id').primary().comment('ID de la relación del profesor y sus categorías');
    table.integer('profesor_id').notNullable().comment('ID del profesor que está en la relación');
    table.integer('categoria_id').notNullable().comment('ID de la categoría que está en la relación');
    table.date('fecha_inicio').notNullable().comment('Fecha de inicio de esa categoría');
    table.date('fecha_fin').nullable().comment('Fecha en la que se terminó esa categoría');
    
    // Campos de estado (sin soft delete completo)
    table.boolean('activo').notNullable().defaultTo(true).comment('Indica si la relación está activa');
    
    // Campos de auditoría básicos (sin referencias a usuarios)
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización');

    // Relaciones (RESTRICT para categoria_id y CASCADE para profesor_id como especificaste)
    table.foreign('profesor_id')
      .references('id_profesor')
      .inTable('profesores')
      .onDelete('CASCADE');
    
    table.foreign('categoria_id')
      .references('id_categoria')
      .inTable('categorias')
      .onDelete('RESTRICT');

    // Índices
    table.unique(['profesor_id', 'categoria_id', 'fecha_inicio'], 'rel_cat_profesor_unique');
    table.index('profesor_id', 'idx_rel_cat_profesor_id');
    table.index('categoria_id', 'idx_rel_cat_categoria_id');
    table.index('fecha_inicio', 'idx_rel_cat_fecha_inicio');
    table.index('activo', 'idx_rel_cat_activo');
  });

  await knex.raw(`
    COMMENT ON TABLE relacion_categoria_profesor IS 'Tabla de relación histórica entre profesores y categorías';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('relacion_categoria_profesor');
};