/**
 * Archivo de migración Knex.js (Module ES)
 * Tabla: unidad_curricular_area_conocimiento (Tabla Intermedia)
 *
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  return knex.schema.createTable('unidad_curricular_area_conocimiento', (table) => {
    // Clave Primaria Serial
    table.increments('id_unidad_curricular_area').primary();

    // Clave Foránea a unidades_curriculares
    // id_unidad_curricular | INTEGER NOT NULL
    table
      .integer('id_unidad_curricular')
      .notNullable()
      .references('id_unidad_curricular')
      .inTable('unidades_curriculares')
      .onDelete('CASCADE'); // Permite que al eliminar una unidad, se borren sus relaciones aquí

    // Clave Foránea a areas_de_conocimiento
    // id_area_conocimiento | INTEGER NOT NULL
    table
      .integer('id_area_conocimiento')
      .notNullable()
      .references('id_area_conocimiento')
      .inTable('areas_de_conocimiento')
      .onDelete('CASCADE'); // Permite que al eliminar un área, se borren sus relaciones aquí

    // Restricciones de Unicidad
    // CONSTRAINT uc_unidad_area_unique UNIQUE (id_unidad_curricular, id_area_conocimiento)
    table.unique(['id_unidad_curricular', 'id_area_conocimiento'], {
      indexName: 'uc_unidad_area_unique',
      deferrable: 'immediate',
    });

    // Auditoría y Soft Delete
    // activo BOOLEAN NOT NULL DEFAULT true
    table.boolean('activo').notNullable().defaultTo(true);
    // deleted_at TIMESTAMP WITH TIME ZONE NULL
    table.timestamp('deleted_at', { useTz: true }).nullable();
    // created_at, updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    table.timestamps(true, true);

    // Índices Adicionales para Performance
    // Se crean automáticamente al usar las claves foráneas, pero Knex permite añadirlos explícitamente si se desea un control total:
    // knex.schema.index(['id_unidad_curricular'], 'idx_unidad_curricular_area_unidad'); // Ejemplo de cómo añadir un índice explícito
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('unidad_curricular_area_conocimiento');
}