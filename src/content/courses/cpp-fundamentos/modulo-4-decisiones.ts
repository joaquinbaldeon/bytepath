import type { Module } from "@/lib/courses/types";

/**
 * Módulo 4 — Decisiones.
 *
 * Llega después de los operadores a propósito: el estudiante ya sabe escribir
 * la condición, así que aquí solo tiene que aprender la estructura que la
 * envuelve. Separar ambas cosas evita la lección típica en la que se enseñan
 * comparaciones, operadores lógicos e if todo a la vez.
 */
export const decisiones: Module = {
  slug: "decisiones",
  title: "Decisiones",
  summary: "Hacer que el programa elija un camino u otro según los datos.",
  lessons: [
    {
      slug: "if-else",
      title: "if, else y else if",
      kind: "theory",
      estimatedMinutes: 11,
      summary:
        "La estructura que convierte una condición en dos caminos distintos, y cómo encadenar varios casos.",
      blocks: [
        {
          type: "paragraph",
          text: "Hasta ahora tus programas ejecutaban todas sus líneas, siempre, en el mismo orden. Un if rompe eso: marca un bloque de código que solo se ejecuta si se cumple una condición.",
        },
        {
          type: "code",
          caption: "primer_if.cpp",
          code: 'int n = 7;\n\nif (n > 0) {\n  cout << "positivo" << endl;\n}',
          output: "positivo",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "La condición va entre paréntesis, justo después de if.",
            "Las llaves delimitan lo que se ejecuta si se cumple.",
            "Después del paréntesis no va punto y coma.",
          ],
        },
        {
          type: "heading",
          text: "El camino alternativo",
        },
        {
          type: "paragraph",
          text: "else marca lo que hay que hacer cuando la condición no se cumple. Uno de los dos bloques se ejecuta siempre, nunca los dos.",
        },
        {
          type: "code",
          caption: "if_else.cpp",
          code: 'int n = 4;\n\nif (n % 2 == 0) {\n  cout << "par" << endl;\n} else {\n  cout << "impar" << endl;\n}',
          output: "par",
        },
        {
          type: "heading",
          text: "Más de dos casos",
        },
        {
          type: "paragraph",
          text: "Cuando hay varias posibilidades se encadenan con else if. Se comprueban en orden y, en cuanto una se cumple, el resto ni se mira.",
        },
        {
          type: "code",
          caption: "else_if.cpp",
          code: 'int nota = 7;\n\nif (nota >= 9) {\n  cout << "sobresaliente" << endl;\n} else if (nota >= 7) {\n  cout << "notable" << endl;\n} else if (nota >= 5) {\n  cout << "aprobado" << endl;\n} else {\n  cout << "suspenso" << endl;\n}',
          output: "notable",
        },
        {
          type: "callout",
          variant: "key",
          title: "El orden decide el resultado",
          text: "Con nota valiendo 7 se cumplen tanto nota >= 7 como nota >= 5, pero solo se ejecuta la primera que encaja. Por eso las condiciones van de la más restrictiva a la más general: si las escribieras al revés, todo el mundo aprobaría y nadie sacaría notable.",
        },
        {
          type: "trace",
          title: "Recorre la cadena con nota valiendo 7",
          code: 'if (nota >= 9) {\n  cout << "sobresaliente";\n} else if (nota >= 7) {\n  cout << "notable";\n} else {\n  cout << "suspenso";\n}',
          steps: [
            {
              line: 1,
              explanation:
                "Se evalúa la primera condición: ¿7 es mayor o igual que 9? No, así que el bloque se salta entero.",
              variables: [{ name: "nota", value: "7" }],
            },
            {
              line: 3,
              explanation:
                "Se pasa a la siguiente: ¿7 es mayor o igual que 7? Sí. Esta es la rama que se ejecuta.",
              variables: [{ name: "nota", value: "7" }],
            },
            {
              line: 4,
              explanation: "Se escribe notable.",
              variables: [{ name: "nota", value: "7" }],
              output: "notable",
            },
            {
              line: 6,
              explanation:
                "El else no llega a evaluarse: en cuanto una rama se ejecuta, la cadena termina.",
              variables: [{ name: "nota", value: "7" }],
            },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "El punto y coma que rompe el if",
          text: "Escribir if (n > 0); { ... } compila sin error, pero ese punto y coma es el cuerpo del if. El bloque de llaves pasa a ejecutarse siempre, condición o no. Es un fallo silencioso difícil de ver.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Usa siempre las llaves",
          text: "C++ permite omitirlas cuando el cuerpo es una sola línea. Funciona, pero el día que añadas una segunda línea creyendo que sigue dentro del if, el programa hará algo distinto. Ponlas siempre: no cuesta nada.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "if-1",
            kind: "predict-output",
            prompt: "Con n valiendo 3, ¿qué escribe este fragmento?",
            code: 'if (n % 2 == 0) {\n  cout << "par";\n} else {\n  cout << "impar";\n}',
            options: [
              { id: "a", text: "impar" },
              { id: "b", text: "par" },
              { id: "c", text: "par e impar" },
            ],
            correctOptionId: "a",
            explanation:
              "3 % 2 da 1, así que la condición es falsa y se ejecuta el else. Nunca se ejecutan los dos bloques.",
          },
          {
            id: "if-2",
            kind: "predict-output",
            prompt: "Con x valiendo 10, ¿qué escribe esta cadena?",
            code: 'if (x > 5) {\n  cout << "A";\n} else if (x > 8) {\n  cout << "B";\n}',
            options: [
              { id: "a", text: "A" },
              { id: "b", text: "B" },
              { id: "c", text: "AB" },
            ],
            correctOptionId: "a",
            explanation:
              "Las dos condiciones se cumplen, pero solo entra la primera que encaja. La segunda es inalcanzable para cualquier valor mayor que 8.",
          },
          {
            id: "if-3",
            kind: "spot-error",
            prompt: "¿Por qué este código escribe siempre el mensaje, incluso con n negativo?",
            code: 'if (n > 0);\n{\n  cout << "positivo";\n}',
            options: [
              { id: "a", text: "El punto y coma tras el paréntesis es el cuerpo del if." },
              { id: "b", text: "Falta un else." },
              { id: "c", text: "La condición debería ser n >= 0." },
            ],
            correctOptionId: "a",
            explanation:
              "El if ejecuta esa instrucción vacía y el bloque de llaves queda suelto, ejecutándose siempre.",
          },
          {
            id: "if-4",
            kind: "concept",
            prompt: "¿Cuántos bloques se ejecutan en una cadena if / else if / else?",
            options: [
              { id: "a", text: "Exactamente uno: el primero cuya condición se cumpla." },
              { id: "b", text: "Todos los que cumplan su condición." },
              { id: "c", text: "Ninguno si hay más de dos ramas." },
            ],
            correctOptionId: "a",
            explanation:
              "Por eso el orden importa: en cuanto una encaja, la cadena entera termina.",
          },
          {
            id: "if-5",
            kind: "apply",
            prompt:
              "Quieres clasificar una nota como sobresaliente (9 o más), notable (7 u 8) o resto. ¿En qué orden escribes las condiciones?",
            options: [
              { id: "a", text: "Primero nota >= 9 y después nota >= 7." },
              { id: "b", text: "Primero nota >= 7 y después nota >= 9." },
              { id: "c", text: "El orden da igual mientras las dos estén." },
            ],
            correctOptionId: "a",
            explanation:
              "Al revés, un 9 entraría por la rama del notable y la de sobresaliente no se alcanzaría nunca.",
          },
          {
            id: "if-6",
            kind: "what-does-it-do",
            prompt: "¿Qué comprueba este if?",
            code: "if (n > 0 && n % 2 == 0)",
            options: [
              { id: "a", text: "Que n sea positivo y además par." },
              { id: "b", text: "Que n sea positivo o par." },
              { id: "c", text: "Que n sea mayor que 2." },
            ],
            correctOptionId: "a",
            explanation:
              "El && exige que se cumplan las dos cosas a la vez. Un -4 es par pero no positivo, así que no entraría.",
          },
        ],
      },
      challenge: {
        id: "if-else-desafio",
        title: "Par o impar",
        statement: [
          {
            type: "paragraph",
            text: "El primer programa que responde con palabras distintas según el dato que recibe. Es el esqueleto de casi cualquier problema con decisiones.",
          },
        ],
        instructions: [
          "Lee un número entero de la entrada.",
          "Si es par, escribe exactamente: par",
          "Si es impar, escribe exactamente: impar",
        ],
        requirements: [
          "La respuesta va en minúsculas y sin ningún texto adicional.",
          "Debe funcionar también con números negativos.",
        ],
        examples: [
          { input: "4", output: "par", explanation: "4 entre 2 no deja resto." },
          { input: "7", output: "impar", explanation: "7 entre 2 deja resto 1." },
          {
            input: "-3",
            output: "impar",
            explanation:
              "Con negativos, el resto de dividir entre 2 puede salir -1, así que comprobar si vale 0 es más seguro que comprobar si vale 1.",
          },
        ],
        hints: [
          "Un número es par cuando n % 2 == 0.",
          "Con negativos, n % 2 puede dar -1: por eso conviene preguntar si el resto es 0 y usar el else para el resto de casos.",
          'La estructura es: if (condición) { cout << "par"; } else { cout << "impar"; }',
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  // Decide si es par o impar y escríbelo\n\n  return 0;\n}",
      },
    },
    {
      slug: "switch",
      title: "switch",
      kind: "theory",
      estimatedMinutes: 8,
      summary:
        "Una forma más clara de elegir entre muchos valores concretos, con una trampa famosa.",
      blocks: [
        {
          type: "paragraph",
          text: "Cuando tienes que comparar una misma variable contra muchos valores concretos, una cadena de else if se vuelve repetitiva. switch expresa eso mismo de forma más directa.",
        },
        {
          type: "code",
          caption: "switch.cpp",
          code: "int opcion = 2;\n\nswitch (opcion) {\n  case 1:\n    cout << \"uno\" << endl;\n    break;\n  case 2:\n    cout << \"dos\" << endl;\n    break;\n  default:\n    cout << \"otro\" << endl;\n}",
          output: "dos",
        },
        {
          type: "list",
          items: [
            "Cada case indica un valor concreto que se compara con el del switch.",
            "break termina el switch: sin él, la ejecución continúa en el case siguiente.",
            "default recoge todo lo que no ha encajado. Es opcional, pero conviene ponerlo.",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Olvidar el break tiene consecuencias",
          text: "Sin break, la ejecución no se detiene al acabar un case: sigue cayendo por los siguientes hasta encontrar uno o llegar al final. Es legal y a veces se usa a propósito, pero cuando ocurre por descuido el programa escribe de más.",
        },
        {
          type: "code",
          caption: "sin_break.cpp",
          code: 'int opcion = 1;\n\nswitch (opcion) {\n  case 1:\n    cout << "uno" << endl;\n  case 2:\n    cout << "dos" << endl;\n    break;\n}',
          output: "uno\ndos",
        },
        {
          type: "callout",
          variant: "key",
          title: "Solo sirve para valores exactos",
          text: "Un case compara igualdad contra un valor constante. No puedes escribir case n > 5. Para rangos o condiciones compuestas necesitas if y else if.",
        },
        {
          type: "heading",
          text: "Cuándo usar cada uno",
        },
        {
          type: "list",
          items: [
            "switch: una variable comparada contra varios valores fijos, como un menú o un carácter de operación.",
            "if / else if: rangos, comparaciones o cualquier condición compuesta.",
          ],
        },
      ],
      quiz: {
        questions: [
          {
            id: "switch-1",
            kind: "predict-output",
            prompt: "Con opcion valiendo 1, ¿qué escribe este switch?",
            code: 'switch (opcion) {\n  case 1:\n    cout << "A";\n  case 2:\n    cout << "B";\n    break;\n}',
            options: [
              { id: "a", text: "AB" },
              { id: "b", text: "A" },
              { id: "c", text: "B" },
            ],
            correctOptionId: "a",
            explanation:
              "Al case 1 le falta el break, así que la ejecución cae al case 2 y escribe también la B.",
          },
          {
            id: "switch-2",
            kind: "concept",
            prompt: "¿Para qué sirve break dentro de un switch?",
            options: [
              { id: "a", text: "Para salir del switch y no seguir con los siguientes case." },
              { id: "b", text: "Para terminar el programa." },
              { id: "c", text: "Para saltar al default." },
            ],
            correctOptionId: "a",
            explanation:
              "Sin él, la ejecución continúa hacia abajo aunque el valor ya no coincida.",
          },
          {
            id: "switch-3",
            kind: "spot-error",
            prompt: "¿Por qué no compila este switch?",
            code: "switch (n) {\n  case n > 5:\n    cout << \"grande\";\n    break;\n}",
            options: [
              { id: "a", text: "Un case necesita un valor constante, no una comparación." },
              { id: "b", text: "Falta el default." },
              { id: "c", text: "n debería ir entre comillas." },
            ],
            correctOptionId: "a",
            explanation:
              "switch solo compara igualdad contra valores fijos. Para un rango hace falta if.",
          },
          {
            id: "switch-4",
            kind: "what-does-it-do",
            prompt: "¿Qué papel cumple default?",
            options: [
              { id: "a", text: "Se ejecuta cuando ningún case ha coincidido." },
              { id: "b", text: "Se ejecuta siempre, antes que los case." },
              { id: "c", text: "Es obligatorio en todo switch." },
            ],
            correctOptionId: "a",
            explanation:
              "Es el equivalente al else final de una cadena de condiciones. Puede omitirse, aunque casi siempre conviene.",
          },
          {
            id: "switch-5",
            kind: "apply",
            prompt:
              "Tienes que actuar según si una nota está entre 0 y 4, entre 5 y 8, o es 9 o más. ¿Qué estructura usas?",
            options: [
              { id: "a", text: "if / else if, porque son rangos." },
              { id: "b", text: "switch, con un case por cada rango." },
              { id: "c", text: "switch, con un case por cada nota posible." },
            ],
            correctOptionId: "a",
            explanation:
              "switch no entiende rangos. La opción c funcionaría a base de repetir diez case, pero es mucho peor de leer y mantener.",
          },
          {
            id: "switch-6",
            kind: "concept",
            prompt: "¿Cuándo resulta más claro un switch que una cadena de else if?",
            options: [
              {
                id: "a",
                text: "Cuando se compara una misma variable contra varios valores concretos.",
              },
              { id: "b", text: "Cuando hay más de dos condiciones, sean del tipo que sean." },
              { id: "c", text: "Cuando las condiciones combinan && y ||." },
            ],
            correctOptionId: "a",
            explanation:
              "Ese es justo su caso de uso: menús, opciones y caracteres. Las condiciones compuestas son territorio del if.",
          },
        ],
      },
      challenge: {
        id: "switch-desafio",
        title: "Calculadora de una operación",
        statement: [
          {
            type: "paragraph",
            text: "Un caso de manual para switch: un carácter decide qué operación aplicar. Es también el primer programa que lee un dato que no es un número.",
          },
        ],
        instructions: [
          "Lee dos números enteros y, después, un carácter con la operación.",
          "El carácter puede ser +, -, * o /.",
          "Aplica esa operación a los dos números y escribe el resultado.",
        ],
        requirements: [
          "Usa un switch sobre el carácter de la operación.",
          "La división es entre enteros: usa la división entera de siempre.",
          "Escribe solo el resultado, sin texto alrededor.",
        ],
        examples: [
          {
            input: "10 3 +",
            output: "13",
            explanation: "Se leen el 10, el 3 y el signo +, y se suman.",
          },
          {
            input: "10 3 /",
            output: "3",
            explanation: "División entera: 10 entre 3 son 3, y el resto se descarta.",
          },
          {
            input: "10 3 *",
            output: "30",
            explanation: "El asterisco es la multiplicación.",
          },
        ],
        hints: [
          "El carácter se lee en una variable char: cin >> a >> b >> op;",
          "En un switch sobre un char, los case van entre comillas simples: case '+':",
          "No olvides el break al final de cada case.",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  char op;\n  cin >> a >> b >> op;\n\n  // Aplica la operación con un switch y escribe el resultado\n\n  return 0;\n}",
      },
    },
    {
      slug: "quiz-decisiones",
      title: "Repaso del módulo",
      kind: "quiz",
      estimatedMinutes: 6,
      summary: "Seis preguntas sobre condiciones, cadenas de else if y switch.",
      blocks: [
        {
          type: "heading",
          text: "Lo que has visto en este módulo",
        },
        {
          type: "list",
          items: [
            "if y else: dos caminos, de los que siempre se recorre exactamente uno.",
            "else if: varios casos evaluados en orden, hasta que uno encaja.",
            "Que el orden de las condiciones cambia el resultado.",
            "switch para comparar contra valores concretos, y la importancia del break.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Piensa en los extremos",
          text: "Al escribir una condición, comprueba siempre qué pasa justo en el límite. Si el enunciado dice «a partir de 5», ¿el propio 5 entra? La diferencia entre > y >= es la causa de más veredictos incorrectos de lo que parece.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "dec-repaso-1",
            kind: "predict-output",
            prompt: "Con n valiendo 0, ¿qué escribe este fragmento?",
            code: 'if (n > 0) {\n  cout << "positivo";\n} else if (n < 0) {\n  cout << "negativo";\n} else {\n  cout << "cero";\n}',
            options: [
              { id: "a", text: "cero" },
              { id: "b", text: "positivo" },
              { id: "c", text: "No escribe nada." },
            ],
            correctOptionId: "a",
            explanation:
              "El 0 no es mayor ni menor que 0, así que las dos primeras fallan y entra el else.",
          },
          {
            id: "dec-repaso-2",
            kind: "spot-error",
            prompt:
              "El enunciado dice «aprobado a partir de 5» y este código suspende a quien saca justo un 5. ¿Qué falla?",
            code: 'if (nota > 5) {\n  cout << "aprobado";\n} else {\n  cout << "suspenso";\n}',
            options: [
              { id: "a", text: "Debería ser nota >= 5 para incluir el propio 5." },
              { id: "b", text: "Falta un else if intermedio." },
              { id: "c", text: "La condición debería ir al revés." },
            ],
            correctOptionId: "a",
            explanation:
              "«A partir de» incluye el valor. Es el error de extremo más común al traducir un enunciado.",
          },
          {
            id: "dec-repaso-3",
            kind: "concept",
            prompt: "¿Qué ocurre si en un switch olvidas un break?",
            options: [
              { id: "a", text: "La ejecución continúa en el case siguiente." },
              { id: "b", text: "El programa no compila." },
              { id: "c", text: "Se salta directamente al default." },
            ],
            correctOptionId: "a",
            explanation:
              "Compila sin protestar y ejecuta de más, que es lo que lo hace difícil de detectar.",
          },
          {
            id: "dec-repaso-4",
            kind: "apply",
            prompt:
              "Quieres escribir «fizz» si n es múltiplo de 3 y «no» en cualquier otro caso. ¿Cuál lo hace?",
            options: [
              { id: "a", text: 'if (n % 3 == 0) { cout << "fizz"; } else { cout << "no"; }' },
              { id: "b", text: 'if (n / 3 == 0) { cout << "fizz"; } else { cout << "no"; }' },
              { id: "c", text: 'if (n % 3) { cout << "fizz"; } else { cout << "no"; }' },
            ],
            correctOptionId: "a",
            explanation:
              "La b comprueba que la división dé cero, que solo pasa con n menor que 3. La c tiene la condición justo invertida.",
          },
          {
            id: "dec-repaso-5",
            kind: "predict-output",
            prompt: "Con x valiendo 5, ¿cuántas líneas escribe este fragmento?",
            code: 'if (x > 0) {\n  cout << "A" << endl;\n}\nif (x > 3) {\n  cout << "B" << endl;\n}',
            options: [
              { id: "a", text: "Dos: A y B." },
              { id: "b", text: "Una: solo A." },
              { id: "c", text: "Una: solo B." },
            ],
            correctOptionId: "a",
            explanation:
              "Son dos if independientes, no una cadena. Cada uno se evalúa por su cuenta y los dos se cumplen.",
          },
          {
            id: "dec-repaso-6",
            kind: "what-does-it-do",
            prompt: "¿Qué diferencia hay entre dos if seguidos y un if / else if?",
            options: [
              {
                id: "a",
                text: "Los dos if pueden ejecutarse ambos; en la cadena solo se ejecuta uno.",
              },
              { id: "b", text: "Ninguna, son formas distintas de escribir lo mismo." },
              { id: "c", text: "La cadena es más rápida pero hace lo mismo." },
            ],
            correctOptionId: "a",
            explanation:
              "Es una distinción de fondo: con else if las ramas se excluyen entre sí, con if sueltos no.",
          },
        ],
      },
      challenge: null,
    },
  ],
};
