// migrations/005_create_pnfs.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('pnfs', (table) => {  
    // Primary Key - Usando smallint directamente para evitar problemas
    table.smallint('id_pnf').primary().notNullable().comment('ID único del PNF');
    
    // Campos principales
    table.string('codigo_pnf', 10).unique().notNullable().comment('Código institucional del PNF (ej: ING-INF)');
    table.string('nombre_pnf', 100).unique().notNullable().comment('Nombre completo del Programa Nacional de Formación');
    table.text('descripcion_pnf').notNullable().comment('Objetivos y alcance del programa');
    table.integer('duracion_trayectos').notNullable().comment('Duración oficial en trayectos');
    table.integer('poblacion_estudiantil_pnf').notNullable().defaultTo(0).comment('Estudiantes activos registrados');
    
    // Foreign Key a sede
    table.smallint('id_sede').notNullable().comment('ID de la sede donde se imparte el PNF');
    
    // Campos de estado y soft delete
    table.boolean('activo').notNullable().defaultTo(true).comment('Indica si el PNF está actualmente activo');
    table.timestamp('deleted_at').nullable().comment('Fecha de eliminación soft delete');
    
    // Campos de auditoría
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de creación del registro');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Fecha de última actualización');
    
    // Foreign Keys
    table.foreign('id_sede')
      .references('id_sede')
      .inTable('sedes')
      .onDelete('RESTRICT');
    
    // Índices
    table.index('codigo_pnf', 'idx_pnfs_codigo');
    table.index('activo', 'idx_pnfs_estado');
    table.index('nombre_pnf', 'idx_pnfs_nombre');
    table.index('id_sede', 'idx_pnfs_sede');
  });

  await knex.raw(`
    COMMENT ON TABLE pnfs IS 'Tabla de Programas Nacionales de Formación (PNFs)';
    
    -- Crear secuencia para IDs automáticos
    CREATE SEQUENCE IF NOT EXISTS pnfs_id_pnf_seq 
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 32767
    CACHE 1;
    
    -- Asignar la secuencia a la columna id_pnf
    ALTER TABLE pnfs 
    ALTER COLUMN id_pnf 
    SET DEFAULT nextval('pnfs_id_pnf_seq');
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Primero remover la dependencia de la secuencia
  await knex.raw(`
    ALTER TABLE pnfs 
    ALTER COLUMN id_pnf 
    DROP DEFAULT;
  `);
  
  // Luego eliminar la tabla
  await knex.schema.dropTable('pnfs');
  
  // Finalmente eliminar la secuencia
  await knex.raw('DROP SEQUENCE IF EXISTS pnfs_id_pnf_seq;');
}