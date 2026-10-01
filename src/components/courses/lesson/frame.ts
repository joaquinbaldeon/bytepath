/**
 * El marco de la lección: dónde empieza y acaba el contenido dentro del área
 * principal (lo que queda a la derecha del índice del curso).
 *
 * Lo comparten la cabecera de la lección, el cuerpo de la teoría, el aviso de
 * completado y la barra inferior, y por eso todos arrancan en el mismo borde
 * izquierdo y acaban en el mismo derecho. Sin esto cada pieza tenía su propio
 * `max-w-2xl` centrado y no se alineaban entre sí.
 *
 * `max-w-[80rem]` no es "una columna más ancha": es el tope del ÁREA, y dentro
 * de ella el texto sigue limitado a ~34rem y los bloques se reparten en filas
 * (ver `lib/courses/composeBlocks.ts`). A 1920 px con el índice abierto, el área
 * mide ~1650 px y el marco ocupa ~1280 (~78%); el contenido, ya sin su padding,
 * ~1150 (~70%).
 *
 * Los saltos de padding usan container queries (`@5xl:`...) y no los de la
 * ventana: lo que importa es el ancho del área, y ese cambia con el índice
 * fijo (desde `xl`).
 */
export const lessonFrame = "mx-auto w-full max-w-[80rem] px-5 sm:px-8 @5xl:px-12 @7xl:px-16";
