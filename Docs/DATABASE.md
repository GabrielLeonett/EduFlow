# 🗄️ Database Documentation – UPTAMCA Academic Management System
Documentación oficial de la estructura de la base de datos del Sistema de Gestión Académica y Docente de la UPTAMCA

## 📌 Información General
 ELEMENTO	              DETALLE
Motor de BD	             PostgreSQL
Arquitectura	          Relacional
Backend	                Node.js + Express
Esquemas utilizados	    public, respuestas, utils, validaciones
Soft Delete	             ✅ Soportado (deleted_at)
Auditoría	             ✅ (created_at, updated_at)
Sistema de Logs	       ✅ Integrado

## 🧩 Esquemas de Base de Datos
 ESQUEMA	              DESCRIPCION
public	      Tablas principales del sistema
respuestas	   Funciones para estandarizar respuestas JSON
utils	         Funciones y herramientas auxiliares
validaciones	Funciones de validación de datos

📊 Tablas Principales
1. users
   Campo	             Tipo	                   Descripción
cedula	            integer (PK)	  Identificador único del usuario
nombres	            varchar	          Nombres
apellidos	        varchar	          Apellidos
email	            varchar	          Correo electrónico
password	        varchar	          Contraseña encriptada
direccion	        varchar	          Dirección
telefono_movil	    varchar	          Teléfono móvil
telefono_local	    varchar	          Teléfono local
fecha_nacimiento	date	          Fecha de nacimiento
genero	            varchar	          Género
imagen	            varchar	          Ruta de imagen
primera_vez	        boolean	          Primer inicio de sesión
activo	            boolean	          Estado del usuario
last_login	        timestamp	      Último acceso
created_at	        timestamp	      Fecha de creación
updated_at	        timestamp	      Fecha de actualización
deleted_at	        timestamp	      Eliminación lógica
2. profesores
Campo	Tipo
id_profesor (PK)	bigint
id_cedula (FK)	integer → users.cedula
municipio	varchar
fecha_ingreso	date
activo	boolean
created_at / updated_at / deleted_at	timestamp
3. pnfs
Campo	Tipo
id_pnf (PK)	bigint
nombre_pnf	varchar
descripcion_pnf	text
codigo_pnf	varchar
duracion_trayectos	integer
poblacion_estudiantil_pnf	integer
id_sede (FK)	bigint
activo	boolean
created_at / updated_at / deleted_at	timestamp
4. trayectos
Campo	Tipo
id_trayecto (PK)	bigint
valor_trayecto	varchar
descripcion_trayecto	varchar
poblacion_estudiantil	integer
id_pnf (FK)	bigint → pnfs.id_pnf
activo	boolean
created_at / updated_at / deleted_at	timestamp
5. unidades_curriculares
Campo	Tipo
id_unidad_curricular (PK)	bigint
codigo_unidad	varchar
nombre_unidad_curricular	varchar
descripcion_unidad_curricular	text
horas_clase	smallint
id_trayecto (FK)	bigint
activo	boolean
6. horarios (Tabla central)
Campo	Tipo
id_horario (PK)	bigint
seccion_id (FK)	bigint
profesor_id (FK)	bigint
unidad_curricular_id (FK)	bigint
aula_id (FK)	integer
dia_semana	varchar
hora_inicio	time
hora_fin	time
activo	boolean
created_at / updated_at / deleted_at	timestamp
7. aulas
Campo	Tipo
id_aula (PK)	integer
id_sede (FK)	bigint
codigo_aula	varchar
tipo_aula	varchar
capacidad_aula	integer
id_pnf_asignado (FK)	bigint
activa	boolean
created_at / updated_at	timestamp
8. secciones
Campo	Tipo
id_seccion (PK)	bigint
valor_seccion	varchar
id_trayecto (FK)	bigint
id_turno (FK)	bigint
cupos_disponibles	integer
created_at / updated_at	timestamp
9. Roles y relación de usuarios
roles
Campo	Tipo
id_rol (PK)	integer
nombre_rol	varchar
usuario_rol
Campo	Tipo
usuario_id (FK)	integer → users.cedula
rol_id (FK)	integer → roles.id_rol