// migrations/xxxx_create_logs.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('logs', (table) => {
    table.increments('id').primary().comment('Identificador único del log');
    table.string('event_type', 50).notNullable().comment('Tipo de evento (ej: "user_login", "post_created")');
    table.text('message').comment('Descripción detallada del evento');
    table.jsonb('metadata').comment('Información adicional estructurada (ej: IP, dispositivo)');
    table.bigInteger('user_id').comment('ID del usuario asociado al evento (si aplica)');
    table.string('reference_id', 100).comment('ID del recurso relacionado (ej: "post_123")');
    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('Fecha y hora en que se registró el evento');

    // Índices
    table.index('event_type', 'idx_logs_event_type', 'btree');
    table.index('user_id', 'idx_logs_user_id', 'btree');

    // Relación con users (SET NULL como especificaste)
    table.foreign('user_id')
      .references('cedula')
      .inTable('users')
      .onDelete('SET NULL');
  });

  await knex.raw(`
    COMMENT ON TABLE logs IS 'Esta tabla es la de auditoria';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('logs');
};