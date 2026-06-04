import React from "react";
import { RunHistory, SolverMethod } from "../types";
import { TrendingDown, Zap, BarChart3, FileDown, CheckCircle2 } from "lucide-react";

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
}: GraphPanelProps) {
  
  const formatMethodName = (m: SolverMethod): string => {
    switch (m) {
      case "jacobi":
        return "Jacobi";
      case "gauss-seidel":
        return "Gauss-Seidel";
      case "sor":
        return "SOR";
      case "ssor":
        return "SSOR";
    }
  };

  const renderConvergenceSvgGraph = () => {
    if (currentErrorHistory.length < 2) {
      const dashedBorder = isDarkMode ? "border-slate-800 text-slate-650" : "border-slate-200 text-slate-400";
      const bgLightClass = isDarkMode ? "bg-slate-950/30" : "bg-slate-50/50";
      return (
        <div className={`flex flex-col items-center justify-center h-48 border border-dashed rounded-2xl font-mono text-xs ${dashedBorder} ${bgLightClass}`}>
          <span>Rendimiento dinámico no iniciado</span>
          <span className="text-[10px] text-slate-550 dark:text-slate-500 mt-1">Haga clic en 'Resolver' o 'Animar' para graficar el residuo</span>
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

          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke={gridColor} strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight / 2} x2={width - paddingRight} y2={paddingTop + plotHeight / 2} stroke={gridColor} strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke={bottomLineColor} />

          {/* Boundaries labels */}
          <text x={paddingLeft - 8} y={paddingTop + 4} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="end">10¹</text>
          <text x={paddingLeft - 8} y={paddingTop + plotHeight / 2 + 4} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="end">10⁻²</text>
          <text x={paddingLeft - 8} y={height - paddingBottom + 4} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="end">&epsilon;</text>

          {/* Horizontal Labels */}
          <text x={paddingLeft} y={height - 8} fill={labelColor} className="text-[9px] font-mono font-bold">It. 1</text>
          <text x={paddingLeft + plotWidth / 2} y={height - 8} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="middle">k = {Math.round(currentErrorHistory.length / 2)}</text>
          <text x={width - paddingRight} y={height - 8} fill={labelColor} className="text-[9px] font-mono font-bold" textAnchor="end">It. {currentErrorHistory.length}</text>

          {/* Area under curve */}
          {areaPathData && <path d={areaPathData} fill="url(#gradient-area)" />}

          {/* Main Curve */}
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

          {/* Pulsating last dot */}
          {points.length > 0 && (
            <>
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="#10b981" />
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="10" fill="none" stroke="#10b981" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${points[points.length - 1].x}px ${points[points.length - 1].y}px` }} />
            </>
          )}
        </svg>
        <span className="absolute bottom-10 right-4 font-mono text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Log10‖E‖₂ Residuo</span>
      </div>
    );
  };

  const exportHistoryToCsv = () => {
    if (history.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metodo,Dimensiones,Iteraciones,TiempoMs,ErrorFinal,Convergio,RelaxationOmega,Tolerancia\n";
    
    history.forEach((run) => {
      csvContent += `${run.method},${run.gridSize},${run.iterations},${run.executionTimeMs},${run.finalError},${run.converged},${run.omega},${run.tolerance}\n`;
    });
    
    const encodeUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodeUri);
    link.setAttribute("download", "comparativa_wifi_metodos_num.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mainCardClass = isDarkMode 
    ? "bg-slate-900 border-slate-800 text-slate-100" 
    : "bg-white border-slate-200 text-slate-800 shadow-sm";

  const headerBorders = isDarkMode ? "border-slate-850" : "border-slate-100";
  const bentoGridBg = isDarkMode ? "bg-slate-950/65 border-slate-850" : "bg-slate-50 border-slate-150";

  return (
    <div className={`flex flex-col gap-6 rounded-3xl border p-6 transition-all duration-300 ${mainCardClass}`}>
      {/* Metrics Header */}
      <div className={`border-b pb-4 ${headerBorders}`}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Rendimiento y Diagnóstico Numérico
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Resultados en tiempo real recopilados del solucionador de la ecuación de Laplace.
        </p>
      </div>

      {/* Live Solvers Telemetry Indicators inside modern bento compartments */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl border ${bentoGridBg}`}>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wide font-bold">Iteración Actual</span>
          <span className={`font-mono text-xl font-extrabold mt-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{currentIteration}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wide font-bold">Residuo Máximo (Error)</span>
          <span className={`font-mono text-xl font-extrabold mt-0.5 ${currentError <= tolerance ? "text-emerald-500 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-450"}`}>
            {currentError < 0.00001 ? currentError.toExponential(3) : currentError.toFixed(5)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wide font-bold">Tiempo Ejecución</span>
          <span className={`font-mono text-xl font-extrabold mt-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{timeMs} ms</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wide font-bold">Convergencia</span>
          <div className="flex items-center gap-1 mt-1 text-xs">
            {isConverged ? (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                isDarkMode 
                  ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400" 
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}>
                Estable
              </span>
            ) : currentIteration > 0 && currentError > tolerance ? (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border animate-pulse ${
                isDarkMode
                  ? "bg-sky-950/40 border-sky-850/40 text-sky-400"
                  : "bg-sky-50 border-sky-200 text-sky-700"
              }`}>
                Calculando...
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                isDarkMode
                  ? "bg-slate-950 border-slate-800 text-slate-500"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}>
                Detenido
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Residue Convergence Graph */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-405 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
          <TrendingDown className="w-4 h-4 text-indigo-500" />
          Curva de Convergencia Logarítmica
        </h4>
        {renderConvergenceSvgGraph()}
      </div>

      {/* Comparisons Logs Database */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <div className="flex justify-between items-center mb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-405 dark:text-slate-550 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 animate-bounce-slow" />
            Tabla Comparativa de Experimentos
          </h4>
          {history.length > 0 && (
            <div className="flex gap-2">
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
            <span className="text-xs font-bold">¿Cuál método convergerá más rápido?</span>
            <span className="text-[10px] max-w-xs leading-relaxed font-semibold text-slate-450 dark:text-slate-500">
              Resuelve con Jacobi, luego selecciona SOR y compara el número de iteraciones necesarias para lograr estabilidad inalámbrica.
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
                  <th className="py-2.5 px-3">Método</th>
                  <th className="py-2.5 px-3">Malla</th>
                  <th className="py-2.5 px-3">Iteraciones</th>
                  <th className="py-2.5 px-3">Tiempo</th>
                  <th className="py-2.5 px-3">Error Final</th>
                  <th className="py-2.5 px-3">Estabilidad</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-[11px] ${isDarkMode ? "divide-slate-850" : "divide-slate-100"}`}>
                {history.map((run) => (
                  <tr key={run.id} className={isDarkMode ? "hover:bg-slate-850/40" : "hover:bg-slate-50/50"}>
                    <td className="py-2.5 px-3 font-semibold text-indigo-500 dark:text-indigo-400">
                      {formatMethodName(run.method)} {run.method === "sor" || run.method === "ssor" ? `(ω=${run.omega})` : ""}
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
                          Alta
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                          isDarkMode 
                            ? "bg-rose-950/40 text-rose-400 border-rose-900/60" 
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                          Inestable
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
