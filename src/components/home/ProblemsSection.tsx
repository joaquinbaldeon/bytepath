import { FeatureSection } from "@/components/home/FeatureSection";
import { ProblemsMock } from "@/components/home/mocks/ProblemsMock";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/site";

export function ProblemsSection() {
  return (
    <FeatureSection
      id="problemas"
      pillar="practice"
      reverse
      className="bg-paper"
      title="Resuelve problemas y afina tu lógica"
      description="Elige un problema según su dificultad y tema, escribe tu solución en C++ directamente en el navegador y envíala. Cada problema resuelto suma a tu progreso."
      points={[
        "Problemas de dificultad fácil, media y difícil",
        "Temas como programación dinámica, grafos o greedy",
        "Editor de C++ integrado en el navegador",
        "Envío de soluciones y registro de problemas resueltos",
      ]}
      visual={<ProblemsMock />}
      action={
        <Button href={routes.problems} variant="outlineLight" arrow>
          Resolver un problema
        </Button>
      }
    />
  );
}
