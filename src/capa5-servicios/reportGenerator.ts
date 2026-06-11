import { Cell, RunHistory, RouterConfig, SimulationConfig, UserProfile, METHOD_LABELS } from "../capa1-dominio";
import { convertirADbm } from "./servicios";

interface ReportContext {
  currentUser: UserProfile;
  gridSize: { rows: number; cols: number };
  cellSize: number;
  walls: { x: number; y: number; material: string }[];
  routers: RouterConfig[];
  config: SimulationConfig;
  currentIteration: number;
  currentError: number;
  timeMs: number;
  history: RunHistory[];
  grid: Cell[][];
}

export function generateReportAnalysisText(
  history: RunHistory[],
  gridSize: { rows: number; cols: number },
  wallsCount: number
): string {
  if (history.length === 0) {
    return "No se registran simulaciones finalizadas en esta sesión para elaborar el dictamen técnico comparativo de algoritmos.";
  }

  const optimalRun = [...history].sort((a, b) => a.executionTimeMs - b.executionTimeMs)[0];
  const isSOROptimal = optimalRun.method === "sor";
  const methodLabel = METHOD_LABELS[optimalRun.method] ?? optimalRun.method.toUpperCase();

  return [
    `En base a ${history.length} simulaciones numéricas sobre un mapa de ${gridSize.rows}x${gridSize.cols} (${gridSize.rows * gridSize.cols} nodos), se evaluó el comportamiento inalámbrico y la tasa de atenuación.`,
    `El método más rápido registrado fue ${methodLabel} (${optimalRun.iterations} iteraciones en ${optimalRun.executionTimeMs} ms${optimalRun.method === "sor" ? ` con ω=${optimalRun.omega}` : ""}). ${
      isSOROptimal
        ? "Esto valida la teoría: SOR con factor ω óptimo supera a Jacobi y Gauss-Seidel en velocidad de convergencia."
        : "Se recomienda probar SOR con ω entre 1.1 y 1.4 para comparar la aceleración de convergencia."
    }`,
    `Atenuación física: ${wallsCount} obstáculos activos. ${
      wallsCount > 25
        ? "La densidad de atenuadores crea zonas con señal por debajo de -75 dBm que restringen la cobertura útil."
        : "La distribución actual permite un radio de cobertura equilibrado sin zonas oscuras significativas."
    }`,
  ].join("\n\n");
}

export function downloadFullMeshReport(ctx: ReportContext): void {
  const {
    currentUser,
    gridSize,
    cellSize,
    walls,
    routers,
    config,
    currentIteration,
    currentError,
    timeMs,
    history,
    grid,
  } = ctx;

  let content = "";
  content += "================================================================================\n";
  content += "        REPORTE TÉCNICO OFICIAL DE SIMULACIÓN DE COBERTURA WiFi               \n";
  content += "              SIMUNET - RESOLVEDOR DE ECUACIONES DE LAPLACE                   \n";
  content += "================================================================================\n\n";

  content += `Fecha de Expedición: ${new Date().toLocaleString()}\n`;
  content += `Operador: ${currentUser.username} (${currentUser.role})\n`;
  content += `Dimensiones físicas: ${(gridSize.rows * cellSize).toFixed(1)}m x ${(gridSize.cols * cellSize).toFixed(1)}m\n`;
  content += `Resolución espacial: ${cellSize}m/celda | Área: ${(gridSize.rows * gridSize.cols * cellSize * cellSize).toFixed(1)} m²\n`;
  content += `Nodos computacionales: ${gridSize.rows} x ${gridSize.cols}\n`;
  content += `Obstrucciones: ${walls.length} | Enrutadores: ${routers.length}\n\n`;

  content += "--------------------------------------------------------------------------------\n";
  content += "1. PARÁMETROS DEL MOTOR NUMÉRICO\n";
  content += "--------------------------------------------------------------------------------\n";
  content += `Método: ${METHOD_LABELS[config.method] ?? config.method}\n`;
  content += `Omega (ω): ${config.omega}\n`;
  content += `Tolerancia (ε): ${config.tolerance}\n`;
  content += `Iteraciones máximas: ${config.maxIterations}\n`;
  content += `Última ejecución: ${currentIteration} itr | Residuo: ${currentError} | Tiempo: ${timeMs} ms\n\n`;

  content += "--------------------------------------------------------------------------------\n";
  content += "2. ENRUTADORES ACTIVOS\n";
  content += "--------------------------------------------------------------------------------\n";
  if (routers.length === 0) {
    content += "Sin enrutadores activos.\n\n";
  } else {
    routers.forEach((r, idx) => {
      content += `Router #${idx + 1}: ${r.ssid} | ${r.frequency} | (${r.x},${r.y}) | Potencia: ${r.power}%\n`;
    });
    content += "\n";
  }

  content += "--------------------------------------------------------------------------------\n";
  content += "3. HISTORIAL DE EXPERIMENTOS\n";
  content += "--------------------------------------------------------------------------------\n";
  if (history.length === 0) {
    content += "Sin experimentos registrados.\n\n";
  } else {
    history.forEach((run, index) => {
      const label = METHOD_LABELS[run.method] ?? run.method;
      content += `${index + 1}. ${label} | ${run.gridSize} | ${run.iterations} itr | ${run.executionTimeMs}ms | ${run.finalError.toExponential(3)} | ${run.converged ? "OK" : "NO"}\n`;
    });
    content += "\n";
  }

  content += "--------------------------------------------------------------------------------\n";
  content += "4. MAPA ASCII DE INTENSIDAD\n";
  content += "--------------------------------------------------------------------------------\n";
  for (let i = 0; i < grid.length; i++) {
    let rowStr = "";
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];
      const isB = i === 0 || i === grid.length - 1 || j === 0 || j === grid[i].length - 1;
      if (cell.type === "router") rowStr += " R ";
      else if (cell.type === "wall") {
        const matChar = cell.material === "metal" ? "M" : cell.material === "concrete" ? "C" : cell.material === "brick" ? "L" : "Y";
        rowStr += ` ${matChar} `;
      } else if (isB) rowStr += " # ";
      else {
        const val = cell.val;
        if (val >= 90) rowStr += " 9 ";
        else if (val >= 80) rowStr += " 8 ";
        else if (val >= 70) rowStr += " 7 ";
        else if (val >= 60) rowStr += " 6 ";
        else if (val >= 50) rowStr += " 5 ";
        else if (val >= 40) rowStr += " 4 ";
        else if (val >= 30) rowStr += " 3 ";
        else if (val >= 20) rowStr += " 2 ";
        else if (val >= 10) rowStr += " 1 ";
        else rowStr += " . ";
      }
    }
    content += rowStr + "\n";
  }
  content += "\n";

  content += "--------------------------------------------------------------------------------\n";
  content += "5. MATRIZ NUMÉRICA COMPLETA\n";
  content += "--------------------------------------------------------------------------------\n";
  content += "Coord | Material | Potencial (%) | dBm | Tipo\n";
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];
      const isB = i === 0 || i === grid.length - 1 || j === 0 || j === grid[i].length - 1;
      const material = cell.type === "wall" ? cell.material.toUpperCase() : "AIRE";
      let typeNode = "Interior";
      if (isB) typeNode = "Borde";
      else if (cell.type === "router") typeNode = "Excitador";
      else if (cell.type === "wall") typeNode = "Atenuador";
      content += `[${i},${j}] | ${material} | ${cell.val.toFixed(2)}% | ${convertirADbm(cell.val)} dBm | ${typeNode}\n`;
    }
  }

  content += "\n================================================================================\n";
  content += "NOTA: Modelo educativo basado en Laplace 2D. No sustituye simulación RF profesional.\n";
  content += "================================================================================\n";

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `simunet_reporte_${currentUser.username}_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
