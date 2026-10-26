import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { IconEye, IconEyeOff } from "../components/icons";
import { toApiError } from "../lib/api";
import { errorMessage, isRateLimited, mapDetails, retryAfter, type FieldErrors } from "../lib/form-errors";
import { safeRedirect } from "../lib/navigation";

const EMAIL_PATTERN = /^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/;

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const teamNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as { from?: unknown } | null;
  const from = safeRedirect(state?.from);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setRetrySeconds(null);

    const nextErrors: FieldErrors = {};
    const cleanTeamName = teamName.trim();
    const cleanEmail = email.trim();

    if (!cleanTeamName) nextErrors.teamName = "Escribe el nombre de la tripulación.";
    else if (cleanTeamName.length < 3) nextErrors.teamName = "El nombre debe tener al menos 3 caracteres.";
    else if (cleanTeamName.length > 40) nextErrors.teamName = "El nombre no puede superar los 40 caracteres.";

    if (!cleanEmail) nextErrors.email = "Escribe el email de la tripulación.";
    else if (!EMAIL_PATTERN.test(cleanEmail)) nextErrors.email = "Escribe un email válido.";

    if (!password) nextErrors.password = "Escribe una contraseña.";
    else if (password.length < 8) nextErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    else if (password.length > 72) nextErrors.password = "La contraseña no puede superar los 72 caracteres.";

    if (!confirmPassword) nextErrors.confirmPassword = "Repite la contraseña.";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Las contraseñas no coinciden.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.teamName) teamNameRef.current?.focus();
      else if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      else confirmRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await signUp(cleanTeamName, cleanEmail, password);
      navigate(from, { replace: true });
    } catch (cause: unknown) {
      const error = toApiError(cause);
      if (error.code === "EMAIL_ALREADY_REGISTERED") {
        setFieldErrors({ email: "Ese email ya tiene una tripulación registrada. Inicia sesión." });
      } else if (error.code === "TEAM_NAME_TAKEN") {
        setFieldErrors({ teamName: "Ese nombre de tripulación ya está en uso. Prueba otro." });
      } else if (error.code === "VALIDATION_ERROR") {
        const details = mapDetails(error, ["teamName", "email", "password"]);
        setFieldErrors(details);
        if (Object.keys(details).length === 0) setFormError(errorMessage(error));
      } else if (error.code === "REGISTRATION_CLOSED") {
        setFormError("El registro de tripulaciones está cerrado. Avisa a un TA para que te ayude.");
      } else {
        setFormError(errorMessage(error));
        if (isRateLimited(error)) setRetrySeconds(retryAfter(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="East Blue · nueva tripulación"
      title="Icen la bandera. La Guild los estaba esperando."
      subtitle="Una sola cuenta por tripulación. Al registrarse recibirán su código de equipo y su workspace privado."
      footer={
        <>
          ¿Ya tienen cuenta?{" "}
          <Link
            to="/login"
            state={state}
            className="font-semibold text-gold-300 underline-offset-4 transition hover:text-gold-200 hover:underline"
          >
            Inicien sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-busy={submitting}>
        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-crimson-500/30 bg-crimson-500/[0.08] px-4 py-3 text-sm leading-relaxed text-rose-100/85"
          >
            {formError}
            {retrySeconds ? (
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-rose-200/60">
                Reintenta en {retrySeconds}s
              </span>
            ) : null}
          </div>
        )}

        <div>
          <label htmlFor="register-team" className="field-label">
            Nombre de la tripulación
          </label>
          <input
            ref={teamNameRef}
            id="register-team"
            name="teamName"
            type="text"
            autoComplete="organization"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            className={`field ${fieldErrors.teamName ? "border-crimson-500/55 focus:border-crimson-500/70 focus:ring-crimson-500/15" : ""}`}
            placeholder="Patitos"
            maxLength={40}
            aria-invalid={Boolean(fieldErrors.teamName)}
            aria-describedby={fieldErrors.teamName ? "register-team-error" : "register-team-hint"}
            disabled={submitting}
          />
          {fieldErrors.teamName ? (
            <p id="register-team-error" className="mt-1.5 text-xs text-rose-300">
              {fieldErrors.teamName}
            </p>
          ) : (
            <p id="register-team-hint" className="mt-1.5 text-[11px] text-slate-600">
              Entre 3 y 40 caracteres. Será el nombre visible en la consola.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-email" className="field-label">
            Email de la tripulación
          </label>
          <input
            ref={emailRef}
            id="register-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`field ${fieldErrors.email ? "border-crimson-500/55 focus:border-crimson-500/70 focus:ring-crimson-500/15" : ""}`}
            placeholder="tripulacion@grandline.test"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "register-email-error" : "register-email-hint"}
            disabled={submitting}
          />
          {fieldErrors.email ? (
            <p id="register-email-error" className="mt-1.5 text-xs text-rose-300">
              {fieldErrors.email}
            </p>
          ) : (
            <p id="register-email-hint" className="mt-1.5 text-[11px] text-slate-600">
              Todos los integrantes iniciarán sesión con este mismo email.
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="register-password" className="field-label">
              Contraseña
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`field pr-12 ${fieldErrors.password ? "border-crimson-500/55 focus:border-crimson-500/70 focus:ring-crimson-500/15" : ""}`}
                placeholder="8 caracteres o más"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "register-password-error" : "register-password-hint"}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
                aria-label={showPassword ? "Ocultar contraseñas" : "Mostrar contraseñas"}
              >
                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p id="register-password-error" className="mt-1.5 text-xs text-rose-300">
                {fieldErrors.password}
              </p>
            ) : (
              <p id="register-password-hint" className="mt-1.5 text-[11px] text-slate-600">
                8–72 caracteres.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="register-confirm" className="field-label">
              Repetir contraseña
            </label>
            <input
              ref={confirmRef}
              id="register-confirm"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`field ${fieldErrors.confirmPassword ? "border-crimson-500/55 focus:border-crimson-500/70 focus:ring-crimson-500/15" : ""}`}
              placeholder="Repite la contraseña"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? "register-confirm-error" : undefined}
              disabled={submitting}
            />
            {fieldErrors.confirmPassword && (
              <p id="register-confirm-error" className="mt-1.5 text-xs text-rose-300">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
              Registrando la tripulación…
            </>
          ) : (
            "Zarpar y abrir la consola"
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-slate-600">
          La cuenta es compartida. Guarda bien el email y la contraseña: los necesitarán en la
          inspección del CP3.
        </p>
      </form>
    </AuthLayout>
  );
}
