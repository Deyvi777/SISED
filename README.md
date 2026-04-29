# SISED - Sistema de Evaluación Docente 🖥️📝

SISED es una plataforma web moderna diseñada para la creación, gestión y toma de evaluaciones en entornos educativos locales. Está optimizada para ejecutarse eficientemente en redes locales (LAN) y ofrece total compatibilidad con computadoras y navegadores antiguos (ej. Chrome 109 / Windows 7).


## 🚀 Características Principales

- **Gestión de Evaluaciones:** Creación de exámenes con múltiples tipos de preguntas (opción múltiple, completar espacios, respuesta abierta).
- **Módulo de Gamificación:** Juegos educativos e interactivos (ej: Clasificación de Hardware) con persistencia de puntajes y límites de intentos configurables por curso.
- **Exportación de Reportes:** Descarga directa de resultados y progreso de los alumnos en formato Excel (`.xlsx`).
- **Padrón de Estudiantes:** Directorio completo de alumnos por curso.
- **Optimización LAN:** Carga rápida y estabilidad de red sin depender de internet.

---

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje:** TypeScript
- **Base de Datos:** SQLite (Local y Ligero)
- **ORM:** Prisma
- **Estilos:** CSS Vanilla / Módulos CSS (Garantía de compatibilidad sin dependencias pesadas).

---

## 💻 Requisitos de Instalación

1. **Node.js** (Versión 18 o superior recomendada).
2. Un gestor de paquetes (`npm` o `pnpm`).

---

## ⚙️ Guía de Inicio Rápido (Instalación limpia)

Sigue estos pasos cuando clones el repositorio por primera vez:

### 1. Instalar dependencias
```bash
npm install
# o
pnpm install
```

### 2. Inicializar la base de datos vacía
Este comando generará el archivo `.env`, creará un archivo de base de datos limpio (`dev.db`) y preparará el cliente Prisma:
```bash
npm run db:init
# o
pnpm db:init
```

---

## 🏃 Modo de Ejecución

### En Desarrollo (Para programadores)
```bash
npm run dev
# o
pnpm dev
```

### En Producción (Recomendado para Red Local / LAN)
Para que los alumnos no experimenten fallos de conexión por HMR en navegadores antiguos:

1. **Compilar el proyecto:**
   ```bash
   npm run build
   # o
   pnpm build
   ```
2. **Arrancar el servidor expuesto a la LAN:**
   ```bash
   npm run start
   # o
   pnpm start
   ```
   *Nota: Esto abrirá el puerto `3000` accesible en toda la red local mediante la IP de tu servidor (ej. `http://192.168.1.15:3000`).*
