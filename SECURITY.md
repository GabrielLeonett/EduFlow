# 🔐 UPTAMCA Academic Management System – Política de Seguridad
Política oficial de reporte y manejo de vulnerabilidades del sistema de gestión académica UPTAMCA.

## 📬 Reporte de Vulnerabilidades
Agradecemos el apoyo de la comunidad para mantener seguro este proyecto.
Si encuentras una vulnerabilidad, repórtala a:

📧 security@uptamca.edu.ve
(Correo temporal recomendado hasta que exista uno institucional oficial.)

Incluye en tu reporte:

📝 Descripción clara del problema
👉 Pasos detallados para reproducirlo
💥 Impacto potencial
📸 Evidencia técnica (logs, capturas, payloads, etc.)
👤 Datos de contacto (opcional)

### ⏱️ Tiempos de Respuesta
Nos comprometemos a:

✔ Confirmar recepción en 48 horas
✔ Enviar respuesta inicial en un máximo de 5 días hábiles
✔ Mantener comunicación constante durante la investigación
✔ Informar cuando la vulnerabilidad haya sido corregida

## 🎯 Alcance
Las siguientes áreas del sistema sí están dentro del alcance para pruebas de seguridad:

⚛️ Frontend React (MUI + React 18)
🟩 Backend Node.js / Express
🐘 Base de datos PostgreSQL
🔌 APIs internas y externas
🖥️ Infraestructura local controlada por el proyecto
📩 Servicio de notificaciones
📝 Generador de documentos DOCX

### Fuera de alcance:

❌ Infraestructura institucional externa
❌ Equipos de terceros
❌ Servicios que no formen parte del repositorio

## 🔍 Vulnerabilidades Aceptadas
Basado en OWASP Top 10:

Injection (SQLi, NoSQLi, Command Injection)
XSS (reflejado, almacenado, DOM-Based)
CSRF
Fallas en autenticación / autorización
Exposición de datos sensibles
Misconfiguraciones de seguridad
RCE (Remote Code Execution)
Vulnerabilidades críticas en dependencias
Exposición de tokens o credenciales
Escalada de privilegios

## 🚫 Vulnerabilidades No Aceptadas
No califican como vulnerabilidad:

Problemas visuales o de estilo
Errores 404 o 500 sin impacto
Divulgación de versión de librerías sin explotación
SPF, DKIM o DMARC mal configurados en correos de prueba
Vulnerabilidades causadas por ingeniería social
Pruebas que requieran DoS o saturación del sistema

## 🧪 Safe Harbor (Protección)
Se permite realizar pruebas de seguridad siempre que:

⚠ No afecten la disponibilidad del sistema
⚠ No modifiquen datos académicos reales
⚠ No hagan DoS/DDoS
⚠ No exploten infraestructura fuera del alcance
⚠ No usen herramientas destructivas

Si cumples estas reglas, no tomaremos acciones en tu contra.

## 📄 Política de Divulgación
Aplicamos una divulgación coordinada suave:

Puedes publicar detalles después de que la vulnerabilidad sea corregida.
Si deseas divulgar antes, solicita aprobación previa.

## 📘 Versiones Soportadas
Se aceptan vulnerabilidades reproducibles en:

🔵 Rama main
🟣 Versiones estables en mantenimiento

No procesamos reportes en ramas antiguas o experimentales.

## ⭐ Reconocimiento
Por ahora no existe un Hall of Fame, pero agradecemos todas las contribuciones responsables que mejoren la seguridad del sistema.

## 🧩 Contacto Adicional
Si no recibes respuesta dentro del plazo indicado, puedes contactar directamente a los desarrolladores del proyecto.