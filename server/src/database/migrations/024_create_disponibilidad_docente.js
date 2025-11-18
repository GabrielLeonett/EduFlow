// migrations/023_create_disponibilidad_docente.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("disponibilidad_docente", (table) => {
    table
      .increments("id_disponibilidad")
      .primary()
      .comment("ID de la disponibilidad del docente");
    table
      .bigInteger("id_profesor")
      .notNullable()
      .comment("ID del profesor que tiene la disponibilidad del docente");
    table
      .enum("dia_semana", [
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado",
      ])
      .notNullable()
      .comment("Día de la semana (domingo excluido por ser no lectivo)");
    table
      .time("hora_inicio")
      .notNullable()
      .comment("Hora de inicio de la disponibilidad del docente");
    table
      .time("hora_fin")
      .notNullable()
      .comment("Hora de finalización de la disponibilidad del docente");

    // Soft delete
    table
      .boolean("activo")
      .notNullable()
      .defaultTo(true)
      .comment("Estado activo/inactivo de la disponibilidad");
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
      .comment("Fecha de última actualización");

    // Índice único compuesto
    table.unique(
      ["id_profesor", "dia_semana", "hora_inicio", "hora_fin"],
      "disponibilidad_unica_docente_horario"
    );

    // Relación con profesores
    table
      .foreign("id_profesor")
      .references("id_profesor")
      .inTable("profesores")
      .onDelete("CASCADE");

    // Índices adicionales
    table.index("id_profesor", "idx_disponibilidad_profesor");
    table.index("dia_semana", "idx_disponibilidad_dia");
    table.index("activo", "idx_disponibilidad_activo");
  });

  await knex.raw(`
    COMMENT ON TABLE disponibilidad_docente IS 'Tabla de disponibilidad horaria de los docentes';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("disponibilidad_docente");
}
