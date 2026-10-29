# Arquitectura de 5 Capas — SimuNet Física

```
src/
├── main.tsx                    # Punto de arranque React
├── index.css                   # Estilos globales
├── types.ts                    # CAPA 1 — Dominio (Entidades, modelos, métricas EM)
├── interfaz.tsx                # CAPA 2 — Interfaz principal y vistas interactivas
├── components/
│   ├── NetworkGrid.tsx         # Lienzo 2D de campo electromagnético e inspector
│   ├── ControlPanel.tsx        # Controles de frecuencia, materiales y métodos
│   └── GraphPanel.tsx          # Gráficas de convergencia, omega y validación ITU-R
├── traduccion.ts               # CAPA 3 — Digitalización ITU-R BT.601 e i18n (es/en)
├── controlador.ts              # CAPA 4 — Motor de malla Dirichlet y validación física
├── metodos/
│   ├── jacobi.ts               # Esquema iterativo de Jacobi
│   ├── gauss-seidel.ts         # Esquema iterativo de Gauss-Seidel
│   ├── sor.ts                  # Esquema de Sobre-Relajación Sucesiva (SOR)
│   └── index.ts
└── servicios.ts                # CAPA 5 — Conversión dBm, Vector de Poynting y campos E/H
```

## Reglas de dependencia

| Capa | Puede importar de |
|------|-------------------|
| 1 — Dominio (`types.ts`) | *(ninguna otra capa)* |
| 2 — Interfaz (`interfaz.tsx`, `components/`) | 1, 3, 4, 5 |
| 3 — Aplicación (`traduccion.ts`) | 1 |
| 4 — Numérico (`controlador.ts`, `metodos/`) | 1, 5 |
| 5 — Servicios (`servicios.ts`) | 1 |

**Prohibido:** que capas inferiores importen de capas superiores.

## Flujo de datos

```
Usuario (Capa 2: Interfaz)
    ↓ eventos
Controlador y Digitalizador (Capas 3 y 4)
    ↓ invoca
Métodos Iterativos: Jacobi / Gauss-Seidel / SOR (Capa 4)
    ↓ usa tipos/materiales ITU-R P.2040
Dominio (Capa 1)
    ↓ calcula dBm, Vector de Poynting, E_rms, H_rms y CSV
Servicios Electromagnéticos (Capa 5)
```

## Responsabilidad por capa

- **Capa 1:** Qué es el sistema (celdas, routers UHF/SHF, materiales dieléctricos, métricas electromagnéticas).
- **Capa 2:** Cómo se ve e interactúa el usuario con la malla 2D y las gráficas científicas.
- **Capa 3:** Procesamiento de imágenes de planos (ITU-R BT.601) y diccionarios de idioma.
- **Capa 4:** Discretización en Diferencias Finitas, condiciones de Dirichlet, métodos iterativos y validación analítica ITU-R P.1238.
- **Capa 5:** Cálculos físicos electromagnéticos ($P_{\text{rx}}$, $\langle S \rangle$, $E_{\text{rms}}$, $H_{\text{rms}}$) y exportación de reportes.
