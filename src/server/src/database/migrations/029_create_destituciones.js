// migrations/028_create_destituciones.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('destituciones', (table) => {
    // Columnas principales
    table.bigIncrements('id_registro').primary().comment('ID único del registro');
    table.integer('usuario_id').notNullable().comment('ID del usuario afectado');
    table.integer('rol_id').notNullable().comment('ID del rol del que fue destituido/eliminado');
    table.enu('tipo_accion', ['DESTITUCION', 'ELIMINACION', 'RENUNCIA', 'RETIRO']).notNullable().comment('Tipo de acción ejecutada');
    table.text('razon').notNullable().comment('Razón principal de la destitución/eliminación');
    table.text('observaciones').nullable().comment('Observaciones adicionales o detalles');
    table.date('fecha_efectiva').notNullable().comment('Fecha cuando la acción es efectiva');
    table.integer('usuario_accion').notNullable().comment('Usuario que ejecutó la acción');
    
    // Soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo del registro');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría básicos
    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').defaultTo(knex.fn.now()).comment('Fecha de última actualización');

    // Foreign keys
    table.foreign('usuario_id')
         .references('cedula')
         .inTable('users')
         .onDelete('CASCADE');
         
    table.foreign('rol_id')
         .references('id_rol')
         .inTable('roles')
         .onDelete('CASCADE');
         
    table.foreign('usuario_accion')
         .references('cedula')
         .inTable('users')
         .onDelete('CASCADE');

    // Índices
    table.index('usuario_id', 'idx_destituciones_usuario');
    table.index('rol_id', 'idx_destituciones_rol');
    table.index('fecha_efectiva', 'idx_destituciones_fecha');
    table.index('tipo_accion', 'idx_destituciones_tipo_accion');
    table.index('activo', 'idx_destituciones_activo');
  });

  await knex.raw(`
    COMMENT ON TABLE destituciones IS 'Registro de destituciones, eliminaciones, renuncias o retiros de usuarios de roles específicos';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('destituciones');
}