import type { Module } from "@/lib/courses/types";

/**
 * Módulo 2 — Entrada y salida.
 *
 * Va tan pronto en el curso por una razón concreta: hasta que el estudiante no
 * sabe leer de la entrada, todos los desafíos tienen que fijar sus valores a
 * mano y ninguno se parece a un problema real. A partir de aquí, los enunciados
 * pueden dar datos de entrada como hace cualquier juez.
 */
export const entradaSalida: Module = {
  slug: "entrada-salida",
  title: "Entrada y salida",
  summary: "Leer los datos del problema y escribir la respuesta con el formato exacto.",
  lessons: [
    {
      slug: "leer-datos",
      title: "Leer datos con cin",
      kind: "theory",
      estimatedMinutes: 10,
      summary:
        "Hasta ahora tus programas siempre hacían lo mismo. Con cin empiezan a responder a los datos que reciben.",
      blocks: [
        {
          type: "paragraph",
          text: "Un problema de programación casi nunca te dice «suma 17 y 25». Te dice «te daremos dos números, súmalos». Tu programa tiene que funcionar con cualquier par de números que le llegue, y para eso necesita leerlos.",
        },
        {
          type: "paragraph",
          text: "La herramienta es cin, la pareja de cout. Donde cout envía datos hacia fuera con <<, cin los trae hacia dentro con >>. Las flechas apuntan en el sentido en que viaja el dato.",
        },
        {
          type: "code",
          caption: "leer_uno.cpp",
          code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  cout << n * 2 << endl;\n  return 0;\n}',
          output: "Si la entrada es 21, escribe 42",
        },
        {
          type: "paragraph",
          text: "Fíjate en el orden: primero se declara la variable, después se lee dentro de ella. cin necesita un sitio donde dejar el dato, y ese sitio es la variable que declaraste.",
        },
        {
          type: "heading",
          text: "Leer varios valores",
        },
        {
          type: "paragraph",
          text: "Puedes encadenar varias lecturas igual que encadenas salidas. Cada >> toma el siguiente valor de la entrada.",
        },
        {
          type: "code",
          caption: "leer_dos.cpp",
          code: "int a, b;\ncin >> a >> b;\ncout << a + b << endl;",
          output: "Con la entrada 17 25, escribe 42",
        },
        {
          type: "callout",
          variant: "key",
          title: "Los espacios y los saltos de línea dan igual",
          text: "A cin le da lo mismo que los datos vengan separados por un espacio, por varios o por saltos de línea: va tomando valores uno tras otro. Así que 17 25 en una línea y 17 y 25 en dos líneas se leen exactamente igual.",
        },
        {
          type: "trace",
          title: "Qué ocurre con la entrada 17 25",
          code: "int a, b;\ncin >> a >> b;\nint suma = a + b;\ncout << suma << endl;",
          steps: [
            {
              line: 1,
              explanation:
                "Se reservan dos variables enteras. Todavía no contienen nada útil: solo existe el espacio.",
              variables: [
                { name: "a", value: "?" },
                { name: "b", value: "?" },
              ],
            },
            {
              line: 2,
              explanation:
                "El primer >> toma el 17 y lo guarda en a. El segundo toma el 25 y lo guarda en b.",
              variables: [
                { name: "a", value: "17" },
                { name: "b", value: "25" },
              ],
            },
            {
              line: 3,
              explanation: "Se suman los dos valores leídos y el resultado se guarda en suma.",
              variables: [
                { name: "a", value: "17" },
                { name: "b", value: "25" },
                { name: "suma", value: "42" },
              ],
            },
            {
              line: 4,
              explanation: "Se escribe el resultado seguido de un salto de línea.",
              variables: [
                { name: "a", value: "17" },
                { name: "b", value: "25" },
                { name: "suma", value: "42" },
              ],
              output: "42",
            },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "El orden de lectura importa",
          text: "Si el enunciado dice que llega primero la altura y después la anchura, léelas en ese orden. Invertirlas no da error de compilación: simplemente calculas otra cosa, y el juez te lo marca como respuesta incorrecta sin decirte por qué.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "No escribas mensajes de adorno",
          text: 'En un juez automático, nada de "Introduce un número:". Tu salida se compara carácter a carácter con la esperada, y ese mensaje sobra. Lee, calcula y escribe solo la respuesta.',
        },
      ],
      quiz: {
        questions: [
          {
            id: "leer-datos-1",
            kind: "concept",
            prompt: "¿Qué hace cin >> n;?",
            options: [
              { id: "a", text: "Toma el siguiente valor de la entrada y lo guarda en n." },
              { id: "b", text: "Escribe el valor de n por pantalla." },
              { id: "c", text: "Declara la variable n y la pone a cero." },
            ],
            correctOptionId: "a",
            explanation:
              "La variable tiene que estar declarada antes. cin solo trae el dato y lo deposita dentro.",
          },
          {
            id: "leer-datos-2",
            kind: "predict-output",
            prompt: "Con la entrada 3 4, ¿qué escribe este programa?",
            code: "int a, b;\ncin >> a >> b;\ncout << a * b;",
            options: [
              { id: "a", text: "12" },
              { id: "b", text: "7" },
              { id: "c", text: "34" },
            ],
            correctOptionId: "a",
            explanation:
              "a vale 3 y b vale 4, así que a * b da 12. Los valores se leen en el orden en que aparecen.",
          },
          {
            id: "leer-datos-3",
            kind: "spot-error",
            prompt: "¿Qué problema tiene este fragmento?",
            code: "cin >> n;\nint n;",
            options: [
              { id: "a", text: "Se lee en n antes de haberla declarado." },
              { id: "b", text: "Falta un endl al final." },
              { id: "c", text: "No se puede leer en una variable de tipo int." },
            ],
            correctOptionId: "a",
            explanation:
              "El orden está invertido: primero hay que declarar la variable y después leer dentro de ella.",
          },
          {
            id: "leer-datos-4",
            kind: "concept",
            prompt:
              "La entrada trae 5 y 8 en dos líneas distintas. ¿Funciona cin >> a >> b; igual que si estuvieran en la misma línea?",
            options: [
              { id: "a", text: "Sí: los espacios y los saltos de línea se tratan igual." },
              { id: "b", text: "No: en líneas distintas hacen falta dos instrucciones cin." },
              { id: "c", text: "No: hay que leer los saltos de línea aparte." },
            ],
            correctOptionId: "a",
            explanation:
              "cin salta cualquier separación en blanco y toma el siguiente valor, esté donde esté.",
          },
          {
            id: "leer-datos-5",
            kind: "apply",
            prompt:
              "Un enunciado dice: «la primera línea contiene la base y la segunda la altura». ¿Qué haces?",
            options: [
              { id: "a", text: "Leer primero la base y después la altura, en ese mismo orden." },
              { id: "b", text: "Leer las dos a la vez, el orden no importa." },
              { id: "c", text: "Pedir los datos con un mensaje antes de cada lectura." },
            ],
            correctOptionId: "a",
            explanation:
              "El orden de lectura debe seguir al del enunciado. Y en un juez no se piden datos con mensajes: se leen y ya.",
          },
          {
            id: "leer-datos-6",
            kind: "what-does-it-do",
            prompt: "¿Por qué cout usa << y cin usa >>?",
            options: [
              { id: "a", text: "Las flechas indican hacia dónde viaja el dato." },
              { id: "b", text: "Es arbitrario, podrían intercambiarse." },
              { id: "c", text: "Porque << suma y >> resta." },
            ],
            correctOptionId: "a",
            explanation:
              "Con cout el dato sale hacia la pantalla; con cin entra hacia tu variable. La forma del símbolo ayuda a recordarlo.",
          },
        ],
      },
      challenge: {
        id: "leer-datos-desafio",
        title: "Suma dos números",
        statement: [
          {
            type: "paragraph",
            text: "El primer desafío de verdad: tu programa ya no sabe de antemano con qué números va a trabajar. Los recibe por la entrada y tiene que funcionar con cualquiera de ellos.",
          },
        ],
        instructions: [
          "Lee dos números enteros de la entrada.",
          "Calcula su suma.",
          "Muestra el resultado y nada más.",
        ],
        requirements: [
          "No escribas mensajes de texto: solo el número resultado.",
          "Tu programa debe funcionar con cualquier par de enteros, no solo con los del ejemplo.",
        ],
        examples: [
          {
            input: "17 25",
            output: "42",
            explanation: "17 + 25 son 42. Se escribe únicamente el resultado.",
          },
          {
            input: "100 -30",
            output: "70",
            explanation: "También tiene que funcionar con números negativos.",
          },
        ],
        hints: [
          "Declara las dos variables antes de leer: int a, b;",
          "Puedes leer las dos de una vez: cin >> a >> b;",
          "Escribe solo la suma: cout << a + b << endl;",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  // 1. Declara dos variables enteras\n\n  // 2. Léelas de la entrada\n\n  // 3. Muestra su suma\n\n  return 0;\n}",
      },
    },
    {
      slug: "salida-y-formato",
      title: "La salida exacta",
      kind: "theory",
      estimatedMinutes: 9,
      summary:
        "En un juez no basta con acertar el resultado: hay que escribirlo con el formato que pide el enunciado.",
      blocks: [
        {
          type: "paragraph",
          text: "Un juez automático compara tu salida con la esperada carácter a carácter. Un espacio de más, una mayúscula donde iba una minúscula o un salto de línea que falta convierten una solución correcta en un veredicto de respuesta incorrecta.",
        },
        {
          type: "heading",
          text: "Combinar texto y valores",
        },
        {
          type: "paragraph",
          text: "Encadenando << puedes mezclar en una misma línea lo que quieras. Lo que va entre comillas sale literal; lo que no, se calcula primero.",
        },
        {
          type: "code",
          caption: "mezcla.cpp",
          code: 'int n = 5;\ncout << "El doble de " << n << " es " << n * 2 << endl;',
          output: "El doble de 5 es 10",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Los espacios hay que ponerlos",
          text: 'Fíjate en los espacios dentro de las comillas: "El doble de " termina en espacio. Sin él saldría «El doble de5». C++ no añade separaciones por su cuenta.',
        },
        {
          type: "heading",
          text: "endl y el salto de línea",
        },
        {
          type: "paragraph",
          text: "Hay dos formas de saltar de línea. endl hace el salto y además fuerza a que la salida se envíe de inmediato. El carácter '\\n' solo hace el salto, y por eso es algo más rápido cuando escribes muchísimas líneas.",
        },
        {
          type: "code",
          caption: "saltos.cpp",
          code: 'cout << "primera" << endl;\ncout << "segunda\\n";',
          output: "primera\nsegunda",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Cuál usar",
          text: "Mientras estés aprendiendo, usa endl sin preocuparte. Cuando un problema pida escribir cientos de miles de líneas, cambia a '\\n': la diferencia deja de ser despreciable.",
        },
        {
          type: "heading",
          text: "Decimales",
        },
        {
          type: "paragraph",
          text: "Por defecto, un double se muestra con pocos decimales y puede aparecer en notación científica. Cuando el enunciado pida una precisión concreta, se fija así:",
        },
        {
          type: "code",
          caption: "decimales.cpp",
          code: '#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n  double media = 7.0 / 3.0;\n  cout << fixed << setprecision(2);\n  cout << media << endl;\n  return 0;\n}',
          output: "2.33",
        },
        {
          type: "list",
          items: [
            "fixed evita la notación científica y usa el formato decimal de siempre.",
            "setprecision(2) fija cuántos decimales se escriben.",
            "Hace falta incluir <iomanip> para poder usar setprecision.",
            "Una vez fijado, se aplica a todo lo que escribas después.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Lee el enunciado antes de dar formato",
          text: "La precisión no la eliges tú: la dice el problema. Si pide dos decimales y escribes seis, la salida no coincide. Si pide seis y escribes dos, tampoco.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "salida-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: 'int n = 4;\ncout << "n=" << n << endl;',
            options: [
              { id: "a", text: "n=4" },
              { id: "b", text: "n = 4" },
              { id: "c", text: "n=n" },
            ],
            correctOptionId: "a",
            explanation:
              'Entre comillas sale literal "n=" y sin comillas sale el valor. No se añade ningún espacio.',
          },
          {
            id: "salida-2",
            kind: "spot-error",
            prompt:
              "El enunciado pide escribir «Total: 10» y el programa escribe «Total:10». ¿Qué falta?",
            code: 'cout << "Total:" << total << endl;',
            options: [
              { id: "a", text: 'Un espacio dentro de las comillas: "Total: ".' },
              { id: "b", text: "Un endl adicional." },
              { id: "c", text: "Convertir total a texto antes de escribirlo." },
            ],
            correctOptionId: "a",
            explanation:
              "Los espacios forman parte del texto literal. Si no están entre las comillas, no aparecen.",
          },
          {
            id: "salida-3",
            kind: "concept",
            prompt: "¿En qué se diferencian endl y '\\n'?",
            options: [
              { id: "a", text: "endl salta de línea y además vacía el búfer; '\\n' solo salta." },
              { id: "b", text: "No se diferencian en nada." },
              { id: "c", text: "'\\n' salta dos líneas y endl una." },
            ],
            correctOptionId: "a",
            explanation:
              "Esa descarga extra es lo que hace a endl algo más lento cuando se escriben muchísimas líneas.",
          },
          {
            id: "salida-4",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "double x = 1.0 / 3.0;\ncout << fixed << setprecision(3);\ncout << x;",
            options: [
              { id: "a", text: "0.333" },
              { id: "b", text: "0.3333333" },
              { id: "c", text: "0.33" },
            ],
            correctOptionId: "a",
            explanation: "setprecision(3) con fixed fija exactamente tres decimales.",
          },
          {
            id: "salida-5",
            kind: "what-does-it-do",
            prompt: "¿Para qué sirve incluir <iomanip>?",
            options: [
              { id: "a", text: "Para poder usar herramientas de formato como setprecision." },
              { id: "b", text: "Para poder usar cout y cin." },
              { id: "c", text: "Para trabajar con números decimales." },
            ],
            correctOptionId: "a",
            explanation:
              "cout y cin vienen de <iostream>; los double no necesitan ninguna biblioteca. <iomanip> aporta los manipuladores de formato.",
          },
          {
            id: "salida-6",
            kind: "apply",
            prompt:
              "Un problema pide el resultado con dos decimales y tu programa escribe 2.3333333. ¿Qué haces?",
            options: [
              { id: "a", text: "Añadir cout << fixed << setprecision(2); antes de escribirlo." },
              { id: "b", text: "Redondear a mano multiplicando por 100." },
              { id: "c", text: "Cambiar el double por un int." },
            ],
            correctOptionId: "a",
            explanation:
              "Cambiarlo a int perdería los decimales por completo, que es justo lo que el problema pide conservar.",
          },
        ],
      },
      challenge: {
        id: "salida-desafio",
        title: "La media exacta",
        statement: [
          {
            type: "paragraph",
            text: "Un problema clásico de formato: el cálculo es sencillo, lo que se comprueba es que escribas el resultado exactamente como se pide.",
          },
        ],
        instructions: [
          "Lee tres números enteros de la entrada.",
          "Calcula su media.",
          "Muestra la media con exactamente dos decimales.",
        ],
        requirements: [
          "La media debe calcularse con decimales: divide entre 3.0, no entre 3.",
          "Usa fixed y setprecision(2), y recuerda incluir <iomanip>.",
          "Escribe solo el número, sin texto alrededor.",
        ],
        examples: [
          {
            input: "1 2 3",
            output: "2.00",
            explanation: "La media es 2, y se escribe con dos decimales: 2.00.",
          },
          {
            input: "7 8 10",
            output: "8.33",
            explanation: "25 entre 3 son 8.333..., que con dos decimales queda en 8.33.",
          },
        ],
        hints: [
          "Lee los tres enteros en variables int normales.",
          "Para que la división dé decimales, divide entre 3.0 en lugar de entre 3.",
          "Antes de escribir: cout << fixed << setprecision(2);",
        ],
        starterCode:
          "#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n  // 1. Lee los tres enteros\n\n  // 2. Calcula la media con decimales\n\n  // 3. Escríbela con dos decimales\n\n  return 0;\n}",
      },
    },
    {
      slug: "quiz-entrada-salida",
      title: "Repaso del módulo",
      kind: "quiz",
      estimatedMinutes: 6,
      summary:
        "Seis preguntas sobre leer datos y escribir la respuesta con el formato que pide el enunciado.",
      blocks: [
        {
          type: "heading",
          text: "Lo que has visto en este módulo",
        },
        {
          type: "list",
          items: [
            "Leer valores de la entrada con cin y el operador >>.",
            "Que los espacios y los saltos de línea no cambian cómo se lee.",
            "Combinar texto y valores en una misma línea de salida.",
            "Controlar los decimales con fixed y setprecision.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "La plantilla que vas a repetir mil veces",
          text: "Leer los datos, calcular, escribir la respuesta. A partir de aquí, casi todos los problemas que resuelvas tienen esa forma; lo que cambia es el cálculo del medio.",
        },
        {
          type: "code",
          caption: "plantilla.cpp",
          code: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a + b << endl;\n  return 0;\n}",
        },
      ],
      quiz: {
        questions: [
          {
            id: "es-repaso-1",
            kind: "predict-output",
            prompt: "Con la entrada 6 2, ¿qué escribe este programa?",
            code: "int a, b;\ncin >> a >> b;\ncout << a - b;",
            options: [
              { id: "a", text: "4" },
              { id: "b", text: "-4" },
              { id: "c", text: "62" },
            ],
            correctOptionId: "a",
            explanation: "a toma el 6 y b el 2, en el orden en que aparecen. 6 - 2 son 4.",
          },
          {
            id: "es-repaso-2",
            kind: "spot-error",
            prompt: "¿Por qué este programa no hace lo que pretende?",
            code: 'int n;\ncout << "Dame un numero: ";\ncin >> n;\ncout << n * 2;',
            options: [
              {
                id: "a",
                text: "El mensaje sobra: en un juez la salida se compara y ese texto no se espera.",
              },
              { id: "b", text: "No se puede escribir antes de leer." },
              { id: "c", text: "Falta declarar n como entero." },
            ],
            correctOptionId: "a",
            explanation:
              "El programa compila y calcula bien, pero su salida lleva texto de más y no coincidiría con la esperada.",
          },
          {
            id: "es-repaso-3",
            kind: "concept",
            prompt: "¿Qué hace falta para que cin pueda guardar un valor?",
            options: [
              { id: "a", text: "Una variable declarada antes, del tipo adecuado." },
              { id: "b", text: "Que el usuario escriba el dato en la misma línea." },
              { id: "c", text: "Incluir la biblioteca <iomanip>." },
            ],
            correctOptionId: "a",
            explanation:
              "La línea ni la biblioteca importan aquí. Lo imprescindible es tener dónde dejar el dato.",
          },
          {
            id: "es-repaso-4",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: 'cout << "a" << "b" << endl << "c";',
            options: [
              { id: "a", text: "ab en una línea y c en la siguiente." },
              { id: "b", text: "a b c separados por espacios." },
              { id: "c", text: "abc en una sola línea." },
            ],
            correctOptionId: "a",
            explanation:
              "Los dos primeros se pegan porque nada los separa; el endl corta la línea antes de la c.",
          },
          {
            id: "es-repaso-5",
            kind: "apply",
            prompt:
              "El enunciado dice: «la entrada contiene dos enteros; escribe su producto». ¿Cuál es la solución completa?",
            options: [
              { id: "a", text: "int a, b; cin >> a >> b; cout << a * b << endl;" },
              { id: "b", text: "int a, b; cout << a * b << endl;" },
              { id: "c", text: 'cin >> a >> b; cout << "a * b" << endl;' },
            ],
            correctOptionId: "a",
            explanation:
              "La b nunca lee, así que multiplica basura. La c escribe el texto literal en lugar del resultado.",
          },
          {
            id: "es-repaso-6",
            kind: "concept",
            prompt: "¿Por qué conviene calcular con 3.0 en lugar de 3 al hallar una media?",
            options: [
              { id: "a", text: "Para que la división conserve los decimales." },
              { id: "b", text: "Porque dividir entre 3 da error de compilación." },
              { id: "c", text: "Porque 3.0 es más rápido de calcular." },
            ],
            correctOptionId: "a",
            explanation:
              "Con dos enteros, la división descarta la parte decimal. Lo verás en detalle en el próximo módulo.",
          },
        ],
      },
      challenge: null,
    },
  ],
};
