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
      description="Estamos preparando un banco de problemas por dificultad y tema. Mientras tanto, ya puedes escribir y ejecutar C++ en el navegador con los desafíos de cada lección de los cursos."
      points={[
        "Problemas de dificultad fácil, media y difícil",
        "Temas como programación dinámica, grafos o greedy",
        "Editor de C++ integrado en el navegador",
        "Envío de soluciones y registro de problemas resueltos",
      ]}
      visual={<ProblemsMock />}
      action={
        <Button href={routes.courses} variant="outlineLight" arrow>
          Practicar con los cursos
        </Button>
      }
    />
  );
}
