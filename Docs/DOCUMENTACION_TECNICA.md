# Documentación Técnica Profunda — SimuNet WiFi v1.0.0

**Simulador Educativo de Cobertura WiFi basado en la Ecuación de Laplace**

Universidad de Pamplona · Departamento de Ingeniería de Sistemas · 2026

---

## Índice General

1. [Resumen Ejecutivo y Objetivos](#1-resumen-ejecutivo-y-objetivos)
2. [Stack Tecnológico Completo](#2-stack-tecnológico-completo)
3. [Arquitectura de Software — 5 Capas](#3-arquitectura-de-software--5-capas)
4. [Capa 1 — Dominio (Entidades del Negocio)](#4-capa-1--dominio)
5. [Capa 2 — Interfaz de Usuario (React)](#5-capa-2--interfaz-de-usuario-react)
6. [Capa 3 — Lógica de Aplicación (Hooks)](#6-capa-3--lógica-de-aplicación-hooks)
7. [Capa 4 — Motor Numérico (Laplace)](#7-capa-4--motor-numérico-laplace)
8. [Capa 5 — Servicios Transversales](#8-capa-5--servicios-transversales)
9. [Servidor Backend (server.ts)](#9-servidor-backend-serverts)
10. [Modelo Físico: Propagación WiFi Simplificada](#10-modelo-físico-propagación-wifi-simplificada)
11. [Flujos de Datos Detallados](#11-flujos-de-datos-detallados)
12. [Persistencia y Almacenamiento Local](#12-persistencia-y-almacenamiento-local)
13. [Configuración, Build y Despliegue](#13-configuración-build-y-despliegue)
14. [Apéndice Matemático](#14-apéndice-matemático)
15. [Glosario de Términos](#15-glosario-de-términos)

---

## 1. Resumen Ejecutivo y Objetivos

### 1.1 Descripción del Proyecto

**SimuNet WiFi** es una aplicación web educativa que simula la propagación de señal WiFi en un espacio 2D bidimensional. Resuelve numéricamente la **ecuación de Laplace ∇²u = 0** sobre una malla discreta utilizando tres métodos iterativos clásicos de álgebra lineal: **Jacobi**, **Gauss-Seidel** y **SOR (Successive Over-Relaxation)**.

### 1.2 Objetivos Educativos

| Objetivo | Descripción |
|----------|-------------|
| **Comprensión de Laplace** | Visualizar cómo se resuelve ∇²u = 0 en un dominio discreto |
| **Métodos Iterativos** | Comparar convergencia de Jacobi vs Gauss-Seidel vs SOR |
| **Atenuación por Materiales** | Entender cómo diferentes materiales afectan la propagación de ondas |
| **Optimización** | Encontrar la posición óptima de un router mediante búsqueda exhaustiva |
| **dBm y Señal** | Convertir valores numéricos a unidades de ingeniería de telecomunicaciones |

### 1.3 Características Funcionales

- **Editor interactivo** de planos 2D con 4 tipos de materiales de construcción
- **Simulación animada** paso a paso con visualización en tiempo real
- **Resolución instantánea** para comparación rápida de métodos
- **Gráfica de convergencia** logarítmica del error residual
- **Optimización automática** de ubicación del router con ranking de candidatos
- **Digitalizador de planos** — Conversión de imágenes a matriz de obstáculos
- **Sistema de usuarios** con roles (administrador/estudiante) y persistencia local
- **Exportación** de informes técnicos (.txt) y datos de convergencia (.csv)
- **Modo oscuro/claro** con persistencia en localStorage
- **Interfaz responsive** — Desktop, tablet y móvil

---

## 2. Stack Tecnológico Completo

### 2.1 Dependencias de Producción

| Paquete | Versión | Propósito Detallado |
|---------|---------|---------------------|
| `react` | ^19.0.1 | Biblioteca UI declarativa. Componentes funcionales con hooks, concurrent rendering, React.memo para optimización de re-renderizados |
| `react-dom` | ^19.0.1 | Renderer para DOM del navegador. Maneja el montaje virtual del árbol de componentes |
| `vite` | ^6.2.3 | Bundler de desarrollo con HMR (Hot Module Replacement) instantáneo. Build de producción optimizado con tree-shaking |
| `@vitejs/plugin-react` | ^5.0.4 | Plugin para Vite que habilita JSX transform automático y Fast Refresh |
| `tailwindcss` | ^4.1.14 | Framework CSS utility-first. Elimina necesidad de CSS custom mediante clases atómicas |
| `@tailwindcss/vite` | ^4.1.14 | Integración nativa de Tailwind con el pipeline de Vite |
| `express` | ^4.21.2 | Framework HTTP minimalista para Node.js. Sirve la SPA y maneja rutas de API |
| `dotenv` | ^17.2.3 | Carga variables de entorno desde archivos `.env` al objeto `process.env` |
| `motion` | ^12.23.24 | Biblioteca de animaciones declarativas (sucesor de Framer Motion). Maneja AnimatePresence, transiciones de entrada/salida |
| `lucide-react` | ^0.546.0 | Iconos SVG de código abierto optimizados para React. Tree-shakeable |

### 2.2 Dependencias de Desarrollo

| Paquete | Versión | Propósito Detallado |
|---------|---------|---------------------|
| `typescript` | ~5.8.2 | Sistema de tipos estáticos para JavaScript. Detección de errores en tiempo de compilación |
| `tsx` | ^4.21.0 | Ejecutor de TypeScript que usa esbuild internamente. Permite ejecutar `.ts` sin compilación previa |
| `esbuild` | ^0.25.0 | Bundler ultrarrápido escrito en Go. Empaqueta server.ts para producción |
| `@types/express` | ^4.17.21 | Definiciones de tipos TypeScript para Express |
| `@types/node` | ^22.14.0 | Definiciones de tipos TypeScript para Node.js |
| `autoprefixer` | ^10.4.21 | Post-procesador CSS que agrega prefijos de navegador (-webkit-, -moz-) |

### 2.3 Justificación de Selección

**¿Por qué React sobre Angular/Vue?**
- React 19 ofrece Server Components y Suspense nativo
- Ecosistema más grande para herramientas educativas
- Hooks permiten lógica reutilizable sin clases
- JSX es más legible para código matemático embebido

**¿Por qué Vite sobre Webpack?**
- HMR instantáneo (<50ms) vs Webpack (~1-3s)
- Build de producción con esbuild (10-100x más rápido)
- Configuración mínima out-of-the-box
- Soporte nativo para TypeScript sin loader adicional

**¿ por qué Express sobre Fastify/Koa?**
- Madurez y estabilidad probada
- Middleware ecosystem extenso
- Curva de aprendizaje mínima
- Suficiente para un servidor educativo

---

## 3. Arquitectura de Software — 5 Capas

### 3.1 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 2 — INTERFAZ                         │
│  App.tsx · NetworkGrid · ControlPanel · GraphPanel · ...     │
│  (Componentes React, renderizado, eventos de usuario)        │
├─────────────────────────────────────────────────────────────┤
│                    CAPA 3 — APLICACIÓN                       │
│  useAuth · useSimulation · useRouterOptimization · i18n     │
│  (Hooks, orquestación, lógica de negocio)                    │
├─────────────────────────────────────────────────────────────┤
│                    CAPA 4 — NUMÉRICO                         │
│  solver.ts · jacobi.ts · gauss-seidel.ts · sor.ts           │
│  (Motor matemático, métodos iterativos)                      │
├─────────────────────────────────────────────────────────────┤
│                    CAPA 5 — SERVICIOS                        │
│  auth.ts · servicios.ts · reportGenerator.ts                │
│  (Utilidades transversales: dBm, hash, reportes)             │
├─────────────────────────────────────────────────────────────┤
│                    CAPA 1 — DOMINIO                          │
│  types.ts · materiales.ts · routers.ts · presets.ts         │
│  (Entidades, modelos, constantes del negocio)                │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Reglas de Dependencia (Grafo Acíclico Dirigido)

```
Capa 1 (Dominio)    → No importa de ninguna otra capa
Capa 2 (Interfaz)   → Importa de: 1, 3, 4, 5
Capa 3 (Aplicación) → Importa de: 1, 4, 5
Capa 4 (Numérico)   → Importa de: 1, 5
Capa 5 (Servicios)  → Importa de: 1
```

**Violación prohibida:** Una capa NUNCA importa de una capa superior. Esto garantiza:
- Separación de responsabilidades estricta
- Testabilidad independiente por capa
- Reutilización de componentes numéricos sin dependencias de UI

### 3.3 Estructura de Archivos

```
simunet_wifi/
├── server.ts                    # Servidor Express (42 líneas)
├── package.json                 # Dependencias y scripts
├── tsconfig.json                # Configuración TypeScript
├── vite.config.ts               # Configuración Vite
├── index.html                   # Entry point HTML
├── .env.example                 # Variables de entorno ejemplo
│
└── src/
    ├── main.tsx                 # Punto de arranque React (10 líneas)
    ├── index.css                # Estilos globales Tailwind
    │
    ├── capa1-dominio/           # CAPA 1 — Dominio
    │   ├── types.ts             # Tipos e interfaces (91 líneas)
    │   ├── index.ts             # Barrel export (5 líneas)
    │   ├── presets.ts           # Perfiles y utilidades (105 líneas)
    │   └── modelos/
    │       ├── materiales.ts    # Catálogo de materiales (49 líneas)
    │       └── routers.ts       # Catálogo de hardware (70 líneas)
    │
    ├── capa2-interfaz/          # CAPA 2 — Interfaz
    │   ├── App.tsx              # Componente raíz (431 líneas)
    │   ├── index.ts             # Barrel export
    │   └── componentes/
    │       ├── NetworkGrid.tsx      # Grid de simulación (545 líneas)
    │       ├── ControlPanel.tsx     # Panel de controles (958 líneas)
    │       ├── GraphPanel.tsx       # Gráficas y métricas (364 líneas)
    │       ├── AuthPortal.tsx       # Portal de autenticación (158 líneas)
    │       ├── PhysicsDisclaimer.tsx # Aviso de limitaciones (48 líneas)
    │       └── SavedNetworksPanel.tsx # Gestión de diseños (120 líneas)
    │
    ├── capa3-aplicacion/        # CAPA 3 — Aplicación
    │   ├── index.ts             # Barrel export
    │   ├── traduccion.ts        # Sistema i18n (54 líneas)
    │   └── hooks/
    │       ├── useAuth.ts           # Autenticación (197 líneas)
    │       ├── useSimulation.ts     # Ciclo de simulación (218 líneas)
    │       └── useRouterOptimization.ts # Optimización (133 líneas)
    │
    ├── capa4-numerico/          # CAPA 4 — Numérico
    │   ├── index.ts             # Barrel export
    │   ├── solver.ts            # Motor principal (111 líneas)
    │   └── metodos/
    │       ├── index.ts         # Registro de métodos (31 líneas)
    │       ├── jacobi.ts        # Método de Jacobi (30 líneas)
    │       ├── gauss-seidel.ts  # Método de Gauss-Seidel (30 líneas)
    │       └── sor.ts           # Método SOR (32 líneas)
    │
    └── capa5-servicios/         # CAPA 5 — Servicios
        ├── index.ts             # Barrel export
        ├── servicios.ts         # dBm, calidad, CSV (36 líneas)
        ├── auth.ts              # Hash SHA-256 (26 líneas)
        └── reportGenerator.ts   # Generador de informes (169 líneas)
```

---

## 4. Capa 1 — Dominio

La Capa 1 define **qué es** el sistema: sus entidades, modelos y constantes fundamentales. No contiene lógica de negocio ni dependencias externas.

### 4.1 Archivo `types.ts` — Definiciones de Tipos

#### 4.1.1 Tipos Enumerados

```typescript
// Métodos numéricos disponibles para resolver ∇²u = 0
export type SolverMethod = "jacobi" | "gauss-seidel" | "sor";

// Tipos de material constructivo (cada uno con coeficiente de atenuación único)
export type MaterialType = "air" | "drywall" | "brick" | "concrete" | "metal";

// Clasificación de una celda en la malla
export type CellType = "empty" | "wall" | "router";

// Roles de usuario para control de acceso
export type UserRole = "admin" | "standard";

// Códigos de idioma soportados
export type LanguageCode = "es" | "en";
```

#### 4.1.2 Interfaz `MaterialProperties`

Define las propiedades físicas de cada material constructivo:

```typescript
export interface MaterialProperties {
  id: MaterialType;      // Identificador único del material
  name: string;          // Nombre legible para humanos (ej: "Yeso (Drywall)")
  color: string;         // Clases Tailwind CSS para renderizado visual
  attenuation: number;   // Coeficiente de atenuación [0.0 - 0.25]
  dbLoss: number;        // Pérdida en dB por unidad de pared [0 - 35]
  iconName: string;      // Nombre del icono Lucide asociado
}
```

**Tabla de materiales implementados:**

| ID | Nombre | Atenuación | dB Loss | Uso típico |
|----|--------|------------|---------|------------|
| `air` | Espacio Libre | 0.000 | 0 dB | Espacios abiertos sin obstáculos |
| `drywall` | Yeso (Drywall) | 0.020 | 3 dB | Muros internos livianos |
| `brick` | Ladrillo | 0.080 | 8 dB | Muros estructurales medianos |
| `concrete` | Concreto | 0.150 | 15 dB | Muros exteriores, columnas |
| `metal` | Metal | 0.250 | 35 dB | Jaulas de Faraday, conductos |

#### 4.1.3 Interfaz `Cell`

Representa una celda individual de la malla de simulación:

```typescript
export interface Cell {
  x: number;              // Coordenada fila (índice vertical)
  y: number;              // Coordenada columna (índice horizontal)
  type: CellType;         // Tipo: empty | wall | router
  material: MaterialType; // Material (si type === "wall")
  attenuation: number;    // Atenuación efectiva [0.0 - 0.98]
  val: number;            // Valor del potencial [0 - 100+]
  fixed: boolean;         // ¿Es condición de frontera (Dirichlet)?
}
```

**Semántica de `val`:**
- `val = 0` → Sin señal (frontera exterior)
- `val = 20` → Señal inicial de celdas interiores
- `val = power × 2.25` → Potencia del router (ej: 100 × 2.25 = 225)
- Rango típico post-solución: [0, 100+]

**Semántica de `fixed`:**
- `true` → La celda NO se actualiza durante las iteraciones (frontera o router)
- `false` → La celda SÍ se actualiza (celda interior vacía o pared)

#### 4.1.4 Interfaz `RouterConfig`

Configuración de un punto de acceso WiFi:

```typescript
export interface RouterConfig {
  x: number;                          // Posición en fila
  y: number;                          // Posición en columna
  power: number;                      // Potencia normalizada [0-100]
  ssid: string;                       // Nombre de red (SSID)
  frequency: "2.4 GHz" | "5 GHz";    // Banda de operación
  modelId?: string;                   // ID del modelo comercial
}
```

**Cálculo de `power`:**
```typescript
power = Math.round(eirpDbm × (100 / 38))
```
Donde 38 dBm es la referencia máxima del catálogo (ASUS ROG). Esto normaliza la potencia a escala 0-100.

#### 4.1.5 Interfaz `SimulationConfig`

Parámetros del motor numérico:

```typescript
export interface SimulationConfig {
  method: SolverMethod;    // Método iterativo seleccionado
  tolerance: number;       // Umbral de convergencia ε (ej: 0.001)
  omega: number;           // Factor de relajación SOR [0.5 - 1.9]
  maxIterations: number;   // Límite máximo de iteraciones
  animationDelay: number;  // Milisegundos entre frames de animación
}
```

**Valores por defecto:**
```typescript
{
  method: "sor",           // SOR es el método más rápido
  tolerance: 0.001,        // 10⁻³ — Precisión estándar
  omega: 1.25,             // Sobre-relajación moderada
  maxIterations: 600,      // Suficiente para convergencia
  animationDelay: 10,      // 10ms entre frames (~100 FPS)
}
```

#### 4.1.6 Interfaz `RunHistory`

Registro completo de cada ejecución de simulación:

```typescript
export interface RunHistory {
  id: string;                    // UUID único (crypto.randomUUID())
  timestamp: string;             // Hora de ejecución (toLocaleTimeString())
  method: SolverMethod;          // Método utilizado
  iterations: number;            // Iteraciones totales ejecutadas
  executionTimeMs: number;       // Tiempo de ejecución en ms
  finalError: number;            // Error residual final
  converged: boolean;            // ¿Alcanzó la tolerancia?
  omega: number;                 // Factor ω utilizado
  tolerance: number;             // Tolerancia ε utilizada
  gridSize: string;              // Dimensiones (ej: "24x24")
  obstaclesCount: number;        // Número de paredes activas
  errorHistory: number[];        // Historial completo de errores por iteración
}
```

#### 4.1.7 Interfaz `UserProfile`

Perfil de usuario con persistencia:

```typescript
export interface UserProfile {
  username: string;              // Nombre de usuario único
  role: UserRole;                // "admin" o "standard"
  savedNetworks: UserSavedNetwork[];  // Diseños guardados
  password?: string;             // Hash SHA-256 (opcional)
}
```

#### 4.1.8 Interfaz `UserSavedNetwork`

Diseño de red guardado por el usuario:

```typescript
export interface UserSavedNetwork {
  id: string;                    // UUID único
  name: string;                  // Nombre descriptivo del diseño
  timestamp: string;             // Fecha de guardado
  walls: {                       // Lista de paredes
    x: number;
    y: number;
    material: MaterialType;
  }[];
  routers: RouterConfig[];       // Lista de routers
  gridSize: {                    // Dimensiones de la malla
    rows: number;
    cols: number;
  };
}
```

### 4.2 Archivo `modelos/materiales.ts`

Define el catálogo estático de materiales y dimensiones por defecto:

```typescript
export const MATERIALS = {
  air: {
    id: "air" as MaterialType,
    name: "Espacio Libre",
    color: "bg-transparent",
    attenuation: 0.0,      // Sin atenuación — propagación libre
    dbLoss: 0,             // 0 dB de pérdida
    iconName: "Wind",
  },
  drywall: {
    id: "drywall" as MaterialType,
    name: "Yeso (Drywall)",
    color: "bg-slate-300 border-slate-400",
    attenuation: 0.02,     // 2% de pérdida por celda
    dbLoss: 3,             // 3 dB por pared (~50% potencia)
    iconName: "Columns",
  },
  brick: {
    id: "brick" as MaterialType,
    name: "Ladrillo",
    color: "bg-amber-700 border-amber-800",
    attenuation: 0.08,     // 8% de pérdida por celda
    dbLoss: 8,             // 8 dB por pared (~84% potencia perdida)
    iconName: "Brick",
  },
  concrete: {
    id: "concrete" as MaterialType,
    name: "Concreto",
    color: "bg-gray-600 border-gray-700",
    attenuation: 0.15,     // 15% de pérdida por celda
    dbLoss: 15,            // 15 dB por pared (~97% potencia perdida)
    iconName: "SquareDot",
  },
  metal: {
    id: "metal" as MaterialType,
    name: "Metal",
    color: "bg-zinc-400 border-zinc-500 animate-pulse",
    attenuation: 0.25,     // 25% de pérdida por celda (máximo)
    dbLoss: 35,            // 35 dB por pared (~99.97% potencia perdida)
    iconName: "ShieldAlert",
  },
};

export const DEFAULT_ROWS = 24;  // Filas por defecto de la malla
export const DEFAULT_COLS = 24;  // Columnas por defecto de la malla
```

**Relación atenuación ↔ dB:**
```
dB = -10 × log10(1 - attenuation)

Ejemplo concreto:
  attenuation = 0.15
  dB = -10 × log10(1 - 0.15) = -10 × log10(0.85) = -10 × (-0.0706) = 0.706 dB por celda
  
  Pero el modelo simplificado usa dBLoss directamente:
  15 dB por pared completa
```

### 4.3 Archivo `modelos/routers.ts`

Catálogo de 4 routers comerciales con especificaciones RF reales:

```typescript
export interface RouterModel {
  id: string;                    // Identificador único
  name: string;                  // Nombre comercial
  brand: string;                 // Fabricante
  model: string;                 // Descripción del modelo
  txPowerDbm: number;           // Potencia de transmisión (dBm)
  gainDbi: number;              // Ganancia de antena (dBi)
  eirpDbm: number;              = txPowerDbm + gainDbi  (EIRP total)
  frequency: "2.4 GHz" | "5 GHz";
  standard: string;             // Estándar WiFi (802.11ac/ax)
  reachMeters: number;          // Alcance típico en metros
  description: string;          // Descripción para el usuario
}
```

**Catálogo completo:**

| ID | Marca | Modelo | Freq | Tx Power | Ganancia | EIRP | Alcance | Estándar |
|----|-------|--------|------|----------|----------|------|---------|----------|
| `tplink` | TP-Link | Archer C60 | 2.4 GHz | 24 dBm | 8 dBi | 32 dBm | 45m | Wi-Fi 5 (802.11ac) |
| `ubiquiti` | Ubiquiti | UniFi U6 Pro | 5 GHz | 31 dBm | 9 dBi | 40 dBm | 75m | Wi-Fi 6 (802.11ax) |
| `asus` | ASUS ROG | GT-AX11000 | 5 GHz | 38 dBm | 12 dBi | 50 dBm | 100m | Wi-Fi 6 (802.11ax) |
| `google` | Google | Nest WiFi Mesh | 5 GHz | 26 dBm | 7 dBi | 33 dBm | 60m | Wi-Fi 5 (802.11ac) |

**Fórmula EIRP:**
```
EIRP (dBm) = Potencia de Transmisión (dBm) + Ganancia de Antena (dBi)
```

### 4.4 Archivo `presets.ts`

Contiene perfiles predefinidos, utilidades de dominio y generadores de escenarios.

#### 4.4.1 `PRESET_PROFILES`

Usuarios predefinidos con datos iniciales:

```typescript
export const PRESET_PROFILES: UserProfile[] = [
  {
    username: "admin_pamplona",
    role: "admin",
    password: "hash_sha256_de_admin123",
    savedNetworks: [
      {
        id: "net_default_office",
        name: "Oficina Central de Telecomunicaciones - U Pamplona",
        walls: [/* 6 paredes de concreto */],
        routers: [{ x: 10, y: 10, power: 100, ssid: "U_Pamplona_5G", frequency: "5 GHz" }],
        gridSize: { rows: 16, cols: 16 },
      },
    ],
  },
  {
    username: "estudiante_pamplona",
    role: "standard",
    savedNetworks: [],  // Sin diseños iniciales
  },
];
```

#### 4.4.2 `METHOD_LABELS`

Etiquetas legibles para cada método:

```typescript
export const METHOD_LABELS: Record<string, string> = {
  jacobi: "Jacobi",
  "gauss-seidel": "Gauss-Seidel",
  sor: "SOR",
};
```

#### 4.4.3 `buildRouterFromModel()`

Constructor de `RouterConfig` desde el catálogo de modelos:

```typescript
export function buildRouterFromModel(
  modelId: string,
  x: number,
  y: number,
  suffix?: string
): RouterConfig {
  const model = ROUTER_MODELS[modelId];
  
  // Generar SSID: "TP-Link_Hogareño_Estándar" → "TP-Link_Hogareño_Estándar"
  const ssidBase = model
    ? `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_")
    : "WiFi_Simunet";
  
  return {
    x,
    y,
    power: model ? Math.round(model.eirpDbm * (100 / 38)) : 100,
    ssid: suffix ? `${ssidBase}_${suffix}` : ssidBase,
    frequency: model?.frequency ?? "2.4 GHz",
    modelId,
  };
}
```

**Normalización de potencia:**
```
power = EIRP × (100 / 38)
Si EIRP = 32 (TP-Link):  power = 32 × 2.63 = 84
Si EIRP = 50 (ASUS):     power = 50 × 2.63 = 132 → redondeado a escala proporcional
```

#### 4.4.4 `loadEnvironmentPreset()`

Genera escenarios predefinidos:

```typescript
export function loadEnvironmentPreset(presetName: string, modelId: string)
  : { walls: WallDef[]; routers: RouterConfig[] }
```

**Escenarios disponibles:**

| Nombre | Descripción | Paredes | Material |
|--------|-------------|---------|----------|
| `"empty"` | Espacio completamente abierto | 0 | — |
| `"office"` | Oficina con 3 habitaciones y pasillos | ~30 | Concreto |
| `"metal-cage"` | Jaula de Faraday (blindaje total) | ~40 | Metal |

---

## 5. Capa 2 — Interfaz de Usuario (React)

La Capa 2 implementa la presentación visual y la interacción del usuario.

### 5.1 Componente `App.tsx` (431 líneas)

Componente raíz que orquesta toda la aplicación.

#### 5.1.1 Estados Globales

```typescript
// Configuración de la malla
const [gridSize, setGridSize] = useState({ rows: 24, cols: 24 });
const [routers, setRouters] = useState<RouterConfig[]>([buildRouterFromModel("tplink", 12, 12)]);
const [walls, setWalls] = useState<WallDef[]>([]);
const [selectedRouterModelId, setSelectedRouterModelId] = useState("tplink");
const [cellSize, setCellSize] = useState(0.5);

// Estado de la interfaz
const [selectedTool, setSelectedTool] = useState<"router" | MaterialType | "eraser">("router");
const [isDrawing, setIsDrawing] = useState(false);
const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
const [showHeatmap, setShowHeatmap] = useState(true);
const [showValues, setShowValues] = useState(false);
const [showReportModal, setShowReportModal] = useState(false);
const [isDarkMode, setIsDarkMode] = useState(() => {
  return localStorage.getItem("simunet_dark_mode") !== "false";
});
```

#### 5.1.2 Hooks Utilizados

```typescript
const auth = useAuth();           // Autenticación y persistencia
const sim = useSimulation({ gridSize, routers, walls, cellSize });  // Motor de simulación
const optimization = useRouterOptimization({ gridSize, walls, cellSize, selectedRouterModelId });  // Optimización
```

#### 5.1.3 Funciones Principales

**`handleCellPaint(x, y)`** — Pinta celdas en la malla:
```
Si herramienta es "router":
  → Eliminar pared existente en (x,y)
  → Crear router en (x,y)
Si herramienta es "eraser":
  → Eliminar pared y router en (x,y)
Si herramienta es material:
  → Eliminar router existente en (x,y)
  → Crear pared con ese material en (x,y)
```

**`handleLoadPreset(presetName)`** — Carga escenarios predefinidos:
```
1. Detiene simulación activa
2. Genera paredes y routers del preset
3. Actualiza estados de walls y routers
```

**`applyBestRouterLocation(customX?, customY?)`** — Aplica resultado de optimización:
```
1. Toma la posición óptima del resultado
2. Crea router en esa posición
3. Reconstruye la malla
4. Resuelve instantáneamente
5. Actualiza el grid con el resultado
```

#### 5.1.4 Layout Responsive

```
Desktop (lg+):  Grid 12 columnas
  ├── Col 8: NetworkGrid + GraphPanel + Panel Auditoría
  └── Col 4: ControlPanel + SavedNetworksPanel

Mobile: 1 columna
  ├── NetworkGrid
  ├── ControlPanel
  ├── GraphPanel
  └── SavedNetworksPanel
```

### 5.2 Componente `NetworkGrid.tsx` (545 líneas)

El componente visualmente más complejo. Renderiza la malla de simulación como un CSS Grid dinámico.

#### 5.2.1 Estructura del Grid

```tsx
<div
  className="grid gap-[1px]"
  style={{
    gridTemplateRows: `repeat(${grid.length}, minmax(0, 1fr))`,
    gridTemplateColumns: `repeat(${grid[0]?.length || 1}, minmax(0, 1fr))`
  }}
>
  {grid.map((row, rIdx) =>
    row.map((cell, cIdx) => (
      <div
        key={`${rIdx}-${cIdx}`}
        onMouseDown={() => onCellMouseDown(cell.x, cell.y)}
        onMouseEnter={() => onCellMouseEnter(cell.x, cell.y)}
        style={{ backgroundColor: getCellBgColor(cell) }}
      >
        {/* Contenido de la celda */}
      </div>
    ))
  )}
</div>
```

#### 5.2.2 Función `getCellBgColor(cell)` — Mapa de Calor

Mapea el valor del potencial `val` (0-100) a colores RGBA:

```
Rango 0-15:    rgba(59, 130, 246, α)   → Azul (señal débil: -70 a -61 dBm)
Rango 15-45:   rgba(139, 92, 246, α)   → Violeta (señal media: -61 a -43 dBm)
Rango 45-75:   rgba(249, 115, 22, α)   → Naranja (señal fuerte: -43 a -25 dBm)
Rango 75-100:  rgba(234, 179, 8, α)    → Amarillo (señal máxima: -25 a -10 dBm)
```

El valor α (opacidad) varía según el modo claro/oscuro:
```typescript
// Modo oscuro: mayor opacidad para contraste
const alpha = isDarkMode ? 0.5 + ratio * 0.3 : 0.4 + ratio * 0.35;
```

#### 5.2.3 Función `downloadGridImage()` — Exportación PNG

Genera una imagen PNG de la malla usando Canvas API:

```typescript
const downloadGridImage = () => {
  const cellSizePx = 28;  // 28 píxeles por celda
  const canvas = document.createElement("canvas");
  canvas.width = cols * cellSizePx;
  canvas.height = rows * cellSizePx;
  const ctx = canvas.getContext("2d");
  
  // 1. Dibujar fondo
  ctx.fillStyle = isDarkMode ? "#020617" : "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 2. Para cada celda:
  for (r, c) {
    // 2a. Color de fondo (mapa de calor o material)
    ctx.fillStyle = cellColor;
    ctx.fillRect(x + 0.5, y + 0.5, cellSizePx - 1, cellSizePx - 1);
    
    // 2b. Borde de malla sutil
    ctx.strokeStyle = isDarkMode ? "rgba(30, 41, 59, 0.3)" : "rgba(226, 232, 240, 0.8)";
    ctx.strokeRect(x + 0.5, y + 0.5, cellSizePx - 1, cellSizePx - 1);
    
    // 2c. Marcadores (router = círculo, pared = inicial del material, valor = número)
    if (cell.type === "router") { /* dibujar círculo */ }
    else if (cell.type === "wall") { /* dibujar inicial */ }
    else if (showValues) { /* dibujar valor numérico */ }
  }
  
  // 3. Descargar
  link.href = canvas.toDataURL("image/png");
  link.download = `malla_wifi_espectro_laplace_${timestamp}.png`;
};
```

#### 5.2.4 Inspector de Celda (Hover Bar)

Muestra información detallada al pasar el cursor sobre una celda:

```
Celda: [12, 15] | Tipo: Espacio de Aire | Distancia: 3.5m
Potencia: -45 dBm (67%) | Pérdida/m: 0.024 (Escala: 0.5m/celda)
● Buena (-51 a -65 dBm)
```

**Cálculo de distancia al router más cercano:**
```typescript
const closestRouter = routers.reduce((closest, r) => {
  const dCurrent = Math.sqrt(Math.pow(cell.x - r.x, 2) + Math.pow(cell.y - r.y, 2));
  const dClosest = Math.sqrt(Math.pow(cell.x - closest.x, 2) + Math.pow(cell.y - closest.y, 2));
  return dCurrent < dClosest ? r : closest;
}, routers[0]);

const distMeters = distance × cellSize;  // Conversión a metros reales
```

#### 5.2.5 Overlay de Optimización

Cuando está activa la optimización, muestra:
- Overlay oscuro con animación de radar
- Mensajes técnicos rotativos (7 mensajes)
- Marcadores numerados en las posiciones candidatas
- Líneas de escaneo láser animadas

### 5.3 Componente `ControlPanel.tsx` (958 líneas)

El componente más extenso. Contiene todos los controles de configuración y simulación.

#### 5.3.1 Secciones del Panel

| Sección | Líneas | Contenido |
|---------|--------|-----------|
| Panel de Acción Directa | 337-414 | Botones: Animar, Instantáneo, Iteración +1, Reset, Limpiar |
| Mejor Ubicación del Router | 416-534 | Optimización con ranking de 4 candidatos |
| Enrutador Comercial Activo | 536-573 | Selector de modelo con especificaciones RF |
| Escala Física de Celdas | 575-605 | Slider 0.1m a 2.5m por celda |
| Herramientas de Lápiz | 607-682 | Selector de materiales de construcción |
| Digitalizador de Planos | 684-808 | Conversión imagen → matriz + presets |
| Parámetros de Laplace | 810-927 | Método, omega, tolerancia, malla, delay |
| Escenarios Digitales | 929-955 | Presets de entorno |

#### 5.3.2 Digitalizador de Planos (Imagen → Matriz)

Sistema que convierte imágenes de planos arquitectónicos en matrices de obstáculos:

**Proceso:**
```
1. Cargar imagen (upload o preset)
2. Dibujar en canvas temporal (300×300 o 400×400 px)
3. Escalar al tamaño de la malla (gridSize.cols × gridSize.rows)
4. Extraer datos de píxel con getImageData()
5. Para cada píxel:
   a. Calcular luminancia: L = 0.299×R + 0.587×G + 0.114×B
   b. Si L < umbral (sensibilidad) → es pared (línea oscura)
   c. Saltar si está en frontera (i=0 o i=N-1)
6. Generar array de {x, y, material} para la malla
```

**Fórmula de luminancia:**
```typescript
const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
// Luminancia percibida estándar (ITU-R BT.601)

if (alpha > 40 && brightness < threshold) {
  // Es pared: píxel oscuro con opacidad suficiente
  newScannedWalls.push({ x: r, y: c, material: wallMat });
}
```

**Presets de plano:**

| Tipo | Descripción | Elementos |
|------|-------------|-----------|
| `apartment` | Apartamento residencial | Muros perimetrales, división horizontal, 2 paredes verticales, pilar central |
| `classroom` | Laboratorio/aula | Muros exteriores, divisoria horizontal, sala central de servidores |
| `hosp` | Hospital | Frontera exterior, pasillo central doble, 4 salas divididas |

#### 5.3.3 Panel de Optimización

Muestra el ranking de las 4 mejores posiciones candidatas:

```
1º Opción (Zona Norte-Centro) [5, 8]  ← Recomendada
   Señal Promedio: 67%
   Cobertura (≥-75 dBm): 89%
   Puntaje: 72/100
   [Aplicar Posición Ideal]

2º Opción (Zona Centro) [12, 12]
   Señal Promedio: 61%
   Cobertura (≥-75 dBm): 82%
   Puntaje: 66/100
   [Aplicar Posición Alternativa]
```

### 5.4 Componente `GraphPanel.tsx` (364 líneas)

Muestra métricas de rendimiento y gráfica de convergencia.

#### 5.4.1 Indicadores de Telemetría (Bento Grid)

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Iteración Actual│ Residuo Máximo  │ Tiempo Ejecución│ Convergencia    │
│      147        │  0.000892       │     23 ms       │   Estable ✓     │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### 5.4.2 Gráfica SVG de Convergencia

Genera una gráfica logarítmica completamente en SVG:

```typescript
// Eje Y: Log10 del error residual
const logList = errors.map(e => Math.log10(Math.max(e, 1e-12)));
const minLog = -6;  // 10⁻⁶ (convergencia perfecta)
const maxLog = 2;   // 10² (error inicial alto)

// Mapeo lineal a coordenadas SVG
const getY = (logVal: number) => {
  const clipped = Math.max(minLog, Math.min(maxLog, logVal));
  const pct = (clipped - minLog) / (maxLog - minLog);
  return height - paddingBottom - pct * plotHeight;
};

// Path SVG con gradiente
strokePathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} ...`;
areaPathData = `${strokePathData} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
```

**Elementos visuales:**
- Gradiente lineal de índigo a esmeralda en el trazo
- Área bajo la curva con gradiente vertical semi-transparente
- Cuadrícula de referencia con líneas punteadas
- Punto final pulsante animado (animate-ping)
- Etiquetas de ejes: 10¹, 10⁻², ε

#### 5.4.3 Tabla Comparativa de Experimentos

Muestra todas las ejecuciones anteriores en una tabla:

| Método | Malla | Iteraciones | Tiempo | Error Final | Estado |
|--------|-------|-------------|--------|-------------|--------|
| SOR (ω=1.25) | 24x24 | 89 | 12 ms | 8.92×10⁻⁴ | Convergió |
| Gauss-Seidel | 24x24 | 156 | 18 ms | 9.15×10⁻⁴ | Convergió |
| Jacobi | 24x24 | 312 | 25 ms | 9.87×10⁻⁴ | Sin converger |

### 5.5 Componente `AuthPortal.tsx` (158 líneas)

Portal de autenticación con diseño minimalista:

- **Tabs**: Iniciar Sesión | Registrarse
- **Campos**: Usuario (con icono User), Contraseña (con icono Lock)
- **Validación**: Username ≥ 3 chars, Password ≥ 4 chars
- **Feedback**: Errores en rojo, éxito en verde con animación
- **Demo**: Credenciales visibles para acceso rápido

### 5.6 Componente `PhysicsDisclaimer.tsx` (48 líneas)

Aviso expandible sobre el modelo físico:

```
Modelo físico y limitaciones del simulador
├── Este simulador resuelve ∇²u = 0 en malla 2D
├── Incluye: atenuación, EIRP, Dirichlet, optimización
└── No incluye: log-distance, multipath, ray-tracing, Friis
```

### 5.7 Componente `SavedNetworksPanel.tsx` (120 líneas)

Gestión de diseños guardados por usuario:

- Input para nombre del diseño
- Botón "Guardar diseño actual"
- Lista scrollable de diseños guardados
- Botones "Cargar" y "Eliminar" por cada diseño
- Indicador de cantidad: "Redes guardadas (3)"

---

## 6. Capa 3 — Lógica de Aplicación (Hooks)

La Capa 3 orquesta la lógica de negocio usando React Hooks.

### 6.1 Hook `useAuth.ts` (197 líneas)

Gestiona autenticación, registro y persistencia de usuarios.

#### 6.1.1 Estados

```typescript
const [profiles, setProfiles] = useState<UserProfile[]>(loadProfiles);
const [currentUser, setCurrentUser] = useState<UserProfile | null>(loadActiveUser);
const [loginError, setLoginError] = useState("");
const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");
const [isRegisterMode, setIsRegisterMode] = useState(false);
const [ready, setReady] = useState(false);
```

#### 6.1.2 Persistencia (localStorage)

| Clave | Contenido | Tipo |
|-------|-----------|------|
| `simunet_user_profiles` | Array de todos los perfiles | JSON string |
| `simunet_active_user` | Perfil del usuario logueado | JSON string |
| `simunet_dark_mode` | Preferencia de tema | "true"/"false" |

#### 6.1.3 Funciones Principales

**`handleLogin(username, password)`**
```
1. Normalizar: username.trim().toLowerCase()
2. Buscar perfil en profiles[]
3. Si tiene password → verificar con hash SHA-256
4. Si es correcto → setCurrentUser(profile)
5. Si no → setLoginError("...")
6. Retornar booleano de éxito
```

**`handleRegister(username, password)`**
```
1. Validar: username ≥ 3 chars, password ≥ 4 chars
2. Verificar que no exista el usuario
3. Crear UserProfile con role: "standard"
4. Hashear password con SHA-256
5. Agregar a profiles[]
6. After 1500ms → auto-login y cambiar a modo login
```

**`saveNetwork(name, design)`**
```
1. Generar ID: "net_" + crypto.randomUUID()
2. Agregar timestamp: new Date().toLocaleString()
3. Agregar a currentUser.savedNetworks[]
4. Actualizar profiles[] y localStorage
```

**Migración de contraseñas legacy:**
```
Al inicializar (useEffect):
  Si admin_pamplona tiene password = "admin123" o hash corto (< 64 chars)
  → Hashear con SHA-256 y actualizar en localStorage
```

### 6.2 Hook `useSimulation.ts` (218 líneas)

Orquesta el ciclo completo de simulación numérica.

#### 6.2.1 Estados Principales

```typescript
const [grid, setGrid] = useState<Cell[][]>([]);           // Malla actual
const [config, setConfig] = useState<SimulationConfig>({  // Parámetros
  method: "sor",
  tolerance: 0.001,
  omega: 1.25,
  maxIterations: 600,
  animationDelay: 10,
});
const [isRunning, setIsRunning] = useState(false);        // Flag de animación
const [currentIteration, setCurrentIteration] = useState(0);
const [currentError, setCurrentError] = useState(0);
const [timeMs, setTimeMs] = useState(0);
const [isConverged, setIsConverged] = useState(false);
const [currentErrorHistory, setCurrentErrorHistory] = useState<number[]>([]);
const [history, setHistory] = useState<RunHistory[]>([]);
const startTimeRef = useRef<number | null>(null);
```

#### 6.2.2 Funciones Principales

**`rebuildGrid()`** — Reconstruye la malla inicial:
```typescript
const rebuildGrid = useCallback(() => {
  const initial = buildInitialGrid(
    gridSize.rows, gridSize.cols, routers, walls, cellSize
  );
  setGrid(initial);
  setCurrentIteration(0);
  setCurrentError(0);
  setTimeMs(0);
  setIsConverged(false);
  setCurrentErrorHistory([]);
}, [gridSize, routers, walls, cellSize]);
```

**Bucle de animación** (useEffect con isRunning):
```typescript
useEffect(() => {
  if (!isRunning) {
    startTimeRef.current = null;
    return;
  }
  
  if (startTimeRef.current === null) {
    startTimeRef.current = performance.now();
  }
  
  const timer = setTimeout(() => {
    // 1. Ejecutar un paso del solver
    const stepResult = runSolverStep(grid, config.method, config.omega);
    
    // 2. Actualizar estados
    setGrid(stepResult.grid);
    setCurrentIteration(prev => prev + 1);
    setCurrentError(stepResult.error);
    setTimeMs(Math.round(performance.now() - startTimeRef.current));
    
    // 3. Actualizar historial de errores
    const updatedErrorHist = [...currentErrorHistory, stepResult.error];
    setCurrentErrorHistory(updatedErrorHist);
    
    // 4. Verificar convergencia o límite
    const achievedConvergence = stepResult.error < config.tolerance;
    const hitLimit = currentIteration + 1 >= config.maxIterations;
    
    if (achievedConvergence || hitLimit) {
      setIsRunning(false);
      setIsConverged(achievedConvergence);
      recordRun(config.method, currentIteration + 1, elapsed, stepResult.error, achievedConvergence, updatedErrorHist);
    }
  }, config.animationDelay);
  
  return () => clearTimeout(timer);
}, [isRunning, grid, currentIteration, config, currentErrorHistory, recordRun]);
```

**`solveInstantly()`** — Resolución completa instantánea:
```typescript
const solveInstantly = useCallback(() => {
  setIsRunning(false);
  const result = solveInstant(
    grid, config.method, config.omega, config.tolerance, config.maxIterations
  );
  // Actualizar todos los estados de una vez
  setGrid(result.grid);
  setCurrentIteration(result.iterations);
  setCurrentError(result.finalError);
  setTimeMs(result.timeMs);
  setIsConverged(result.finalError < config.tolerance);
  setCurrentErrorHistory(result.errorHistory);
  recordRun(...);
}, [grid, config, recordRun]);
```

**`singleStep()`** — Ejecuta exactamente 1 iteración:
```typescript
const singleStep = useCallback(() => {
  setIsRunning(false);
  const stepResult = runSolverStep(grid, config.method, config.omega);
  setGrid(stepResult.grid);
  setCurrentIteration(prev => prev + 1);
  setCurrentError(stepResult.error);
  setCurrentErrorHistory(prev => [...prev, stepResult.error]);
}, [grid, config]);
```

### 6.3 Hook `useRouterOptimization.ts` (133 líneas)

Implementa el algoritmo de búsqueda de la posición óptima del router.

#### 6.3.1 Interfaz de Resultado

```typescript
export interface OptimizationResult {
  x: number;                    // Mejor posición X
  y: number;                    // Mejor posición Y
  avgSignal: number;            // Señal promedio (%)
  coveragePct: number;          // Cobertura (≥-75 dBm) en %
  candidatesTested: number;     // Total de posiciones evaluadas
  topCandidates: Array<{        // Top 4 posiciones
    x: number;
    y: number;
    avgSignal: number;
    coveragePct: number;
    score: number;              // Puntaje compuesto
    zoneName: string;           // Nombre de la zona geográfica
  }>;
}
```

#### 6.3.2 Algoritmo de Búsqueda

```
ENTRADA: gridSize, walls, cellSize, selectedRouterModelId

1. DETERMINAR STEP (densidad de búsqueda):
   Si rows ≤ 15 → step = 1  (búsqueda densa: prueba cada celda)
   Si rows ≤ 25 → step = 2  (búsqueda media: cada 2 celdas)
   Si rows > 25 → step = 3  (búsqueda ligera: cada 3 celdas)

2. PARA CADA POSICIÓN CANDIDATA (r, c):
   a. Saltar si (r, c) está en frontera (r < 2 o r > rows-3)
   b. Saltar si hay pared en (r, c)
   c. Crear router temporal: buildRouterFromModel(modelId, r, c)
   d. Construir malla: buildInitialGrid(rows, cols, [router], walls, cellSize)
   e. Resolver: solveInstant(grid, "sor", 1.25, 0.01, 25)
      (SOR rápido con tolerancia suave para evaluación rápida)
   f. Calcular métricas:
      - cellValsSum = suma de val de todas las celdas activas (no pared)
      - activeCellsCount = celdas que no son pared
      - coveredCellsCount = celdas con val ≥ 25 (≈ -75 dBm)
      - avgSignal = cellValsSum / activeCellsCount
      - coveragePct = (coveredCellsCount / activeCellsCount) × 100
      - score = avgSignal × 0.7 + coveragePct × 0.3

3. ORDENAR candidatos por score descendente

4. FILTRAR top 4 candidatos:
   - Mantener solo candidatos con Manhattan distance ≥ 4
   - Esto evita posiciones casi idénticas

5. RETORNAR mejor posición + top candidates
```

**Fórmula de puntaje compuesto:**
```
score = 0.7 × avgSignal + 0.3 × coveragePct
```
El 70% del puntaje depende de la señal promedio, el 30% de la cobertura. Esto prioriza intensidad de señal sobre extensión de cobertura.

**Asignación de zonas:**
```typescript
const getZoneLabel = (r, c) => {
  const pctR = r / rows;
  const pctC = c / cols;
  const vert = pctR < 0.35 ? "Norte" : pctR > 0.65 ? "Sur" : "Centro";
  const horiz = pctC < 0.35 ? "Oeste" : pctC > 0.65 ? "Este" : "Centro";
  if (vert === "Centro" && horiz === "Centro") return "Zona Central";
  return `Zona ${vert}-${horiz}`;
}
```

### 6.4 Archivo `traduccion.ts` (54 líneas)

Sistema i18n ligero con diccionarios estáticos:

```typescript
export const DICCIONARIO_TRADUCCIONES = {
  es: {
    title: "SIMNET: Simulador de Malla WiFi",
    method_select: "Método de resolución:",
    grid_size: "Tamaño de la cuadrícula:",
    run_btn: "Ejecutar Simulación",
    clear_btn: "Limpiar Muro",
    results_label: "Resumen Numérico de Convergencia",
    iterations: "Iteraciones realizadas",
    final_error: "Error de convergencia final",
    exec_time: "Tiempo de ejecución",
    save_btn: "Exportar Resultados",
    helper_draw: "Pinta en la cuadrícula superior",
    legend_wall: "Muro Obstáculo",
    legend_router: "Enrutador Emisor",
    legend_empty: "Espacio Abierto"
  },
  en: {
    title: "SIMNET: WiFi Mesh Simulator",
    method_select: "Solver Method:",
    grid_size: "Grid Size:",
    run_btn: "Run Simulation",
    // ...
  }
};

export function traducir(key: string, lang: LanguageCode = "es"): string {
  const dictionary = DICCIONARIO_TRADUCCIONES[lang] || DICCIONARIO_TRADUCCIONES["es"];
  return dictionary[key] || key;
}
```

---

## 7. Capa 4 — Motor Numérico (Laplace)

La Capa 4 implementa el corazón matemático del simulador.

### 7.1 Fundamento Matemático

#### 7.1.1 La Ecuación de Laplace

La ecuación de Laplace describe la distribución de un campo escalar en equilibrio:

```
∇²u = 0

Expandida en coordenadas cartesianas 2D:
∂²u/∂x² + ∂²u/∂y² = 0
```

**Interpretación física en este contexto:**
- `u(x,y)` representa la intensidad del campo electromagnético simplificado
- El campo tiende a suavizarse (promediarse con sus vecinos)
- Las fuentes (routers) son condiciones de Dirichlet no homogéneas
- Los bordes son condiciones de Dirichlet homogéneas (u = 0)

#### 7.1.2 Discretización por Diferencias Finitas

Para una malla con paso `h` (tamaño de celda):

```
∂²u/∂x² ≈ (u[i+1][j] - 2u[i][j] + u[i-1][j]) / h²
∂²u/∂y² ≈ (u[i][j+1] - 2u[i][j] + u[i][j-1]) / h²
```

Sustituyendo en ∇²u = 0:

```
(u[i+1][j] + u[i-1][j] + u[i][j+1] + u[i][j-1] - 4u[i][j]) / h² = 0
```

Despejando u[i][j]:

```
u[i][j] = (u[i+1][j] + u[i-1][j] + u[i][j+1] + u[i][j-1]) / 4
```

**Esta es la fórmula de promediación de Jacobi.** Cada celda se convierte en el promedio de sus 4 vecinos.

### 7.2 Archivo `solver.ts` (111 líneas)

Motor principal de orquestación.

#### 7.2.1 `buildInitialGrid(rows, cols, routers, walls, cellSize)`

Construye la malla inicial Cell[][]:

```typescript
export function buildInitialGrid(
  rows: number,
  cols: number,
  routers: RouterConfig[],
  walls: { x: number; y: number; material: MaterialType }[],
  cellSize: number = 0.5
): Cell[][] {
  const grid: Cell[][] = [];

  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      
      // 1. Determinar si es frontera (borde exterior)
      const isBoundary = i === 0 || i === rows - 1 || j === 0 || j === cols - 1;
      
      // 2. Buscar pared o router en esta posición
      const wall = walls.find(w => w.x === i && w.y === j);
      const router = routers.find(r => r.x === i && r.y === j);
      
      // 3. Valores por defecto para celda vacía
      let cellType: CellType = "empty";
      let material: MaterialType = "air";
      let attenuation = 0.0012 * (cellSize / 0.5);
      let initialVal = isBoundary ? 0.0 : 20.0;  // Frontera = 0, interior = 20
      let fixed = isBoundary;                      // Frontera = fija
      
      // 4. Si hay pared: configurar material y atenuación
      if (wall) {
        cellType = "wall";
        material = wall.material;
        let multiplier = 1.0;
        const activeRouter = routers[0];
        if (activeRouter) {
          // 2.4 GHz penetra más (menor atenuación)
          multiplier = activeRouter.frequency === "2.4 GHz" ? 0.20 : 0.50;
        }
        attenuation = MATERIALS[wall.material].attenuation * multiplier * (cellSize / 0.5);
      }
      
      // 5. Si hay router: configurar como fuente
      if (router) {
        cellType = "router";
        initialVal = router.power * 2.25;  // Escalar potencia a valor de malla
        fixed = true;                       // Router es condición fija
      }
      
      // 6. Clampear atenuación a rango válido
      attenuation = Math.min(0.98, Math.max(0.0, attenuation));
      
      row.push({
        x: i, y: j, type: cellType, material,
        attenuation, val: initialVal, fixed
      });
    }
    grid.push(row);
  }
  return grid;
}
```

**Tabla de condiciones iniciales:**

| Tipo de Celda | val inicial | fixed | attenuation |
|---------------|-------------|-------|-------------|
| Frontera (borde) | 0.0 | true | 0.0012 × (cellSize/0.5) |
| Interior vacía | 20.0 | false | 0.0012 × (cellSize/0.5) |
| Pared | 20.0 | false | material.attenuation × multiplier × (cellSize/0.5) |
| Router | power × 2.25 | true | 0.0 |

**Escala de atenuación por frecuencia:**
```
2.4 GHz: attenuation × 0.20  (mayor penetración)
5 GHz:   attenuation × 0.50  (menor penetración)
```

#### 7.2.2 `runSolverStep(grid, method, omega)`

Delega al método iterativo seleccionado:

```typescript
export function runSolverStep(
  currentGrid: Cell[][],
  method: SolverMethod,
  omega: number
): { grid: Cell[][]; error: number } {
  return SOLVER_METHODS[method].run(currentGrid, omega);
}
```

#### 7.2.3 `solveInstant(...)`

Resolución completa sin animación:

```typescript
export function solveInstant(
  initialGrid: Cell[][],
  method: SolverMethod,
  omega: number,
  tolerance: number,
  maxIterations: number
): { grid: Cell[][]; iterations: number; finalError: number; errorHistory: number[]; timeMs: number } {
  const start = performance.now();
  
  // Copia profunda de la malla inicial
  let currentGrid = initialGrid.map(row => row.map(cell => ({ ...cell })));
  let iterations = 0;
  let finalError = 1.0;
  const errorHistory: number[] = [];

  // Bucle principal de convergencia
  while (iterations < maxIterations && finalError >= tolerance) {
    const step = runSolverStep(currentGrid, method, omega);
    currentGrid = step.grid;
    finalError = step.error;
    iterations++;
    errorHistory.push(finalError);
  }

  return {
    grid: currentGrid,
    iterations,
    finalError,
    errorHistory,
    timeMs: Math.round((performance.now() - start) * 100) / 100,
  };
}
```

### 7.3 Métodos Iterativos Detallados

#### 7.3.1 Jacobi (`jacobi.ts` — 30 líneas)

**Principio:** Actualización paralela — todas las celdas se calculan usando valores de la iteración ANTERIOR.

```typescript
export function runJacobiStep(
  currentGrid: Cell[][]
): { grid: Cell[][]; error: number } {
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  
  // CRÍTICO: Crear copia completa (nextGrid) separada de currentGrid
  const nextGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
  let maxError = 0;

  for (let i = 1; i < rows - 1; i++) {        // Saltar frontera
    for (let j = 1; j < cols - 1; j++) {
      const cell = nextGrid[i][j];
      if (cell.fixed) continue;                // Saltar fijos (frontera/router)

      // Usar SOLO valores de currentGrid (iteración anterior)
      const sum =
        currentGrid[i + 1][j].val +  // abajo
        currentGrid[i - 1][j].val +  // arriba
        currentGrid[i][j + 1].val +  // derecha
        currentGrid[i][j - 1].val;   // izquierda

      // Aplicar ecuación de relajación con atenuación
      const newVal = (1.0 - cell.attenuation) * (sum / 4.0);
      const diff = Math.abs(newVal - cell.val);
      
      nextGrid[i][j].val = newVal;
      if (diff > maxError) maxError = diff;
    }
  }

  return { grid: nextGrid, error: maxError };
}
```

**Características matemáticas:**
- Requiere 2 arrays completos (currentGrid + nextGrid)
- Convergencia garantizada para ∇²u = 0 (diagonalmente dominante)
- Tasa de convergencia: O(h²) — se duplica el error al duplicar h
- **Paralelizable trivialmente** (cada celda es independiente)

**Pseudocódigo:**
```
para cada celda (i,j) en paralelo:
  si no es fija:
    u_nuevo[i,j] = (1 - α) × (u_arriba + u_abajo + u_izq + u_der) / 4
```

#### 7.3.2 Gauss-Seidel (`gauss-seidel.ts` — 30 líneas)

**Principio:** Actualización secuencial — cada celda usa los valores YA actualizados de sus vecinos.

```typescript
export function runGaussSeidelStep(
  currentGrid: Cell[][]
): { grid: Cell[][]; error: number } {
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  
  // Copia inicial, pero se MODIFICA in-place
  const nextGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
  let maxError = 0;

  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const cell = nextGrid[i][j];
      if (cell.fixed) continue;

      // CRÍTICO: Usar nextGrid (algunos valores ya actualizados en esta iteración)
      const sum =
        nextGrid[i + 1][j].val +  // abajo (puede ser nuevo o viejo)
        nextGrid[i - 1][j].val +  // arriba (YA actualizado en esta iteración)
        nextGrid[i][j + 1].val +  // derecha (puede ser nuevo o viejo)
        nextGrid[i][j - 1].val;   // izquierda (YA actualizado)

      const newVal = (1.0 - cell.attenuation) * (sum / 4.0);
      const diff = Math.abs(newVal - cell.val);
      
      nextGrid[i][j].val = newVal;
      if (diff > maxError) maxError = diff;
    }
  }

  return { grid: nextGrid, error: maxError };
}
```

**Diferencia clave con Jacobi:**
```
Jacobi:        nextGrid[i][j] = f(currentGrid[...])
Gauss-Seidel:  nextGrid[i][j] = f(nextGrid[...])  // usa valores actualizados
```

**Ventajas sobre Jacobi:**
- Converge ~2x más rápido en la práctica
- Requiere solo 1 array auxiliar (se modifica in-place)
- Menor consumo de memoria

**Desventaja:**
- No es paralelizable trivialmente (dependencia secuencial)

#### 7.3.3 SOR — Successive Over-Relaxation (`sor.ts` — 32 líneas)

**Principio:** Acelera Gauss-Seidel con un factor de relajación ω (omega).

```typescript
export function runSorStep(
  currentGrid: Cell[][],
  omega: number
): { grid: Cell[][]; error: number } {
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  const nextGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
  let maxError = 0;

  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const cell = nextGrid[i][j];
      if (cell.fixed) continue;

      // Calcular valor Gauss-Seidel estándar
      const sum =
        nextGrid[i + 1][j].val +
        nextGrid[i - 1][j].val +
        nextGrid[i][j + 1].val +
        nextGrid[i][j - 1].val;

      const uGS = (1.0 - cell.attenuation) * (sum / 4.0);

      // CRÍTICO: Aplicar sobre-relajación
      const newVal = (1.0 - omega) * cell.val + omega * uGS;
      //               ↑ inercia           ↑ corrección acelerada

      const diff = Math.abs(newVal - cell.val);
      nextGrid[i][j].val = newVal;
      if (diff > maxError) maxError = diff;
    }
  }

  return { grid: nextGrid, error: maxError };
}
```

**Análisis de la ecuación SOR:**

```
u_nuevo = (1 - ω) × u_actual + ω × u_GS
```

Desglosando:
- `(1 - ω) × u_actual` → **Término de inercia** (cuánto del valor anterior se conserva)
- `ω × u_GS` → **Término de corrección** (cuánto se avanza hacia el valor GS)

**Comportamiento según ω:**

| ω | Comportamiento | Velocidad | Estabilidad |
|---|----------------|-----------|-------------|
| 0.5 | Sub-relajación fuerte | Lenta | Muy estable |
| 0.8 | Sub-relajación moderada | Media | Estable |
| 1.0 | Equivale a Gauss-Seidel | Normal | Estable |
| 1.25 | Sobre-relajación ligera | Rápida | Estable |
| 1.5 | Sobre-relajación moderada | Muy rápida | Sensible |
| 1.75 | Sobre-relajación fuerte | Extremadamente rápida | Inestable si ω > ω_óptimo |
| 1.9 | Sobre-relajación extrema | Puede divergir | Inestable |

**ω óptimo teórico para Laplace 2D en malla cuadrada:**
```
ω_ópt = 2 / (1 + sin(π / h))

Para h = 1 (24×24):
ω_ópt ≈ 2 / (1 + sin(π/24)) ≈ 2 / (1 + 0.1305) ≈ 1.768
```

En la práctica, ω = 1.25 a 1.5 ofrece buen rendimiento sin riesgo de inestabilidad.

### 7.4 Registro de Métodos (`metodos/index.ts`)

```typescript
export type SolverStepFn = (grid: Cell[][], omega: number) => { grid: Cell[][]; error: number };

export const SOLVER_METHODS = {
  jacobi: {
    label: "Jacobi",
    description: "Actualización paralela con valores de la iteración anterior.",
    run: (grid: Cell[][]) => runJacobiStep(grid),  // Ignora omega
  },
  "gauss-seidel": {
    label: "Gauss-Seidel",
    description: "Actualización secuencial in-place. Más rápido que Jacobi.",
    run: (grid: Cell[][]) => runGaussSeidelStep(grid),  // Ignora omega
  },
  sor: {
    label: "SOR",
    description: "Sobre-relajación con factor ω para acelerar convergencia.",
    run: (grid: Cell[][], omega: number) => runSorStep(grid, omega),  // Usa omega
  },
} as const;
```

### 7.5 Comparativa de Métodos

| Característica | Jacobi | Gauss-Seidel | SOR |
|----------------|--------|--------------|-----|
| Memoria | O(n²) × 2 | O(n²) | O(n²) |
| Operaciones/iteración | ~4n² | ~4n² | ~4n² + n² (omega) |
| Convergencia | O(n²) iteraciones | O(n²/2) iteraciones | O(n) con ω óptimo |
| Paralelizable | Sí (trivial) | No | No |
| Complejidad de implementación | Baja | Baja | Media |
| Mejor uso | Ensayos educativos | Comparativa | Producción |

Para una malla de 24×24 = 576 nodos:
- **Jacobi:** ~150-300 iteraciones para converger
- **Gauss-Seidel:** ~80-150 iteraciones (2x más rápido)
- **SOR (ω=1.25):** ~40-80 iteraciones (4x más rápido)

---

## 8. Capa 5 — Servicios Transversales

La Capa 5 contiene utilidades reutilizables que no dependen de la UI ni del dominio específico.

### 8.1 Archivo `servicios.ts` (36 líneas)

#### 8.1.1 `convertirADbm(val)` — Conversión a Decibelios

```typescript
export function convertirADbm(val: number): number {
  if (val <= 0.05) return -70;              // Mínimo absoluto
  const dbm = -70 + (val / 100.0) * 60;     // Mapeo lineal
  return Math.min(-10, Math.round(dbm));     // Máximo -10 dBm
}
```

**Fórmula de conversión:**
```
dBm = -70 + (val / 100) × 60
```

**Rango de salida:**

| val | dBm | Calidad |
|-----|-----|---------|
| 0 | -70 | Sin cobertura |
| 25 | -55 | Buena |
| 50 | -40 | Muy buena |
| 75 | -25 | Excelente |
| 100 | -10 | Máxima |

**Nota:** Esta es una aproximación educativa. La relación real potencia-distancia es logarítmica (Ley de Friis: Pr = Pt + Gt + Gr - PL(d)).

#### 8.1.2 `clasificarCalidadSenal(dbm)` — Clasificación de Señal

```typescript
export function clasificarCalidadSenal(dbm: number): {
  text: string;   // Descripción legible
  color: string;  // Clase Tailwind de color de texto
  bg: string;     // Clase Tailwind de color de fondo
} {
  if (dbm >= -50) return { text: "Excelente (-30 a -50 dBm)", color: "text-emerald-500", bg: "bg-emerald-500" };
  if (dbm >= -65) return { text: "Buena (-51 a -65 dBm)", color: "text-teal-500", bg: "bg-teal-500" };
  if (dbm >= -75) return { text: "Regular (-66 a -75 dBm)", color: "text-amber-500", bg: "bg-amber-500" };
  if (dbm >= -85) return { text: "Mala (-76 a -85 dBm)", color: "text-orange-500", bg: "bg-orange-500" };
  return { text: "Sin Cobertura (<-85 dBm)", color: "text-rose-500", bg: "bg-rose-500" };
}
```

**Tabla de clasificación:**

| Rango dBm | Calidad | Uso típico |
|-----------|---------|------------|
| -30 a -50 | Excelente | Descarga máxima, streaming 4K |
| -51 a -65 | Buena | Navegación, videollamadas HD |
| -66 a -75 | Regular | Navegación básica, email |
| -76 a -85 | Mala | Conexión inestable, paquetes perdidos |
| < -85 | Sin cobertura | Sin conexión |

#### 8.1.3 `exportarConvergenciaACSV(...)` — Exportación CSV

```typescript
export function exportarConvergenciaACSV(errorHistory: number[], methodName: string): void {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Iteracion,Error_Residual_Maximo,Metodo\n";
  
  errorHistory.forEach((err, idx) => {
    csvContent += `${idx + 1},${err.toFixed(8)},${methodName}\n`;
  });
  
  // Crear enlace temporal y descargar
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `convergencia_${methodName.toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

**Formato del CSV generado:**
```csv
Iteracion,Error_Residual_Maximo,Metodo
1,45.23000000,Gauss-Seidel
2,32.15000000,Gauss-Seidel
3,21.87000000,Gauss-Seidel
...
156,0.00091500,Gauss-Seidel
```

### 8.2 Archivo `auth.ts` (26 líneas)

Sistema de hash de contraseñas usando Web Crypto API nativa del navegador.

```typescript
const SALT = "simunet_wifi_v1";  // Salt fijo por aplicación

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);  // Concatenar password + salt
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");  // Retornar como string hex de 64 caracteres
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  if (!stored) return password.length === 0;  // Sin password almacenado = sin auth
  return (await hashPassword(password)) === stored;
}
```

**Proceso de hash:**
```
Entrada: "admin123"
Salt:    "simunet_wifi_v1"
Concat:  "admin123simunet_wifi_v1"

SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
         (hash de ejemplo, no real)
```

**Seguridad:**
- SHA-256 genera hash de 256 bits (64 caracteres hex)
- Salt fijo (no ideal para producción, pero aceptable para uso educativo)
- No se almacena el password en texto plano
- `crypto.subtle` es la API nativa del navegador (no requiere librerías externas)

### 8.3 Archivo `reportGenerator.ts` (169 líneas)

Genera informes técnicos completos en formato texto plano.

#### 8.3.1 `generateReportAnalysisText(...)`

Genera un análisis comparativo de las simulaciones:

```typescript
export function generateReportAnalysisText(
  history: RunHistory[],
  gridSize: { rows: number; cols: number },
  wallsCount: number
): string {
  if (history.length === 0) {
    return "No se registran simulaciones finalizadas...";
  }

  // 1. Encontrar el método más rápido
  const optimalRun = [...history].sort((a, b) => a.executionTimeMs - b.executionTimeMs)[0];
  const methodLabel = METHOD_LABELS[optimalRun.method] ?? optimalRun.method.toUpperCase();

  return [
    // Párrafo 1: Resumen de simulaciones
    `En base a ${history.length} simulaciones numéricas sobre un mapa de ${gridSize.rows}x${gridSize.cols} (${gridSize.rows * gridSize.cols} nodos), se evaluó el comportamiento inalámbrico y la tasa de atenuación.`,
    
    // Párrafo 2: Análisis del método óptimo
    `El método más rápido registrado fue ${methodLabel} (${optimalRun.iterations} iteraciones en ${optimalRun.executionTimeMs} ms${optimalRun.method === "sor" ? ` con ω=${optimalRun.omega}` : ""}). ${
      optimalRun.method === "sor"
        ? "Esto valida la teoría: SOR con factor ω óptimo supera a Jacobi y Gauss-Seidel en velocidad de convergencia."
        : "Se recomienda probar SOR con ω entre 1.1 y 1.4 para comparar la aceleración de convergencia."
    }`,
    
    // Párrafo 3: Análisis de atenuación
    `Atenuación física: ${wallsCount} obstáculos activos. ${
      wallsCount > 25
        ? "La densidad de atenuadores crea zonas con señal por debajo de -75 dBm que restringen la cobertura útil."
        : "La distribución actual permite un radio de cobertura equilibrado sin zonas oscuras significativas."
    }`,
  ].join("\n\n");
}
```

#### 8.3.2 `downloadFullMeshReport(ctx)`

Genera un reporte técnico completo con 5 secciones:

```
╔══════════════════════════════════════════════════════════════╗
║        REPORTE TÉCNICO OFICIAL DE SIMULACIÓN                ║
║              SIMUNET - RESOLVEDOR DE LAPLACE                ║
╚══════════════════════════════════════════════════════════════╝

Fecha: 11/06/2026, 14:30:00
Operador: admin_pamplona (admin)
Dimensiones: 12.0m x 12.0m
Resolución: 0.5m/celda | Área: 144.0 m²
Nodos: 24 x 24
Obstrucciones: 8 | Enrutadores: 1

────────────────────────────────────────
1. PARÁMETROS DEL MOTOR NUMÉRICO
────────────────────────────────────────
Método: SOR
Omega (ω): 1.25
Tolerancia (ε): 0.001
Iteraciones máximas: 600
Última ejecución: 89 itr | Residuo: 0.000892 | Tiempo: 12 ms

────────────────────────────────────────
2. ENRUTADORES ACTIVOS
────────────────────────────────────────
Router #1: TP-Link_Hogareño_Estándar | 2.4 GHz | (12,12) | Potencia: 84%

────────────────────────────────────────
3. HISTORIAL DE EXPERIMENTOS
────────────────────────────────────────
1. SOR | 24x24 | 89 itr | 12ms | 8.92e-4 | OK
2. Gauss-Seidel | 24x24 | 156 itr | 18ms | 9.15e-4 | OK
3. Jacobi | 24x24 | 312 itr | 25ms | 9.87e-4 | NO

────────────────────────────────────────
4. MAPA ASCII DE INTENSIDAD
────────────────────────────────────────
# # # # # # # # # # # # # # # # # # # # # # # # #
# . . . . . . . . . . . . . . . . . . . . . . . #
# . . 3 3 3 . . . . . . . . . . . . . . . . . . #
# . 3 5 6 5 3 . . . C . . . . . . . . . . . . . #
# . 3 6 7 6 3 . . . C . . . . . . . . . . . . . #
# . 3 5 6 5 3 . . . C . . . . . . . . . . . . . #
# . . 3 3 3 . . . . . . . . . . . . . . . . . . #
# . . . . . . . . . . . . . . . . . . . . . . . #
# . . . . . . . . . . . . . . . . . . . . . . . #
...
R = Router | C = Concreto | 9-1 = Intensidad | . = Sin señal

────────────────────────────────────────
5. MATRIZ NUMÉRICA COMPLETA
────────────────────────────────────────
Coord | Material | Potencial (%) | dBm | Tipo
[0,0] | AIRE | 0.00% | -70 dBm | Borde
[1,1] | AIRE | 3.45% | -68 dBm | Interior
[12,12] | AIRE | 225.00% | -10 dBm | Excitador
[5,8] | CONCRETO | 12.30% | -63 dBm | Atenuador
...
```

---

## 9. Servidor Backend (server.ts)

### 9.1 Arquitectura del Servidor

```
server.ts (42 líneas)
├── import express, path, createViteServer, dotenv
├── dotenv.config()                         // Cargar .env
├── startServer()                           // Función principal
│   ├── express()                           // Crear app
│   ├── PORT = parseInt(process.env.PORT || "3000")
│   ├── app.use(express.json())             // Middleware JSON
│   ├── GET /api/health → { status: "ok" }  // Health check
│   ├── if (dev) → Vite middleware           // Desarrollo
│   ├── else → express.static + SPA fallback // Producción
│   └── app.listen(PORT, "0.0.0.0")         // Iniciar
└── startServer().catch(console.error)
```

### 9.2 Endpoint `/api/health`

```typescript
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString()
  });
});
```

**Response:**
```json
{
  "status": "ok",
  "time": "2026-06-11T14:30:00.000Z"
}
```

### 9.3 Modo Desarrollo vs Producción

**Desarrollo (NODE_ENV !== "production"):**
```typescript
const vite = await createViteServer({
  server: { middlewareMode: true },  // Vite como middleware de Express
  appType: "spa",                    // Single Page Application
});
app.use(vite.middlewares);           // HMR, transformaciones en tiempo real
```

**Producción (NODE_ENV === "production"):**
```typescript
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));  // Servir archivos estáticos
app.get("*", (req, res) => {        // SPA fallback
  res.sendFile(path.join(distPath, "index.html"));
});
```

---

## 10. Modelo Físico: Propagación WiFi Simplificada

### 10.1 Flujo de Conversión

```
Router (EIRP dBm)
    ↓
Potencia normalizada (val = power × 2.25)
    ↓
Ecuación de relajación con atenuación
    ↓
Potencial en celda (val: 0-100+)
    ↓
Conversión a dBm: dBm = -70 + (val/100) × 60
    ↓
Clasificación de calidad (Excelente/Buena/Regular/Mala/Sin cobertura)
```

### 10.2 Ecuación Generalizada de Relajación

Para cada celda (i,j) no fija:

```
u[i][j] = (1 - α[i][j]) × (u_arriba + u_abajo + u_izq + u_der) / 4
```

Donde:
- `u[i][j]` = valor del potencial en la celda
- `α[i][j]` = coeficiente de atenuación de la celda
- Los valores vecinos son de la iteración actual (GS/SOR) o anterior (Jacobi)

### 10.3 Factor de Atenuación por Material

```
α_efectiva = α_material × factor_frecuencia × factor_escala

Donde:
  α_material = { air: 0, drywall: 0.02, brick: 0.08, concrete: 0.15, metal: 0.25 }
  factor_frecuencia = { "2.4 GHz": 0.20, "5 GHz": 0.50 }
  factor_escala = cellSize / 0.5
```

### 10.4 Condiciones de Frontera (Dirichlet)

```
Frontera exterior: u = 0 (señal nula en el exterior del dominio)
Router:            u = power × 2.25 (fuente de señal)
Interior vacío:    u_inicial = 20.0 (valor de partida)
Pared:             u_inicial = 20.0 (se atenúa durante iteración)
```

### 10.5 Cálculo de Cobertura

```
Una celda tiene "cobertura" si:
  val ≥ 25
  Equivale a: dBm ≥ -75 (señal "Regular" o mejor)
  
Porcentaje de cobertura:
  coveragePct = (celdas_cubiertas / celdas_activas) × 100
  
Donde celdas_activas = total - paredes - frontera
```

---

## 11. Flujos de Datos Detallados

### 11.1 Flujo de Simulación Animada

```
[1] Usuario hace clic en "Animar Finito"
      ↓
[2] App.tsx: onStart={() => sim.setIsRunning(true)}
      ↓
[3] useSimulation: useEffect detecta isRunning = true
      ↓
[4] setTimeout(animationDelay) ejecuta:
      ↓
[5] runSolverStep(grid, method, omega)
      ↓
[6] SOLVER_METHODS[method].run(grid, omega)
      ↓
[7] runJacobiStep / runGaussSeidelStep / runSorStep
      ↓
[8] Retorna { grid: nextGrid, error: maxError }
      ↓
[9] Estados se actualizan:
      setGrid(step.grid)
      setCurrentIteration(prev + 1)
      setCurrentError(step.error)
      setCurrentErrorHistory([...prev, step.error])
      ↓
[10] React re-renderiza NetworkGrid
      ↓
[11] getCellBgColor(cell) mapea val → color RGBA
      ↓
[12] CSS Grid se actualiza con nuevos colores
      ↓
[13] Se repite hasta que:
      error < tolerance (convergió) O
      iteration >= maxIterations (límite)
      ↓
[14] setIsRunning(false)
[15] recordRun() agrega a history[]
```

### 11.2 Flujo de Resolución Instantánea

```
[1] Usuario hace clic en "Instantáneo"
      ↓
[2] App.tsx: onSolveInstant={sim.solveInstantly}
      ↓
[3] useSimulation.solveInstantly():
      setIsRunning(false)
      ↓
[4] solveInstant(grid, method, omega, tolerance, maxIterations)
      ↓
[5] Bucle sincrónico:
      while (iterations < max && error >= tolerance) {
        const step = runSolverStep(currentGrid, method, omega);
        currentGrid = step.grid;
        error = step.error;
        iterations++;
        errorHistory.push(error);
      }
      ↓
[6] Retorna { grid, iterations, finalError, errorHistory, timeMs }
      ↓
[7] Todos los estados se actualizan de una vez
[8] recordRun() agrega a history[]
```

### 11.3 Flujo de Optimización

```
[1] Usuario hace clic en "Calcular Posición Óptima"
      ↓
[2] useRouterOptimization.findBestLocation():
      setIsOptimizing(true)
      ↓
[3] setTimeout(800) para permitir renderizado del overlay
      ↓
[4] Para cada posición candidata (r, c) con step:
      ↓
[5] buildRouterFromModel(modelId, r, c)
      ↓
[6] buildInitialGrid(rows, cols, [router], walls, cellSize)
      ↓
[7] solveInstant(grid, "sor", 1.25, 0.01, 25)
      ↓
[8] Calcular avgSignal, coveragePct, score
      ↓
[9] Agregar a candidatesList[]
      ↓
[10] Ordenar por score descendente
      ↓
[11] Filtrar top 4 (Manhattan distance ≥ 4)
      ↓
[12] setOptimizationResult({ x, y, avgSignal, coveragePct, topCandidates })
      ↓
[13] setIsOptimizing(false)
      ↓
[14] ControlPanel muestra ranking de candidatos
      ↓
[15] Usuario selecciona posición → applyBestRouterLocation(x, y)
```

---

## 12. Persistencia y Almacenamiento Local

### 12.1 Claves de localStorage

| Clave | Tipo | Contenido | Actualizado por |
|-------|------|-----------|-----------------|
| `simunet_user_profiles` | JSON | Array de UserProfile[] | useAuth |
| `simunet_active_user` | JSON | UserProfile actual | useAuth |
| `simunet_dark_mode` | String | "true" o "false" | App.tsx |

### 12.2 Flujo de Persistencia

```
Aplicación carga
    ↓
loadProfiles() lee localStorage
    ↓
Si no existe → usar PRESET_PROFILES
Si existe → parsear JSON
    ↓
loadActiveUser() lee localStorage
    ↓
Si existe → verificar que el perfil aún existe en profiles[]
Si no existe → null (mostrar AuthPortal)
    ↓
useEffect migra contraseñas legacy (admin123 → SHA-256)
    ↓
setReady(true) → Mostrar interfaz
```

### 12.3 Sincronización

```
Cambio en profiles[] → useEffect → localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
Cambio en currentUser → useEffect → localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(currentUser))
Cambio en isDarkMode → useEffect → localStorage.setItem("simunet_dark_mode", String(isDarkMode))
```

---

## 13. Configuración, Build y Despliegue

### 13.1 Scripts npm

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `tsx server.ts` | Desarrollo con HMR (Vite middleware) |
| `build` | `vite build && esbuild server.ts --bundle ...` | Build de producción |
| `start` | `NODE_ENV=production node dist/server.cjs` | Ejecutar en producción |
| `clean` | `rm -rf dist` | Limpiar directorio de build |
| `lint` | `tsc --noEmit` | Verificación de tipos |
| `typecheck` | `tsc --noEmit` | Alias de lint |

### 13.2 Build de Producción

```bash
npm run build
```

**Proceso:**
```
1. vite build
   → Genera dist/index.html
   → Genera dist/assets/index-[hash].js (React + lógica)
   → Genera dist/assets/index-[hash].css (Tailwind)
   
2. esbuild server.ts --bundle --platform=node --format=cjs
   → Empaqueta server.ts + dependencias de Node
   → Genera dist/server.cjs
   → Incluye sourcemap
```

### 13.3 Variables de Entorno

```bash
# .env (opcional)
PORT=3000              # Puerto del servidor (default: 3000)
NODE_ENV=production    # Modo producción (default: development)
```

### 13.4 TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2022",           // JavaScript moderno
    "module": "ESNext",           // Módulos ES modernos
    "jsx": "react-jsx",           // JSX transform automático
    "moduleResolution": "bundler", // Resolución para bundlers
    "paths": { "@/*": ["./*"] },  // Alias de ruta
    "noEmit": true,               // Solo type-check, no generar JS
    "isolatedModules": true,      // Asegurar compatibilidad con esbuild
    "skipLibCheck": true          // Ignorar errores en node_modules
  }
}
```

### 13.5 Vite Config

```typescript
export default defineConfig(() => ({
  plugins: [
    react(),           // JSX transform + Fast Refresh
    tailwindcss(),     // Integración Tailwind
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },  // Alias @
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',       // HMR configurable
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
```

---

## 14. Apéndice Matemático

### 14.1 Ecuación de Laplace en Coordenadas Polares

Para dominios circulares (no implementado, pero relevante):
```
∇²u = (1/r) ∂/∂r(r ∂u/∂r) + (1/r²) ∂²u/∂θ² = 0
```

### 14.2 Cota de Convergencia

Para Jacobi en malla cuadrada N×N:
```
ρ(J) = cos(π/N)  ← Radio espectral
Número de iteraciones ≈ -N²/(2π²) × ln(ε)
```

Para N = 24, ε = 0.001:
```
Iteraciones ≈ -576/(2π²) × ln(0.001) ≈ -29.2 × (-6.9) ≈ 202 iteraciones (Jacobi teórico)
```

### 14.3 Factor Óptimo SOR

```
ω_ópt = 2 / (1 + √(1 - ρ(J)²))

Para Jacobi: ρ(J) = cos(π/N)
ω_ópt = 2 / (1 + sin(π/N))

Ejemplos:
  N=10:  ω_ópt ≈ 1.53
  N=16:  ω_ópt ≈ 1.66
  N=24:  ω_ópt ≈ 1.73
  N=32:  ω_ópt ≈ 1.76
  N→∞:   ω_ópt → 2.0
```

### 14.4 Conversión dBm ↔ Potencia

```
P(mW) = 10^(dBm/10)
dBm = 10 × log10(P(mW))

Ejemplos:
  0 dBm  = 1 mW
  3 dBm  = 2 mW
  10 dBm = 10 mW
  20 dBm = 100 mW
  30 dBm = 1 W
  -70 dBm = 0.1 nW (ruido típico)
```

### 14.5 Pérdida por Distancia (Ley de Friis)

No implementada en el simulador, pero relevante para contexto:
```
PL(d) = 20×log10(d) + 20×log10(f) + 32.44

Donde:
  d = distancia en metros
  f = frecuencia en MHz
  
Ejemplo a 2.4 GHz, 10m:
  PL = 20×log10(10) + 20×log10(2400) + 32.44
  PL = 20 + 67.6 + 32.44 = 120 dB
```

---

## 15. Glosario de Términos

| Término | Definición |
|---------|------------|
| **∇²u = 0** | Ecuación de Laplace (campo armónico, sin fuentes) |
| **Dirichlet** | Condición de frontera con valor fijo del campo |
| **Jacobi** | Método iterativo de actualización paralela |
| **Gauss-Seidel** | Método iterativo de actualización secuencial |
| **SOR** | Successive Over-Relaxation (aceleración con factor ω) |
| **dBm** | Decibelios relativos a 1 miliwatios (unidad de potencia) |
| **dBi** | Decibelios relativos a una antena isotrópica (ganancia) |
| **EIRP** | Effective Isotropic Radiated Power (potencia efectiva radiada) |
| **Malla** | Grid discreto de nodos para resolución numérica |
| **Celda** | Nodo individual de la malla con valor de potencial |
| **Convergencia** | El error residual cae por debajo de la tolerancia ε |
| **Relajación** | Factor que controla la velocidad de actualización |
| **Tolerancia (ε)** | Umbral mínimo de error para considerar convergencia |
| **Omega (ω)** | Factor de relajación en SOR [0.5 - 1.9] |
| **Iteración** | Un paso completo de actualización de todas las celdas |
| **Residuo** | Error máximo de cambio entre iteraciones consecutivas |
| **Potencial** | Valor numérico asociado a la intensidad de señal |
| **Atenuación** | Reducción de intensidad por material o distancia |
| **Frontera** | Borde exterior de la malla (u = 0, Dirichlet homogéneo) |
| **Fuente** | Punto de excitación (router, u = constante) |

---

## Apéndice: Complejidad Computacional

| Método | Memoria | Convergencia | Paralelizable | Mejor para |
|--------|---------|--------------|---------------|------------|
| Jacobi | O(n²) × 2 | O(n²) iteraciones | Sí (trivial) | Enseñanza, GPU |
| Gauss-Seidel | O(n²) | O(n²/2) iteraciones | Difícil | Uso general |
| SOR | O(n²) | O(n) con ω óptimo | Difícil | Producción |

Para malla de 24×24 = 576 nodos:
- **Jacobi:** ~200 iteraciones × 576 ops = ~115,200 operaciones
- **Gauss-Seidel:** ~100 iteraciones × 576 ops = ~57,600 operaciones
- **SOR (ω=1.25):** ~50 iteraciones × 576 ops = ~28,800 operaciones

---

*Documento generado para SimuNet WiFi v1.0.0 — Universidad de Pamplona © 2026*
