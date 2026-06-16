import React, { useState, useEffect, useRef } from "react";
import { Cell, SolverMethod, MaterialType, RouterConfig, SimulationConfig, RunHistory, UserProfile, UserSavedNetwork } from "./types";
import { buildInitialGrid, runSolverStep, solveInstant, MATERIALS, getDbmValue, getSignalQuality, ROUTER_MODELS } from "./controlador";
import NetworkGrid from "./components/NetworkGrid";
import ControlPanel from "./components/ControlPanel";
import GraphPanel from "./components/GraphPanel";
import { 
  Radio, HelpCircle, Eye, RefreshCw, Signal, Sun, Moon, 
  User, Lock, Shield, FileText, CheckCircle, Save, Trash2, 
  LogOut, Download, Activity, FileCheck, HelpCircle as HelpIcon, 
  Key, Users, BookOpen, Sparkles, GraduationCap, ArrowRight, Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Pre-cooked initial database of user profiles
const PRESET_PROFILES: UserProfile[] = [
  {
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
        routers: [{ x: 10, y: 10, power: 100, ssid: "U_Pamplona_5G", frequency: "5 GHz" as const }],
        gridSize: { rows: 16, cols: 16 }
      }
    ]
  },
  {
    username: "estudiante_pamplona",
    role: "standard",
    savedNetworks: []
  }
];

/**
 * CAPA 1: INTERFAZ
 * Ventanas, botones, campos de texto, gráficas, mostrar resultados.
 */
export default function Interfaz() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("simunet_dark_mode");
    return saved !== "false"; // default to dark mode for science/terminal aesthetic
  });

  // Load and preserve profiles from localStorage or use preset fallbacks
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("simunet_user_profiles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return PRESET_PROFILES;
      }
    }
    return PRESET_PROFILES;
  });

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const active = localStorage.getItem("simunet_active_user");
    if (active) {
      try {
        const cachedUser = JSON.parse(active);
        // Sync with profiles list
        const found = PRESET_PROFILES.find(p => p.username === cachedUser.username);
        return found || cachedUser;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Login and Registration variables
  const [loginUsername, setLoginUsername] = useState("");
  const [loginRole, setLoginRole] = useState<"standard" | "admin">("standard");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerRole, setRegisterRole] = useState<"standard" | "admin">("standard");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");

  // Grid size properties
  const [gridSize, setGridSize] = useState({ rows: 24, cols: 24 });
  
  // Custom network design layout states
  const [routers, setRouters] = useState<RouterConfig[]>([
    { x: 12, y: 12, power: 100, ssid: "WiFi_U_Pamplona", frequency: "2.4 GHz" }
  ]);
  const [walls, setWalls] = useState<{ x: number; y: number; material: MaterialType }[]>([]);
  
  // Cell array
  const [grid, setGrid] = useState<Cell[][]>([]);
  
  // Numerical configurations
  const [config, setConfig] = useState<SimulationConfig>({
    method: "sor",
    tolerance: 0.001,
    omega: 1.25,
    maxIterations: 600,
    animationDelay: 10,
  });

  // Live status
  const [isRunning, setIsRunning] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [currentError, setCurrentError] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [currentErrorHistory, setCurrentErrorHistory] = useState<number[]>([]);
  
  // Comparative run history array
  const [history, setHistory] = useState<RunHistory[]>([]);
  
  // Control Panel selection tools
  const [selectedTool, setSelectedTool] = useState<"router" | MaterialType | "eraser" | "move">("router");
  const [draggedRouterIndex, setDraggedRouterIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showValues, setShowValues] = useState(false);

  // Router placement optimization states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    x: number;
    y: number;
    avgSignal: number;
    coveragePct: number;
    candidatesTested: number;
    topCandidates?: Array<{
      x: number;
      y: number;
      avgSignal: number;
      coveragePct: number;
      score: number;
      zoneName: string;
    }>;
  } | null>(null);

  // Sizing and Router selection properties
  const [selectedRouterModelId, setSelectedRouterModelId] = useState<string>("tplink");
  const [cellSize, setCellSize] = useState<number>(0.5);

  // User design save names
  const [newNetworkName, setNewNetworkName] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Modal displays
  const [showReportModal, setShowReportModal] = useState(false);

  const startTimeRef = useRef<number | null>(null);

  // Sync theme
  useEffect(() => {
    localStorage.setItem("simunet_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  // Sync profiles inside localStorage
  useEffect(() => {
    localStorage.setItem("simunet_user_profiles", JSON.stringify(profiles));
  }, [profiles]);

  // Sync active user state inside localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("simunet_active_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("simunet_active_user");
    }
  }, [currentUser]);

  // Keep active router characteristics updated with commercial specifications
  useEffect(() => {
    const model = ROUTER_MODELS[selectedRouterModelId];
    if (model) {
      setRouters((prev) =>
        prev.map((r) => ({
          ...r,
          modelId: selectedRouterModelId,
          power: Math.round(model.eirpDbm * (100 / 38)), // Asus 38dBm is Max (100%)
          ssid: `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_"),
          frequency: model.frequency,
        }))
      );
    }
  }, [selectedRouterModelId]);

  // Initialize/rebuild grid when dimensions, routers, walls, or cell physical size change
  // Inicializar o reconstruir la malla computacional cuando cambian las dimensiones, los routers, las paredes, o el tamaño físico de celda.
  useEffect(() => {
    rebuildGrid();
  }, [gridSize, routers, walls, cellSize]);

  // Función para re-configurar la malla con el potencial de Dirichlet incrustado
  const rebuildGrid = () => {
    const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize);
    setGrid(initial);
    setCurrentIteration(0);
    setCurrentError(0);
    setTimeMs(0);
    setIsConverged(false);
    setCurrentErrorHistory([]);
  };

  // CAPA 4: Bucle principal del resolvedor numérico iterativo estimulado mediante pulsos de tiempo (ticks)
  useEffect(() => {
    // Si la simulación animada está apagada, reiniciar el cronometro
    if (!isRunning) {
      startTimeRef.current = null;
      return;
    }

    // Registrar hora inicial de la simulación en milisegundos para monitorear el rendimiento en CPU
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    // Configurar temporizador recursivo según el retardo de animación escogido por el usuario
    const timer = setTimeout(() => {
      // Computar un paso iterativo individual en la malla con SOR
      const stepResult = runSolverStep(grid, config.method, config.omega);
      
      const newIteration = currentIteration + 1;
      const newError = stepResult.error;
      const elapsed = Math.round(performance.now() - (startTimeRef.current || 0));

      // Actualizar estados reactivos con los datos del nuevo paso
      setGrid(stepResult.grid);
      setCurrentIteration(newIteration);
      setCurrentError(newError);
      setTimeMs(elapsed);
      
      const updatedErrorHist = [...currentErrorHistory, newError];
      setCurrentErrorHistory(updatedErrorHist);

      // Evaluar estado de convergencia (si el error cae por debajo de la tolerancia configurada)
      const achievedConvergence = newError < config.tolerance;
      const hitLimit = newIteration >= config.maxIterations;

      // Si converge o alcanza el límite máximo de iteraciones, detener simulación y archivar experimento
      if (achievedConvergence || hitLimit) {
        setIsRunning(false);
        // Se considera "Estabilidad Alta" si converge rápido (dentro de las primeras 100 iteraciones)
        setIsConverged(achievedConvergence && newIteration <= 100);

        // Registrar estadísticas consolidadas en el historial para análisis posteriores o descarga CSV
        const runId = Math.random().toString();
        const newRun: RunHistory = {
          id: runId,
          timestamp: new Date().toLocaleTimeString(),
          method: config.method,
          iterations: newIteration,
          executionTimeMs: elapsed,
          finalError: newError,
          converged: achievedConvergence && newIteration <= 100,
          omega: config.omega,
          tolerance: config.tolerance,
          gridSize: `${gridSize.rows}x${gridSize.cols}`,
          obstaclesCount: walls.length,
          errorHistory: updatedErrorHist,
        };
        setHistory((prev) => [newRun, ...prev]);
      }
    }, config.animationDelay);

    return () => clearTimeout(timer);
  }, [isRunning, grid, currentIteration, config, currentErrorHistory, gridSize, walls.length]);

  // Dibujar y colocar objetos en las celdas (Capa de pintura del plano)
  const handleCellPaint = (x: number, y: number) => {
    // Proteger los bordes exteriores de la rejilla para conservar las condiciones fijas de Dirichlet (valor 0V / Tierra)
    if (x === 0 || x === gridSize.rows - 1 || y === 0 || y === gridSize.cols - 1) return;

    if (selectedTool === "router") {
      // Agregar un nuevo enrutador de red al plano con las características comerciales escogidas
      const model = ROUTER_MODELS[selectedRouterModelId];
      const newRouter = { 
          x, 
          y, 
          power: Math.round(model.eirpDbm * (100 / 38)), 
          ssid: `${model.brand}_${model.model}_${routers.length + 1}`.replace(/[\s\-\.]+/g, "_"), 
          frequency: model.frequency,
          modelId: selectedRouterModelId
      };
      // Limpiar cualquier obstáculo superpuesto
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setRouters((prev) => {
        const filtered = prev.filter((r) => !(r.x === x && r.y === y));
        return [...filtered, newRouter];
      });
    } else if (selectedTool === "eraser") {
      // Borrar cualquier elemento existente en las coordenadas de la celda
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setRouters((prev) => prev.filter((r) => !(r.x === x && r.y === y)));
    } else if (selectedTool !== "move") {
      // Agregar paredes o materiales aislantes dieléctricos (yeso, ladrillo, concreto, metal)
      const filteredWalls = walls.filter((w) => !(w.x === x && w.y === y));
      setRouters((prev) => prev.filter((r) => !(r.x === x && r.y === y)));
      setWalls([...filteredWalls, { x, y, material: selectedTool }]);
    }
  };

  // Manejador del primer clic sobre una celda del tablero interactivo
  const handleCellMouseDown = (x: number, y: number) => {
    if (selectedTool === "move") {
      // Si la herramienta es 'Move', buscar si hay algún router emisor bajo el cursor para arrastrarlo
      const routerIdx = routers.findIndex((r) => r.x === x && r.y === y);
      if (routerIdx !== -1) {
        setDraggedRouterIndex(routerIdx);
        setIsDrawing(true);
      }
    } else {
      // Si es un pincel estándar (muros, routers o goma), iniciar pintado interactivo
      setIsDrawing(true);
      handleCellPaint(x, y);
    }
  };

  // Manejador de mouse-over (evento de pasar por encima de una celda) para soportar dibujo continuo o arrastre
  const handleCellMouseEnter = (x: number, y: number) => {
    if (selectedTool === "move") {
      if (isDrawing && draggedRouterIndex !== null) {
        // Evitar que el enrutador arrastrado salga de las fronteras físicas o caiga en los límites exteriores
        if (x === 0 || x === gridSize.rows - 1 || y === 0 || y === gridSize.cols - 1) return;

        // Comprobar que la coordenada de destino no esté ocupada por otro router
        const isOccupiedByOther = routers.some((r, idx) => idx !== draggedRouterIndex && r.x === x && r.y === y);
        if (isOccupiedByOther) return;

        // Recalcular el nuevo conjunto de routers actualizando la coordenada del router arrastrado
        const updatedRouters = routers.map((r, idx) => {
          if (idx === draggedRouterIndex) {
            return { ...r, x, y };
          }
          return r;
        });

        setRouters(updatedRouters);
        // Borrar muros que estuvieran justamente en esa nueva celda destino del router
        const filteredWalls = walls.filter((w) => !(w.x === x && w.y === y));
        setWalls(filteredWalls);

        // Reconstruir la malla y simular la potencia inalámbrica al instante para dar feedback en tiempo real
        const initial = buildInitialGrid(gridSize.rows, gridSize.cols, updatedRouters, filteredWalls, cellSize);
        const result = solveInstant(initial, config.method, config.omega, config.tolerance, 25);
        setGrid(result.grid);
      }
    } else {
      // Efectuar pintado de muro o router si se arrastra el ratón presionando click
      if (isDrawing) {
        handleCellPaint(x, y);
      }
    }
  };

  // Al soltar el click del ratón, detener procesos activos
  const handleCellMouseUp = () => {
    if (selectedTool === "move" && draggedRouterIndex !== null) {
      // Detener cualquier animación en progreso para re-propagar las ondas Laplace simuladas con el tick iterativo
      setIsRunning(false);
      
      const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls, cellSize);
      setGrid(initial);
      setCurrentIteration(0);
      setCurrentError(0);
      setTimeMs(0);
      setIsConverged(false);
      setCurrentErrorHistory([]);

      // Activar el bucle interactivo de simulación para animar la emisión de ondas electromagnéticas
      setTimeout(() => {
        setIsRunning(true);
      }, 50);

      setDraggedRouterIndex(null);
    }
    setIsDrawing(false);
  };

  const handleLoadPreset = (presetName: string) => {
    setIsRunning(false);
    const model = ROUTER_MODELS[selectedRouterModelId];
    const initialRouter = {
      x: 12,
      y: 12,
      power: Math.round(model.eirpDbm * (100 / 38)),
      ssid: `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_"),
      frequency: model.frequency,
      modelId: selectedRouterModelId
    };

    if (presetName === "empty") {
      setWalls([]);
      setRouters([initialRouter]);
    } else if (presetName === "office") {
      const officeWalls: { x: number; y: number; material: MaterialType }[] = [];
      for (let i = 2; i < 22; i++) {
        if (i !== 7 && i !== 8 && i !== 15 && i !== 16) {
          officeWalls.push({ x: i, y: 11, material: "concrete" });
        }
      }
      for (let j = 2; j < 11; j++) {
        if (j !== 5) {
          officeWalls.push({ x: 8, y: j, material: "concrete" });
          officeWalls.push({ x: 15, y: j, material: "concrete" });
        }
      }
      for (let j = 12; j < 22; j++) {
        if (j !== 17) {
          officeWalls.push({ x: 10, y: j, material: "concrete" });
          officeWalls.push({ x: 18, y: j, material: "concrete" });
        }
      }
      setWalls(officeWalls);
      setRouters([{ ...initialRouter, x: 4, y: 4 }]);
    } else if (presetName === "metal-cage") {
      const cageWalls: { x: number; y: number; material: MaterialType }[] = [];
      for (let i = 6; i <= 17; i++) {
        cageWalls.push({ x: i, y: 6, material: "metal" });
        cageWalls.push({ x: i, y: 17, material: "metal" });
      }
      for (let j = 7; j <= 16; j++) {
        cageWalls.push({ x: 6, y: j, material: "metal" });
        cageWalls.push({ x: 17, y: j, material: "metal" });
      }
      setWalls(cageWalls);
      setRouters([initialRouter]);
    }
  };

  const handleSolveInstant = () => {
    setIsRunning(false);
    const result = solveInstant(
      grid,
      config.method,
      config.omega,
      config.tolerance,
      config.maxIterations
    );

    setGrid(result.grid);
    setCurrentIteration(result.iterations);
    setCurrentError(result.finalError);
    setTimeMs(result.timeMs);
    setIsConverged(result.finalError < config.tolerance && result.iterations <= 100);
    setCurrentErrorHistory(result.errorHistory);

    const runId = Math.random().toString();
    const newRun: RunHistory = {
      id: runId,
      timestamp: new Date().toLocaleTimeString(),
      method: config.method,
      iterations: result.iterations,
      executionTimeMs: result.timeMs,
      finalError: result.finalError,
      converged: (result.finalError < config.tolerance) && result.iterations <= 100,
      omega: config.omega,
      tolerance: config.tolerance,
      gridSize: `${gridSize.rows}x${gridSize.cols}`,
      obstaclesCount: walls.length,
      errorHistory: result.errorHistory,
    };
    setHistory((prev) => [newRun, ...prev]);
  };

  const handleSingleStep = () => {
    setIsRunning(false);
    const stepResult = runSolverStep(grid, config.method, config.omega);
    setGrid(stepResult.grid);
    setCurrentIteration((prev) => prev + 1);
    setCurrentError(stepResult.error);
    setCurrentErrorHistory((prev) => [...prev, stepResult.error]);
  };

  // CAPA 6: ALGORITMO DE OPTIMIZACIÓN DE UBICACIÓN DE ENRUTADORES (K-Means y Muestreo Laplace)
  // Encuentra la ubicación espacial óptima del router utilizando muestreo acelerado de Laplace o clustering espacial K-Means para múltiples emisores balancedados.
  const findBestRouterLocation = (targetCount?: number) => {
    setIsOptimizing(true);
    setOptimizationResult(null);

    // Retardo simulado para simular una carga analítica profunda en el navegador
    setTimeout(() => {
      const rows = gridSize.rows;
      const cols = gridSize.cols;
      
      const numRoutersToOptimize = targetCount !== undefined 
        ? targetCount 
        : (routers.length > 0 ? routers.length : 1);

      const model = ROUTER_MODELS[selectedRouterModelId];
      const routerPower = model 
        ? Math.round(model.eirpDbm * (100 / 38))
        : 100;
      const routerSsid = model 
        ? `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_")
        : "WiFi_Optimizado";
      const routerFreq = model ? model.frequency : "2.4 GHz";

      // Función auxiliar para etiquetar la zona relativa de la cuadrícula
      const getZoneLabel = (r: number, c: number) => {
        const pctR = r / rows;
        const pctC = c / cols;
        const vert = pctR < 0.35 ? "Norte" : pctR > 0.65 ? "Sur" : "Centro";
        const horiz = pctC < 0.35 ? "Oeste" : pctC > 0.65 ? "Este" : "Centro";
        if (vert === "Centro" && horiz === "Centro") return "Zona Central";
        return `Zona ${vert}-${horiz}`;
      };

      if (numRoutersToOptimize === 1) {
        // --- CASO DE UN SOLO ROUTER (BÚSQUEDA EXHAUSTIVA SOBRE REJILLA SUBMUESTREADA) ---
        // Determinar paso de muestreo espacial (stride) según la densidad para evitar sobrecargar el hilo del navegador
        const step = rows <= 15 ? 1 : (rows <= 25 ? 2 : 3);
        const candidatesList: Array<{
          x: number;
          y: number;
          avgSignal: number;
          coveragePct: number;
          score: number;
          zoneName: string;
        }> = [];

        // Barrido por fuerza bruta optimizada evitando colisiones con paredes u obstáculos exteriores
        for (let r = 2; r < rows - 2; r += step) {
          for (let c = 2; c < cols - 2; c += step) {
            const isWall = walls.some(w => w.x === r && w.y === c);
            if (isWall) continue;

            const tempRouters = [{
              x: r,
              y: c,
              power: routerPower,
              ssid: routerSsid,
              frequency: routerFreq,
              modelId: selectedRouterModelId
            }];

            // Resolver instantáneamente un mini-problema de Dirichlet local para evaluar la cobertura estática de este candidato
            const tempInitialGrid = buildInitialGrid(rows, cols, tempRouters, walls, cellSize);
            const solveResult = solveInstant(tempInitialGrid, "sor", 1.25, 0.01, 25);

            let cellValsSum = 0;
            let coveredCellsCount = 0;
            let activeCellsCount = 0;

            // Recorrer el resultado para medir la potencia promedio y el porcentaje de área servida
            for (let i = 1; i < rows - 1; i++) {
              for (let j = 1; j < cols - 1; j++) {
                const testCell = solveResult.grid[i][j];
                if (testCell.type !== "wall") {
                  activeCellsCount++;
                  cellValsSum += testCell.val;
                  if (testCell.val >= 25) { // 25 representa un umbral aceptable (~ -55 dBm aprox)
                    coveredCellsCount++;
                  }
                }
              }
            }

            if (activeCellsCount === 0) activeCellsCount = 1;
            const avgSignal = cellValsSum / activeCellsCount;
            const coveragePct = (coveredCellsCount / activeCellsCount) * 100;
            
            // Ponderación de puntuación: 70% potencia media, 30% cobertura de área libre
            const score = avgSignal * 0.70 + coveragePct * 0.30;

            candidatesList.push({
              x: r,
              y: c,
              avgSignal: Math.round(avgSignal),
              coveragePct: Math.round(coveragePct),
              score: score,
              zoneName: getZoneLabel(r, c)
            });
          }
        }

        // Ordenar candidatos de mayor a menor puntuación obtenida
        candidatesList.sort((a, b) => b.score - a.score);

        if (candidatesList.length === 0) {
          setIsOptimizing(false);
          return;
        }

        const best = candidatesList[0];
        
        // Evitar que las recomendaciones sugeridas secundarias estén apiladas demasiado cerca entre sí
        const topCandidates: typeof candidatesList = [];
        for (const cand of candidatesList) {
          const tooClose = topCandidates.some(
            existing => Math.abs(existing.x - cand.x) + Math.abs(existing.y - cand.y) < 4
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
          isMultiRouter: false
        });
        setIsOptimizing(false);
      } else {
        // --- CASO DE MÚLTIPLES ROUTERS: ALGORITMO K-MEANS DE CLUSTERING ESPACIAL ---
        // 1. Filtrar todas las coordenadas de celdas que son espacio libre (aire habitable sin muros)
        const freeCells: Array<{ r: number; c: number }> = [];
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 1; c < cols - 1; c++) {
            const isWall = walls.some(w => w.x === r && w.y === c);
            if (!isWall) {
              freeCells.push({ r, c });
            }
          }
        }

        if (freeCells.length === 0) {
          setIsOptimizing(false);
          return;
        }

        // 2. Inicializar K centroides uniformemente distribuidos sobre las celdas disponibles
        const centroids: Array<{ r: number; c: number }> = [];
        for (let i = 0; i < numRoutersToOptimize; i++) {
          const idx = Math.floor((i + 0.5) * (freeCells.length / numRoutersToOptimize));
          centroids.push({ ...freeCells[idx] });
        }

        // 3. Ejecutar algoritmo de Lloyd para reubicar centroides en zonas balanceadas geométricamente
        for (let iter = 0; iter < 40; iter++) {
          const clusters: Array<Array<{ r: number; c: number }>> = Array.from(
            { length: numRoutersToOptimize },
            () => []
          );
          
          // Asignar cada celda de aire al centroide más cercano (distancia euclidiana al cuadrado)
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

          // Reparar centroides posicionándolos en el foco central (promedio aritmético de los clusters)
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
                c: Math.round(sumC / cls.length)
              };
            }
          }
        }

        // 4. Asegurar que los centroides resultantes no coincidan encima de un muro de atenuación
        const finalPositions: Array<{ r: number; c: number }> = [];
        for (let i = 0; i < numRoutersToOptimize; i++) {
          const cent = centroids[i];
          const isWall = walls.some(w => w.x === cent.r && w.y === cent.c);
          if (!isWall) {
            finalPositions.push(cent);
          } else {
            // Si cae en pared, buscar la celda libre más vecina que no haya sido ya ocupada por otro router
            let bestFreeCell = freeCells[0];
            let minDist = Infinity;
            for (const p of freeCells) {
              const dx = p.r - cent.r;
              const dy = p.c - cent.c;
              const dist = dx * dx + dy * dy;
              const alreadySelected = finalPositions.some(fp => fp.r === p.r && fp.c === p.c);
              if (dist < minDist && !alreadySelected) {
                minDist = dist;
                bestFreeCell = p;
              }
            }
            finalPositions.push(bestFreeCell);
          }
        }

        // 5. Configurar el grupo definitivo de routers optimizados
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
            zoneName: getZoneLabel(p.r, p.c)
          };
        });

        // 6. Efectuar simulación Laplace global instantánea para cuantificar métricas de uniformidad inalámbrica
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

        // Computar la desviación estándar del campo escalar para evaluar el índice de homogeneidad (Uniformidad)
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
          uniformityIndex: uniformityIndex
        });
        setIsOptimizing(false);
      }
    }, 1500);
  };

  // Reemplaza y aplica las coordenadas optimizadas sobre nuestro plano de red definitivo
  const applyBestRouterLocation = (customX?: number, customY?: number) => {
    if (!optimizationResult) return;

    let finalRouters: RouterConfig[] = [];

    if (optimizationResult.isMultiRouter && optimizationResult.optimizedRouters) {
      finalRouters = optimizationResult.optimizedRouters.map(r => ({
        x: r.x,
        y: r.y,
        power: r.power,
        ssid: r.ssid,
        frequency: r.frequency as "2.4 GHz" | "5 GHz",
        modelId: r.modelId
      }));
    } else {
      const model = ROUTER_MODELS[selectedRouterModelId];
      const routerPower = model 
        ? Math.round(model.eirpDbm * (100 / 38))
        : 100;
      const routerSsid = model 
        ? `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_")
        : "WiFi_Optimizado";
      const routerFreq = model ? model.frequency : "2.4 GHz";

      const finalX = customX !== undefined ? customX : optimizationResult.x;
      const finalY = customY !== undefined ? customY : optimizationResult.y;

      finalRouters = [{
        x: finalX,
        y: finalY,
        power: routerPower,
        ssid: routerSsid,
        frequency: routerFreq as "2.4 GHz" | "5 GHz",
        modelId: selectedRouterModelId
      }];
    }

    setRouters(finalRouters);
    
    // Ejecutar simulación inmediata autoconvergente para pintar las ondas de propagación coloreadas en el mapa
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
    setOptimizationResult(null); // Borrar la tarjeta de recomendación una vez aplicada con éxito
  };

  // Auth Operations
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginUsername.trim()) {
      setLoginError("Por favor ingrese un nombre de usuario.");
      return;
    }

    const cleanUsername = loginUsername.trim().toLowerCase();

    // Check if user exists in state
    let profile = profiles.find((p) => p.username === cleanUsername);

    if (!profile) {
      setLoginError("El usuario ingresado no está registrado en el portal. Seleccione 'Registrarse' si es una cuenta nueva.");
      return;
    }

    // Checking password
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

    // Check if user exists in state
    const alreadyExists = profiles.some((p) => p.username === cleanUsername);

    if (alreadyExists) {
      setLoginError("El usuario o código ingresado ya está registrado por otro estudiante o administrador.");
      return;
    }

    // Create the brand new profile
    const newProf: UserProfile = {
      username: cleanUsername,
      role: registerRole,
      password: registerPassword.trim(),
      savedNetworks: []
    };

    setProfiles((prev) => [...prev, newProf]);
    setRegisterSuccessMsg(`¡Registro Exitoso! Bienvenido ${cleanUsername}. Iniciando sesión y configurando entorno...`);

    // Automatic delayed redirect login
    setTimeout(() => {
      setCurrentUser(newProf);
      setRegisterUsername("");
      setRegisterPassword("");
      setRegisterRole("standard");
      setRegisterSuccessMsg("");
      setIsRegisterMode(false);
    }, 1800);
  };

  const handleLogout = () => {
    setIsRunning(false);
    setCurrentUser(null);
  };

  // Network Save / Load logic
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
      gridSize: { ...gridSize }
    };

    // Update active user profile
    const updatedUser = {
      ...currentUser,
      savedNetworks: [...currentUser.savedNetworks, newDesign]
    };

    setCurrentUser(updatedUser);

    // Sync in profiles list
    setProfiles((prev) => prev.map((p) => p.username === currentUser.username ? updatedUser : p));
    setNewNetworkName("");
    setSaveSuccessMsg("¡Diseño de cobertura guardado exitosamente!");
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  const handleLoadUserNetwork = (savedNet: UserSavedNetwork) => {
    setIsRunning(false);
    setGridSize(savedNet.gridSize);
    setWalls(savedNet.walls);
    setRouters(savedNet.routers);
  };

  const handleDeleteUserNetwork = (designId: string) => {
    if (!currentUser) return;
    const updatedNetworks = currentUser.savedNetworks.filter((n) => n.id !== designId);
    const updatedUser = {
      ...currentUser,
      savedNetworks: updatedNetworks
    };
    setCurrentUser(updatedUser);
    setProfiles((prev) => prev.map((p) => p.username === currentUser.username ? updatedUser : p));
  };

  // Computes summary reports values for the modal preview
  const generateReportAnalysisText = () => {
    if (history.length === 0) {
      return "No se registran simulaciones finalizadas en esta sesión para elaborar el dictamen técnico comparativo de algoritmos.";
    }

    const optimalRun = [...history].sort((a,b) => a.executionTimeMs - b.executionTimeMs)[0];
    const wallsCount = walls.length;

    return (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          En base a {history.length} simulaciones numéricas efectuadas sobre un mapa bidimensional de {gridSize.rows}x{gridSize.cols} ({gridSize.rows * gridSize.cols} nodos discretizados), se evaluó el comportamiento inalámbrico y la tasa de atenuación.
        </p>
        <p>
          El método de Sobre-Relajación Sucesiva (<strong>SOR</strong>) resolvió la malla en {optimalRun.iterations} iteraciones con un tiempo de ejecución de {optimalRun.executionTimeMs} ms (parámetro de aceleración &omega;={optimalRun.omega}). Esto valida la teoría matemática de los esquemas iterativos óptimos con factores de relajación crítica.
        </p>
        <p>
          <strong>Atenuación Física:</strong> Se registraron {wallsCount} nodos de obstrucción activa. 
          {wallsCount > 25 ? (
            " La densidad de atenuadores sobrepasa el rango estándar del aula, creando pozos de atenuación masiva por encima de -75dBm que restringen severamente la cobertura útil."
          ) : (
            " La distribución de pérdidas por obstáculos actuales permite un radio de cobertura bastante equilibrado sin zonas oscuras inalámbricas significativas de extremo a extremo."
          )}
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
      content += `ID | Método | Malla | Iteraciones | Tiempo CPU | Residuo Final | Estado de Convergencia\n`;
      content += `--------------------------------------------------------------------------------\n`;
      history.forEach((run, index) => {
        content += `${String(index + 1).padEnd(2)} | SOR (w=${run.omega})      | ${run.gridSize.padEnd(5)} | ${String(run.iterations).padEnd(11)} | ${String(run.executionTimeMs).padEnd(7)} ms | ${run.finalError.toExponential(3)} | ${run.converged ? "CONVERGIDO" : "FALLIDO"}\n`;
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

  // Styling helpers based on theme mode
  const bgMainClass = isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const bgCardClass = isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800 shadow-sm";
  const borderClass = isDarkMode ? "border-slate-800" : "border-slate-200";

  return (
    <div className={`min-h-screen transition-all duration-300 flex flex-col font-sans select-none relative ${bgMainClass}`} onMouseUp={handleCellMouseUp}>
      
      {/* Dynamic light effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Responsive Header bar */}
      <header className={`backdrop-blur-lg border-b sticky top-0 z-40 transition-colors duration-300 ${
        isDarkMode ? "bg-slate-950/70 border-slate-900" : "bg-white/80 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Signal className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600">
                  SimuNet WiFi
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Color Switch Button */}
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
                <div className={`hidden md:flex flex-col items-end text-xs leading-none`}>
                  <span className="font-bold">{currentUser.username}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5 font-bold">
                    {currentUser.role === "admin" ? "Administrador de Red" : "Estudiante Universitario"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  className={`p-2.5 rounded-2xl border cursor-pointer hover:bg-rose-50/10 hover:text-rose-500 transition-all ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
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

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full h-full relative">
        <AnimatePresence mode="wait">
          {!currentUser ? (
            // Authentication gateway centered overlay
            <motion.div
              key="auth-portal"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md mx-auto my-12"
            >
              <div className={`p-8 rounded-3xl border ${bgCardClass} shadow-xl relative overflow-hidden`}>
                {/* Decorative university badge styling */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-500/20">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black">Portal Académico SimuNet</h2>
                  <p className="text-xs text-slate-550 dark:text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                    Universidad de Pamplona - Calibración Inalámbrica e Ingeniería Numérica
                  </p>
                </div>

                {/* Authentication selector tabs */}
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
                  /* Standard Login Form */
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
                        height: loginUsername.trim().toLowerCase() !== "" ? "auto" : 0
                      }}
                      className="overflow-hidden space-y-4"
                    >
                      <div>
                        <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 block mb-1.5">
                          Contraseña de Cuenta {loginUsername.trim().toLowerCase() === "admin_pamplona" ? "(Demo: 'admin123')" : ""}
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
                  /* Create New User Account Form */
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
                              : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-700"
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
                              : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-700"
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

                {/* Account details helper for simulation evaluation */}
                <div className={`mt-6 pt-5 border-t text-slate-500 dark:text-slate-405 italic ${
                  isDarkMode ? "border-slate-850" : "border-slate-100"
                }`}>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-2 font-mono text-slate-550 dark:text-slate-400">
                    Acceso de Prueba Rápido:
                  </span>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border dark:border-slate-900">
                      <span className="text-slate-600 dark:text-slate-430 font-semibold">👤 Administrador Demo:</span>
                      <span className="font-mono text-[10px] font-bold text-slate-650 dark:text-slate-305">admin_pamplona / admin123</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // Full application workspace view
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              
              {/* Workspace Header */}
              <div className="lg:col-span-12 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Signal className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Simulador de Cobertura de Señal WiFi 2D</span>
                </div>
                <div className="text-[11px] font-bold text-slate-550 dark:text-slate-400 mr-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Usuario Activo: <span className="text-indigo-550 dark:text-indigo-400 font-extrabold">{currentUser.username}</span> ({currentUser.role === "admin" ? "Administrador" : "Estudiante"})</span>
                </div>
              </div>

              {/* Left column: Grid, visualizer card, formulas, documentation */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* 2D Interactive Floorplan Signal Grid */}
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

                {/* Solver convergence logs and plots */}
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
                />

                {/* Admin Audit system evaluation module */}
                {currentUser.role === "admin" && (
                  <div className={`p-6 rounded-3xl border transition-all duration-300 ${bgCardClass}`}>
                    <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 ${
                      isDarkMode ? "border-slate-850" : "border-slate-100"
                    }`}>
                      <div>
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <Shield className="w-5 h-5 text-indigo-500 animate-pulse" />
                          Auditoría de Sistemas y Análisis de Convergencia
                        </h3>
                        <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
                          Herramientas exclusivas del Administrador para certificar la estabilidad de la red y exportar el informe técnico oficial.
                        </p>
                      </div>

                      {history.length > 0 ? (
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="flex items-center gap-1.5 px-4_5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer transition"
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
                      <div className={`p-4 rounded-2xl border ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 mb-1">Cálculos Totales</div>
                        <div className="text-2xl font-black text-indigo-500">{history.length}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Simulaciones completadas</div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 mb-1">Malla Activa</div>
                        <div className="text-2xl font-black text-indigo-500">{gridSize.rows} &times; {gridSize.cols}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{gridSize.rows * gridSize.cols} nodos computacionales</div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 mb-1">Estatus del Sistema</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-xs font-bold text-emerald-500">Operativo</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Calibración abierta a 10⁻⁶</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Controls & User Personal Saved Networks space */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Simulation Solver Parameter control widget */}
                <ControlPanel
                  config={config}
                  setConfig={setConfig}
                  isRunning={isRunning}
                  onStart={() => setIsRunning(true)}
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
                  setGridSize={setGridSize}
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

                {/* User Personal Save Storage Compartment */}
                <div className={`p-6 rounded-3xl border transition-all duration-300 ${bgCardClass}`}>
                  <h3 className="text-base font-bold flex items-center gap-2 mb-3">
                    <Save className="w-5 h-5 text-indigo-500" />
                    Mis Diseños e Historial
                  </h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
                    Guarda la distribución actual de paredes y modula señales para recuperarlas cuando entres a tu sesión habitual de usuario.
                  </p>

                  {saveSuccessMsg && (
                    <div className="mb-3.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs text-center font-bold">
                      {saveSuccessMsg}
                    </div>
                  )}

                  {/* Save current design card form */}
                  <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 mb-4 ${
                    isDarkMode ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="text-[10px] uppercase tracking-wider text-slate-550 dark:text-slate-400 block font-bold">Guardar Red Activa</span>
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

                  {/* Saved design layouts tree items */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-550 dark:text-slate-400 block font-bold mb-2">Tus Redes Registradas ({currentUser.savedNetworks.length})</span>
                    {currentUser.savedNetworks.length === 0 ? (
                      <div className="p-4 border border-dashed rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                        Aún no tienes ningún mapa guardado. Diseña una red y haz clic en "Preservar Diseño" arriba.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {currentUser.savedNetworks.map((net) => (
                          <div
                            key={net.id}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                              isDarkMode ? "bg-slate-950/40 border-slate-850 hover:bg-slate-950" : "bg-slate-50 border-slate-150 hover:bg-slate-100/50"
                            }`}
                          >
                            <div className="flex flex-col min-w-0 max-w-[70%]">
                              <span className="font-bold truncate" title={net.name}>{net.name}</span>
                              <span className="text-[9px] text-slate-550 dark:text-slate-400 font-mono mt-0.5">{net.gridSize.rows}x{net.gridSize.cols} • {net.walls.length} paredes</span>
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

      {/* FOOTER BAR */}
      <footer className={`border-t transition-all mt-12 py-8 text-xs ${
        isDarkMode ? "border-slate-900 bg-slate-950 text-slate-500" : "border-slate-200 bg-white text-slate-500"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-550 dark:text-slate-350">Universidad de Pamplona</span>
            <span className="text-slate-300 dark:text-slate-800">|</span>
            <span>Estudios e Investigaciones de Métodos Numéricos Avanzados © 2026</span>
          </div>
          <div className="flex gap-4">
            <span title="Modelado diferencial central uniforme">Ecuación Rectora: ∇²u = 0</span>
            <span>•</span>
            <span title="Successive Over-Relaxation numerical model solver implementation">Estabilidad SOR</span>
          </div>
        </div>
      </footer>

      {/* REPORT MODAL (Only visual preview for printing / PDF compilation) */}
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
                    <h2 className="text-lg font-black text-slate-950 uppercase">AUDITORÍA DE TELECOMUNICACIONES</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Universidad de Pamplona • Informe Técnico Final</p>
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

              {/* PRINT SECTION (Designed specifically for window.print() and CSS print stylesheet) */}
              <div className="overflow-y-auto pr-1 space-y-6" id="technical-analysis-print">
                {/* Header Title with Official Pamplona design */}
                <div className="border hover:border-indigo-200 p-5 rounded-2xl bg-slate-50/50 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <div>
                      <span className="font-bold text-slate-550 block uppercase">Código de Reporte:</span>
                      <span className="font-bold text-slate-850">UP-SIMUNET-2026-{(Math.random() * 10000).toFixed(0)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-550 block uppercase">Fecha de Expedición:</span>
                      <span className="font-bold text-slate-850">{new Date().toLocaleString()}</span>
                    </div>
                  </div>

                  <hr className="border-slate-150" />

                  {/* Core summary metrics table */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-550 block">Evaluador Responsable</span>
                      <span className="text-xs font-black text-slate-800">{currentUser.username}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-550 block">Último Método</span>
                      <span className="text-xs font-black text-slate-850 uppercase">{config.method}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-550 block">Iteraciones Realizadas</span>
                      <span className="text-xs font-black text-slate-850">{currentIteration} itr</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-550 block">Residuo Obtenido</span>
                      <span className="text-xs font-black text-slate-850">{currentError < 1e-4 ? currentError.toExponential(3) : currentError.toFixed(5)}</span>
                    </div>
                  </div>
                </div>

                {/* Math Discretization block used in simulation execution */}
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-slate-405 tracking-wider mb-2">1. ESTRUCTURACIÓN MATEMÁTICA Y CONDICIONES FRONTERA</h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 font-mono text-[10.5px] leading-relaxed text-slate-700">
                    <p className="mb-2"><strong>Parámetros Operacionales de Malla:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Tolerancia estricta de Convergencia (&epsilon;): {config.tolerance}</li>
                      <li>Factor Optimal de Relajación ω: {config.omega}</li>
                      <li>Condición Dirichlet de Borde (Paredes Perimetrales): u = 0.0</li>
                      <li>Enrutadores Activos ({routers.length}): {routers.length > 0 ? routers.map(r => `${r.ssid} (${r.frequency})`).join(", ") : "Ninguno colocado"}</li>
                    </ul>
                  </div>
                </div>

                {/* Performance Table Log list inside official document */}
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-slate-405 tracking-wider mb-2">2. TABLA CRONOLÓGICA DE SIMULACIONES EN LA SESIÓN</h3>
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
                          <tr key={run.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                            <td className="py-2 px-3 font-bold text-indigo-650 uppercase">{run.method}</td>
                            <td className="py-2 px-3">{run.iterations}</td>
                            <td className="py-2 px-3">{run.executionTimeMs} ms</td>
                            <td className="py-2 px-3">{run.finalError < 1e-4 ? run.finalError.toExponential(2) : run.finalError.toFixed(5)}</td>
                            <td className="py-2 px-3">
                              {run.converged && run.iterations <= 100 ? (
                                <span className="text-emerald-650 font-bold">ESTABLE</span>
                              ) : (
                                <span className="text-rose-650 font-bold">
                                  {run.iterations > 100 ? "INESTABLE (>100)" : "INCONGRUENTE"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Report Analysis text derived from solver details */}
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-slate-405 tracking-wider mb-2">3. DETERMINACIÓN TÉCNICA E INFORME FINAL</h3>
                  {generateReportAnalysisText()}
                </div>

                {/* Signature box */}
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
                      {currentUser.role === "admin" ? "SISTEMA ADMINISTRADO" : "FALTA EVALUACIÓN"}
                    </div>
                    <span className="mt-1 block">Aprobación de Métodos de Laplace</span>
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
