import React from "react";
import { RunHistory, SolverMethod, ValidationSummary } from "../types";
import { TrendingDown, Zap, BarChart3, FileDown, ShieldCheck, Activity, BookOpen } from "lucide-react";

interface GraphPanelProps {
  history: RunHistory[];
  onClearHistory: () => void;
  currentErrorHistory: number[];
  tolerance: number;
  currentIteration: number;
  currentError: number;
  timeMs: number;
  isConverged: boolean;
  method: SolverMethod;
  isDarkMode: boolean;
  onDownloadFullReport?: () => void;
  validationSummary?: ValidationSummary;
  onCompareMethods?: () => void;
  activeFrequency?: "2.4 GHz" | "5 GHz";
}

export default function GraphPanel({
  history,
  onClearHistory,
  currentErrorHistory,
  tolerance,
  currentIteration,
  currentError,
  timeMs,
  isConverged,
  method,
  isDarkMode,
  onDownloadFullReport,
  validationSummary,
  onCompareMethods,
  activeFrequency = "2.4 GHz",
}: GraphPanelProps) {

  const formatMethodName = (m: SolverMethod): string => {
    if (m === "jacobi") return "Jacobi";
    if (m === "gauss-seidel") return "Gauss-Seidel";
    return "SOR";
  };

  const renderConvergenceSvgGraph = () => {
    if (currentErrorHistory.length < 2) {
      const dashedBorder = isDarkMode ? "border-slate-800 text-slate-650" : "border-slate-200 text-slate-400";
      const bgLightClass = isDarkMode ? "bg-slate-950/30" : "bg-slate-50/50";
      return (
        <div className={`flex flex-col items-center justify-center h-44 border border-dashed rounded-2xl font-mono text-xs ${dashedBorder} ${bgLightClass}`}>
          <span>Convergencia numérica en espera</span>
          <span className="text-[10px] text-slate-550 dark:text-slate-500 mt-1">Haga clic en 'Instantáneo' o 'Animar' para graficar el residuo ||r⁽ᵏ⁾||∞</span>
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const errors = currentErrorHistory.map((e) => Math.max(e, 1e-12));
    const logList = errors.map((e) => Math.log10(e));

    const minLog = -6;
    const maxLog = 2;
    const yRange = maxLog - minLog;

    const getX = (index: number) => {
      const pct = index / (errors.length - 1);
      return paddingLeft + pct * plotWidth;
    };

    const getY = (logVal: number) => {
      const clipped = Math.max(minLog, Math.min(maxLog, logVal));
      const pct = (clipped - minLog) / yRange;
      return height - paddingBottom - pct * plotHeight;
    };

    const points = logList.map((logVal, index) => ({
      x: getX(index),
      y: getY(logVal),
    }));

    let strokePathData = "";
    let areaPathData = "";

    if (points.length > 0) {
      strokePathData = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
      areaPathData = `${strokePathData} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }

    const gridColor = isDarkMode ? "#334155" : "#e2e8f0";
    const bottomLineColor = isDarkMode ? "#475569" : "#cbd5e1";
    const graphBg = isDarkMode ? "bg-slate-950/60" : "bg-slate-50/50";
    const labelColor = isDarkMode ? "#64748b" : "#94a3b8";

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-auto rounded-2xl p-2 border ${isDarkMode ? "border-slate-850" : "border-slate-200"} ${graphBg}`}>
          <defs>
            <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="gradient-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke={gridColor} strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight / 2} x2={width - paddingRight} y2={paddingTop + plotHeight / 2} stroke={gridColor} strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke={bottomLineColor} />

          <text x={paddingLeft - 8} y={paddingTop + 4} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="end">10¹</text>
          <text x={paddingLeft - 8} y={paddingTop + plotHeight / 2 + 4} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="end">10⁻²</text>
          <text x={paddingLeft - 8} y={height - paddingBottom + 4} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="end">&epsilon;</text>

          <text x={paddingLeft} y={height - 8} fill={labelColor} className="text-[9px] font-mono font-bold">It. 1</text>
          <text x={paddingLeft + plotWidth / 2} y={height - 8} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="middle">k = {Math.round(currentErrorHistory.length / 2)}</text>
          <text x={width - paddingRight} y={height - 8} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="end">It. {currentErrorHistory.length}</text>

          {areaPathData && <path d={areaPathData} fill="url(#gradient-area)" />}

          {strokePathData && (
            <path
              d={strokePathData}
              fill="none"
              stroke="url(#gradient-stroke)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.length > 0 && (
            <>
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="#10b981" />
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="10" fill="none" stroke="#10b981" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${points[points.length - 1].x}px ${points[points.length - 1].y}px` }} />
            </>
          )}
        </svg>
        <span className="absolute bottom-10 right-4 font-mono text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Log₁₀‖u⁽ᵏ⁺¹⁾ - u⁽ᵏ⁾‖∞</span>
      </div>
    );
  };

  const renderValidationSvgGraph = () => {
    const pts = validationSummary?.points || [];
    if (pts.length < 2) {
      return null;
    }

    const width = 500;
    const height = 165;
    const paddingLeft = 48;
    const paddingRight = 18;
    const paddingTop = 18;
    const paddingBottom = 28;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const minDbm = -85;
    const maxDbm = -25;
    const dbmRange = maxDbm - minDbm;

    const minDist = pts[0].distanceM;
    const maxDist = Math.max(pts[pts.length - 1].distanceM, minDist + 0.5);

    const getX = (d: number) => {
      const pct = (d - minDist) / (maxDist - minDist);
      return paddingLeft + pct * plotWidth;
    };

    const getY = (dbm: number) => {
      const clipped = Math.max(minDbm, Math.min(maxDbm, dbm));
      const pct = (clipped - minDbm) / dbmRange;
      return height - paddingBottom - pct * plotHeight;
    };

    const numCoords = pts.map((p) => ({ x: getX(p.distanceM), y: getY(p.numericalDbm) }));
    const anaCoords = pts.map((p) => ({ x: getX(p.distanceM), y: getY(p.analyticalDbm) }));

    const numPath = `M ${numCoords[0].x} ${numCoords[0].y} ` + numCoords.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
    const anaPath = `M ${anaCoords[0].x} ${anaCoords[0].y} ` + anaCoords.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");

    const gridColor = isDarkMode ? "#334155" : "#e2e8f0";
    const bottomLineColor = isDarkMode ? "#475569" : "#cbd5e1";
    const graphBg = isDarkMode ? "bg-slate-950/60" : "bg-slate-50/50";
    const labelColor = isDarkMode ? "#64748b" : "#94a3b8";

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-auto rounded-2xl p-2 border ${isDarkMode ? "border-slate-850" : "border-slate-200"} ${graphBg}`}>
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke={gridColor} strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight / 2} x2={width - paddingRight} y2={paddingTop + plotHeight / 2} stroke={gridColor} strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke={bottomLineColor} />

          <text x={paddingLeft - 6} y={paddingTop + 4} fill={labelColor} className="text-[8.5px] font-mono font-bold" textAnchor="end">-25 dBm</text>
          <text x={paddingLeft - 6} y={paddingTop + plotHeight / 2 + 4} fill={labelColor} className="text-[8.5px] font-mono font-bold" textAnchor="end">-55 dBm</text>
          <text x={paddingLeft - 6} y={height - paddingBottom + 4} fill={labelColor} className="text-[8.5px] font-mono font-bold" textAnchor="end">-85 dBm</text>

          <text x={paddingLeft} y={height - 8} fill={labelColor} className="text-[8.5px] font-mono font-bold">{minDist.toFixed(1)} m</text>
          <text x={paddingLeft + plotWidth / 2} y={height - 8} fill={labelColor} className="text-[8.5px] font-mono font-bold" textAnchor="middle">Distancia radial r (m)</text>
          <text x={width - paddingRight} y={height - 8} fill={labelColor} className="text-[8.5px] font-mono font-bold" textAnchor="end">{maxDist.toFixed(1)} m</text>

          {/* Analytical Curve (Dashed Amber) */}
          <path d={anaPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,4" strokeLinecap="round" />

          {/* Numerical Curve (Solid Emerald/Indigo) */}
          <path d={numPath} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />

          {numCoords.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="2.8" fill="#10b981" />
          ))}
        </svg>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-1 text-[10px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-500">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
              Simulación Numérica (Diferencias Finitas 2D)
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-amber-500">
              <span className="w-3 h-0.5 bg-amber-500 inline-block border-b border-dashed" />
              Modelo Analítico (ITU-R P.1238 / Log-Distancia)
            </span>
          </div>
          {validationSummary && (
            <div className="font-mono text-[10px] flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                RMSE = {validationSummary.rmseDb} dB
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                R² = {validationSummary.rSquared}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const exportHistoryToCsv = () => {
    if (history.length === 0) return;

    let rawCsv = "Metodo,Dimensiones,Iteraciones,TiempoMs,ErrorFinal,Convergio,RelaxationOmega,Tolerancia\n";
    history.forEach((run) => {
      rawCsv += `${run.method},${run.gridSize},${run.iterations},${run.executionTimeMs},${run.finalError},${run.converged},${run.omega},${run.tolerance}\n`;
    });

    const encodeUri = encodeURI("data:text/csv;charset=utf-8," + rawCsv);
    const link = document.createElement("a");
    link.setAttribute("href", encodeUri);
    const timestamp = new Date().getTime();
    const filename = `comparativa_metodos_diferencias_finitas_${timestamp}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    fetch("/api/guardar-resultado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: filename,
        content: rawCsv,
        type: "csv"
      })
    })
      .then(res => res.json())
      .then(data => console.log("Resultado CSV guardado en el servidor:", data))
      .catch(err => console.error("Error al guardar CSV en el servidor", err));
  };

  const mainCardClass = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-800 shadow-sm";

  const headerBorders = isDarkMode ? "border-slate-850" : "border-slate-100";
  const bentoGridBg = isDarkMode ? "bg-slate-950/65 border-slate-850" : "bg-slate-50 border-slate-150";

  return (
    <div className={`flex flex-col gap-6 rounded-3xl border p-6 transition-all duration-300 ${mainCardClass}`}>
      {/* Bloque 1: Modelo Físico Electromagnético y Ecuación Resuelta */}
      <div className={`p-4 rounded-2xl border ${bentoGridBg}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            Modelo Físico Electromagnético Resuelto Numéricamente
          </h4>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
            Diferencias Finitas 2D • {activeFrequency}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
          <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="text-[9px] font-sans font-bold uppercase text-slate-400 mb-1">1. EDP Estacionaria con Absorción</div>
            <div className="text-emerald-500 font-bold">∇²u(x,y) - κ²(x,y)u(x,y) = 0</div>
            <div className="text-[9.5px] font-sans text-slate-400 mt-1">
              Esquema de 5 puntos: uᵢ,ⱼ = (1 - αᵢ,ⱼ)(uᵢ₊₁,ⱼ + uᵢ₋₁,ⱼ + uᵢ,ⱼ₊₁ + uᵢ,ⱼ₋₁)/4
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="text-[9px] font-sans font-bold uppercase text-slate-400 mb-1">2. Vector de Poynting y Campo E</div>
            <div className="text-indigo-400 font-bold">⟨S⟩ = E²_rms / η₀ = 4πP_rx / λ²</div>
            <div className="text-[9.5px] font-sans text-slate-400 mt-1">
              Impedancia intrínseca η₀ = 376.7 Ω; E_rms = √(η₀·⟨S⟩) [V/m]
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="text-[9px] font-sans font-bold uppercase text-slate-400 mb-1">3. Relajación Sucesiva (SOR)</div>
            <div className="text-amber-400 font-bold">u⁽ᵏ⁺¹⁾ = (1 - ω)u⁽ᵏ⁾ + ω·u_GS</div>
            <div className="text-[9.5px] font-sans text-slate-400 mt-1">
              Condiciones de frontera de Dirichlet en fuente (PIRE) y bordes (u=0)
            </div>
          </div>
        </div>
      </div>

      {/* Encabezado de Métricas Numéricas */}
      <div className={`border-b pb-4 flex flex-wrap items-center justify-between gap-2 ${headerBorders}`}>
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Diagnóstico Numérico y Validación Física
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Monitoreo de convergencia iterativa ({formatMethodName(method)}) y contraste con el modelo analítico de propagación.
          </p>
        </div>
        {onCompareMethods && (
          <button
            onClick={onCompareMethods}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
            id="btn_compare_all_methods"
          >
            <Activity className="w-3.5 h-3.5" />
            Comparar Jacobi vs Gauss-Seidel vs SOR
          </button>
        )}
      </div>

      {/* Indicadores de telemetría en vivo */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl border ${bentoGridBg}`}>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wide font-bold">Iteración Actual (k)</span>
          <span className={`font-mono text-xl font-extrabold mt-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{currentIteration}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wide font-bold">Residuo Máximo ‖r⁽ᵏ⁾‖∞</span>
          <span className={`font-mono text-xl font-extrabold mt-0.5 ${currentError <= tolerance ? "text-emerald-500 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-450"}`}>
            {currentError < 0.00001 ? currentError.toExponential(3) : currentError.toFixed(5)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wide font-bold">Tiempo de Cómputo</span>
          <span className={`font-mono text-xl font-extrabold mt-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{timeMs} ms</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wide font-bold">Estado del Sistema</span>
          <div className="flex items-center gap-1 mt-1 text-xs">
            {isConverged ? (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                isDarkMode
                  ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}>
                Convergido (Estacionario)
              </span>
            ) : currentIteration > 0 && currentError > tolerance ? (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border animate-pulse ${
                isDarkMode
                  ? "bg-sky-950/40 border-sky-850/40 text-sky-400"
                  : "bg-sky-50 border-sky-200 text-sky-700"
              }`}>
                Iterando...
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                isDarkMode
                  ? "bg-slate-950 border-slate-800 text-slate-500"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}>
                Listo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Gráficas: Validación Física y Convergencia Numérica */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Validación Física: Perfil Radial vs. Modelo Analítico
          </h4>
          {renderValidationSvgGraph()}
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-indigo-500" />
            Decaimiento Logarítmico del Error Residual
          </h4>
          {renderConvergenceSvgGraph()}
        </div>
      </div>

      {/* Tabla Comparativa de Experimentos */}
      <div className="flex-1 flex flex-col min-h-[190px]">
        <div className="flex justify-between items-center mb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-405 dark:text-slate-550 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Bitácora Comparativa de Métodos Numéricos (Jacobi / Gauss-Seidel / SOR)
          </h4>
          {history.length > 0 && (
            <div className="flex gap-2 items-center flex-wrap">
              {onDownloadFullReport && (
                <button
                  onClick={onDownloadFullReport}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold border rounded-xl transition cursor-pointer ${
                    isDarkMode
                      ? "bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 border-indigo-800/60"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                  }`}
                  id="btn_download_full_report"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Descargar Informe Físico (.txt)
                </button>
              )}
              <button
                onClick={exportHistoryToCsv}
                className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold border rounded-xl transition cursor-pointer ${
                  isDarkMode
                    ? "bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800/60"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                }`}
                id="btn_export_csv"
              >
                <FileDown className="w-3.5 h-3.5" />
                Exportar CSV
              </button>
              <button
                onClick={onClearHistory}
                className="text-[10px] text-slate-400 hover:text-rose-600 font-extrabold px-1.5 cursor-pointer"
                id="btn_clear_history"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className={`flex-1 flex flex-col items-center justify-center border border-dashed p-6 rounded-2xl text-center gap-1 ${
            isDarkMode
              ? "border-slate-800 bg-slate-950/20 text-slate-550"
              : "border-slate-250 bg-slate-50/40 text-slate-600"
          }`}>
            <span className="text-xs font-bold">Comparación de convergencia numérica</span>
            <span className="text-[10px] max-w-md leading-relaxed font-semibold text-slate-450 dark:text-slate-500">
              Haz clic en el botón superior "Comparar Jacobi vs Gauss-Seidel vs SOR" o ejecuta una simulación para cuantificar la aceleración espectral del factor de sobre-relajación &omega;.
            </span>
          </div>
        ) : (
          <div className={`overflow-x-auto flex-1 max-h-[220px] border rounded-2xl shadow-inner ${
            isDarkMode ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white"
          }`}>
            <table className={`w-full text-left text-xs ${isDarkMode ? "bg-slate-900/50" : "bg-white"}`}>
              <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                isDarkMode ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
              }`}>
                <tr>
                  <th className="py-2.5 px-3">Método Numérico</th>
                  <th className="py-2.5 px-3">Malla</th>
                  <th className="py-2.5 px-3">Iteraciones</th>
                  <th className="py-2.5 px-3">Tiempo CPU</th>
                  <th className="py-2.5 px-3">Residuo Final</th>
                  <th className="py-2.5 px-3">Convergencia</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-[11px] ${isDarkMode ? "divide-slate-850" : "divide-slate-100"}`}>
                {history.map((run) => (
                  <tr key={run.id} className={isDarkMode ? "hover:bg-slate-850/40" : "hover:bg-slate-50/50"}>
                    <td className="py-2.5 px-3 font-semibold text-indigo-500 dark:text-indigo-400">
                      {formatMethodName(run.method)} {run.method === "sor" ? `(ω=${run.omega})` : run.method === "gauss-seidel" ? "(ω=1.0)" : "(Simultáneo)"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-450 dark:text-slate-500">{run.gridSize}</td>
                    <td className={`py-2.5 px-3 font-bold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>{run.iterations}</td>
                    <td className={`py-2.5 px-3 ${isDarkMode ? "text-slate-350" : "text-slate-700"}`}>{run.executionTimeMs} ms</td>
                    <td className="py-2.5 px-3 text-slate-500">{run.finalError < 1e-4 ? run.finalError.toExponential(2) : run.finalError.toFixed(5)}</td>
                    <td className="py-2.5 px-3">
                      {run.converged ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                          isDarkMode
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }`}>
                          Convergido
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                            isDarkMode
                              ? "bg-amber-950/40 text-amber-400 border-amber-900/60"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                        >
                          Límite Iter.
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
