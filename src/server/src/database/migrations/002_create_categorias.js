// migrations/002_create_categorias.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("categorias", (table) => {
    // Primary Key
    table
      .smallint("id_categoria")
      .primary()
      .comment("ID numérico pequeño de la categoría (1-255)");

    // Campos principales
    table
      .string("nombre_categoria", 100)
      .unique()
      .notNullable()
      .comment("Nombre descriptivo de la categoría");

    // Campos de estado y soft delete
    table
      .boolean("activo")
      .notNullable()
      .defaultTo(true)
      .comment("Estado activo/inactivo de la categoría");
    table
      .timestamp("deleted_at")
      .nullable()
      .comment("Fecha de eliminación soft delete");

    // Campos de auditoría
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment("Fecha de creación del registro");
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment("Fecha de última actualización del registro");

    // Índices
    table.index("nombre_categoria", "idx_categoria_nombre");
  });

  await knex.raw(`
    COMMENT ON TABLE categorias IS 'Tabla para las categorías docentes del sistema';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("categorias");
}
