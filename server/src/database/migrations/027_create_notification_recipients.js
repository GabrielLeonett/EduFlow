// migrations/026_create_notification_recipients.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('notification_recipient', (table) => {
    table.bigInteger('notification_id').notNullable().comment('ID de la notificación');
    table.bigInteger('user_id').notNullable().comment('ID del usuario destinatario');
    table.boolean('is_read').defaultTo(false).comment('Indica si el usuario leyó esta notificación masiva');
    
    // Soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo del destinatario');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría básicos
    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('read_at').nullable().comment('Fecha/hora de lectura por el usuario');

    // Clave primaria compuesta
    table.primary(['notification_id', 'user_id'], 'notification_recipients_pkey');
    
    // Índices adicionales
    table.index('user_id', 'notification_recipients_user_id_index');
    table.index('is_read', 'notification_recipients_is_read_index');
    table.index('activo', 'notification_recipients_activo_index');
    table.index('notification_id', 'notification_recipients_notification_id_index');

    // Relaciones
    table.foreign('notification_id')
      .references('id')
      .inTable('notifications')
      .onDelete('CASCADE');
      
    table.foreign('user_id')
      .references('cedula')
      .inTable('users')
      .onDelete('CASCADE');
  });

  await knex.raw(`
    COMMENT ON TABLE notification_recipients IS 'Tabla de destinatarios para notificaciones masivas';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('notification_recipients');
};