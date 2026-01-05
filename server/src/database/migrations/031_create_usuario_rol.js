// migrations/xxxx_create_usuario_rol.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex){
  await knex.schema.createTable('usuario_rol', (table) => {
    table.integer('usuario_id').notNullable().comment('ID del usuario en la tabla usuarios (parte de clave foránea)');
    table.integer('rol_id').notNullable().comment('ID del rol en la tabla roles (parte de clave foránea)');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha y hora de asignación del rol');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha y hora de última actualización de la asignación');

    // Clave primaria compuesta
    table.primary(['usuario_id', 'rol_id'], 'usuario_rol_pkey');

    // Relaciones (CASCADE como especificaste)
    table.foreign('usuario_id')
      .references('cedula')
      .inTable('users')
      .onDelete('CASCADE');
    
    table.foreign('rol_id')
      .references('id_rol')
      .inTable('roles')
      .onDelete('CASCADE');
  });

  await knex.raw(`
    COMMENT ON TABLE usuario_rol IS 'Tabla de relación muchos-a-muchos entre usuarios y roles';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex){
  await knex.schema.dropTable('usuario_rol');
};