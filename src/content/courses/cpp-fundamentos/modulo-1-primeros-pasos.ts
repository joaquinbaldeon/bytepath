import type { Module } from "@/lib/courses/types";

/**
 * Módulo 1 — Primeros pasos.
 *
 * Arranca sin dar nada por sabido: qué es un lenguaje compilado, cómo se ve un
 * programa, cómo se guarda un dato y qué tipo le corresponde. El primer desafío
 * llega en la segunda lección y es deliberadamente trivial: el objetivo es que
 * el estudiante vea el ciclo completo de escribir, ejecutar y aprobar cuanto
 * antes, no que resuelva algo difícil.
 */
export const primerosPasos: Module = {
  slug: "primeros-pasos",
  title: "Primeros pasos",
  summary: "Qué es C++, cómo se escribe un programa y cómo se guardan los datos.",
  lessons: [
    {
      slug: "que-es-cpp",
      title: "¿Qué es C++?",
      kind: "theory",
      estimatedMinutes: 6,
      summary:
        "Antes de escribir código, conviene saber qué tipo de lenguaje es C++ y por qué domina la programación competitiva.",
      blocks: [
        {
          type: "paragraph",
          text: "C++ es un lenguaje compilado: antes de ejecutarse, tu código se traduce a instrucciones que la máquina entiende directamente. Esa traducción previa es la razón de que los programas en C++ sean rápidos, y la rapidez es justo lo que necesitas cuando un problema te da un límite de tiempo.",
        },
        {
          type: "heading",
          text: "¿Por qué C++ en programación competitiva?",
        },
        {
          type: "list",
          items: [
            "Velocidad: el mismo algoritmo suele ejecutarse varias veces más rápido que en un lenguaje interpretado.",
            "La biblioteca estándar (STL) trae ya resueltas estructuras que usarás a diario: vector, map, set o colas de prioridad.",
            "Está disponible en prácticamente todos los jueces y concursos.",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "No necesitas dominar todo C++",
          text: "Para resolver problemas basta con una parte pequeña del lenguaje: variables, control de flujo, funciones y unas pocas estructuras de la STL. Eso es justo lo que verás en este curso.",
        },
        {
          type: "heading",
          text: "La forma de un programa",
        },
        {
          type: "paragraph",
          text: "Todo programa en C++ empieza a ejecutarse en una función llamada main. Este es el programa más corto que compila: no hace nada, pero es válido.",
        },
        {
          type: "code",
          caption: "programa_minimo.cpp",
          code: "int main() {\n  return 0;\n}",
        },
        {
          type: "paragraph",
          text: "El return 0 indica que el programa ha terminado correctamente. En la siguiente lección harás que este esqueleto muestre algo por pantalla.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Rápido no es lo mismo que suficiente",
          text: "Que C++ sea veloz no salva a un algoritmo con demasiadas operaciones. Si tu idea necesita mil millones de pasos, ningún lenguaje la va a meter en un segundo: hay que cambiar la idea, no el lenguaje.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "que-es-cpp-1",
            kind: "concept",
            prompt: "¿Qué significa que C++ sea un lenguaje compilado?",
            options: [
              {
                id: "a",
                text: "Que el código se traduce a instrucciones de máquina antes de ejecutarse.",
              },
              { id: "b", text: "Que cada línea se traduce mientras el programa se ejecuta." },
              { id: "c", text: "Que necesita una máquina virtual para funcionar." },
            ],
            correctOptionId: "a",
            explanation:
              "La traducción ocurre una sola vez, antes de ejecutar. Por eso no se paga ese coste durante la ejecución y el programa resulta rápido.",
          },
          {
            id: "que-es-cpp-2",
            kind: "concept",
            prompt: "¿Por qué C++ es tan habitual en programación competitiva?",
            options: [
              { id: "a", text: "Porque es el lenguaje más fácil de aprender." },
              {
                id: "b",
                text: "Porque se ejecuta rápido y su biblioteca estándar trae estructuras listas para usar.",
              },
              { id: "c", text: "Porque es el único lenguaje que aceptan los jueces." },
            ],
            correctOptionId: "b",
            explanation:
              "Los jueces suelen aceptar varios lenguajes; lo que inclina la balanza es la combinación de velocidad y una STL completa.",
          },
          {
            id: "que-es-cpp-3",
            kind: "what-does-it-do",
            prompt: "¿Qué hace este programa?",
            code: "int main() {\n  return 0;\n}",
            options: [
              { id: "a", text: "Nada visible, pero es un programa válido que termina bien." },
              { id: "b", text: "Da error de compilación porque falta un #include." },
              { id: "c", text: "Escribe un 0 por pantalla." },
            ],
            correctOptionId: "a",
            explanation:
              "No produce salida. El return 0 solo comunica al sistema que todo ha ido bien.",
          },
          {
            id: "que-es-cpp-4",
            kind: "spot-error",
            prompt:
              "Un compañero afirma: «Como C++ es muy rápido, cualquier solución escrita en C++ entra en el tiempo límite». ¿Dónde está el fallo?",
            options: [
              {
                id: "a",
                text: "La velocidad del lenguaje no compensa un algoritmo con demasiadas operaciones.",
              },
              { id: "b", text: "No hay fallo: el razonamiento es correcto." },
              { id: "c", text: "El fallo es que C++ en realidad no es rápido." },
            ],
            correctOptionId: "a",
            explanation:
              "El lenguaje te da un factor constante mejor, no un algoritmo mejor. Un enfoque demasiado costoso sigue siendo demasiado costoso.",
          },
          {
            id: "que-es-cpp-5",
            kind: "apply",
            prompt:
              "Vas a resolver un problema con un límite de 1 segundo y hasta un millón de datos. ¿Qué decisión encaja con lo que has visto?",
            options: [
              {
                id: "a",
                text: "Buscar un algoritmo que recorra los datos pocas veces, sin confiar solo en la velocidad del lenguaje.",
              },
              { id: "b", text: "Escribirlo en C++ y dar por hecho que entrará en tiempo." },
              { id: "c", text: "Comparar todos los pares de datos, que siempre es seguro." },
            ],
            correctOptionId: "a",
            explanation:
              "Comparar todos los pares de un millón de datos son billones de operaciones: imposible en un segundo, en C++ o en cualquier lenguaje.",
          },
          {
            id: "que-es-cpp-6",
            kind: "concept",
            prompt: "¿Qué parte de C++ necesitas para empezar a resolver problemas?",
            options: [
              { id: "a", text: "Todo el lenguaje, incluidas plantillas y herencia." },
              {
                id: "b",
                text: "Un subconjunto: variables, control de flujo, funciones y algunas estructuras de la STL.",
              },
              { id: "c", text: "Solo la biblioteca de entrada y salida." },
            ],
            correctOptionId: "b",
            explanation:
              "Con ese subconjunto se resuelve la inmensa mayoría de los problemas de iniciación.",
          },
        ],
      },
      // Lección conceptual: termina al completar el quiz.
      challenge: null,
    },
    {
      slug: "tu-primer-programa",
      title: "Tu primer programa",
      kind: "theory",
      estimatedMinutes: 8,
      summary: "Escribe un programa que muestre texto por pantalla y entiende cada línea.",
      blocks: [
        {
          type: "paragraph",
          text: "Para mostrar algo por pantalla necesitas la biblioteca de entrada y salida. Se incluye con una directiva al principio del archivo, antes de cualquier código.",
        },
        {
          type: "code",
          caption: "hola.cpp",
          code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hola, BytePath!" << endl;\n  return 0;\n}',
          output: "Hola, BytePath!",
        },
        {
          type: "heading",
          text: "Línea por línea",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "#include <iostream> trae las herramientas para leer y escribir por pantalla.",
            "using namespace std; permite escribir cout en lugar de std::cout.",
            "int main() es el punto de entrada: la ejecución empieza aquí.",
            "cout << envía lo que va a su derecha a la salida; endl hace un salto de línea.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "El operador <<",
          text: "Puedes encadenar varios << en la misma línea: cada uno añade algo a la salida, de izquierda a derecha. Así se combinan textos y valores en un mismo cout.",
        },
        {
          type: "heading",
          text: "Texto y valores",
        },
        {
          type: "paragraph",
          text: "Lo que va entre comillas se escribe tal cual; lo que no, se evalúa antes de escribirse. Es la diferencia entre mostrar una operación y mostrar su resultado.",
        },
        {
          type: "code",
          caption: "texto_y_valores.cpp",
          code: 'cout << "2 + 3" << endl;\ncout << 2 + 3 << endl;',
          output: "2 + 3\n5",
        },
        {
          type: "callout",
          variant: "warning",
          title: "El punto y coma no es opcional",
          text: "Cada instrucción termina en punto y coma. Olvidarlo es el error de compilación más frecuente al empezar, y el mensaje del compilador suele señalar la línea siguiente, no la que falta.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "primer-programa-1",
            kind: "concept",
            prompt: "¿Para qué sirve la línea #include <iostream>?",
            options: [
              { id: "a", text: "Para traer las herramientas de entrada y salida, como cout." },
              { id: "b", text: "Para indicar dónde empieza el programa." },
              { id: "c", text: "Para permitir escribir cout en lugar de std::cout." },
            ],
            correctOptionId: "a",
            explanation:
              "Quien marca el inicio del programa es main, y quien evita escribir std:: es using namespace std;.",
          },
          {
            id: "primer-programa-2",
            kind: "predict-output",
            prompt: "¿Qué escribe este programa por pantalla?",
            code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Byte" << "Path";\n  return 0;\n}',
            options: [
              { id: "a", text: "Byte Path" },
              { id: "b", text: "BytePath" },
              { id: "c", text: "Byte y Path en líneas distintas" },
            ],
            correctOptionId: "b",
            explanation:
              "Cada << añade el texto justo detrás del anterior. No se inserta ningún espacio ni salto de línea salvo que lo escribas tú.",
          },
          {
            id: "primer-programa-3",
            kind: "predict-output",
            prompt: "¿Qué muestra este fragmento?",
            code: 'cout << "2 + 3" << endl;\ncout << 2 + 3;',
            options: [
              { id: "a", text: "Primero 2 + 3 y, en la línea siguiente, 5." },
              { id: "b", text: "Primero 5 y, en la línea siguiente, 2 + 3." },
              { id: "c", text: "5 dos veces, en líneas distintas." },
            ],
            correctOptionId: "a",
            explanation:
              "Entre comillas es texto literal; sin comillas es una operación que se calcula antes de escribirse.",
          },
          {
            id: "primer-programa-4",
            kind: "spot-error",
            prompt: "Este programa no compila. ¿Por qué?",
            code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hola"\n  return 0;\n}',
            options: [
              { id: "a", text: "Falta el punto y coma al final de la línea del cout." },
              { id: "b", text: "Falta un endl después del texto." },
              { id: "c", text: "El texto debería ir entre comillas simples." },
            ],
            correctOptionId: "a",
            explanation:
              "Sin el punto y coma, el compilador cree que la instrucción continúa en la línea siguiente y se topa con return.",
          },
          {
            id: "primer-programa-5",
            kind: "what-does-it-do",
            prompt: "¿Qué consigue la línea using namespace std;?",
            options: [
              { id: "a", text: "Incluir la biblioteca de entrada y salida." },
              { id: "b", text: "Escribir cout, endl o string sin anteponer std::." },
              { id: "c", text: "Hacer que el programa se ejecute más rápido." },
            ],
            correctOptionId: "b",
            explanation:
              "Es comodidad de escritura: sin ella tendrías que poner std::cout y std::endl cada vez.",
          },
          {
            id: "primer-programa-6",
            kind: "apply",
            prompt:
              "Quieres escribir tu nombre y, en la línea siguiente, tu edad, usando las variables nombre y edad. ¿Cuál lo hace?",
            options: [
              { id: "a", text: "cout << nombre << endl << edad << endl;" },
              { id: "b", text: "cout << nombre << edad << endl;" },
              { id: "c", text: "cout << nombre, edad << endl;" },
            ],
            correctOptionId: "a",
            explanation:
              "El endl intermedio es el que separa las dos líneas. La opción b escribiría ambos valores pegados.",
          },
        ],
      },
      // Primer desafío del curso: trivial a propósito. Lo que se practica aquí
      // no es la dificultad, sino el ciclo de escribir, ejecutar y aprobar.
      challenge: {
        id: "primer-programa-desafio",
        title: "Tu carta de presentación",
        statement: [
          {
            type: "paragraph",
            text: "Tu primer programa completo. No tiene truco: se trata de que escribas el esqueleto entero, lo ejecutes y veas cómo se comprueba tu salida contra la esperada.",
          },
        ],
        instructions: [
          "Escribe un programa que muestre exactamente dos líneas.",
          "La primera línea debe ser: Hola, BytePath!",
          "La segunda línea debe ser: Hoy empiezo C++",
        ],
        requirements: [
          "El texto debe coincidir carácter a carácter, incluida la coma y el signo de exclamación.",
          "Cada mensaje en su propia línea.",
        ],
        examples: [
          {
            output: "Hola, BytePath!\nHoy empiezo C++",
            explanation: "Dos líneas de texto literal, en ese orden.",
          },
        ],
        hints: [
          "Empieza copiando el esqueleto de la lección: #include, using namespace std; y main.",
          'Para escribir texto se usan comillas dobles: cout << "Hola, BytePath!" << endl;',
          "Necesitas dos instrucciones cout, una por cada línea.",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  // Escribe aquí las dos líneas\n\n  return 0;\n}",
      },
    },
    {
      slug: "variables",
      title: "Variables",
      kind: "theory",
      estimatedMinutes: 10,
      summary: "Guarda valores en memoria, dales nombre y opera con ellos.",
      blocks: [
        {
          type: "paragraph",
          text: "Una variable es un espacio en memoria con un nombre y un tipo. El tipo decide qué puede guardar y cuánto espacio ocupa; el nombre te permite usarla después.",
        },
        {
          type: "code",
          caption: "declaracion.cpp",
          code: "int edad = 17;\nint siguiente = edad + 1;",
        },
        {
          type: "paragraph",
          text: "En la primera línea se declara una variable de tipo int (un número entero) llamada edad y se le da el valor 17. En la segunda se calcula un valor nuevo a partir de ella.",
        },
        {
          type: "trace",
          title: "Recorre el programa paso a paso",
          code: "int a = 3;\nint b = 4;\nint suma = a + b;\ncout << suma;",
          steps: [
            {
              line: 1,
              explanation:
                "Se reserva espacio para la variable a y se guarda el valor 3 dentro.",
              variables: [{ name: "a", value: "3" }],
            },
            {
              line: 2,
              explanation: "Lo mismo con b, que pasa a valer 4. La variable a no cambia.",
              variables: [
                { name: "a", value: "3" },
                { name: "b", value: "4" },
              ],
            },
            {
              line: 3,
              explanation:
                "Primero se calcula a + b, que da 7, y ese resultado se guarda en una variable nueva llamada suma.",
              variables: [
                { name: "a", value: "3" },
                { name: "b", value: "4" },
                { name: "suma", value: "7" },
              ],
            },
            {
              line: 4,
              explanation: "Se envía el valor de suma a la salida.",
              variables: [
                { name: "a", value: "3" },
                { name: "b", value: "4" },
                { name: "suma", value: "7" },
              ],
              output: "7",
            },
          ],
        },
        {
          type: "heading",
          text: "Copiar no es enlazar",
        },
        {
          type: "paragraph",
          text: "Cuando asignas una variable a otra, se copia el valor en ese instante. Si después cambias la primera, la segunda conserva la copia antigua: son dos espacios de memoria distintos.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Declarar no es inicializar",
          text: "Si escribes int x; sin darle un valor, x contiene basura: lo que hubiera en esa posición de memoria. Leerla antes de asignarle algo produce resultados impredecibles, así que inicializa siempre tus variables.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "variables-1",
            kind: "concept",
            prompt: "¿Qué determina el tipo de una variable?",
            options: [
              { id: "a", text: "Qué valores puede guardar y cuánto espacio ocupa en memoria." },
              { id: "b", text: "El nombre que le has dado." },
              { id: "c", text: "El orden en que la declaras dentro de main." },
            ],
            correctOptionId: "a",
            explanation:
              "El nombre es solo para ti; el tipo es lo que el compilador usa para reservar memoria e interpretar su contenido.",
          },
          {
            id: "variables-2",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "int x = 5;\nint y = x;\nx = 10;\ncout << y;",
            options: [
              { id: "a", text: "5" },
              { id: "b", text: "10" },
              { id: "c", text: "Depende del compilador" },
            ],
            correctOptionId: "a",
            explanation:
              "y copió el valor de x cuando valía 5. Cambiar x después no afecta a y: son dos espacios distintos.",
          },
          {
            id: "variables-3",
            kind: "what-does-it-do",
            prompt: "¿Qué hace exactamente esta línea?",
            code: "int suma = a + b;",
            options: [
              {
                id: "a",
                text: "Calcula a + b y guarda el resultado en una variable nueva llamada suma.",
              },
              { id: "b", text: "Hace que suma valga siempre a + b, aunque a o b cambien." },
              { id: "c", text: "Escribe el resultado de a + b por pantalla." },
            ],
            correctOptionId: "a",
            explanation:
              "La suma se calcula una sola vez, en ese momento. Si luego cambias a, la variable suma conserva el valor que ya tenía.",
          },
          {
            id: "variables-4",
            kind: "spot-error",
            prompt: "¿Qué problema tiene este fragmento?",
            code: "int x;\ncout << x + 1;",
            options: [
              { id: "a", text: "Se usa x sin haberle dado nunca un valor." },
              { id: "b", text: "No se puede sumar 1 a una variable de tipo int." },
              { id: "c", text: "Falta declarar x como entero." },
            ],
            correctOptionId: "a",
            explanation:
              "x está declarada pero no inicializada: contiene lo que hubiera en esa memoria, así que el resultado es impredecible.",
          },
          {
            id: "variables-5",
            kind: "apply",
            prompt:
              "Quieres llevar la cuenta de los problemas que resuelves, empezando en cero y sumando uno cada vez. ¿Qué encaja?",
            options: [
              { id: "a", text: "int resueltos = 0; y después resueltos = resueltos + 1;" },
              { id: "b", text: "int resueltos; y después resueltos + 1;" },
              { id: "c", text: "resueltos = 0; sin declarar la variable antes." },
            ],
            correctOptionId: "a",
            explanation:
              "La opción b no inicializa y además no guarda el resultado: resueltos + 1 calcula un valor y lo tira. La c usa una variable que no existe.",
          },
          {
            id: "variables-6",
            kind: "concept",
            prompt: "¿Cuál es la diferencia entre declarar e inicializar?",
            options: [
              {
                id: "a",
                text: "Declarar reserva el espacio con un nombre y un tipo; inicializar le da su primer valor.",
              },
              { id: "b", text: "Son dos palabras para lo mismo." },
              { id: "c", text: "Declarar le da el valor; inicializar reserva la memoria." },
            ],
            correctOptionId: "a",
            explanation:
              "int x; declara. int x = 0; declara e inicializa en la misma línea, que es lo recomendable.",
          },
        ],
      },
      // El enunciado fija el valor 17: la salida esperada tiene que ser
      // determinista para poder compararla.
      challenge: {
        id: "variables-desafio",
        title: "Guarda tu primer dato",
        statement: [
          {
            type: "paragraph",
            text: "Ya sabes declarar una variable, darle un valor y calcular otro a partir de ella. Ahora te toca escribir el programa entero, de principio a fin.",
          },
        ],
        instructions: [
          "Declara una variable entera llamada edad con el valor 17.",
          "Declara otra variable entera llamada siguiente que valga la edad más uno.",
          "Muestra primero edad y después siguiente, cada una en su propia línea.",
        ],
        requirements: [
          "Usa el tipo int para las dos variables.",
          "Calcula siguiente a partir de edad: no escribas el 18 a mano.",
        ],
        examples: [
          {
            output: "17\n18",
            explanation:
              "La primera línea es la edad que has guardado; la segunda, esa misma edad más uno.",
          },
        ],
        hints: [
          "Empieza declarando la primera variable dentro de main: int edad = 17;",
          "La segunda se calcula con una expresión, no con un número escrito a mano: int siguiente = edad + 1;",
          "Para que cada valor salga en su línea, añade endl después de cada uno.",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  // 1. Declara aquí la variable edad\n\n  // 2. Calcula siguiente a partir de edad\n\n  // 3. Muestra los dos valores, uno por línea\n\n  return 0;\n}",
        // Los casos de prueba y la solución viven en el servidor:
        // src/server/challenges/tests.ts
      },
    },
    {
      slug: "tipos-de-datos",
      title: "Tipos de datos",
      kind: "theory",
      estimatedMinutes: 10,
      summary:
        "int, long long, double, char y bool: qué guarda cada uno y cuál elegir para no quedarte corto.",
      blocks: [
        {
          type: "paragraph",
          text: "Hasta ahora has usado int para todo. Pero no todos los datos son números enteros pequeños: a veces necesitas decimales, a veces una sola letra y a veces un número tan grande que no cabe en un int. El tipo que elijas decide qué cabe y qué no.",
        },
        {
          type: "heading",
          text: "Los cinco que vas a usar",
        },
        {
          type: "code",
          caption: "tipos.cpp",
          code: 'int edad = 17;\nlong long poblacion = 8000000000;\ndouble nota = 7.5;\nchar inicial = \'B\';\nbool aprobado = true;',
        },
        {
          type: "list",
          items: [
            "int: números enteros. Llega hasta algo más de 2000 millones.",
            "long long: enteros mucho más grandes, hasta unos 9 trillones. Es tu red de seguridad.",
            "double: números con decimales, como 7.5 o 3.14.",
            "char: un único carácter, siempre entre comillas simples.",
            "bool: solo dos valores posibles, true o false.",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "El desbordamiento no avisa",
          text: "Si un resultado no cabe en un int, el programa no da error: guarda un número equivocado y sigue adelante como si nada. Es de los fallos más difíciles de encontrar, porque el código parece correcto.",
        },
        {
          type: "code",
          caption: "desbordamiento.cpp",
          code: "int pequeno = 2000000000;\ncout << pequeno + pequeno << endl;\n\nlong long grande = 2000000000;\ncout << grande + grande << endl;",
          output: "-294967296\n4000000000",
        },
        {
          type: "paragraph",
          text: "Las dos sumas son la misma. La primera se calcula con int y no cabe, así que el resultado da la vuelta y sale negativo. La segunda usa long long y muestra el valor correcto.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Regla práctica para competir",
          text: "Si un resultado puede pasar de 2000 millones —sumas de muchos números, multiplicaciones, factoriales—, usa long long desde el principio. No cuesta nada y te ahorra un fallo silencioso.",
        },
        {
          type: "heading",
          text: "Comillas simples y dobles",
        },
        {
          type: "paragraph",
          text: "Es una distinción pequeña que confunde al principio: 'B' con comillas simples es un char, un solo carácter. \"B\" con comillas dobles es texto. No son lo mismo y no se usan igual.",
        },
        {
          type: "callout",
          variant: "key",
          title: "Los decimales no son exactos",
          text: "Un double guarda una aproximación muy buena, pero no exacta. Por eso 0.1 + 0.2 no da exactamente 0.3. Con enteros no pasa: si el problema lo permite, trabaja con enteros.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "tipos-1",
            kind: "concept",
            prompt: "¿Para qué sirve long long?",
            options: [
              { id: "a", text: "Para guardar enteros que no caben en un int." },
              { id: "b", text: "Para guardar números con decimales." },
              { id: "c", text: "Para que el programa se ejecute más rápido." },
            ],
            correctOptionId: "a",
            explanation:
              "Los decimales son cosa de double. long long amplía el rango de los enteros, no la velocidad.",
          },
          {
            id: "tipos-2",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "int a = 2000000000;\nint b = 2000000000;\ncout << a + b;",
            options: [
              { id: "a", text: "4000000000" },
              { id: "b", text: "Un número negativo, porque el resultado no cabe en un int." },
              { id: "c", text: "Da error de compilación." },
            ],
            correctOptionId: "b",
            explanation:
              "La suma se hace con int y desborda. No hay error: simplemente se guarda un valor incorrecto.",
          },
          {
            id: "tipos-3",
            kind: "spot-error",
            prompt: "¿Qué falla en esta declaración?",
            code: 'char inicial = "B";',
            options: [
              { id: "a", text: "Un char va entre comillas simples: \'B\'." },
              { id: "b", text: "char no puede guardar letras mayúsculas." },
              { id: "c", text: "Falta inicializar la variable." },
            ],
            correctOptionId: "a",
            explanation:
              'Las comillas dobles crean texto, no un carácter suelto. Para un char se usa \'B\'.',
          },
          {
            id: "tipos-4",
            kind: "concept",
            prompt: "¿Qué valores puede tomar una variable de tipo bool?",
            options: [
              { id: "a", text: "Cualquier número entero." },
              { id: "b", text: "Solo true o false." },
              { id: "c", text: "Solo 0 y 1, escritos como números." },
            ],
            correctOptionId: "b",
            explanation:
              "Se escriben true y false. Por dentro se corresponden con 1 y 0, pero al declararlos se usan esas palabras.",
          },
          {
            id: "tipos-5",
            kind: "apply",
            prompt:
              "Un problema te pide sumar un millón de números, cada uno de hasta un millón. ¿Qué tipo usas para el total?",
            options: [
              { id: "a", text: "int, porque los números de entrada caben en un int." },
              { id: "b", text: "long long, porque el total puede llegar al billón." },
              { id: "c", text: "double, porque es el tipo más grande." },
            ],
            correctOptionId: "b",
            explanation:
              "Cada número cabe en un int, pero el total puede acercarse a 10^12 y desbordaría. El acumulador necesita long long.",
          },
          {
            id: "tipos-6",
            kind: "what-does-it-do",
            prompt: "¿Qué tipo elegirías para guardar si un número es par?",
            options: [
              { id: "a", text: "bool, porque solo hay dos respuestas posibles." },
              { id: "b", text: "int, guardando 1 o 2." },
              { id: "c", text: "char, guardando \'s\' o \'n\'." },
            ],
            correctOptionId: "a",
            explanation:
              "Un dato que solo puede ser sí o no es exactamente lo que representa un bool, y así lo lee cualquiera que abra tu código.",
          },
        ],
      },
      challenge: {
        id: "tipos-desafio",
        title: "Cada dato en su tipo",
        statement: [
          {
            type: "paragraph",
            text: "Vas a declarar cuatro variables, cada una del tipo que le corresponde, y mostrarlas en orden. Fíjate en el tercer valor: es lo bastante grande como para no caber en un int.",
          },
        ],
        instructions: [
          "Declara un int llamado edad con el valor 17.",
          "Declara un double llamado nota con el valor 7.5.",
          "Declara un long long llamado distancia con el valor 9000000000.",
          "Declara un char llamado inicial con el valor 'B'.",
          "Muestra los cuatro valores en ese orden, cada uno en su propia línea.",
        ],
        requirements: [
          "Usa exactamente esos cuatro tipos: si usas int para distancia, el valor saldrá mal.",
          "El char va entre comillas simples.",
        ],
        examples: [
          {
            output: "17\n7.5\n9000000000\nB",
            explanation:
              "Un valor por línea y en el orden del enunciado: edad, nota, distancia e inicial.",
          },
        ],
        hints: [
          "Empieza por la más sencilla: int edad = 17;",
          "9000000000 supera el rango de int, así que esa variable necesita ser long long.",
          "Recuerda las comillas simples del char: char inicial = 'B';",
        ],
        starterCode:
          "#include <iostream>\nusing namespace std;\n\nint main() {\n  // 1. edad (int)\n\n  // 2. nota (double)\n\n  // 3. distancia (long long)\n\n  // 4. inicial (char)\n\n  // Muestra los cuatro, uno por línea\n\n  return 0;\n}",
      },
    },
    {
      slug: "quiz-introduccion",
      title: "Repaso del módulo",
      kind: "quiz",
      estimatedMinutes: 6,
      summary:
        "Seis preguntas que mezclan las tres lecciones del módulo. Si alguna se te resiste, vuelve a la lección desde el índice.",
      blocks: [
        {
          type: "heading",
          text: "Lo que has visto en este módulo",
        },
        {
          type: "list",
          items: [
            "Qué es C++, por qué se compila y por qué domina los concursos.",
            "La forma de un programa: #include, main y return.",
            "Mostrar texto y valores por pantalla con cout y el operador <<.",
            "Variables: declarar, inicializar, copiar y operar con ellas.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Cómo aprovechar el repaso",
          text: "Responde primero sin mirar atrás. Cuando falles una pregunta, abre la lección correspondiente en el índice y relee solo esa parte: recordar cuesta más que releer, y por eso enseña más.",
        },
        {
          type: "heading",
          text: "Chuleta rápida",
        },
        {
          type: "code",
          caption: "esqueleto.cpp",
          code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n = 0;\n  cout << "n vale " << n << endl;\n  return 0;\n}',
          output: "n vale 0",
        },
      ],
      quiz: {
        questions: [
          {
            id: "intro-repaso-1",
            kind: "concept",
            prompt: "¿Dónde empieza la ejecución de un programa en C++?",
            options: [
              { id: "a", text: "En la primera línea del archivo." },
              { id: "b", text: "En la función main." },
              { id: "c", text: "En la directiva #include." },
            ],
            correctOptionId: "b",
            explanation:
              "Los #include y las declaraciones se procesan antes, pero la ejecución arranca siempre en main.",
          },
          {
            id: "intro-repaso-2",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "int a = 2;\nint b = a + 3;\ncout << b;",
            options: [
              { id: "a", text: "2" },
              { id: "b", text: "5" },
              { id: "c", text: "a + 3" },
            ],
            correctOptionId: "b",
            explanation:
              "b guarda el resultado de la operación, no la operación. Sin comillas, lo que se escribe es el valor.",
          },
          {
            id: "intro-repaso-3",
            kind: "spot-error",
            prompt: "Este programa no compila. ¿Qué le falta?",
            code: '#include <iostream>\n\nint main() {\n  cout << "Hola";\n  return 0;\n}',
            options: [
              { id: "a", text: "La línea using namespace std; o escribir std::cout." },
              { id: "b", text: "Un endl después del texto." },
              { id: "c", text: "Declarar cout como variable." },
            ],
            correctOptionId: "a",
            explanation:
              "cout vive dentro del espacio de nombres std. Sin using namespace std; hay que escribirlo como std::cout.",
          },
          {
            id: "intro-repaso-4",
            kind: "concept",
            prompt: "¿Cuál de estas declaraciones guarda un número entero?",
            options: [
              { id: "a", text: 'string total = "10";' },
              { id: "b", text: "int total = 10;" },
              { id: "c", text: "bool total = 10;" },
            ],
            correctOptionId: "b",
            explanation:
              "int es el tipo para números enteros. La primera guarda texto y la tercera, un valor de verdad.",
          },
          {
            id: "intro-repaso-5",
            kind: "apply",
            prompt:
              "Tienes dos enteros en a y b y quieres mostrar su suma en una sola línea. ¿Cuál lo hace?",
            options: [
              { id: "a", text: 'cout << "a + b" << endl;' },
              { id: "b", text: "cout << a + b << endl;" },
              { id: "c", text: "cout << a, b << endl;" },
            ],
            correctOptionId: "b",
            explanation:
              "La primera escribiría el texto literal a + b; la tercera no hace lo que parece, porque la coma no encadena salida.",
          },
          {
            id: "intro-repaso-6",
            kind: "concept",
            prompt: "¿Qué ocurre si lees una variable que has declarado pero no inicializado?",
            options: [
              { id: "a", text: "Vale 0 automáticamente." },
              { id: "b", text: "Contiene un valor impredecible y el resultado no es fiable." },
              { id: "c", text: "El programa siempre se detiene con un error." },
            ],
            correctOptionId: "b",
            explanation:
              "Contiene lo que hubiera en esa memoria. Puede que funcione hoy y falle mañana, que es lo peor que puede pasarte en un concurso.",
          },
        ],
      },
      // El repaso de módulo se completa con sus seis preguntas.
      challenge: null,
    },
  ],
};
