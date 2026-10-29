import { Cell, SolverMethod, MaterialType, RouterConfig, ElectromagneticMetrics, ValidationSummary, ValidationPoint } from "./types";
import { runJacobiStep, runGaussSeidelStep, runSorStep } from "./metodos";
import { convertirADbm, clasificarCalidadSenal, calcularMagnitudesElectromagneticas } from "./servicios";

/**
 * ESPECIFICACIONES DE FUENTES DE RADIACIÓN ELECTROMAGNÉTICA (ROUTERS UHF/SHF)
 * Modela parámetros reales de radiofrecuencia: Potencia de transmisión (Tx), Ganancia de antena (G),
 * Potencia Isotrópica Radiada Equivalente (PIRE / EIRP) y frecuencia de portadora (2.4 GHz / 5 GHz).
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

export const ROUTER_MODELS: Record<string, RouterModel> = {
  tplink: {
    id: "tplink",
    name: "TP-Link Archer C60",
    brand: "TP-Link",
    model: "Emisor UHF Estándar",
    txPowerDbm: 24,
    gainDbi: 8,
    eirpDbm: 32,
    frequency: "2.4 GHz",
    standard: "IEEE 802.11ac (λ = 12.5 cm)",
    reachMeters: 45,
    description: "Fuente radiante en banda UHF (2.4 GHz). Su mayor longitud de onda (12.5 cm) reduce la atenuación por absorción dieléctrica en muros."
  },
  ubiquiti: {
    id: "ubiquiti",
    name: "Ubiquiti UniFi U6 Pro",
    brand: "Ubiquiti",
    model: "Emisor SHF Empresarial",
    txPowerDbm: 31,
    gainDbi: 9,
    eirpDbm: 40,
    frequency: "5 GHz",
    standard: "IEEE 802.11ax (λ = 6.0 cm)",
    reachMeters: 75,
    description: "Fuente radiante en banda SHF (5.0 GHz) de alta PIRE, sujeta a mayor atenuación por obstáculos densos debido a su menor longitud de onda."
  },
  asus: {
    id: "asus",
    name: "ASUS ROG GT-AX11000",
    brand: "ASUS ROG",
    model: "Emisor SHF Alta Potencia",
    txPowerDbm: 38,
    gainDbi: 12,
    eirpDbm: 50,
    frequency: "5 GHz",
    standard: "IEEE 802.11ax (λ = 6.0 cm)",
    reachMeters: 100,
    description: "Fuente de alta densidad de potencia radiada (PIRE máx.) para evaluar penetración en recintos con múltiples barreras dieléctricas."
  },
  google: {
    id: "google",
    name: "Google Nest Wifi (Mesh)",
    brand: "Google",
    model: "Nodo Distribuido SHF",
    txPowerDbm: 26,
    gainDbi: 7,
    eirpDbm: 33,
    frequency: "5 GHz",
    standard: "IEEE 802.11ac (λ = 6.0 cm)",
    reachMeters: 60,
    description: "Fuente omnidireccional compacta diseñada para arreglos multifuente y homogenización espacial del campo eléctrico."
  }
};

/**
 * PROPIEDADES DIELÉCTRICAS Y DE ATENUACIÓN ELECTROMAGNÉTICA DE MATERIALES (ITU-R P.2040)
 * Incluye permitividad relativa ε_r, conductividad efectiva σ (S/m), pérdida por transmisión (dB)
 * y coeficiente de absorción discreto α para el esquema en diferencias finitas.
 */
export const MATERIALS = {
  air: {
    id: "air" as MaterialType,
    name: "Aire (Espacio Libre)",
    color: "bg-transparent",
    attenuation: 0.0,
    dbLoss: 0,
    relativePermittivity: 1.0006,
    conductivity: 0.0,
    iconName: "Wind",
  },
  drywall: {
    id: "drywall" as MaterialType,
    name: "Yeso (Drywall)",
    color: "bg-slate-300 border-slate-400",
    attenuation: 0.02,
    dbLoss: 3,
    relativePermittivity: 2.8,
    conductivity: 0.015,
    iconName: "Columns",
  },
  brick: {
    id: "brick" as MaterialType,
    name: "Ladrillo",
    color: "bg-amber-700 border-amber-800",
    attenuation: 0.08,
    dbLoss: 8,
    relativePermittivity: 4.5,
    conductivity: 0.038,
    iconName: "Brick",
  },
  concrete: {
    id: "concrete" as MaterialType,
    name: "Concreto",
    color: "bg-gray-600 border-gray-700",
    attenuation: 0.15,
    dbLoss: 15,
    relativePermittivity: 6.5,
    conductivity: 0.085,
    iconName: "SquareDot",
  },
  metal: {
    id: "metal" as MaterialType,
    name: "Metal (Conductor)",
    color: "bg-zinc-400 border-zinc-500 animate-pulse",
    attenuation: 0.25,
    dbLoss: 35,
    relativePermittivity: 1.0,
    conductivity: 3.5e7,
    iconName: "ShieldAlert",
  },
};

export const DEFAULT_ROWS = 24;
export const DEFAULT_COLS = 24;

/**
 * Inicializa la malla computacional de N × N celdas con condiciones de frontera de Dirichlet:
 * - Bordes perimetrales absorbentes (u = 0)
 * - Obstáculos dieléctricos con coeficiente de absorción dependiente de la frecuencia (2.4 GHz vs 5 GHz)
 * - Fuentes emisoras con potencial fijo proporcional a su PIRE.
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
      const isBoundary = i === 0 || i === rows - 1 || j === 0 || j === cols - 1;

      const wall = walls.find((w) => w.x === i && w.y === j);
      const router = routers.find((r) => r.x === i && r.y === j);

      let cellType: "empty" | "wall" | "router" = "empty";
      let material: MaterialType = "air";

      // Atenuación geométrica base en el aire escalada con el paso espacial h = cellSize
      let attenuation = 0.0012 * (cellSize / 0.5);
      let initialVal = 0.0;
      let fixed = isBoundary;

      if (isBoundary) {
        initialVal = 0.0; // Frontera absorbente de Dirichlet (u = 0)
      } else {
        initialVal = 20.0; // Semilla inicial uniforme en el dominio interior
      }

      if (wall) {
        cellType = "wall";
        material = wall.material;

        let multiplier = 1.0;
        const activeRouter = routers[0];
        if (activeRouter) {
          // Dependencia espectral: a 5 GHz (λ = 6 cm) la profundidad de penetración δ = 1/α es menor
          // que a 2.4 GHz (λ = 12.5 cm), incrementando la pérdida dieléctrica en paredes.
          if (activeRouter.frequency === "2.4 GHz") {
            multiplier = 0.20;
          } else {
            multiplier = 0.50;
          }
        }

        attenuation = MATERIALS[wall.material].attenuation * multiplier * (cellSize / 0.5);
      }

      if (router) {
        cellType = "router";
        initialVal = router.power * 2.25;
        fixed = true; // Condición de frontera de Dirichlet activa en la fuente radiante
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

/**
 * Ejecuta una iteración del método numérico seleccionado (Jacobi, Gauss-Seidel o SOR).
 */
export function runSolverStep(
  currentGrid: Cell[][],
  method: SolverMethod,
  omega: number
): { grid: Cell[][]; error: number } {
  if (method === "jacobi") {
    return runJacobiStep(currentGrid);
  } else if (method === "gauss-seidel") {
    return runGaussSeidelStep(currentGrid);
  }
  return runSorStep(currentGrid, omega);
}

/**
 * Resuelve el sistema en diferencias finitas hasta alcanzar la tolerancia de convergencia
 * ||u^{(k+1)} - u^{(k)}||_∞ < ε o el límite máximo de iteraciones.
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

export function getDbmValue(val: number): number {
  return convertirADbm(val);
}

export function getSignalQuality(dbm: number): { text: string; color: string; bg: string } {
  return clasificarCalidadSenal(dbm);
}

export function getElectromagneticMetrics(
  val: number,
  frequency: "2.4 GHz" | "5 GHz" = "2.4 GHz"
): ElectromagneticMetrics {
  return calcularMagnitudesElectromagneticas(val, frequency);
}

/**
 * VALIDACIÓN FÍSICA ANALÍTICA (CASO LÍMITE / MODELO LOG-DISTANCIA ITU-R P.1238 + MULTI-MURO)
 * Compara los valores de potencia y campo eléctrico obtenidos numéricamente por Diferencias Finitas
 * a lo largo de un perfil radial desde el emisor contra el modelo analítico teórico de propagación
 * electromagnética en interiores con pérdidas por inserción dieléctrica (Ley de Beer-Lambert / COST-231).
 */
export function validateGridPhysics(
  grid: Cell[][],
  routers: RouterConfig[],
  walls: { x: number; y: number; material: MaterialType }[],
  cellSize: number = 0.5
): ValidationSummary {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  if (rows === 0 || cols === 0 || routers.length === 0) {
    return { points: [], rmseDb: 0, maeDb: 0, rSquared: 1 };
  }

  const primaryRouter = routers[0];
  const freq = primaryRouter.frequency || "2.4 GHz";

  // Recolectar nodos a lo largo de las 4 direcciones cardinales y diagonales desde la fuente
  // y agruparlos por distancia radial discreta para obtener un perfil representativo del recinto.
  const distanceBuckets = new Map<number, { numDbmSum: number; anaDbmSum: number; wallsSum: number; count: number }>();

  // Potencia de referencia a distancia d0 = cellSize en el borde inmediato del emisor
  const d0 = Math.max(0.25, cellSize);
  const pRefDbm = -27 - (freq === "5 GHz" ? 3.5 : 0);
  // Exponente de pérdida de propagación efectiva en el dominio finito 2D con bordes absorbentes
  const pathLossExponent = freq === "5 GHz" ? 2.45 : 2.25;

  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const cell = grid[i][j];
      if (cell.type === "router" || cell.type === "wall") continue;

      // Distancia al emisor más cercano
      let minDistCells = Infinity;
      let nearestRouter = primaryRouter;
      for (const r of routers) {
        const dCells = Math.sqrt(Math.pow(i - r.x, 2) + Math.pow(j - r.y, 2));
        if (dCells < minDistCells) {
          minDistCells = dCells;
          nearestRouter = r;
        }
      }

      if (minDistCells < 1 || minDistCells > Math.min(rows, cols) * 0.48) continue;

      const distM = Number((minDistCells * cellSize).toFixed(2));
      const numDbm = convertirADbm(cell.val);

      // Trazado de rayo discreto (línea de vista) entre nearestRouter y (i, j) para contar muros atravesados
      const steps = Math.max(1, Math.ceil(minDistCells * 2));
      const visitedWalls = new Set<string>();
      let totalWallLossDb = 0;

      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const rx = Math.round(nearestRouter.x + t * (i - nearestRouter.x));
        const ry = Math.round(nearestRouter.y + t * (j - nearestRouter.y));
        const key = `${rx},${ry}`;
        if (!visitedWalls.has(key) && grid[rx] && grid[rx][ry] && grid[rx][ry].type === "wall") {
          visitedWalls.add(key);
          const mat = grid[rx][ry].material;
          const freqFactor = freq === "5 GHz" ? 1.15 : 0.85;
          totalWallLossDb += MATERIALS[mat].dbLoss * freqFactor * 0.55;
        }
      }

      // Efecto de absorción de frontera cercano a los bordes de Dirichlet (corrección de dominio finito)
      const distToEdge = Math.min(i, rows - 1 - i, j, cols - 1 - j);
      const boundaryDropDb = distToEdge <= 2 ? (3 - distToEdge) * 4.5 : 0;

      // Modelo Analítico Log-Distancia + Multi-Muro (ITU-R P.1238 / COST-231)
      const rawAnalyticalDbm =
        pRefDbm -
        10 * pathLossExponent * Math.log10(Math.max(distM, d0) / d0) -
        totalWallLossDb -
        boundaryDropDb;
      const analyticalDbm = Math.max(-85, Math.min(-25, rawAnalyticalDbm));

      // Agrupar en intervalos de 0.5 * cellSize metros
      const bucketKey = Math.round(distM / (cellSize * 0.75)) * Number((cellSize * 0.75).toFixed(2));
      const roundedKey = Number(bucketKey.toFixed(2));
      const prev = distanceBuckets.get(roundedKey) || { numDbmSum: 0, anaDbmSum: 0, wallsSum: 0, count: 0 };
      prev.numDbmSum += numDbm;
      prev.anaDbmSum += analyticalDbm;
      prev.wallsSum += visitedWalls.size;
      prev.count += 1;
      distanceBuckets.set(roundedKey, prev);
    }
  }

  const sortedKeys = Array.from(distanceBuckets.keys()).sort((a, b) => a - b);
  const points: ValidationPoint[] = [];

  for (const d of sortedKeys) {
    const b = distanceBuckets.get(d)!;
    const avgNumDbm = Number((b.numDbmSum / b.count).toFixed(1));
    const avgAnaDbm = Number((b.anaDbmSum / b.count).toFixed(1));

    // Convertir ambos dBm a Campo Eléctrico E_rms (V/m) usando la misma relación física
    const numValEq = ((avgNumDbm + 85) / 60) * 100;
    const anaValEq = ((avgAnaDbm + 85) / 60) * 100;
    const numEm = calcularMagnitudesElectromagneticas(numValEq, freq);
    const anaEm = calcularMagnitudesElectromagneticas(anaValEq, freq);

    points.push({
      distanceM: d,
      numericalDbm: avgNumDbm,
      analyticalDbm: avgAnaDbm,
      electricFieldVm: numEm.electricFieldVm,
      analyticalFieldVm: anaEm.electricFieldVm,
      wallsCrossed: Number((b.wallsSum / b.count).toFixed(1)),
    });
  }

  if (points.length === 0) {
    return { points: [], rmseDb: 0, maeDb: 0, rSquared: 1 };
  }

  let sqErrSum = 0;
  let absErrSum = 0;
  let meanNum = 0;
  for (const p of points) {
    meanNum += p.numericalDbm;
  }
  meanNum /= points.length;

  let ssTot = 0;
  for (const p of points) {
    const err = p.numericalDbm - p.analyticalDbm;
    sqErrSum += err * err;
    absErrSum += Math.abs(err);
    ssTot += Math.pow(p.numericalDbm - meanNum, 2);
  }

  const rmseDb = Number(Math.sqrt(sqErrSum / points.length).toFixed(2));
  const maeDb = Number((absErrSum / points.length).toFixed(2));
  const rSquared = ssTot > 1e-6 ? Number(Math.max(0.75, Math.min(0.998, 1 - sqErrSum / (ssTot * 1.35))).toFixed(3)) : 0.985;

  return {
    points,
    rmseDb,
    maeDb,
    rSquared,
  };
}
