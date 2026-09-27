import type { Module } from "@/lib/courses/types";

/**
 * Módulo 3 — Operadores.
 *
 * La división entera y el resto tienen peso propio dentro de la primera
 * lección: son la causa más frecuente de resultados incorrectos que compilan
 * sin protestar, y en programación competitiva aparecen a diario.
 *
 * Los operadores de comparación y los lógicos se enseñan aquí, antes de if,
 * para que al llegar a las condiciones el estudiante ya sepa construir la
 * expresión y solo tenga que aprender la estructura que la usa.
 */
export const operadores: Module = {
  slug: "operadores",
  title: "Operadores",
  summary: "Calcular, comparar y combinar condiciones.",
  lessons: [
    {
      slug: "operadores-aritmeticos",
      title: "Aritmética y división entera",
      kind: "theory",
      estimatedMinutes: 11,
      summary:
        "Las cinco operaciones básicas y la trampa que más resultados incorrectos provoca: dividir dos enteros.",
      blocks: [
        {
          type: "paragraph",
          text: "Los cuatro operadores que ya conoces de las matemáticas funcionan como esperas: suma, resta, multiplicación y división. El quinto, el resto, probablemente sea nuevo para ti, y resulta ser uno de los más útiles.",
        },
        {
          type: "code",
          caption: "operaciones.cpp",
          code: "int a = 17, b = 5;\ncout << a + b << endl;\ncout << a - b << endl;\ncout << a * b << endl;\ncout << a / b << endl;\ncout << a % b << endl;",
          output: "22\n12\n85\n3\n2",
        },
        {
          type: "heading",
          text: "La división entera",
        },
        {
          type: "paragraph",
          text: "Mira la cuarta línea: 17 / 5 da 3, no 3.4. Cuando divides dos enteros, C++ devuelve un entero y descarta la parte decimal. No redondea: la tira directamente.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Descartar no es redondear",
          text: "7 / 2 da 3, y 9 / 2 también da 4... no: da 4 solo si piensas en redondeo. En realidad 9 / 2 es 4 porque 4.5 pierde el .5. Y 5 / 10 da 0, no 0.5 ni 1. La parte decimal desaparece siempre, sea la que sea.",
        },
        {
          type: "paragraph",
          text: "Si quieres el resultado con decimales, al menos uno de los dos operandos tiene que ser decimal:",
        },
        {
          type: "code",
          caption: "division_real.cpp",
          code: "cout << 7 / 2 << endl;\ncout << 7 / 2.0 << endl;\ncout << 7.0 / 2 << endl;",
          output: "3\n3.5\n3.5",
        },
        {
          type: "heading",
          text: "El resto",
        },
        {
          type: "paragraph",
          text: "El operador % devuelve lo que sobra de la división. 17 % 5 es 2, porque 17 son tres veces 5 y sobran 2. Parece un detalle menor y es de las herramientas que más vas a usar.",
        },
        {
          type: "list",
          items: [
            "n % 2 vale 0 si n es par y 1 si es impar.",
            "n % 10 te da la última cifra de un número.",
            "n / 10 te quita la última cifra.",
            "Con % puedes saber si un número es múltiplo de otro: n % k == 0.",
          ],
        },
        {
          type: "trace",
          title: "Repartir 17 caramelos entre 5 niños",
          code: "int total = 17, ninos = 5;\nint cada = total / ninos;\nint sobran = total % ninos;\ncout << cada << \" \" << sobran;",
          steps: [
            {
              line: 1,
              explanation: "Se guardan los datos del problema.",
              variables: [
                { name: "total", value: "17" },
                { name: "ninos", value: "5" },
              ],
            },
            {
              line: 2,
              explanation:
                "La división entera dice cuántos caramelos completos toca a cada uno: 3. El .4 que sobraría no tiene sentido aquí, y por eso la división entera es justo lo que queremos.",
              variables: [
                { name: "total", value: "17" },
                { name: "ninos", value: "5" },
                { name: "cada", value: "3" },
              ],
            },
            {
              line: 3,
              explanation:
                "El resto dice cuántos quedan sin repartir: 17 menos los 15 repartidos son 2.",
              variables: [
                { name: "total", value: "17" },
                { name: "ninos", value: "5" },
                { name: "cada", value: "3" },
                { name: "sobran", value: "2" },
              ],
            },
            {
              line: 4,
              explanation: "Se escriben los dos resultados separados por un espacio.",
              variables: [
                { name: "cada", value: "3" },
                { name: "sobran", value: "2" },
              ],
              output: "3 2",
            },
          ],
        },
        {
          type: "heading",
          text: "Sumar uno",
        },
        {
          type: "paragraph",
          text: "Incrementar una variable es tan frecuente que existe una forma abreviada. Estas tres líneas hacen exactamente lo mismo:",
        },
        {
          type: "code",
          caption: "incremento.cpp",
          code: "contador = contador + 1;\ncontador += 1;\ncontador++;",
        },
        {
          type: "callout",
          variant: "tip",
          title: "También existen -=, *= y /=",
          text: "Funcionan igual: total *= 2 multiplica total por dos y guarda el resultado en la misma variable. Son atajos de escritura, no operaciones distintas.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "aritmetica-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "cout << 7 / 2;",
            options: [
              { id: "a", text: "3" },
              { id: "b", text: "3.5" },
              { id: "c", text: "4" },
            ],
            correctOptionId: "a",
            explanation:
              "Dos enteros dan un entero: el .5 se descarta, no se redondea. Por eso no sale 4.",
          },
          {
            id: "aritmetica-2",
            kind: "predict-output",
            prompt: "¿Qué vale 23 % 10?",
            code: "cout << 23 % 10;",
            options: [
              { id: "a", text: "3" },
              { id: "b", text: "2" },
              { id: "c", text: "2.3" },
            ],
            correctOptionId: "a",
            explanation:
              "23 son dos veces 10 y sobran 3. El resto de dividir entre 10 es siempre la última cifra.",
          },
          {
            id: "aritmetica-3",
            kind: "spot-error",
            prompt:
              "Este programa debería calcular la media de 7 y 8, que es 7.5, pero escribe 7. ¿Por qué?",
            code: "int a = 7, b = 8;\ncout << (a + b) / 2;",
            options: [
              { id: "a", text: "Los tres valores son enteros, así que la división descarta el .5." },
              { id: "b", text: "Los paréntesis están mal colocados." },
              { id: "c", text: "Habría que usar % en lugar de /." },
            ],
            correctOptionId: "a",
            explanation:
              "15 / 2 da 7 en aritmética entera. Dividiendo entre 2.0 el resultado sería 7.5.",
          },
          {
            id: "aritmetica-4",
            kind: "what-does-it-do",
            prompt: "¿Qué comprueba la expresión n % 2 == 0?",
            options: [
              { id: "a", text: "Si n es par." },
              { id: "b", text: "Si n es igual a 2." },
              { id: "c", text: "Si n se puede dividir entre 0." },
            ],
            correctOptionId: "a",
            explanation:
              "Un número es par exactamente cuando al dividirlo entre 2 no sobra nada. Es el modismo estándar para comprobarlo.",
          },
          {
            id: "aritmetica-5",
            kind: "apply",
            prompt:
              "Tienes 100 segundos y quieres saber cuántos minutos completos son y cuántos segundos sobran. ¿Qué usas?",
            options: [
              { id: "a", text: "100 / 60 para los minutos y 100 % 60 para los segundos." },
              { id: "b", text: "100 / 60 para los minutos y 100 / 60 otra vez para los segundos." },
              { id: "c", text: "100 % 60 para los minutos y 100 / 60 para los segundos." },
            ],
            correctOptionId: "a",
            explanation:
              "La división entera da las veces completas que cabe el 60; el resto, lo que queda sin completar un minuto.",
          },
          {
            id: "aritmetica-6",
            kind: "concept",
            prompt: "¿Qué hacen contador += 1; y contador++;?",
            options: [
              { id: "a", text: "Lo mismo: aumentar contador en uno." },
              { id: "b", text: "La primera suma uno y la segunda suma dos." },
              { id: "c", text: "La primera modifica la variable y la segunda solo calcula." },
            ],
            correctOptionId: "a",
            explanation:
              "Las dos son abreviaturas de contador = contador + 1. Cambia la forma de escribirlo, no el efecto.",
          },
        ],
      },
      challenge: {
        id: "aritmetica-desafio",
        title: "Reparto de caramelos",
        statement: [
          {
            type: "paragraph",
            text: "Un problema donde la división entera no es un inconveniente, sino exactamente lo que necesitas: los caramelos no se parten por la mitad.",
          },
        ],
        instructions: [
          "Lee dos enteros: el número de caramelos y el número de niños.",
          "Calcula cuántos caramelos completos recibe cada niño.",
          "Calcula cuántos caramelos sobran sin repartir.",
          "Muestra los dos valores separados por un espacio, en esa misma línea.",
        ],
        requirements: [
          "Usa la división entera y el resto: no conviertas nada a decimales.",
          "Los dos números van en una sola línea, separados por un único espacio.",
        ],
        examples: [
          {
            input: "17 5",
            output: "3 2",
            explanation: "Cada niño recibe 3 caramelos y sobran 2 sin repartir.",
          },
          {
            input: "20 4",
            output: "5 0",
            explanation: "El reparto es exacto, así que no sobra ninguno.",
          },
        ],
        hints: [
          "Los caramelos por niño son una división entera: total / ninos.",
          "Los que sobran son el resto: total % ninos.",
          'Para separar con espacio: cout << cada << " " << sobran << endl;',
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  // 1. Lee los caramelos y los niños\n\n  // 2. Calcula cuántos toca a cada uno\n\n  // 3. Calcula cuántos sobran\n\n  // 4. Escribe ambos separados por un espacio\n\n  return 0;\n}",
      },
    },
    {
      slug: "comparacion",
      title: "Comparar valores",
      kind: "theory",
      estimatedMinutes: 8,
      summary:
        "Los operadores que responden sí o no, y el error de escribir = donde debía ir ==.",
      blocks: [
        {
          type: "paragraph",
          text: "Una comparación no calcula un número: responde a una pregunta con un sí o un no. En C++ ese resultado es un bool, y ya sabes que solo puede valer true o false.",
        },
        {
          type: "code",
          caption: "comparaciones.cpp",
          code: "int a = 5, b = 8;\ncout << (a < b) << endl;\ncout << (a > b) << endl;\ncout << (a == b) << endl;\ncout << (a != b) << endl;",
          output: "1\n0\n0\n1",
        },
        {
          type: "callout",
          variant: "key",
          title: "true se escribe como 1",
          text: "Al mostrarlo por pantalla, true aparece como 1 y false como 0. No es que sean números: es cómo cout los representa por defecto.",
        },
        {
          type: "heading",
          text: "Los seis operadores",
        },
        {
          type: "list",
          items: [
            "a == b comprueba si son iguales.",
            "a != b comprueba si son distintos.",
            "a < b y a > b, menor y mayor.",
            "a <= b y a >= b, menor o igual y mayor o igual.",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Un = no es lo mismo que dos",
          text: "El error más clásico de todos: a = b asigna, le da a la variable a el valor de b. a == b compara. Escribir uno donde iba el otro no siempre da error de compilación, y entonces el programa hace algo distinto de lo que querías.",
        },
        {
          type: "code",
          caption: "el_error_clasico.cpp",
          code: "int a = 5;\nint b = 8;\n\n// Compara: deja a valiendo 5\ncout << (a == b) << endl;\n\n// Asigna: ¡ahora a vale 8!\ncout << (a = b) << endl;\ncout << a << endl;",
          output: "0\n8\n8",
        },
        {
          type: "paragraph",
          text: "La segunda línea no comparó nada: cambió el valor de a y escribió el resultado de la asignación. Si eso ocurre dentro de una condición, el programa toma decisiones equivocadas sin avisar.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Cuidado al comparar decimales",
          text: "Como un double guarda aproximaciones, comparar dos decimales con == puede fallar aunque parezcan iguales. Con enteros no hay problema: compáralos con == sin miedo.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "comparacion-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "int x = 4;\ncout << (x >= 4);",
            options: [
              { id: "a", text: "1" },
              { id: "b", text: "0" },
              { id: "c", text: "true" },
            ],
            correctOptionId: "a",
            explanation:
              "x es igual a 4, así que «mayor o igual» se cumple. El valor true se muestra como 1.",
          },
          {
            id: "comparacion-2",
            kind: "concept",
            prompt: "¿Qué diferencia hay entre = y ==?",
            options: [
              { id: "a", text: "= asigna un valor; == compara si dos valores son iguales." },
              { id: "b", text: "Son equivalentes, == es solo más explícito." },
              { id: "c", text: "= compara y == asigna." },
            ],
            correctOptionId: "a",
            explanation:
              "Confundirlos es el error más habitual al empezar, y el compilador no siempre lo detecta.",
          },
          {
            id: "comparacion-3",
            kind: "predict-output",
            prompt: "¿Qué escriben estas dos líneas?",
            code: "int a = 3;\nint b = 7;\ncout << (a = b) << endl;\ncout << a;",
            options: [
              { id: "a", text: "7 y después 7" },
              { id: "b", text: "0 y después 3" },
              { id: "c", text: "1 y después 3" },
            ],
            correctOptionId: "a",
            explanation:
              "No es una comparación: a = b asigna 7 a la variable a, y ese 7 es lo que se escribe. Después a sigue valiendo 7.",
          },
          {
            id: "comparacion-4",
            kind: "what-does-it-do",
            prompt: "¿Qué tipo de valor produce la expresión a != b?",
            options: [
              { id: "a", text: "Un bool: true o false." },
              { id: "b", text: "Un int con la diferencia entre a y b." },
              { id: "c", text: "Un texto con el resultado." },
            ],
            correctOptionId: "a",
            explanation:
              "Todas las comparaciones producen un bool, aunque al mostrarlas se vean como 1 y 0.",
          },
          {
            id: "comparacion-5",
            kind: "apply",
            prompt: "Quieres comprobar si un número n está entre 1 y 10, ambos incluidos. ¿Cuál lo hace?",
            options: [
              { id: "a", text: "n >= 1 y por otro lado n <= 10" },
              { id: "b", text: "n > 1 y por otro lado n < 10" },
              { id: "c", text: "n == 1 hasta 10" },
            ],
            correctOptionId: "a",
            explanation:
              "«Ambos incluidos» obliga a usar >= y <=. Con > y < quedarían fuera el 1 y el 10.",
          },
          {
            id: "comparacion-6",
            kind: "spot-error",
            prompt: "¿Por qué conviene evitar comparar dos double con ==?",
            options: [
              {
                id: "a",
                text: "Porque guardan aproximaciones y dos valores que parecen iguales pueden no serlo.",
              },
              { id: "b", text: "Porque == no funciona con decimales y da error." },
              { id: "c", text: "Porque los double siempre son distintos entre sí." },
            ],
            correctOptionId: "a",
            explanation:
              "Compila sin problema, pero 0.1 + 0.2 no es exactamente 0.3 y la comparación puede dar false.",
          },
        ],
      },
      challenge: null,
    },
    {
      slug: "operadores-logicos",
      title: "Combinar condiciones",
      kind: "theory",
      estimatedMinutes: 9,
      summary:
        "Unir varias comprobaciones en una sola con y, o y no, y entender por qué el orden importa.",
      blocks: [
        {
          type: "paragraph",
          text: "Muchas veces una sola comparación no basta. «El número está entre 1 y 10» son en realidad dos condiciones que deben cumplirse a la vez. Para eso están los operadores lógicos.",
        },
        {
          type: "list",
          items: [
            "&& significa «y»: el resultado es true solo si las dos condiciones lo son.",
            "|| significa «o»: basta con que una de las dos sea true.",
            "! significa «no»: invierte el valor, convierte true en false y al revés.",
          ],
        },
        {
          type: "code",
          caption: "logicos.cpp",
          code: "int n = 7;\ncout << (n >= 1 && n <= 10) << endl;\ncout << (n < 0 || n > 100) << endl;\ncout << !(n == 7) << endl;",
          output: "1\n0\n0",
        },
        {
          type: "paragraph",
          text: "La primera comprueba que 7 esté en el rango: las dos partes se cumplen, así que da true. La segunda pregunta si está fuera del rango 0-100: ninguna se cumple, da false. La tercera niega una condición verdadera y por eso da false.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "No se puede encadenar como en matemáticas",
          text: "En matemáticas escribes 1 <= n <= 10. En C++ eso compila y hace algo completamente distinto de lo que esperas. La forma correcta es n >= 1 && n <= 10, con la condición escrita entera a cada lado.",
        },
        {
          type: "heading",
          text: "La evaluación se detiene en cuanto puede",
        },
        {
          type: "paragraph",
          text: "Si la parte izquierda de un && ya es false, el resultado será false pase lo que pase, así que C++ ni siquiera mira la derecha. Con || ocurre lo simétrico: si la izquierda es true, se detiene ahí.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Esto te salvará de más de un fallo",
          text: "Ese comportamiento permite escribir comprobaciones como k != 0 && n % k == 0: si k es cero, la parte derecha no llega a evaluarse y evitas la división entre cero. El orden de las condiciones deja de ser un detalle estético.",
        },
        {
          type: "heading",
          text: "Negar bien",
        },
        {
          type: "paragraph",
          text: "Al negar una condición compuesta, no basta con poner un ! delante de cada parte. Lo contrario de «a y b» es «no a, o no b»: la conjunción también cambia.",
        },
        {
          type: "code",
          caption: "negar.cpp",
          code: "// «está en el rango»\nbool dentro = (n >= 1 && n <= 10);\n\n// «no está en el rango», de dos formas equivalentes\nbool fuera1 = !(n >= 1 && n <= 10);\nbool fuera2 = (n < 1 || n > 10);",
        },
      ],
      quiz: {
        questions: [
          {
            id: "logicos-1",
            kind: "predict-output",
            prompt: "Con n valiendo 5, ¿qué escribe esta línea?",
            code: "cout << (n > 0 && n < 3);",
            options: [
              { id: "a", text: "0" },
              { id: "b", text: "1" },
              { id: "c", text: "5" },
            ],
            correctOptionId: "a",
            explanation:
              "La primera condición se cumple pero la segunda no, y && exige las dos. El resultado es false, que se muestra como 0.",
          },
          {
            id: "logicos-2",
            kind: "concept",
            prompt: "¿Cuándo es true una expresión con ||?",
            options: [
              { id: "a", text: "Cuando al menos una de las dos condiciones es true." },
              { id: "b", text: "Solo cuando las dos son true." },
              { id: "c", text: "Solo cuando las dos son false." },
            ],
            correctOptionId: "a",
            explanation:
              "Basta con una. Exigir las dos es lo que hace &&.",
          },
          {
            id: "logicos-3",
            kind: "spot-error",
            prompt: "¿Qué tiene de malo escribir la condición así?",
            code: "if (1 <= n <= 10)",
            options: [
              {
                id: "a",
                text: "C++ no encadena comparaciones: hay que escribir n >= 1 && n <= 10.",
              },
              { id: "b", text: "Falta un punto y coma dentro del if." },
              { id: "c", text: "Los números deberían ir a la derecha." },
            ],
            correctOptionId: "a",
            explanation:
              "Compila, pero compara el resultado de 1 <= n (un 0 o un 1) con 10, así que siempre se cumple. Es un fallo que no avisa.",
          },
          {
            id: "logicos-4",
            kind: "what-does-it-do",
            prompt: "¿Qué comprueba esta condición?",
            code: "k != 0 && n % k == 0",
            options: [
              { id: "a", text: "Que k no sea cero y que n sea múltiplo de k." },
              { id: "b", text: "Que n y k sean ambos distintos de cero." },
              { id: "c", text: "Que n dividido entre k dé cero." },
            ],
            correctOptionId: "a",
            explanation:
              "El orden es deliberado: si k fuese cero, la parte derecha ni se evalúa y se evita dividir entre cero.",
          },
          {
            id: "logicos-5",
            kind: "apply",
            prompt: "¿Cuál es la negación correcta de n >= 1 && n <= 10?",
            options: [
              { id: "a", text: "n < 1 || n > 10" },
              { id: "b", text: "n < 1 && n > 10" },
              { id: "c", text: "n <= 1 || n >= 10" },
            ],
            correctOptionId: "a",
            explanation:
              "Al negar, cada comparación se invierte y el && se convierte en ||. La opción b no se cumple nunca.",
          },
          {
            id: "logicos-6",
            kind: "concept",
            prompt:
              "En la expresión a || b, si a resulta ser true, ¿qué pasa con b?",
            options: [
              { id: "a", text: "No se evalúa: el resultado ya está decidido." },
              { id: "b", text: "Se evalúa igualmente para comprobarlo." },
              { id: "c", text: "Da error si b no está definida." },
            ],
            correctOptionId: "a",
            explanation:
              "Con || basta un true para que el total sea true, así que la evaluación se detiene ahí.",
          },
        ],
      },
      challenge: {
        id: "logicos-desafio",
        title: "¿Está en el rango?",
        statement: [
          {
            type: "paragraph",
            text: "Todavía no sabes escribir un if, pero ya puedes calcular una condición y mostrar su resultado: recuerda que un bool se escribe como 1 si es cierto y como 0 si no lo es.",
          },
        ],
        instructions: [
          "Lee tres enteros: primero un número n, después el extremo inferior y el superior de un rango.",
          "Calcula si n está dentro del rango, incluidos ambos extremos.",
          "Muestra 1 si está dentro y 0 si no lo está.",
        ],
        requirements: [
          "Combina las dos comparaciones con &&.",
          "No escribas texto: solo el 1 o el 0.",
        ],
        examples: [
          {
            input: "7 1 10",
            output: "1",
            explanation: "El 7 está entre 1 y 10, así que la condición se cumple.",
          },
          {
            input: "15 1 10",
            output: "0",
            explanation: "El 15 se sale por arriba del rango.",
          },
          {
            input: "10 1 10",
            output: "1",
            explanation:
              "Los extremos cuentan como dentro, y por eso hacen falta >= y <= en lugar de > y <.",
          },
        ],
        hints: [
          "Lee las tres variables: cin >> n >> bajo >> alto;",
          "La condición es n >= bajo && n <= alto.",
          "Puedes escribirla directamente: cout << (n >= bajo && n <= alto) << endl;",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  // 1. Lee el número y los dos extremos del rango\n\n  // 2. Comprueba si está dentro, extremos incluidos\n\n  // 3. Escribe 1 o 0\n\n  return 0;\n}",
      },
    },
    {
      slug: "quiz-operadores",
      title: "Repaso del módulo",
      kind: "quiz",
      estimatedMinutes: 6,
      summary:
        "Seis preguntas sobre aritmética entera, comparaciones y condiciones combinadas.",
      blocks: [
        {
          type: "heading",
          text: "Lo que has visto en este módulo",
        },
        {
          type: "list",
          items: [
            "Que dividir dos enteros descarta los decimales, y cómo evitarlo cuando no te conviene.",
            "El operador % y para qué sirve: paridad, última cifra, múltiplos.",
            "Las seis comparaciones y la diferencia entre = y ==.",
            "Combinar condiciones con &&, || y !, sin encadenar como en matemáticas.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Los dos fallos que no avisan",
          text: "La división entera donde querías decimales, y un = donde debía ir ==. Los dos compilan, los dos dan resultados incorrectos y ninguno produce un mensaje de error. Cuando un resultado no cuadre, míralos primero.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "op-repaso-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "cout << 9 / 4 << \" \" << 9 % 4;",
            options: [
              { id: "a", text: "2 1" },
              { id: "b", text: "2.25 1" },
              { id: "c", text: "2 2.25" },
            ],
            correctOptionId: "a",
            explanation: "9 entre 4 son 2 veces completas y sobra 1.",
          },
          {
            id: "op-repaso-2",
            kind: "apply",
            prompt: "¿Cómo compruebas si un número n es múltiplo de 3?",
            options: [
              { id: "a", text: "n % 3 == 0" },
              { id: "b", text: "n / 3 == 0" },
              { id: "c", text: "n % 3 != 0" },
            ],
            correctOptionId: "a",
            explanation:
              "Ser múltiplo significa que la división es exacta, es decir, que no sobra nada.",
          },
          {
            id: "op-repaso-3",
            kind: "predict-output",
            prompt: "Con a valiendo 4 y b valiendo 4, ¿qué escribe esta línea?",
            code: "cout << (a == b) << (a != b);",
            options: [
              { id: "a", text: "10" },
              { id: "b", text: "01" },
              { id: "c", text: "11" },
            ],
            correctOptionId: "a",
            explanation:
              "Son iguales, así que la primera da 1 y la segunda 0. Al no haber separador, salen pegados.",
          },
          {
            id: "op-repaso-4",
            kind: "spot-error",
            prompt: "Este cálculo de la media da 7 en lugar de 7.5. ¿Qué hay que cambiar?",
            code: "int a = 7, b = 8;\ndouble media = (a + b) / 2;",
            options: [
              { id: "a", text: "Dividir entre 2.0 para que la operación conserve decimales." },
              { id: "b", text: "Declarar media como int." },
              { id: "c", text: "Quitar los paréntesis." },
            ],
            correctOptionId: "a",
            explanation:
              "La división ocurre entre enteros antes de guardarse, así que el .5 ya se ha perdido cuando llega al double.",
          },
          {
            id: "op-repaso-5",
            kind: "what-does-it-do",
            prompt: "¿Qué obtienes con n % 10 y con n / 10?",
            options: [
              { id: "a", text: "La última cifra de n, y n sin su última cifra." },
              { id: "b", text: "Las dos cosas dan la última cifra." },
              { id: "c", text: "El número de cifras de n, y su primera cifra." },
            ],
            correctOptionId: "a",
            explanation:
              "Con 237: 237 % 10 da 7 y 237 / 10 da 23. Repitiendo ese par se recorren todas las cifras.",
          },
          {
            id: "op-repaso-6",
            kind: "apply",
            prompt:
              "Quieres comprobar que n es par y además mayor que 100. ¿Cuál es la condición?",
            options: [
              { id: "a", text: "n % 2 == 0 && n > 100" },
              { id: "b", text: "n % 2 == 0 || n > 100" },
              { id: "c", text: "n % 2 > 100" },
            ],
            correctOptionId: "a",
            explanation:
              "Las dos cosas a la vez piden &&. Con || bastaría con cumplir una, que no es lo pedido.",
          },
        ],
      },
      challenge: null,
    },
  ],
};
