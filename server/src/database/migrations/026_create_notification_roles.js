// migrations/xxxx_create_notification_roles.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('notification_roles', (table) => {
    table.bigInteger('notification_id').notNullable().comment('ID de la notificación relacionada');
    table.integer('role_id').notNullable().comment('ID del rol destinatario');

    // Clave primaria compuesta
    table.primary(['notification_id', 'role_id'], 'notification_roles_pkey');

    // Relaciones
    table.foreign('notification_id')
      .references('id')
      .inTable('notifications')
      .onDelete('CASCADE');
      
    table.foreign('role_id')
      .references('id_rol')
      .inTable('roles')
      .onDelete('CASCADE');
  });

  await knex.raw(`
    COMMENT ON TABLE notification_roles IS 'Esta tabla es para notificaciones a uno o mas roles';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('notification_roles');
};