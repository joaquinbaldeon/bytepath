import type { Module } from "@/lib/courses/types";

/**
 * Módulo 5 — Bucles.
 *
 * La tercera lección no introduce sintaxis nueva: enseña los tres patrones de
 * acumulación (sumar, contar, quedarse con el mejor) que resuelven la mayoría
 * de los problemas de iniciación. Separarlos de la mecánica del for es
 * deliberado: lo que cuesta no es escribir el bucle, sino saber qué poner
 * dentro.
 */
export const bucles: Module = {
  slug: "bucles",
  title: "Bucles",
  summary: "Repetir trabajo sin repetir código, y los patrones que resuelven problemas.",
  lessons: [
    {
      slug: "bucle-for",
      title: "El bucle for",
      kind: "theory",
      estimatedMinutes: 11,
      summary:
        "Repetir un bloque un número conocido de veces, con un contador que tú controlas.",
      blocks: [
        {
          type: "paragraph",
          text: "Escribir cien veces la misma línea no es una opción. Un bucle ejecuta un bloque de código varias veces, y el for es el que se usa cuando sabes de antemano cuántas.",
        },
        {
          type: "code",
          caption: "primer_for.cpp",
          code: "for (int i = 1; i <= 5; i++) {\n  cout << i << endl;\n}",
          output: "1\n2\n3\n4\n5",
        },
        {
          type: "heading",
          text: "Las tres partes del paréntesis",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "int i = 1 se ejecuta una sola vez, al principio: crea el contador.",
            "i <= 5 se comprueba antes de cada vuelta. Si es falsa, el bucle termina.",
            "i++ se ejecuta al final de cada vuelta: avanza el contador.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Están separadas por punto y coma, no por comas",
          text: "Las tres partes van dentro del mismo paréntesis y se separan con punto y coma. Es la única estructura de C++ donde verás puntos y coma dentro de unos paréntesis.",
        },
        {
          type: "trace",
          title: "Sigue el contador vuelta a vuelta",
          code: "for (int i = 1; i <= 3; i++) {\n  cout << i << \" \";\n}",
          steps: [
            {
              line: 1,
              explanation: "Se crea i con el valor 1 y se comprueba: 1 <= 3 es cierto, así que se entra.",
              variables: [{ name: "i", value: "1" }],
            },
            {
              line: 2,
              explanation: "Se escribe el 1 seguido de un espacio.",
              variables: [{ name: "i", value: "1" }],
              output: "1 ",
            },
            {
              line: 1,
              explanation: "i pasa a valer 2 y se vuelve a comprobar: 2 <= 3 es cierto.",
              variables: [{ name: "i", value: "2" }],
            },
            {
              line: 2,
              explanation: "Se escribe el 2.",
              variables: [{ name: "i", value: "2" }],
              output: "1 2 ",
            },
            {
              line: 1,
              explanation: "i pasa a 3, que todavía cumple la condición.",
              variables: [{ name: "i", value: "3" }],
            },
            {
              line: 2,
              explanation: "Se escribe el 3.",
              variables: [{ name: "i", value: "3" }],
              output: "1 2 3 ",
            },
            {
              line: 1,
              explanation:
                "i pasa a 4 y 4 <= 3 es falso: el bucle termina y la ejecución continúa después de las llaves.",
              variables: [{ name: "i", value: "4" }],
              output: "1 2 3 ",
            },
          ],
        },
        {
          type: "heading",
          text: "Empezar en 0 o en 1",
        },
        {
          type: "paragraph",
          text: "Las dos formas son correctas y ambas dan cinco vueltas. Lo importante es que la condición acompañe al inicio: si empiezas en 0, usa < n; si empiezas en 1, usa <= n.",
        },
        {
          type: "code",
          caption: "dos_formas.cpp",
          code: "// cinco vueltas: 0, 1, 2, 3, 4\nfor (int i = 0; i < 5; i++) { }\n\n// cinco vueltas: 1, 2, 3, 4, 5\nfor (int i = 1; i <= 5; i++) { }",
        },
        {
          type: "callout",
          variant: "warning",
          title: "El error de una vuelta de más o de menos",
          text: "Mezclar las dos formas —empezar en 0 y usar <=— da una vuelta de más. Es tan frecuente que tiene nombre propio en inglés: off-by-one. Cuando un bucle cuente mal, mira primero ahí.",
        },
        {
          type: "heading",
          text: "Bucles dentro de bucles",
        },
        {
          type: "paragraph",
          text: "El cuerpo de un for puede contener otro for. El interior completa todas sus vueltas por cada vuelta del exterior.",
        },
        {
          type: "code",
          caption: "anidados.cpp",
          code: 'for (int i = 1; i <= 2; i++) {\n  for (int j = 1; j <= 3; j++) {\n    cout << i << j << " ";\n  }\n}',
          output: "11 12 13 21 22 23",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Cuidado con el coste",
          text: "Dos bucles anidados sobre n elementos hacen n × n operaciones. Con n igual a mil son un millón, que se ejecuta en un instante; con n igual a un millón son un billón, y eso no entra en ningún límite de tiempo. Al anidar bucles, piensa siempre cuántas vueltas dan en total.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "for-1",
            kind: "predict-output",
            prompt: "¿Cuántas líneas escribe este bucle?",
            code: "for (int i = 0; i < 4; i++) {\n  cout << i << endl;\n}",
            options: [
              { id: "a", text: "Cuatro: 0, 1, 2 y 3." },
              { id: "b", text: "Cinco: del 0 al 4." },
              { id: "c", text: "Tres: 1, 2 y 3." },
            ],
            correctOptionId: "a",
            explanation:
              "Empieza en 0 y la condición es estrictamente menor que 4, así que el 4 ya no entra.",
          },
          {
            id: "for-2",
            kind: "concept",
            prompt: "¿Cuándo se ejecuta la parte i++ de un for?",
            options: [
              { id: "a", text: "Al final de cada vuelta, antes de volver a comprobar la condición." },
              { id: "b", text: "Una sola vez, al empezar el bucle." },
              { id: "c", text: "Antes de ejecutar el cuerpo en cada vuelta." },
            ],
            correctOptionId: "a",
            explanation:
              "El orden es: comprobar, ejecutar el cuerpo, incrementar, y volver a comprobar.",
          },
          {
            id: "for-3",
            kind: "spot-error",
            prompt: "Este bucle debería dar cinco vueltas pero da seis. ¿Por qué?",
            code: "for (int i = 0; i <= 5; i++) {\n  cout << i;\n}",
            options: [
              { id: "a", text: "Empieza en 0 y llega hasta 5 incluido: son seis valores." },
              { id: "b", text: "El incremento debería ser i--." },
              { id: "c", text: "Falta declarar i fuera del bucle." },
            ],
            correctOptionId: "a",
            explanation:
              "Empezando en 0 hay que usar i < 5. Mezclar el inicio en 0 con <= es el off-by-one clásico.",
          },
          {
            id: "for-4",
            kind: "predict-output",
            prompt: "¿Qué escribe este bucle?",
            code: 'for (int i = 3; i >= 1; i--) {\n  cout << i << " ";\n}',
            options: [
              { id: "a", text: "3 2 1" },
              { id: "b", text: "1 2 3" },
              { id: "c", text: "No escribe nada." },
            ],
            correctOptionId: "a",
            explanation:
              "El contador puede decrecer: empieza en 3, baja de uno en uno y para cuando deja de ser mayor o igual que 1.",
          },
          {
            id: "for-5",
            kind: "what-does-it-do",
            prompt: "¿Cuántas veces se ejecuta el cout de este fragmento?",
            code: "for (int i = 0; i < 3; i++) {\n  for (int j = 0; j < 4; j++) {\n    cout << \"x\";\n  }\n}",
            options: [
              { id: "a", text: "Doce veces." },
              { id: "b", text: "Siete veces." },
              { id: "c", text: "Cuatro veces." },
            ],
            correctOptionId: "a",
            explanation:
              "El bucle interior da cuatro vueltas por cada una de las tres del exterior: 3 × 4.",
          },
          {
            id: "for-6",
            kind: "apply",
            prompt: "Quieres recorrer los números del 1 al n, ambos incluidos. ¿Cuál lo hace?",
            options: [
              { id: "a", text: "for (int i = 1; i <= n; i++)" },
              { id: "b", text: "for (int i = 1; i < n; i++)" },
              { id: "c", text: "for (int i = 0; i <= n; i++)" },
            ],
            correctOptionId: "a",
            explanation:
              "La b se deja el n fuera y la c añade un 0 que no pedías. Inicio y condición tienen que encajar.",
          },
        ],
      },
      challenge: {
        id: "for-desafio",
        title: "Suma del 1 al N",
        statement: [
          {
            type: "paragraph",
            text: "El ejercicio de bucles por excelencia: acumular un total a lo largo de las vueltas. Fíjate en que la variable donde sumas tiene que existir antes de empezar el bucle.",
          },
        ],
        instructions: [
          "Lee un número entero n de la entrada.",
          "Suma todos los enteros desde 1 hasta n, ambos incluidos.",
          "Escribe el resultado.",
        ],
        requirements: [
          "Resuélvelo con un bucle, recorriendo los números uno a uno.",
          "La variable donde acumulas debe empezar en 0 y declararse antes del bucle.",
        ],
        examples: [
          { input: "5", output: "15", explanation: "1 + 2 + 3 + 4 + 5 son 15." },
          { input: "1", output: "1", explanation: "Con n igual a 1, el bucle da una sola vuelta." },
          {
            input: "100",
            output: "5050",
            explanation: "Cien vueltas para el programa, un instante para el ordenador.",
          },
        ],
        hints: [
          "Declara el acumulador antes del bucle e inicialízalo a 0: int suma = 0;",
          "El bucle recorre de 1 a n: for (int i = 1; i <= n; i++)",
          "Dentro del bucle, acumula: suma += i;",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  // 1. Declara el acumulador\n\n  // 2. Recorre del 1 al n sumando\n\n  // 3. Escribe el total\n\n  return 0;\n}",
      },
    },
    {
      slug: "bucle-while",
      title: "El bucle while",
      kind: "theory",
      estimatedMinutes: 9,
      summary:
        "Repetir mientras se cumpla una condición, cuando no sabes cuántas vueltas harán falta.",
      blocks: [
        {
          type: "paragraph",
          text: "El for encaja cuando conoces el número de vueltas. Pero a veces no lo sabes: «divide el número entre 10 hasta que no queden cifras» depende del número que te den. Para eso está while.",
        },
        {
          type: "code",
          caption: "while.cpp",
          code: "int n = 5;\n\nwhile (n > 0) {\n  cout << n << \" \";\n  n--;\n}",
          output: "5 4 3 2 1",
        },
        {
          type: "paragraph",
          text: "La condición se comprueba antes de cada vuelta. Mientras sea cierta, el cuerpo se repite; en cuanto deja de serlo, el bucle termina.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Algo tiene que cambiar dentro",
          text: "Si el cuerpo del bucle no modifica nada de lo que aparece en la condición, esta será cierta para siempre y el programa no terminará nunca. En un juez, eso es un veredicto de tiempo excedido. En la lección de arriba, quien hace avanzar las cosas es el n--.",
        },
        {
          type: "heading",
          text: "Un uso muy habitual: recorrer las cifras",
        },
        {
          type: "paragraph",
          text: "Ya viste que n % 10 da la última cifra y n / 10 la quita. Combinando ambas en un while se recorre un número entero cifra a cifra, sin saber de antemano cuántas tiene.",
        },
        {
          type: "code",
          caption: "cifras.cpp",
          code: "int n = 237;\nint cifras = 0;\n\nwhile (n > 0) {\n  cifras++;\n  n = n / 10;\n}\n\ncout << cifras << endl;",
          output: "3",
        },
        {
          type: "trace",
          title: "Cómo se deshace el 237",
          code: "while (n > 0) {\n  cifras++;\n  n = n / 10;\n}",
          steps: [
            {
              line: 1,
              explanation: "n vale 237 y es mayor que 0, así que se entra al bucle.",
              variables: [
                { name: "n", value: "237" },
                { name: "cifras", value: "0" },
              ],
            },
            {
              line: 3,
              explanation: "Se cuenta una cifra y se descarta la última: 237 / 10 da 23.",
              variables: [
                { name: "n", value: "23" },
                { name: "cifras", value: "1" },
              ],
            },
            {
              line: 3,
              explanation: "Segunda vuelta: 23 / 10 da 2.",
              variables: [
                { name: "n", value: "2" },
                { name: "cifras", value: "2" },
              ],
            },
            {
              line: 3,
              explanation: "Tercera vuelta: 2 / 10 da 0, porque la división entera descarta el resto.",
              variables: [
                { name: "n", value: "0" },
                { name: "cifras", value: "3" },
              ],
            },
            {
              line: 1,
              explanation: "n ya no es mayor que 0: el bucle termina con tres cifras contadas.",
              variables: [
                { name: "n", value: "0" },
                { name: "cifras", value: "3" },
              ],
            },
          ],
        },
        {
          type: "heading",
          text: "for o while",
        },
        {
          type: "list",
          items: [
            "for: sabes cuántas vueltas, o recorres un rango conocido.",
            "while: repites mientras se cumpla algo, y el número de vueltas depende de los datos.",
            "Los dos pueden hacer lo mismo; se elige el que exprese mejor la intención.",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "break para salir antes",
          text: "Dentro de cualquier bucle, break lo termina de inmediato. Es útil cuando encuentras lo que buscabas y seguir recorriendo no aporta nada.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "while-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este bucle?",
            code: 'int n = 3;\nwhile (n > 0) {\n  cout << n;\n  n--;\n}',
            options: [
              { id: "a", text: "321" },
              { id: "b", text: "123" },
              { id: "c", text: "3210" },
            ],
            correctOptionId: "a",
            explanation:
              "Escribe antes de decrementar, y para cuando n llega a 0, así que el 0 no se escribe.",
          },
          {
            id: "while-2",
            kind: "spot-error",
            prompt: "¿Qué le pasa a este bucle?",
            code: "int n = 5;\nwhile (n > 0) {\n  cout << n;\n}",
            options: [
              { id: "a", text: "No termina nunca: n no cambia dentro del bucle." },
              { id: "b", text: "No entra nunca porque la condición es falsa." },
              { id: "c", text: "Escribe el 5 una sola vez." },
            ],
            correctOptionId: "a",
            explanation:
              "La condición depende de n, y nada la modifica. En un juez, eso acaba en tiempo excedido.",
          },
          {
            id: "while-3",
            kind: "concept",
            prompt: "¿Cuándo se comprueba la condición de un while?",
            options: [
              { id: "a", text: "Antes de cada vuelta, incluida la primera." },
              { id: "b", text: "Solo al final de cada vuelta." },
              { id: "c", text: "Una sola vez, al empezar." },
            ],
            correctOptionId: "a",
            explanation:
              "Por eso, si la condición es falsa desde el principio, el cuerpo no se ejecuta ni una vez.",
          },
          {
            id: "while-4",
            kind: "predict-output",
            prompt: "Con n valiendo 1234, ¿qué valor tiene cifras al terminar?",
            code: "int cifras = 0;\nwhile (n > 0) {\n  cifras++;\n  n /= 10;\n}",
            options: [
              { id: "a", text: "4" },
              { id: "b", text: "3" },
              { id: "c", text: "1234" },
            ],
            correctOptionId: "a",
            explanation:
              "Cada vuelta quita una cifra: 1234, 123, 12, 1 y finalmente 0. Son cuatro vueltas.",
          },
          {
            id: "while-5",
            kind: "apply",
            prompt:
              "Tienes que repetir algo hasta que el usuario introduzca un 0, sin saber cuántos números mandará. ¿Qué usas?",
            options: [
              { id: "a", text: "while, porque el número de vueltas depende de los datos." },
              { id: "b", text: "for, poniendo un número de vueltas muy grande." },
              { id: "c", text: "switch, con un case por cada valor posible." },
            ],
            correctOptionId: "a",
            explanation:
              "Es exactamente el caso del while: repetir mientras se cumpla una condición que no conoces de antemano.",
          },
          {
            id: "while-6",
            kind: "what-does-it-do",
            prompt: "¿Qué hace break dentro de un bucle?",
            options: [
              { id: "a", text: "Termina el bucle inmediatamente y sigue después de él." },
              { id: "b", text: "Salta a la vuelta siguiente sin terminar la actual." },
              { id: "c", text: "Termina el programa entero." },
            ],
            correctOptionId: "a",
            explanation:
              "Lo que salta a la vuelta siguiente es continue. break sale del bucle del todo.",
          },
        ],
      },
      challenge: {
        id: "while-desafio",
        title: "Cuenta las cifras",
        statement: [
          {
            type: "paragraph",
            text: "Un problema donde no sabes cuántas vueltas hará falta dar: depende del número que te den. Es el caso natural del while.",
          },
        ],
        instructions: [
          "Lee un número entero positivo.",
          "Cuenta cuántas cifras tiene.",
          "Escribe ese número de cifras.",
        ],
        requirements: [
          "Resuélvelo con un bucle que vaya quitando cifras, no midiendo el número como texto.",
          "El número de entrada será siempre mayor que 0.",
        ],
        examples: [
          { input: "237", output: "3", explanation: "El 237 tiene tres cifras." },
          { input: "5", output: "1", explanation: "Un número de una sola cifra da una vuelta." },
          { input: "1000000", output: "7", explanation: "Un uno seguido de seis ceros: siete cifras." },
        ],
        hints: [
          "Cada vuelta puedes quitar la última cifra con n = n / 10.",
          "El bucle continúa mientras quede algo: while (n > 0).",
          "Lleva la cuenta en una variable que empiece en 0 y aumente una vez por vuelta.",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  // 1. Un contador que empiece en 0\n\n  // 2. Un while que vaya quitando cifras\n\n  // 3. Escribe cuántas había\n\n  return 0;\n}",
      },
    },
    {
      slug: "acumuladores",
      title: "Patrones con bucles",
      kind: "theory",
      estimatedMinutes: 12,
      summary:
        "Sumar, contar y quedarse con el mayor: los tres esquemas que resuelven la mayoría de los problemas sencillos.",
      blocks: [
        {
          type: "paragraph",
          text: "Ya sabes escribir bucles. Lo que cuesta ahora no es la sintaxis, sino saber qué poner dentro. Casi todos los problemas de iniciación se resuelven con uno de estos tres esquemas, o con una combinación de ellos.",
        },
        {
          type: "heading",
          text: "Patrón 1: acumular un total",
        },
        {
          type: "paragraph",
          text: "Una variable fuera del bucle guarda el resultado parcial; dentro, cada elemento se le añade. La clave está en inicializarla bien: para sumar se empieza en 0, porque sumar 0 no cambia nada.",
        },
        {
          type: "code",
          caption: "sumar.cpp",
          code: "int n;\ncin >> n;\n\nlong long suma = 0;\nfor (int i = 0; i < n; i++) {\n  int x;\n  cin >> x;\n  suma += x;\n}\n\ncout << suma << endl;",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Por qué long long en el acumulador",
          text: "Cada número leído puede caber de sobra en un int y aun así desbordar el total. Si sumas cien mil números de hasta un millón, el resultado llega a 10^11. El acumulador casi siempre necesita más rango que los datos.",
        },
        {
          type: "heading",
          text: "Patrón 2: contar cuántos cumplen algo",
        },
        {
          type: "paragraph",
          text: "Igual que el anterior, pero en lugar de sumar el valor se suma uno cada vez que se cumple una condición.",
        },
        {
          type: "code",
          caption: "contar.cpp",
          code: "int pares = 0;\nfor (int i = 0; i < n; i++) {\n  int x;\n  cin >> x;\n  if (x % 2 == 0) {\n    pares++;\n  }\n}",
        },
        {
          type: "heading",
          text: "Patrón 3: quedarse con el mayor",
        },
        {
          type: "paragraph",
          text: "Se guarda el mejor candidato visto hasta el momento y se sustituye cuando aparece uno mejor. Aquí la inicialización es la parte delicada.",
        },
        {
          type: "code",
          caption: "maximo.cpp",
          code: "int n;\ncin >> n;\n\nint maximo;\ncin >> maximo;  // el primero es, de momento, el mayor\n\nfor (int i = 1; i < n; i++) {\n  int x;\n  cin >> x;\n  if (x > maximo) {\n    maximo = x;\n  }\n}\n\ncout << maximo << endl;",
        },
        {
          type: "callout",
          variant: "warning",
          title: "No inicialices el máximo a cero",
          text: "Es el error clásico: si todos los números son negativos, el máximo real es negativo y tu programa responderá 0, que no estaba en la lista. Empieza con el primer elemento, que siempre es un candidato válido. Para el mínimo, exactamente lo mismo.",
        },
        {
          type: "trace",
          title: "Buscar el máximo de 3, 9, 4",
          code: "int maximo = 3;  // el primero\nif (9 > maximo) maximo = 9;\nif (4 > maximo) maximo = 4;\ncout << maximo;",
          steps: [
            {
              line: 1,
              explanation: "Se toma el primer elemento como mejor candidato provisional.",
              variables: [{ name: "maximo", value: "3" }],
            },
            {
              line: 2,
              explanation: "Llega el 9, que es mayor que 3: pasa a ser el nuevo máximo.",
              variables: [{ name: "maximo", value: "9" }],
            },
            {
              line: 3,
              explanation: "Llega el 4, que no supera al 9: el máximo no cambia.",
              variables: [{ name: "maximo", value: "9" }],
            },
            {
              line: 4,
              explanation: "Al terminar, la variable guarda el mayor de todos los vistos.",
              variables: [{ name: "maximo", value: "9" }],
              output: "9",
            },
          ],
        },
        {
          type: "heading",
          text: "La forma de casi todos los problemas",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Leer cuántos datos vienen.",
            "Preparar las variables donde acumularás el resultado.",
            "Recorrer los datos, actualizando esas variables.",
            "Escribir la respuesta al terminar el bucle.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Esto ya es pensar como en competitiva",
          text: "Cuando leas un problema, pregúntate: ¿qué necesito recordar mientras recorro los datos? Esa respuesta es exactamente el conjunto de variables que debes declarar antes del bucle. Casi todo lo demás es mecánica.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "acum-1",
            kind: "concept",
            prompt: "¿Por qué el acumulador de una suma se inicializa a 0?",
            options: [
              { id: "a", text: "Porque sumar 0 no altera el resultado: es el punto de partida neutro." },
              { id: "b", text: "Porque C++ obliga a inicializar todo a 0." },
              { id: "c", text: "Porque así el bucle sabe cuándo terminar." },
            ],
            correctOptionId: "a",
            explanation:
              "Si se inicializara a otro valor, ese valor aparecería sumado de más en el total.",
          },
          {
            id: "acum-2",
            kind: "spot-error",
            prompt:
              "Este código busca el máximo pero falla cuando todos los números son negativos. ¿Por qué?",
            code: "int maximo = 0;\nfor (int i = 0; i < n; i++) {\n  int x;\n  cin >> x;\n  if (x > maximo) maximo = x;\n}",
            options: [
              { id: "a", text: "Con todos negativos, ninguno supera al 0 y se responde 0." },
              { id: "b", text: "El bucle debería empezar en 1." },
              { id: "c", text: "Habría que comparar con >= en lugar de >." },
            ],
            correctOptionId: "a",
            explanation:
              "El 0 no forma parte de los datos, así que no puede ser la respuesta. Hay que partir del primer elemento leído.",
          },
          {
            id: "acum-3",
            kind: "predict-output",
            prompt: "Con la entrada 4 seguida de 1 2 3 4, ¿qué escribe este programa?",
            code: "int n; cin >> n;\nint c = 0;\nfor (int i = 0; i < n; i++) {\n  int x; cin >> x;\n  if (x % 2 == 0) c++;\n}\ncout << c;",
            options: [
              { id: "a", text: "2" },
              { id: "b", text: "4" },
              { id: "c", text: "10" },
            ],
            correctOptionId: "a",
            explanation:
              "Cuenta cuántos son pares, no cuánto suman. Entre 1, 2, 3 y 4 hay dos pares.",
          },
          {
            id: "acum-4",
            kind: "apply",
            prompt:
              "Vas a sumar 100.000 números que pueden llegar a 1.000.000 cada uno. ¿De qué tipo declaras el acumulador?",
            options: [
              { id: "a", text: "long long, porque el total puede superar los 2000 millones." },
              { id: "b", text: "int, porque cada número cabe en un int." },
              { id: "c", text: "double, para tener más rango." },
            ],
            correctOptionId: "a",
            explanation:
              "El total puede llegar a 10^11. Que los datos quepan en int no significa que su suma también quepa.",
          },
          {
            id: "acum-5",
            kind: "what-does-it-do",
            prompt: "¿Qué pregunta te ayuda a decidir qué variables declarar antes de un bucle?",
            options: [
              { id: "a", text: "¿Qué necesito recordar mientras recorro los datos?" },
              { id: "b", text: "¿Cuántos datos hay en total?" },
              { id: "c", text: "¿Qué tipo tienen los datos de entrada?" },
            ],
            correctOptionId: "a",
            explanation:
              "Lo que hay que conservar de una vuelta a la siguiente es justo lo que debe vivir fuera del bucle.",
          },
          {
            id: "acum-6",
            kind: "concept",
            prompt: "¿Dónde debe declararse la variable donde acumulas?",
            options: [
              { id: "a", text: "Fuera del bucle, para que conserve su valor entre vueltas." },
              { id: "b", text: "Dentro del bucle, junto a los datos que lees." },
              { id: "c", text: "Da igual, el resultado es el mismo." },
            ],
            correctOptionId: "a",
            explanation:
              "Declarada dentro, se crearía de nuevo en cada vuelta y perdería todo lo acumulado.",
          },
        ],
      },
      challenge: {
        id: "acumuladores-desafio",
        title: "El mayor de la lista",
        statement: [
          {
            type: "paragraph",
            text: "Este es el formato de entrada más habitual que te vas a encontrar: primero cuántos datos vienen y después los datos. Fíjate bien en cómo inicializas el máximo.",
          },
        ],
        instructions: [
          "Lee un entero n: cuántos números vienen a continuación.",
          "Lee esos n números.",
          "Escribe el mayor de todos ellos.",
        ],
        requirements: [
          "Los números pueden ser negativos: no inicialices el máximo a 0.",
          "No necesitas guardar todos los números, solo el mayor visto hasta el momento.",
        ],
        examples: [
          {
            input: "5\n3 9 4 1 7",
            output: "9",
            explanation: "De los cinco números, el mayor es el 9.",
          },
          {
            input: "3\n-5 -2 -9",
            output: "-2",
            explanation:
              "Todos son negativos. Si hubieras partido de 0, tu programa habría respondido 0, que ni siquiera está en la lista.",
          },
        ],
        hints: [
          "Lee primero n, después el primer número y guárdalo como máximo provisional.",
          "El bucle recorre los n - 1 restantes, así que empieza en 1: for (int i = 1; i < n; i++)",
          "Dentro: si el nuevo número supera al máximo, sustitúyelo.",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  // 1. Lee el primero y tómalo como máximo provisional\n\n  // 2. Recorre los que faltan y actualiza el máximo\n\n  // 3. Escribe el mayor\n\n  return 0;\n}",
      },
    },
    {
      slug: "quiz-bucles",
      title: "Repaso del módulo",
      kind: "quiz",
      estimatedMinutes: 7,
      summary: "Seis preguntas sobre for, while y los patrones de acumulación.",
      blocks: [
        {
          type: "heading",
          text: "Lo que has visto en este módulo",
        },
        {
          type: "list",
          items: [
            "for cuando conoces las vueltas; while cuando dependen de los datos.",
            "El error de una vuelta de más al mezclar el inicio en 0 con la condición <=.",
            "Bucles anidados y su coste: n × n crece muy deprisa.",
            "Los tres patrones: acumular, contar y quedarse con el mejor.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Las dos preguntas que resuelven casi todo",
          text: "¿Qué necesito recordar entre vuelta y vuelta? y ¿con qué valor tiene que empezar? Si aciertas esas dos, el bucle prácticamente se escribe solo.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "bucles-repaso-1",
            kind: "predict-output",
            prompt: "¿Qué valor tiene suma al terminar?",
            code: "int suma = 0;\nfor (int i = 1; i <= 4; i++) {\n  suma += i;\n}",
            options: [
              { id: "a", text: "10" },
              { id: "b", text: "4" },
              { id: "c", text: "6" },
            ],
            correctOptionId: "a",
            explanation: "1 + 2 + 3 + 4 son 10, porque el 4 entra en el recorrido.",
          },
          {
            id: "bucles-repaso-2",
            kind: "spot-error",
            prompt: "¿Por qué este bucle no termina?",
            code: "int i = 0;\nwhile (i < 5) {\n  cout << i;\n}",
            options: [
              { id: "a", text: "Falta incrementar i dentro del bucle." },
              { id: "b", text: "La condición debería ser i <= 5." },
              { id: "c", text: "i debería declararse dentro del while." },
            ],
            correctOptionId: "a",
            explanation:
              "Nada cambia el valor de i, así que la condición sigue siendo cierta indefinidamente.",
          },
          {
            id: "bucles-repaso-3",
            kind: "concept",
            prompt: "¿Cuántas operaciones hacen dos bucles anidados sobre 1000 elementos cada uno?",
            options: [
              { id: "a", text: "Un millón." },
              { id: "b", text: "Dos mil." },
              { id: "c", text: "Mil." },
            ],
            correctOptionId: "a",
            explanation:
              "1000 × 1000. Entra de sobra en un segundo, pero con un millón de elementos el mismo código sería inviable.",
          },
          {
            id: "bucles-repaso-4",
            kind: "apply",
            prompt:
              "Quieres contar cuántos números de una lista son mayores que 100. ¿Qué patrón usas?",
            options: [
              { id: "a", text: "Un contador a 0 que aumenta cuando se cumple la condición." },
              { id: "b", text: "Un acumulador que suma los valores mayores que 100." },
              { id: "c", text: "Guardar el máximo e ir comparándolo." },
            ],
            correctOptionId: "a",
            explanation:
              "«Cuántos» es contar. La opción b respondería a «cuánto suman», que es otra pregunta.",
          },
          {
            id: "bucles-repaso-5",
            kind: "predict-output",
            prompt: "¿Cuántas veces se escribe la x?",
            code: 'for (int i = 0; i < 2; i++) {\n  for (int j = 0; j < 2; j++) {\n    cout << "x";\n  }\n}',
            options: [
              { id: "a", text: "Cuatro." },
              { id: "b", text: "Dos." },
              { id: "c", text: "Tres." },
            ],
            correctOptionId: "a",
            explanation: "Dos vueltas del interior por cada una de las dos del exterior.",
          },
          {
            id: "bucles-repaso-6",
            kind: "concept",
            prompt:
              "Al buscar el mínimo de una lista que puede contener números positivos y negativos, ¿con qué valor empiezas?",
            options: [
              { id: "a", text: "Con el primer elemento de la lista." },
              { id: "b", text: "Con 0." },
              { id: "c", text: "Con el número más grande que quepa en un int." },
            ],
            correctOptionId: "a",
            explanation:
              "El primer elemento siempre es un candidato válido. La opción c también funciona, pero partir del primero es más simple y no depende de recordar límites.",
          },
        ],
      },
      challenge: null,
    },
  ],
};
