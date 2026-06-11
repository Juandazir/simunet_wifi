import { Cell, SolverMethod, MaterialType, RouterConfig } from "./types";

/**
 * ESPECIFICACIONES DE HARDWARE DE ENRUTADORES DE REFERENCIA (CAPA 4 / CAPA 5)
 * Modela parámetros reales de radiofrecuencia para estimar la atenuación y EIRP (potencia radiada).
 */
export interface RouterModel {
  id: string;
  name: string;
  brand: string;
  model: string;
  txPowerDbm: number;
  gainDbi: number;
  eirpDbm: number;
  frequency: "2.4 GHz" | "5 GHz";
  standard: string;
  reachMeters: number;
  description: string;
}

// Catálogo de modelos de enrutadores comerciales
export const ROUTER_MODELS: Record<string, RouterModel> = {
  tplink: {
    id: "tplink",
    name: "TP-Link Archer C60",
    brand: "TP-Link",
    model: "Hogareño Estándar",
    txPowerDbm: 24,
    gainDbi: 8,
    eirpDbm: 32,
    frequency: "2.4 GHz",
    standard: "Wi-Fi 5 (802.11ac)",
    reachMeters: 45,
    description: "Router doméstico clásico MIMO 3x3 de banda estándar 2.4GHz con excelente penetración y rango amplificado."
  },
  ubiquiti: {
    id: "ubiquiti",
    name: "Ubiquiti UniFi U6 Pro",
    brand: "Ubiquiti",
    model: "Punto de Acceso Empresarial",
    txPowerDbm: 31,
    gainDbi: 9,
    eirpDbm: 40,
    frequency: "5 GHz",
    standard: "Wi-Fi 6 (802.11ax)",
    reachMeters: 75,
    description: "Punto de acceso premium empresarial con Wi-Fi 6 de alta potencia y amplio rango de cobertura optimizada."
  },
  asus: {
    id: "asus",
    name: "ASUS ROG GT-AX11000",
    brand: "ASUS ROG",
    model: "Gaming Ultra-Rendimiento",
    txPowerDbm: 38,
    gainDbi: 12,
    eirpDbm: 50,
    frequency: "5 GHz",
    standard: "Wi-Fi 6 (802.11ax)",
    reachMeters: 100,
    description: "Bestia de transmisión con amplificación máxima de hardware, de altísimo rango y formidable espectro de potencia."
  },
  google: {
    id: "google",
    name: "Google Nest Wifi (Mesh)",
    brand: "Google",
    model: "Nodo Inteligente de Malla",
    txPowerDbm: 26,
    gainDbi: 7,
    eirpDbm: 33,
    frequency: "5 GHz",
    standard: "Wi-Fi 5 (802.11ac)",
    reachMeters: 60,
    description: "Nodo decorativo de alta eficiencia con cobertura optimizada para redes mesh de largo alcance."
  }
};

/**
 * CONFIGURACIÓN DE MATERIALES Y COEFICIENTES DE PÉRDIDA DIELÉCTRICA
 * Mapea pérdidas en dB y coeficientes de atenuación para el resolutor diferencial de Laplace.
 */
export const MATERIALS = {
  air: {
    id: "air" as MaterialType,
    name: "Espacio Libre",
    color: "bg-transparent",
    attenuation: 0.0,
    dbLoss: 0,
    iconName: "Wind",
  },
  drywall: {
    id: "drywall" as MaterialType,
    name: "Yeso (Drywall)",
    color: "bg-slate-300 border-slate-400",
    attenuation: 0.02,
    dbLoss: 3,
    iconName: "Columns",
  },
  brick: {
    id: "brick" as MaterialType,
    name: "Ladrillo",
    color: "bg-amber-700 border-amber-800",
    attenuation: 0.08,
    dbLoss: 8,
    iconName: "Brick",
  },
  concrete: {
    id: "concrete" as MaterialType,
    name: "Concreto",
    color: "bg-gray-600 border-gray-700",
    attenuation: 0.15,
    dbLoss: 15,
    iconName: "SquareDot",
  },
  metal: {
    id: "metal" as MaterialType,
    name: "Metal",
    color: "bg-zinc-400 border-zinc-500 animate-pulse",
    attenuation: 0.25,
    dbLoss: 35,
    iconName: "ShieldAlert",
  },
};

// Dimensiones recomendadas por defecto para la rejilla espacial
export const DEFAULT_ROWS = 24;
export const DEFAULT_COLS = 24;

/**
 * Inicializa la malla computacional con tamaño filas x columnas de celdas.
 * Configura bordes inmutables (fronteras físicas exteriores de Dirichlet), muros de absorción 
 * dieléctrica y la ubicación estática de los enrutadores Wi-Fi emisores.
 */
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
      // Un nodo es borde Dirichlet si se sitúa en el límite exterior de la rejilla espacial
      const isBoundary = i === 0 || i === rows - 1 || j === 0 || j === cols - 1;
      
      const wall = walls.find((w) => w.x === i && w.y === j);
      const router = routers.find((r) => r.x === i && r.y === j);

      let cellType: "empty" | "wall" | "router" = "empty";
      let material: MaterialType = "air";
      
      // La atenuación del aire libre escala linealmente con los metros físicos por celda (cellSize).
      let attenuation = 0.0012 * (cellSize / 0.5); 
      let initialVal = 0.0;
      let fixed = isBoundary;

      // Aplicación de semillas de excitación del campo para mitigar saltos asintóticos
      if (isBoundary) {
        initialVal = 0.0; // Borde exterior actúa como un sumidero a tierra
      } else {
        initialVal = 20.0; // Seed ideal para agilizar la dispersión numérica inicial
      }

      if (wall) {
        cellType = "wall";
        material = wall.material;
        
        let multiplier = 1.0;
        const activeRouter = routers[0];
        if (activeRouter) {
          if (activeRouter.frequency === "2.4 GHz") {
            multiplier = 0.20; // 2.4 GHz atraviesa muros con mayor soltura electromagnética
          } else {
            multiplier = 0.50; // 5 GHz sufre un bloqueo dieléctrico significativamente más severo
          }
        }
        
        // Coeficiente atenuador local corregido por la escala física de la celda
        attenuation = MATERIALS[wall.material].attenuation * multiplier * (cellSize / 0.5);
      }

      if (router) {
        cellType = "router";
        // Convertir la potencia de salida en un potencial escalar Dirichlet equivalente
        initialVal = router.power * 2.25; 
        fixed = true; // Router se consolida como frontera fija (no oscilante)
      }

      row.push({
        x: i,
        y: j,
        type: cellType,
        material,
        attenuation: Math.min(0.98, Math.max(0.0, attenuation)),
        val: initialVal,
        fixed,
      });
    }
    grid.push(row);
  }

  return grid;
}

import { runSorStep } from "./metodos";
import { convertirADbm, clasificarCalidadSenal } from "./servicios";

/**
 * Realiza un paso de iteración sobre la rejilla utilizando el solucionador numérico SOR de la Capa 4.
 */
export function runSolverStep(
  currentGrid: Cell[][],
  method: SolverMethod,
  omega: number
): { grid: Cell[][]; error: number } {
  // Siempre ejecuta SOR por requerimiento de simplificación de algoritmos convergentes
  return runSorStep(currentGrid, omega);
}

/**
 * Resuelve instantáneamente el lazo de la rejilla hasta alcanzar la tolerancia de convergencia o el máximo de iteraciones.
 * Útil para ejecuciones rápidas y simulaciones en tiempo real interactivas.
 */
export function solveInstant(
  initialGrid: Cell[][],
  method: SolverMethod,
  omega: number,
  tolerance: number,
  maxIterations: number
): { grid: Cell[][]; iterations: number; finalError: number; errorHistory: number[]; timeMs: number } {
  const start = performance.now();
  let currentGrid = initialGrid.map((row) => row.map((cell) => ({ ...cell })));
  let iterations = 0;
  let finalError = 1.0;
  const errorHistory: number[] = [];

  while (iterations < maxIterations && finalError >= tolerance) {
    const step = runSolverStep(currentGrid, method, omega);
    currentGrid = step.grid;
    finalError = step.error;
    iterations++;
    errorHistory.push(finalError);
  }

  const end = performance.now();

  return {
    grid: currentGrid,
    iterations,
    finalError,
    errorHistory,
    timeMs: Math.round((end - start) * 100) / 100,
  };
}

/**
 * Formatea los valores numéricos abstractos de señal (0 - 100) a decibelios dBm reales.
 * Delegado a la Capa 5.
 */
export function getDbmValue(val: number): number {
  return convertirADbm(val);
}

/**
 * Obtiene la calidad de señal cualitativa basada en niveles dBm.
 * Delegado a la Capa 5.
 */
export function getSignalQuality(dbm: number): { text: string; color: string; bg: string } {
  return clasificarCalidadSenal(dbm);
}

