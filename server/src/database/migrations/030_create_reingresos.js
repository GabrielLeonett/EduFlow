// migrations/029_create_reingresos.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('reingresos', (table) => {
    // Columnas principales
    table.bigIncrements('id_reingreso').primary().comment('ID único del reingreso');
    table.integer('usuario_id').notNullable().comment('ID del usuario que solicita el reingreso');
    table.integer('rol_id').notNullable().comment('ID del rol al que solicita reingresar');
    
    // Información del reingreso
    table.enu('tipo_reingreso', ['REINGRESO', 'REINCORPORACION', 'REINTEGRO']).notNullable().comment('Tipo de reingreso solicitado');
    table.text('motivo_reingreso').notNullable().comment('Motivo del reingreso');
    table.text('observaciones').nullable().comment('Observaciones adicionales');
    table.date('fecha_solicitud').notNullable().comment('Fecha de solicitud del reingreso');
    table.date('fecha_aprobacion').nullable().comment('Fecha de aprobación del reingreso');
    table.date('fecha_efectiva').notNullable().comment('Fecha efectiva del reingreso');
    
    // Referencia al registro anterior de destitución/eliminación
    table.bigInteger('registro_anterior_id').notNullable().comment('ID del registro anterior de destitución');
    
    // Estado del proceso
    table.enu('estado', ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO']).defaultTo('PENDIENTE').comment('Estado del proceso de reingreso');
    
    // Usuarios involucrados
    table.integer('usuario_solicitante').notNullable().comment('Usuario que solicita el reingreso');
    table.integer('usuario_aprobador').nullable().comment('Usuario que aprueba el reingreso');
    
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
         .onDelete('RESTRICT');
         
    table.foreign('rol_id')
         .references('id_rol')
         .inTable('roles')
         .onDelete('RESTRICT');
         
    table.foreign('registro_anterior_id')
         .references('id_registro')
         .inTable('destituciones')
         .onDelete('RESTRICT');
         
    table.foreign('usuario_solicitante')
         .references('cedula')
         .inTable('users')
         .onDelete('RESTRICT');
         
    table.foreign('usuario_aprobador')
         .references('cedula')
         .inTable('users')
         .onDelete('RESTRICT');

    // Índices
    table.index('usuario_id', 'idx_reingresos_usuario');
    table.index('rol_id', 'idx_reingresos_rol');
    table.index('registro_anterior_id', 'idx_reingresos_anterior');
    table.index('estado', 'idx_reingresos_estado');
    table.index('fecha_efectiva', 'idx_reingresos_fecha_efectiva');
    table.index('fecha_solicitud', 'idx_reingresos_fecha_solicitud');
    table.index('tipo_reingreso', 'idx_reingresos_tipo');
    table.index('activo', 'idx_reingresos_activo');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('reingresos');
}