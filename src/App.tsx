import React, { useState, useEffect, useRef } from "react";
import { Cell, SolverMethod, MaterialType, RouterConfig, SimulationConfig, RunHistory, UserProfile, UserSavedNetwork } from "./types";
import { buildInitialGrid, runSolverStep, solveInstant, MATERIALS, getDbmValue, getSignalQuality } from "./solver";
import NetworkGrid from "./components/NetworkGrid";
import ControlPanel from "./components/ControlPanel";
import GraphPanel from "./components/GraphPanel";
import LaplaceDoc from "./components/LaplaceDoc";
import ScientificDocTab from "./components/ScientificDocTab";
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

export default function App() {
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

  // Tab control inside logged-in app
  const [activeMainTab, setActiveMainTab] = useState<"simulator" | "documentation">("simulator");

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
  const [selectedTool, setSelectedTool] = useState<"router" | MaterialType | "eraser">("router");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showValues, setShowValues] = useState(false);

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

  // Initialize/rebuild grid when dimensions, routers, or walls change
  useEffect(() => {
    rebuildGrid();
  }, [gridSize, routers, walls]);

  const rebuildGrid = () => {
    const initial = buildInitialGrid(gridSize.rows, gridSize.cols, routers, walls);
    setGrid(initial);
    setCurrentIteration(0);
    setCurrentError(0);
    setTimeMs(0);
    setIsConverged(false);
    setCurrentErrorHistory([]);
  };

  // Iterative solvers loop triggered in ticks
  useEffect(() => {
    if (!isRunning) {
      startTimeRef.current = null;
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const timer = setTimeout(() => {
      const stepResult = runSolverStep(grid, config.method, config.omega);
      
      const newIteration = currentIteration + 1;
      const newError = stepResult.error;
      const elapsed = Math.round(performance.now() - (startTimeRef.current || 0));

      setGrid(stepResult.grid);
      setCurrentIteration(newIteration);
      setCurrentError(newError);
      setTimeMs(elapsed);
      
      const updatedErrorHist = [...currentErrorHistory, newError];
      setCurrentErrorHistory(updatedErrorHist);

      const achievedConvergence = newError < config.tolerance;
      const hitLimit = newIteration >= config.maxIterations;

      if (achievedConvergence || hitLimit) {
        setIsRunning(false);
        setIsConverged(achievedConvergence);

        // Append item into run comparative database
        const runId = Math.random().toString();
        const newRun: RunHistory = {
          id: runId,
          timestamp: new Date().toLocaleTimeString(),
          method: config.method,
          iterations: newIteration,
          executionTimeMs: elapsed,
          finalError: newError,
          converged: achievedConvergence,
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

  // Draw cells
  const handleCellPaint = (x: number, y: number) => {
    if (x === 0 || x === gridSize.rows - 1 || y === 0 || y === gridSize.cols - 1) return;

    if (selectedTool === "router") {
      const updatedRouters = [{ x, y, power: 100, ssid: currentUser ? `WiFi_${currentUser.username}` : "WiFi_Invitado", frequency: "2.4 GHz" as const }];
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setRouters(updatedRouters);
    } else if (selectedTool === "eraser") {
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setRouters((prev) => prev.filter((r) => !(r.x === x && r.y === y)));
    } else {
      const filteredWalls = walls.filter((w) => !(w.x === x && w.y === y));
      setRouters((prev) => prev.filter((r) => !(r.x === x && r.y === y)));
      setWalls([...filteredWalls, { x, y, material: selectedTool }]);
    }
  };

  const handleCellMouseDown = (x: number, y: number) => {
    setIsDrawing(true);
    handleCellPaint(x, y);
  };

  const handleCellMouseEnter = (x: number, y: number) => {
    if (isDrawing) {
      handleCellPaint(x, y);
    }
  };

  const handleCellMouseUp = () => {
    setIsDrawing(false);
  };

  const handleLoadPreset = (presetName: string) => {
    setIsRunning(false);
    if (presetName === "empty") {
      setWalls([]);
      setRouters([{ x: 12, y: 12, power: 100, ssid: "WiFi_Libre", frequency: "2.4 GHz" }]);
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
      setRouters([{ x: 4, y: 4, power: 100, ssid: "Pamplona_Corporativo", frequency: "2.4 GHz" }]);
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
      setRouters([{ x: 12, y: 12, power: 100, ssid: "Jaula_Faraday", frequency: "2.4 GHz" }]);
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
    setActiveMainTab("simulator"); // Default tab on login
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
      setActiveMainTab("simulator");
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
    const isSOROptimal = optimalRun.method === "sor" || optimalRun.method === "ssor";

    return (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          En base a {history.length} simulaciones numéricas efectuadas sobre un mapa bidimensional de {gridSize.rows}x{gridSize.cols} ({gridSize.rows * gridSize.cols} nodos discretizados), se evaluó el comportamiento inalámbrico y la tasa de atenuación.
        </p>
        <p>
          El método más rápido registrado fue <strong>{optimalRun.method.toUpperCase()}</strong> ({optimalRun.iterations} iteraciones en {optimalRun.executionTimeMs} ms con &omega;={optimalRun.omega}). 
          {isSOROptimal ? (
            " Esto valida la teoría matemática: los esquemas con factores de sobre-relajación óptimos sobrepasan exponencialmente la velocidad de Jacobi o Gauss-Seidel."
          ) : (
            " Se recomienda experimentar con el método diferencial SOR configurando ω entre 1.1 y 1.4, lo que usualmente reduce las iteraciones requeridas en un 60%."
          )}
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
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold text-indigo-500">
                  U Pamplona v3.2
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
                Simulador del Método de Laplace para Conectividad Inalámbrica
              </p>
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
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1.5 leading-relaxed">
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
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                      <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">
                        Usuario de Red o Código Estándar
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
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
                        <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">
                          Contraseña de Cuenta {loginUsername.trim().toLowerCase() === "admin_pamplona" ? "(Demo: 'admin123')" : ""}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
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
                      <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">
                        Definir Usuario de Red o Código
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
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
                      <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">
                        Establecer Contraseña Privada
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
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
                      <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">
                        Rol Universitario Autorizado
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRegisterRole("standard")}
                          className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                            registerRole === "standard"
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
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
                              : isDarkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          Administrador
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
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
                <div className={`mt-6 pt-5 border-t text-slate-400 dark:text-slate-500 italic ${
                  isDarkMode ? "border-slate-850" : "border-slate-100"
                }`}>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-2 font-mono">
                    Acceso de Prueba Rápido:
                  </span>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border dark:border-slate-900">
                      <span>👤 Administrador Demo:</span>
                      <span className="font-mono text-[10px] font-bold text-slate-350 dark:text-slate-300">admin_pamplona / admin123</span>
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              
              {/* Main Tab Switcher inside Workspace */}
              <div className="lg:col-span-12 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4 border-slate-200 dark:border-slate-800">
                <div className="flex bg-slate-150/10 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                  <button
                    onClick={() => setActiveMainTab("simulator")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeMainTab === "simulator"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                  >
                    <Signal className="w-4 h-4 animate-pulse" />
                    Simulador de Cobertura WiFi
                  </button>
                  <button
                    onClick={() => setActiveMainTab("documentation")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeMainTab === "documentation"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Manual de Ingeniería Científica
                  </button>
                </div>
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-550 mr-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Usuario Activo: <span className="text-indigo-550 dark:text-indigo-400 font-extrabold">{currentUser.username}</span> ({currentUser.role === "admin" ? "Administrador" : "Estudiante"})</span>
                </div>
              </div>

              {activeMainTab === "documentation" ? (
                <div className="lg:col-span-12">
                  <ScientificDocTab isDarkMode={isDarkMode} />
                </div>
              ) : (
                <>
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
                />

                {/* Math & Laplace Interactive Equation Documentation (centro de bento grid) */}
                <LaplaceDoc isDarkMode={isDarkMode} />

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
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
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
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Cálculos Totales</div>
                        <div className="text-2xl font-black text-indigo-500">{history.length}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Simulaciones completadas</div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Malla Activa</div>
                        <div className="text-2xl font-black text-indigo-500">{gridSize.rows} &times; {gridSize.cols}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{gridSize.rows * gridSize.cols} nodos computacionales</div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Estatus del Sistema</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-xs font-bold text-emerald-500">Operativo</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Calibración abierta a 10⁻⁶</div>
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
                />

                {/* User Personal Save Storage Compartment */}
                <div className={`p-6 rounded-3xl border transition-all duration-300 ${bgCardClass}`}>
                  <h3 className="text-base font-bold flex items-center gap-2 mb-3">
                    <Save className="w-5 h-5 text-indigo-500" />
                    Mis Diseños e Historial
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 leading-relaxed">
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
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Guardar Red Activa</span>
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
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold mb-2">Tus Redes Registradas ({currentUser.savedNetworks.length})</span>
                    {currentUser.savedNetworks.length === 0 ? (
                      <div className="p-4 border border-dashed rounded-xl text-center text-xs text-slate-400 dark:text-slate-500">
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
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">{net.gridSize.rows}x{net.gridSize.cols} • {net.walls.length} paredes</span>
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
            </>
          )}
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
            <span className="font-bold text-slate-400 dark:text-slate-350">Universidad de Pamplona</span>
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
                      <span className="font-bold text-slate-400 block uppercase">Código de Reporte:</span>
                      <span className="font-bold text-slate-850">UP-SIMUNET-2026-{(Math.random() * 10000).toFixed(0)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-400 block uppercase">Fecha de Expedición:</span>
                      <span className="font-bold text-slate-850">{new Date().toLocaleString()}</span>
                    </div>
                  </div>

                  <hr className="border-slate-150" />

                  {/* Core summary metrics table */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Evaluador Responsable</span>
                      <span className="text-xs font-black text-slate-800">{currentUser.username}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Último Método</span>
                      <span className="text-xs font-black text-slate-850 uppercase">{config.method}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Iteraciones Realizadas</span>
                      <span className="text-xs font-black text-slate-850">{currentIteration} itr</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Residuo Obtenido</span>
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
                      <li>Poder Máximo Inicial Router (SSID: {routers[0]?.ssid || "WiFi_Pamplona"}): {routers[0]?.power || 100}% (P_{`max`})</li>
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
                              {run.converged ? (
                                <span className="text-emerald-650 font-bold">ESTABLE</span>
                              ) : (
                                <span className="text-rose-650 font-bold">INCONGRUENTE</span>
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
