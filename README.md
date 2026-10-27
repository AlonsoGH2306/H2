# Log Pose Console

Consola de cazarrecompensas para la Hackathon Frontend de CS 2031 (DBP). Construida con React, TypeScript, Vite, React Router y Tailwind CSS.

> *"El Log Pose no elige el camino. Solo te dice cuál es el siguiente."*

## Tripulación

| Integrante | Código UTEC | GitHub |
|---|---:|---|
| Omar Alonzo Guzmán Harvey | 202510519 | [AlonsoGH2306](https://github.com/AlonsoGH2306) |
| Edson Yener Falcon Jimenez | 202510492 | [edsonfalcon](https://github.com/edsonfalcon) |

**Código de equipo:** `TEAM-043`  
**Nombre de la tripulación:** Patitos

## Estado de los checkpoints

- **CP1 — Zarpar:** registro, login, logout, rutas privadas, restauración de sesión, dashboard con `/dashboard/summary` y `/log-pose`, estados de carga/error/vacío y 404.
- **CP2 — Se Busca:** listado paginado del servidor, filtros combinables, búsqueda con debounce, orden, tamaño de página, estado completo en la URL, corrección de URLs inválidas, protección contra respuestas antiguas y detalle con retorno al listado.
- **CP3 — Reverse Mountain:** pendiente de inspección presencial.
- **CP4 y CP5:** se implementarán después de aprobar el CP3.

El enunciado original de la hackathon se conserva en [`docs/ENUNCIADO.md`](docs/ENUNCIADO.md).

## Stack

- React 19 + TypeScript estricto.
- Vite 7.
- React Router 7.
- Tailwind CSS 4 (plugin de Vite).
- Fetch API nativo.
- Sin librerías de caché de servidor, estado en URL, scroll infinito, animación o dashboards prefabricados.

## Cómo ejecutar

Requisitos: **Node.js 24 LTS** y npm.

```bash
npm install
npm run dev
```

La app abre en `http://localhost:5173`.

El proyecto incluye un `.env` con la URL pública de la API del curso:

```txt
VITE_API_BASE_URL=https://logpose-api-jg7f.onrender.com/api/v1
```

Si el docente asigna otra URL, cámbiala en `.env` o crea `.env.local` (ignorado por git). La URL **no** está escrita en el código: se lee desde `import.meta.env.VITE_API_BASE_URL`.

Comandos disponibles:

```bash
npm run dev        # servidor de desarrollo
npm run typecheck  # TypeScript estricto, sin emitir
npm run build      # typecheck + build de producción
npm run preview    # sirve el build
```

## Cuenta de la tripulación

El registro se hace desde `/register` o desde Swagger. Cada tripulación comparte un único email y una única contraseña; el backend asigna el `TEAM_CODE` y crea un workspace aislado.

**Las credenciales de la tripulación no se versionan en este repositorio.** Se comparten por el canal privado del equipo y se usan en la inspección del CP3.

## Decisiones técnicas

### Sesión y rutas privadas

- El JWT se guarda en `localStorage` bajo una única clave (`logpose.token`) y se envía como `Authorization: Bearer` desde un cliente HTTP compartido.
- `AuthProvider` expone cuatro estados: `loading`, `anonymous`, `authenticated` y `error`. Al recargar, valida el token con `GET /auth/me` y mantiene `loading` para no mostrar el login mientras verifica.
- `RequireAuth` conserva `pathname + search + hash` en `location.state`; después del login se vuelve exactamente a esa URL.
- Un `401` en cualquier endpoint protegido emite un evento interno que limpia la sesión; la guarda redirige al login.
- Si `/auth/me` falla por red o `5xx`, no se borra el token: se muestra una pantalla de reintento para no destruir una sesión que podría seguir siendo válida.

### Dashboard

- `/dashboard/summary` y `/log-pose` se consultan en paralelo con estados independientes.
- El estado vacío se activa cuando `wanted.total === 0`; no se inventan datos.
- Los errores muestran un botón de reintento y respetan `Retry-After` cuando la API responde `429`.

### `/wanted`: la URL como fuente de verdad

- `parseWantedQuery` valida cada parámetro (`page`, `size`, `status`, `crewId`, `fruit`, `q`, `sort`) antes de llamar a la API. Una URL con valores inválidos se limpia con `replace` y la vista sigue funcionando.
- Los filtros, la búsqueda, el orden y el tamaño se serializan en la URL; recargar, compartir o usar atrás/adelante reproduce el mismo estado.
- La búsqueda se debouncea 400 ms y solo entonces actualiza la URL y dispara la consulta.
- `useApiQuery` cancela la petición anterior con `AbortController` y descarta respuestas antiguas con un número de secuencia. Así una respuesta lenta no pisa el rumbo actual.
- La paginación es real del servidor. Si `page >= totalPages`, la app corrige a la última página existente. Cambiar filtros, búsqueda u orden vuelve siempre a la página 0.
- El listado reserva altura para el grid, el error y el estado vacío; el layout no salta entre estados.
- Al abrir un cartel se guarda la posición de scroll en `sessionStorage`; al volver, se restaura la misma URL y la misma posición.

### Calidad

- TypeScript estricto, sin `any`.
- Validación de las respuestas de la API en runtime: el cliente devuelve `unknown` y cada feature parsea el contrato antes de usarlo.
- Componentes en `.tsx`, Tailwind para estilos, SVG propios para la identidad visual. No se usan imágenes ni logos oficiales del anime.
- Respeto por `prefers-reduced-motion` y navegación por teclado.

## Estructura

```txt
src/
  auth/         AuthProvider y guardas de ruta
  components/   Layout, estados, badges, paginación, cartel
  hooks/        useApiQuery, useDebouncedValue, usePageTitle
  lib/          Cliente HTTP, sesión, formato, URL de /wanted, scroll
  pages/        Login, registro, dashboard, listado, detalle y 404
  types/        Contratos TypeScript de la API
  App.tsx       Rutas
  index.css     Tailwind + tema visual
```
