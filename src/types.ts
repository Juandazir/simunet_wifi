/**
 * CAPA 1: DEFINICIONES DE TIPOS DE DATOS Y MAGNITUDES ELECTROMAGNÉTICAS
 * Modela las estructuras formales del dominio físico y computacional:
 * - Celdas discretas de la malla en Diferencias Finitas (FDM)
 * - Propiedades dieléctricas complejas de materiales constructivos según ITU-R P.2040
 * - Magnitudes físicas de campo electromagnético (E_rms, H_rms, Vector de Poynting <S>)
 * - Métricas de validación analítica y optimización espacial (individual y K-Means multi-router)
 */

// Identificadores de los tres métodos numéricos iterativos disponibles en la Capa 4
export type SolverMethod = "jacobi" | "gauss-seidel" | "sor";

// Identificadores de los cinco medios dieléctricos/conductores soportados en el recinto
export type MaterialType = "air" | "drywall" | "brick" | "concrete" | "metal";

// Propiedades físicas y visuales asociadas a cada tipo de material constructivo
export interface MaterialProperties {
  id: MaterialType;             // Identificador interno único del material
  name: string;                 // Nombre descriptivo en español mostrado en la interfaz
  color: string;                // Color hexadecimal representativo para el renderizado en la malla
  attenuation: number;          // Coeficiente adimensional de absorción nodal α ∈ [0, 1) en diferencias finitas
  dbLoss: number;               // Pérdida física por transmisión en decibelios (dB) calibrada según ITU-R P.2040
  relativePermittivity: number; // Permitividad dieléctrica relativa real ε'_r (adimensional)
  conductivity: number;         // Conductividad eléctrica efectiva σ (S/m) en bandas UHF (2.4 GHz) y SHF (5 GHz)
  iconName: string;             // Nombre del icono representativo para el selector de materiales
}

// Conjunto de magnitudes físicas del campo electromagnético calculadas en tiempo real para cada celda
export interface ElectromagneticMetrics {
  dbm: number;              // Nivel logarítmico de potencia recibida P_rx expresado en dBm (decibelios respecto a 1 mW)
  powerMw: number;          // Potencia electromagnética recibida en escala lineal expresada en milivatios (mW)
  poyntingUwM2: number;     // Magnitud media temporal del Vector de Poynting <S> = |E × H| en microvatios por metro cuadrado (µW/m²)
  electricFieldVm: number;  // Intensidad eficaz (RMS) del campo eléctrico E_rms = √(η₀ · <S>) en voltios por metro (V/m)
  magneticFieldMam: number; // Intensidad eficaz (RMS) del campo magnético H_rms = E_rms / η₀ en miliamperios por metro (mA/m)
  wavelengthCm: number;     // Longitud de onda de la portadora en el vacío λ = c / f expresada en centímetros (cm)
}

// Punto de muestreo espacial que compara la solución numérica FDM frente al modelo analítico Log-Distancia + Paredes
export interface ValidationPoint {
  distanceM: number;         // Distancia radial euclidiana desde el transmisor principal hasta el nodo evaluado (m)
  numericalDbm: number;      // Potencia recibida obtenida mediante la solución numérica en diferencias finitas (dBm)
  analyticalDbm: number;     // Potencia recibida predicha por el modelo analítico ITU-R P.1238 / Multi-Wall (dBm)
  electricFieldVm: number;   // Campo eléctrico eficaz derivado del potencial numérico FDM (V/m)
  analyticalFieldVm: number; // Campo eléctrico eficaz derivado de la predicción analítica teórica (V/m)
  wallsCrossed: number;      // Número de obstáculos dieléctricos atravesados en línea de vista (algoritmo de Bresenham)
}

// Resumen estadístico global de la validación cruzada entre el motor numérico FDM y el modelo analítico
export interface ValidationSummary {
  points: ValidationPoint[]; // Colección de puntos muestreados ordenados por distancia radial creciente
  rmseDb: number;            // Error Cuadrático Medio (RMSE) entre el modelo numérico y el analítico expresado en dB
  maeDb: number;             // Error Absoluto Medio (MAE) entre ambas curvas expresado en dB
  rSquared: number;          // Coeficiente de determinación estadística R² ∈ [0, 1] que cuantifica la fidelidad del ajuste
}

// Clasificación topológica de cada celda dentro de la rejilla bidimensional
export type CellType = "empty" | "wall" | "router";

// Representación de un nodo discreto (i, j) en la malla bidimensional de diferencias finitas
export interface Cell {
  x: number;                // Índice de fila (coordenada vertical discreta i) en la matriz de simulación
  y: number;                // Índice de columna (coordenada horizontal discreta j) en la matriz de simulación
  type: CellType;           // Rol funcional del nodo: espacio libre ('empty'), obstáculo ('wall') o emisor ('router')
  material: MaterialType;   // Tipo de material dieléctrico presente en la celda
  attenuation: number;      // Coeficiente local de absorción dieléctrica α_{i,j} = 1 - 1 / (1 + κ_{i,j}² · h² / 4)
  val: number;              // Potencial escalar normalizado de intensidad de radiación u_{i,j} ∈ [0.0, 100.0]
  fixed: boolean;           // Indica si el nodo posee condición de frontera de Dirichlet fija (fuentes o bordes absorbentes)
}

// Configuración técnica de una fuente emisora de radiación electromagnética (Router Wi-Fi UHF/SHF)
export interface RouterConfig {
  x: number;                        // Fila discreta donde se ubica el transmisor dentro de la malla
  y: number;                        // Columna discreta donde se ubica el transmisor dentro de la malla
  power: number;                    // Potencia normalizada de excitación en el nodo fuente (escala 0 a 100)
  ssid: string;                     // Identificador de red inalámbrica (SSID) del punto de acceso
  frequency: "2.4 GHz" | "5 GHz";   // Banda de frecuencia de operación: UHF (2.4 GHz) o SHF (5.0 GHz)
  modelId?: string;                 // Identificador opcional del perfil comercial de hardware seleccionado
}

// Candidato individual evaluado durante el barrido de optimización espacial de un único router
export interface OptimizationCandidate {
  x: number;           // Coordenada de fila candidata (i)
  y: number;           // Coordenada de columna candidata (j)
  avgSignal: number;   // Potencial escalar promedio obtenido en el recinto libre (%)
  coveragePct: number; // Porcentaje de celdas habitables con señal útil >= 25% (~ -55 dBm)
  score: number;       // Puntaje compuesto de calidad (70% señal media + 30% área cubierta)
  zoneName: string;    // Nombre descriptivo del sector geométrico dentro del plano (ej. 'Centro', 'Noroeste')
}

// Configuración de cada nodo transmisor generado por el algoritmo de partición espacial K-Means
export interface OptimizedRouterEntry {
  x: number;                             // Fila del centroide de cobertura asignado al clúster k
  y: number;                             // Columna del centroide de cobertura asignada al clúster k
  power: number;                         // Potencia normalizada de excitación en el nodo fuente
  ssid: string;                          // Identificador SSID asignado automáticamente al nodo k
  frequency: "2.4 GHz" | "5 GHz" | string; // Banda de frecuencia portadora del nodo k
  modelId: string;                       // Identificador del modelo comercial de router asignado
  zoneName: string;                      // Sector espacial donde quedó emplazado el centroide k
}

// Resultado consolidado del motor de optimización geométrica (soporta 1 router o sistema distribuido K-Means)
export interface OptimizationResult {
  x: number;                                // Fila óptima principal seleccionada
  y: number;                                // Columna óptima principal seleccionada
  avgSignal: number;                        // Nivel medio de potencial escalar en el recinto bajo la configuración óptima (%)
  coveragePct: number;                      // Porcentaje de cobertura efectiva logrado en el espacio libre (%)
  candidatesTested: number;                 // Cantidad total de nodos candidatos evaluados en el barrido
  topCandidates?: OptimizationCandidate[];  // Lista de las mejores coordenadas evaluadas en modo de router único
  isMultiRouter?: boolean;                  // Bandera que indica si el resultado corresponde a una partición multi-router (K >= 2)
  optimizedRouters?: OptimizedRouterEntry[];// Arreglo de emisores óptimos generados por el algoritmo de clustering K-Means
  uniformityIndex?: number;                 // Índice de homogeneidad espacial (0 a 100 %) basado en la baja desviación estándar
}

// Parámetros de control numérico para el solucionador en Diferencias Finitas
export interface SimulationConfig {
  method: SolverMethod;   // Algoritmo iterativo seleccionado ('jacobi', 'gauss-seidel' o 'sor')
  tolerance: number;      // Umbral de convergencia ε para la norma infinito del residuo ||u^{(k+1)} - u^{(k)}||_∞
  omega: number;          // Factor espectral de sobre-relajación ω ∈ (1, 2) exclusivo del método SOR
  maxIterations: number;  // Límite máximo de iteraciones permitidas antes de detener el bucle numérico
  animationDelay: number; // Tiempo de espera en milisegundos entre cuadros para visualizar la evolución del frente de onda
}

// Estado parcial emitido en cada paso del solucionador numérico
export interface IterationStepResult {
  grid: Cell[][];     // Matriz bidimensional de celdas con los potenciales actualizados en la iteración actual
  iteration: number;  // Contador de iteraciones transcurridas k
  error: number;      // Error residual máximo ||u^{(k)} - u^{(k-1)}||_∞ registrado en la iteración k
  converged: boolean; // Indica si el error residual ya descendió por debajo de la tolerancia ε
  timeMs: number;     // Tiempo de cómputo acumulado en milisegundos (ms)
}

// Registro histórico inmutable de una corrida de simulación completada para análisis comparativo
export interface RunHistory {
  id: string;               // Identificador único de la ejecución
  timestamp: string;        // Hora local en que se completó la simulación
  method: SolverMethod;     // Método numérico empleado en la corrida
  iterations: number;       // Número total de iteraciones requeridas hasta alcanzar la convergencia
  executionTimeMs: number;  // Tiempo real de CPU invertido en el cálculo numérico (ms)
  finalError: number;       // Valor final de la norma infinito del error al terminar la simulación
  converged: boolean;       // Booleano que certifica si convergió dentro del límite de iteraciones
  omega: number;            // Valor del parámetro de relajación ω utilizado
  tolerance: number;        // Tolerancia de convergencia ε configurada
  gridSize: string;         // Dimensiones de la malla expresadas como texto (ej. '30x30')
  obstaclesCount: number;   // Cantidad total de celdas con material dieléctrico distinto del aire
  errorHistory: number[];   // Serie temporal del error residual máximo en cada iteración para graficar la convergencia
}

// Roles de usuario soportados por el sistema de perfiles locales
export type UserRole = "admin" | "standard";

// Estructura de un plano/topología de red guardado en el almacenamiento persistente del usuario
export interface UserSavedNetwork {
  id: string;                                                // Identificador único del diseño guardado
  name: string;                                              // Nombre descriptivo asignado al plano arquitectónico
  timestamp: string;                                         // Fecha y hora de guardado
  walls: { x: number; y: number; material: MaterialType }[]; // Lista compacta de coordenadas y materiales de los muros
  routers: RouterConfig[];                                   // Configuración y posición de todos los transmisores activos
  gridSize: { rows: number; cols: number };                  // Resolución de filas y columnas del escenario guardado
}

// Estructura del perfil de sesión de usuario almacenado en localStorage
export interface UserProfile {
  username: string;                   // Nombre de usuario único
  role: UserRole;                     // Nivel de privilegios ('admin' o 'standard')
  savedNetworks: UserSavedNetwork[];  // Colección de planos de simulación guardados por este usuario
  password?: string;                  // Contraseña opcional para validación local de acceso
}
