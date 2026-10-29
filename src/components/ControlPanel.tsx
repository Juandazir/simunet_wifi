// Importa React y sus hooks fundamentales para manejar estados locales, referencias al DOM y efectos reactivos
import React, { useState, useRef, useEffect } from "react";
// Importa las interfaces tipadas de métodos numéricos, materiales, configuración y resultados de optimización (Capa 1)
import {
  SolverMethod,
  MaterialType,
  SimulationConfig,
  RouterConfig,
  OptimizationResult,
} from "../types";
// Importa el catálogo de materiales dieléctricos, modelos de routers y el motor de resolución desde la Capa 2
import { MATERIALS, ROUTER_MODELS, buildInitialGrid, solveInstant } from "../controlador";
// Importa la función de visión artificial por luminancia ITU-R BT.601 para digitalizar planos (Capa 3)
import { traducirImagenAMatriz } from "../traduccion";
// Importa los iconos vectoriales utilizados en los botones de simulación, herramientas y selectores
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Sliders,
  Layout,
  RefreshCw,
  Layers,
  Cpu,
  Eraser,
  Upload,
  CheckCircle2,
  Binary,
  FileSpreadsheet,
  Radio,
  Maximize2,
  MapPin,
  Award,
  Move,
} from "lucide-react";

// Propiedades de entrada recibidas por el panel lateral de controles ControlPanel
interface ControlPanelProps {
  config: SimulationConfig;                                                                   // Configuración actual del solucionador numérico
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;                          // Actualizador reactivo de la configuración numérica
  isRunning: boolean;                                                                         // Indica si la animación iterativa paso a paso está activa
  onStart: () => void;                                                                        // Inicia la animación paso a paso del método numérico
  onPause: () => void;                                                                        // Pausa la animación iterativa en curso
  onSolveInstant: () => void;                                                                 // Resuelve de inmediato hasta alcanzar la convergencia estacionaria
  onSingleStep: () => void;                                                                   // Avanza exactamente una iteración (+1 paso k)
  onReset: () => void;                                                                        // Reinicia el potencial escalar de la malla al estado inicial
  onClearWalls: () => void;                                                                   // Elimina todos los obstáculos dieléctricos del recinto
  selectedTool: "router" | MaterialType | "eraser" | "move";                                  // Herramienta de dibujo o edición actualmente seleccionada
  setSelectedTool: (tool: "router" | MaterialType | "eraser" | "move") => void;               // Cambia la herramienta de edición activa
  currentIteration: number;                                                                   // Contador de iteración actual k
  currentError: number;                                                                       // Valor actual de la norma infinito del error residual
  timeMs: number;                                                                             // Tiempo de cómputo acumulado en milisegundos
  onLoadPreset: (presetName: string) => void;                                                 // Carga un escenario arquitectónico predefinido
  gridSize: { rows: number; cols: number };                                                   // Dimensiones discretas N_y × N_x de la malla
  setGridSize: (size: { rows: number; cols: number }) => void;                                // Actualiza la resolución de nodos de la malla
  isDarkMode: boolean;                                                                        // Estado activo del modo visual oscuro o claro
  isAdmin: boolean;                                                                           // Indica si el usuario actual posee rol de administrador
  walls: { x: number; y: number; material: MaterialType }[];                                  // Lista de muros dieléctricos presentes en la malla
  setWalls: React.Dispatch<React.SetStateAction<{ x: number; y: number; material: MaterialType }[]>>; // Actualiza la lista de muros (usado por el digitalizador)
  selectedRouterModelId: string;                                                              // ID del modelo comercial de router activo en el catálogo
  setSelectedRouterModelId: (id: string) => void;                                             // Cambia el perfil de router comercial seleccionado
  cellSize: number;                                                                           // Escala espacial física h en metros por celda
  setCellSize: (size: number) => void;                                                        // Modifica el tamaño físico en metros de cada celda
  onFindBestRouterPlace: (targetCount?: number) => void;                                      // Ejecuta el algoritmo de optimización espacial (1 o K routers)
  isOptimizing: boolean;                                                                      // Indica si el barrido de optimización espacial está en curso
  optimizationResult: OptimizationResult | null;                                              // Resultado estructurado de la optimización espacial
  onApplyBestRouterPlace: (customX?: number, customY?: number) => void;                       // Aplica en la malla la ubicación óptima seleccionada
  routers: RouterConfig[];                                                                    // Arreglo de transmisores activos actualmente en la malla
  onClearRouters: () => void;                                                                 // Elimina todos los routers emisores del plano
}

/**
 * Componente lateral de control que agrupa:
 * 1. Panel de ejecución numérica (Animar, Instantáneo, Iteración +1, Resetear, Quitar Muros/Routers).
 * 2. Motor de optimización espacial de cobertura (búsqueda exhaustiva para 1 router y K-Means para K routers).
 * 3. Selector de hardware transmisor comercial (PIRE, potencia Tx, ganancia, frecuencia y longitud de onda λ).
 * 4. Control de paso espacial h (escala métrica en metros por celda).
 * 5. Paleta de herramientas y materiales dieléctricos (ITU-R P.2040).
 * 6. Digitalizador de planos arquitectónicos (conversión Imagen -> Matriz por luminancia ITU-R BT.601).
 * 7. Sintonizador de métodos numéricos (Jacobi, Gauss-Seidel, SOR) y buscador automático del ω óptimo.
 */
export default function ControlPanel({
  config,
  setConfig,
  isRunning,
  onStart,
  onPause,
  onSolveInstant,
  onSingleStep,
  onReset,
  onClearWalls,
  selectedTool,
  setSelectedTool,
  onLoadPreset,
  gridSize,
  setGridSize,
  isDarkMode,
  walls,
  setWalls,
  selectedRouterModelId,
  setSelectedRouterModelId,
  cellSize,
  setCellSize,
  onFindBestRouterPlace,
  isOptimizing,
  optimizationResult,
  onApplyBestRouterPlace,
  routers,
  onClearRouters,
}: ControlPanelProps) {
  // Cantidad objetivo de routers K a distribuir mediante el optimizador espacial
  const [numRoutersToOpt, setNumRoutersToOpt] = useState<number>(
    routers.length > 0 ? routers.length : 1
  );
  // Material dieléctrico que se asignará por defecto a los trazos oscuros detectados al digitalizar un plano
  const [uploadWallMaterial, setUploadWallMaterial] = useState<MaterialType>("concrete");

  // Sincroniza el selector de cantidad de routers a optimizar cuando el usuario agrega o quita routers en la malla
  useEffect(() => {
    if (routers.length > 0) {
      setNumRoutersToOpt(routers.length);
    }
  }, [routers.length]);

  // Umbral de luminancia ITU-R BT.601 (0 a 255) para discriminar muros frente al fondo blanco en el escáner
  const [sensitivity, setSensitivity] = useState<number>(160);
  // Mensaje temporal de confirmación tras digitalizar un plano arquitectónico con éxito
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string>("");
  // Estado visual para resaltar la zona de arrastrar y soltar (Drag & Drop) al acercar un archivo de imagen
  const [dragActive, setDragActive] = useState<boolean>(false);
  // Referencia al elemento <input type="file"> oculto para disparar el selector de archivos del sistema
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bandera que indica si se está ejecutando el barrido espectral para hallar el factor ω óptimo de SOR
  const [isOptimizingOmega, setIsOptimizingOmega] = useState(false);
  // Lista ordenada con los resultados de convergencia obtenidos para cada valor candidato de ω probado
  const [omegaResults, setOmegaResults] = useState<Array<{
    omega: number;
    iterations: number;
    error: number;
    converged: boolean;
  }> | null>(null);
  // Mejor valor numérico del parámetro de relajación ω encontrado para la geometría actual del recinto
  const [bestOmegaFound, setBestOmegaFound] = useState<number | null>(null);

  /**
   * Realiza un barrido paramétrico experimental sobre el factor de sobre-relajación ω ∈ [1.0, 1.9]
   * resolviendo la malla actual con SOR para cada valor e identificando aquel que minimiza las iteraciones.
   */
  const handleOptimizeOmega = () => {
    // Activa el indicador de carga y limpia resultados previos
    setIsOptimizingOmega(true);
    setOmegaResults(null);
    setBestOmegaFound(null);

    // Ejecuta el barrido de forma asíncrona para permitir el renderizado de la animación de búsqueda
    setTimeout(() => {
      try {
        // Arreglo acumulador de métricas para cada ω evaluado
        const results: Array<{
          omega: number;
          iterations: number;
          error: number;
          converged: boolean;
        }> = [];

        // Conjunto discreto de factores de relajación ω dentro del intervalo convergente de Kahan (1.0 a 1.9)
        const omegasToTest = [
          1.0, 1.1, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85,
          1.9,
        ];
        // Toma la tolerancia ε actual y asegura un techo mínimo de 400 iteraciones de prueba
        const testTolerance = config.tolerance;
        const testMaxIterations = Math.max(config.maxIterations, 400);

        // Evalúa secuencialmente cada candidato ω sobre una copia fresca de la malla actual
        for (const w of omegasToTest) {
          const testInitialGrid = buildInitialGrid(
            gridSize.rows,
            gridSize.cols,
            routers,
            walls,
            cellSize
          );
          const solveResult = solveInstant(
            testInitialGrid,
            "sor",
            w,
            testTolerance,
            testMaxIterations
          );

          // Determina si el método alcanzó la tolerancia antes de agotar el máximo de iteraciones
          const converged = solveResult.finalError < testTolerance;
          results.push({
            omega: w,
            iterations: solveResult.iterations,
            error: solveResult.finalError,
            converged,
          });
        }

        // Ordena los candidatos: prioriza los que convergieron en menos iteraciones; en caso de empate, menor error
        const sorted = [...results].sort((a, b) => {
          if (a.converged && !b.converged) return -1;
          if (!a.converged && b.converged) return 1;
          if (a.converged && b.converged) {
            return a.iterations - b.iterations;
          }
          return a.error - b.error;
        });

        // Selecciona el ω ganador en la primera posición de la tabla ordenada
        const best = sorted[0];
        setOmegaResults(sorted);
        setBestOmegaFound(best.omega);

        // Actualiza automáticamente la configuración activa para usar el método SOR con el ω óptimo hallado
        setConfig((prev) => ({
          ...prev,
          method: "sor",
          omega: best.omega,
        }));
      } catch (err) {
        console.error("Error optimizando omega:", err);
      } finally {
        setIsOptimizingOmega(false);
      }
    }, 1205);
  };

  /**
   * Actualiza simultáneamente el número de filas y columnas para mantener una malla cuadrada N × N.
   */
  const handleGridSizeChange = (size: number) => {
    setGridSize({ rows: size, cols: size });
  };

  /**
   * Genera programáticamente en un lienzo HTML5 Canvas uno de los tres planos arquitectónicos de prueba
   * ('apartment', 'classroom' o 'hosp') y lo envía al digitalizador de píxeles para convertirlo en muros.
   */
  const drawAndAnalyzePresetBlueprint = (presetType: string) => {
    // Define un lienzo sintético de 300×300 píxeles
    const w = 300;
    const h = 300;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Pinta el fondo blanco puro (luminancia Y = 255) y configura trazos oscuros (luminancia Y < 40)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 14;

    if (presetType === "apartment") {
      // Marco perimetral del apartamento
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Muro divisorio horizontal central
      ctx.beginPath();
      ctx.moveTo(10, h / 2);
      ctx.lineTo(w - 10, h / 2);
      ctx.stroke();

      // Tabique vertical superior con vano de puerta
      ctx.beginPath();
      ctx.moveTo(w / 3, 10);
      ctx.lineTo(w / 3, h / 2 - 40);
      ctx.stroke();

      // Tabique vertical inferior con apertura de paso
      ctx.beginPath();
      ctx.moveTo((w * 2) / 3, h / 2 + 40);
      ctx.lineTo((w * 2) / 3, h - 10);
      ctx.stroke();

      // Columna central de carga
      ctx.fillRect(w / 2 - 10, h / 2 - 40, 20, 80);
    } else if (presetType === "classroom") {
      // Marco exterior del laboratorio
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // División de oficina docente y sala de cómputo
      ctx.beginPath();
      ctx.moveTo(10, h / 3);
      ctx.lineTo(w - 100, h / 3);
      ctx.stroke();

      // Cuarto central de servidores (rack aislado)
      ctx.strokeRect(w / 2 - 40, h / 2 - 40, 80, 80);
    } else if (presetType === "hosp") {
      // Cerramiento exterior de planta hospitalaria
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Corredor longitudinal central
      ctx.beginPath();
      ctx.moveTo(10, h / 2 - 15);
      ctx.lineTo(w - 10, h / 2 - 15);
      ctx.moveTo(10, h / 2 + 15);
      ctx.lineTo(w - 10, h / 2 + 15);
      ctx.stroke();

      // Consultorios superiores
      ctx.beginPath();
      ctx.moveTo(w / 3, 10);
      ctx.lineTo(w / 3, h / 2 - 15);
      ctx.moveTo((w * 2) / 3, 10);
      ctx.lineTo((w * 2) / 3, h / 2 - 15);
      ctx.stroke();

      // Pabellón inferior dividido
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 + 15);
      ctx.lineTo(w / 2, h - 10);
      ctx.stroke();
    }

    // Invoca el escáner de submuestreo y umbralización sobre el plano recién dibujado
    runPixelScan(canvas, uploadWallMaterial, sensitivity);
  };

  /**
   * Submuestrea cualquier imagen/canvas a la resolución exacta de la malla (cols × rows)
   * y delega en la Capa 3 (`traducirImagenAMatriz`) la extracción de coordenadas de muros.
   */
  const runPixelScan = (canvas: HTMLCanvasElement, wallMat: MaterialType, thresh: number) => {
    // Crea un lienzo auxiliar con el número exacto de columnas y filas de la malla discreta
    const scanCanvas = document.createElement("canvas");
    scanCanvas.width = gridSize.cols;
    scanCanvas.height = gridSize.rows;
    const scanCtx = scanCanvas.getContext("2d");
    if (!scanCtx) return;

    // Proyecta la imagen original escalándola a las dimensiones de la rejilla N_x × N_y
    scanCtx.drawImage(canvas, 0, 0, gridSize.cols, gridSize.rows);
    // Extrae el buffer binario RGBA (Uint8ClampedArray) de todos los píxeles
    const imgData = scanCtx.getImageData(0, 0, gridSize.cols, gridSize.rows);

    // Convierte los píxeles cuya luminancia Y sea menor a 'thresh' en celdas de muro con el material elegido
    const newScannedWalls = traducirImagenAMatriz(
      imgData.data,
      gridSize.rows,
      gridSize.cols,
      thresh,
      wallMat
    );

    // Actualiza el estado de muros de la simulación e informa al usuario la cantidad de nodos detectados
    setWalls(newScannedWalls);
    setScanSuccessMsg(
      `¡Plano convertido! Encontrados ${newScannedWalls.length} bloques de muro (${MATERIALS[wallMat].name}) en la matriz.`
    );

    // Oculta automáticamente el mensaje de éxito después de 4.5 segundos
    setTimeout(() => {
      setScanSuccessMsg("");
    }, 4500);
  };

  /**
   * Procesa un archivo de imagen subido desde el selector de archivos del navegador
   * y lo digitaliza en la malla de diferencias finitas.
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Lee el archivo local como DataURL en Base64 mediante FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Dibuja la imagen cargada sobre un lienzo normalizado de 400×400 con fondo blanco
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 400;
        tempCanvas.height = 400;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.fillStyle = "#ffffff";
          tempCtx.fillRect(0, 0, 400, 400);
          tempCtx.drawImage(img, 0, 0, 400, 400);
          runPixelScan(tempCanvas, uploadWallMaterial, sensitivity);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  /**
   * Controla los eventos de arrastre (dragenter, dragover, dragleave) sobre la zona de carga de planos.
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  /**
   * Procesa el archivo de imagen soltado directamente (Drop) sobre la zona del digitalizador.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 400;
          tempCanvas.height = 400;
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.fillStyle = "#ffffff";
            tempCtx.fillRect(0, 0, 400, 400);
            tempCtx.drawImage(img, 0, 0, 400, 400);
            runPixelScan(tempCanvas, uploadWallMaterial, sensitivity);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Clases reutilizables de Tailwind CSS adaptadas al tema oscuro o claro
  const cardBgClass = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-800 shadow-sm";

  const itemBgClass = isDarkMode
    ? "bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-slate-100"
    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  const formBgClass = isDarkMode
    ? "bg-slate-950/60 border-slate-800/80"
    : "bg-slate-50 border-slate-100 shadow-inner";

  const selectClass = isDarkMode
    ? "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-100 focus:ring-indigo-600 focus:border-indigo-600"
    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm";

  return (
    <div
      className={`flex flex-col gap-4.5 rounded-3xl border p-5 transition-all duration-300 ${cardBgClass}`}
    >
      {/* Cabecera del Panel de Controles */}
      <div className={`border-b pb-3 ${isDarkMode ? "border-slate-850" : "border-slate-100"}`}>
        <h3 className="text-base font-extrabold flex items-center gap-1.5 leading-none">
          <Sliders className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
          Controles de Simulación
        </h3>
        <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-1 leading-relaxed">
          Diseña el recinto, configura las propiedades dieléctricas y resuelve numéricamente el
          campo electromagnético.
        </p>
      </div>

      {/* Grupo 1: Panel de Acción Directa (Ejecución animada, instantánea, paso a paso y limpieza) */}
      <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border dark:border-slate-850">
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500/90 dark:text-indigo-400 block mb-1">
          Panel de Acción Directa
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {isRunning ? (
            <button
              onClick={onPause}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition hover:scale-[1.02] cursor-pointer text-[11px]"
              id="btn_pause"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pausar
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/15 transition hover:scale-[1.02] cursor-pointer text-[11px]"
              id="btn_start"
            >
              <Play className="w-3.5 h-3.5 fill-current animate-pulse" />
              Animar Finito
            </button>
          )}

          <button
            onClick={onSolveInstant}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition hover:scale-[1.02] cursor-pointer text-[11px] shadow-sm"
            id="btn_solve_instant"
          >
            <FastForward className="w-3.5 h-3.5" />
            Instantáneo (Rápido)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onSingleStep}
            disabled={isRunning}
            className={`flex items-center justify-center gap-1 px-3 py-1.8 disabled:opacity-50 rounded-xl transition cursor-pointer text-[11px] border ${itemBgClass}`}
            id="btn_single_step"
          >
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            Iteración +1
          </button>

          <button
            onClick={onReset}
            className={`flex items-center justify-center gap-1 px-3 py-1.8 rounded-xl transition cursor-pointer text-[11px] border ${itemBgClass}`}
            id="btn_reset"
          >
            <RotateCcw className="w-3 h-3" />
            Resetear Señal
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onClearWalls}
            className={`py-1.8 rounded-xl text-center text-[10px] font-bold shadow-sm transition cursor-pointer border ${itemBgClass} hover:border-rose-300 dark:hover:border-rose-950 hover:bg-rose-500/5`}
            id="btn_clear_walls"
          >
            Quitar Muros ({walls.length})
          </button>
          <button
            onClick={onClearRouters}
            className={`py-1.8 rounded-xl text-center text-[10px] font-bold shadow-sm transition cursor-pointer border ${itemBgClass} hover:border-emerald-300 dark:hover:border-emerald-950 hover:bg-emerald-500/5`}
            id="btn_clear_routers"
          >
            Quitar Routers ({routers.length})
          </button>
        </div>
      </div>

      {/* Grupo 2: Optimización Espacial de Cobertura (1 Router o K-Means Multi-Router) */}
      <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/20 shadow-sm animate-fade-in">
        <label className="text-[10px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Binary className="w-3.5 h-3.5 text-amber-500 shadow-sm" />
          Distribución Uniforme de Señal
        </label>

        <p className="text-[9px] text-slate-550 dark:text-slate-400 leading-normal">
          Calcula la distribución espacial óptima según el número de transmisores deseados mediante
          evaluación de condiciones de Dirichlet y partición geométrica K-Means.
        </p>

        {/* Selector de cantidad de routers a optimizar (K ∈ [1, 6]) */}
        <div className="flex items-center justify-between gap-1 bg-amber-500/5 dark:bg-amber-950/25 p-1 px-2 rounded-xl text-[10px] border border-amber-550/10">
          <span className="font-semibold text-amber-700 dark:text-amber-300 font-sans">
            Enrutadores a distribuir:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNumRoutersToOpt((prev) => Math.max(1, prev - 1))}
              className="p-1 px-1.5 rounded-lg bg-slate-200/50 dark:bg-slate-800 hover:bg-slate-300 pointer-events-auto cursor-pointer font-bold disabled:opacity-40 text-slate-600 dark:text-slate-300 text-[10px] transition"
              disabled={numRoutersToOpt <= 1 || isOptimizing}
            >
              -
            </button>
            <span className="font-mono font-black text-amber-800 dark:text-amber-200 text-[11px] w-4 text-center">
              {numRoutersToOpt}
            </span>
            <button
              type="button"
              onClick={() => setNumRoutersToOpt((prev) => Math.min(6, prev + 1))}
              className="p-1 px-1.5 rounded-lg bg-slate-200/50 dark:bg-slate-800 hover:bg-slate-300 pointer-events-auto cursor-pointer font-bold disabled:opacity-40 text-slate-600 dark:text-slate-300 text-[10px] transition"
              disabled={numRoutersToOpt >= 6 || isOptimizing}
            >
              +
            </button>
          </div>
        </div>

        {isOptimizing ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold bg-amber-500/20 text-amber-500 cursor-not-allowed text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Optimizando y nivelando señal...
          </button>
        ) : (
          <button
            onClick={() => onFindBestRouterPlace(numRoutersToOpt)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white transition hover:scale-[1.01] cursor-pointer text-xs shadow-md shadow-amber-500/10"
          >
            <Binary className="w-3.5 h-3.5" />
            {numRoutersToOpt > 1
              ? `Distribuir ${numRoutersToOpt} Routers`
              : "Calcular Posición Óptima"}
          </button>
        )}

        {/* Tarjeta de resultados cuando el optimizador ha finalizado */}
        {optimizationResult && (
          <div className="mt-1 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 dark:bg-amber-950/30 flex flex-col gap-2.5 text-[10px] animate-fade-in">
            {optimizationResult.isMultiRouter ? (
              // Vista de resultados para sistema distribuido multi-router (K >= 2)
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-amber-500/10 pb-1 flex-wrap">
                  <span className="font-bold text-amber-700 dark:text-amber-350 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                    Distribución Uniforme Calculada
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800 font-mono text-[9px]">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[8px] uppercase">Señal Promedio</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-[10px]">
                      {optimizationResult.avgSignal}%
                    </strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[8px] uppercase">Área Cobertura</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                      {optimizationResult.coveragePct}%
                    </strong>
                  </div>
                </div>

                {/* Barra de progreso del Índice de Uniformidad Global */}
                <div className="p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 uppercase text-[8.5px]">
                      Índice de Uniformidad Global (I.U.):
                    </span>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-[10px]">
                      {optimizationResult.uniformityIndex}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${optimizationResult.uniformityIndex || 50}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-tight">
                    {Number(optimizationResult.uniformityIndex) > 80
                      ? "Excelente equilibrio: la señal está sumamente equilibrada en todo el plano."
                      : "Distribución equilibrada óptima calculada en base a las particiones de la sala."}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                    Ubicaciones Coordenadas Recomendadas:
                  </span>
                  <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto pr-0.5">
                    {optimizationResult.optimizedRouters?.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-1.5 px-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200/55 dark:border-slate-800/80"
                      >
                        <span className="font-bold text-slate-600 dark:text-slate-350">
                          Router #{idx + 1} ({r.zoneName})
                        </span>
                        <span className="font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded-full text-[8.5px]">
                          [{r.x}, {r.y}]
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onApplyBestRouterPlace()}
                  className="w-full py-2 mt-1 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aplicar Sistema Distribuido Completo
                </button>
              </div>
            ) : (
              // Vista de resultados para optimización de 1 único router (Top candidatas)
              <div>
                <div className="flex justify-between items-center border-b border-amber-500/10 pb-1 flex-wrap">
                  <span className="font-bold text-amber-700 dark:text-amber-350 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Análisis de Ubicación Completado
                  </span>
                  <span className="font-mono text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                    {optimizationResult.candidatesTested} puntos testeados
                  </span>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                    Comparativa de Posiciones Candidatas:
                  </span>

                  <div className="flex flex-col gap-2">
                    {optimizationResult.topCandidates &&
                      optimizationResult.topCandidates.map((cand, idx) => {
                        const isAbsoluteBest = idx === 0;
                        return (
                          <div
                            key={`${cand.x}-${cand.y}`}
                            className={`p-2 rounded-xl border transition-all ${
                              isAbsoluteBest
                                ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold flex items-center gap-1 text-[9.5px]">
                                {isAbsoluteBest ? (
                                  <Award className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                )}
                                <span
                                  className={
                                    isAbsoluteBest
                                      ? "text-amber-600 dark:text-amber-400 font-extrabold"
                                      : "text-slate-600 dark:text-slate-300 font-bold"
                                  }
                                >
                                  {idx + 1}º Opción ({cand.zoneName})
                                </span>
                              </span>
                              <span className="font-mono font-bold text-[8.5px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded-full">
                                [{cand.x}, {cand.y}]
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500 dark:text-slate-400 font-mono mb-1">
                              <div className="flex items-center gap-1">
                                <span>Señal Promedio:</span>
                                <strong className="text-slate-800 dark:text-white font-bold">
                                  {cand.avgSignal}%
                                </strong>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Cobertura (&ge;-75 dBm):</span>
                                <strong className="text-emerald-500 font-bold">
                                  {cand.coveragePct}%
                                </strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isAbsoluteBest ? "bg-amber-500" : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(10, cand.score))}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                                Puntaje: {Math.round(cand.score)}/100
                              </span>
                            </div>

                            <button
                              onClick={() => onApplyBestRouterPlace(cand.x, cand.y)}
                              className={`w-full py-1 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                isAbsoluteBest
                                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow"
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {isAbsoluteBest
                                ? "Aplicar Posición Ideal (Recom.)"
                                : "Aplicar Posición Alternativa"}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grupo 3: Selector de Hardware Transmisor Comercial y Ficha de Radiofrecuencia */}
      <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-indigo-50/20 dark:bg-slate-950/25 border border-indigo-100/30 dark:border-slate-850">
        <label className="text-[10px] uppercase font-black tracking-wider text-indigo-500/90 dark:text-indigo-400 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-indigo-500" />
          Enrutador Comercial Activo
        </label>
        <select
          value={selectedRouterModelId}
          onChange={(e) => setSelectedRouterModelId(e.target.value)}
          className={`w-full px-2.5 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-505 focus:outline-none transition ${selectClass}`}
          id="select_router_model"
        >
          {Object.entries(ROUTER_MODELS).map(([id, r]) => (
            <option key={id} value={id}>
              {r.name} ({r.frequency}) • Tx {r.txPowerDbm}dBm
            </option>
          ))}
        </select>

        {/* Ficha de especificaciones electromagnéticas del transmisor activo */}
        <div className="p-2 border rounded-xl bg-white/50 dark:bg-slate-900/40 text-[10px] flex flex-col gap-1 text-slate-500 font-medium border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {ROUTER_MODELS[selectedRouterModelId].brand} •{" "}
              {ROUTER_MODELS[selectedRouterModelId].model}
            </span>
            <span className="font-mono text-[9px] text-indigo-500 bg-indigo-500/10 px-1 py-0.5 rounded leading-none font-bold">
              {ROUTER_MODELS[selectedRouterModelId].standard}
            </span>
          </div>
          <div className="flex justify-between font-mono text-[9px] mt-0.5 border-t border-dashed border-slate-200 dark:border-slate-800 pt-1">
            <span>
              Banda:{" "}
              <strong className="text-slate-600 dark:text-slate-300">
                {ROUTER_MODELS[selectedRouterModelId].frequency}
              </strong>
            </span>
            <span>
              Potencia Tx:{" "}
              <strong className="text-slate-600 dark:text-slate-300">
                {ROUTER_MODELS[selectedRouterModelId].txPowerDbm} dBm
              </strong>
            </span>
          </div>
          <div className="flex justify-between font-mono text-[9px]">
            <span>
              Ganancia:{" "}
              <strong className="text-slate-600 dark:text-slate-300">
                +{ROUTER_MODELS[selectedRouterModelId].gainDbi} dBi
              </strong>
            </span>
            <span>
              EIRP Total:{" "}
              <strong className="text-indigo-500 font-bold">
                {ROUTER_MODELS[selectedRouterModelId].eirpDbm} dBm
              </strong>
            </span>
          </div>
          <p className="text-[9px] text-slate-550 dark:text-slate-400 leading-normal mt-1 italic">
            &quot;{ROUTER_MODELS[selectedRouterModelId].description}&quot;
          </p>
        </div>
      </div>

      {/* Grupo 4: Control del Paso Espacial h (Escala Física de Celdas en metros) */}
      <div className="flex flex-col gap-1 p-3 rounded-2xl bg-emerald-50/20 dark:bg-slate-950/25 border border-emerald-100/30 dark:border-slate-850">
        <label className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Maximize2 className="w-3.5 h-3.5" />
            Escala Física de Celdas
          </span>
          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none">
            {cellSize} metros
          </span>
        </label>

        <input
          type="range"
          min="0.1"
          max="2.5"
          step="0.05"
          value={cellSize}
          onChange={(e) => setCellSize(parseFloat(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer my-1 text-emerald-550"
          id="slider_cell_size"
        />
        <div className="flex justify-between text-[8px] font-mono text-slate-500 dark:text-slate-400 leading-none">
          <span>0.1m (Micro-resolución)</span>
          <span>1.0m (Escalado Medio)</span>
          <span>2.5m (Largo Rango)</span>
        </div>
        <p className="text-[9px] text-slate-550 dark:text-slate-400 leading-normal mt-1">
          La propagación de la señal se debilita a mayor distancia física, modelando con rigor un
          espacio real.
        </p>
      </div>

      {/* Grupo 5: Paleta de Herramientas Interactivas y Materiales Dieléctricos (ITU-R P.2040) */}
      <div>
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          Herramientas de Lápiz y Pinceles
        </h4>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setSelectedTool("router")}
            className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg border transition text-left cursor-pointer ${
              selectedTool === "router"
                ? isDarkMode
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-400 shadow-sm font-bold"
                  : "bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm font-bold"
                : itemBgClass
            }`}
            id="tool_router"
          >
            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-emerald-500 text-white font-mono text-[8px] font-bold shrink-0">
              R
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold truncate">Router</span>
              <span className="text-[7.5px] text-slate-500 dark:text-slate-400 leading-none truncate">
                Fuente
              </span>
            </div>
          </button>

          <button
            onClick={() => setSelectedTool("move")}
            className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg border transition text-left cursor-pointer ${
              selectedTool === "move"
                ? isDarkMode
                  ? "bg-indigo-950/40 border-indigo-800 text-indigo-400 shadow-sm font-bold"
                  : "bg-indigo-50 border-indigo-250 text-indigo-700 shadow-sm font-bold"
                : itemBgClass
            }`}
            id="tool_move"
          >
            <Move className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold truncate">Mover</span>
              <span className="text-[7.5px] text-slate-500 dark:text-slate-400 leading-none truncate">
                Arrastrar
              </span>
            </div>
          </button>

          <button
            onClick={() => setSelectedTool("eraser")}
            className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg border transition text-left cursor-pointer ${
              selectedTool === "eraser"
                ? isDarkMode
                  ? "bg-rose-950/40 border-rose-800 text-rose-400 shadow-sm font-bold"
                  : "bg-rose-50 border-rose-250 text-rose-700 shadow-sm font-bold"
                : itemBgClass
            }`}
            id="tool_eraser"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold truncate">Borrador</span>
              <span className="text-[7.5px] text-slate-500 dark:text-slate-400 leading-none truncate">
                Limpiar
              </span>
            </div>
          </button>
        </div>

        {/* Catálogo de materiales constructivos con pérdida en dB y permitividad ε_r */}
        <div className="mt-2">
          <span className="text-[9px] text-slate-550 dark:text-slate-400 font-extrabold mb-1 block">
            Materiales de Construcción Manual:
          </span>
          <div className="grid grid-cols-4 gap-1">
            {Object.values(MATERIALS).map((material) => {
              if (material.id === "air") return null;
              const isSelected = selectedTool === material.id;

              return (
                <button
                  key={material.id}
                  id={`tool_mat_${material.id}`}
                  onClick={() => setSelectedTool(material.id)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition gap-0.5 cursor-pointer ${
                    isSelected
                      ? isDarkMode
                        ? "bg-indigo-950 border-indigo-700 text-indigo-400 font-bold shadow-sm"
                        : "bg-slate-900 border-slate-900 text-white font-bold shadow-sm"
                      : itemBgClass
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded border ${material.color.split(" ")[0]}`} />
                  <span className="text-[8px] font-black line-clamp-1 leading-none">
                    {material.name}
                  </span>
                  <span
                    className={`text-[7px] font-mono leading-none ${
                      isSelected ? "text-indigo-400" : "text-slate-500"
                    }`}
                  >
                    -{material.dbLoss}dB • εᵣ={material.relativePermittivity}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grupo 6: Digitalizador de Planos Arquitectónicos (Imagen -> Malla 2D) */}
      <div className={`p-3 rounded-2xl border ${formBgClass} space-y-2.5 shadow-inner`}>
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Digitalizador de Planos (Imagen ➜ Malla 2D)
          </h4>
          <span className="bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none">
            Análisis Algorítmico
          </span>
        </div>

        <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-snug">
          Coloca o carga un plano técnico con paredes y la aplicación estimará automáticamente sus
          coordenadas para formar la matriz electromagnética de análisis.
        </p>

        {scanSuccessMsg && (
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-505/20 text-indigo-500 text-[10px] font-bold animate-pulse text-center leading-tight">
            {scanSuccessMsg}
          </div>
        )}

        {/* Botones de planos sintéticos de 1 clic */}
        <div className="space-y-1">
          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 block">
            A) Probar con Diseños de Plano Preestablecidos:
          </span>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => drawAndAnalyzePresetBlueprint("apartment")}
              className={`py-1.5 rounded-lg border text-center text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${itemBgClass}`}
              title="Carga un plano complejo de apartamento residencial y lo escanea a la matriz"
            >
              <Layout className="w-3 h-3 text-indigo-500" />
              Apartamento
            </button>
            <button
              type="button"
              onClick={() => drawAndAnalyzePresetBlueprint("classroom")}
              className={`py-1.5 rounded-lg border text-center text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${itemBgClass}`}
              title="Carga un plano de laboratorio o salón de informática de la Universidad"
            >
              <Binary className="w-3 h-3 text-emerald-500" />
              Laboratorio
            </button>
            <button
              type="button"
              onClick={() => drawAndAnalyzePresetBlueprint("hosp")}
              className={`py-1.5 rounded-lg border text-center text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${itemBgClass}`}
              title="Carga un plano tipo hospital de camillas divididas por muros densos"
            >
              <FileSpreadsheet className="w-3 h-3 text-rose-500" />
              Hospital
            </button>
          </div>
        </div>

        {/* Zona Drag & Drop para subir archivos JPEG/PNG propios */}
        <div className="space-y-1">
          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-550 dark:text-slate-400 block">
            B) Cargar tu Archivo de Imagen Personal (Plano / Croquis):
          </span>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3 text-center transition duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
              dragActive
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                : "border-slate-300 dark:border-slate-800 hover:border-indigo-400"
            }`}
          >
            <Upload
              className={`w-5 h-5 ${
                dragActive
                  ? "text-indigo-400 scale-110 animate-bounce"
                  : "text-slate-550 dark:text-slate-400"
              }`}
            />
            <div className="flex flex-col select-none">
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center">
                Arrastra tu plano o haz clic para subir
              </span>
              <span className="text-[7.5px] text-slate-500 dark:text-slate-400">
                Acepta JPEG, PNG (Detecta contornos oscuros)
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Controles del escáner: material asignado y umbral de luminancia */}
        <div className="pt-1.5 border-t dark:border-slate-850/60 grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8.5px] font-bold text-slate-550 dark:text-slate-400">
              Material Resultante:
            </label>
            <select
              value={uploadWallMaterial}
              onChange={(e) => setUploadWallMaterial(e.target.value as MaterialType)}
              className={`w-full px-2 py-1 rounded-lg text-[9px] focus:outline-none transition ${selectClass}`}
            >
              <option value="concrete">Hormigón (Fuerte)</option>
              <option value="brick">Ladrillo (Medio)</option>
              <option value="drywall">Panel Yeso (Suave)</option>
              <option value="metal">Metal (Absoluto)</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-550 dark:text-slate-400">
              <span>Sensibilidad Escáner:</span>
              <span className="font-mono text-indigo-500">{sensitivity}</span>
            </div>
            <input
              type="range"
              min="80"
              max="240"
              step="10"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 cursor-pointer my-1"
            />
          </div>
        </div>
      </div>

      {/* Grupo 7: Configuración del Esquema en Diferencias Finitas y Parámetros Numéricos */}
      <div className={`space-y-3 rounded-2xl p-4 border transition-all ${formBgClass}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-400 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            Esquema en Diferencias Finitas
          </h4>
          <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
            Interactivo
          </span>
        </div>

        {/* Selector de algoritmo numérico iterativo */}
        <div className="flex flex-col gap-1.5 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-950/20">
          <label className="text-[10px] font-black uppercase tracking-wider text-indigo-500/90 dark:text-indigo-400 flex justify-between">
            <span>Método Iterativo:</span>
          </label>
          <select
            value={config.method}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, method: e.target.value as SolverMethod }))
            }
            className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] font-bold focus:outline-none transition ${selectClass}`}
            id="select_solver_method"
          >
            <option value="sor">Sobre-Relajación Sucesiva (SOR, 1 &lt; ω &lt; 2)</option>
            <option value="gauss-seidel">Gauss-Seidel (Relajación Estándar, ω = 1.0)</option>
            <option value="jacobi">Jacobi (Actualización Simultánea)</option>
          </select>
          <p className="text-[9px] text-slate-550 dark:text-slate-400 leading-relaxed mt-1">
            {config.method === "sor"
              ? "✓ SOR: Extrapola la dirección de Gauss-Seidel con el factor ω para acelerar la convergencia al estado estacionario."
              : config.method === "gauss-seidel"
              ? "✓ Gauss-Seidel: Usa inmediatamente los nodos recién calculados (equivale a SOR con ω = 1.0)."
              : "✓ Jacobi: Actualiza toda la malla simultáneamente usando solo la iteración anterior k."}
          </p>
        </div>

        {/* Control deslizante del factor de sobre-relajación ω */}
        <div className="flex flex-col gap-0.5 pt-0.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-semibold text-slate-605 dark:text-slate-300">
              Factor de Relajación (ω):
            </span>
            <span className="font-mono text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded leading-none">
              {config.omega}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.9"
            step="0.05"
            value={config.omega}
            disabled={config.method !== "sor"}
            onChange={(e) => setConfig((prev) => ({ ...prev, omega: parseFloat(e.target.value) }))}
            className={`w-full accent-indigo-500 cursor-pointer my-1 ${
              config.method !== "sor" ? "opacity-40 cursor-not-allowed" : ""
            }`}
            id="slider_omega"
          />
          <div className="flex justify-between text-[8px] text-slate-500 dark:text-slate-400 font-mono leading-none">
            <span>0.5 (Sub-relajación)</span>
            <span>1.0 (Gauss-Seidel)</span>
            <span>1.9 (Sobre-relajación)</span>
          </div>
        </div>

        {/* Botón de auto-cálculo experimental del ω óptimo */}
        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1.5">
          {isOptimizingOmega ? (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold bg-indigo-500/15 text-indigo-500/80 cursor-not-allowed text-xs animate-pulse"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              Buscando ω Óptimo...
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOptimizeOmega}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 transition cursor-pointer text-[10.5px] hover:scale-[1.01]"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              Auto-calcular ω Óptimo (SOR)
            </button>
          )}

          {bestOmegaFound !== null && omegaResults && (
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1.5 text-[10px] animate-fade-in">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ¡Valor de ω Óptimo Encontrado!
              </span>
              <p className="text-[9px] text-slate-555 dark:text-slate-400 leading-normal">
                El barrido espectral determinó que{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  &omega; = {bestOmegaFound}
                </strong>{" "}
                minimiza el número de iteraciones para estabilizar el campo electromagnético.
              </p>
              <div className="flex flex-col gap-1 mt-1 font-mono text-[8.5px] border-t border-emerald-500/10 pt-1.5">
                <span className="text-[8px] uppercase font-black text-slate-550 dark:text-slate-400 tracking-wider mb-0.5">
                  Velocidad de Convergencia:
                </span>
                {omegaResults.slice(0, 3).map((r, i) => (
                  <div
                    key={r.omega}
                    className="flex justify-between items-center text-slate-500 dark:text-slate-455 px-1 hover:bg-slate-500/5 rounded"
                  >
                    <span
                      className={
                        r.omega === bestOmegaFound
                          ? "font-bold text-emerald-600 dark:text-emerald-400"
                          : ""
                      }
                    >
                      {i + 1}º) &omega; = {r.omega.toFixed(2)}{" "}
                      {r.omega === bestOmegaFound ? "★" : ""}
                    </span>
                    <span
                      className={
                        r.omega === bestOmegaFound
                          ? "font-bold text-emerald-600 dark:text-emerald-400"
                          : ""
                      }
                    >
                      {r.iterations} iters
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selectores de Tolerancia ε y Tamaño de Malla N × N */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-slate-605 dark:text-slate-300">
              Tolerancia Límite (ε):
            </label>
            <select
              value={config.tolerance}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, tolerance: parseFloat(e.target.value) }))
              }
              className={`w-full px-2 py-1 rounded-xl text-[11px] focus:outline-none transition ${selectClass}`}
              id="select_tolerance"
            >
              <option value="0.01">10⁻² (Rápida)</option>
              <option value="0.001">10⁻³ (Estándar)</option>
              <option value="0.0001">10⁻⁴ (Alta Precisión)</option>
              <option value="0.000001">10⁻⁶ (Laboratorio)</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-slate-605 dark:text-slate-300">
              Malla Nodos (N &times; N):
            </label>
            <select
              value={gridSize.rows}
              onChange={(e) => handleGridSizeChange(parseInt(e.target.value))}
              className={`w-full px-2 py-1 rounded-xl text-[11px] focus:outline-none transition ${selectClass}`}
              id="select_gridsize"
            >
              <option value="16">16 x 16 (Veloz)</option>
              <option value="24">24 x 24 (Equilibrado)</option>
              <option value="32">32 x 32 (Fino)</option>
            </select>
          </div>
        </div>

        {/* Control de retardo de animación entre iteraciones */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="font-semibold text-slate-605 dark:text-slate-300 font-sans">
              Retardo de Animación:
            </span>
            <span className="font-mono text-indigo-500 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded leading-none">
              {config.animationDelay === 0 ? "0 ms (Fijo)" : `${config.animationDelay} ms`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            step="10"
            value={config.animationDelay}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, animationDelay: parseInt(e.target.value) }))
            }
            className="w-full accent-indigo-500 h-1 cursor-pointer my-1"
            id="slider_delay"
          />
        </div>
      </div>

      {/* Grupo 8: Escenarios Físicos Preconfigurados (Espacio Libre, Oficina, Jaula de Faraday) */}
      <div className={`border-t pt-3 ${isDarkMode ? "border-slate-850" : "border-slate-100"}`}>
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2 flex items-center gap-1">
          <Layout className="w-3.5 h-3.5 text-indigo-500" />
          Escenarios Digitales Rápidos
        </h4>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => onLoadPreset("empty")}
            className={`w-full text-left text-[11px] px-3 py-2 rounded-xl font-medium transition truncate cursor-pointer border ${itemBgClass}`}
          >
            ⚡ Espacio Libre de Obstáculos
          </button>
          <button
            onClick={() => onLoadPreset("office")}
            className={`w-full text-left text-[11px] px-3 py-2 rounded-xl font-medium transition truncate cursor-pointer border ${itemBgClass}`}
          >
            🏢 Oficina Corporativa (Muros Concreto)
          </button>
          <button
            onClick={() => onLoadPreset("metal-cage")}
            className={`w-full text-left text-[11px] px-3 py-2 rounded-xl font-medium transition truncate cursor-pointer border ${itemBgClass}`}
          >
            🔒 Jaula de Faraday (Blindaje Metálico)
          </button>
        </div>
      </div>
    </div>
  );
}
