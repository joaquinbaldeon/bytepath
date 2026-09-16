import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LogoMark } from "@/components/ui/Logo";
import { routes } from "@/lib/site";

export function FinalCTA() {
  return (
    <section
      id="comenzar"
      className="relative isolate overflow-hidden bg-night-900 py-24 text-white sm:py-32"
    >
      <div
        aria-hidden
        className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]"
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -z-10 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-[120px]"
      />

      <Container className="text-center">
        <Reveal>
          <LogoMark className="mx-auto size-12" />
          <h2 className="mt-8 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Tu ruta empieza con un byte.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
            Crea tu cuenta y da hoy el primer paso: aprende, practica y prepárate
            para competir.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button href={routes.signup} size="lg" arrow>
              Crear cuenta
            </Button>
            <Button href={routes.courses} size="lg" variant="outlineDark">
              Explorar cursos
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
