// Importa React y el hook useState para controlar el estado local del carrusel de mensajes científicos
import React, { useState } from "react";
// Importa las estructuras de datos del dominio físico y de optimización desde la Capa 1
import { Cell, MaterialType, RouterConfig, OptimizationResult } from "../types";
// Importa el catálogo de materiales dieléctricos y las funciones de cálculo electromagnético desde la Capa 2
import {
  MATERIALS,
  getSignalQuality,
  getElectromagneticMetrics,
} from "../controlador";
// Importa los iconos vectoriales utilizados en los controles de visualización y en los nodos emisores
import { Router, Radio, HelpCircle, Eye, EyeOff, Download } from "lucide-react";
// Importa los componentes de animación declarativa para transiciones suaves en el escaneo de optimización
import { motion, AnimatePresence } from "motion/react";

/**
 * Subcomponente que muestra mensajes secuenciales del proceso físico-matemático
 * mientras el motor ejecuta el barrido de optimización espacial sobre la malla.
 */
function ScanningTicker() {
  // Índice reactivo del mensaje científico actualmente visible
  const [msgIdx, setMsgIdx] = useState(0);
  // Lista de etapas algorítmicas ejecutadas durante el análisis de cobertura electromagnética
  const messages = [
    "Recopilando geometría de obstáculos y muros dieléctricos...",
    "Analizando permitividad ε_r y conductividad σ de materiales...",
    "Estableciendo condiciones de frontera (Dirichlet en bordes)...",
    "Calculando intensidad de campo eléctrico E_rms y vector de Poynting...",
    "Resolviendo esquema en diferencias finitas con relajación SOR...",
    "Evaluando candidatas óptimas de radiación electromagnética...",
    "Optimizando cobertura global y reduciendo zonas de sombra...",
  ];

  // Efecto que rota automáticamente el mensaje visible cada 280 milisegundos
  React.useEffect(() => {
    // Crea el temporizador periódico de actualización circular
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 280);
    // Limpia el temporizador al desmontar el subcomponente para evitar fugas de memoria
    return () => clearInterval(timer);
  }, []);

  // Renderiza el mensaje activo con un efecto de pulso luminoso
  return <span className="animate-pulse">{messages[msgIdx]}</span>;
}

// Propiedades recibidas por el componente visual de la malla bidimensional NetworkGrid
interface NetworkGridProps {
  grid: Cell[][];                                                 // Matriz 2D de nodos con el estado actual del campo
  onCellClick?: (x: number, y: number) => void;                   // Manejador opcional de clic puntual sobre una celda
  onCellMouseDown: (x: number, y: number) => void;                // Manejador al presionar el botón del ratón (inicio de trazo/arrastre)
  onCellMouseEnter: (x: number, y: number) => void;               // Manejador al desplazar el cursor sobre una celda (pintado continuo)
  onCellMouseUp: () => void;                                      // Manejador al soltar el botón del ratón (fin de trazo/arrastre)
  routers: RouterConfig[];                                        // Arreglo de transmisores activos en el recinto
  selectedTool: "router" | MaterialType | "eraser" | "move";      // Herramienta de edición geométrica seleccionada
  hoveredCell: Cell | null;                                       // Celda actualmente bajo el cursor para inspección en tiempo real
  setHoveredCell: (cell: Cell | null) => void;                    // Función para actualizar la celda inspeccionada
  showHeatmap: boolean;                                           // Bandera que activa o desactiva el mapa de color térmico del campo
  setShowHeatmap: (show: boolean) => void;                        // Función para conmutar la visibilidad del mapa de calor
  showValues: boolean;                                            // Bandera que muestra u oculta el valor numérico del potencial u_{i,j}
  setShowValues: (show: boolean) => void;                         // Función para conmutar la visibilidad de los valores numéricos
  isDarkMode: boolean;                                            // Estado del tema visual (oscuro o claro)
  cellSize: number;                                               // Escala espacial física h (metros por lado de celda)
  isOptimizing?: boolean;                                         // Indica si se está ejecutando la búsqueda de ubicación óptima
  optimizationResult?: OptimizationResult | null;                 // Resultado del optimizador para resaltar candidatos en la malla
}

/**
 * Componente principal de visualización e interacción sobre la malla en Diferencias Finitas 2D.
 * Renderiza el mapa de campo electromagnético, los obstáculos dieléctricos, los emisores y el inspector nodal.
 */
export default function NetworkGrid({
  grid,
  onCellMouseDown,
  onCellMouseEnter,
  onCellMouseUp,
  routers,
  selectedTool,
  hoveredCell,
  setHoveredCell,
  showHeatmap,
  setShowHeatmap,
  showValues,
  setShowValues,
  isDarkMode,
  cellSize,
  isOptimizing = false,
  optimizationResult = null,
}: NetworkGridProps) {
  /**
   * Exporta la representación gráfica actual de la malla electromagnética a un archivo de imagen PNG
   * utilizando un lienzo HTML5 Canvas en memoria y envía una copia de respaldo al servidor local.
   */
  const downloadGridImage = () => {
    // Obtiene las dimensiones actuales de filas y columnas de la malla
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    // Cancela la operación si la malla aún no tiene dimensiones válidas
    if (rows === 0 || cols === 0) return;

    // Define la resolución en píxeles de cada celda dentro de la imagen exportada (28×28 px por nodo)
    const cellSizePx = 28;
    // Crea un elemento <canvas> en memoria fuera del árbol DOM visible
    const canvas = document.createElement("canvas");
    // Configura el ancho y alto total del lienzo en función del número de columnas y filas
    canvas.width = cols * cellSizePx;
    canvas.height = rows * cellSizePx;
    // Obtiene el contexto de renderizado bidimensional del lienzo
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Pinta el fondo general del lienzo respetando el modo oscuro o claro activo
    ctx.fillStyle = isDarkMode ? "#020617" : "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Recorre fila por fila y columna por columna toda la rejilla para dibujar cada celda en el Canvas
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Obtiene los datos del nodo (r, c)
        const cell = grid[r][c];
        // Calcula las coordenadas en píxeles (x, y) de la esquina superior izquierda de la celda
        const x = c * cellSizePx;
        const y = r * cellSizePx;

        // Variable para almacenar el color de relleno CSS de la celda actual
        let cellColor = "";
        // Si la celda es un obstáculo constructivo (muro), asigna el color según su material dieléctrico
        if (cell.type === "wall") {
          switch (cell.material) {
            case "drywall":
              cellColor = isDarkMode ? "#475569" : "#cbd5e1";
              break;
            case "brick":
              cellColor = isDarkMode ? "#92400e" : "#d97706";
              break;
            case "concrete":
              cellColor = isDarkMode ? "#4b5563" : "#4b5563";
              break;
            case "metal":
              cellColor = isDarkMode ? "#3f3f46" : "#334155";
              break;
            default:
              cellColor = "#94a3b8";
          }
        // Si la celda contiene una fuente radiante (router), la pinta en verde esmeralda intenso
        } else if (cell.type === "router") {
          cellColor = "#10b981";
        // Si es una celda de aire, aplica la escala cromática continua del mapa de campo electromagnético
        } else {
          if (!showHeatmap) {
            cellColor = isDarkMode ? "rgba(2, 6, 23, 0.4)" : "rgba(241, 245, 249, 0.4)";
          } else {
            const val = cell.val;
            // Zona sin cobertura útil (potencial <= 1.0)
            if (val <= 1.0) {
              cellColor = isDarkMode ? "#020617" : "#f8fafc";
            // Zona de campo débil (tonos azules interpolados)
            } else if (val < 15) {
              const ratio = val / 15;
              cellColor = `rgba(59, 130, 246, ${isDarkMode ? 0.25 + ratio * 0.35 : 0.15 + ratio * 0.25})`;
            // Zona de campo medio (tonos violetas interpolados)
            } else if (val < 45) {
              const ratio = (val - 15) / 30;
              cellColor = `rgba(139, 92, 246, ${isDarkMode ? 0.5 + ratio * 0.3 : 0.4 + ratio * 0.35})`;
            // Zona de campo intenso (tonos naranjas interpolados)
            } else if (val < 75) {
              const ratio = (val - 45) / 30;
              cellColor = `rgba(249, 115, 22, ${isDarkMode ? 0.8 + ratio * 0.15 : 0.75 + ratio * 0.15})`;
            // Zona cercana a la fuente con máxima densidad de potencia (tonos amarillos/dorados)
            } else {
              const ratio = (val - 75) / 25;
              cellColor = `rgba(234, 179, 8, ${isDarkMode ? 0.9 + ratio * 0.1 : 0.85 + ratio * 0.15})`;
            }
          }
        }

        // Dibuja el rectángulo interior de la celda con su color correspondiente
        ctx.fillStyle = cellColor;
        ctx.fillRect(x + 0.5, y + 0.5, cellSizePx - 1, cellSizePx - 1);

        // Dibuja la cuadrícula fina de separación entre nodos discretos
        ctx.strokeStyle = isDarkMode ? "rgba(30, 41, 59, 0.3)" : "rgba(226, 232, 240, 0.8)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSizePx - 1, cellSizePx - 1);

        // Si el nodo es un router, dibuja un símbolo concéntrico de antena omnidireccional en blanco
        if (cell.type === "router") {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x + cellSizePx / 2, y + cellSizePx / 2, 4, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(x + cellSizePx / 2, y + cellSizePx / 2, 9, 0, 2 * Math.PI);
          ctx.stroke();
        // Si el nodo es un muro, imprime la inicial en mayúscula de su material constructivo
        } else if (cell.type === "wall") {
          ctx.fillStyle = isDarkMode ? "#f8fafc" : "#0f172a";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(cell.material[0].toUpperCase(), x + cellSizePx / 2, y + cellSizePx / 2);
        // Si está activada la vista numérica del potencial u, escribe el valor entero redondeado en el centro
        } else if (showValues && cell.val > 0.1) {
          ctx.fillStyle = showHeatmap && cell.val > 45 ? "#ffffff" : isDarkMode ? "#e2e8f0" : "#1e293b";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(Math.round(cell.val).toString(), x + cellSizePx / 2, y + cellSizePx / 2);
        }
      }
    }

    // Genera un nombre de archivo único con marca de tiempo para la imagen PNG
    const timestamp = new Date().getTime();
    const filename = `malla_campo_electromagnetico_${timestamp}.png`;
    // Codifica el lienzo Canvas como cadena DataURL en formato PNG Base64
    const dataUrl = canvas.toDataURL("image/png");

    // Crea un enlace temporal de descarga directa en el navegador del usuario
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Envía asíncronamente la imagen en Base64 al endpoint local para almacenarla en la carpeta /resultados
    fetch("/api/guardar-resultado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: filename,
        content: dataUrl,
        type: "image",
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("Resultado de imagen guardado en el servidor:", data))
      .catch((err) => console.error("Error al guardar imagen de simulación en servidor", err));
  };

  /**
   * Determina la clase de Tailwind CSS (para muros/routers) o el color RGBA en línea (para el mapa de calor)
   * que debe aplicarse a cada celda en el renderizado interactivo del DOM.
   */
  const getCellBgColor = (cell: Cell) => {
    // Estilo visual específico para cada tipo de obstáculo dieléctrico o metálico
    if (cell.type === "wall") {
      switch (cell.material) {
        case "drywall":
          return isDarkMode ? "bg-slate-700 border-slate-650" : "bg-slate-300 border-slate-400";
        case "brick":
          return isDarkMode ? "bg-amber-800/80 border-amber-700/60" : "bg-amber-600 border-amber-700";
        case "concrete":
          return isDarkMode ? "bg-slate-600 border-slate-500" : "bg-slate-600 border-slate-700";
        case "metal":
          return isDarkMode
            ? "bg-zinc-700 border-zinc-650 animate-pulse"
            : "bg-slate-700 border-slate-800 shadow-inner animate-pulse";
        default:
          return "bg-slate-400";
      }
    }

    // Estilo resaltado para las celdas emisoras (routers)
    if (cell.type === "router") {
      return "bg-emerald-500 border-emerald-600 text-white shadow-md";
    }

    // Si el mapa de calor está desactivado, muestra un fondo neutro uniforme
    if (!showHeatmap) {
      return isDarkMode ? "bg-slate-950/40 border-slate-900/50" : "bg-slate-100/40 border-slate-200/20";
    }

    // Interpolación cromática continua en función del potencial escalar u_{i,j} ∈ [0, 100]
    const val = cell.val;
    if (val <= 1.0) {
      return isDarkMode ? "bg-slate-950 border-slate-950" : "bg-slate-50 border-slate-100";
    }

    if (val < 15) {
      const ratio = val / 15;
      return `rgba(59, 130, 246, ${isDarkMode ? 0.25 + ratio * 0.35 : 0.15 + ratio * 0.25})`;
    } else if (val < 45) {
      const ratio = (val - 15) / 30;
      return `rgba(139, 92, 246, ${isDarkMode ? 0.5 + ratio * 0.3 : 0.4 + ratio * 0.35})`;
    } else if (val < 75) {
      const ratio = (val - 45) / 30;
      return `rgba(249, 115, 22, ${isDarkMode ? 0.8 + ratio * 0.15 : 0.75 + ratio * 0.15})`;
    } else {
      const ratio = (val - 75) / 25;
      return `rgba(234, 179, 8, ${isDarkMode ? 0.9 + ratio * 0.1 : 0.85 + ratio * 0.15})`;
    }
  };

  /**
   * Asigna la clase de color tipográfico para el indicador de potencia en dBm en la barra inspectora inferior.
   */
  const getDbmColorClass = (dbm: number) => {
    if (dbm >= -50) return isDarkMode ? "text-emerald-400 font-extrabold" : "text-emerald-600 font-bold";
    if (dbm >= -65) return isDarkMode ? "text-teal-400 font-bold" : "text-teal-600 font-semibold";
    if (dbm >= -75) return isDarkMode ? "text-amber-400" : "text-amber-600";
    if (dbm >= -82) return isDarkMode ? "text-orange-400" : "text-orange-650";
    return isDarkMode ? "text-rose-400 font-bold" : "text-rose-600 font-medium";
  };

  // Clases de contenedor adaptadas al tema oscuro o claro
  const cardBgClass = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-800 shadow-sm";

  // Generador de estilos para los botones conmutadores de la cabecera ('Mapa de Campo' y 'Potencial u')
  const toggleBtnClass = (active: boolean) => {
    if (active) {
      return isDarkMode
        ? "bg-indigo-950/80 border-indigo-700/80 text-indigo-300 font-bold"
        : "bg-indigo-50 border-indigo-250 text-indigo-700 hover:bg-indigo-100/55 font-bold";
    }
    return isDarkMode
      ? "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-100"
      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  };

  // Estilo visual atenuado para representar los nodos del borde perimetral con condición de Dirichlet fija (u = 0)
  const outerBoundaryBg = isDarkMode
    ? "bg-slate-950/20 text-slate-700 border-slate-900"
    : "opacity-35 bg-slate-200 text-slate-450 border-slate-200/50";

  // Obtiene la banda de frecuencia del transmisor principal para mostrar su longitud de onda λ en la cabecera
  const activeFreq = routers[0]?.frequency || "2.4 GHz";

  return (
    <div
      className={`flex flex-col h-auto rounded-3xl border p-6 justify-between transition-all duration-300 ${cardBgClass}`}
    >
      {/* Cabecera superior con información dimensional del recinto y botones de visualización */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 ${
          isDarkMode ? "border-slate-850" : "border-slate-100"
        }`}
      >
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-500 animate-pulse" />
            Dominio de Simulación Electromagnética 2D ({grid.length}&times;{grid[0]?.length || 0} nodos)
          </h3>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
            Banda activa:{" "}
            <span className="font-mono font-bold text-emerald-500">
              {activeFreq} (&lambda; = {activeFreq === "2.4 GHz" ? "12.5 cm" : "6.0 cm"})
            </span>{" "}
            • Recinto:{" "}
            <span className="font-mono text-[11px] font-bold text-indigo-500 dark:text-indigo-400">
              {(grid.length * cellSize).toFixed(1)}m &times; {((grid[0]?.length || 0) * cellSize).toFixed(1)}m
            </span>{" "}
            (Área:{" "}
            <span className="font-mono text-[11px] font-bold text-indigo-500 dark:text-indigo-400">
              {(grid.length * (grid[0]?.length || 0) * cellSize * cellSize).toFixed(1)} m²
            </span>
            )
          </p>
        </div>

        {/* Barra de acciones rápidas sobre la malla */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${toggleBtnClass(
              showHeatmap
            )}`}
            title="Alternar Mapa de Calor Electromagnético"
            id="btn_toggle_heatmap"
          >
            {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Mapa de Campo
          </button>

          <button
            onClick={() => setShowValues(!showValues)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${toggleBtnClass(
              showValues
            )}`}
            title="Alternar Potencial Normalizado"
            id="btn_toggle_values"
          >
            <span className="font-mono text-xs font-bold">%</span>
            Potencial u
          </button>

          <button
            onClick={downloadGridImage}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isDarkMode
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/40"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
            title="Descargar Malla como Imagen PNG"
            id="btn_download_grid_image"
          >
            <Download className="w-4 h-4 animate-bounce" />
            Descargar Imagen
          </button>
        </div>
      </div>

      {/* Contenedor central de la malla interactiva y superposición de escaneo durante optimización */}
      <div
        className={`flex-1 flex items-center justify-center p-3 rounded-2xl border overflow-auto cursor-crosshair select-none relative min-h-[300px] ${
          isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50/70 border-slate-100"
        }`}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Superposición animada de radar cuando el optimizador está evaluando coordenadas */}
        <AnimatePresence>
          {isOptimizing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] z-40 rounded-2xl flex flex-col items-center justify-center text-center p-6"
            >
              <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-amber-500/10 rounded-full animate-ping duration-1500" />
                <div className="absolute inset-4 border border-dashed border-amber-400/30 rounded-full animate-spin duration-[5000ms]" />
                <div className="absolute inset-8 border-2 border-indigo-500/15 rounded-full animate-pulse" />
                <div className="absolute inset-12 border-t-2 border-r-2 border-amber-400 rounded-full animate-spin duration-[1000ms]" />

                <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
              </div>

              <div className="flex flex-col gap-1 max-w-sm">
                <h4 className="text-[11px] uppercase font-black tracking-widest text-amber-400 flex items-center justify-center gap-1 font-sans animate-pulse">
                  <span>●</span> Optimización de Cobertura Electromagnética
                </h4>

                <p className="text-[10px] text-slate-300 font-bold font-mono">
                  Resolviendo sistema en diferencias finitas (SOR)...
                </p>

                <div className="text-[9px] text-emerald-450 font-mono tracking-wider bg-slate-900/90 py-1 px-2.5 rounded-lg border border-emerald-500/15 shadow-inner mt-2 min-h-[28px] flex items-center justify-center max-w-[280px]">
                  <ScanningTicker />
                </div>
              </div>

              <div className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-scan-x pointer-events-none" />
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_rgba(129,140,248,0.6)] animate-scan-y pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cuadrícula CSS Grid dinámica de N_y filas por N_x columnas */}
        <div
          className={`grid gap-[1px] p-[1.5px] rounded-xl shadow-sm w-full max-w-[580px] aspect-square mx-auto ${
            isDarkMode ? "bg-slate-850" : "bg-slate-200/60"
          }`}
          style={{
            gridTemplateRows: `repeat(${grid.length}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${grid[0]?.length || 1}, minmax(0, 1fr))`,
          }}
          onMouseUp={onCellMouseUp}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              // Obtiene el color o clase de fondo según el estado físico de la celda
              const bgStyle = getCellBgColor(cell);
              const isRouter = cell.type === "router";
              const isBoundary =
                cell.x === 0 ||
                cell.x === grid.length - 1 ||
                cell.y === 0 ||
                cell.y === grid[0].length - 1;

              // Verifica si la celda corresponde a un candidato óptimo sugerido (modo 1 router o K-Means multi-router)
              const candIndex = optimizationResult?.isMultiRouter
                ? optimizationResult.optimizedRouters?.findIndex(
                    (cand) => cand.x === cell.x && cand.y === cell.y
                  )
                : optimizationResult?.topCandidates?.findIndex(
                    (cand) => cand.x === cell.x && cand.y === cell.y
                  );

              // Ajusta el contraste del texto numérico según la luminosidad del mapa de calor subyacente
              const textContrastClass =
                showHeatmap && cell.val > 45
                  ? "text-white font-extrabold"
                  : isDarkMode
                  ? "text-indigo-200 font-bold"
                  : "text-slate-800 font-extrabold";

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  id={`cell_${rIdx}_${cIdx}`}
                  onMouseDown={() => onCellMouseDown(cell.x, cell.y)}
                  onMouseEnter={() => {
                    onCellMouseEnter(cell.x, cell.y);
                    setHoveredCell(cell);
                  }}
                  style={{
                    backgroundColor:
                      cell.type !== "wall" && cell.type !== "router" ? bgStyle : undefined,
                  }}
                  className={`w-full aspect-square flex items-center justify-center rounded-sm transition-all duration-100 border-[0.5px] border-slate-200/5 text-[8px] sm:text-[9px] font-mono select-none relative ${
                    cell.type === "wall" || cell.type === "router" ? bgStyle : ""
                  } ${
                    isBoundary
                      ? outerBoundaryBg
                      : selectedTool === "move" && isRouter
                      ? "cursor-grab active:cursor-grabbing hover:scale-115 hover:z-25 border-indigo-500 border-2 shadow-lg shadow-indigo-500/20"
                      : "cursor-pointer hover:scale-110 hover:z-10"
                  }`}
                >
                  {/* Contenido interno de la celda: icono de router, inicial de muro o valor de potencial u */}
                  {isRouter ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping duration-1000" />
                      {selectedTool === "move" && (
                        <span className="absolute inline-flex h-[140%] w-[140%] rounded-full bg-indigo-500/40 opacity-50 animate-pulse" />
                      )}
                      <Router
                        className={`w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-white relative z-10 ${
                          selectedTool === "move" ? "animate-bounce" : "animate-pulse"
                        }`}
                      />
                    </div>
                  ) : cell.type === "wall" ? (
                    <div
                      className={`w-full h-full opacity-70 flex items-center justify-center font-bold text-[9px] ${
                        isDarkMode ? "text-slate-200" : "text-slate-800"
                      }`}
                    >
                      {cell.material[0].toUpperCase()}
                    </div>
                  ) : showValues && !isBoundary && cell.val > 0.1 ? (
                    <span className={textContrastClass}>{Math.round(cell.val)}</span>
                  ) : null}

                  {/* Insignia numerada para destacar en la malla las ubicaciones óptimas calculadas */}
                  {!isBoundary && candIndex !== undefined && candIndex !== -1 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                    >
                      {candIndex === 0 || optimizationResult?.isMultiRouter ? (
                        <div className="w-5.5 h-5.5 rounded-full bg-amber-500 text-white flex items-center justify-center font-sans font-black text-[9px] ring-2 ring-amber-400/80 animate-bounce shadow-[0_0_10px_rgba(245,158,11,0.9)] border border-amber-600">
                          {candIndex + 1}
                        </div>
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-sans font-bold text-[8px] ring-1 ring-indigo-400 shadow-md">
                          {candIndex + 1}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Barra inferior de inspección electromagnética en tiempo real al pasar el cursor sobre cualquier nodo */}
      <div
        className={`min-h-[68px] border-t mt-4 pt-3 flex flex-wrap items-center justify-between text-xs gap-3 ${
          isDarkMode ? "border-slate-850 text-slate-350" : "border-slate-100 text-slate-600"
        }`}
      >
        {hoveredCell ? (
          (() => {
            // Obtiene la celda actualizada directamente desde la matriz viva por si el potencial está evolucionando
            const liveCell = grid[hoveredCell.x]?.[hoveredCell.y] || hoveredCell;
            // Calcula todas las magnitudes físicas (dBm, E_rms, H_rms, Vector de Poynting <S>) para este nodo
            const em = getElectromagneticMetrics(liveCell.val, activeFreq);
            // Determina la clasificación cualitativa de la señal recibida
            const qual = getSignalQuality(em.dbm);
            // Recupera las constantes dieléctricas (ε_r, σ) del material presente en la celda
            const matInfo = MATERIALS[liveCell.material];
            // Comprueba si el nodo inspeccionado pertenece al borde absorbente de Dirichlet
            const isBoundary =
              liveCell.x === 0 ||
              liveCell.x === grid.length - 1 ||
              liveCell.y === 0 ||
              liveCell.y === grid[0].length - 1;

            // Identifica el router más cercano al nodo inspeccionado para mostrar la distancia radial r (m)
            const closestRouter =
              routers.length > 0
                ? routers.reduce((closest, r) => {
                    const dCurrent = Math.sqrt(
                      Math.pow(liveCell.x - r.x, 2) + Math.pow(liveCell.y - r.y, 2)
                    );
                    const dClosest = Math.sqrt(
                      Math.pow(liveCell.x - closest.x, 2) + Math.pow(liveCell.y - closest.y, 2)
                    );
                    return dCurrent < dClosest ? r : closest;
                  }, routers[0])
                : null;

            // Convierte la distancia euclidiana en celdas a metros físicos multiplicando por el paso espacial h
            const distMeters = closestRouter
              ? Math.sqrt(
                  Math.pow(liveCell.x - closestRouter.x, 2) +
                    Math.pow(liveCell.y - closestRouter.y, 2)
                ) * cellSize
              : null;

            return (
              <div className="flex flex-col w-full gap-2">
                {/* Primera fila del inspector: Coordenada discreta, medio dieléctrico, distancia r y calidad */}
                <div className="flex flex-wrap items-center justify-between w-full gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={`font-mono px-2.5 py-1 rounded-lg border shadow-sm font-semibold ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-850 text-slate-300"
                          : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      Nodo [{liveCell.x}, {liveCell.y}]
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-550 dark:text-slate-400">Medio:</span>
                      <span
                        className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {isBoundary
                          ? "Borde Absorbente (Dirichlet u=0)"
                          : liveCell.type === "router"
                          ? `Fuente Radiante (${activeFreq})`
                          : `${matInfo.name} (εᵣ=${matInfo.relativePermittivity}, σ=${matInfo.conductivity} S/m)`}
                      </span>
                    </div>

                    {distMeters !== null && !isBoundary && liveCell.type !== "router" && (
                      <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                        <span className="text-slate-550 dark:text-slate-400">r:</span>
                        <span
                          className={`font-mono font-bold ${
                            isDarkMode ? "text-slate-200" : "text-slate-800"
                          }`}
                        >
                          {distMeters.toFixed(2)} m
                        </span>
                      </div>
                    )}
                  </div>

                  {!isBoundary && (
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${qual.bg}`} />
                      <span className={`font-semibold ${qual.color}`}>{qual.text}</span>
                    </div>
                  )}
                </div>

                {/* Segunda fila del inspector: Las 4 magnitudes físicas clave del campo electromagnético */}
                {!isBoundary && (
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-xl border font-mono text-[11px] ${
                      isDarkMode
                        ? "bg-slate-950/60 border-slate-850"
                        : "bg-slate-50 border-slate-200/70"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-slate-400 font-sans font-bold">
                        Potencia P_rx
                      </span>
                      <span className={`font-bold ${getDbmColorClass(em.dbm)}`}>
                        {em.dbm} dBm ({Math.round(liveCell.val)}%)
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-slate-400 font-sans font-bold">
                        Campo Eléctrico E_rms
                      </span>
                      <span className="font-bold text-indigo-500 dark:text-indigo-400">
                        {em.electricFieldVm.toFixed(3)} V/m
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-slate-400 font-sans font-bold">
                        Campo Magnético H_rms
                      </span>
                      <span className="font-bold text-sky-500 dark:text-sky-400">
                        {em.magneticFieldMam.toFixed(3)} mA/m
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-slate-400 font-sans font-bold">
                        Vector Poynting &lt;S&gt;
                      </span>
                      <span className="font-bold text-amber-500 dark:text-amber-400">
                        {em.poyntingUwM2.toFixed(2)} &mu;W/m&sup2;
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center w-full text-slate-500 dark:text-slate-400 py-1 gap-2">
            <HelpCircle className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
            <span>
              Inspecciona cualquier nodo de la malla para ver Potencia (dBm), Campo Eléctrico (V/m),
              Campo Magnético (mA/m) y Vector de Poynting (&mu;W/m&sup2;).
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
