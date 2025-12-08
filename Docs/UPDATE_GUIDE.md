# 🔄 UPDATE GUIDE — UPTAMCA Academic Management System
Guía oficial para la actualización del Sistema de Gestión Académica del Vicerrectorado UPTAMCA.
Esta guía explica cómo actualizar el sistema de forma segura usando PostgreSQL como gestor de base de datos.

## 🎯 Objetivo
Este documento describe el proceso para:

Actualizar el sistema a nuevas versiones
Aplicar mejoras y parches de seguridad
Mantener la integridad de la base de datos PostgreSQL
Proteger la integridad de la información

## ⚠️ Recomendaciones antes de actualizar
Antes de iniciar la actualización:

✅ Realizar copia de seguridad de la base de datos
✅ Confirmar que no haya usuarios activos en el sistema
✅ Verificar espacio disponible en el servidor
✅ Guardar una copia del código actual

## 💾 1. Respaldo de la Base de Datos (PostgreSQL)
Realiza un backup completo con pg_dump:

`pg_dump -U usuario -W -F c -b -v -f backup_sistema.backup nombre_basedatos`

Guarda este archivo en una ubicación segura.

## 📁 2. Respaldo del Sistema
Copia completa del proyecto:

`cp -r proyecto_actual/ proyecto_backup/`

## ⬇️ 3. Descarga de la Nueva Versión
Descarga la nueva versión del sistema.
Extrae los archivos en una carpeta temporal:

`unzip nueva_version.zip -d /tmp/sistema_update`

## 🔄 4. Actualización del Código
Reemplaza los archivos antiguos por los nuevos:
`cp -r /tmp/sistema_update/* /var/www/sistema/`

⚠️ Revisa los archivos de configuración antes de sobrescribirlos.

## ⚙️ 5. Actualización de Dependencias
Dentro del proyecto ejecuta:
`npm install`

## 🧩 6. Actualización de la Base de Datos
Si la nueva versión incluye cambios en la estructura de la base de datos:

Con migraciones: 
`npm run migrate`

## ▶️ 7. Reinicio del Servidor

Reinicia el backend Node.js:
`npm run start`

## 🧪 8. Verificación del Sistema
Después de la actualización:

✅ Inicia el sistema
✅ Accede como administrador
✅ Verifica módulos críticos:
PNFs
Unidades curriculares
Trayectos
Horarios
Usuarios y docentes

## 🚨 9. ¿Qué hacer si falla la actualización?
Restaurar base de datos (PostgreSQL):
`pg_restore -U usuario -d nombre_basedatos -v backup_sistema.backup`

Restaurar el sistema:
`rm -rf /var/www/sistema`
`mv proyecto_backup/ /var/www/sistema`

## 📝 10. Registro de Actualizaciones
Lleva un control con:

Fecha de la actualización
Versión aplicada
Responsable
Observaciones

## ✅ Actualización completada correctamente
El sistema queda listo para su uso normal.