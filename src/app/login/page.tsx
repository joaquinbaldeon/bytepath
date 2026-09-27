import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Iniciar sesión · BytePath",
  description: "Entra en tu cuenta de BytePath para seguir aprendiendo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Quien ya tiene sesión no pinta nada aquí.
  if (await getCurrentUser()) redirect(routes.courses);

  const { error, sesion, cuenta } = await searchParams;
  const initialError = typeof error === "string" ? error : undefined;
  // Lo pone la Server Action de salida al redirigir aquí.
  const initialNotice =
    sesion === "cerrada"
      ? "Has cerrado sesión."
      : cuenta === "eliminada"
        ? "Tu cuenta y los datos que BytePath guardaba de ella se han eliminado."
        : undefined;

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      subtitle="Entra para retomar tus cursos donde los dejaste."
      footer={
        <>
          ¿Todavía no tienes cuenta?{" "}
          <Link href={routes.signup} className="font-medium text-brand-300 hover:text-white">
            Créala gratis
          </Link>
        </>
      }
    >
      <LoginForm initialError={initialError} initialNotice={initialNotice} />
    </AuthShell>
  );
}
