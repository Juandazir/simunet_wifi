# Arquitectura de 5 Capas — SimuNet WiFi

```
src/
├── main.tsx                    # Punto de arranque React
├── index.css                   # Estilos globales
│
├── capa1-dominio/              # CAPA 1 — Dominio
│   ├── types.ts                # Entidades y tipos del negocio
│   ├── modelos/
│   │   ├── routers.ts          # Catálogo de hardware WiFi
│   │   └── materiales.ts       # Propiedades de materiales
│   ├── presets.ts              # Perfiles, entornos y utilidades
│   └── index.ts
│
├── capa2-interfaz/             # CAPA 2 — Interfaz (Presentación)
│   ├── App.tsx                 # Composición de la aplicación
│   ├── componentes/            # Componentes React visuales
│   │   ├── NetworkGrid.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── GraphPanel.tsx
│   │   ├── AuthPortal.tsx
│   │   ├── ChatAssistant.tsx
│   │   ├── PhysicsDisclaimer.tsx
│   │   └── SavedNetworksPanel.tsx
│   └── index.ts
│
├── capa3-aplicacion/           # CAPA 3 — Aplicación (Orquestación)
│   ├── hooks/
│   │   ├── useAuth.ts          # Sesión y persistencia de usuario
│   │   ├── useSimulation.ts    # Ciclo de simulación
│   │   └── useRouterOptimization.ts
│   ├── traduccion.ts           # i18n (es/en)
│   └── index.ts
│
├── capa4-numerico/             # CAPA 4 — Motor Numérico
│   ├── solver.ts               # Malla Laplace, pasos e instantáneo
│   ├── metodos/
│   │   ├── jacobi.ts
│   │   ├── gauss-seidel.ts
│   │   ├── sor.ts
│   │   └── index.ts
│   └── index.ts
│
└── capa5-servicios/            # CAPA 5 — Servicios Transversales
    ├── servicios.ts            # dBm, calidad de señal, CSV
    ├── auth.ts                 # Hash de contraseñas
    ├── reportGenerator.ts      # Informes técnicos .txt
    └── index.ts
```

## Reglas de dependencia

| Capa | Puede importar de |
|------|-------------------|
| 1 — Dominio | *(ninguna otra capa)* |
| 2 — Interfaz | 1, 3, 4, 5 |
| 3 — Aplicación | 1, 4, 5 |
| 4 — Numérico | 1, 5 |
| 5 — Servicios | 1 |

**Prohibido:** que capas inferiores importen de capas superiores (ej. capa4 no importa capa2).

## Flujo de datos

```
Usuario (Capa 2)
    ↓ eventos
Hooks (Capa 3)
    ↓ invoca
Solver + Métodos (Capa 4)
    ↓ usa tipos/materiales
Dominio (Capa 1)
    ↓ convierte/exporta
Servicios (Capa 5)
```

## Responsabilidad por capa

- **Capa 1:** Qué es el sistema (celdas, routers, materiales, usuarios)
- **Capa 2:** Cómo se ve e interactúa el usuario
- **Capa 3:** Cuándo y cómo se coordinan las operaciones
- **Capa 4:** Cómo se resuelve matemáticamente Laplace
- **Capa 5:** Servicios auxiliares reutilizables (auth, reportes, conversiones)
