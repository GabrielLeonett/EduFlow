// migrations/024_create_notifications.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('notifications', (table) => {
    table.bigIncrements('id').primary().comment('ID único de la notificación');
    table.bigInteger('user_id').comment('ID del usuario destinatario (nulo para notificaciones masivas)');
    table.string('type', 50).notNullable().comment('Tipo de notificación');
    table.string('title', 255).notNullable().comment('Título de la notificación');
    table.text('body').comment('Contenido principal de la notificación');
    table.boolean('is_read').defaultTo(false).comment('Indica si la notificación fue leída');
    table.timestamp('read_at').comment('Fecha/hora de lectura');
    table.jsonb('metadata').comment('Metadatos adicionales en formato JSON');
    
    // Soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo de la notificación');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría básicos
    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('Fecha de creación');
    table.boolean('is_mass').defaultTo(false).comment('Indica si es notificación masiva');
    table.bigInteger('mass_parent_id').comment('ID de la notificación padre para masivas');

    // Índices
    table.index('created_at', 'notifications_created_at_index');
    table.index('is_mass', 'notifications_is_mass_index');
    table.index('user_id', 'notifications_user_id_index');
    table.index('type', 'notifications_type_index');
    table.index('is_read', 'notifications_is_read_index');
    table.index('activo', 'notifications_activo_index');

    // Relaciones
    table.foreign('user_id')
      .references('cedula')
      .inTable('users')
      .onDelete('CASCADE');
      
    table.foreign('mass_parent_id')
      .references('id')
      .inTable('notifications');
  });

  await knex.raw(`
    COMMENT ON TABLE notifications IS 'Tabla principal de las notificaciones del sistema';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('notifications');
};