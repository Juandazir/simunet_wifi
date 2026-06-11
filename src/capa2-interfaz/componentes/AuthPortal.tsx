import React, { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, User, Lock } from "lucide-react";

interface AuthPortalProps {
  isRegisterMode: boolean;
  setIsRegisterMode: (v: boolean) => void;
  loginError: string;
  registerSuccessMsg: string;
  setLoginError: (v: string) => void;
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister: (username: string, password: string) => Promise<boolean>;
  isDarkMode: boolean;
}

export default function AuthPortal({
  isRegisterMode,
  setIsRegisterMode,
  loginError,
  registerSuccessMsg,
  setLoginError,
  onLogin,
  onRegister,
  isDarkMode,
}: AuthPortalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const bgCard = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-800 shadow-sm";
  const borderClass = isDarkMode ? "border-slate-800" : "border-slate-200";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode) {
      const ok = await onRegister(username, password);
      if (ok) {
        setUsername("");
        setPassword("");
      }
    } else {
      const ok = await onLogin(username, password);
      if (ok) {
        setUsername("");
        setPassword("");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-md mx-auto my-12"
    >
      <div className={`p-8 rounded-3xl border ${bgCard} shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black">Portal Académico SimuNet</h2>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
            Universidad de Pamplona — Simulación de Cobertura WiFi y Métodos Numéricos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-50 dark:bg-slate-950/50 border rounded-2xl">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setLoginError(""); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isRegisterMode ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setLoginError(""); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isRegisterMode ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">
              {isRegisterMode ? "Nuevo usuario" : "Usuario"}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={isRegisterMode ? "ej: mi_codigo_pamplona" : "ej: admin_pamplona"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-950 border ${borderClass} pl-10 pr-3.5 py-2.5 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none`}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder={isRegisterMode ? "Mínimo 4 caracteres" : "Ingrese su contraseña"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-950 border ${borderClass} pl-10 pr-3.5 py-2.5 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none`}
                required={isRegisterMode}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition shadow-md text-xs cursor-pointer"
          >
            {isRegisterMode ? "Crear cuenta de estudiante" : "Ingresar al simulador"}
          </button>
        </form>

        <div className={`mt-6 pt-5 border-t text-slate-400 italic ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-2 font-mono">
            Acceso de demostración
          </span>
          <div className="text-[11px] bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border dark:border-slate-900 flex justify-between">
            <span>Administrador:</span>
            <span className="font-mono text-[10px] font-bold">admin_pamplona / admin123</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
