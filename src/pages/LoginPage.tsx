import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { IconEye, IconEyeOff } from "../components/icons";
import { toApiError } from "../lib/api";
import { errorMessage, isRateLimited, mapDetails, retryAfter, type FieldErrors } from "../lib/form-errors";
import { safeRedirect } from "../lib/navigation";

const EMAIL_PATTERN = /^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const cleanEmail = email.trim();
    if (!cleanEmail) nextErrors.email = "Escribe el email de la tripulación.";
    else if (!EMAIL_PATTERN.test(cleanEmail)) nextErrors.email = "Escribe un email válido.";
    if (!password) nextErrors.password = "Escribe la contraseña de la tripulación.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      (nextErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await signIn(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (cause: unknown) {
      const error = toApiError(cause);
      if (error.code === "INVALID_CREDENTIALS") {
        setFormError("Email o contraseña incorrectos. Revisa los datos de tu tripulación.");
      } else if (error.code === "VALIDATION_ERROR") {
        const details = mapDetails(error, ["email", "password"]);
        setFieldErrors(details);
        if (Object.keys(details).length === 0) setFormError(errorMessage(error));
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
      eyebrow="East Blue · registro de tripulación"
      title="Bienvenido de vuelta, cazarrecompensas."
      subtitle="Inicia sesión con la cuenta compartida de tu tripulación para abrir la consola."
      footer={
        <>
          ¿Todavía no tienen cuenta?{" "}
          <Link
            to="/register"
            state={state}
            className="font-semibold text-gold-300 underline-offset-4 transition hover:text-gold-200 hover:underline"
          >
            Registren su tripulación
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
          <label htmlFor="login-email" className="field-label">
            Email de la tripulación
          </label>
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`field ${fieldErrors.email ? "border-crimson-500/55 focus:border-crimson-500/70 focus:ring-crimson-500/15" : ""}`}
            placeholder="tripulacion@grandline.test"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            disabled={submitting}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="mt-1.5 text-xs text-rose-300">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="login-password" className="field-label mb-0">
              Contraseña
            </label>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">Compartida</span>
          </div>
          <div className="relative">
            <input
              ref={passwordRef}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`field pr-12 ${fieldErrors.password ? "border-crimson-500/55 focus:border-crimson-500/70 focus:ring-crimson-500/15" : ""}`}
              placeholder="Tu contraseña"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="login-password-error" className="mt-1.5 text-xs text-rose-300">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
              Abriendo la consola…
            </>
          ) : (
            "Entrar a la consola"
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-slate-600">
          El email no distingue mayúsculas. La sesión se guarda en este navegador.
        </p>
      </form>
    </AuthLayout>
  );
}
