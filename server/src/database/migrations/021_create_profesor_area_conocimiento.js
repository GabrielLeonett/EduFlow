// migrations/020_create_profesor_area_conocimiento.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("profesor_area_conocimiento", (table) => {
    // Primary Key
    table
      .increments("id")
      .primary()
      .comment("ID de relación de profesor con área de conocimiento");

    // Foreign Keys
    table
      .integer("profesor_id")
      .notNullable()
      .comment("Profesor que tiene la relación");
    table
      .integer("area_id")
      .notNullable()
      .comment("Área de conocimiento que tiene la relación");

    // Campos de estado y soft delete
    table
      .boolean("activo")
      .notNullable()
      .defaultTo(true)
      .comment("Estado activo/inactivo de la relación");
    table
      .timestamp("deleted_at")
      .nullable()
      .comment("Fecha de eliminación soft delete");

    // Campos de auditoría
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment("Fecha de creación de la relación");
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment("Fecha de actualización de la relación");

    // Índice único compuesto
    table.unique(
      ["profesor_id", "area_id"],
      "profesor_area_conocimiento_profesor_id_area_id_unique"
    );

    // Relaciones (CASCADE como especificaste)
    table
      .foreign("profesor_id")
      .references("id_profesor")
      .inTable("profesores")
      .onDelete("CASCADE");

    table
      .foreign("area_id")
      .references("id_area_conocimiento")
      .inTable("areas_de_conocimiento")
      .onDelete("CASCADE");

    // Índices adicionales
    table.index("profesor_id", "idx_profesor_area_profesor");
    table.index("area_id", "idx_profesor_area_area");
    table.index("activo", "idx_profesor_area_activo");
  });

  await knex.raw(`
    COMMENT ON TABLE profesor_area_conocimiento IS 'Tabla de relación entre el profesor y las áreas de conocimiento';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("profesor_area_conocimiento");
}
