// migrations/016_create_horarios.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("horarios", (table) => {
    table
      .increments("id_horario")
      .primary()
      .notNullable()
      .comment("ID único del horario");
    table
      .bigInteger("seccion_id")
      .notNullable()
      .comment("Sección asociada al horario");
    table.bigInteger("profesor_id").notNullable().comment("Profesor asignado");
    table
      .smallint("aula_id")
      .notNullable()
      .comment("ID de la Aula o espacio físico asignado");
    table
      .bigInteger("unidad_curricular_id")
      .notNullable()
      .comment("Unidad curricular programada");
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
      .comment("Hora de inicio de la clase");
    table
      .time("hora_fin")
      .notNullable()
      .comment("Hora de finalización de la clase");
    table
      .boolean("activo")
      .notNullable()
      .defaultTo(true)
      .comment("Indica si el horario está actualmente activo");
    
    // Soft delete
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
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

    // Índices individuales
    table.index(["dia_semana", "hora_inicio"], "idx_horarios_dia_hora");
    table.index("profesor_id", "idx_horarios_profesor");
    table.index("seccion_id", "idx_horarios_seccion");
    table.index("unidad_curricular_id", "idx_horarios_uc");
    table.index("aula_id", "idx_horarios_aula");
    table.index("activo", "idx_horarios_activo");

    // Relaciones
    table
      .foreign("seccion_id")
      .references("id_seccion")
      .inTable("secciones")
      .onDelete("CASCADE");

    table
      .foreign("profesor_id")
      .references("id_profesor")
      .inTable("profesores")
      .onDelete("RESTRICT");

    table
      .foreign("unidad_curricular_id")
      .references("id_unidad_curricular")
      .inTable("unidades_curriculares")
      .onDelete("RESTRICT");

    table
      .foreign("aula_id")
      .references("id_aula")
      .inTable("aulas")
      .onDelete("RESTRICT");
  });

  // Índices únicos parciales - solo aplican cuando activo = true
  await knex.raw(`
    CREATE UNIQUE INDEX uq_aula_horario_activo 
    ON horarios (aula_id, dia_semana, hora_inicio, hora_fin) 
    WHERE activo = true;
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX uq_profesor_horario_activo 
    ON horarios (profesor_id, dia_semana, hora_inicio, hora_fin) 
    WHERE activo = true;
  `);

  await knex.raw(`
    COMMENT ON TABLE horarios IS 'Tabla de los horarios';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

export async function down(knex) {
  // Eliminar los índices parciales primero
  await knex.raw("DROP INDEX IF EXISTS uq_aula_horario_activo");
  await knex.raw("DROP INDEX IF EXISTS uq_profesor_horario_activo");

  await knex.schema.dropTable("horarios");
}