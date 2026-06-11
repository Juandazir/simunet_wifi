import React, { useState, useEffect } from "react";
import { Cell, MaterialType, RouterConfig, UserSavedNetwork, ROUTER_MODELS, buildRouterFromModel, loadEnvironmentPreset, METHOD_LABELS } from "../capa1-dominio";
import { buildInitialGrid, solveInstant } from "../capa4-numerico";
import { downloadFullMeshReport, generateReportAnalysisText } from "../capa5-servicios";
import { useAuth, useSimulation, useRouterOptimization } from "../capa3-aplicacion";
import NetworkGrid from "./componentes/NetworkGrid";
import ControlPanel from "./componentes/ControlPanel";
import GraphPanel from "./componentes/GraphPanel";
import AuthPortal from "./componentes/AuthPortal";
import PhysicsDisclaimer from "./componentes/PhysicsDisclaimer";
import SavedNetworksPanel from "./componentes/SavedNetworksPanel";
import { Signal, Sun, Moon, LogOut, Shield, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("simunet_dark_mode");
    return saved !== "false";
  });

  const auth = useAuth();

  const [gridSize, setGridSize] = useState({ rows: 24, cols: 24 });
  const [routers, setRouters] = useState<RouterConfig[]>([
    buildRouterFromModel("tplink", 12, 12),
  ]);
  const [walls, setWalls] = useState<{ x: number; y: number; material: MaterialType }[]>([]);
  const [selectedRouterModelId, setSelectedRouterModelId] = useState("tplink");
  const [cellSize, setCellSize] = useState(0.5);

  const sim = useSimulation({ gridSize, routers, walls, cellSize });
  const optimization = useRouterOptimization({
    gridSize,
    walls,
    cellSize,
    selectedRouterModelId,
  });

  const [selectedTool, setSelectedTool] = useState<"router" | MaterialType | "eraser">("router");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showValues, setShowValues] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("simunet_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const model = ROUTER_MODELS[selectedRouterModelId];
    if (model) {
      setRouters((prev) =>
        prev.map((r) => ({
          ...r,
          modelId: selectedRouterModelId,
          power: Math.round(model.eirpDbm * (100 / 38)),
          ssid: `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_"),
          frequency: model.frequency,
        }))
      );
    }
  }, [selectedRouterModelId]);

  const handleCellPaint = (x: number, y: number) => {
    if (x === 0 || x === gridSize.rows - 1 || y === 0 || y === gridSize.cols - 1) return;

    if (selectedTool === "router") {
      const newRouter = buildRouterFromModel(
        selectedRouterModelId,
        x,
        y,
        String(routers.length + 1)
      );
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setRouters((prev) => [
        ...prev.filter((r) => !(r.x === x && r.y === y)),
        newRouter,
      ]);
    } else if (selectedTool === "eraser") {
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setRouters((prev) => prev.filter((r) => !(r.x === x && r.y === y)));
    } else {
      setRouters((prev) => prev.filter((r) => !(r.x === x && r.y === y)));
      setWalls((prev) => [
        ...prev.filter((w) => !(w.x === x && w.y === y)),
        { x, y, material: selectedTool },
      ]);
    }
  };

  const handleLoadPreset = (presetName: string) => {
    sim.setIsRunning(false);
    const preset = loadEnvironmentPreset(presetName, selectedRouterModelId);
    setWalls(preset.walls);
    setRouters(preset.routers);
  };

  const applyBestRouterLocation = (customX?: number, customY?: number) => {
    if (!optimization.optimizationResult) return;
    const { x, y } = optimization.optimizationResult;
    const optimalRouter = buildRouterFromModel(
      selectedRouterModelId,
      customX ?? x,
      customY ?? y
    );
    setRouters([optimalRouter]);

    const initial = buildInitialGrid(gridSize.rows, gridSize.cols, [optimalRouter], walls, cellSize);
    const result = solveInstant(
      initial,
      sim.config.method,
      sim.config.omega,
      sim.config.tolerance,
      sim.config.maxIterations
    );
    sim.applySolvedGrid(
      result.grid,
      result.iterations,
      result.finalError,
      result.timeMs,
      result.errorHistory
    );
    optimization.clearResult();
  };

  const handleSaveNetwork = (name: string) =>
    auth.saveNetwork(name, { walls, routers, gridSize });

  const handleLoadNetwork = (net: UserSavedNetwork) => {
    sim.setIsRunning(false);
    setGridSize(net.gridSize);
    setWalls(net.walls);
    setRouters(net.routers);
  };

  const handleDownloadReport = () => {
    if (!auth.currentUser) return;
    downloadFullMeshReport({
      currentUser: auth.currentUser,
      gridSize,
      cellSize,
      walls,
      routers,
      config: sim.config,
      currentIteration: sim.currentIteration,
      currentError: sim.currentError,
      timeMs: sim.timeMs,
      history: sim.history,
      grid: sim.grid,
    });
  };

  const bgMain = isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const bgCard = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-800 shadow-sm";

  if (!auth.ready) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgMain}`}>
        <div className="flex flex-col items-center gap-3">
          <Signal className="w-8 h-8 text-indigo-500 animate-pulse" />
          <span className="text-sm text-slate-400">Inicializando SimuNet...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none relative ${bgMain}`}
      onMouseUp={() => setIsDrawing(false)}
    >
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

      <header className={`backdrop-blur-lg border-b sticky top-0 z-40 ${
        isDarkMode ? "bg-slate-950/70 border-slate-900" : "bg-white/80 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Signal className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-600">
                SimuNet WiFi
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Simulador de Cobertura · U. Pamplona</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-2xl border cursor-pointer transition ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 text-amber-400"
                  : "bg-slate-100 border-slate-200 text-indigo-600"
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {auth.currentUser && (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end text-xs">
                  <span className="font-bold">{auth.currentUser.username}</span>
                  <span className="text-[9px] uppercase text-slate-400">
                    {auth.currentUser.role === "admin" ? "Administrador" : "Estudiante"}
                  </span>
                </div>
                <button
                  onClick={() => { sim.setIsRunning(false); auth.logout(); }}
                  className={`p-2.5 rounded-2xl border cursor-pointer hover:text-rose-500 ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <AnimatePresence mode="wait">
          {!auth.currentUser ? (
            <AuthPortal
              isRegisterMode={auth.isRegisterMode}
              setIsRegisterMode={auth.setIsRegisterMode}
              loginError={auth.loginError}
              registerSuccessMsg={auth.registerSuccessMsg}
              setLoginError={auth.setLoginError}
              onLogin={auth.handleLogin}
              onRegister={auth.handleRegister}
              isDarkMode={isDarkMode}
            />
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-12">
                <PhysicsDisclaimer isDarkMode={isDarkMode} />
              </div>

              <div className="lg:col-span-8 flex flex-col gap-6">
                <NetworkGrid
                  grid={sim.grid}
                  onCellClick={handleCellPaint}
                  onCellMouseDown={(x, y) => { setIsDrawing(true); handleCellPaint(x, y); }}
                  onCellMouseEnter={(x, y) => { if (isDrawing) handleCellPaint(x, y); }}
                  onCellMouseUp={() => setIsDrawing(false)}
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
                  isOptimizing={optimization.isOptimizing}
                  optimizationResult={optimization.optimizationResult}
                />

                <GraphPanel
                  history={sim.history}
                  onClearHistory={() => sim.setHistory([])}
                  currentErrorHistory={sim.currentErrorHistory}
                  tolerance={sim.config.tolerance}
                  currentIteration={sim.currentIteration}
                  currentError={sim.currentError}
                  timeMs={sim.timeMs}
                  isConverged={sim.isConverged}
                  method={sim.config.method}
                  isDarkMode={isDarkMode}
                  onDownloadFullReport={handleDownloadReport}
                />

                {auth.currentUser.role === "admin" && (
                  <div className={`p-6 rounded-3xl border ${bgCard}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 border-inherit">
                      <div>
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <Shield className="w-5 h-5 text-indigo-500" />
                          Panel de Auditoría
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Herramientas exclusivas del administrador.
                        </p>
                      </div>
                      {sim.history.length > 0 ? (
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          Generar Informe
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-bold">
                          Ejecute una simulación primero
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Simulaciones</div>
                        <div className="text-2xl font-black text-indigo-500">{sim.history.length}</div>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Malla</div>
                        <div className="text-2xl font-black text-indigo-500">{gridSize.rows}×{gridSize.cols}</div>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Estado</div>
                        <div className="text-xs font-bold text-emerald-500 mt-2">Operativo</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                <ControlPanel
                  config={sim.config}
                  setConfig={sim.setConfig}
                  isRunning={sim.isRunning}
                  onStart={() => sim.setIsRunning(true)}
                  onPause={() => sim.setIsRunning(false)}
                  onSolveInstant={sim.solveInstantly}
                  onSingleStep={sim.singleStep}
                  onReset={sim.rebuildGrid}
                  onClearWalls={() => setWalls([])}
                  selectedTool={selectedTool}
                  setSelectedTool={setSelectedTool}
                  currentIteration={sim.currentIteration}
                  currentError={sim.currentError}
                  timeMs={sim.timeMs}
                  onLoadPreset={handleLoadPreset}
                  gridSize={gridSize}
                  setGridSize={setGridSize}
                  isDarkMode={isDarkMode}
                  isAdmin={auth.currentUser.role === "admin"}
                  walls={walls}
                  setWalls={setWalls}
                  selectedRouterModelId={selectedRouterModelId}
                  setSelectedRouterModelId={setSelectedRouterModelId}
                  cellSize={cellSize}
                  setCellSize={setCellSize}
                  onFindBestRouterPlace={optimization.findBestLocation}
                  isOptimizing={optimization.isOptimizing}
                  optimizationResult={optimization.optimizationResult}
                  onApplyBestRouterPlace={applyBestRouterLocation}
                  routers={routers}
                  onClearRouters={() => setRouters([])}
                />

                <SavedNetworksPanel
                  currentUser={auth.currentUser}
                  isDarkMode={isDarkMode}
                  onSave={handleSaveNetwork}
                  onLoad={handleLoadNetwork}
                  onDelete={auth.deleteNetwork}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className={`border-t mt-12 py-8 text-xs ${
        isDarkMode ? "border-slate-900 bg-slate-950 text-slate-500" : "border-slate-200 bg-white text-slate-500"
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>Universidad de Pamplona · Métodos Numéricos © 2026</span>
          <span className="font-mono">∇²u = 0 · Jacobi · Gauss-Seidel · SOR</span>
        </div>
      </footer>

      <AnimatePresence>
        {showReportModal && auth.currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h2 className="text-lg font-black">Informe Técnico</h2>
                <div className="flex gap-2">
                  <button onClick={handleDownloadReport} className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                    Descargar .txt
                  </button>
                  <button onClick={() => window.print()} className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                    Imprimir
                  </button>
                  <button onClick={() => setShowReportModal(false)} className="px-3 py-2 border text-xs font-bold rounded-xl cursor-pointer">
                    Cerrar
                  </button>
                </div>
              </div>
              <div className="text-xs leading-relaxed space-y-3 text-slate-600">
                <p><strong>Evaluador:</strong> {auth.currentUser.username}</p>
                <p><strong>Método:</strong> {METHOD_LABELS[sim.config.method]}</p>
                <p><strong>Iteraciones:</strong> {sim.currentIteration} | <strong>Residuo:</strong> {sim.currentError}</p>
                <hr />
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {generateReportAnalysisText(sim.history, gridSize, walls.length)}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
