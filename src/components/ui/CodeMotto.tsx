/**
 * El lema de BytePath escrito como lo escribiría alguien que programa:
 *
 *   while (aprendes) {
 *     practica();
 *     compite();
 *   }
 *
 * Aparece en muy pocos sitios a propósito (el raíl de cursos y el pie): es un
 * guiño, no una estética de terminal para toda la página. Cada línea es un
 * bloque para que el sangrado no dependa de cómo JSX trata los espacios.
 */
export function CodeMotto({ className = "" }: { className?: string }) {
  const keyword = "text-brand-300";
  const fn = "text-learn";

  return (
    <pre
      aria-label="Mientras aprendes: practica y compite."
      className={`overflow-x-auto font-mono text-[11px] leading-5 text-slate-300 ${className}`}
    >
      <code aria-hidden>
        <span className="block">
          <span className={keyword}>while</span> (aprendes) {"{"}
        </span>
        <span className="block pl-4">
          <span className={fn}>practica</span>();
        </span>
        <span className="block pl-4">
          <span className={fn}>compite</span>();
        </span>
        <span className="block">{"}"}</span>
      </code>
    </pre>
  );
}
