import type { Module } from "@/lib/courses/types";

/**
 * Módulo 7 — Colecciones.
 *
 * vector aparece aquí y no antes por una razón pedagógica: hasta ahora todos
 * los problemas se resolvían acumulando sobre la marcha, sin necesidad de
 * guardar los datos. La primera lección plantea justo un caso donde eso ya no
 * basta, para que la estructura llegue como respuesta a un problema y no como
 * una herramienta suelta que hay que memorizar.
 */
export const colecciones: Module = {
  slug: "colecciones",
  title: "Colecciones",
  summary: "Guardar muchos datos a la vez y recorrerlos: vector y string.",
  lessons: [
    {
      slug: "vector",
      title: "vector",
      kind: "theory",
      estimatedMinutes: 11,
      summary:
        "Cuando no basta con acumular al vuelo y necesitas conservar todos los datos.",
      blocks: [
        {
          type: "paragraph",
          text: "Hasta ahora nunca has necesitado guardar los datos: para sumarlos o buscar el máximo bastaba con procesarlos según llegaban. Pero hay preguntas que no se pueden responder así.",
        },
        {
          type: "callout",
          variant: "key",
          title: "El problema que obliga a guardar",
          text: "«Escribe los números en orden inverso» o «¿cuántos están por encima de la media?». En los dos casos necesitas el primer dato cuando ya has leído el último. Sin guardarlos, es imposible.",
        },
        {
          type: "paragraph",
          text: "Un vector es una lista de elementos del mismo tipo, con un tamaño que puede crecer. Se declara indicando qué guarda entre ángulos.",
        },
        {
          type: "code",
          caption: "vector.cpp",
          code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n  vector<int> numeros;\n\n  numeros.push_back(10);\n  numeros.push_back(20);\n  numeros.push_back(30);\n\n  cout << numeros.size() << endl;\n  cout << numeros[0] << endl;\n  cout << numeros[2] << endl;\n  return 0;\n}",
          output: "3\n10\n30",
        },
        {
          type: "list",
          items: [
            "push_back añade un elemento al final.",
            "size() dice cuántos elementos hay.",
            "Los corchetes acceden a una posición concreta.",
            "Hace falta incluir <vector>.",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Las posiciones empiezan en 0",
          text: "El primer elemento es numeros[0] y el último es numeros[size() - 1]. Acceder a numeros[size()] se sale de la lista: no da error de compilación ni suele avisar en ejecución, simplemente lee memoria que no es tuya y devuelve basura.",
        },
        {
          type: "heading",
          text: "Crear un vector de un tamaño conocido",
        },
        {
          type: "paragraph",
          text: "Cuando el problema te dice de antemano cuántos datos vienen, puedes crear el vector ya con ese tamaño y rellenarlo por posiciones.",
        },
        {
          type: "code",
          caption: "tamano_conocido.cpp",
          code: "int n;\ncin >> n;\n\nvector<int> datos(n);\nfor (int i = 0; i < n; i++) {\n  cin >> datos[i];\n}",
        },
        {
          type: "paragraph",
          text: "vector<int> datos(n) crea n elementos, todos inicializados a 0. A partir de ahí se rellenan con un bucle normal.",
        },
        {
          type: "trace",
          title: "Cómo se llena el vector con la entrada 3 y 5 8 2",
          code: "int n;\ncin >> n;\nvector<int> datos(n);\nfor (int i = 0; i < n; i++) cin >> datos[i];",
          steps: [
            {
              line: 2,
              explanation: "Se lee cuántos datos vienen.",
              variables: [{ name: "n", value: "3" }],
            },
            {
              line: 3,
              explanation: "Se crea el vector con tres posiciones, todas a 0.",
              variables: [
                { name: "n", value: "3" },
                { name: "datos", value: "[0, 0, 0]" },
              ],
            },
            {
              line: 4,
              explanation: "Primera vuelta, i vale 0: el 5 va a la posición 0.",
              variables: [
                { name: "i", value: "0" },
                { name: "datos", value: "[5, 0, 0]" },
              ],
            },
            {
              line: 4,
              explanation: "Segunda vuelta: el 8 va a la posición 1.",
              variables: [
                { name: "i", value: "1" },
                { name: "datos", value: "[5, 8, 0]" },
              ],
            },
            {
              line: 4,
              explanation: "Tercera vuelta: el 2 completa la lista.",
              variables: [
                { name: "i", value: "2" },
                { name: "datos", value: "[5, 8, 2]" },
              ],
            },
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "Cuál de las dos formas usar",
          text: "Si el enunciado te dice cuántos datos vienen, crea el vector con ese tamaño. Si no lo sabes de antemano, empieza vacío y ve añadiendo con push_back.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "vector-1",
            kind: "concept",
            prompt: "¿Qué hace push_back?",
            options: [
              { id: "a", text: "Añade un elemento al final del vector." },
              { id: "b", text: "Elimina el último elemento." },
              { id: "c", text: "Inserta al principio." },
            ],
            correctOptionId: "a",
            explanation: "El vector crece por el final, y su tamaño aumenta en uno.",
          },
          {
            id: "vector-2",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "vector<int> v;\nv.push_back(4);\nv.push_back(7);\ncout << v.size() << \" \" << v[1];",
            options: [
              { id: "a", text: "2 7" },
              { id: "b", text: "2 4" },
              { id: "c", text: "1 7" },
            ],
            correctOptionId: "a",
            explanation:
              "Hay dos elementos, y la posición 1 es el segundo, porque se empieza a contar en 0.",
          },
          {
            id: "vector-3",
            kind: "spot-error",
            prompt: "Este bucle se sale del vector. ¿Dónde está el fallo?",
            code: "for (int i = 0; i <= v.size(); i++) {\n  cout << v[i];\n}",
            options: [
              { id: "a", text: "La condición debe ser i < v.size(), sin el igual." },
              { id: "b", text: "El bucle debería empezar en 1." },
              { id: "c", text: "Hay que usar push_back para leer." },
            ],
            correctOptionId: "a",
            explanation:
              "La última posición válida es size() - 1. Con <= se accede una posición más allá del final.",
          },
          {
            id: "vector-4",
            kind: "what-does-it-do",
            prompt: "¿Qué crea vector<int> datos(5);?",
            options: [
              { id: "a", text: "Un vector con cinco elementos, todos valiendo 0." },
              { id: "b", text: "Un vector vacío con capacidad para cinco." },
              { id: "c", text: "Un vector con un único elemento, el 5." },
            ],
            correctOptionId: "a",
            explanation:
              "Los elementos existen desde el principio, así que puedes asignarlos por posición sin usar push_back.",
          },
          {
            id: "vector-5",
            kind: "apply",
            prompt:
              "El problema pide escribir los números en orden inverso al de lectura. ¿Necesitas un vector?",
            options: [
              { id: "a", text: "Sí: hace falta el primer dato después de haber leído el último." },
              { id: "b", text: "No: basta con un acumulador." },
              { id: "c", text: "No: se puede leer la entrada dos veces." },
            ],
            correctOptionId: "a",
            explanation:
              "Esa es justo la señal de que hay que guardar los datos: necesitarlos en un orden distinto al de llegada.",
          },
          {
            id: "vector-6",
            kind: "concept",
            prompt: "¿Cuál es la última posición válida de un vector con n elementos?",
            options: [
              { id: "a", text: "n - 1" },
              { id: "b", text: "n" },
              { id: "c", text: "n + 1" },
            ],
            correctOptionId: "a",
            explanation:
              "Al empezar en 0, n elementos ocupan las posiciones de la 0 a la n - 1.",
          },
        ],
      },
      challenge: {
        id: "vector-desafio",
        title: "Del revés",
        statement: [
          {
            type: "paragraph",
            text: "El problema que no se puede resolver sin guardar los datos: para escribir el primero al final, tienes que haberlo conservado mientras leías todo lo demás.",
          },
        ],
        instructions: [
          "Lee un entero n con la cantidad de números que vienen.",
          "Lee los n números y guárdalos.",
          "Escríbelos en orden inverso, separados por un espacio.",
        ],
        requirements: [
          "Usa un vector para guardar los números.",
          "Los números van en una sola línea, separados por un espacio.",
          "No debe sobrar un espacio al final de la línea.",
        ],
        examples: [
          {
            input: "5\n1 2 3 4 5",
            output: "5 4 3 2 1",
            explanation: "Los mismos números, recorridos desde el final.",
          },
          {
            input: "3\n7 -2 9",
            output: "9 -2 7",
            explanation: "Funciona igual con negativos.",
          },
        ],
        hints: [
          "Crea el vector con el tamaño ya conocido: vector<int> v(n);",
          "Para recorrerlo al revés: for (int i = n - 1; i >= 0; i--)",
          'Para no dejar un espacio final, escribe el espacio antes de cada número salvo el primero: if (i < n - 1) cout << " ";',
        ],
        starterCode:
          "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  // 1. Crea el vector y léelo\n\n  // 2. Recórrelo desde el final\n\n  return 0;\n}",
      },
    },
    {
      slug: "recorrer-vector",
      title: "Recorrer una colección",
      kind: "theory",
      estimatedMinutes: 9,
      summary:
        "Las dos formas de recorrer un vector y cuándo conviene cada una.",
      blocks: [
        {
          type: "paragraph",
          text: "Ya sabes recorrer con un for por posiciones. Existe una segunda forma, más corta, para cuando solo quieres los valores y no te importa en qué posición están.",
        },
        {
          type: "code",
          caption: "dos_recorridos.cpp",
          code: "vector<int> v = {4, 8, 15};\n\n// Por posiciones\nfor (int i = 0; i < v.size(); i++) {\n  cout << v[i] << \" \";\n}\n\n// Por valores\nfor (int x : v) {\n  cout << x << \" \";\n}",
          output: "4 8 15 4 8 15",
        },
        {
          type: "paragraph",
          text: "La segunda se lee «para cada x dentro de v». Es más corta y más difícil de equivocar, porque no hay índices que puedan salirse.",
        },
        {
          type: "list",
          items: [
            "Usa el recorrido por valores cuando solo necesitas los datos.",
            "Usa el recorrido por posiciones cuando necesitas saber dónde está cada elemento, comparar con el siguiente o modificar el vector.",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "Modificar mientras recorres",
          text: "En for (int x : v), la x es una copia: cambiarla no altera el vector. Si quieres modificar los elementos, usa for (int &x : v), con el mismo ampersand que viste en las funciones.",
        },
        {
          type: "heading",
          text: "Combinar patrones",
        },
        {
          type: "paragraph",
          text: "Los patrones del módulo de bucles funcionan igual sobre un vector. La diferencia es que ahora puedes recorrer los datos más de una vez, y eso abre problemas nuevos.",
        },
        {
          type: "code",
          caption: "dos_pasadas.cpp",
          code: "// Primera pasada: calcular la media\nint suma = 0;\nfor (int x : v) suma += x;\ndouble media = (double)suma / v.size();\n\n// Segunda pasada: contar los que la superan\nint cuantos = 0;\nfor (int x : v) {\n  if (x > media) cuantos++;\n}",
        },
        {
          type: "callout",
          variant: "key",
          title: "Por qué (double) delante de suma",
          text: "suma y v.size() son enteros, así que su división descartaría los decimales. Escribir (double) delante convierte el valor antes de dividir y conserva la parte decimal. Es la misma trampa de la división entera, ahora en otro contexto.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Recorrer dos veces no es gratis, pero casi",
          text: "Dos pasadas sobre n elementos son 2n operaciones, no n². Duplicar un recorrido casi nunca es el problema; anidarlo sí. No sacrifiques claridad por ahorrarte una pasada.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "recorrer-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: 'vector<int> v = {2, 4, 6};\nfor (int x : v) {\n  cout << x * 2 << " ";\n}',
            options: [
              { id: "a", text: "4 8 12" },
              { id: "b", text: "2 4 6" },
              { id: "c", text: "0 1 2" },
            ],
            correctOptionId: "a",
            explanation:
              "x toma cada valor del vector, no su posición. Cada uno se escribe multiplicado por dos.",
          },
          {
            id: "recorrer-2",
            kind: "concept",
            prompt: "¿Cuándo necesitas el recorrido por posiciones en lugar del recorrido por valores?",
            options: [
              { id: "a", text: "Cuando necesitas saber en qué posición está cada elemento." },
              { id: "b", text: "Siempre que el vector tenga más de diez elementos." },
              { id: "c", text: "Cuando los elementos son enteros." },
            ],
            correctOptionId: "a",
            explanation:
              "También cuando hay que comparar cada elemento con el siguiente, porque eso exige manejar índices.",
          },
          {
            id: "recorrer-3",
            kind: "spot-error",
            prompt: "Este bucle pretende duplicar cada elemento pero el vector no cambia. ¿Por qué?",
            code: "for (int x : v) {\n  x = x * 2;\n}",
            options: [
              { id: "a", text: "x es una copia: haría falta int &x." },
              { id: "b", text: "Hay que usar push_back para modificar." },
              { id: "c", text: "El bucle debería recorrer por posiciones obligatoriamente." },
            ],
            correctOptionId: "a",
            explanation:
              "Es la misma distinción de los parámetros de una función: sin el ampersand se trabaja sobre una copia.",
          },
          {
            id: "recorrer-4",
            kind: "spot-error",
            prompt: "Esta media siempre sale sin decimales. ¿Qué falta?",
            code: "int suma = 0;\nfor (int x : v) suma += x;\ndouble media = suma / v.size();",
            options: [
              { id: "a", text: "Convertir antes de dividir: (double)suma / v.size()." },
              { id: "b", text: "Declarar suma como double desde el principio no ayudaría." },
              { id: "c", text: "Usar v.size() - 1 en el divisor." },
            ],
            correctOptionId: "a",
            explanation:
              "La división ocurre entre enteros y pierde los decimales antes de guardarse en el double.",
          },
          {
            id: "recorrer-5",
            kind: "apply",
            prompt:
              "Quieres contar cuántos elementos superan la media. ¿Cuántos recorridos necesitas como mínimo?",
            options: [
              { id: "a", text: "Dos: uno para calcular la media y otro para contar." },
              { id: "b", text: "Uno solo, contando sobre la marcha." },
              { id: "c", text: "Tantos como elementos tenga el vector." },
            ],
            correctOptionId: "a",
            explanation:
              "No puedes comparar con la media antes de conocerla, y solo la sabes tras ver todos los datos.",
          },
          {
            id: "recorrer-6",
            kind: "concept",
            prompt: "¿Cuántas operaciones son dos recorridos seguidos sobre n elementos?",
            options: [
              { id: "a", text: "Unas 2n: el doble de uno, no el cuadrado." },
              { id: "b", text: "n × n." },
              { id: "c", text: "Las mismas que un solo recorrido." },
            ],
            correctOptionId: "a",
            explanation:
              "Lo que dispara el coste es anidar bucles, no repetirlos uno detrás de otro.",
          },
        ],
      },
      challenge: {
        id: "recorrer-desafio",
        title: "Por encima de la media",
        statement: [
          {
            type: "paragraph",
            text: "Un problema que necesita dos pasadas: primero hay que conocer la media y solo después se puede comparar cada dato con ella. Es el motivo por el que aquí no basta con acumular al vuelo.",
          },
        ],
        instructions: [
          "Lee un entero n con la cantidad de números.",
          "Lee los n números y guárdalos.",
          "Calcula su media.",
          "Escribe cuántos números son estrictamente mayores que la media.",
        ],
        requirements: [
          "La media debe calcularse con decimales, no con división entera.",
          "La comparación es estricta: un número igual a la media no cuenta.",
          "Escribe solo la cantidad.",
        ],
        examples: [
          {
            input: "5\n1 2 3 4 5",
            output: "2",
            explanation: "La media es 3. Solo el 4 y el 5 la superan.",
          },
          {
            input: "4\n10 10 10 10",
            output: "0",
            explanation: "Todos valen exactamente la media, y la comparación es estricta.",
          },
          {
            input: "3\n1 2 9",
            output: "1",
            explanation: "La media es 4, y solo el 9 queda por encima.",
          },
        ],
        hints: [
          "Guarda los números en un vector: los vas a necesitar dos veces.",
          "Para la media con decimales: (double)suma / n.",
          "En la segunda pasada, cuenta los que cumplen x > media.",
        ],
        starterCode:
          "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  // 1. Lee los números en un vector\n\n  // 2. Calcula la media con decimales\n\n  // 3. Cuenta los que la superan\n\n  return 0;\n}",
      },
    },
    {
      slug: "strings",
      title: "Cadenas de texto",
      kind: "theory",
      estimatedMinutes: 10,
      summary:
        "Guardar y recorrer texto, con las mismas ideas que ya conoces de vector.",
      blocks: [
        {
          type: "paragraph",
          text: "Un string guarda texto. La buena noticia es que se comporta casi igual que un vector: tiene tamaño, se accede por posiciones y se recorre con los mismos bucles.",
        },
        {
          type: "code",
          caption: "string.cpp",
          code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  string palabra = "BytePath";\n\n  cout << palabra.size() << endl;\n  cout << palabra[0] << endl;\n  cout << palabra[4] << endl;\n  return 0;\n}',
          output: "8\nB\nP",
        },
        {
          type: "paragraph",
          text: "Cada posición contiene un char, es decir, un único carácter. Por eso palabra[0] escribe una B y no la palabra entera.",
        },
        {
          type: "heading",
          text: "Leer texto",
        },
        {
          type: "paragraph",
          text: "cin >> lee una palabra: se detiene en el primer espacio. Si necesitas una línea entera, con sus espacios incluidos, hay que usar getline.",
        },
        {
          type: "code",
          caption: "leer_texto.cpp",
          code: "string palabra;\ncin >> palabra;        // lee hasta el primer espacio\n\nstring linea;\ngetline(cin, linea);   // lee la línea completa",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Mezclar cin y getline da problemas",
          text: "Si lees un número con cin >> y después llamas a getline, el salto de línea que dejó el número sin consumir hace que getline lea una línea vacía. Mientras puedas, quédate con cin >>: en la mayoría de los problemas basta.",
        },
        {
          type: "heading",
          text: "Recorrer un texto",
        },
        {
          type: "code",
          caption: "contar_letra.cpp",
          code: "string s = \"programacion\";\nint aes = 0;\n\nfor (char c : s) {\n  if (c == 'a') {\n    aes++;\n  }\n}\n\ncout << aes << endl;",
          output: "2",
        },
        {
          type: "callout",
          variant: "key",
          title: "Comillas simples para comparar caracteres",
          text: "Al comparar un elemento de un string, comparas un char, así que va entre comillas simples: c == 'a'. Con comillas dobles sería texto y la comparación no compilaría.",
        },
        {
          type: "heading",
          text: "Operaciones habituales",
        },
        {
          type: "list",
          items: [
            "s.size() da la longitud.",
            "s += \"texto\" añade al final; también funciona con un solo carácter.",
            "Dos strings se comparan con == igual que dos números.",
            "s.substr(inicio, cuantos) extrae un fragmento.",
          ],
        },
      ],
      quiz: {
        questions: [
          {
            id: "string-1",
            kind: "predict-output",
            prompt: 'Con s valiendo "hola", ¿qué escribe esta línea?',
            code: "cout << s.size() << s[0];",
            options: [
              { id: "a", text: "4h" },
              { id: "b", text: "4hola" },
              { id: "c", text: "3h" },
            ],
            correctOptionId: "a",
            explanation:
              "Cuatro caracteres, y la posición 0 es un único char: la h. Salen pegados porque nada los separa.",
          },
          {
            id: "string-2",
            kind: "concept",
            prompt: "¿Qué diferencia hay entre cin >> s y getline(cin, s)?",
            options: [
              { id: "a", text: "El primero lee hasta el espacio; el segundo, la línea entera." },
              { id: "b", text: "El primero lee números y el segundo texto." },
              { id: "c", text: "No hay diferencia." },
            ],
            correctOptionId: "a",
            explanation:
              "Por eso, para leer un nombre completo con espacios, cin >> se queda solo con la primera palabra.",
          },
          {
            id: "string-3",
            kind: "spot-error",
            prompt: "¿Por qué no compila esta comparación?",
            code: 'for (char c : s) {\n  if (c == "a") { }\n}',
            options: [
              { id: "a", text: "c es un char: hay que comparar con \'a\', entre comillas simples." },
              { id: "b", text: "No se puede comparar dentro de un bucle." },
              { id: "c", text: "Falta convertir c a string." },
            ],
            correctOptionId: "a",
            explanation:
              "Las comillas dobles crean texto, y un char no se compara directamente con texto.",
          },
          {
            id: "string-4",
            kind: "what-does-it-do",
            prompt: "¿Qué contiene s[0] si s vale \"BytePath\"?",
            options: [
              { id: "a", text: "El carácter B." },
              { id: "b", text: "La palabra entera." },
              { id: "c", text: "El número de caracteres." },
            ],
            correctOptionId: "a",
            explanation:
              "Cada posición guarda un solo carácter, igual que cada posición de un vector guarda un elemento.",
          },
          {
            id: "string-5",
            kind: "apply",
            prompt: "Quieres contar cuántas vocales tiene una palabra. ¿Cómo lo enfocas?",
            options: [
              {
                id: "a",
                text: "Recorrer carácter a carácter y aumentar un contador cuando sea vocal.",
              },
              { id: "b", text: "Usar s.size() y restarle las consonantes." },
              { id: "c", text: "Comparar la palabra entera con una lista de vocales." },
            ],
            correctOptionId: "a",
            explanation:
              "Es el patrón de contar del módulo de bucles, aplicado a los caracteres de un string.",
          },
          {
            id: "string-6",
            kind: "concept",
            prompt: "¿En qué se parece un string a un vector?",
            options: [
              { id: "a", text: "Tiene tamaño, se accede por posiciones desde 0 y se recorre igual." },
              { id: "b", text: "En nada: son estructuras completamente distintas." },
              { id: "c", text: "En que ambos solo pueden guardar números." },
            ],
            correctOptionId: "a",
            explanation:
              "Aprender vector primero hace que string resulte familiar: cambia lo que guarda, no cómo se maneja.",
          },
        ],
      },
      challenge: {
        id: "strings-desafio",
        title: "Cuenta las vocales",
        statement: [
          {
            type: "paragraph",
            text: "El patrón de contar que ya conoces, aplicado ahora a los caracteres de una palabra. Todas las letras vendrán en minúscula y sin acentos.",
          },
        ],
        instructions: [
          "Lee una palabra de la entrada.",
          "Cuenta cuántas de sus letras son vocales.",
          "Escribe esa cantidad.",
        ],
        requirements: [
          "Las vocales son a, e, i, o, u, siempre en minúscula y sin acentos.",
          "Recorre la palabra carácter a carácter.",
        ],
        examples: [
          {
            input: "programacion",
            output: "5",
            explanation: "Las vocales son o, a, a, i, o: cinco en total.",
          },
          { input: "ritmo", output: "2", explanation: "Solo la i y la o." },
          { input: "xyz", output: "0", explanation: "Una palabra sin vocales da cero." },
        ],
        hints: [
          "Lee la palabra con cin >> palabra; no hace falta getline.",
          "Recorre con for (char c : palabra).",
          "La condición puede encadenarse con ||: c == 'a' || c == 'e' || ...",
        ],
        starterCode:
          "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  string palabra;\n  cin >> palabra;\n\n  // 1. Un contador que empiece en 0\n\n  // 2. Recorre los caracteres y cuenta las vocales\n\n  // 3. Escribe el resultado\n\n  return 0;\n}",
      },
    },
    {
      slug: "quiz-colecciones",
      title: "Repaso del módulo",
      kind: "quiz",
      estimatedMinutes: 6,
      summary: "Seis preguntas sobre vector, recorridos y cadenas de texto.",
      blocks: [
        {
          type: "heading",
          text: "Lo que has visto en este módulo",
        },
        {
          type: "list",
          items: [
            "Cuándo hace falta guardar los datos en lugar de procesarlos al vuelo.",
            "vector: push_back, size y acceso por posición desde 0.",
            "Las dos formas de recorrer, y cuándo necesitas los índices.",
            "string como una colección de caracteres con las mismas reglas.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "La señal de que necesitas guardar",
          text: "Pregúntate si en algún momento vas a necesitar un dato que ya leíste antes. Si la respuesta es sí, hace falta una colección; si no, con acumular basta y gastas mucha menos memoria.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "col-repaso-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "vector<int> v;\nv.push_back(1);\nv.push_back(2);\nv.push_back(3);\ncout << v.size() << v[v.size() - 1];",
            options: [
              { id: "a", text: "33" },
              { id: "b", text: "32" },
              { id: "c", text: "34" },
            ],
            correctOptionId: "a",
            explanation:
              "Hay tres elementos y el último está en la posición 2, que contiene el 3. Ambos salen pegados.",
          },
          {
            id: "col-repaso-2",
            kind: "apply",
            prompt:
              "El problema pide la suma de unos números y nada más. ¿Necesitas guardarlos en un vector?",
            options: [
              { id: "a", text: "No: basta con acumular según los lees." },
              { id: "b", text: "Sí: siempre hay que guardar la entrada." },
              { id: "c", text: "Sí, porque hay que recorrerlos para sumar." },
            ],
            correctOptionId: "a",
            explanation:
              "Guardar solo hace falta si necesitas volver a los datos. Para sumar, cada número se usa y se olvida.",
          },
          {
            id: "col-repaso-3",
            kind: "spot-error",
            prompt: "¿Qué problema tiene este acceso?",
            code: "vector<int> v(3);\ncout << v[3];",
            options: [
              { id: "a", text: "La posición 3 no existe: las válidas son 0, 1 y 2." },
              { id: "b", text: "El vector está vacío." },
              { id: "c", text: "Hay que usar push_back antes de leer." },
            ],
            correctOptionId: "a",
            explanation:
              "Lo peligroso es que no suele dar error: lee memoria ajena y devuelve un valor cualquiera.",
          },
          {
            id: "col-repaso-4",
            kind: "concept",
            prompt: "En for (int &x : v), ¿qué permite el ampersand?",
            options: [
              { id: "a", text: "Modificar los elementos del vector desde el bucle." },
              { id: "b", text: "Recorrer el vector más rápido." },
              { id: "c", text: "Recorrerlo en orden inverso." },
            ],
            correctOptionId: "a",
            explanation:
              "Sin él, x es una copia y los cambios se pierden al pasar al siguiente elemento.",
          },
          {
            id: "col-repaso-5",
            kind: "predict-output",
            prompt: 'Con s valiendo "abc", ¿qué escribe este bucle?',
            code: 'for (char c : s) {\n  cout << c << ".";\n}',
            options: [
              { id: "a", text: "a.b.c." },
              { id: "b", text: "abc." },
              { id: "c", text: "0.1.2." },
            ],
            correctOptionId: "a",
            explanation:
              "El bucle recorre los caracteres, no las posiciones, y añade un punto tras cada uno.",
          },
          {
            id: "col-repaso-6",
            kind: "what-does-it-do",
            prompt:
              "¿Por qué (double)suma / n da un resultado distinto de suma / n cuando ambos son enteros?",
            options: [
              { id: "a", text: "Porque la conversión ocurre antes de dividir y conserva decimales." },
              { id: "b", text: "Porque (double) redondea el resultado." },
              { id: "c", text: "Porque no hay diferencia real entre las dos." },
            ],
            correctOptionId: "a",
            explanation:
              "Sin la conversión, la división se hace entre enteros y los decimales ya se han perdido cuando se guardan.",
          },
        ],
      },
      challenge: null,
    },
  ],
};
