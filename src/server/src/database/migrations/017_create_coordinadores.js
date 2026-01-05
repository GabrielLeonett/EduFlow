// migrations/017_create_coordinadores.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('coordinadores', (table) => {
    table.bigInteger('id_coordinador').primary().comment('ID del coordinador');
    table.bigInteger('id_profesor').notNullable().comment('ID del profesor que va a ser coordinador');
    table.smallint('id_pnf').notNullable().comment('ID del PNF del cual será coordinador');
    
    // Soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo del coordinador');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría básicos
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación de este coordinador');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de actualización de este coordinador');

    // Relación con profesores
    table.foreign('id_profesor')
      .references('id_profesor')
      .inTable('profesores')
      .onDelete('CASCADE');

    // Relación con pnfs
    table.foreign('id_pnf')
      .references('id_pnf')
      .inTable('pnfs')
      .onDelete('RESTRICT');

    // Índices
    table.unique(['id_profesor', 'id_pnf'], 'coordinador_profesor_pnf_unique');
    table.index('id_profesor', 'idx_coordinador_profesor');
    table.index('id_pnf', 'idx_coordinador_pnf');
    table.index('activo', 'idx_coordinador_activo');
  });

  await knex.raw(`
    COMMENT ON TABLE coordinadores IS 'Tabla de los coordinadores';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('coordinadores');
};