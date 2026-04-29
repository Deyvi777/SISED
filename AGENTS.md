# Reglas del Proyecto (AGENTS.md)

Este proyecto es un **Sistema de Evaluación Docente** (SISED) optimizado para ejecutarse en una red local (LAN) brindando soporte a computadoras y navegadores antiguos (ej. Chrome 109 / Windows 7). 


## 1. Stack Tecnológico
- **Framework:** Next.js 16.2.4 (App Router)
- **Lenguaje:** TypeScript
- **Base de Datos:** SQLite
- **ORM:** Prisma
- **Estilos:** CSS estándar / CSS modules / Inline styles (No se usa TailwindCSS de momento, salvo que se configure explícitamente).
- **Librerías Extra:** `xlsx` para exportación de reportes.

## 2. Arquitectura de Next.js
- **Server Components vs Client Components:** Por defecto los componentes son de servidor. Utiliza `'use client'` al principio del archivo SÓLO cuando se requiera interactividad en el cliente (ej: uso de `useState`, `useEffect`, `useRouter`, manejadores de eventos como `onClick`).
- **Server Actions:** Todas las operaciones de mutación de base de datos o lecturas seguras deben alojarse en `/app/actions.ts` y marcarse con `'use server'`.
- **Suspense Boundaries:** Asegúrate de envolver en `<Suspense>` el uso de hooks como `useSearchParams` cuando se genera código optimizado en producción.

## 3. Optimización para Red Local (LAN) y Navegadores Antiguos
- **Modo Producción:** El acceso de los estudiantes a través de computadoras en la red local debe realizarse siempre en Modo Producción (`pnpm run build` seguido de `pnpm run start`) para evitar errores de conexión al Webpack HMR (Hot Module Replacement) que afecta a navegadores antiguos en modo de desarrollo (`next dev`).
- **Compatibilidad de Navegadores:** Mantener `browserslist` configurado (ej: `chrome 109`) para que el código compilado incluya los polyfills de JavaScript necesarios.
- **Acceso en Red:** El comando de inicio debe estar configurado para exponer el servidor a la red usando el host `0.0.0.0` (ej. `next start -H 0.0.0.0`).

## 4. Estilos y Experiencia de Usuario (UI/UX)
- Mantén una estética "premium" (fondos oscuros, glassmorphism, gradientes atractivos).
- Minimiza las dependencias externas cuando sea posible, construyendo componentes reusables directamente.
- Proporciona retroalimentación visual clara (estados de carga, mensajes de error, notificaciones de éxito).

## 5. Prácticas de Tipado
- Mantén estricto el tipado de TypeScript.
- Evita el uso injustificado de `any`. En su lugar, usa tipado específico o `unknown` para capturar errores de forma controlada.
- Al mapear datos provenientes de base de datos (Prisma), asegúrate de reflejar que los campos opcionales pueden ser nulos (`string | null`).

## 6. Módulos y Funcionalidades Recientes
- **Módulo de Gamificación:** Soporte para juegos interactivos (ej: Clasificación de Hardware) con persistencia de puntajes (`GameScore`) y configuraciones de acceso/intentos por curso (`GameConfig`).
- **Exportación de Reportes:** Descarga de resultados de evaluaciones y progreso de juegos en formato Excel (.xlsx).
