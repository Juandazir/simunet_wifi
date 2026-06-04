import React, { useRef, useState } from "react";
import { Cell, MaterialType, RouterConfig } from "../traduccion/types";
import { MATERIALS, getDbmValue, getSignalQuality } from "../metodos/solver";
import { Router, Trash2, Eraser, PenTool, Radio, HelpCircle, Eye, EyeOff } from "lucide-react";

interface NetworkGridProps {
  grid: Cell[][];
  onCellClick: (x: number, y: number) => void;
  onCellMouseDown: (x: number, y: number) => void;
  onCellMouseEnter: (x: number, y: number) => void;
  onCellMouseUp: () => void;
  routers: RouterConfig[];
  selectedTool: "router" | MaterialType | "eraser";
  hoveredCell: Cell | null;
  setHoveredCell: (cell: Cell | null) => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  showValues: boolean;
  setShowValues: (show: boolean) => void;
  isDarkMode: boolean;
}

export default function NetworkGrid({
  grid,
  onCellClick,
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
}: NetworkGridProps) {
  
  // Calculate a beautiful thermal color for the cell based on its power [0 - 100]
  const getCellBgColor = (cell: Cell) => {
    if (cell.type === "wall") {
      switch (cell.material) {
        case "drywall":
          return isDarkMode ? "bg-slate-700 border-slate-650" : "bg-slate-300 border-slate-400";
        case "brick":
          return isDarkMode ? "bg-amber-800/80 border-amber-700/60" : "bg-amber-600 border-amber-700";
        case "concrete":
          return isDarkMode ? "bg-slate-600 border-slate-500" : "bg-slate-600 border-slate-700";
        case "metal":
          return isDarkMode ? "bg-zinc-700 border-zinc-650 animate-pulse" : "bg-slate-700 border-slate-800 shadow-inner animate-pulse";
        default:
          return "bg-slate-400";
      }
    }

    if (cell.type === "router") {
      return "bg-emerald-500 border-emerald-600 text-white shadow-md";
    }

    if (!showHeatmap) {
      return isDarkMode ? "bg-slate-950/40 border-slate-900/50" : "bg-slate-100/40 border-slate-200/20";
    }

    const val = cell.val;
    if (val <= 1.0) {
      return isDarkMode ? "bg-slate-950 border-slate-950" : "bg-slate-50 border-slate-100";
    }

    // Custom gradient interpolation designed to look clean on light or dark modes
    if (val < 15) {
      const ratio = val / 15;
      return `rgba(59, 130, 246, ${isDarkMode ? 0.25 + ratio * 0.35 : 0.15 + ratio * 0.25})`; // Blue
    } else if (val < 45) {
      const ratio = (val - 15) / 30;
      return `rgba(139, 92, 246, ${isDarkMode ? 0.5 + ratio * 0.3 : 0.4 + ratio * 0.35})`; // Violet
    } else if (val < 75) {
      const ratio = (val - 45) / 30;
      return `rgba(249, 115, 22, ${isDarkMode ? 0.8 + ratio * 0.15 : 0.75 + ratio * 0.15})`; // Orange
    } else {
      const ratio = (val - 75) / 25;
      return `rgba(234, 179, 8, ${isDarkMode ? 0.9 + ratio * 0.1 : 0.85 + ratio * 0.15})`; // Yellow
    }
  };

  const getDbmColorClass = (dbm: number) => {
    if (dbm >= -50) return isDarkMode ? "text-emerald-400 font-extrabold" : "text-emerald-600 font-bold";
    if (dbm >= -65) return isDarkMode ? "text-teal-400 font-bold" : "text-teal-600 font-semibold";
    if (dbm >= -75) return isDarkMode ? "text-amber-400" : "text-amber-600";
    if (dbm >= -85) return isDarkMode ? "text-orange-400" : "text-orange-650";
    return isDarkMode ? "text-rose-400 font-bold" : "text-rose-600 font-medium";
  };

  const cardBgClass = isDarkMode 
    ? "bg-slate-900 border-slate-800 text-slate-100" 
    : "bg-white border-slate-200 text-slate-800 shadow-sm";

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

  const outerBoundaryBg = isDarkMode ? "bg-slate-950/20 text-slate-700 border-slate-900" : "opacity-35 bg-slate-200 text-slate-450 border-slate-200/50";

  return (
    <div className={`flex flex-col h-full rounded-3xl border p-6 justify-between transition-all duration-300 ${cardBgClass}`}>
      {/* Grid Headers and Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 ${isDarkMode ? "border-slate-850" : "border-slate-100"}`}>
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-500 animate-pulse" />
            Entorno de Simulación 2D
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-505 mt-0.5">
            Dibuja obstáculos o posiciona un nuevo router en la malla presionando y arrastrando.
          </p>
        </div>

        <div className="flex gap-2">
          {/* Map display options in modern bento style */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${toggleBtnClass(showHeatmap)}`}
            title="Alternar Mapa de Calor"
            id="btn_toggle_heatmap"
          >
            {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Mapa de Calor
          </button>

          <button
            onClick={() => setShowValues(!showValues)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${toggleBtnClass(showValues)}`}
            title="Alternar Valores Numéricos"
            id="btn_toggle_values"
          >
            <span className="font-mono text-xs font-bold">%</span>
            Valores
          </button>
        </div>
      </div>

      {/* Grid Mesh Wrapper */}
      <div 
        className={`flex-1 flex items-center justify-center p-3 rounded-2xl border overflow-auto cursor-crosshair select-none relative min-h-[300px] ${
          isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50/70 border-slate-100"
        }`}
        onMouseLeave={() => setHoveredCell(null)}
      >
        <div 
          className={`grid gap-[1px] p-[1.5px] rounded-xl shadow-sm max-w-full ${
            isDarkMode ? "bg-slate-850" : "bg-slate-200/60"
          }`}
          style={{
            gridTemplateRows: `repeat(${grid.length}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${grid[0]?.length || 1}, minmax(0, 1fr))`
          }}
          onMouseUp={onCellMouseUp}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const bgStyle = getCellBgColor(cell);
              const isRouter = cell.type === "router";
              const isBoundary = cell.x === 0 || cell.x === grid.length - 1 || cell.y === 0 || cell.y === grid[0].length - 1;

              // Grid cell is determined
              const textContrastClass = showHeatmap && cell.val > 45 
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
                    backgroundColor: cell.type !== "wall" && cell.type !== "router" ? bgStyle : undefined,
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-sm transition-all duration-100 border-[0.5px] border-slate-200/10 text-[8px] font-mono select-none relative ${
                    cell.type === "wall" || cell.type === "router" ? bgStyle : ""
                  } ${
                    isBoundary ? outerBoundaryBg : "cursor-pointer hover:scale-105 hover:z-10"
                  }`}
                >
                  {isRouter ? (
                    <Router className="w-5 h-5 text-white animate-pulse" />
                  ) : cell.type === "wall" ? (
                    <div className={`w-full h-full opacity-70 flex items-center justify-center font-bold text-[9px] ${
                      isDarkMode ? "text-slate-200" : "text-slate-800"
                    }`}>
                      {cell.material[0].toUpperCase()}
                    </div>
                  ) : showValues && !isBoundary && cell.val > 0.1 ? (
                    <span className={textContrastClass}>
                      {Math.round(cell.val)}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hover Cell Inspector Bar formatted as a pristine Bento item */}
      <div className={`min-h-[56px] border-t mt-4 pt-3 flex flex-wrap items-center justify-between text-xs gap-4 ${
        isDarkMode ? "border-slate-850 text-slate-350" : "border-slate-100 text-slate-600"
      }`}>
        {hoveredCell ? (
          (() => {
            const dbm = getDbmValue(hoveredCell.val);
            const qual = getSignalQuality(dbm);
            const isBoundary = hoveredCell.x === 0 || hoveredCell.x === grid.length - 1 || hoveredCell.y === 0 || hoveredCell.y === grid[0].length - 1;

            return (
              <div className="flex flex-wrap items-center justify-between w-full gap-2">
                <div className="flex items-center gap-3">
                  <div className={`font-mono px-2.5 py-1 rounded-lg border shadow-sm font-semibold ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-850 text-slate-300" 
                      : "bg-slate-100 border-slate-200 text-slate-700"
                  }`}>
                    Celda: [{hoveredCell.x}, {hoveredCell.y}]
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500">Tipo:</span>
                    <span className={`capitalize font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                      {isBoundary 
                        ? "Borde (Frontera Dirichlet)" 
                        : hoveredCell.type === "router" 
                        ? "Enrutador WiFi" 
                        : hoveredCell.type === "wall" 
                        ? `Pared (${MATERIALS[hoveredCell.material].name})` 
                        : "Espacio de Aire"}
                    </span>
                  </div>
                </div>

                {!isBoundary && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Potencia:</span>
                      <span className={`font-bold ${getDbmColorClass(dbm)}`}>
                        {dbm} dBm ({Math.round(hoveredCell.val)}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${qual.bg}`} />
                      <span className={`font-semibold ${qual.color}`}>{qual.text}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center w-full text-slate-400 py-1 gap-2">
            <HelpCircle className="w-4.5 h-4.5 text-slate-400" />
            <span>Coloca el cursor sobre la malla para inspeccionar la potencia del Wi-Fi en tiempo real.</span>
          </div>
        )}
      </div>
    </div>
  );
}
