/**
 * Desplazamiento inmediato. `behavior: "auto"` hereda `scroll-behavior: smooth`
 * del documento, así que se desactiva temporalmente para que la restauración
 * de posición no se vea como una animación.
 */
export function scrollInstantly(top: number): void {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo({ top, behavior: "auto" });
  root.style.scrollBehavior = previous;
}
