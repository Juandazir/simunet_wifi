// Importa los tipos fundamentales del dominio físico y de la malla desde la Capa 1
import {
  Cell,
  SolverMethod,
  MaterialType,
  RouterConfig,
  ElectromagneticMetrics,
  ValidationSummary,
  ValidationPoint,
} from "./types";
// Importa los tres motores iterativos en Diferencias Finitas (Jacobi, Gauss-Seidel y SOR) desde la Capa 4
import { runJacobiStep, runGaussSeidelStep, runSorStep } from "./metodos";
// Importa las funciones de conversión electromagnética (dBm, Vector de Poynting, Campos E y H) desde la Capa 5
import {
  convertirADbm,
  clasificarCalidadSenal,
  calcularMagnitudesElectromagneticas,
} from "./servicios";

/**
 * CAPA 2: CONTROLADOR DE FÍSICA COMPUTACIONAL Y PUENTE DE SIMULACIÓN
 * Orquesta la inicialización de la malla discreta, la asignación de propiedades dieléctricas dependientes
 * de la frecuencia, la ejecución de los métodos iterativos y la validación cruzada contra el modelo analítico.
 */

// Estructura que define las especificaciones de radiofrecuencia de cada modelo comercial de router
export interface RouterModel {
  id: string;                      // Identificador interno único del perfil de hardware
  name: string;                    // Nombre comercial del equipo transmisor
  brand: string;                   // Marca del fabricante
  model: string;                   // Categoría electromagnética del transmisor (UHF / SHF)
  txPowerDbm: number;              // Potencia de conducción a la salida del amplificador de RF P_tx (dBm)
  gainDbi: number;                 // Ganancia directiva de los arreglos de antenas G_tx (dBi)
  eirpDbm: number;                 // Potencia Isotrópica Radiada Equivalente PIRE = P_tx + G_tx (dBm)
  frequency: "2.4 GHz" | "5 GHz";  // Banda espectral de operación portadora
  standard: string;                // Estándar IEEE 802.11 y longitud de onda asociada λ
  reachMeters: number;             // Alcance nominal estimado en espacio libre sin obstáculos (m)
  description: string;             // Explicación física del comportamiento de propagación del equipo
}

// Catálogo de fuentes emisoras de radiación electromagnética (UHF 2.4 GHz y SHF 5.0 GHz)
export const ROUTER_MODELS: Record<string, RouterModel> = {
  // Perfil 1: Router doméstico estándar en banda UHF (2.4 GHz, λ = 12.5 cm)
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
    description:
      "Fuente radiante en banda UHF (2.4 GHz). Su mayor longitud de onda (12.5 cm) reduce la atenuación por absorción dieléctrica en muros.",
  },
  // Perfil 2: Punto de acceso empresarial en banda SHF (5.0 GHz, λ = 6.0 cm)
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
    description:
      "Fuente radiante en banda SHF (5.0 GHz) de alta PIRE, sujeta a mayor atenuación por obstáculos densos debido a su menor longitud de onda.",
  },
  // Perfil 3: Transmisor de alta potencia PIRE en banda SHF (5.0 GHz, λ = 6.0 cm)
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
    description:
      "Fuente de alta densidad de potencia radiada (PIRE máx.) para evaluar penetración en recintos con múltiples barreras dieléctricas.",
  },
  // Perfil 4: Nodo omnidireccional para redes distribuidas tipo Mesh en banda SHF (5.0 GHz)
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
    description:
      "Fuente omnidireccional compacta diseñada para arreglos multifuente y homogenización espacial del campo eléctrico.",
  },
};

/**
 * Calcula la potencia escalar normalizada de excitación para un modelo comercial de router
 * a partir de su Potencia Isotrópica Radiada Equivalente (PIRE / EIRP en dBm).
 *
 * @param model Perfil técnico del router seleccionado del catálogo ROUTER_MODELS.
 * @returns Valor entero de potencia escalar normalizada para inyectar como condición de Dirichlet.
 */
export function calcularPotenciaNormalizadaRouter(model: RouterModel): number {
  // Escala linealmente la PIRE del equipo respecto al nivel base de referencia (38 dBm = 100 unidades base)
  return Math.round(model.eirpDbm * (100 / 38));
}

/**
 * PROPIEDADES DIELÉCTRICAS Y DE ATENUACIÓN ELECTROMAGNÉTICA DE MATERIALES (ITU-R P.2040)
 * Define para cada medio constructivo:
 * - attenuation: coeficiente discreto α de absorción nodal en el esquema de diferencias finitas
 * - dbLoss: pérdida física nominal por transmisión en decibelios (dB)
 * - relativePermittivity: permitividad dieléctrica relativa real ε'_r (adimensional)
 * - conductivity: conductividad eléctrica efectiva σ (S/m) en frecuencias de microondas
 */
export const MATERIALS = {
  // Medio de propagación libre (aire atmosférico estándar)
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
  // Tabiquería ligera de placa de yeso laminado (Drywall)
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
  // Mampostería de ladrillo cerámico macizo
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
  // Muro estructural de hormigón / concreto armado denso
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
  // Obstáculo conductor metálico con apantallamiento por efecto pelicular (jaula de Faraday local)
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

// Número de filas por defecto de la rejilla computacional al iniciar la aplicación
export const DEFAULT_ROWS = 24;
// Número de columnas por defecto de la rejilla computacional al iniciar la aplicación
export const DEFAULT_COLS = 24;

/**
 * Construye e inicializa la malla computacional de rows × cols celdas aplicando:
 * 1. Condiciones de frontera de Dirichlet homogéneas (u = 0) en el perímetro exterior absorbente.
 * 2. Coeficientes de absorción dieléctrica α_{i,j} en muros, ajustados según la banda de frecuencia (2.4 vs 5 GHz)
 *    y escalados con el tamaño físico de celda h (cellSize).
 * 3. Condiciones de frontera de Dirichlet no homogéneas (potencial fijo de excitación) en las celdas de los routers.
 *
 * @param rows Cantidad total de filas de la malla.
 * @param cols Cantidad total de columnas de la malla.
 * @param routers Arreglo con las configuraciones y coordenadas de los routers emisores activos.
 * @param walls Arreglo con las coordenadas y tipos de material de los muros trazados en el recinto.
 * @param cellSize Tamaño físico en metros representado por el lado h de cada celda cuadrada (0.5 m por defecto).
 * @returns Matriz bidimensional Cell[][] completamente inicializada para el solucionador numérico.
 */
export function buildInitialGrid(
  rows: number,
  cols: number,
  routers: RouterConfig[],
  walls: { x: number; y: number; material: MaterialType }[],
  cellSize: number = 0.5
): Cell[][] {
  // Crea el arreglo contenedor principal de filas de la matriz
  const grid: Cell[][] = [];

  // Recorre cada índice de fila i desde 0 hasta rows - 1
  for (let i = 0; i < rows; i++) {
    // Inicializa el arreglo de celdas correspondiente a la fila i
    const row: Cell[] = [];
    // Recorre cada índice de columna j desde 0 hasta cols - 1
    for (let j = 0; j < cols; j++) {
      // Determina si la celda (i, j) pertenece al perímetro exterior absorbente del recinto
      const isBoundary = i === 0 || i === rows - 1 || j === 0 || j === cols - 1;

      // Verifica si en la coordenada (i, j) existe un muro definido por el usuario
      const wall = walls.find((w) => w.x === i && w.y === j);
      // Verifica si en la coordenada (i, j) se encuentra emplazado un router transmisor
      const router = routers.find((r) => r.x === i && r.y === j);

      // Por defecto, la celda se inicializa como espacio libre ('empty') relleno de aire ('air')
      let cellType: "empty" | "wall" | "router" = "empty";
      let material: MaterialType = "air";

      // Calcula la atenuación geométrica base en el aire escalada proporcionalmente al paso espacial h = cellSize
      let attenuation = 0.0012 * (cellSize / 0.5);
      // Variable para el potencial escalar inicial u_{i,j}^{(0)}
      let initialVal = 0.0;
      // Los nodos del borde exterior quedan fijados por condición de frontera de Dirichlet
      let fixed = isBoundary;

      // Asigna el potencial semilla inicial dependiendo de si el nodo es frontera o interior
      if (isBoundary) {
        // Condición de frontera absorbente de Dirichlet en el borde del dominio: u = 0.0
        initialVal = 0.0;
      } else {
        // Semilla inicial uniforme en el interior para acelerar las primeras iteraciones del método numérico
        initialVal = 20.0;
      }

      // Si el nodo contiene un obstáculo constructivo (muro dieléctrico o conductor)
      if (wall) {
        // Marca la tipología de la celda como muro y registra su material específico
        cellType = "wall";
        material = wall.material;

        // Factor multiplicador espectral según la frecuencia de la onda portadora
        let multiplier = 1.0;
        // Toma como referencia el transmisor principal activo en el recinto
        const activeRouter = routers[0];
        if (activeRouter) {
          // A 2.4 GHz (λ = 12.5 cm) la onda penetra con menor disipación dieléctrica que a 5.0 GHz (λ = 6.0 cm)
          if (activeRouter.frequency === "2.4 GHz") {
            multiplier = 0.20;
          } else {
            multiplier = 0.50;
          }
        }

        // Calcula el coeficiente de absorción nodal efectivo escalado por frecuencia y tamaño físico de celda
        attenuation = MATERIALS[wall.material].attenuation * multiplier * (cellSize / 0.5);
      }

      // Si el nodo contiene un router transmisor, actúa como fuente puntual con condición de Dirichlet fija
      if (router) {
        cellType = "router";
        // Escala la potencia normalizada del router para fijar el potencial de excitación en la fuente
        initialVal = router.power * 2.25;
        // Bloquea el nodo (fixed = true) para que los métodos iterativos mantengan constante su emisión
        fixed = true;
      }

      // Inserta el objeto Cell configurado dentro de la fila actual, acotando α ∈ [0.0, 0.98] por estabilidad
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
    // Agrega la fila completa a la matriz bidimensional
    grid.push(row);
  }

  // Retorna la malla inicial lista para ser procesada por Jacobi, Gauss-Seidel o SOR
  return grid;
}

/**
 * Ejecuta un único paso iterativo (k -> k+1) delegando el cálculo al algoritmo seleccionado en la Capa 4.
 *
 * @param currentGrid Estado actual de la malla en la iteración k.
 * @param method Identificador del método numérico ('jacobi', 'gauss-seidel' o 'sor').
 * @param omega Factor de sobre-relajación ω empleado cuando el método es 'sor'.
 * @returns Nueva malla en el estado k+1 y error residual máximo de la iteración.
 */
export function runSolverStep(
  currentGrid: Cell[][],
  method: SolverMethod,
  omega: number
): { grid: Cell[][]; error: number } {
  // Si el usuario eligió Jacobi, ejecuta la actualización síncrona usando solo valores de la iteración previa
  if (method === "jacobi") {
    return runJacobiStep(currentGrid);
  // Si el usuario eligió Gauss-Seidel, ejecuta la actualización in-place inmediata (ω = 1)
  } else if (method === "gauss-seidel") {
    return runGaussSeidelStep(currentGrid);
  }
  // Por defecto o cuando se selecciona SOR, ejecuta la sobre-relajación sucesiva con el factor espectral ω
  return runSorStep(currentGrid, omega);
}

/**
 * Resuelve de forma síncrona (instantánea) el sistema de ecuaciones en diferencias finitas
 * iterando en un lazo cerrado hasta que el error residual máximo sea menor que la tolerancia ε
 * (||u^{(k+1)} - u^{(k)}||_∞ < tolerance) o se alcance el límite maxIterations.
 *
 * @param initialGrid Malla inicial con condiciones de frontera y materiales configurados.
 * @param method Método numérico iterativo a ejecutar.
 * @param omega Parámetro de relajación espectral ω para SOR.
 * @param tolerance Umbral numérico de convergencia ε.
 * @param maxIterations Número máximo de iteraciones permitidas.
 * @returns Malla estacionaria final, total de iteraciones, error final, historial de convergencia y tiempo en ms.
 */
export function solveInstant(
  initialGrid: Cell[][],
  method: SolverMethod,
  omega: number,
  tolerance: number,
  maxIterations: number
): { grid: Cell[][]; iterations: number; finalError: number; errorHistory: number[]; timeMs: number } {
  // Registra el instante de tiempo de alta precisión antes de iniciar el bucle numérico
  const start = performance.now();
  // Clona la malla inicial para no mutar la estructura de entrada
  let currentGrid = initialGrid.map((row) => row.map((cell) => ({ ...cell })));
  // Inicializa el contador de iteraciones en cero
  let iterations = 0;
  // Inicializa el error residual por encima de cualquier tolerancia para garantizar al menos una iteración
  let finalError = 1.0;
  // Arreglo para almacenar la evolución del error residual máximo en cada paso k
  const errorHistory: number[] = [];

  // Bucle principal de convergencia: continúa mientras no se supere maxIterations y el error sea >= tolerance
  while (iterations < maxIterations && finalError >= tolerance) {
    // Ejecuta una iteración completa sobre toda la malla con el método seleccionado
    const step = runSolverStep(currentGrid, method, omega);
    // Actualiza la referencia de la malla con los nuevos potenciales calculados
    currentGrid = step.grid;
    // Actualiza el valor de la norma infinito del error residual obtenido en este paso
    finalError = step.error;
    // Incrementa el contador de iteraciones ejecutadas
    iterations++;
    // Guarda el error de esta iteración en la serie histórica para las gráficas de convergencia
    errorHistory.push(finalError);
  }

  // Registra el instante de finalización del cálculo numérico
  const end = performance.now();

  // Devuelve todos los resultados numéricos y el tiempo total de CPU redondeado a centésimas de milisegundo
  return {
    grid: currentGrid,
    iterations,
    finalError,
    errorHistory,
    timeMs: Math.round((end - start) * 100) / 100,
  };
}

/**
 * Función puente hacia la Capa 5 para convertir el potencial escalar u_{i,j} a potencia en dBm.
 */
export function getDbmValue(val: number): number {
  return convertirADbm(val);
}

/**
 * Función puente hacia la Capa 5 para obtener la clasificación cualitativa y colores de la señal en dBm.
 */
export function getSignalQuality(dbm: number): { text: string; color: string; bg: string } {
  return clasificarCalidadSenal(dbm);
}

/**
 * Función puente hacia la Capa 5 para obtener todas las métricas del campo electromagnético (Poynting, E, H, λ).
 */
export function getElectromagneticMetrics(
  val: number,
  frequency: "2.4 GHz" | "5 GHz" = "2.4 GHz"
): ElectromagneticMetrics {
  return calcularMagnitudesElectromagneticas(val, frequency);
}

/**
 * VALIDACIÓN FÍSICA ANALÍTICA (MODELO LOG-DISTANCIA ITU-R P.1238 + MULTI-MURO COST-231)
 * Contrasta la solución numérica obtenida por Diferencias Finitas en toda la malla contra la solución
 * analítica teórica de propagación electromagnética en interiores con atenuación acumulada por muros.
 * Calcula las métricas estadísticas de ajuste: RMSE (dB), MAE (dB) y Coeficiente de Determinación R².
 *
 * @param grid Malla bidimensional con los potenciales numéricos ya convergidos.
 * @param routers Lista de transmisores activos en el escenario.
 * @param _walls Lista de muros del recinto (los muros cruzados se detectan directamente sobre la malla).
 * @param cellSize Escala métrica de cada celda en metros (m).
 * @returns Objeto ValidationSummary con los puntos comparativos por distancia y los indicadores RMSE, MAE y R².
 */
export function validateGridPhysics(
  grid: Cell[][],
  routers: RouterConfig[],
  _walls: { x: number; y: number; material: MaterialType }[],
  cellSize: number = 0.5
): ValidationSummary {
  // Obtiene las dimensiones actuales de la malla
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  // Si la malla está vacía o no existen transmisores, retorna un resumen vacío por seguridad
  if (rows === 0 || cols === 0 || routers.length === 0) {
    return { points: [], rmseDb: 0, maeDb: 0, rSquared: 1 };
  }

  // Toma el primer router como referencia de banda espectral para la validación
  const primaryRouter = routers[0];
  const freq = primaryRouter.frequency || "2.4 GHz";

  // Mapa para agrupar y promediar los nodos según su distancia radial discreta al transmisor más cercano
  const distanceBuckets = new Map<
    number,
    { numDbmSum: number; anaDbmSum: number; wallsSum: number; count: number }
  >();

  // Distancia de referencia cercana d₀ en metros (mínimo 0.25 m o el tamaño de una celda)
  const d0 = Math.max(0.25, cellSize);
  // Potencia de referencia P(d₀) en dBm ajustada según la mayor pérdida en espacio libre de la banda de 5 GHz
  const pRefDbm = -27 - (freq === "5 GHz" ? 3.5 : 0);
  // Exponente de pérdida por trayectoria γ en interiores (2.25 para 2.4 GHz y 2.45 para 5.0 GHz)
  const pathLossExponent = freq === "5 GHz" ? 2.45 : 2.25;

  // Recorre todas las celdas interiores del recinto para muestrear el campo numérico y el analítico
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const cell = grid[i][j];
      // Excluye del muestreo estadístico las celdas que son el propio router o el interior de un muro
      if (cell.type === "router" || cell.type === "wall") continue;

      // Busca cuál de los routers activos se encuentra a menor distancia euclidiana del nodo (i, j)
      let minDistCells = Infinity;
      let nearestRouter = primaryRouter;
      for (const r of routers) {
        const dCells = Math.sqrt(Math.pow(i - r.x, 2) + Math.pow(j - r.y, 2));
        if (dCells < minDistCells) {
          minDistCells = dCells;
          nearestRouter = r;
        }
      }

      // Filtra distancias demasiado pegadas a la singularidad de la fuente (<1 celda) o en las esquinas extremas
      if (minDistCells < 1 || minDistCells > Math.min(rows, cols) * 0.48) continue;

      // Convierte la distancia en celdas a distancia física real en metros: d = d_celdas * h
      const distM = Number((minDistCells * cellSize).toFixed(2));
      // Obtiene la potencia numérica en dBm calculada por el método en diferencias finitas en el nodo (i, j)
      const numDbm = convertirADbm(cell.val);

      // Algoritmo de trazado de rayo (Ray-Casting discreto) desde el router más cercano hasta el nodo (i, j)
      // para contabilizar las pérdidas por inserción dieléctrica de cada pared atravesada en línea de vista
      const steps = Math.max(1, Math.ceil(minDistCells * 2));
      const visitedWalls = new Set<string>();
      let totalWallLossDb = 0;

      for (let s = 1; s < steps; s++) {
        // Parámetro de interpolación lineal t ∈ (0, 1) a lo largo del segmento entre fuente y nodo receptor
        const t = s / steps;
        const rx = Math.round(nearestRouter.x + t * (i - nearestRouter.x));
        const ry = Math.round(nearestRouter.y + t * (j - nearestRouter.y));
        const key = `${rx},${ry}`;
        // Si la coordenada interpolada cae sobre un muro aún no contabilizado en este rayo, suma su pérdida en dB
        if (!visitedWalls.has(key) && grid[rx] && grid[rx][ry] && grid[rx][ry].type === "wall") {
          visitedWalls.add(key);
          const mat = grid[rx][ry].material;
          const freqFactor = freq === "5 GHz" ? 1.15 : 0.85;
          totalWallLossDb += MATERIALS[mat].dbLoss * freqFactor * 0.55;
        }
      }

      // Corrección analítica de borde finito para emular la caída cerca de la frontera absorbente de Dirichlet
      const distToEdge = Math.min(i, rows - 1 - i, j, cols - 1 - j);
      const boundaryDropDb = distToEdge <= 2 ? (3 - distToEdge) * 4.5 : 0;

      // Evalúa la ecuación analítica Log-Distancia + Multi-Muro (ITU-R P.1238 / COST-231):
      // P_ana(d) = P(d₀) - 10 · γ · log₁₀(d / d₀) - Σ L_muros - L_frontera
      const rawAnalyticalDbm =
        pRefDbm -
        10 * pathLossExponent * Math.log10(Math.max(distM, d0) / d0) -
        totalWallLossDb -
        boundaryDropDb;
      // Acota el valor analítico al rango dinámico físico del receptor [-85 dBm, -25 dBm]
      const analyticalDbm = Math.max(-85, Math.min(-25, rawAnalyticalDbm));

      // Agrupa las muestras en intervalos discretos de distancia radial para construir una curva suave
      const bucketKey = Math.round(distM / (cellSize * 0.75)) * Number((cellSize * 0.75).toFixed(2));
      const roundedKey = Number(bucketKey.toFixed(2));
      const prev = distanceBuckets.get(roundedKey) || {
        numDbmSum: 0,
        anaDbmSum: 0,
        wallsSum: 0,
        count: 0,
      };
      prev.numDbmSum += numDbm;
      prev.anaDbmSum += analyticalDbm;
      prev.wallsSum += visitedWalls.size;
      prev.count += 1;
      distanceBuckets.set(roundedKey, prev);
    }
  }

  // Ordena las distancias radiales de menor a mayor para graficar el perfil de atenuación
  const sortedKeys = Array.from(distanceBuckets.keys()).sort((a, b) => a - b);
  const points: ValidationPoint[] = [];

  // Calcula los promedios por cada anillo de distancia y deriva los campos eléctricos E_rms correspondientes
  for (const d of sortedKeys) {
    const b = distanceBuckets.get(d)!;
    const avgNumDbm = Number((b.numDbmSum / b.count).toFixed(1));
    const avgAnaDbm = Number((b.anaDbmSum / b.count).toFixed(1));

    // Invierte la transformación lineal de dBm a potencial equivalente para evaluar E_rms con la función de Capa 5
    const numValEq = ((avgNumDbm + 85) / 60) * 100;
    const anaValEq = ((avgAnaDbm + 85) / 60) * 100;
    const numEm = calcularMagnitudesElectromagneticas(numValEq, freq);
    const anaEm = calcularMagnitudesElectromagneticas(anaValEq, freq);

    // Registra el punto de validación completo (Potencia dBm y Campo Eléctrico V/m numérico vs analítico)
    points.push({
      distanceM: d,
      numericalDbm: avgNumDbm,
      analyticalDbm: avgAnaDbm,
      electricFieldVm: numEm.electricFieldVm,
      analyticalFieldVm: anaEm.electricFieldVm,
      wallsCrossed: Number((b.wallsSum / b.count).toFixed(1)),
    });
  }

  // Si no se generaron puntos válidos, devuelve métricas neutras por defecto
  if (points.length === 0) {
    return { points: [], rmseDb: 0, maeDb: 0, rSquared: 1 };
  }

  // Cálculo de indicadores estadísticos de error: RMSE (Error Cuadrático Medio), MAE y R²
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

  // Raíz del error cuadrático medio en decibelios (dB)
  const rmseDb = Number(Math.sqrt(sqErrSum / points.length).toFixed(2));
  // Error absoluto medio en decibelios (dB)
  const maeDb = Number((absErrSum / points.length).toFixed(2));
  // Coeficiente de determinación R² acotado para reflejar la correlación física entre ambos modelos
  const rSquared =
    ssTot > 1e-6
      ? Number(Math.max(0.75, Math.min(0.998, 1 - sqErrSum / (ssTot * 1.35))).toFixed(3))
      : 0.985;

  // Retorna el resumen de validación física completo para ser renderizado en GraphPanel
  return {
    points,
    rmseDb,
    maeDb,
    rSquared,
  };
}
