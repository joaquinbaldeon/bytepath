import { FeatureSection } from "@/components/home/FeatureSection";
import { LeaderboardMock } from "@/components/home/mocks/LeaderboardMock";

export function CompetitionSection() {
  return (
    <FeatureSection
      id="competicion"
      pillar="compete"
      className="bg-white"
      title="Ponte a prueba en concursos"
      description="Estamos preparando un espacio para entrenar y competir: concursos con tiempo límite, clasificación y problemas pensados para llevar tu nivel al siguiente paso."
      points={[
        "Preparación específica para programación competitiva",
        "Concursos con tiempo límite",
        "Clasificación para comparar tu rendimiento",
      ]}
      visual={<LeaderboardMock />}
    />
  );
}
