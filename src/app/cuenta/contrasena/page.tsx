import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/account/PasswordForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { hasRecentLinkAuthentication } from "@/lib/auth/reauth";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cambiar contraseña · BytePath",
  description: "Elige una contraseña nueva para tu cuenta de BytePath.",
  robots: { index: false, follow: false },
};

/**
 * Cambiar la contraseña, y destino del enlace de recuperación. Si se llega
 * desde ese enlace (sesión abierta con él hace menos de 15 minutos), no se pide
 * la contraseña actual: es justo la que se ha olvidado.
 */
export default async function PasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?error=${encodeURIComponent("Inicia sesión para cambiar tu contraseña.")}`);

  const fromRecoveryLink = await hasRecentLinkAuthentication();

  return (
    <AuthShell
      title={fromRecoveryLink ? "Elige una contraseña nueva" : "Cambia tu contraseña"}
      subtitle={
        fromRecoveryLink
          ? "Has entrado con el enlace del correo. Elige la contraseña que usarás a partir de ahora."
          : "Por seguridad, primero confirma tu contraseña actual."
      }
      footer={
        <Link href={routes.account} className="font-medium text-brand-300 hover:text-white">
          Volver a tu cuenta
        </Link>
      }
    >
      <PasswordForm requireCurrent={!fromRecoveryLink} />
    </AuthShell>
  );
}
