import { CircleAlert, CircleCheck, MailCheck } from "lucide-react";

/**
 * Error, aviso o confirmación de un formulario de cuenta.
 *
 * Los tres son excluyentes: cada respuesta del servidor llena uno solo.
 * Usa los tokens de pilar (danger / learn / practice), que ya están definidos
 * para ambos temas, en vez de colores fijos.
 */
export function AuthMessage({
  error,
  notice,
  success,
}: {
  error?: string | null;
  notice?: string | null;
  success?: string | null;
}) {
  if (!error && !notice && !success) return null;

  const variant = error ? "error" : success ? "success" : "notice";

  const styles = {
    error: "border-hard/30 bg-danger-soft text-danger-ink",
    // "Revisa tu correo" no es un error: es un paso pendiente.
    notice: "border-learn/30 bg-learn-soft text-learn-ink",
    success: "border-practice/30 bg-practice-soft text-practice-ink",
  } as const;

  const Icon = { error: CircleAlert, notice: MailCheck, success: CircleCheck }[variant];

  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-control border px-3.5 py-3 text-dense leading-6 ${styles[variant]}`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{error ?? success ?? notice}</span>
    </p>
  );
}
