import React, { useState, useRef } from "react";
import { SolverMethod, MaterialType, SimulationConfig } from "../types";
import { MATERIALS } from "../solver";
import { 
  Play, Pause, RotateCcw, FastForward, Sliders, Layout, RefreshCw, 
  Layers, Cpu, Eraser, ShieldAlert, Lock, Upload, Image, SlidersHorizontal, 
  CheckCircle2, Sparkles, Binary, FileSpreadsheet
} from "lucide-react";

interface ControlPanelProps {
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onSolveInstant: () => void;
  onSingleStep: () => void;
  onReset: () => void;
  onClearWalls: () => void;
  selectedTool: "router" | MaterialType | "eraser";
  setSelectedTool: (tool: "router" | MaterialType | "eraser") => void;
  currentIteration: number;
  currentError: number;
  timeMs: number;
  onLoadPreset: (presetName: string) => void;
  gridSize: { rows: number; cols: number };
  setGridSize: (size: { rows: number; cols: number }) => void;
  isDarkMode: boolean;
  isAdmin: boolean;
  walls: { x: number; y: number; material: MaterialType }[];
  setWalls: React.Dispatch<React.SetStateAction<{ x: number; y: number; material: MaterialType }[]>>;
}

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
  currentIteration,
  currentError,
  timeMs,
  onLoadPreset,
  gridSize,
  setGridSize,
  isDarkMode,
  isAdmin,
  walls,
  setWalls,
}: ControlPanelProps) {
  
  // Digitizer States
  const [uploadWallMaterial, setUploadWallMaterial] = useState<MaterialType>("concrete");
  const [sensitivity, setSensitivity] = useState<number>(160);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isAdmin) return;
    const method = e.target.value as SolverMethod;
    setConfig((prev) => ({
      ...prev,
      method,
      omega: method === "sor" || method === "ssor" ? 1.25 : 1.0,
    }));
  };

  const handleGridSizeChange = (size: number) => {
    setGridSize({ rows: size, cols: size });
  };

  // 1-Click Preset Canvas Architectural Drawer & Analyzer
  const drawAndAnalyzePresetBlueprint = (presetType: string) => {
    const w = 300;
    const h = 300;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw clean architectural blueprint (white bg, pure indigo for walls)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1e1b4b"; // Dark Indigo (low brightness < 160)
    ctx.lineWidth = 14; // bold lines to translate well to N x N grid

    if (presetType === "apartment") {
      // Outer border walls
      ctx.strokeRect(10, 10, w - 20, h - 20);
      
      // Horizontal apartment dividing line
      ctx.beginPath();
      ctx.moveTo(10, h / 2);
      ctx.lineTo(w - 10, h / 2);
      ctx.stroke();

      // Room separation vertical walls
      ctx.beginPath();
      ctx.moveTo(w / 3, 10);
      ctx.lineTo(w / 3, h / 2 - 40); // and leave opening for a door
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo((w * 2) / 3, h / 2 + 40); // door opening
      ctx.lineTo((w * 2) / 3, h - 10);
      ctx.stroke();

      // Additional center pillar
      ctx.fillRect(w / 2 - 10, h / 2 - 40, 20, 80);

    } else if (presetType === "classroom") {
      // Outer border walls
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Professor desk and computer labs dividing line
      ctx.beginPath();
      ctx.moveTo(10, h / 3);
      ctx.lineTo(w - 100, h / 3);
      ctx.stroke();

      // Central server cabinet room
      ctx.strokeRect(w / 2 - 40, h / 2 - 40, 80, 80);

    } else if (presetType === "hosp") {
      // General structure boundary
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Central long corridor
      ctx.beginPath();
      ctx.moveTo(10, h / 2 - 15);
      ctx.lineTo(w - 10, h / 2 - 15);
      ctx.moveTo(10, h / 2 + 15);
      ctx.lineTo(w - 10, h / 2 + 15);
      ctx.stroke();

      // Three separation rooms (upper corridor)
      ctx.beginPath();
      ctx.moveTo(w / 3, 10);
      ctx.lineTo(w / 3, h / 2 - 15);
      ctx.moveTo((w * 2) / 3, 10);
      ctx.lineTo((w * 2) / 3, h / 2 - 15);
      ctx.stroke();

      // Three separations rooms (lower corridor)
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 + 15);
      ctx.lineTo(w / 2, h - 10);
      ctx.stroke();
    }

    // Pass canvas to core image-to-matrix pixel scanner
    runPixelScan(canvas, uploadWallMaterial, sensitivity);
  };

  // Helper routine to scan a canvas pixels & update the walls grid
  const runPixelScan = (canvas: HTMLCanvasElement, wallMat: MaterialType, thresh: number) => {
    const scanCanvas = document.createElement("canvas");
    scanCanvas.width = gridSize.cols;
    scanCanvas.height = gridSize.rows;
    const scanCtx = scanCanvas.getContext("2d");
    if (!scanCtx) return;

    // Draw original onto downscaled target size
    scanCtx.drawImage(canvas, 0, 0, gridSize.cols, gridSize.rows);
    const imgData = scanCtx.getImageData(0, 0, gridSize.cols, gridSize.rows);
    const data = imgData.data;

    const newScannedWalls: { x: number; y: number; material: MaterialType }[] = [];

    for (let r = 0; r < gridSize.rows; r++) {
      for (let c = 0; c < gridSize.cols; c++) {
        // Prevent drawing on Dirichlet boundaries
        if (r === 0 || r === gridSize.rows - 1 || c === 0 || c === gridSize.cols - 1) {
          continue;
        }

        const idx = (r * gridSize.cols + c) * 4;
        const red = data[idx];
        const green = data[idx + 1];
        const blue = data[idx + 2];
        const alpha = data[idx + 3];

        // Standard Luminance Formula
        const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;

        // Low brightness (dark spots count as structural blueprint lines) or opacity exists
        if (alpha > 40 && brightness < thresh) {
          newScannedWalls.push({ x: r, y: c, material: wallMat });
        }
      }
    }

    setWalls(newScannedWalls);
    setScanSuccessMsg(`¡Plano convertido! Encontrados ${newScannedWalls.length} bloques de muro (${MATERIALS[wallMat].name}) en la matriz.`);
    
    setTimeout(() => {
      setScanSuccessMsg("");
    }, 4500);
  };

  // Dynamic Image File Reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

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
    <div className={`flex flex-col gap-4.5 rounded-3xl border p-5 transition-all duration-300 ${cardBgClass}`}>
      
      {/* Simulation Information Header in sleek Bento styling */}
      <div className={`border-b pb-3 ${isDarkMode ? "border-slate-850" : "border-slate-100"}`}>
        <h3 className="text-base font-extrabold flex items-center gap-1.5 leading-none">
          <Sliders className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
          Controles de Simulación
        </h3>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
          Diseña el espacio, sintoniza el solucionador electrodinámico y calcula señales de manera digital.
        </p>
      </div>

      {/* COMPACT OPERATIONAL BUTTONS GROUP (SOLVES 'AWAY' BUTTON PROBLEM) */}
      <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border dark:border-slate-850">
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500/90 dark:text-indigo-400 block mb-1">
          Panel de Acción Directa
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {/* Play / Pause animation solving */}
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

          {/* Instant solver convergence logic */}
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
          {/* Run standard single step loop */}
          <button
            onClick={onSingleStep}
            disabled={isRunning}
            className={`flex items-center justify-center gap-1 px-3 py-1.8 disabled:opacity-50 rounded-xl transition cursor-pointer text-[11px] border ${itemBgClass}`}
            id="btn_single_step"
          >
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            Iteración +1
          </button>

          {/* Restart signal powers */}
          <button
            onClick={onReset}
            className={`flex items-center justify-center gap-1 px-3 py-1.8 rounded-xl transition cursor-pointer text-[11px] border ${itemBgClass}`}
            id="btn_reset"
          >
            <RotateCcw className="w-3 h-3" />
            Resetear Señal
          </button>
        </div>

        <button
          onClick={onClearWalls}
          className={`w-full py-1.8 rounded-xl text-center text-[10px] font-bold shadow-sm transition cursor-pointer border ${itemBgClass} hover:border-rose-300 dark:hover:border-rose-950 hover:bg-rose-500/5`}
          id="btn_clear_walls"
        >
          Limpiar Todo el Plano (Cero Obstáculos)
        </button>
      </div>

      {/* DRAWING TOOLS & PEN SETS SECTION */}
      <div>
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          Herramientas de Lápiz y Pinceles
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {/* Router tool selection */}
          <button
            onClick={() => setSelectedTool("router")}
            className={`flex items-center gap-1.5 px-2.5 py-1.8 rounded-xl border transition text-left cursor-pointer ${
              selectedTool === "router"
                ? isDarkMode 
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-400 shadow-sm font-bold"
                  : "bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm font-bold"
                : itemBgClass
            }`}
            id="tool_router"
          >
            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-emerald-500 text-white font-mono text-[8px] font-bold">R</div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold">Fuente Router</span>
              <span className="text-[8px] text-slate-400 leading-none">Punto Emisor</span>
            </div>
          </button>

          {/* Eraser tool */}
          <button
            onClick={() => setSelectedTool("eraser")}
            className={`flex items-center gap-1.5 px-2.5 py-1.8 rounded-xl border transition text-left cursor-pointer ${
              selectedTool === "eraser"
                ? isDarkMode
                  ? "bg-rose-950/40 border-rose-800 text-rose-400 shadow-sm font-bold"
                  : "bg-rose-50 border-rose-250 text-rose-700 shadow-sm font-bold"
                : itemBgClass
            }`}
            id="tool_eraser"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-500" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold">Borrador</span>
              <span className="text-[8px] text-slate-400 leading-none">Limpiar Celda</span>
            </div>
          </button>
        </div>

        {/* Dynamic obstacle material catalog */}
        <div className="mt-2">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold mb-1 block">Materiales de Construcción Manual:</span>
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
                  <span className="text-[8px] font-black line-clamp-1 leading-none">{material.name.split(" ")[0]}</span>
                  <span className={`text-[7px] font-mono leading-none ${isSelected ? "text-indigo-400" : "text-slate-500"}`}>-{material.dbLoss}dB</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* INTEL ENGINE BLUEPRINT DIGITIZER (IMAGE ➜ MATRIX) - SOLVES SECOND REQUIREMENT */}
      <div className={`p-3 rounded-2xl border ${formBgClass} space-y-2.5 shadow-inner`}>
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Digitalizador de Planos (Imagen ➜ Malla 2D)
          </h4>
          <span className="bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none">
            Mapeo IA
          </span>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
          Coloca o carga un plano técnico con paredes y la aplicación estimará automáticamente sus coordenadas para formar la matriz electromagnética de análisis.
        </p>

        {scanSuccessMsg && (
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-505/20 text-indigo-500 text-[10px] font-bold animate-pulse text-center leading-tight">
            {scanSuccessMsg}
          </div>
        )}

        {/* Blueprint preset test button (1-click conversion without file finding) */}
        <div className="space-y-1">
          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">
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

        {/* Drag & Drop uploader area */}
        <div className="space-y-1">
          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">
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
            <Upload className={`w-5 h-5 ${dragActive ? "text-indigo-400 scale-110 animate-bounce" : "text-slate-450 hover:text-indigo-500"}`} />
            <div className="flex flex-col select-none">
              <span className="text-[9px] font-bold text-slate-300 dark:text-slate-450">Arrastra tu plano o haz clic para subir</span>
              <span className="text-[7.5px] text-slate-450">Acepta JPEG, PNG (Detecta contornos oscuros)</span>
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

        {/* Parameter configuration for scanner */}
        <div className="pt-1.5 border-t dark:border-slate-850/60 grid grid-cols-2 gap-2">
          {/* Scan Wall Material Selector */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[8.5px] font-bold text-slate-400">Material Resultante:</label>
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

          {/* Threshold Slider */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400">
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

      {/* LAPLACE NUMERICAL EQUATORIAL PARAMETERS BLOCK */}
      <div className={`space-y-3 rounded-2xl p-4 border transition-all ${formBgClass}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            Parámetros de Resolución de Laplace
          </h4>
          {!isAdmin && (
            <span className="inline-flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
              <Lock className="w-2.5 h-2.5" />
              Lectura
            </span>
          )}
        </div>

        {/* Selection of Method */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-450 dark:text-slate-650 flex justify-between">
            <span>Método Numérico de Jacobi/Seidel o Relajación:</span>
          </label>
          <select
            value={config.method}
            onChange={handleMethodChange}
            disabled={!isAdmin}
            className={`w-full px-2.5 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-505 focus:outline-none transition ${selectClass} ${!isAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
            id="select_method"
          >
            <option value="jacobi">Método de Jacobi (Malla Espejo)</option>
            <option value="gauss-seidel">Método de Gauss-Seidel (In-Place)</option>
            <option value="sor">Sobre-Relajación Sucesiva (SOR)</option>
            <option value="ssor">Relajación Simétrica (SSOR)</option>
          </select>
        </div>

        {/* Omega Slider (SOR and SSOR) */}
        {(config.method === "sor" || config.method === "ssor") && (
          <div className="flex flex-col gap-0.5 pt-0.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-semibold text-slate-450 dark:text-slate-650">Factor de Relajación Crítico (ω):</span>
              <span className="font-mono text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded leading-none">{config.omega}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.9"
              step="0.05"
              value={config.omega}
              disabled={!isAdmin}
              onChange={(e) => setConfig((prev) => ({ ...prev, omega: parseFloat(e.target.value) }))}
              className={`w-full accent-indigo-500 cursor-pointer my-1 ${!isAdmin ? "opacity-40 cursor-not-allowed" : ""}`}
              id="slider_omega"
            />
            <div className="flex justify-between text-[8px] text-slate-400 font-mono leading-none">
              <span>0.1 (Sub-convergencia)</span>
              <span>1.0 (Sin Relajamiento)</span>
              <span>1.9 (Sobre)</span>
            </div>
          </div>
        )}

        {/* Tolerance and Grid Multipliers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-slate-450 dark:text-slate-650">Tolerancia Límite (ε):</label>
            <select
              value={config.tolerance}
              onChange={(e) => isAdmin && setConfig((prev) => ({ ...prev, tolerance: parseFloat(e.target.value) }))}
              disabled={!isAdmin}
              className={`w-full px-2 py-1 rounded-xl text-[11px] focus:outline-none transition ${selectClass} ${!isAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
              id="select_tolerance"
            >
              <option value="0.01">10⁻² (Rápida)</option>
              <option value="0.001">10⁻³ (Estándar)</option>
              {isAdmin && (
                <>
                  <option value="0.0001">10⁻⁴ (Alta)</option>
                  <option value="0.000001">10⁻⁶ (Laboratorio)</option>
                </>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-semibold text-slate-450 dark:text-slate-650">Malla Nodos (N &times; N):</label>
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

        {/* Animation delay speed control slider */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="font-semibold text-slate-450 dark:text-slate-650 font-sans">Retardo de Animación:</span>
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
            onChange={(e) => setConfig((prev) => ({ ...prev, animationDelay: parseInt(e.target.value) }))}
            className="w-full accent-indigo-500 h-1 cursor-pointer my-1"
            id="slider_delay"
          />
        </div>
      </div>

      {/* FIXED CLASSIC PRESET LOADERS BOX */}
      <div className={`border-t pt-3 ${isDarkMode ? "border-slate-850" : "border-slate-100"}`}>
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
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
