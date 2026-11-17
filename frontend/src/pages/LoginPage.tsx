import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/icons";
import { appConfig } from "../config/appConfig";
import { homePath } from "../config/permissions";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const nextIdentifier = String(formData.get("identifier") ?? identifier).trim();
    const nextPassword = String(formData.get("password") ?? password);
    setIdentifier(nextIdentifier);
    setPassword(nextPassword);

    const next: { identifier?: string; password?: string } = {};
    if (!nextIdentifier) next.identifier = "Ingrese su usuario o correo corporativo.";
    if (!nextPassword) next.password = "Ingrese la contraseña.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await login(nextIdentifier, nextPassword);
      navigate(homePath(undefined), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="brand-mark login-logo" aria-hidden="true">
          <Icon name="ticket-check" size={26} />
        </div>
        <h1>{appConfig.appName}</h1>
        <p>Consulta gerencial de incidencias por centro de costo, con visibilidad según rol, KAM y asignaciones.</p>
        <ul className="login-benefits">
          <li>
            <Icon name="chart-no-axes-combined" size={20} />
            Dashboard gerencial
          </li>
          <li>
            <Icon name="users-round" size={20} />
            Seguimiento por KAM y centro de costo
          </li>
          <li>
            <Icon name="chart-no-axes-column-increasing" size={20} />
            Indicadores y SLA
          </li>
        </ul>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={onSubmit} noValidate>
          {error ? <div className="form-error">{error}</div> : null}
          <h2>Inicia sesión</h2>
          <p className="muted">Acceda con su usuario o correo corporativo.</p>
          <label>
            Usuario o correo
            <span className="input-with-icon">
              <Icon name="user-round" size={18} />
              <input
                name="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                onInput={(event) => setIdentifier(event.currentTarget.value)}
                autoComplete="username"
                placeholder="usuario o correo"
              />
            </span>
            {fieldErrors.identifier ? <small className="field-error">{fieldErrors.identifier}</small> : null}
          </label>
          <label>
            Contraseña
            <div className="password-field">
              <span className="input-with-icon">
                <Icon name="lock-keyhole" size={18} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onInput={(event) => setPassword(event.currentTarget.value)}
                  autoComplete="current-password"
                />
              </span>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {fieldErrors.password ? <small className="field-error">{fieldErrors.password}</small> : null}
          </label>
          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            <Icon name="log-in" size={18} />
            {loading ? "Validando..." : "Entrar"}
          </button>
        </form>
      </section>
    </div>
  );
}
