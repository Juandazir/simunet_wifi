import React, { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { UserProfile, UserSavedNetwork } from "../../capa1-dominio";

interface SavedNetworksPanelProps {
  currentUser: UserProfile;
  isDarkMode: boolean;
  onSave: (name: string) => boolean;
  onLoad: (net: UserSavedNetwork) => void;
  onDelete: (id: string) => void;
}

export default function SavedNetworksPanel({
  currentUser,
  isDarkMode,
  onSave,
  onLoad,
  onDelete,
}: SavedNetworksPanelProps) {
  const [name, setName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const bgCard = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-800 shadow-sm";
  const borderClass = isDarkMode ? "border-slate-800" : "border-slate-200";

  const handleSave = () => {
    if (!name.trim()) {
      alert("Ingrese un nombre válido para el diseño.");
      return;
    }
    if (onSave(name)) {
      setName("");
      setSuccessMsg("¡Diseño guardado exitosamente!");
      setTimeout(() => setSuccessMsg(""), 3500);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border transition-all ${bgCard}`}>
      <h3 className="text-base font-bold flex items-center gap-2 mb-3">
        <Save className="w-5 h-5 text-indigo-500" />
        Mis Diseños
      </h3>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Guarda y recupera tus planos de cobertura entre sesiones.
      </p>

      {successMsg && (
        <div className="mb-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs text-center font-bold">
          {successMsg}
        </div>
      )}

      <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 mb-4 ${
        isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"
      }`}>
        <input
          type="text"
          placeholder="Nombre del plano, ej: Consultorios"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full border ${borderClass} px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500/50 ${
            isDarkMode ? "bg-slate-900" : "bg-white"
          }`}
        />
        <button
          onClick={handleSave}
          className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          Guardar diseño actual
        </button>
      </div>

      <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold mb-2">
        Redes guardadas ({currentUser.savedNetworks.length})
      </span>

      {currentUser.savedNetworks.length === 0 ? (
        <div className="p-4 border border-dashed rounded-xl text-center text-xs text-slate-400">
          Aún no tienes mapas guardados.
        </div>
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {currentUser.savedNetworks.map((net) => (
            <div
              key={net.id}
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="min-w-0 max-w-[70%]">
                <span className="font-bold truncate block" title={net.name}>{net.name}</span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {net.gridSize.rows}x{net.gridSize.cols} · {net.walls.length} paredes
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onLoad(net)}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-lg font-bold cursor-pointer"
                >
                  Cargar
                </button>
                <button
                  onClick={() => onDelete(net.id)}
                  className="p-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
