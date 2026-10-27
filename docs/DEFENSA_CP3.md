# Preparación para el CP3 — Reverse Mountain

Guía interna para la inspección presencial del Log Pose. No es una lista para memorizar: cada respuesta debe
explicar **qué problema resolvía** y **cómo quedó resuelto en esta app**.

## Demostración de ~1.5 minutos

1. Abrir `/register` y mostrar:
   - validación local de nombre, email y contraseña;
   - un error del servidor junto al campo (por ejemplo, nombre de tripulación ya usado);
   - que al registrarse entra directo al dashboard.
2. Cerrar sesión y abrir una ruta privada con query, por ejemplo `/wanted?status=CAPTURED&page=1&size=10`.
   - Debe aparecer el login.
   - Iniciar sesión y comprobar que vuelve **exactamente** a esa URL.
3. Recargar el dashboard y señalar que se ve la pantalla de restauración, no el login.
4. Mostrar el dashboard con datos reales de `/dashboard/summary` y el estado de `/log-pose`.
5. En `/wanted`:
   - combinar estado + fruta + tripulación;
   - escribir en la búsqueda y esperar el debounce; señalar que la URL cambia una sola vez;
   - cambiar orden y tamaño de página;
   - recargar y comprobar que todo sigue igual;
   - usar atrás/adelante del navegador.
6. Abrir un cartel, mostrar el detalle y volver: mismo listado, misma página y mismo scroll.
7. Mostrar una URL inválida (`page=999`, `size=999`, `status=XX`) y explicar que se sanea sin romper la vista.
8. Cerrar sesión.

## Preguntas probables y respuestas

### 1. ¿Cómo restauras la sesión al recargar sin que parpadee el login?

**Problema:** si se renderiza el login mientras se valida el token, el usuario ve un parpadeo y puede perder
la ruta a la que quería volver.

**Cómo:** `AuthProvider` arranca en `status = "loading"`. Si hay token en `localStorage`, llama a
`GET /auth/me` y solo cuando responde cambia a `authenticated` o `anonymous`. Las guardas muestran una
pantalla de restauración mientras `loading` es verdadero.

**Por qué:** el estado inicial representa “todavía no sé si la sesión es válida”, no “no hay sesión”. Ese
estado intermedio evita decisiones prematuras de navegación.

### 2. ¿Dónde guardas el token y qué pasa si expira?

**Problema:** el token debe sobrevivir a una recarga, pero no debe romper la app cuando vence.

**Cómo:** se guarda en `localStorage` (`logpose.token`) y se envía en `Authorization: Bearer`. El cliente HTTP
detecta cualquier `401` en un endpoint protegido, emite un evento `logpose:unauthorized`; `AuthProvider`
limpia el token y pasa a `anonymous`; `RequireAuth` redirige a `/login` conservando la ubicación actual.

**Por qué:** centralizar el manejo del `401` evita repetir la misma lógica en cada página y garantiza que
ninguna vista siga mostrando datos con una sesión vencida.

### 3. ¿Cómo vuelve el usuario exactamente a la ruta privada que quería abrir?

**Problema:** si alguien abre `/wanted?status=CAPTURED&page=2`, el login no debe devolverlo al dashboard.

**Cómo:** `RequireAuth` guarda `pathname + search + hash` en `location.state.from`. Después del login (o del
registro), se valida que sea una ruta interna con `safeRedirect` y se navega a ella con `replace`.

**Por qué:** se conserva el estado completo de la URL, no solo el pathname; y se evita un open redirect
porque solo se aceptan rutas que empiezan con `/` y no con `//`.

### 4. ¿Cómo evitas una request por cada tecla en la búsqueda?

**Problema:** escribir “Akane” no debe disparar cinco requests.

**Cómo:** el input mantiene su estado local; `useDebouncedValue` espera 400 ms desde la última tecla y solo
entonces actualiza la URL con `replace`. La consulta se dispara cuando cambia la URL.

**Por qué:** la URL sigue siendo la fuente de verdad, pero el historial no se llena de un estado por letra.
Además, el debounce no retrasa la primera carga ni los filtros.

### 5. ¿Cómo proteges la vista contra una respuesta vieja que llega tarde?

**Problema:** el usuario cambia de filtro y la respuesta anterior llega después; si se pinta, el listado
mostraría resultados que no corresponden a la URL.

**Cómo:** cada consulta crea un `AbortController` y un número de secuencia. Al cambiar los parámetros se
aborta la request anterior; aunque la respuesta llegue, la comparación de secuencia la descarta. El estado
de la consulta se limpia y se muestra el esqueleto de carga.

**Por qué:** la regla del Log Pose es que lo visible corresponda a lo último pedido. Abortar ahorra red y
la secuencia cubre la ventana en la que una respuesta ya estaba en vuelo.

### 6. ¿Cómo funciona la paginación? ¿Es del servidor?

**Problema:** no se puede cargar todo el dataset ni simular páginas en el cliente.

**Cómo:** `/wanted` recibe `page`, `size` (10/20/50) y `sort`; la respuesta trae `content`, `totalElements`,
`totalPages`, `page` y `size`. La UI solo muestra `content` y usa los totales para los controles.

**Por qué:** el servidor es el que conoce el total y el orden estable; el cliente no inventa páginas ni
recorta un array completo.

### 7. ¿Qué pasa si la URL pide una página que ya no existe?

**Problema:** cambiar un filtro puede reducir los resultados y dejar `page=5` apuntando a una página vacía.

**Cómo:** al cambiar filtros, búsqueda, orden o tamaño se vuelve a `page=0`. Además, cuando llega la
respuesta, si `page >= totalPages` la app reemplaza la URL por la última página existente (o por 0 si no hay
resultados). Mientras corrige, muestra el esqueleto, no un estado vacío falso.

**Por qué:** el servidor devuelve `totalPages` incluso cuando la página pedida está fuera de rango; con ese
dato la consola puede corregir el rumbo sin romper la vista.

### 8. ¿Cómo se refleja todo el estado en la URL?

**Problema:** recargar o compartir el enlace debe mostrar exactamente lo mismo.

**Cómo:** `parseWantedQuery` lee y valida `page`, `size`, `status`, `crewId`, `fruit`, `q` y `sort`;
`serializeWantedQuery` escribe solo los valores no predeterminados. Cada control actualiza la URL con
`setSearchParams`; la lista se deriva de esos parámetros.

**Por qué:** una única fuente de verdad evita estados duplicados entre `useState` y la URL y hace que
atrás/adelante funcione sin lógica extra.

### 9. ¿Qué pasa con una URL con valores inválidos?

**Problema:** `size=999` o `status=XX` harían que la API responda `400`.

**Cómo:** antes de llamar a la API, el parser reemplaza valores inválidos por los predeterminados (page 0,
size 20, sort `bounty,desc`, filtros nulos), recorta `q` a 100 caracteres y luego limpia la URL con
`replace`.

**Por qué:** el contrato de la API es estricto; la app no le manda basura y el usuario no ve una pantalla de
error por un enlace mal formado.

### 10. ¿Cómo se conserva el listado al volver del detalle?

**Problema:** al abrir un cartel y volver, el usuario espera la misma página, filtros y posición.

**Cómo:** el detalle recibe `location.state.from` con la URL exacta del listado. Antes de navegar se guarda
`window.scrollY` en `sessionStorage` con una clave que incluye pathname y search. Al montar la lista, después
de tener los datos, se restaura el scroll de forma instantánea (`scrollInstantly`).

**Por qué:** la URL conserva los filtros y la página; el scroll se guarda aparte porque no pertenece a la
URL compartible. `history.scrollRestoration = "manual"` evita que el navegador compita con nuestra
restauración.

### 11. ¿Por qué no usas React Query, SWR o similar?

**Problema:** la hackathon prohíbe librerías que resuelvan caché de servidor.

**Cómo:** `useApiQuery` es un hook propio de ~40 líneas con `AbortController`, secuencia y estados
`data/error/loading`, más un `reload` para reintentar.

**Por qué:** el requisito es demostrar el manejo de fetch, cancelación y estados; una librería lo ocultaría.
El hook mantiene el código pequeño y explícito.

### 12. ¿Cómo manejas los estados de carga, error y vacío sin mover el layout?

**Problema:** el contenido cambia de altura y la paginación “salta”.

**Cómo:** el listado tiene un contenedor con `min-height`, el esqueleto usa la misma grilla y alto de tarjeta
que el resultado, y el pie de paginación reserva altura. El error y el vacío ocupan el mismo bloque.

**Por qué:** el layout estable evita que el usuario pierda el contexto y que los botones se muevan bajo el
cursor.

### 13. ¿Qué datos del dashboard son reales?

**Problema:** no se puede hardcodear el resumen.

**Cómo:** `/dashboard/summary` entrega `team`, `wanted.total`, `totalBounty`, `averageBounty`, `byStatus`,
`byFruit`, `crews.total`, `crews.mostWanted` y `topBounties`; `/log-pose` entrega el estado del instrumento.
La UI solo formatea esos valores. Si `wanted.total === 0`, muestra el estado vacío.

**Por qué:** el evaluador usa datos distintos; cualquier número fijo invalidaría la entrega.

### 14. ¿Cómo se muestra el Log Pose y qué significa?

**Problema:** el Grand Line no debe parecer abierto antes de la inspección.

**Cómo:** `/log-pose` devuelve `status` (`LOCKED`/`UNLOCKED`), `grandLineUnlocked`, `unlockedAt` y `message`.
La tarjeta muestra el mensaje del servidor y un estado visual distinto; no hay ningún endpoint del Grand Line
en CP1/CP2.

**Por qué:** el bloqueo lo aplica el backend; la consola solo refleja el estado real y no intenta evadirlo.

### 15. ¿Cómo está organizado el código?

**Problema:** dos personas trabajando en paralelo necesitan límites claros.

**Cómo:** `lib/api.ts` concentra HTTP, errores y parseo; `auth/` la sesión y guardas; `pages/` las vistas;
`components/` piezas reutilizables; `hooks/` lógica reutilizable; `types/` el contrato. Las rutas están en
`App.tsx`.

**Por qué:** cada capa tiene una responsabilidad y se puede explicar por separado. El parseo en runtime
protege la UI de respuestas fuera de contrato.

### 16. ¿Qué pasa si el backend responde 429 o 5xx?

**Problema:** un bucle de requests o una caída no deben dejar la app colgada.

**Cómo:** el cliente convierte la respuesta en `ApiError` con `code`, `message`, `details`, `traceId` y
`retryAfterSeconds`. `ErrorPanel` muestra el mensaje, deshabilita el reintento durante `Retry-After` y vuelve
a intentar cuando el usuario lo pide.

**Por qué:** se respeta el contrato y se evita empeorar el rate limit con reintentos automáticos.

### 17. ¿Cómo se evita el abuso de `any` y los errores de tipos?

**Problema:** TypeScript estricto y sin `any` es requisito.

**Cómo:** el cliente HTTP devuelve `unknown`; cada parser valida con guards (`asRecord`, `asString`,
`asInteger`, `asEnum`, etc.) y lanza un `ContractError` si no cumple. `tsconfig` tiene `strict`,
`noUnusedLocals`, `noUnusedParameters` y `verbatimModuleSyntax`.

**Por qué:** el contrato se comprueba en el borde de la app; el resto del código trabaja con tipos ya
validados.

## Repaso rápido de archivos

| Tema | Archivo |
|---|---|
| Cliente HTTP, errores, parseo | `src/lib/api.ts` |
| Sesión y restauración | `src/auth/AuthContext.tsx`, `src/auth/guards.tsx` |
| Estado de `/wanted` en la URL | `src/lib/wanted-query.ts` |
| Cancelación y respuestas viejas | `src/hooks/useApiQuery.ts` |
| Debounce de búsqueda | `src/hooks/useDebouncedValue.ts` |
| Listado, filtros y paginación | `src/pages/WantedListPage.tsx` |
| Detalle y retorno | `src/pages/WantedDetailPage.tsx` |
| Dashboard y Log Pose | `src/pages/DashboardPage.tsx` |
| Rutas | `src/App.tsx` |

## Antes de la inspección

- [ ] `npm run build` pasa sin errores.
- [ ] La app corre en `http://localhost:5173` con `npm run dev`.
- [ ] La cuenta de la tripulación inicia sesión y el dashboard muestra datos.
- [ ] Probar el flujo de ruta privada con una URL con filtros.
- [ ] Tener a mano el `TEAM-043` y la cuenta oficial.
- [ ] No abrir el inspector con la consola llena de errores; los `401` esperados del login incorrecto no
      cuentan, pero conviene limpiar la consola antes de la demo.
