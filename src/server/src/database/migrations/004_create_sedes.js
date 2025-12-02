// migrations/004_create_sedes.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('sedes', (table) => {
    // Primary Key
    table.smallint('id_sede').primary().notNullable().comment('Identificador único numérico de la ubicación en rango (1-255)');
    
    // Campos principales
    table.string('nombre_sede', 100).unique().notNullable().comment('Nombre descriptivo de la sede (debe ser único)');
    table.string('ubicacion_sede', 150).notNullable().comment('Dirección física de la sede');
    table.string('google_sede', 150).nullable().comment('Enlace de Google Maps o coordenadas de la sede');
    table.string('telefono', 20).nullable().comment('Teléfono de contacto de la sede');
    table.string('email', 100).nullable().comment('Email de contacto de la sede');
    table.string('ciudad', 100).notNullable().comment('Ciudad donde se ubica la sede');
    
    // Campos de estado y soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Estado activo/inactivo de la sede');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización del registro');
    
    // Índices
    table.index('nombre_sede', 'idx_sede_nombre');
    table.index('ciudad', 'idx_sede_ciudad');
  });

  // Crear secuencia para IDs automáticos
  await knex.raw(`
    CREATE SEQUENCE IF NOT EXISTS sedes_id_sede_seq 
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 32767
    CACHE 1;
  `);

  // Asignar la secuencia a la columna id_sede
  await knex.raw(`
    ALTER TABLE sedes 
    ALTER COLUMN id_sede 
    SET DEFAULT nextval('sedes_id_sede_seq');
  `);

  await knex.raw(`
    COMMENT ON TABLE sedes IS 'Tabla de sedes universitarias';
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Remover la secuencia antes de eliminar la tabla
  await knex.raw(`
    ALTER TABLE sedes 
    ALTER COLUMN id_sede 
    DROP DEFAULT;
  `);

  await knex.raw(`
    DROP SEQUENCE IF EXISTS sedes_id_sede_seq;
  `);

  await knex.schema.dropTable('sedes');
}