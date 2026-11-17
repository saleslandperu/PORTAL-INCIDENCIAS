import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { api, ApiError, apiOptional } from "../services/api";
import { buildAccessScope } from "../services/accessService";
import { refreshDirectory } from "../services/orgApi";
import { organizationStore } from "../services/organizationStore";
import { incidentService } from "../services/incidentService";
import type { AccessScope, AppUser, UserRole } from "../types/organization";

interface AuthContextValue {
  user: AppUser | null;
  scope: AccessScope | null;
  sessionSource: "backend" | "demo" | null;
  ready: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function asUser(payload: unknown): AppUser | null {
  if (!payload || typeof payload !== "object") return null;
  const item = payload as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.username !== "string") return null;
  return {
    id: item.id,
    fullName: String(item.fullName ?? item.username),
    username: item.username,
    email: String(item.email ?? ""),
    role: item.role as UserRole,
    status: item.status === "inactivo" ? "inactivo" : "activo",
    managerId: typeof item.managerId === "string" ? item.managerId : undefined,
    permissionIds: Array.isArray(item.permissions)
      ? item.permissions.filter((value): value is string => typeof value === "string")
      : Array.isArray(item.permissionIds)
        ? item.permissionIds.filter((value): value is string => typeof value === "string")
        : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(organizationStore.subscribe, organizationStore.getSnapshot);
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionSource, setSessionSource] = useState<"backend" | "demo" | null>(null);
  const [ready, setReady] = useState(false);

  const storedUser = user ? snapshot.users.find((item) => item.id === user.id) : undefined;
  const current = storedUser ? { ...storedUser, permissionIds: user?.permissionIds } : user;
  const activeUser = current?.status === "activo" ? current : null;

  const scope = useMemo(
    () => (activeUser ? buildAccessScope(activeUser, snapshot) : null),
    [activeUser, snapshot],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await apiOptional<{ user: unknown }>("/api/auth/me");
      if (cancelled) return;
      const backendUser = asUser(me?.user);
      if (backendUser) {
        setUser(backendUser);
        setSessionSource("backend");
        try {
          await refreshDirectory();
        } catch {
          /* el directorio no bloquea la sesión */
        }
        await incidentService.refreshFromApi();
        setReady(true);
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: activeUser,
      scope,
      sessionSource,
      ready,
      login: async (identifier, password) => {
        try {
          const result = await api<{ user: unknown }>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ identifier, password }),
          });
          const next = asUser(result.user);
          if (!next) throw new Error("El servidor no devolvió un usuario válido.");
          setUser(next);
          setSessionSource("backend");
          try {
            await refreshDirectory();
          } catch {
            /* directorio opcional para roles sin catálogo completo */
          }
          await incidentService.refreshFromApi();
          return;
        } catch (error) {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            throw error;
          }
          throw new Error("No fue posible conectar con el servidor. Intente nuevamente en unos minutos.");
        }
      },
      logout: () => {
        if (sessionSource === "backend") {
          void api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        }
        incidentService.useDemo();
        setUser(null);
        setSessionSource(null);
      },
    }),
    [activeUser, ready, scope, sessionSource],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

export function useOrganization() {
  return useSyncExternalStore(organizationStore.subscribe, organizationStore.getSnapshot);
}
