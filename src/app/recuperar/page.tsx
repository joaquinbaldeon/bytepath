import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RecoverForm } from "@/components/auth/RecoverForm";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Recuperar contraseña · BytePath",
  description: "Recibe un enlace para elegir una contraseña nueva.",
};

export default function RecoverPage() {
  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva."
      footer={
        <>
          ¿La recordaste?{" "}
          <Link href={routes.login} className="font-medium text-brand-300 hover:text-white">
            Inicia sesión
          </Link>
        </>
      }
    >
      <RecoverForm />
    </AuthShell>
  );
}
