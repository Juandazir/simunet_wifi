import { useState, useEffect, useCallback } from "react";
import { UserProfile, UserSavedNetwork, PRESET_PROFILES } from "../../capa1-dominio";
import { hashPassword, verifyPassword } from "../../capa5-servicios";

const PROFILES_KEY = "simunet_user_profiles";
const ACTIVE_USER_KEY = "simunet_active_user";

function loadProfiles(): UserProfile[] {
  const saved = localStorage.getItem(PROFILES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return PRESET_PROFILES;
    }
  }
  return PRESET_PROFILES;
}

function loadActiveUser(profiles: UserProfile[]): UserProfile | null {
  const active = localStorage.getItem(ACTIVE_USER_KEY);
  if (!active) return null;
  try {
    const cached = JSON.parse(active) as UserProfile;
    return profiles.find((p) => p.username === cached.username) ?? cached;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [profiles, setProfiles] = useState<UserProfile[]>(loadProfiles);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    loadActiveUser(loadProfiles())
  );
  const [loginError, setLoginError] = useState("");
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const adminHash = await hashPassword("admin123");
      setProfiles((prev) => {
        const updated = prev.map((p) => {
          if (p.username === "admin_pamplona") {
            const pwd = p.password;
            const isLegacy = !pwd || pwd === "admin123" || pwd.length < 64;
            return isLegacy ? { ...p, password: adminHash } : p;
          }
          if (p.password && p.password.length < 64 && p.password.length > 0) {
            return p;
          }
          return p;
        });
        localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
        return updated;
      });
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  }, [currentUser]);

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      setLoginError("");
      const clean = username.trim().toLowerCase();
      if (!clean) {
        setLoginError("Por favor ingrese un nombre de usuario.");
        return false;
      }

      const profile = profiles.find((p) => p.username === clean);
      if (!profile) {
        setLoginError("Usuario no registrado. Cree una cuenta nueva para continuar.");
        return false;
      }

      if (profile.password) {
        const valid = await verifyPassword(password, profile.password);
        if (!valid) {
          setLoginError("Contraseña incorrecta.");
          return false;
        }
      }

      setCurrentUser(profile);
      return true;
    },
    [profiles]
  );

  const handleRegister = useCallback(
    async (username: string, password: string) => {
      setLoginError("");
      setRegisterSuccessMsg("");
      const clean = username.trim().toLowerCase();

      if (!clean || clean.length < 3) {
        setLoginError("El usuario debe tener al menos 3 caracteres.");
        return false;
      }
      if (password.length < 4) {
        setLoginError("La contraseña debe tener al menos 4 caracteres.");
        return false;
      }
      if (profiles.some((p) => p.username === clean)) {
        setLoginError("Ese usuario ya está registrado.");
        return false;
      }

      const newProfile: UserProfile = {
        username: clean,
        role: "standard",
        password: await hashPassword(password),
        savedNetworks: [],
      };

      setProfiles((prev) => [...prev, newProfile]);
      setRegisterSuccessMsg(`¡Registro exitoso! Bienvenido, ${clean}.`);

      setTimeout(() => {
        setCurrentUser(newProfile);
        setRegisterSuccessMsg("");
        setIsRegisterMode(false);
      }, 1500);

      return true;
    },
    [profiles]
  );

  const logout = useCallback(() => setCurrentUser(null), []);

  const saveNetwork = useCallback(
    (name: string, design: Omit<UserSavedNetwork, "id" | "timestamp" | "name">) => {
      if (!currentUser) return false;
      const newDesign: UserSavedNetwork = {
        id: "net_" + crypto.randomUUID(),
        name: name.trim(),
        timestamp: new Date().toLocaleString(),
        ...design,
      };
      const updated: UserProfile = {
        ...currentUser,
        savedNetworks: [...currentUser.savedNetworks, newDesign],
      };
      setCurrentUser(updated);
      setProfiles((prev) =>
        prev.map((p) => (p.username === currentUser.username ? updated : p))
      );
      return true;
    },
    [currentUser]
  );

  const deleteNetwork = useCallback(
    (designId: string) => {
      if (!currentUser) return;
      const updated: UserProfile = {
        ...currentUser,
        savedNetworks: currentUser.savedNetworks.filter((n) => n.id !== designId),
      };
      setCurrentUser(updated);
      setProfiles((prev) =>
        prev.map((p) => (p.username === currentUser.username ? updated : p))
      );
    },
    [currentUser]
  );

  return {
    ready,
    currentUser,
    loginError,
    registerSuccessMsg,
    isRegisterMode,
    setIsRegisterMode,
    setLoginError,
    handleLogin,
    handleRegister,
    logout,
    saveNetwork,
    deleteNetwork,
  };
}
