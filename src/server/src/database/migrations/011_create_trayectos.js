// migrations/011_create_trayectos.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("trayectos", (table) => {
    table
      .increments("id_trayecto")
      .primary()
      .notNullable()
      .comment("ID único del trayecto");
    table
      .integer("poblacion_estudiantil")
      .notNullable()
      .defaultTo(0)
      .comment("Cantidad de estudiantes en el trayecto");
    table
      .string("valor_trayecto", 20)
      .notNullable()
      .comment(
        "Valor identificador del trayecto (ej: Trayecto I, Trayecto II)"
      );
    table
      .string("descripcion_trayecto", 500)
      .defaultTo("Sin descripción")
      .comment(
        "Descripción y objetivos del trayecto (ej: Aprender..., Veran...)"
      );
    table
      .smallint("id_pnf")
      .notNullable()
      .comment("Referencia al PNF al que pertenece el trayecto");

    // Soft delete
    table
      .boolean("activo")
      .notNullable()
      .defaultTo(true)
      .comment("Estado activo/inactivo del trayecto");
    table
      .timestamp("deleted_at")
      .nullable()
      .comment("Fecha de eliminación soft delete");

    // Campos de auditoría básicos
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
    table.index("id_pnf", "idx_trayectos_pnf");
    table.index(["valor_trayecto", "id_pnf"], "idx_trayectos_valor_pnf");
    table.index("activo", "idx_trayectos_activo");

    // Relación con PNFs (CASCADE como especificaste)
    table
      .foreign("id_pnf")
      .references("id_pnf")
      .inTable("pnfs")
      .onDelete("CASCADE");
  });

  await knex.raw(`
    COMMENT ON TABLE trayectos IS 'Tabla de trayectos académicos por PNF';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("trayectos");
}
