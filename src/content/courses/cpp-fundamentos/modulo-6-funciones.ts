import type { Module } from "@/lib/courses/types";

/**
 * Módulo 6 — Funciones.
 *
 * Llega después de los bucles porque una función solo resulta convincente
 * cuando ya hay algo que merezca la pena encapsular: comprobar si un número es
 * primo es un bucle entero, y sacarlo a una función se justifica solo.
 *
 * Las referencias se introducen aquí, no antes, y por un motivo concreto: solo
 * tienen sentido una vez que el estudiante ha visto que un parámetro normal es
 * una copia y que modificarlo no cambia nada fuera.
 */
export const funciones: Module = {
  slug: "funciones",
  title: "Funciones",
  summary: "Dar nombre a un trozo de trabajo para poder reutilizarlo y razonar mejor.",
  lessons: [
    {
      slug: "funciones",
      title: "Escribir tus propias funciones",
      kind: "theory",
      estimatedMinutes: 11,
      summary:
        "Empaquetar un cálculo con un nombre, darle datos de entrada y recibir un resultado.",
      blocks: [
        {
          type: "paragraph",
          text: "Llevas todo el curso usando una función: main. Ahora vas a escribir las tuyas. Una función es un bloque de código con nombre que recibe unos datos, hace algo con ellos y normalmente devuelve un resultado.",
        },
        {
          type: "code",
          caption: "primera_funcion.cpp",
          code: "#include <iostream>\nusing namespace std;\n\nint cuadrado(int x) {\n  return x * x;\n}\n\nint main() {\n  cout << cuadrado(5) << endl;\n  cout << cuadrado(3) << endl;\n  return 0;\n}",
          output: "25\n9",
        },
        {
          type: "heading",
          text: "Las partes de una función",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "int, al principio: el tipo del valor que devuelve.",
            "cuadrado: el nombre con el que la llamarás.",
            "(int x): los parámetros, los datos que recibe.",
            "return x * x;: el valor que entrega a quien la llamó.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "return termina la función ahí mismo",
          text: "En cuanto se ejecuta un return, la función acaba y devuelve ese valor. Lo que hubiera escrito después no se ejecuta. Eso permite salir antes de tiempo cuando ya sabes la respuesta.",
        },
        {
          type: "heading",
          text: "Funciones que no devuelven nada",
        },
        {
          type: "paragraph",
          text: "Si una función solo hace algo —escribir por pantalla, por ejemplo— y no tiene ningún resultado que entregar, su tipo es void y no lleva return.",
        },
        {
          type: "code",
          caption: "void.cpp",
          code: 'void saludar(int veces) {\n  for (int i = 0; i < veces; i++) {\n    cout << "hola" << endl;\n  }\n}',
        },
        {
          type: "heading",
          text: "Dónde se escriben",
        },
        {
          type: "paragraph",
          text: "Las funciones van fuera de main, normalmente antes. C++ necesita conocerlas en el momento en que las usas: si escribes la función después de main, el compilador se queja de que no sabe qué es.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "El compilador lee de arriba abajo",
          text: 'Si llamas a una función que aparece más abajo en el archivo, el error dirá algo como «no se ha declarado en este ámbito». La solución más simple: define tus funciones antes de main.',
        },
        {
          type: "heading",
          text: "Por qué molestarse",
        },
        {
          type: "paragraph",
          text: "Una función bien elegida convierte un bloque difícil de leer en una línea que se explica sola. Compara estas dos formas de decir lo mismo:",
        },
        {
          type: "code",
          caption: "legibilidad.cpp",
          code: "// Sin función: hay que leerlo entero para saber qué comprueba\nbool primo = true;\nif (n < 2) primo = false;\nfor (int d = 2; d * d <= n; d++) {\n  if (n % d == 0) primo = false;\n}\nif (primo) cout << n;\n\n// Con función: se entiende de un vistazo\nif (esPrimo(n)) cout << n;",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Una función, una responsabilidad",
          text: "Si al describir lo que hace tu función necesitas la palabra «y» varias veces, probablemente sean dos funciones. Las piezas pequeñas se prueban y se reutilizan mucho mejor.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "funciones-1",
            kind: "concept",
            prompt: "En int cuadrado(int x), ¿qué indica el primer int?",
            options: [
              { id: "a", text: "El tipo del valor que la función devuelve." },
              { id: "b", text: "El tipo del parámetro que recibe." },
              { id: "c", text: "Que la función solo puede usarse con enteros." },
            ],
            correctOptionId: "a",
            explanation:
              "El tipo del parámetro es el int que va dentro del paréntesis. El de fuera es el del resultado.",
          },
          {
            id: "funciones-2",
            kind: "predict-output",
            prompt: "¿Qué escribe este programa?",
            code: "int doble(int x) {\n  return x * 2;\n}\n\nint main() {\n  cout << doble(doble(3));\n  return 0;\n}",
            options: [
              { id: "a", text: "12" },
              { id: "b", text: "6" },
              { id: "c", text: "9" },
            ],
            correctOptionId: "a",
            explanation:
              "Primero se resuelve la llamada interior, que da 6, y ese resultado entra en la exterior: 12.",
          },
          {
            id: "funciones-3",
            kind: "concept",
            prompt: "¿Qué ocurre en cuanto se ejecuta un return?",
            options: [
              { id: "a", text: "La función termina y devuelve ese valor." },
              { id: "b", text: "Se guarda el valor y la función sigue ejecutándose." },
              { id: "c", text: "Termina el programa entero." },
            ],
            correctOptionId: "a",
            explanation:
              "Es lo que permite salir antes de tiempo cuando la respuesta ya se conoce.",
          },
          {
            id: "funciones-4",
            kind: "what-does-it-do",
            prompt: "¿Cuándo se declara una función como void?",
            options: [
              { id: "a", text: "Cuando no devuelve ningún valor." },
              { id: "b", text: "Cuando no recibe parámetros." },
              { id: "c", text: "Cuando puede fallar." },
            ],
            correctOptionId: "a",
            explanation:
              "Una función void puede recibir todos los parámetros que quiera; lo que no tiene es resultado.",
          },
          {
            id: "funciones-5",
            kind: "spot-error",
            prompt: "¿Por qué no compila este programa?",
            code: "int main() {\n  cout << triple(2);\n  return 0;\n}\n\nint triple(int x) {\n  return x * 3;\n}",
            options: [
              { id: "a", text: "triple se usa antes de estar definida." },
              { id: "b", text: "Falta el return en main." },
              { id: "c", text: "triple debería devolver void." },
            ],
            correctOptionId: "a",
            explanation:
              "El compilador lee de arriba abajo. Basta con mover la función por encima de main.",
          },
          {
            id: "funciones-6",
            kind: "apply",
            prompt:
              "Necesitas comprobar si un número es primo en tres sitios distintos del programa. ¿Qué haces?",
            options: [
              { id: "a", text: "Escribir una función esPrimo y llamarla tres veces." },
              { id: "b", text: "Copiar el bucle en los tres sitios." },
              { id: "c", text: "Meter el bucle dentro de main una vez y confiar en el orden." },
            ],
            correctOptionId: "a",
            explanation:
              "Copiar el código triplica el sitio donde puede haber un fallo: si corriges uno, tienes que acordarte de los otros dos.",
          },
        ],
      },
      challenge: {
        id: "funciones-desafio",
        title: "¿Es primo?",
        statement: [
          {
            type: "paragraph",
            text: "Un número primo es el que solo se puede dividir entre 1 y entre sí mismo. El 1 no cuenta como primo. Encapsula la comprobación en una función: es justo el tipo de cálculo que merece un nombre.",
          },
        ],
        instructions: [
          "Lee un número entero n de la entrada.",
          "Comprueba si es primo, usando una función que reciba el número y devuelva un bool.",
          "Escribe si si es primo y no si no lo es.",
        ],
        requirements: [
          "La comprobación debe estar en una función aparte, no dentro de main.",
          "Ten en cuenta que ni el 1 ni los números menores son primos.",
          "La respuesta va en minúsculas, sin acentos: si o no.",
        ],
        examples: [
          { input: "7", output: "si", explanation: "El 7 solo se divide entre 1 y 7." },
          { input: "9", output: "no", explanation: "El 9 se divide también entre 3." },
          { input: "1", output: "no", explanation: "Por definición, el 1 no es primo." },
          { input: "2", output: "si", explanation: "El 2 es el primer primo, y el único par." },
        ],
        hints: [
          "Escribe bool esPrimo(int n) antes de main.",
          "Empieza descartando los casos pequeños: si n < 2, devuelve false.",
          "Basta con probar divisores hasta la raíz: for (int d = 2; d * d <= n; d++). Si alguno divide, devuelve false.",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\n// Escribe aquí tu función esPrimo\n\nint main() {\n  int n;\n  cin >> n;\n\n  // Usa la función y escribe si o no\n\n  return 0;\n}",
      },
    },
    {
      slug: "parametros-y-referencias",
      title: "Copias y referencias",
      kind: "theory",
      estimatedMinutes: 10,
      summary:
        "Por qué modificar un parámetro no cambia nada fuera, y cómo conseguir que sí lo haga.",
      blocks: [
        {
          type: "paragraph",
          text: "Cuando pasas una variable a una función, lo que llega es una copia. La función trabaja con su propio ejemplar, y lo que le haga no afecta al original.",
        },
        {
          type: "code",
          caption: "copia.cpp",
          code: "void intentarCambiar(int x) {\n  x = 100;\n}\n\nint main() {\n  int n = 5;\n  intentarCambiar(n);\n  cout << n << endl;\n  return 0;\n}",
          output: "5",
        },
        {
          type: "paragraph",
          text: "La función sí cambió su x, pero esa x era una copia que desapareció al terminar. La n de main nunca se enteró.",
        },
        {
          type: "heading",
          text: "Pasar por referencia",
        },
        {
          type: "paragraph",
          text: "Un ampersand en el parámetro cambia las reglas: en lugar de una copia, la función recibe un acceso directo a la variable original.",
        },
        {
          type: "code",
          caption: "referencia.cpp",
          code: "void cambiarDeVerdad(int &x) {\n  x = 100;\n}\n\nint main() {\n  int n = 5;\n  cambiarDeVerdad(n);\n  cout << n << endl;\n  return 0;\n}",
          output: "100",
        },
        {
          type: "callout",
          variant: "key",
          title: "La diferencia es un solo carácter",
          text: "int x recibe una copia; int &x recibe la variable misma. Ese ampersand es toda la diferencia entre un cambio que se pierde y uno que persiste.",
        },
        {
          type: "heading",
          text: "El otro motivo para usar referencias",
        },
        {
          type: "paragraph",
          text: "Copiar un int no cuesta nada. Pero cuando empieces a pasar colecciones con miles de elementos, copiarlas en cada llamada sí cuesta, y mucho. Ahí la referencia se usa para evitar la copia, no para modificar nada.",
        },
        {
          type: "code",
          caption: "referencia_constante.cpp",
          code: "// Recibe la colección sin copiarla, y promete no modificarla\nint sumar(const vector<int> &datos) {\n  int total = 0;\n  for (int x : datos) total += x;\n  return total;\n}",
        },
        {
          type: "callout",
          variant: "tip",
          title: "const cuando no vayas a modificar",
          text: "Añadir const deja claro que la función solo lee. Sirve de documentación y, si por error intentas modificar el dato, el compilador te avisa. Verás vector en el próximo módulo; quédate aquí con la idea.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Cuidado con devolver varios resultados",
          text: "Una función solo puede devolver un valor con return. Cuando necesites dos, la salida habitual en competitiva es pasar por referencia las variables donde dejar los resultados.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "ref-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este programa?",
            code: "void f(int x) {\n  x = 99;\n}\n\nint main() {\n  int n = 1;\n  f(n);\n  cout << n;\n  return 0;\n}",
            options: [
              { id: "a", text: "1" },
              { id: "b", text: "99" },
              { id: "c", text: "0" },
            ],
            correctOptionId: "a",
            explanation:
              "La función modificó su copia. La variable de main sigue con su valor original.",
          },
          {
            id: "ref-2",
            kind: "predict-output",
            prompt: "¿Y ahora?",
            code: "void f(int &x) {\n  x = 99;\n}\n\nint main() {\n  int n = 1;\n  f(n);\n  cout << n;\n  return 0;\n}",
            options: [
              { id: "a", text: "99" },
              { id: "b", text: "1" },
              { id: "c", text: "Da error de compilación." },
            ],
            correctOptionId: "a",
            explanation:
              "El ampersand hace que la función trabaje sobre la variable original, no sobre una copia.",
          },
          {
            id: "ref-3",
            kind: "concept",
            prompt: "¿Qué significa el & en int &x dentro de los parámetros?",
            options: [
              { id: "a", text: "Que el parámetro es una referencia a la variable original." },
              { id: "b", text: "Que el parámetro es opcional." },
              { id: "c", text: "Que el valor no se puede modificar." },
            ],
            correctOptionId: "a",
            explanation:
              "Lo que impide modificar es const, y de hecho suele combinarse con la referencia.",
          },
          {
            id: "ref-4",
            kind: "what-does-it-do",
            prompt: "¿Por qué se usa const vector<int> &datos como parámetro?",
            options: [
              { id: "a", text: "Para evitar copiar la colección y dejar claro que solo se lee." },
              { id: "b", text: "Para que la función pueda modificar la colección más rápido." },
              { id: "c", text: "Para que la colección se copie solo una vez." },
            ],
            correctOptionId: "a",
            explanation:
              "La referencia evita la copia; el const documenta la intención y deja que el compilador la haga cumplir.",
          },
          {
            id: "ref-5",
            kind: "apply",
            prompt:
              "Necesitas una función que devuelva a la vez el máximo y el mínimo de unos datos. ¿Cómo lo resuelves?",
            options: [
              { id: "a", text: "Pasando por referencia dos variables donde dejar los resultados." },
              { id: "b", text: "Con dos return seguidos." },
              { id: "c", text: "Devolviendo los dos valores separados por una coma." },
            ],
            correctOptionId: "a",
            explanation:
              "Un return solo entrega un valor, y el segundo nunca llegaría a ejecutarse.",
          },
          {
            id: "ref-6",
            kind: "concept",
            prompt: "Con un parámetro int normal, ¿qué recibe la función?",
            options: [
              { id: "a", text: "Una copia del valor, independiente del original." },
              { id: "b", text: "La variable original." },
              { id: "c", text: "La dirección de memoria de la variable." },
            ],
            correctOptionId: "a",
            explanation:
              "Por eso los cambios se pierden al terminar la función: la copia deja de existir.",
          },
        ],
      },
      challenge: null,
    },
    {
      slug: "quiz-funciones",
      title: "Repaso del módulo",
      kind: "quiz",
      estimatedMinutes: 6,
      summary: "Seis preguntas sobre definir funciones, devolver valores y pasar parámetros.",
      blocks: [
        {
          type: "heading",
          text: "Lo que has visto en este módulo",
        },
        {
          type: "list",
          items: [
            "Definir funciones con su tipo de retorno, nombre y parámetros.",
            "Que return termina la función en el acto.",
            "void para las funciones que no devuelven nada.",
            "La diferencia entre recibir una copia y recibir una referencia.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Las funciones son para pensar, no solo para reutilizar",
          text: "Aunque solo la llames una vez, sacar un cálculo a una función con buen nombre hace que el resto del programa se lea de un vistazo. En un concurso, entender tu propio código rápido vale tiempo.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "fun-repaso-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este programa?",
            code: "int suma(int a, int b) {\n  return a + b;\n}\n\nint main() {\n  cout << suma(2, 3) * 2;\n  return 0;\n}",
            options: [
              { id: "a", text: "10" },
              { id: "b", text: "7" },
              { id: "c", text: "5" },
            ],
            correctOptionId: "a",
            explanation:
              "Primero se resuelve la llamada, que da 5, y después se multiplica por 2.",
          },
          {
            id: "fun-repaso-2",
            kind: "concept",
            prompt: "¿Cuántos valores puede devolver una función con return?",
            options: [
              { id: "a", text: "Uno." },
              { id: "b", text: "Tantos como parámetros reciba." },
              { id: "c", text: "Dos como máximo." },
            ],
            correctOptionId: "a",
            explanation:
              "Para entregar más de un resultado se recurre a parámetros por referencia.",
          },
          {
            id: "fun-repaso-3",
            kind: "predict-output",
            prompt: "¿Qué devuelve esta función si le pasas un 4?",
            code: "bool comprobar(int n) {\n  if (n % 2 == 0) {\n    return true;\n  }\n  return false;\n}",
            options: [
              { id: "a", text: "true, y la última línea no se ejecuta." },
              { id: "b", text: "false, porque la última línea manda." },
              { id: "c", text: "Da error por tener dos return." },
            ],
            correctOptionId: "a",
            explanation:
              "El primer return que se alcanza termina la función. Tener varios es perfectamente normal.",
          },
          {
            id: "fun-repaso-4",
            kind: "spot-error",
            prompt: "Esta función debería duplicar el valor recibido pero no cambia nada. ¿Por qué?",
            code: "void duplicar(int x) {\n  x = x * 2;\n}",
            options: [
              { id: "a", text: "Recibe una copia: haría falta int &x." },
              { id: "b", text: "Le falta un return." },
              { id: "c", text: "No se puede multiplicar un parámetro." },
            ],
            correctOptionId: "a",
            explanation:
              "La otra solución sería devolver el resultado con return en lugar de modificar el parámetro.",
          },
          {
            id: "fun-repaso-5",
            kind: "apply",
            prompt: "¿Qué tipo de retorno le pones a una función que responde sí o no?",
            options: [
              { id: "a", text: "bool" },
              { id: "b", text: "int, devolviendo 1 o 0." },
              { id: "c", text: "void" },
            ],
            correctOptionId: "a",
            explanation:
              "La opción b funciona, pero bool dice exactamente lo que significa el resultado y se lee mejor en un if.",
          },
          {
            id: "fun-repaso-6",
            kind: "what-does-it-do",
            prompt: "¿Dónde conviene definir tus funciones?",
            options: [
              { id: "a", text: "Antes de main, para que el compilador ya las conozca al usarlas." },
              { id: "b", text: "Dentro de main, junto al código que las llama." },
              { id: "c", text: "Al final del archivo, para que main quede arriba." },
            ],
            correctOptionId: "a",
            explanation:
              "Existe una forma de declararlas arriba y definirlas abajo, pero mientras aprendes lo más simple es ponerlas antes.",
          },
        ],
      },
      challenge: null,
    },
  ],
};
