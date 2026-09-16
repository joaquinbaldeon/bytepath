import { CompetitionSection } from "@/components/home/CompetitionSection";
import { CoursesSection } from "@/components/home/CoursesSection";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PillarsOverview } from "@/components/home/PillarsOverview";
import { ProblemsSection } from "@/components/home/ProblemsSection";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    // La Home mantiene su composición de bandas claras y oscuras en ambos
    // temas: fija aquí su propio tema y no depende del selector global.
    // `text-fg` es imprescindible: el color heredado del <body> se resuelve
    // fuera de este subárbol, así que hay que volver a declararlo aquí.
    <div data-theme="light" className="bg-canvas text-fg">
      <Navbar />
      <main>
        <Hero />
        <PillarsOverview />
        <CoursesSection />
        <ProblemsSection />
        <CompetitionSection />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
