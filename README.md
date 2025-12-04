# 🏫 UPTAMCA Academic Management System

[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)
[![MUI](https://img.shields.io/badge/MUI-5.14-purple.svg)](https://mui.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Sistema integral de gestión académica y docente para el Vicerrectorado Académico de la UPTAMCA**

## 📋 Tabla de Contenidos
- [✨ Características](#-características)
- [🏗️ Arquitectura](#️-arquitectura)
- [🚀 Instalación](#-instalación)
- [🛠️ Configuración](#️-configuración)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🔧 Uso y Funcionalidades](#-uso-y-funcionalidades)
- [🧪 Testing](#-testing)
- [📦 Despliegue](#-despliegue)
- [🤝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)
- [👥 Contacto](#-contacto)

## ✨ Características

### 🎯 **Gestión Académica Integral**
- **Registro de Profesores**: Gestión completa de datos docentes y disponibilidad horaria
- **Planificación de Horarios**: Creación y optimización automática de horarios académicos
- **Gestión de PNFs**: Administración completa de Programas Nacionales de Formación
- **Control de Espacios**: Administración de aulas, laboratorios y espacios físicos

### ⚡ **Funcionalidades Avanzadas**
- **Generación de Documentos**: Exportación automática a Word (reportes, horarios, certificaciones)
- **Auditoría Completa**: Trazabilidad de todas las operaciones del sistema
- **Notificaciones en Tiempo Real**: Alertas y comunicaciones instantáneas
- **Dashboard Interactivo**: Visualización de métricas y estadísticas académicas

### 🛡️ **Beneficios Institucionales**
- ✅ **Fuente Única de Verdad**: Centralización de información académica
- ✅ **Reducción de Costos**: Optimización de recursos humanos y materiales
- ✅ **Eficiencia Operativa**: Automatización de procesos manuales
- ✅ **Acceso Remoto**: Disponibilidad 24/7 desde cualquier dispositivo

## 🏗️ Arquitectura

```mermaid
graph TB
    A[Cliente Web] --> B[Frontend React + MUI]
    B --> C[Backend Node.js + Express]
    C --> D[(PostgreSQL)]
    C --> E[Redis Cache]
    C --> F[Servicio de Notificaciones]
    F --> G[Email/SMS]
    C --> H[Generador DOCX]