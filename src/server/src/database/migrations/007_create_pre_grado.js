// migrations/007_create_pre_grado.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('pre_grado', (table) => {
    // Primary Key
    table.increments('id_pre_grado').primary().notNullable().comment('ID del pre-grado');
    
    // Campos principales
    table.string('nombre_pre_grado', 100).notNullable().comment('Nombre del pre-grado');
    table.enum('tipo_pre_grado', [
      'Técnico Superior', 'Licenciatura', 'Ingeniería', 'Medicina', 
      'Arquitectura', 'Derecho', 'Educación', 'Administración', 
      'Contaduría', 'Comunicación', 'Psicología', 'Enfermería', 
      'Nutrición', 'Turismo', 'Idiomas'
    ]).notNullable().comment('Tipo de pre-grado');
    table.text('descripcion').nullable().comment('Descripción del pre-grado');
    
    // Campos de estado y soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo del pre-grado');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización del registro');
    
    
    // Índices
    table.index('nombre_pre_grado', 'idx_pre_grado_nombre');
    table.index('tipo_pre_grado', 'idx_pre_grado_tipo');
  });

  await knex.raw(`
    COMMENT ON TABLE pre_grado IS 'Tabla de los pre-grados de los profesores';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('pre_grado');
}