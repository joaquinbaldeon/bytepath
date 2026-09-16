export const THEME_STORAGE_KEY = "bytepath-theme";

/**
 * Se ejecuta de forma síncrona antes de que se pinte el contenido, así que el
 * tema guardado ya está aplicado en el primer fotograma: sin destellos al
 * cargar ni al recargar. En la primera visita se respeta la preferencia del
 * sistema.
 */
const script = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
