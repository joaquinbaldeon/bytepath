import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Crear cuenta · BytePath",
  description: "Crea tu cuenta de BytePath y empieza a aprender C++ desde cero.",
};

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect(routes.courses);

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Guarda tu progreso y retoma los cursos desde cualquier dispositivo."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href={routes.login} className="font-medium text-brand-300 hover:text-white">
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
