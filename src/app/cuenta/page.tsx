import { ArrowLeft, CircleCheck, Coins, Download, KeyRound, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { TermsAcceptNotice } from "@/components/account/TermsAcceptNotice";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/ui/Container";
import { EconomyCard } from "@/components/tokens/EconomyCard";
import { getCourse, getLesson, lessonPath } from "@/lib/courses/api";
import { readAccountState } from "@/lib/energy/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { TERMS_VERSION } from "@/lib/legal/documents";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tu cuenta · BytePath",
  description: "Energía disponible, próxima regeneración y saldo de tokens.",
};

/**
 * Resumen de la economía de la cuenta: energía, tokens y de dónde han salido.
 *
 * Se queda pequeña a propósito. No es un panel de perfil completo —eso no
 * existe todavía en BytePath y no es lo que pedía esta tarea— sino el sitio
 * donde aterriza el saldo de tokens de la barra y el botón de recarga que
 * antes solo vivía dentro de la pantalla de "sin energía".
 *
 * Exige sesión: la energía y los tokens pertenecen a una cuenta, así que sin
 * sesión no hay nada que enseñar. Mismo patrón que /login y /registro, pero
 * a la inversa (esas redirigen fuera SI ya hay sesión; esta redirige fuera SI
 * NO la hay).
 */
export default async function AccountPage({ searchParams }: PageProps<"/cuenta">) {
  const user = await getCurrentUser();
  if (!user) redirect(routes.login);

  const { contrasena, sesiones } = await searchParams;
  const passwordUpdated = contrasena === "actualizada";
  const otherSessionsOpen = sesiones === "abiertas";

  const state = await readAccountState();
  const profile = await getCurrentProfile();

  const supabase = await createSupabaseServerClient();
  const { data: history } = await supabase
    .from("token_transactions")
    .select("id, amount, type, course_slug, lesson_slug, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  // ¿Consta la aceptación de la versión vigente? Si la tabla todavía no existe
  // (legal.sql sin aplicar) no se ofrece aceptar: no se podría registrar.
  const { data: acceptance, error: acceptanceError } = await supabase
    .from("legal_acceptances")
    .select("accepted_at")
    .eq("document_type", "terms")
    .eq("document_version", TERMS_VERSION)
    .maybeSingle();
  const acceptedAt: string | null = acceptance?.accepted_at ?? null;

  return (
    <>
      <Navbar />
      <main className="min-h-dvh">
        <Container width="reading" className="pt-28 pb-16 sm:pt-32">
          <Link
            href={routes.courses}
            className="focus-ring group mb-5 inline-flex items-center gap-1.5 rounded-control text-dense text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Volver a cursos
          </Link>
          <p className="font-mono text-label text-fg-subtle">{"// tu cuenta"}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Energía y tokens
          </h1>

          <div className="mt-6">
            <EconomyCard
              isPremium={state.isPremium}
              initialRemaining={state.remaining}
              initialLimit={state.limit}
              initialTokens={state.tokens}
              initialNextEnergyAt={state.nextEnergyAt}
            />
          </div>

          {passwordUpdated && (
            <p
              role="status"
              className="mt-6 flex items-center gap-2 rounded-control border border-practice/30 bg-practice-soft px-3.5 py-3 text-dense text-practice-ink"
            >
              <CircleCheck aria-hidden className="size-4 shrink-0" />
              {otherSessionsOpen
                ? "Contraseña actualizada. No se han podido cerrar tus otras sesiones: cierra sesión en los demás dispositivos."
                : "Contraseña actualizada. Se han cerrado las sesiones abiertas en otros dispositivos."}
            </p>
          )}

          <section className="mt-8">
            <h2 className="font-display text-lg font-semibold">Movimientos recientes</h2>

            {!history || history.length === 0 ? (
              <p className="mt-3 text-dense text-fg-muted">
                Todavía no hay movimientos. Completa una lección para ganar tus primeros tokens.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
                {history.map((entry) => {
                  const isReward = entry.type === "lesson_completion";
                  const course = entry.course_slug ? getCourse(entry.course_slug) : undefined;
                  const lesson =
                    course && entry.lesson_slug ? getLesson(course, entry.lesson_slug) : undefined;
                  const label = isReward
                    ? (lesson?.lesson.title ?? "Lección completada")
                    : "Recarga de energía";
                  const date = new Date(entry.created_at).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const row = (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span
                        aria-hidden
                        className={`grid size-8 shrink-0 place-items-center rounded-full ${
                          isReward ? "bg-brand-soft" : "bg-energy-soft"
                        }`}
                      >
                        {isReward ? (
                          <Coins aria-hidden className="size-4 text-brand-ink" />
                        ) : (
                          <Zap aria-hidden className="size-4 text-energy-ink" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-dense font-medium">{label}</p>
                        <p className="text-label text-fg-subtle">{date}</p>
                      </div>
                      <span
                        className={`shrink-0 font-mono text-dense font-medium tabular-nums ${
                          entry.amount > 0 ? "text-practice-ink" : "text-fg-muted"
                        }`}
                      >
                        {entry.amount > 0 ? "+" : ""}
                        {entry.amount}
                      </span>
                    </div>
                  );

                  return (
                    <li key={entry.id}>
                      {isReward && course && lesson ? (
                        <Link
                          href={lessonPath(course.slug, lesson.lesson.slug)}
                          className="focus-ring-tight block transition-colors hover:bg-surface-2"
                        >
                          {row}
                        </Link>
                      ) : (
                        row
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-12" aria-labelledby="cuenta-privacidad">
            <h2 id="cuenta-privacidad" className="font-display text-lg font-semibold">
              Cuenta y privacidad
            </h2>

            <dl className="mt-3 grid gap-x-6 gap-y-2 text-dense sm:grid-cols-[10rem_1fr]">
              <dt className="text-fg-muted">Nombre de usuario</dt>
              <dd className="font-medium">{profile?.username ?? "—"}</dd>
              <dt className="text-fg-muted">Correo</dt>
              <dd className="font-medium break-all">{user.email ?? "—"}</dd>
              <dt className="text-fg-muted">Términos</dt>
              <dd>
                {acceptanceError
                  ? "No disponible"
                  : acceptedAt
                    ? `Versión ${TERMS_VERSION} aceptada el ${new Date(acceptedAt).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Sin aceptación registrada"}
              </dd>
            </dl>

            {!acceptanceError && !acceptedAt && (
              <div className="mt-4">
                <TermsAcceptNotice />
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={routes.passwordUpdate}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-control border border-line px-4 text-dense font-medium transition-colors hover:bg-surface-2"
              >
                <KeyRound aria-hidden className="size-4 text-fg-subtle" />
                Cambiar contraseña
              </Link>
              {/* Enlace normal y no <Link>: es una descarga, no una página. */}
              <a
                href={routes.dataExport}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-control border border-line px-4 text-dense font-medium transition-colors hover:bg-surface-2"
              >
                <Download aria-hidden className="size-4 text-fg-subtle" />
                Descargar mis datos
              </a>
            </div>
            <p className="mt-2 text-label leading-5 text-fg-subtle">
              La descarga es un archivo JSON con todo lo que BytePath guarda de tu cuenta.
            </p>

            <div className="mt-8 border-t border-line pt-6">
              <h3 className="text-dense font-semibold text-danger-ink">Eliminar cuenta</h3>
              <p className="mt-1 mb-3 text-dense leading-6 text-fg-muted">
                Borra tu cuenta y todos los datos que BytePath guarda de ella.
              </p>
              <DeleteAccountForm />
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
