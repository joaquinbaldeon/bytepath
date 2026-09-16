import { FeatureSection } from "@/components/home/FeatureSection";
import { CourseMock } from "@/components/home/mocks/CourseMock";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/site";

export function CoursesSection() {
  return (
    <FeatureSection
      id="cursos"
      pillar="learn"
      className="bg-white"
      title="Aprende paso a paso, a tu ritmo"
      description="Cada curso se divide en módulos y lecciones cortas. Lees la teoría, compruebas lo aprendido con un cuestionario y lo pones en práctica con ejercicios. Tu progreso se guarda en cada paso."
      points={[
        "Cursos organizados en módulos y lecciones",
        "Teoría breve y directa al grano",
        "Cuestionarios para afianzar cada concepto",
        "Ejercicios prácticos con progreso guardado",
      ]}
      visual={<CourseMock />}
      action={
        <Button href={routes.courses} variant="outlineLight" arrow>
          Explorar cursos
        </Button>
      }
    />
  );
}
