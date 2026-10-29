// Importa React y los hooks de estado (useState), efectos secundarios (useEffect) y referencias mutables (useRef)
import React, { useState, useEffect, useRef } from "react";
// Importa las interfaces tipadas del dominio físico, numérico y de sesión de usuario desde la Capa 1
import {
  Cell,
  SolverMethod,
  MaterialType,
  RouterConfig,
  SimulationConfig,
  RunHistory,
  UserProfile,
  UserSavedNetwork,
  OptimizationResult,
} from "./types";
// Importa los controladores numéricos, validación analítica y catálogo de fuentes RF desde la Capa 2
import {
  buildInitialGrid,
  runSolverStep,
  solveInstant,
  getDbmValue,
  validateGridPhysics,
  ROUTER_MODELS,
  calcularPotenciaNormalizadaRouter,
} from "./controlador";
// Importa el componente de visualización interactiva de la malla bidimensional 2D
import NetworkGrid from "./components/NetworkGrid";
// Importa el panel lateral de controles físicos, herramientas de dibujo y parámetros numéricos
import ControlPanel from "./components/ControlPanel";
// Importa el panel de gráficas SVG de convergencia, validación analítica y tabla comparativa
import GraphPanel from "./components/GraphPanel";
// Importa los iconos vectoriales utilizados en la cabecera, portal de acceso, auditoría y modales
import {
  Signal,
  Sun,
  Moon,
  User,
  Lock,
  Shield,
  FileText,
  Save,
  Trash2,
  LogOut,
  FileCheck,
  BookOpen,
  GraduationCap,
  Printer,
} from "lucide-react";
// Importa los contenedores de animación declarativa para transiciones entre vistas y modales
import { motion, AnimatePresence } from "motion/react";

// Base de datos inicial preconfigurada de perfiles de usuario (Administrador y Estudiante de prueba)
const PRESET_PROFILES: UserProfile[] = [
  {
    // Cuenta administrativa preconfigurada con un escenario corporativo guardado
    username: "admin_pamplona",
    role: "admin",
    savedNetworks: [
      {
        id: "net_default_office",
        name: "Oficina Central de Telecomunicaciones - U Pamplona",
        timestamp: "03/06/2026, 12:00:00",
        walls: [
          { x: 5, y: 5, material: "concrete" },
          { x: 5, y: 6, material: "concrete" },
          { x: 5, y: 7, material: "concrete" },
          { x: 12, y: 5, material: "concrete" },
          { x: 12, y: 6, material: "concrete" },
          { x: 12, y: 7, material: "concrete" },
        ],
        routers: [
          { x: 10, y: 10, power: 100, ssid: "U_Pamplona_5G", frequency: "5 GHz" as const },
        ],
        gridSize: { rows: 16, cols: 16 },
      },
    ],
  },
  {
    // Cuenta estándar de estudiante para prácticas de laboratorio
    username: "estudiante_pamplona",
    role: "standard",
    savedNetworks: [],
  },
];

/**
 * CAPA 1: COMPONENTE PRINCIPAL DE INTERFAZ Y ORQUESTACIÓN GENERAL
 * Gestiona el estado global de la malla, el ciclo de vida de la animación iterativa,
 * el algoritmo de optimización espacial (1 router y K-Means multi-router), la gestión de sesiones
 * y la generación de reportes técnicos completos.
 */
export default function Interfaz() {
  // Estado reactivo del tema visual (oscuro por defecto para estética científica de laboratorio)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("simunet_dark_mode");
    return saved !== "false";
  });

  // Carga y persiste la lista de perfiles de usuario desde localStorage o usa los perfiles por defecto
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("simunet_user_profiles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_e) {
        return PRESET_PROFILES;
      }
    }
    return PRESET_PROFILES;
  });

  // Estado del usuario autenticado actualmente en la sesión activa
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const active = localStorage.getItem("simunet_active_user");
    if (active) {
      try {
        const cachedUser = JSON.parse(active);
        // Sincroniza con la lista de perfiles predefinidos si coincide el nombre de usuario
        const found = PRESET_PROFILES.find((p) => p.username === cachedUser.username);
        return found || cachedUser;
      } catch (_e) {
        return null;
      }
    }
    return null;
  });

  // Estados controlados para el formulario de inicio de sesión
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Estados controlados para el formulario de registro de nuevas cuentas
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerRole, setRegisterRole] = useState<"standard" | "admin">("standard");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");

  // Dimensiones discretas actuales de la malla de diferencias finitas (24×24 nodos por defecto)
  const [gridSize, setGridSize] = useState({ rows: 24, cols: 24 });

  // Lista reactiva de transmisores (routers) emplazados en el dominio con condición de Dirichlet fija
  const [routers, setRouters] = useState<RouterConfig[]>([
    { x: 12, y: 12, power: 100, ssid: "WiFi_U_Pamplona", frequency: "2.4 GHz" },
  ]);
  // Lista reactiva de obstáculos constructivos (muros dieléctricos/conductores) en la malla
  const [walls, setWalls] = useState<{ x: number; y: number; material: MaterialType }[]>([]);

  // Matriz bidimensional de nodos Cell[][] que almacena el potencial escalar u_{i,j} en cada punto
  const [grid, setGrid] = useState<Cell[][]>([]);

  // Parámetros numéricos del solucionador iterativo (método, tolerancia ε, factor ω, máx. iteraciones y retardo)
  const [config, setConfig] = useState<SimulationConfig>({
    method: "sor",
    tolerance: 0.001,
    omega: 1.25,
    maxIterations: 600,
    animationDelay: 10,
  });

  // Variables de telemetría en tiempo real del proceso iterativo
  const [isRunning, setIsRunning] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [currentError, setCurrentError] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [currentErrorHistory, setCurrentErrorHistory] = useState<number[]>([]);

  // Bitácora histórica de simulaciones completadas para comparación de métodos numéricos
  const [history, setHistory] = useState<RunHistory[]>([]);

  // Estados de interacción con las herramientas de edición sobre la malla
  const [selectedTool, setSelectedTool] = useState<"router" | MaterialType | "eraser" | "move">(
    "router"
  );
  const [draggedRouterIndex, setDraggedRouterIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showValues, setShowValues] = useState(false);

  // Estados del motor de optimización espacial de cobertura (Capa 6)
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  // Modelo comercial de router seleccionado en el catálogo y paso espacial h (metros por celda)
  const [selectedRouterModelId, setSelectedRouterModelId] = useState<string>("tplink");
  const [cellSize, setCellSize] = useState<number>(0.5);

  // Estados para guardar diseños personalizados en el perfil del usuario
  const [newNetworkName, setNewNetworkName] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Controla la visibilidad del modal de vista previa e impresión del informe técnico
  const [showReportModal, setShowReportModal] = useState(false);

  // Referencia mutable para medir con precisión (performance.now) el tiempo de CPU en modo animado
  const startTimeRef = useRef<number | null>(null);

  // Persiste cualquier cambio del modo oscuro/claro en el almacenamiento local del navegador
  useEffect(() => {
    localStorage.setItem("simunet_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  // Persiste la lista actualizada de perfiles de usuario en localStorage
  useEffect(() => {
    localStorage.setItem("simunet_user_profiles", JSON.stringify(profiles));
  }, [profiles]);

  // Sincroniza el usuario activo en localStorage para mantener la sesión abierta al recargar
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("simunet_active_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("simunet_active_user");
    }
  }, [currentUser]);

  // Actualiza automáticamente la potencia normalizada, SSID y frecuencia de los routers activos
  // cuando el usuario cambia el modelo comercial seleccionado en el catálogo
  useEffect(() => {
    const model = ROUTER_MODELS[selectedRouterModelId];
    if (model) {
      setRouters((prev) =>
        prev.map((r) => ({
          ...r,
          modelId: selectedRouterModelId,
          power: calcularPotenciaNormalizadaRouter(model),
          ssid: `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_"),
          frequency: model.frequency,
        }))
      );
    }
  }, [selectedRouterModelId]);

  // Reconstruye la malla e invoca el solucionador instantáneo cada vez que cambian las dimensiones,
  // la posición/frecuencia de los routers, los muros dieléctricos o la escala física de celda h
  useEffect(() => {
    const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize);
    const solved = solveInstant(
      initial,
      config.method,
      config.omega,
      config.tolerance,
      config.maxIterations
    );
    setGrid(solved.grid);
    setCurrentIteration(solved.iterations);
    setCurrentError(solved.finalError);
    setTimeMs(solved.timeMs);
    setIsConverged(solved.finalError < config.tolerance);
    setCurrentErrorHistory(solved.errorHistory);
  }, [gridSize, routers, walls, cellSize]);

  // Reinicia la malla a su estado semilla inicial (iteración 0) conservando muros y routers
  const rebuildGrid = () => {
    setIsRunning(false);
    const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize);
    setGrid(initial);
    setCurrentIteration(0);
    setCurrentError(0);
    setTimeMs(0);
    setIsConverged(false);
    setCurrentErrorHistory([]);
  };

  // Inicia la resolución animada paso a paso; si la malla ya había convergido, la reinicia a k = 0 primero
  const handleStartAnimation = () => {
    if (isConverged || (currentIteration > 0 && currentError < config.tolerance)) {
      const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize);
      setGrid(initial);
      setCurrentIteration(0);
      setCurrentError(0);
      setTimeMs(0);
      setIsConverged(false);
      setCurrentErrorHistory([]);
    }
    setIsRunning(true);
  };

  // Escala proporcionalmente las coordenadas de routers y muros cuando el usuario cambia la resolución N × N
  const handleGridSizeUpdate = (newSize: { rows: number; cols: number }) => {
    setIsRunning(false);
    const scaleR = newSize.rows / gridSize.rows;
    const scaleC = newSize.cols / gridSize.cols;
    setRouters((prev) =>
      prev.map((r) => ({
        ...r,
        x: Math.min(newSize.rows - 2, Math.max(1, Math.round(r.x * scaleR))),
        y: Math.min(newSize.cols - 2, Math.max(1, Math.round(r.y * scaleC))),
      }))
    );
    setWalls((prev) => {
      const seen = new Set<string>();
      const scaled: { x: number; y: number; material: MaterialType }[] = [];
      for (const w of prev) {
        const nx = Math.min(newSize.rows - 2, Math.max(1, Math.round(w.x * scaleR)));
        const ny = Math.min(newSize.cols - 2, Math.max(1, Math.round(w.y * scaleC)));
        const key = `${nx},${ny}`;
        if (!seen.has(key)) {
          seen.add(key);
          scaled.push({ x: nx, y: ny, material: w.material });
        }
      }
      return scaled;
    });
    setGridSize(newSize);
  };

  // CAPA 4: Bucle temporal que ejecuta iteración por iteración el método numérico en modo animado
  useEffect(() => {
    // Si la animación está detenida, limpia la referencia del cronómetro y sale del efecto
    if (!isRunning) {
      startTimeRef.current = null;
      return;
    }

    // Registra la marca de tiempo de inicio en la primera iteración animada
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    // Programa el siguiente paso iterativo según el retardo en milisegundos configurado por el usuario
    const timer = setTimeout(() => {
      // Ejecuta un paso (k -> k+1) del método seleccionado (Jacobi, Gauss-Seidel o SOR)
      const stepResult = runSolverStep(grid, config.method, config.omega);

      const newIteration = currentIteration + 1;
      const newError = stepResult.error;
      const elapsed = Math.round(performance.now() - (startTimeRef.current || 0));

      // Actualiza la malla y los indicadores de telemetría con los resultados del paso k+1
      setGrid(stepResult.grid);
      setCurrentIteration(newIteration);
      setCurrentError(newError);
      setTimeMs(elapsed);

      const updatedErrorHist = [...currentErrorHistory, newError];
      setCurrentErrorHistory(updatedErrorHist);

      // Comprueba el criterio de parada por convergencia (||r^{(k)}||_∞ < ε) o por límite de iteraciones
      const achievedConvergence = newError < config.tolerance;
      const hitLimit = newIteration >= config.maxIterations;

      // Si el sistema converge o alcanza el techo de iteraciones, detiene el bucle y guarda el registro en history
      if (achievedConvergence || hitLimit) {
        setIsRunning(false);
        setIsConverged(achievedConvergence);

        const runId = Math.random().toString();
        const newRun: RunHistory = {
          id: runId,
          timestamp: new Date().toLocaleTimeString(),
          method: config.method,
          iterations: newIteration,
          executionTimeMs: elapsed,
          finalError: newError,
          converged: achievedConvergence,
          omega: config.method === "sor" ? config.omega : 1.0,
          tolerance: config.tolerance,
          gridSize: `${gridSize.rows}x${gridSize.cols}`,
          obstaclesCount: walls.length,
          errorHistory: updatedErrorHist,
        };
        setHistory((prev) => [newRun, ...prev]);
      }
    }, config.animationDelay);

    // Limpia el temporizador pendiente si el componente se re-renderiza o se pausa
    return () => clearTimeout(timer);
  }, [isRunning, grid, currentIteration, config, currentErrorHistory, gridSize, walls.length]);

  // Pinta o elimina elementos (routers, muros dieléctricos o aire) sobre la coordenada discreta (x, y)
  const handleCellPaint = (x: number, y: number) => {
    // Protege el anillo exterior de la malla donde rige la condición de frontera absorbente de Dirichlet (u = 0)
    if (x === 0 || x === gridSize.rows - 1 || y === 0 || y === gridSize.cols - 1) return;

    if (selectedTool === "router") {
      // Crea un nuevo punto de acceso con las especificaciones de radiofrecuencia del perfil activo
      const model = ROUTER_MODELS[selectedRouterModelId];
      const newRouter: RouterConfig = {
        x,
        y,
        power: calcularPotenciaNormalizadaRouter(model),
        ssid: `${model.brand}_${model.model}_${routers.length + 1}`.replace(/[\s\-\.]+/g, "_"),
        frequency: model.frequency,
        modelId: selectedRouterModelId,
      };
      // Elimina cualquier muro previo que ocupara la misma coordenada antes de emplazar el router
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setRouters((prev) => {
        const filtered = prev.filter((r) => !(r.x === x && r.y === y));
        return [...filtered, newRouter];
      });
    } else if (selectedTool === "eraser") {
      // El borrador restablece el nodo (x, y) a espacio libre (aire), removiendo muros o routers
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setRouters((prev) => prev.filter((r) => !(r.x === x && r.y === y)));
    } else if (selectedTool !== "move") {
      // Si la herramienta es un material constructivo ('drywall', 'brick', 'concrete' o 'metal'), coloca un muro
      const filteredWalls = walls.filter((w) => !(w.x === x && w.y === y));
      setRouters((prev) => prev.filter((r) => !(r.x === x && r.y === y)));
      setWalls([...filteredWalls, { x, y, material: selectedTool }]);
    }
  };

  // Manejador del evento onMouseDown al presionar el botón izquierdo sobre una celda de la malla
  const handleCellMouseDown = (x: number, y: number) => {
    if (selectedTool === "move") {
      // Con la herramienta 'Mover', verifica si el usuario hizo clic sobre un router existente para arrastrarlo
      const routerIdx = routers.findIndex((r) => r.x === x && r.y === y);
      if (routerIdx !== -1) {
        setDraggedRouterIndex(routerIdx);
        setIsDrawing(true);
      }
    } else {
      // Con cualquier pincel de dibujo o borrador, activa el trazo continuo y pinta la celda inicial
      setIsDrawing(true);
      handleCellPaint(x, y);
    }
  };

  // Manejador del evento onMouseEnter al deslizar el cursor sobre las celdas manteniendo presionado el ratón
  const handleCellMouseEnter = (x: number, y: number) => {
    if (selectedTool === "move") {
      if (isDrawing && draggedRouterIndex !== null) {
        // Impide arrastrar el router hacia los nodos perimetrales de frontera de Dirichlet
        if (x === 0 || x === gridSize.rows - 1 || y === 0 || y === gridSize.cols - 1) return;

        // Impide superponer dos routers distintos en exactamente la misma celda
        const isOccupiedByOther = routers.some(
          (r, idx) => idx !== draggedRouterIndex && r.x === x && r.y === y
        );
        if (isOccupiedByOther) return;

        // Actualiza en vivo las coordenadas del router arrastrado
        const updatedRouters = routers.map((r, idx) => {
          if (idx === draggedRouterIndex) {
            return { ...r, x, y };
          }
          return r;
        });

        setRouters(updatedRouters);
        // Si la nueva posición tenía un muro, lo despeja automáticamente
        const filteredWalls = walls.filter((w) => !(w.x === x && w.y === y));
        setWalls(filteredWalls);

        // Ejecuta una resolución rápida (25 iteraciones) para previsualizar el desplazamiento del campo en tiempo real
        const initial = buildInitialGrid(
          gridSize.rows,
          gridSize.cols,
          updatedRouters,
          filteredWalls,
          cellSize
        );
        const result = solveInstant(initial, config.method, config.omega, config.tolerance, 25);
        setGrid(result.grid);
      }
    } else {
      // Si se está dibujando con un pincel de material o borrador, aplica la acción en la celda actual
      if (isDrawing) {
        handleCellPaint(x, y);
      }
    }
  };

  // Manejador del evento onMouseUp al soltar el clic del ratón en cualquier parte de la ventana
  const handleCellMouseUp = () => {
    if (selectedTool === "move" && draggedRouterIndex !== null) {
      // Al terminar de mover un router, reinicia la malla y lanza la animación de propagación de onda
      setIsRunning(false);

      const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize);
      setGrid(initial);
      setCurrentIteration(0);
      setCurrentError(0);
      setTimeMs(0);
      setIsConverged(false);
      setCurrentErrorHistory([]);

      setTimeout(() => {
        setIsRunning(true);
      }, 50);

      setDraggedRouterIndex(null);
    }
    setIsDrawing(false);
  };

  // Carga uno de los tres escenarios geométricos predefinidos ('empty', 'office' o 'metal-cage')
  const handleLoadPreset = (presetName: string) => {
    setIsRunning(false);
    const model = ROUTER_MODELS[selectedRouterModelId];
    const centerR = Math.floor(gridSize.rows / 2);
    const centerC = Math.floor(gridSize.cols / 2);
    const scaleR = gridSize.rows / 24;
    const scaleC = gridSize.cols / 24;
    // Función auxiliar que escala coordenadas base de 24×24 al tamaño actual de la malla
    const scaleCoord = (r: number, c: number) => ({
      x: Math.min(gridSize.rows - 2, Math.max(1, Math.round(r * scaleR))),
      y: Math.min(gridSize.cols - 2, Math.max(1, Math.round(c * scaleC))),
    });

    // Configura el router base centrado con la potencia normalizada del modelo comercial activo
    const initialRouter: RouterConfig = {
      x: centerR,
      y: centerC,
      power: calcularPotenciaNormalizadaRouter(model),
      ssid: `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_"),
      frequency: model.frequency,
      modelId: selectedRouterModelId,
    };

    if (presetName === "empty") {
      // Escenario 1: Recinto en espacio libre sin obstáculos internos (solo atenuación geométrica del aire)
      setWalls([]);
      setRouters([initialRouter]);
    } else if (presetName === "office") {
      // Escenario 2: Planta de oficinas corporativas con divisiones de concreto y vanos de puertas
      const baseWalls: { x: number; y: number; material: MaterialType }[] = [];
      for (let i = 2; i < 22; i++) {
        if (i !== 7 && i !== 8 && i !== 15 && i !== 16) {
          baseWalls.push({ x: i, y: 11, material: "concrete" });
        }
      }
      for (let j = 2; j < 11; j++) {
        if (j !== 5) {
          baseWalls.push({ x: 8, y: j, material: "concrete" });
          baseWalls.push({ x: 15, y: j, material: "concrete" });
        }
      }
      for (let j = 12; j < 22; j++) {
        if (j !== 17) {
          baseWalls.push({ x: 10, y: j, material: "concrete" });
          baseWalls.push({ x: 18, y: j, material: "concrete" });
        }
      }
      const seen = new Set<string>();
      const officeWalls: { x: number; y: number; material: MaterialType }[] = [];
      for (const w of baseWalls) {
        const sc = scaleCoord(w.x, w.y);
        const key = `${sc.x},${sc.y}`;
        if (!seen.has(key)) {
          seen.add(key);
          officeWalls.push({ x: sc.x, y: sc.y, material: w.material });
        }
      }
      const rPos = scaleCoord(4, 4);
      setWalls(officeWalls);
      setRouters([{ ...initialRouter, x: rPos.x, y: rPos.y }]);
    } else if (presetName === "metal-cage") {
      // Escenario 3: Jaula de Faraday (cerramiento conductor metálico que apantalla la radiación exterior)
      const cageWalls: { x: number; y: number; material: MaterialType }[] = [];
      const minR = Math.max(2, Math.round(6 * scaleR));
      const maxR = Math.min(gridSize.rows - 3, Math.round(17 * scaleR));
      const minC = Math.max(2, Math.round(6 * scaleC));
      const maxC = Math.min(gridSize.cols - 3, Math.round(17 * scaleC));
      for (let i = minR; i <= maxR; i++) {
        cageWalls.push({ x: i, y: minC, material: "metal" });
        cageWalls.push({ x: i, y: maxC, material: "metal" });
      }
      for (let j = minC + 1; j <= maxC - 1; j++) {
        cageWalls.push({ x: minR, y: j, material: "metal" });
        cageWalls.push({ x: maxR, y: j, material: "metal" });
      }
      setWalls(cageWalls);
      setRouters([initialRouter]);
    }
  };

  // Resuelve de inmediato el estado estacionario de la malla con el método activo y registra la corrida en history
  const handleSolveInstant = () => {
    setIsRunning(false);
    const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize);
    const result = solveInstant(
      initial,
      config.method,
      config.omega,
      config.tolerance,
      config.maxIterations
    );

    setGrid(result.grid);
    setCurrentIteration(result.iterations);
    setCurrentError(result.finalError);
    setTimeMs(result.timeMs);
    setIsConverged(result.finalError < config.tolerance);
    setCurrentErrorHistory(result.errorHistory);

    const runId = Math.random().toString();
    const newRun: RunHistory = {
      id: runId,
      timestamp: new Date().toLocaleTimeString(),
      method: config.method,
      iterations: result.iterations,
      executionTimeMs: result.timeMs,
      finalError: result.finalError,
      converged: result.finalError < config.tolerance,
      omega: config.method === "sor" ? config.omega : 1.0,
      tolerance: config.tolerance,
      gridSize: `${gridSize.rows}x${gridSize.cols}`,
      obstaclesCount: walls.length,
      errorHistory: result.errorHistory,
    };
    setHistory((prev) => [newRun, ...prev]);
  };

  // Ejecuta secuencialmente Jacobi, Gauss-Seidel y SOR sobre la misma malla para comparar iteraciones y tiempos de CPU
  const handleCompareMethods = () => {
    setIsRunning(false);
    const methodsToCompare: Array<{ method: SolverMethod; omega: number }> = [
      { method: "jacobi", omega: 1.0 },
      { method: "gauss-seidel", omega: 1.0 },
      { method: "sor", omega: config.omega > 1.05 ? config.omega : 1.35 },
    ];

    const newRuns: RunHistory[] = [];
    let bestResult = null;

    for (const item of methodsToCompare) {
      const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize);
      const res = solveInstant(
        initial,
        item.method,
        item.omega,
        config.tolerance,
        config.maxIterations
      );
      newRuns.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        method: item.method,
        iterations: res.iterations,
        executionTimeMs: res.timeMs,
        finalError: res.finalError,
        converged: res.finalError < config.tolerance,
        omega: item.omega,
        tolerance: config.tolerance,
        gridSize: `${gridSize.rows}x${gridSize.cols}`,
        obstaclesCount: walls.length,
        errorHistory: res.errorHistory,
      });
      if (item.method === "sor") {
        bestResult = res;
      }
    }

    if (bestResult) {
      setGrid(bestResult.grid);
      setCurrentIteration(bestResult.iterations);
      setCurrentError(bestResult.finalError);
      setTimeMs(bestResult.timeMs);
      setIsConverged(bestResult.finalError < config.tolerance);
      setCurrentErrorHistory(bestResult.errorHistory);
    }

    setHistory((prev) => [...newRuns.reverse(), ...prev]);
  };

  // Avanza manualmente una sola iteración (k -> k+1) para inspección pedagógica del método numérico
  const handleSingleStep = () => {
    setIsRunning(false);
    const stepResult = runSolverStep(grid, config.method, config.omega);
    setGrid(stepResult.grid);
    setCurrentIteration((prev) => prev + 1);
    setCurrentError(stepResult.error);
    setIsConverged(stepResult.error < config.tolerance);
    setCurrentErrorHistory((prev) => [...prev, stepResult.error]);
  };

  // CAPA 6: MOTOR DE OPTIMIZACIÓN ESPACIAL DE UBICACIÓN DE ENRUTADORES (Búsqueda Submuestreada y K-Means)
  const findBestRouterLocation = (targetCount?: number) => {
    setIsOptimizing(true);
    setOptimizationResult(null);

    setTimeout(() => {
      const rows = gridSize.rows;
      const cols = gridSize.cols;

      const numRoutersToOptimize =
        targetCount !== undefined ? targetCount : routers.length > 0 ? routers.length : 1;

      const model = ROUTER_MODELS[selectedRouterModelId];
      const routerPower = model ? calcularPotenciaNormalizadaRouter(model) : 100;
      const routerSsid = model
        ? `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_")
        : "WiFi_Optimizado";
      const routerFreq = model ? model.frequency : "2.4 GHz";

      // Clasifica geométricamente una coordenada (r, c) según su sector cardinal dentro del recinto
      const getZoneLabel = (r: number, c: number) => {
        const pctR = r / rows;
        const pctC = c / cols;
        const vert = pctR < 0.35 ? "Norte" : pctR > 0.65 ? "Sur" : "Centro";
        const horiz = pctC < 0.35 ? "Oeste" : pctC > 0.65 ? "Este" : "Centro";
        if (vert === "Centro" && horiz === "Centro") return "Zona Central";
        return `Zona ${vert}-${horiz}`;
      };

      if (numRoutersToOptimize === 1) {
        // MODO 1 ROUTER: Barrido sobre rejilla submuestreada evaluando la solución FDM para cada nodo candidato
        const step = rows <= 15 ? 1 : rows <= 25 ? 2 : 3;
        const candidatesList: Array<{
          x: number;
          y: number;
          avgSignal: number;
          coveragePct: number;
          score: number;
          zoneName: string;
        }> = [];

        for (let r = 2; r < rows - 2; r += step) {
          for (let c = 2; c < cols - 2; c += step) {
            const isWall = walls.some((w) => w.x === r && w.y === c);
            if (isWall) continue;

            const tempRouters: RouterConfig[] = [
              {
                x: r,
                y: c,
                power: routerPower,
                ssid: routerSsid,
                frequency: routerFreq,
                modelId: selectedRouterModelId,
              },
            ];

            // Resuelve el campo estacionario con SOR para medir señal media y cobertura útil de este candidato
            const tempInitialGrid = buildInitialGrid(rows, cols, tempRouters, walls, cellSize);
            const solveResult = solveInstant(tempInitialGrid, "sor", 1.25, 0.01, 25);

            let cellValsSum = 0;
            let coveredCellsCount = 0;
            let activeCellsCount = 0;

            for (let i = 1; i < rows - 1; i++) {
              for (let j = 1; j < cols - 1; j++) {
                const testCell = solveResult.grid[i][j];
                if (testCell.type !== "wall") {
                  activeCellsCount++;
                  cellValsSum += testCell.val;
                  if (testCell.val >= 25) {
                    coveredCellsCount++;
                  }
                }
              }
            }

            if (activeCellsCount === 0) activeCellsCount = 1;
            const avgSignal = cellValsSum / activeCellsCount;
            const coveragePct = (coveredCellsCount / activeCellsCount) * 100;

            // Función objetivo compuesta: 70% intensidad media del campo + 30% porcentaje de área cubierta
            const score = avgSignal * 0.7 + coveragePct * 0.3;

            candidatesList.push({
              x: r,
              y: c,
              avgSignal: Math.round(avgSignal),
              coveragePct: Math.round(coveragePct),
              score: score,
              zoneName: getZoneLabel(r, c),
            });
          }
        }

        // Ordena de mayor a menor puntaje global
        candidatesList.sort((a, b) => b.score - a.score);

        if (candidatesList.length === 0) {
          setIsOptimizing(false);
          return;
        }

        const best = candidatesList[0];

        // Filtra las mejores opciones asegurando separación espacial mínima (distancia Manhattan >= 4 celdas)
        const topCandidates: typeof candidatesList = [];
        for (const cand of candidatesList) {
          const tooClose = topCandidates.some(
            (existing) => Math.abs(existing.x - cand.x) + Math.abs(existing.y - cand.y) < 4
          );
          if (!tooClose) {
            topCandidates.push(cand);
          }
          if (topCandidates.length >= 4) {
            break;
          }
        }

        setOptimizationResult({
          x: best.x,
          y: best.y,
          avgSignal: best.avgSignal,
          coveragePct: best.coveragePct,
          candidatesTested: candidatesList.length,
          topCandidates: topCandidates,
          isMultiRouter: false,
        });
        setIsOptimizing(false);
      } else {
        // MODO MULTI-ROUTER (K >= 2): Algoritmo de partición espacial de Voronoi / K-Means (iteración de Lloyd)
        // 1. Recolecta todas las celdas interiores libres de obstáculos (aire habitable)
        const freeCells: Array<{ r: number; c: number }> = [];
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 1; c < cols - 1; c++) {
            const isWall = walls.some((w) => w.x === r && w.y === c);
            if (!isWall) {
              freeCells.push({ r, c });
            }
          }
        }

        if (freeCells.length === 0) {
          setIsOptimizing(false);
          return;
        }

        // 2. Inicializa K centroides equiespaciados sobre el conjunto de celdas habitables
        const centroids: Array<{ r: number; c: number }> = [];
        for (let i = 0; i < numRoutersToOptimize; i++) {
          const idx = Math.floor((i + 0.5) * (freeCells.length / numRoutersToOptimize));
          centroids.push({ ...freeCells[idx] });
        }

        // 3. Ejecuta 40 iteraciones del algoritmo de Lloyd para converger a los centros geométricos de masa
        for (let iter = 0; iter < 40; iter++) {
          const clusters: Array<Array<{ r: number; c: number }>> = Array.from(
            { length: numRoutersToOptimize },
            () => []
          );

          // Asigna cada celda libre al centroide con menor distancia euclidiana al cuadrado
          for (const p of freeCells) {
            let minDist = Infinity;
            let bestIdx = 0;
            for (let i = 0; i < numRoutersToOptimize; i++) {
              const dx = p.r - centroids[i].r;
              const dy = p.c - centroids[i].c;
              const dist = dx * dx + dy * dy;
              if (dist < minDist) {
                minDist = dist;
                bestIdx = i;
              }
            }
            clusters[bestIdx].push(p);
          }

          // Recalcula cada centroide como la media aritmética de las coordenadas de su clúster
          for (let i = 0; i < numRoutersToOptimize; i++) {
            const cls = clusters[i];
            if (cls.length > 0) {
              let sumR = 0;
              let sumC = 0;
              for (const p of cls) {
                sumR += p.r;
                sumC += p.c;
              }
              centroids[i] = {
                r: Math.round(sumR / cls.length),
                c: Math.round(sumC / cls.length),
              };
            }
          }
        }

        // 4. Verifica que ningún centroide haya caído sobre un muro; si ocurre, lo desplaza a la celda libre más próxima
        const finalPositions: Array<{ r: number; c: number }> = [];
        for (let i = 0; i < numRoutersToOptimize; i++) {
          const cent = centroids[i];
          const isWall = walls.some((w) => w.x === cent.r && w.y === cent.c);
          if (!isWall) {
            finalPositions.push(cent);
          } else {
            let bestFreeCell = freeCells[0];
            let minDist = Infinity;
            for (const p of freeCells) {
              const dx = p.r - cent.r;
              const dy = p.c - cent.c;
              const dist = dx * dx + dy * dy;
              const alreadySelected = finalPositions.some((fp) => fp.r === p.r && fp.c === p.c);
              if (dist < minDist && !alreadySelected) {
                minDist = dist;
                bestFreeCell = p;
              }
            }
            finalPositions.push(bestFreeCell);
          }
        }

        // 5. Construye el arreglo de configuraciones de routers para los K centroides óptimos
        const optRouters = finalPositions.map((p, idx) => {
          const suffixNum = idx + 1;
          const optRouterName = model
            ? `${model.brand}_${model.model}_${suffixNum}`.replace(/[\s\-\.]+/g, "_")
            : `WiFi_Opt_${suffixNum}`;
          return {
            x: p.r,
            y: p.c,
            power: routerPower,
            ssid: optRouterName,
            frequency: routerFreq,
            modelId: selectedRouterModelId,
            zoneName: getZoneLabel(p.r, p.c),
          };
        });

        // 6. Resuelve la malla multifuente con SOR para cuantificar cobertura total e Índice de Uniformidad (I.U.)
        const tempGrid = buildInitialGrid(rows, cols, optRouters, walls, cellSize);
        const solveResult = solveInstant(tempGrid, "sor", 1.25, 0.01, 35);

        let cellValsSum = 0;
        let coveredCellsCount = 0;
        let activeCellsCount = 0;
        const activeVals: number[] = [];

        for (let i = 1; i < rows - 1; i++) {
          for (let j = 1; j < cols - 1; j++) {
            const testCell = solveResult.grid[i][j];
            if (testCell.type !== "wall") {
              activeCellsCount++;
              cellValsSum += testCell.val;
              activeVals.push(testCell.val);
              if (testCell.val >= 25) {
                coveredCellsCount++;
              }
            }
          }
        }

        if (activeCellsCount === 0) activeCellsCount = 1;
        const avgSignal = cellValsSum / activeCellsCount;
        const coveragePct = (coveredCellsCount / activeCellsCount) * 100;

        // Calcula la desviación estándar espacial del potencial para determinar la homogeneidad del campo
        let varSum = 0;
        for (const v of activeVals) {
          varSum += Math.pow(v - avgSignal, 2);
        }
        const stdDev = activeVals.length > 1 ? Math.sqrt(varSum / (activeVals.length - 1)) : 0;
        const uniformityIndex = Math.max(10, Math.min(100, Math.round(100 - stdDev * 1.6)));

        setOptimizationResult({
          x: optRouters[0].x,
          y: optRouters[0].y,
          avgSignal: Math.round(avgSignal),
          coveragePct: Math.round(coveragePct),
          candidatesTested: freeCells.length,
          isMultiRouter: true,
          optimizedRouters: optRouters,
          uniformityIndex: uniformityIndex,
        });
        setIsOptimizing(false);
      }
    }, 1500);
  };

  // Aplica en el dominio activo la posición óptima (individual o sistema distribuido K-Means) y resuelve el campo
  const applyBestRouterLocation = (customX?: number, customY?: number) => {
    if (!optimizationResult) return;

    let finalRouters: RouterConfig[] = [];

    if (optimizationResult.isMultiRouter && optimizationResult.optimizedRouters) {
      finalRouters = optimizationResult.optimizedRouters.map((r) => ({
        x: r.x,
        y: r.y,
        power: r.power,
        ssid: r.ssid,
        frequency: r.frequency as "2.4 GHz" | "5 GHz",
        modelId: r.modelId,
      }));
    } else {
      const model = ROUTER_MODELS[selectedRouterModelId];
      const routerPower = model ? calcularPotenciaNormalizadaRouter(model) : 100;
      const routerSsid = model
        ? `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_")
        : "WiFi_Optimizado";
      const routerFreq = model ? model.frequency : "2.4 GHz";

      const finalX = customX !== undefined ? customX : optimizationResult.x;
      const finalY = customY !== undefined ? customY : optimizationResult.y;

      finalRouters = [
        {
          x: finalX,
          y: finalY,
          power: routerPower,
          ssid: routerSsid,
          frequency: routerFreq as "2.4 GHz" | "5 GHz",
          modelId: selectedRouterModelId,
        },
      ];
    }

    setRouters(finalRouters);

    // Resuelve inmediatamente la nueva configuración de fuentes para actualizar el mapa de calor y las gráficas
    const initial = buildInitialGrid(gridSize.rows, gridSize.cols, finalRouters, walls, cellSize);
    const result = solveInstant(
      initial,
      config.method,
      config.omega,
      config.tolerance,
      config.maxIterations
    );

    setGrid(result.grid);
    setCurrentIteration(result.iterations);
    setCurrentError(result.finalError);
    setTimeMs(result.timeMs);
    setIsConverged(result.finalError < config.tolerance);
    setCurrentErrorHistory(result.errorHistory);
    setOptimizationResult(null);
  };

  // Manejador de autenticación de usuario existente en el portal académico
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginUsername.trim()) {
      setLoginError("Por favor ingrese un nombre de usuario.");
      return;
    }

    const cleanUsername = loginUsername.trim().toLowerCase();

    // Busca el perfil en la base de datos local de usuarios registrados
    const profile = profiles.find((p) => p.username === cleanUsername);

    if (!profile) {
      setLoginError(
        "El usuario ingresado no está registrado en el portal. Seleccione 'Registrarse' si es una cuenta nueva."
      );
      return;
    }

    // Verifica la contraseña para la cuenta administrativa por defecto o cuentas con clave configurada
    if (cleanUsername === "admin_pamplona") {
      if (loginPassword !== "admin123") {
        setLoginError("Contraseña de administrador incorrecta. Ingrese 'admin123'.");
        return;
      }
    } else if (profile.password) {
      if (loginPassword !== profile.password) {
        setLoginError("Contraseña incorrecta para este código o usuario de red.");
        return;
      }
    }

    setCurrentUser(profile);
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
  };

  // Manejador de registro de una nueva cuenta de estudiante o administrador
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setRegisterSuccessMsg("");

    if (!registerUsername.trim()) {
      setLoginError("Por favor ingrese un nombre de usuario.");
      return;
    }

    const cleanUsername = registerUsername.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      setLoginError("El nombre de usuario debe contener al menos 3 caracteres.");
      return;
    }

    // Verifica que el identificador de usuario no esté duplicado
    const alreadyExists = profiles.some((p) => p.username === cleanUsername);

    if (alreadyExists) {
      setLoginError(
        "El usuario o código ingresado ya está registrado por otro estudiante o administrador."
      );
      return;
    }

    // Crea el nuevo perfil de usuario con su lista de redes inicialmente vacía
    const newProf: UserProfile = {
      username: cleanUsername,
      role: registerRole,
      password: registerPassword.trim(),
      savedNetworks: [],
    };

    setProfiles((prev) => [...prev, newProf]);
    setRegisterSuccessMsg(
      `¡Registro Exitoso! Bienvenido ${cleanUsername}. Iniciando sesión y configurando entorno...`
    );

    // Inicia sesión automáticamente tras una breve pausa de confirmación
    setTimeout(() => {
      setCurrentUser(newProf);
      setRegisterUsername("");
      setRegisterPassword("");
      setRegisterRole("standard");
      setRegisterSuccessMsg("");
      setIsRegisterMode(false);
    }, 1800);
  };

  // Cierra la sesión activa y detiene cualquier bucle de simulación en curso
  const handleLogout = () => {
    setIsRunning(false);
    setCurrentUser(null);
  };

  // Guarda el plano actual (muros, routers y dimensiones de malla) dentro del perfil del usuario activo
  const handleSaveNetworkDesign = () => {
    if (!currentUser) return;
    if (!newNetworkName.trim()) {
      alert("Ingrese un nombre válido para guardar el diseño.");
      return;
    }

    const designId = "net_" + Math.random().toString();
    const newDesign: UserSavedNetwork = {
      id: designId,
      name: newNetworkName.trim(),
      timestamp: new Date().toLocaleString(),
      walls: [...walls],
      routers: [...routers],
      gridSize: { ...gridSize },
    };

    const updatedUser = {
      ...currentUser,
      savedNetworks: [...currentUser.savedNetworks, newDesign],
    };

    setCurrentUser(updatedUser);
    setProfiles((prev) =>
      prev.map((p) => (p.username === currentUser.username ? updatedUser : p))
    );
    setNewNetworkName("");
    setSaveSuccessMsg("¡Diseño de cobertura guardado exitosamente!");
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  // Restaura un plano previamente guardado por el usuario
  const handleLoadUserNetwork = (savedNet: UserSavedNetwork) => {
    setIsRunning(false);
    setGridSize(savedNet.gridSize);
    setWalls(savedNet.walls);
    setRouters(savedNet.routers);
  };

  // Elimina un plano guardado de la biblioteca personal del usuario
  const handleDeleteUserNetwork = (designId: string) => {
    if (!currentUser) return;
    const updatedNetworks = currentUser.savedNetworks.filter((n) => n.id !== designId);
    const updatedUser = {
      ...currentUser,
      savedNetworks: updatedNetworks,
    };
    setCurrentUser(updatedUser);
    setProfiles((prev) =>
      prev.map((p) => (p.username === currentUser.username ? updatedUser : p))
    );
  };

  // Genera el dictamen técnico resumido para el modal de auditoría e impresión PDF
  const generateReportAnalysisText = () => {
    if (history.length === 0) {
      return "No se registran simulaciones finalizadas en esta sesión para elaborar el dictamen técnico comparativo de algoritmos.";
    }

    const optimalRun = [...history].sort((a, b) => a.executionTimeMs - b.executionTimeMs)[0];
    const wallsCount = walls.length;

    return (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          En base a {history.length} simulaciones numéricas efectuadas sobre un dominio
          bidimensional de {gridSize.rows}&times;{gridSize.cols} ({gridSize.rows * gridSize.cols}{" "}
          nodos discretizados), se evaluó la distribución estacionaria del campo electromagnético y
          la tasa de atenuación dieléctrica.
        </p>
        <p>
          El método de Sobre-Relajación Sucesiva (<strong>SOR</strong>) resolvió la malla en{" "}
          {optimalRun.iterations} iteraciones con un tiempo de cómputo de{" "}
          {optimalRun.executionTimeMs} ms (factor espectral de relajación &omega;=
          {optimalRun.omega}). Esto valida experimentalmente el teorema de Kahan-Ostrowski-Reich
          sobre aceleración de convergencia en diferencias finitas.
        </p>
        <p>
          <strong>Atenuación Física por Materiales:</strong> Se registraron {wallsCount} nodos de
          obstrucción dieléctrica/conductora activa.
          {wallsCount > 25
            ? " La alta densidad de barreras produce zonas de sombra electromagnética (< -75 dBm) por absorción dieléctrica acumulada."
            : " La disposición actual de tabiques permite una distribución equilibrada del flujo de potencia (Vector de Poynting) en el recinto."}
        </p>
      </div>
    );
  };

  // Genera, mapea y descarga el archivo con los datos completos de la malla y estadísticas en formato de texto estructurado (.txt)
  const descargarDocumentoMallaCompleto = () => {
    let content = "";
    content += "================================================================================\n";
    content += "        REPORTE TÉCNICO OFICIAL DE SIMULACIÓN MULTIDIMENSIONAL DE COBERTURA     \n";
    content += "              SIMNET - RESOLVEDOR DE ECUACIONES DE LAPLACE (SOR)                \n";
    content += "================================================================================\n\n";

    content += `Fecha de Expedición: ${new Date().toLocaleString()}\n`;
    content += `Entorno de simulación operado por: ${currentUser.username}\n`;
    content += `Rol de evaluación: ${currentUser.role.toUpperCase()}\n`;
    content += `Dimensiones físicas de la sala: ${(gridSize.rows * cellSize).toFixed(1)}m x ${(gridSize.cols * cellSize).toFixed(1)}m (Resolución: ${cellSize}m por celda)\n`;
    content += `Área total simulada: ${(gridSize.rows * gridSize.cols * cellSize * cellSize).toFixed(1)} m²\n`;
    content += `Número de celdas computacionales: ${gridSize.rows} x ${gridSize.cols} (${gridSize.rows * gridSize.cols} nodos de Dirichlet y Poisson)\n`;
    content += `Cantidad de obstrucciones de pared colocadas: ${walls.length}\n`;
    content += `Cantidad de emisores enrutadores activos: ${routers.length}\n\n`;

    content += "--------------------------------------------------------------------------------\n";
    content += "1. PARÁMETROS OPERACIONALES DEL MOTOR NUMÉRICO (SOBRE-RELAJACIÓN SUCESIVA)\n";
    content += "--------------------------------------------------------------------------------\n";
    content += `Esquema de Resolución: Sobre-Relajación Sucesiva (SOR)\n`;
    content += `Factor Relajación Óptima (Omega - ω): ${config.omega}\n`;
    content += `Tolerancia Estricta de Convergencia (Épsilon - ε): ${config.tolerance}\n`;
    content += `Límite Máximo de Iteraciones: ${config.maxIterations}\n`;
    content += `Última Ejecución - Iteraciones Realizadas: ${currentIteration} itr\n`;
    content += `Última Ejecución - Residuo Erróneo Máximo: ${currentError <= config.tolerance ? 'CONVERGIDO' : 'FUERA DE LÍMITE'} (${currentError})\n`;
    content += `Última Ejecución - Tiempo de Cálculo de la Cpu: ${timeMs} ms\n\n`;

    content += "--------------------------------------------------------------------------------\n";
    content += "2. CONFIGURACIÓN COMPLETA DE ENRUTADORES WI-FI ACTIVOS\n";
    content += "--------------------------------------------------------------------------------\n";
    if (routers.length === 0) {
      content += "No se registran enrutadores activos en el espacio bidimensional de simulación.\n\n";
    } else {
      routers.forEach((r, idx) => {
        content += `Enrutador #${idx + 1}:\n`;
        content += `  - SSID (Identificador de Red): ${r.ssid}\n`;
        content += `  - Frecuencia del Espectro: ${r.frequency}\n`;
        content += `  - Coordenadas Espaciales: Fila ${r.x}, Columna ${r.y}\n`;
        content += `  - Potencia Transmisora Nominal: ${r.power} W (Frontera fija de excitación de señal)\n`;
        content += `  - Pérdida Base del Espectro por celda: 2.25x potencial excitación\n\n`;
      });
    }

    content += "--------------------------------------------------------------------------------\n";
    content += "3. HISTORIAL DE EXPERIMENTOS EJECUTADOS EN LA SESIÓN\n";
    content += "--------------------------------------------------------------------------------\n";
    if (history.length === 0) {
      content += "No se registran experimentos anteriores guardados en esta sesión.\n\n";
    } else {
      content += `ID | Método              | Malla | Iteraciones | Tiempo CPU | Residuo Final | Estado de Convergencia\n`;
      content += `--------------------------------------------------------------------------------\n`;
      history.forEach((run, index) => {
        const methodLabel =
          run.method === "sor"
            ? `SOR (w=${run.omega})`
            : run.method === "gauss-seidel"
            ? "Gauss-Seidel (w=1.0)"
            : "Jacobi (Simultáneo)";
        content += `${String(index + 1).padEnd(2)} | ${methodLabel.padEnd(19)} | ${run.gridSize.padEnd(5)} | ${String(run.iterations).padEnd(11)} | ${String(run.executionTimeMs).padEnd(7)} ms | ${run.finalError.toExponential(3)} | ${run.converged ? "CONVERGIDO" : "FALLIDO"}\n`;
      });
      content += "\n";
    }

    content += "--------------------------------------------------------------------------------\n";
    content += "4. MAPA ELECTROMAGNÉTICO BIDIMENSIONAL (VISTA EN SÍMBOLOS ASCII)\n";
    content += "--------------------------------------------------------------------------------\n";
    content += "Simbología de Referencia:\n";
    content += "   [ R ] : Enrutador Operativo WiFi\n";
    content += "   [ M ] : Obstrucción de Metal Dieléctrico (Atenuación crítica ponderada)\n";
    content += "   [ C ] : Obstrucción de Hormigón de Alta Pérdida\n";
    content += "   [ L ] : Obstrucción de Ladrillo de Media Pérdida\n";
    content += "   [ Y ] : Obstrucción de Tabiquería Drywall de Baja Pérdida\n";
    content += "   [ # ] : Frontera exterior de Dirichlet (Contención a cero absoluto)\n";
    content += "   [9-1] : Intensidad en deciles (u.val de 90% a 10% respectivamente)\n";
    content += "   [ . ] : Zona ciega / Cobertura menor al 10% o ruido absoluto\n\n";

    for (let i = 0; i < grid.length; i++) {
      let rowStr = "";
      for (let j = 0; j < grid[i].length; j++) {
        const cell = grid[i][j];
        const isB = i === 0 || i === grid.length - 1 || j === 0 || j === grid[i].length - 1;
        if (cell.type === "router") {
          rowStr += " R  ";
        } else if (cell.type === "wall") {
          const matChar = cell.material === "metal" ? "M" : cell.material === "concrete" ? "C" : cell.material === "brick" ? "L" : "Y";
          rowStr += ` ${matChar}  `;
        } else if (isB) {
          rowStr += " #  ";
        } else {
          const val = cell.val;
          if (val >= 90) rowStr += " 9  ";
          else if (val >= 80) rowStr += " 8  ";
          else if (val >= 70) rowStr += " 7  ";
          else if (val >= 60) rowStr += " 6  ";
          else if (val >= 50) rowStr += " 5  ";
          else if (val >= 40) rowStr += " 4  ";
          else if (val >= 30) rowStr += " 3  ";
          else if (val >= 20) rowStr += " 2  ";
          else if (val >= 10) rowStr += " 1  ";
          else rowStr += " .  ";
        }
      }
      content += rowStr + "\n";
    }
    content += "\n";

    content += "--------------------------------------------------------------------------------\n";
    content += "5. MATRIZ NUMÉRICA COORDENADA POR COORDENADA (DATOS DISCRETOS DE COMPORTAMIENTO)\n";
    content += "--------------------------------------------------------------------------------\n";
    content += "Coordenada | Material Local  | Valor Potencial (%) | Potencia WiFi (dBm) | Tipo de Nodo\n";
    content += "--------------------------------------------------------------------------------\n";
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const cell = grid[i][j];
        const isB = i === 0 || i === grid.length - 1 || j === 0 || j === grid[i].length - 1;
        const coord = `[${String(i).padStart(2)}, ${String(j).padStart(2)}]`;
        const material = cell.type === "wall" ? cell.material.toUpperCase() : "AIRE";
        const valPct = cell.val.toFixed(2) + "%";
        const dbmStr = getDbmValue(cell.val) + " dBm";
        let typeNode = "Interior (Libre)";
        if (isB) typeNode = "Borde (Dirichlet)";
        else if (cell.type === "router") typeNode = "Excitador (Fijo)";
        else if (cell.type === "wall") typeNode = "Atenuador (Muro)";

        content += `${coord.padEnd(10)} | ${material.padEnd(15)} | ${valPct.padEnd(19)} | ${dbmStr.padEnd(19)} | ${typeNode}\n`;
      }
    }

    content += "\n================================================================================\n";
    content += "                  FIN DEL INFORME TÉCNICO INALÁMBRICO DE MALLA                  \n";
    content += "================================================================================\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().getTime();
    const filename = `reporte_malla_wifi_pamplona_${currentUser.username}_${timestamp}.txt`;
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Guardar en el servidor en la carpeta "resultados" de forma asíncrona
    fetch("/api/guardar-resultado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: filename,
        content: content,
        type: "text"
      })
    })
      .then(res => res.json())
      .then(data => console.log("Resultado de reporte guardado en el servidor:", data))
      .catch(err => console.error("Error al guardar reporte en servidor", err));
  };

  // Clases CSS dinámicas para el contenedor raíz, tarjetas y bordes según el tema oscuro o claro
  const bgMainClass = isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const bgCardClass = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-800 shadow-sm";
  const borderClass = isDarkMode ? "border-slate-800" : "border-slate-200";

  return (
    <div
      className={`min-h-screen transition-all duration-300 flex flex-col font-sans select-none relative ${bgMainClass}`}
      onMouseUp={handleCellMouseUp}
    >
      {/* Efectos decorativos de iluminación ambiental de fondo */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Barra de Navegación Superior Fija */}
      <header
        className={`backdrop-blur-lg border-b sticky top-0 z-40 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-950/70 border-slate-900" : "bg-white/80 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Signal className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600">
                  SimuNet Física
                </h1>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:block">
                Propagación Electromagnética UHF/SHF • Diferencias Finitas 2D
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Enlaces directos a la Presentación Interactiva y al Póster Científico bilingüe */}
            <a
              href="/presentacion/05_Presentacion_Interactiva_Feria_Fisica.html"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-indigo-950/70 border-indigo-700/80 text-indigo-300 hover:bg-indigo-900/70"
                  : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              }`}
              title="Abrir Presentación Interactiva y Guía Explicativa Detallada"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Presentación Explicativa</span>
            </a>

            <a
              href="/presentacion/poster/Poster_Visual_80x120cm.html"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              }`}
              title="Abrir Póster Científico Oficial 80x120 cm (Español)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Póster (ES)</span>
            </a>

            <a
              href="/presentacion/poster/Poster_Visual_80x120cm_EN.html"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                  : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              }`}
              title="Abrir Póster Científico Oficial 80x120 cm (Inglés)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Poster (EN)</span>
            </a>

            {/* Botón conmutador de tema visual (Modo Oscuro / Modo Claro) */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Cambiar Modo de Color"
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                  : "bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200"
              }`}
              id="theme_toggle_btn"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end text-xs leading-none">
                  <span className="font-bold">{currentUser.username}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5 font-bold">
                    {currentUser.role === "admin"
                      ? "Administrador de Red"
                      : "Estudiante Universitario"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  className={`p-2.5 rounded-2xl border cursor-pointer hover:bg-rose-50/10 hover:text-rose-500 transition-all ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-800 text-slate-400"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                  id="logout_btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenedor Principal del Espacio de Trabajo */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full h-full relative">
        <AnimatePresence mode="wait">
          {!currentUser ? (
            // Vista del Portal de Autenticación cuando no hay sesión iniciada
            <motion.div
              key="auth-portal"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md mx-auto my-12"
            >
              <div
                className={`p-8 rounded-3xl border ${bgCardClass} shadow-xl relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col items-center text-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-500/20">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black">Portal Académico SimuNet</h2>
                  <p className="text-xs text-slate-550 dark:text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                    Universidad de Pamplona - Modelado Electromagnético e Ingeniería Numérica
                  </p>
                </div>

                {/* Pestañas para alternar entre Iniciar Sesión y Registrarse */}
                <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setLoginError("");
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !isRegisterMode
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setLoginError("");
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isRegisterMode
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    }`}
                  >
                    Registrarse
                  </button>
                </div>

                {loginError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs text-center font-semibold">
                    {loginError}
                  </div>
                )}

                {registerSuccessMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs text-center font-semibold animate-pulse">
                    {registerSuccessMsg}
                  </div>
                )}

                {!isRegisterMode ? (
                  /* Formulario de Inicio de Sesión */
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 block mb-1.5">
                        Usuario de Red o Código Estándar
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="ej: admin_pamplona o estudiante"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className={`w-full bg-slate-50 dark:bg-slate-950 border ${borderClass} pl-10 pr-3.5 py-2.5 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-medium`}
                          id="login_username_input"
                        />
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{
                        opacity: loginUsername.trim().toLowerCase() !== "" ? 1 : 0,
                        height: loginUsername.trim().toLowerCase() !== "" ? "auto" : 0,
                      }}
                      className="overflow-hidden space-y-4"
                    >
                      <div>
                        <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 block mb-1.5">
                          Contraseña de Cuenta{" "}
                          {loginUsername.trim().toLowerCase() === "admin_pamplona"
                            ? "(Demo: 'admin123')"
                            : ""}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="password"
                            placeholder="Ingrese su contraseña"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className={`w-full bg-slate-50 dark:bg-slate-950 border ${borderClass} pl-10 pr-3.5 py-2.5 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-medium`}
                            id="login_password_input"
                          />
                        </div>
                      </div>
                    </motion.div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition shadow-md shadow-indigo-600/15 text-xs text-center cursor-pointer block mt-4"
                      id="submit_login_btn"
                    >
                      Ingresar a la Red
                    </button>
                  </form>
                ) : (
                  /* Formulario de Registro de Nueva Cuenta */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 block mb-1.5">
                        Definir Usuario de Red o Código
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="ej: mi_codigo_pamplona"
                          value={registerUsername}
                          onChange={(e) => setRegisterUsername(e.target.value)}
                          className={`w-full bg-slate-50 dark:bg-slate-950 border ${borderClass} pl-10 pr-3.5 py-2.5 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-medium`}
                          required
                          id="register_username_input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 block mb-1.5">
                        Establecer Contraseña Privada
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="password"
                          placeholder="Mínimo 4 caracteres"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className={`w-full bg-slate-50 dark:bg-slate-950 border ${borderClass} pl-10 pr-3.5 py-2.5 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-medium`}
                          required
                          id="register_password_input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 block mb-1.5">
                        Rol Universitario Autorizado
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRegisterRole("standard")}
                          className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                            registerRole === "standard"
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : isDarkMode
                              ? "bg-slate-950 border-slate-800 text-slate-400"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          Estudiante
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegisterRole("admin")}
                          className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                            registerRole === "admin"
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : isDarkMode
                              ? "bg-slate-950 border-slate-800 text-slate-400"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          Administrador
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-555 dark:text-slate-450 mt-2 font-medium">
                        {registerRole === "admin"
                          ? "✓ Cuenta administrativa: acceso a auditorías integrales y descarga de informes técnicos."
                          : "✓ Estudiante: simulación interactiva 2D, estudio de propagación y guardado de planos locales."}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition shadow-md shadow-indigo-600/15 text-xs text-center cursor-pointer block"
                      id="submit_register_btn"
                    >
                      Registrar Nueva Cuenta
                    </button>
                  </form>
                )}

                {/* Recordatorio de credenciales de demostración para evaluación rápida */}
                <div
                  className={`mt-6 pt-5 border-t text-slate-500 dark:text-slate-405 italic ${
                    isDarkMode ? "border-slate-850" : "border-slate-100"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-2 font-mono text-slate-550 dark:text-slate-400">
                    Acceso de Prueba Rápido:
                  </span>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border dark:border-slate-900">
                      <span className="text-slate-600 dark:text-slate-430 font-semibold">
                        👤 Administrador Demo:
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-650 dark:text-slate-305">
                        admin_pamplona / admin123
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // Vista Completa del Laboratorio de Simulación cuando el usuario ha iniciado sesión
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Barra de estado del laboratorio con indicación de sesión activa */}
              <div className="lg:col-span-12 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Signal className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Simulador de Propagación e Intensidad de Campo Electromagnético UHF/SHF 2D
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-550 dark:text-slate-400 mr-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Usuario Activo:{" "}
                    <span className="text-indigo-550 dark:text-indigo-400 font-extrabold">
                      {currentUser.username}
                    </span>{" "}
                    ({currentUser.role === "admin" ? "Administrador" : "Estudiante"})
                  </span>
                </div>
              </div>

              {/* Columna Izquierda (8/12): Malla Interactiva 2D, Panel de Gráficas y Auditoría Administrativa */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Componente de Malla Bidimensional en Diferencias Finitas */}
                <NetworkGrid
                  grid={grid}
                  onCellClick={handleCellPaint}
                  onCellMouseDown={handleCellMouseDown}
                  onCellMouseEnter={handleCellMouseEnter}
                  onCellMouseUp={handleCellMouseUp}
                  routers={routers}
                  selectedTool={selectedTool}
                  hoveredCell={hoveredCell}
                  setHoveredCell={setHoveredCell}
                  showHeatmap={showHeatmap}
                  setShowHeatmap={setShowHeatmap}
                  showValues={showValues}
                  setShowValues={setShowValues}
                  isDarkMode={isDarkMode}
                  cellSize={cellSize}
                  isOptimizing={isOptimizing}
                  optimizationResult={optimizationResult}
                />

                {/* Componente de Diagnóstico Numérico, Fórmulas y Gráficas SVG */}
                <GraphPanel
                  history={history}
                  onClearHistory={() => setHistory([])}
                  currentErrorHistory={currentErrorHistory}
                  tolerance={config.tolerance}
                  currentIteration={currentIteration}
                  currentError={currentError}
                  timeMs={timeMs}
                  isConverged={isConverged}
                  method={config.method}
                  isDarkMode={isDarkMode}
                  onDownloadFullReport={descargarDocumentoMallaCompleto}
                  validationSummary={validateGridPhysics(grid, routers, walls, cellSize)}
                  onCompareMethods={handleCompareMethods}
                  activeFrequency={routers[0]?.frequency || "2.4 GHz"}
                />

                {/* Módulo de Auditoría Técnica (visible para cuentas con rol de Administrador) */}
                {currentUser.role === "admin" && (
                  <div
                    className={`p-6 rounded-3xl border transition-all duration-300 ${bgCardClass}`}
                  >
                    <div
                      className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 ${
                        isDarkMode ? "border-slate-850" : "border-slate-100"
                      }`}
                    >
                      <div>
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <Shield className="w-5 h-5 text-indigo-500 animate-pulse" />
                          Auditoría de Sistemas y Análisis de Convergencia
                        </h3>
                        <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
                          Herramientas exclusivas del Administrador para certificar la estabilidad
                          numérica y exportar el informe técnico oficial.
                        </p>
                      </div>

                      {history.length > 0 ? (
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer transition"
                        >
                          <FileText className="w-4 h-4" />
                          Generar Informe Técnico
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-bold">
                          Ejecute una simulación antes de auditar
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div
                        className={`p-4 rounded-2xl border ${
                          isDarkMode
                            ? "bg-slate-950/40 border-slate-850"
                            : "bg-slate-50 border-slate-150"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 mb-1">
                          Cálculos Totales
                        </div>
                        <div className="text-2xl font-black text-indigo-500">{history.length}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          Simulaciones completadas
                        </div>
                      </div>

                      <div
                        className={`p-4 rounded-2xl border ${
                          isDarkMode
                            ? "bg-slate-950/40 border-slate-850"
                            : "bg-slate-50 border-slate-150"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 mb-1">
                          Malla Activa
                        </div>
                        <div className="text-2xl font-black text-indigo-500">
                          {gridSize.rows} &times; {gridSize.cols}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {gridSize.rows * gridSize.cols} nodos computacionales
                        </div>
                      </div>

                      <div
                        className={`p-4 rounded-2xl border ${
                          isDarkMode
                            ? "bg-slate-950/40 border-slate-850"
                            : "bg-slate-50 border-slate-150"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 mb-1">
                          Estatus del Sistema
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-xs font-bold text-emerald-500">Operativo</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          Calibración abierta a 10⁻⁶
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna Derecha (4/12): Panel de Controles y Biblioteca de Planos Guardados */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Panel de Control de Parámetros Físicos y Numéricos */}
                <ControlPanel
                  config={config}
                  setConfig={setConfig}
                  isRunning={isRunning}
                  onStart={handleStartAnimation}
                  onPause={() => setIsRunning(false)}
                  onSolveInstant={handleSolveInstant}
                  onSingleStep={handleSingleStep}
                  onReset={rebuildGrid}
                  onClearWalls={() => setWalls([])}
                  selectedTool={selectedTool}
                  setSelectedTool={setSelectedTool}
                  currentIteration={currentIteration}
                  currentError={currentError}
                  timeMs={timeMs}
                  onLoadPreset={handleLoadPreset}
                  gridSize={gridSize}
                  setGridSize={handleGridSizeUpdate}
                  isDarkMode={isDarkMode}
                  isAdmin={currentUser.role === "admin"}
                  walls={walls}
                  setWalls={setWalls}
                  selectedRouterModelId={selectedRouterModelId}
                  setSelectedRouterModelId={setSelectedRouterModelId}
                  cellSize={cellSize}
                  setCellSize={setCellSize}
                  onFindBestRouterPlace={findBestRouterLocation}
                  isOptimizing={isOptimizing}
                  optimizationResult={optimizationResult}
                  onApplyBestRouterPlace={applyBestRouterLocation}
                  routers={routers}
                  onClearRouters={() => setRouters([])}
                />

                {/* Tarjeta de Almacenamiento Persistente de Diseños del Usuario */}
                <div
                  className={`p-6 rounded-3xl border transition-all duration-300 ${bgCardClass}`}
                >
                  <h3 className="text-base font-bold flex items-center gap-2 mb-3">
                    <Save className="w-5 h-5 text-indigo-500" />
                    Mis Diseños e Historial
                  </h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
                    Guarda la distribución actual de muros dieléctricos y transmisores para
                    recuperarla en futuras sesiones de trabajo.
                  </p>

                  {saveSuccessMsg && (
                    <div className="mb-3.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs text-center font-bold">
                      {saveSuccessMsg}
                    </div>
                  )}

                  {/* Formulario para guardar el plano actual */}
                  <div
                    className={`p-3.5 rounded-2xl border flex flex-col gap-2 mb-4 ${
                      isDarkMode
                        ? "bg-slate-950/60 border-slate-850"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-slate-550 dark:text-slate-400 block font-bold">
                      Guardar Red Activa
                    </span>
                    <input
                      type="text"
                      placeholder="Nombre del plano. ej: Consultorios"
                      value={newNetworkName}
                      onChange={(e) => setNewNetworkName(e.target.value)}
                      className={`w-full bg-white dark:bg-slate-900 border ${borderClass} px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500/50`}
                    />
                    <button
                      onClick={handleSaveNetworkDesign}
                      className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Preservar Diseño actual
                    </button>
                  </div>

                  {/* Lista de planos guardados por el usuario activo */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-550 dark:text-slate-400 block font-bold mb-2">
                      Tus Redes Registradas ({currentUser.savedNetworks.length})
                    </span>
                    {currentUser.savedNetworks.length === 0 ? (
                      <div className="p-4 border border-dashed rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                        Aún no tienes ningún mapa guardado. Diseña una red y haz clic en
                        &quot;Preservar Diseño&quot; arriba.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {currentUser.savedNetworks.map((net) => (
                          <div
                            key={net.id}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                              isDarkMode
                                ? "bg-slate-950/40 border-slate-850 hover:bg-slate-950"
                                : "bg-slate-50 border-slate-150 hover:bg-slate-100/50"
                            }`}
                          >
                            <div className="flex flex-col min-w-0 max-w-[70%]">
                              <span className="font-bold truncate" title={net.name}>
                                {net.name}
                              </span>
                              <span className="text-[9px] text-slate-550 dark:text-slate-400 font-mono mt-0.5">
                                {net.gridSize.rows}x{net.gridSize.cols} • {net.walls.length} paredes
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleLoadUserNetwork(net)}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-lg font-bold transition cursor-pointer"
                              >
                                Cargar
                              </button>
                              <button
                                onClick={() => handleDeleteUserNetwork(net.id)}
                                className="p-1 px-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Pie de Página Institucional y Físico-Matemático */}
      <footer
        className={`border-t transition-all mt-12 py-8 text-xs ${
          isDarkMode
            ? "border-slate-900 bg-slate-950 text-slate-500"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-550 dark:text-slate-350">
              Universidad de Pamplona
            </span>
            <span className="text-slate-300 dark:text-slate-800">|</span>
            <span>
              Modelado Computacional de Campos Electromagnéticos UHF/SHF y Métodos Numéricos © 2026
            </span>
          </div>
          <div className="flex gap-4 font-mono">
            <span title="Ecuación estacionaria de difusión-absorción en medios dieléctricos disipativos">
              Ecuación Rectora: ∇²u - κ²u = 0
            </span>
            <span>•</span>
            <span title="Sobre-Relajación Sucesiva (Successive Over-Relaxation) con aceleración espectral">
              Estabilidad SOR (1 &lt; ω &lt; 2)
            </span>
          </div>
        </div>
      </footer>

      {/* Modal de Vista Previa e Impresión del Informe Técnico Oficial */}
      <AnimatePresence>
        {showReportModal && currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex justify-center items-center overflow-y-auto p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white text-slate-900 w-full max-w-3xl rounded-3xl p-8 shadow-2xl relative flex flex-col gap-6 max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-6 h-6 text-indigo-600 animate-pulse" />
                  <div>
                    <h2 className="text-lg font-black text-slate-950 uppercase">
                      AUDITORÍA FÍSICA Y DE TELECOMUNICACIONES
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Universidad de Pamplona • Informe Técnico Final
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={descargarDocumentoMallaCompleto}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white font-bold rounded-2xl text-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    Descargar Datos (.txt)
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white font-bold rounded-2xl text-xs hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir o Guardar PDF
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-3.5 py-2 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs transition cursor-pointer border border-slate-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              {/* Cuerpo imprimible del informe técnico */}
              <div className="overflow-y-auto pr-1 space-y-6" id="technical-analysis-print">
                {/* Encabezado de metadatos del reporte */}
                <div className="border hover:border-indigo-200 p-5 rounded-2xl bg-slate-50/50 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <div>
                      <span className="font-bold text-slate-550 block uppercase">
                        Código de Reporte:
                      </span>
                      <span className="font-bold text-slate-850">
                        UP-SIMUNET-2026-{(Math.random() * 10000).toFixed(0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-550 block uppercase">
                        Fecha de Expedición:
                      </span>
                      <span className="font-bold text-slate-850">
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-150" />

                  {/* Tabla de indicadores clave de la última corrida */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-550 block">
                        Evaluador Responsable
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        {currentUser.username}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-550 block">
                        Último Método
                      </span>
                      <span className="text-xs font-black text-slate-850 uppercase">
                        {config.method}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-550 block">
                        Iteraciones Realizadas
                      </span>
                      <span className="text-xs font-black text-slate-850">
                        {currentIteration} itr
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-550 block">
                        Residuo Obtenido
                      </span>
                      <span className="text-xs font-black text-slate-850">
                        {currentError < 1e-4
                          ? currentError.toExponential(3)
                          : currentError.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloque de condiciones de frontera y parámetros de discretización */}
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-slate-405 tracking-wider mb-2">
                    1. ESTRUCTURACIÓN MATEMÁTICA Y CONDICIONES DE FRONTERA
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 font-mono text-[10.5px] leading-relaxed text-slate-700">
                    <p className="mb-2">
                      <strong>Parámetros Operacionales de Malla:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Tolerancia estricta de Convergencia (&epsilon;): {config.tolerance}</li>
                      <li>Factor Óptimo de Relajación ω: {config.omega}</li>
                      <li>Condición Dirichlet de Borde (Paredes Perimetrales): u = 0.0</li>
                      <li>
                        Enrutadores Activos ({routers.length}):{" "}
                        {routers.length > 0
                          ? routers.map((r) => `${r.ssid} (${r.frequency})`).join(", ")
                          : "Ninguno colocado"}
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Tabla cronológica de todas las simulaciones de la sesión */}
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-slate-405 tracking-wider mb-2">
                    2. TABLA CRONOLÓGICA DE SIMULACIONES EN LA SESIÓN
                  </h3>
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2 px-3">Esquema</th>
                          <th className="py-2 px-3">Iteraciones</th>
                          <th className="py-2 px-3">Tiempo (ms)</th>
                          <th className="py-2 px-3">Error Residual</th>
                          <th className="py-2 px-3">Convergencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history.map((run, i) => (
                          <tr
                            key={run.id}
                            className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}
                          >
                            <td className="py-2 px-3 font-bold text-indigo-650 uppercase">
                              {run.method}
                            </td>
                            <td className="py-2 px-3">{run.iterations}</td>
                            <td className="py-2 px-3">{run.executionTimeMs} ms</td>
                            <td className="py-2 px-3">
                              {run.finalError < 1e-4
                                ? run.finalError.toExponential(2)
                                : run.finalError.toFixed(5)}
                            </td>
                            <td className="py-2 px-3">
                              {run.converged ? (
                                <span className="text-emerald-600 font-bold">CONVERGIDO</span>
                              ) : (
                                <span className="text-amber-600 font-bold">LÍMITE ITER.</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dictamen técnico automatizado */}
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-slate-405 tracking-wider mb-2">
                    3. DETERMINACIÓN TÉCNICA E INFORME FINAL
                  </h3>
                  {generateReportAnalysisText()}
                </div>

                {/* Firmas de validación del informe */}
                <hr className="border-slate-150 mt-8" />
                <div className="flex justify-between items-center pt-4 text-[11px] text-slate-400 font-semibold font-mono">
                  <div className="text-center w-1/3">
                    <div className="border-b border-slate-350 pr-4 pl-4 pb-2 text-slate-800">
                      U. PAMPLONA SOLVER
                    </div>
                    <span className="mt-1 block">Firma de Ingeniería Auditora</span>
                  </div>
                  <div className="text-center w-1/3">
                    <div className="border-b border-slate-350 pr-4 pl-4 pb-2 text-slate-800">
                      {currentUser.role === "admin"
                        ? "SISTEMA ADMINISTRADO"
                        : "FALTA EVALUACIÓN"}
                    </div>
                    <span className="mt-1 block">Aprobación de Métodos en Diferencias Finitas</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
