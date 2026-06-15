# FireSolutions Academy

Aplicacion educativa para visualizar e interpretar sistemas contra incendio normados por NFPA con apoyo de modelos 3D, fichas tecnicas bilingues y referencias reales de fabricantes.

## Stack

- `Astro` para rutas y shell de la aplicacion
- `React` para componentes interactivos
- `Three.js` para visualizacion 3D
- `Tailwind CSS` para estilos de interfaz
- `pnpm` como gestor de paquetes

## Estado actual

- Ruta principal `src/pages/index.astro`
- Layout base `src/layouts/BaseLayout.astro`
- Shell educativa React `src/components/FirePumpLearningExperience.jsx`
- Visor 3D reutilizable `src/components/FirePumpSystem3D.jsx`
- Datos tecnicos bilingues y roadmap `src/data/firePumpSystem.js`
- Memoria semantica del proyecto `docs/project-semantic-graph.json`
- La seleccion activa del visor ahora se controla desde el shell React para evitar bucles visuales entre `defaultSelectedId` y `onSelectionChange`
- La interfaz principal usa tarjetas con radios mas sutiles y acabado glass sobrio para mantener una lectura profesional y educativa
- El bloque principal del visor se organizo para aprovechar mejor la altura visible de pantalla en desktop

## Comandos

- `pnpm dev`: inicia el entorno local
- `pnpm build`: compila el proyecto
- `pnpm preview`: sirve la version compilada

## Enfoque del producto

El primer modulo activo es un sistema paquetizado de bombeo contra incendio para un centro de distribucion, con base generica realista y referencias SPP, Clarke y Tornatech. A partir de esta base se iran incorporando:

- nuevos sistemas normados por NFPA
- red de rociadores y continuidad del circuito hidraulico
- agentes limpios FK-5-1-12 y CO2
- deteccion convencional e inteligente
- recorridos guiados, evaluaciones y explicaciones tecnicas por componente

## Modulo 1

- Caso base: centro de distribucion
- Baseline educativo: `1500 GPM @ 120 PSI`
- Idioma: bilingue tecnico `ES / EN`
- Interaccion: seleccion de componente, lectura de fichas, mapa de subsistemas
- Alcance visible actual: estanque, succion, bombas, controladores, tanque diesel, escape, conexiones ranuradas, red perimetral, hidrantes, FDC, riser y red de rociadores de bodega
- Modos activos: exploracion, circuito hidraulico, recorrido guiado e inspeccion base
- Controles del visor: orbitacion, zoom local, focus mode y techo desmontable
- Ajuste visual reciente: menor redondeo, jerarquia tipografica mas sobria y composicion mas compacta alrededor del visor
- Ajuste reciente: el click en vacio ya no fuerza reseleccionar automaticamente el primer componente visible
- Registro del cierre del modulo: `docs/module-01-handover.md`

## Mantenimiento de memoria

Cuando cambie la arquitectura, los modulos o el alcance del producto, actualiza `docs/project-semantic-graph.json` para conservar una referencia persistente del estado del proyecto.
# firesolutionapp
