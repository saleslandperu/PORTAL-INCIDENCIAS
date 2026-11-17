import { FormEvent, useEffect, useMemo, useState } from "react";
import { PERMISSION_GROUPS } from "../config/permissions";
import { useAuth } from "../context/AuthContext";
import { fetchProfiles, saveProfilePermissions, type ProfileRecord } from "../services/orgApi";
import { roleLabels, type UserRole } from "../types/organization";

interface PermissionGroupView {
  id: string;
  label: string;
  items: { id: string; label: string }[];
}

export function ProfilesPage() {
  const { scope, sessionSource } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [groups, setGroups] = useState<PermissionGroupView[]>(
    PERMISSION_GROUPS.map((group) => ({ id: group.id, label: group.label, items: group.items.map((item) => ({ ...item })) })),
  );
  const [selected, setSelected] = useState<UserRole>("gerente");
  const [checked, setChecked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const current = profiles.find((item) => item.id === selected);
  const locked = current?.locked || selected === "admin_ti";

  useEffect(() => {
    if (sessionSource !== "backend") {
      setError("Los perfiles persistentes se editan con el backend en marcha.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const payload = await fetchProfiles();
        if (cancelled) return;
        setGroups(payload.groups);
        setProfiles(payload.profiles);
        const gerente = payload.profiles.find((item) => item.id === "gerente") ?? payload.profiles[0];
        if (gerente) {
          setSelected(gerente.id as UserRole);
          setChecked(gerente.permissionIds);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudieron cargar los perfiles.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionSource]);

  const selectProfile = (id: UserRole) => {
    setSelected(id);
    setNotice("");
    setError("");
    const profile = profiles.find((item) => item.id === id);
    setChecked(profile?.permissionIds ?? []);
  };

  const toggle = (permissionId: string) => {
    if (locked || permissionId === "profiles.manage") return;
    setChecked((currentIds) =>
      currentIds.includes(permissionId) ? currentIds.filter((id) => id !== permissionId) : [...currentIds, permissionId],
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!scope?.canManageProfiles || locked || sessionSource !== "backend") return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await saveProfilePermissions(selected, checked);
      setProfiles(result.profiles);
      setChecked(result.profile.permissionIds);
      setNotice("Permisos guardados. Aplican en las siguientes consultas al servidor.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los permisos.");
    } finally {
      setLoading(false);
    }
  };

  const profileOptions = useMemo(
    () => (Object.keys(roleLabels) as UserRole[]).map((id) => ({ id, label: roleLabels[id] })),
    [],
  );

  if (!scope?.canManageProfiles) {
    return <p className="notice">Solo Administrador TI puede gestionar perfiles y permisos.</p>;
  }

  return (
    <>
      <p className="notice">
        Administrador TI conserva todos los permisos y no puede desactivarse. La gestión de perfiles no se
        asigna a otros roles. Crear, editar o cerrar incidencias no se ejecuta contra GLPI: la integración
        sigue en solo lectura.
      </p>
      {error ? <div className="form-error">{error}</div> : null}
      {notice ? <p className="scope-banner">{notice}</p> : null}
      <div className="card filters">
        <label>
          Perfil
          <select value={selected} onChange={(event) => selectProfile(event.target.value as UserRole)}>
            {profileOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <form className="card stack-form" onSubmit={submit}>
        {groups.map((group) => (
          <fieldset key={group.id} className="check-grid">
            <legend>{group.label}</legend>
            {group.items.map((item) => {
              const disabled = locked || item.id === "profiles.manage";
              return (
                <label key={item.id} className="check-row">
                  <input
                    type="checkbox"
                    checked={locked ? true : checked.includes(item.id)}
                    disabled={disabled}
                    onChange={() => toggle(item.id)}
                  />
                  {item.label}
                </label>
              );
            })}
          </fieldset>
        ))}
        <button type="submit" className="btn btn-primary" disabled={locked || loading || sessionSource !== "backend"}>
          {loading ? "Guardando…" : "Guardar permisos"}
        </button>
      </form>
    </>
  );
}
