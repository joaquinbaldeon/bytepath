import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BytePath · Aprende. Practica. Compite.",
  description:
    "Plataforma de programación competitiva en C++: cursos guiados, problemas para practicar y competición.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      // El tema lo fija ThemeScript antes de pintar, así que el atributo no
      // coincide con el del servidor: es esperado.
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-full">
        <ThemeScript />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
