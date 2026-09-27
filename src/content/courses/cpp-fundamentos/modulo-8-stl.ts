import type { Module } from "@/lib/courses/types";

/**
 * Módulo 8 — STL esencial.
 *
 * Cierra el curso con las tres herramientas que más aparecen en problemas de
 * iniciación: ordenar, contar frecuencias y detectar repetidos. Cada una llega
 * planteando primero el problema que resuelve, para que se entienda por qué
 * existe en lugar de memorizar su sintaxis.
 *
 * No hay algoritmos avanzados aquí a propósito: eso es materia del siguiente
 * curso, y meterlo ahora solo serviría para que el temario pareciese más
 * completo de lo que conviene.
 */
export const stlEsencial: Module = {
  slug: "stl-esencial",
  title: "STL esencial",
  summary: "Las herramientas de la biblioteca estándar que usarás en casi todos los problemas.",
  lessons: [
    {
      slug: "ordenar",
      title: "Ordenar",
      kind: "theory",
      estimatedMinutes: 10,
      summary:
        "Una sola línea para ordenar, y las preguntas que se vuelven fáciles cuando los datos están ordenados.",
      blocks: [
        {
          type: "paragraph",
          text: "Ordenar a mano es un ejercicio clásico, y también una pérdida de tiempo en un concurso. C++ trae sort, que ordena un vector entero en una línea y lo hace de forma muy eficiente.",
        },
        {
          type: "code",
          caption: "sort.cpp",
          code: "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n  vector<int> v = {5, 2, 9, 1};\n\n  sort(v.begin(), v.end());\n\n  for (int x : v) cout << x << \" \";\n  return 0;\n}",
          output: "1 2 5 9",
        },
        {
          type: "list",
          items: [
            "Hace falta incluir <algorithm>.",
            "v.begin() y v.end() marcan el principio y el final de lo que hay que ordenar.",
            "Ordena de menor a mayor y modifica el vector original.",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Ordenar cambia el vector",
          text: "sort no devuelve una copia ordenada: reordena el que le pasas. Si necesitabas el orden original para algo, guárdalo en otro vector antes.",
        },
        {
          type: "heading",
          text: "De mayor a menor",
        },
        {
          type: "paragraph",
          text: "Para el orden inverso se añade un tercer argumento que indica el criterio.",
        },
        {
          type: "code",
          caption: "descendente.cpp",
          code: "sort(v.begin(), v.end(), greater<int>());",
        },
        {
          type: "heading",
          text: "Qué se vuelve fácil al ordenar",
        },
        {
          type: "paragraph",
          text: "Ordenar rara vez es el objetivo del problema: es el paso que convierte una pregunta difícil en una trivial.",
        },
        {
          type: "list",
          items: [
            "El mayor y el menor quedan en los extremos.",
            "La mediana queda justo en el centro.",
            "Los elementos iguales quedan juntos, así que los repetidos son fáciles de detectar.",
            "El k-ésimo más grande está en una posición concreta, sin buscar nada.",
          ],
        },
        {
          type: "callout",
          variant: "tip",
          title: "Cuando un problema se atasque, prueba a ordenar",
          text: "Es uno de los reflejos más útiles en competitiva: muchos enunciados que parecen complicados se simplifican enormemente si los datos están ordenados. Y ordenar un millón de elementos es rapidísimo.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Ordenar no siempre está permitido",
          text: "Si el problema pregunta por la posición original de un elemento, ordenar la destruye. Léelo con cuidado antes de reordenar los datos.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "sort-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: 'vector<int> v = {3, 1, 2};\nsort(v.begin(), v.end());\nfor (int x : v) cout << x;',
            options: [
              { id: "a", text: "123" },
              { id: "b", text: "321" },
              { id: "c", text: "312" },
            ],
            correctOptionId: "a",
            explanation: "Por defecto, sort ordena de menor a mayor.",
          },
          {
            id: "sort-2",
            kind: "concept",
            prompt: "¿Qué le ocurre al vector original al llamar a sort?",
            options: [
              { id: "a", text: "Queda reordenado: sort modifica el vector que recibe." },
              { id: "b", text: "No cambia; sort devuelve una copia ordenada." },
              { id: "c", text: "Se vacía y hay que volver a llenarlo." },
            ],
            correctOptionId: "a",
            explanation:
              "Si necesitas conservar el orden de llegada, guarda una copia antes de ordenar.",
          },
          {
            id: "sort-3",
            kind: "spot-error",
            prompt: "Este código no compila. ¿Qué falta?",
            code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n  vector<int> v = {2, 1};\n  sort(v.begin(), v.end());\n  return 0;\n}",
            options: [
              { id: "a", text: "Incluir <algorithm>, donde vive sort." },
              { id: "b", text: "Declarar v como vector<int> v(2)." },
              { id: "c", text: "Pasar el vector entero en lugar de begin y end." },
            ],
            correctOptionId: "a",
            explanation:
              "vector viene de <vector>, pero sort está en <algorithm> y hay que incluirlo aparte.",
          },
          {
            id: "sort-4",
            kind: "apply",
            prompt: "Tienes un vector ordenado de menor a mayor. ¿Dónde está el mayor elemento?",
            options: [
              { id: "a", text: "En la última posición: v[v.size() - 1]." },
              { id: "b", text: "En la primera: v[0]." },
              { id: "c", text: "Hay que recorrerlo igualmente para encontrarlo." },
            ],
            correctOptionId: "a",
            explanation:
              "Ese es justo el valor de ordenar: preguntas que requerían un recorrido pasan a ser un acceso directo.",
          },
          {
            id: "sort-5",
            kind: "what-does-it-do",
            prompt: "¿Qué hace el tercer argumento en sort(v.begin(), v.end(), greater<int>())?",
            options: [
              { id: "a", text: "Ordena de mayor a menor." },
              { id: "b", text: "Ordena solo los elementos mayores que cero." },
              { id: "c", text: "Elimina los repetidos." },
            ],
            correctOptionId: "a",
            explanation: "Es el criterio de comparación: cambia el orden, no los elementos.",
          },
          {
            id: "sort-6",
            kind: "concept",
            prompt: "¿En qué caso ordenar puede estropear la solución?",
            options: [
              { id: "a", text: "Cuando el problema pregunta por la posición original de un elemento." },
              { id: "b", text: "Cuando hay más de mil elementos." },
              { id: "c", text: "Cuando los números son negativos." },
            ],
            correctOptionId: "a",
            explanation:
              "Al reordenar se pierde el orden de llegada, y con él la información sobre dónde estaba cada dato.",
          },
        ],
      },
      challenge: {
        id: "ordenar-desafio",
        title: "La mediana",
        statement: [
          {
            type: "paragraph",
            text: "La mediana es el valor que queda en el centro cuando los datos están ordenados. El problema parece pedir un cálculo y en realidad solo pide ordenar y mirar la posición correcta.",
          },
        ],
        instructions: [
          "Lee un entero n impar con la cantidad de números.",
          "Lee los n números.",
          "Ordénalos y escribe el que queda justo en el centro.",
        ],
        requirements: [
          "n será siempre impar, así que el centro es una única posición.",
          "Usa sort en lugar de ordenar a mano.",
          "Recuerda que las posiciones empiezan en 0.",
        ],
        examples: [
          {
            input: "5\n5 2 9 1 7",
            output: "5",
            explanation: "Ordenados quedan 1 2 5 7 9, y el del centro es el 5.",
          },
          {
            input: "3\n10 -4 2",
            output: "2",
            explanation: "Ordenados son -4 2 10: la mediana es el 2.",
          },
          {
            input: "1\n42",
            output: "42",
            explanation: "Con un solo número, ese número es la mediana.",
          },
        ],
        hints: [
          "Guarda los números en un vector y ordénalo con sort(v.begin(), v.end());",
          "Con n impar, la posición central es n / 2, aprovechando la división entera.",
          "Por ejemplo, con n valiendo 5, la posición central es la 2: hay dos elementos a cada lado.",
        ],
        starterCode:
          "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  // 1. Lee los números en un vector\n\n  // 2. Ordénalo\n\n  // 3. Escribe el del centro\n\n  return 0;\n}",
      },
    },
    {
      slug: "map-y-set",
      title: "map y set",
      kind: "theory",
      estimatedMinutes: 11,
      summary:
        "Dos estructuras que responden «¿cuántas veces aparece?» y «¿ya lo había visto?» sin recorrer nada.",
      blocks: [
        {
          type: "paragraph",
          text: "Imagina que te dan un millón de números y preguntan cuántos son distintos. Con lo que sabes, compararías cada número con todos los anteriores: un billón de operaciones, imposible en el tiempo límite. Hacen falta estructuras pensadas para esto.",
        },
        {
          type: "heading",
          text: "set: elementos sin repetir",
        },
        {
          type: "paragraph",
          text: "Un set guarda elementos únicos. Si insertas uno que ya está, no hace nada. Contar distintos se reduce a insertarlos todos y mirar el tamaño.",
        },
        {
          type: "code",
          caption: "set.cpp",
          code: "#include <iostream>\n#include <set>\nusing namespace std;\n\nint main() {\n  set<int> vistos;\n\n  vistos.insert(3);\n  vistos.insert(7);\n  vistos.insert(3);\n\n  cout << vistos.size() << endl;\n  return 0;\n}",
          output: "2",
        },
        {
          type: "paragraph",
          text: "El 3 se insertó dos veces y solo cuenta una. Además, un set mantiene sus elementos ordenados de menor a mayor automáticamente.",
        },
        {
          type: "list",
          items: [
            "insert(x) añade el elemento si no estaba.",
            "count(x) devuelve 1 si está y 0 si no.",
            "size() dice cuántos elementos distintos hay.",
          ],
        },
        {
          type: "heading",
          text: "map: asociar una clave con un valor",
        },
        {
          type: "paragraph",
          text: "Un map relaciona cada clave con un valor. El uso más frecuente en competitiva es contar cuántas veces aparece cada cosa.",
        },
        {
          type: "code",
          caption: "map.cpp",
          code: "#include <iostream>\n#include <map>\nusing namespace std;\n\nint main() {\n  map<int, int> veces;\n\n  veces[5]++;\n  veces[5]++;\n  veces[8]++;\n\n  cout << veces[5] << endl;\n  cout << veces[8] << endl;\n  cout << veces[99] << endl;\n  return 0;\n}",
          output: "2\n1\n0",
        },
        {
          type: "callout",
          variant: "key",
          title: "Una clave nueva empieza en cero",
          text: "Por eso veces[5]++ funciona aunque el 5 no existiera antes: al mencionarlo se crea con el valor 0 y el ++ lo deja en 1. Eso convierte el conteo de frecuencias en una sola línea.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Consultar una clave la crea",
          text: "Escribir veces[99] para comprobar si existe la añade al map con valor 0, y el tamaño aumenta. Si solo quieres comprobar si está sin crearla, usa veces.count(99).",
        },
        {
          type: "heading",
          text: "Recorrer un map",
        },
        {
          type: "code",
          caption: "recorrer_map.cpp",
          code: "for (auto par : veces) {\n  cout << par.first << \" aparece \" << par.second << \" veces\" << endl;\n}",
        },
        {
          type: "paragraph",
          text: "Cada elemento tiene dos partes: first es la clave y second el valor. La palabra auto le pide al compilador que deduzca el tipo, que aquí sería largo de escribir. Las claves salen en orden.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Cuál elegir",
          text: "Si solo necesitas saber si algo ya apareció, usa set. Si necesitas cuántas veces o asociar un dato a cada clave, usa map. En la duda, empieza por el set: es más simple.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "map-1",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "set<int> s;\ns.insert(4);\ns.insert(4);\ns.insert(9);\ncout << s.size();",
            options: [
              { id: "a", text: "2" },
              { id: "b", text: "3" },
              { id: "c", text: "1" },
            ],
            correctOptionId: "a",
            explanation: "El 4 repetido no se añade dos veces: un set solo guarda elementos únicos.",
          },
          {
            id: "map-2",
            kind: "predict-output",
            prompt: "¿Qué escribe este fragmento?",
            code: "map<int, int> m;\nm[7]++;\nm[7]++;\nm[7]++;\ncout << m[7];",
            options: [
              { id: "a", text: "3" },
              { id: "b", text: "1" },
              { id: "c", text: "7" },
            ],
            correctOptionId: "a",
            explanation:
              "La clave 7 arranca en 0 la primera vez y se incrementa tres veces.",
          },
          {
            id: "map-3",
            kind: "concept",
            prompt: "¿Qué ocurre al consultar m[99] si esa clave no existe?",
            options: [
              { id: "a", text: "Se crea con valor 0 y el map crece." },
              { id: "b", text: "Da error en ejecución." },
              { id: "c", text: "Devuelve 0 sin modificar el map." },
            ],
            correctOptionId: "a",
            explanation:
              "Es un efecto secundario fácil de pasar por alto. Para comprobar sin crear, se usa count.",
          },
          {
            id: "map-4",
            kind: "apply",
            prompt: "Te dan un millón de números y preguntan cuántos son distintos. ¿Qué usas?",
            options: [
              { id: "a", text: "Un set: insertar todos y mirar su tamaño." },
              { id: "b", text: "Dos bucles anidados comparando cada par." },
              { id: "c", text: "Un vector y contar a mano los repetidos." },
            ],
            correctOptionId: "a",
            explanation:
              "La opción b son un billón de comparaciones: no entra en el tiempo límite ni de lejos.",
          },
          {
            id: "map-5",
            kind: "what-does-it-do",
            prompt: "Al recorrer un map, ¿qué contienen first y second?",
            options: [
              { id: "a", text: "first es la clave y second el valor asociado." },
              { id: "b", text: "first es el primer elemento y second el último." },
              { id: "c", text: "first es la posición y second el contenido." },
            ],
            correctOptionId: "a",
            explanation:
              "Cada elemento de un map es una pareja clave-valor, y esos son sus dos nombres.",
          },
          {
            id: "map-6",
            kind: "concept",
            prompt: "¿Cuándo conviene un set en lugar de un map?",
            options: [
              { id: "a", text: "Cuando solo necesitas saber si un elemento apareció o no." },
              { id: "b", text: "Cuando necesitas contar cuántas veces aparece cada uno." },
              { id: "c", text: "Cuando los elementos son texto." },
            ],
            correctOptionId: "a",
            explanation:
              "Contar frecuencias es justo el caso del map. El set responde a «está o no está».",
          },
        ],
      },
      challenge: {
        id: "set-desafio",
        title: "¿Cuántos distintos?",
        statement: [
          {
            type: "paragraph",
            text: "Un problema que con dos bucles anidados sería inviable para entradas grandes, y que con la estructura adecuada cabe en cinco líneas.",
          },
        ],
        instructions: [
          "Lee un entero n con la cantidad de números.",
          "Lee los n números.",
          "Escribe cuántos valores distintos hay entre ellos.",
        ],
        requirements: [
          "Usa un set en lugar de comparar cada número con todos los anteriores.",
          "Escribe solo la cantidad.",
        ],
        examples: [
          {
            input: "5\n1 2 2 3 1",
            output: "3",
            explanation: "Los valores distintos son 1, 2 y 3, aunque algunos se repitan.",
          },
          {
            input: "4\n7 7 7 7",
            output: "1",
            explanation: "Todos son el mismo valor, así que solo hay uno distinto.",
          },
          {
            input: "3\n5 -5 0",
            output: "3",
            explanation: "Ninguno se repite: los tres cuentan.",
          },
        ],
        hints: [
          "Declara el conjunto antes del bucle: set<int> vistos;",
          "Dentro del bucle, lee cada número e insértalo. Los repetidos se ignoran solos.",
          "Al terminar, la respuesta es vistos.size().",
        ],
        starterCode:
          "#include <iostream>\n#include <set>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  // 1. Declara el set\n\n  // 2. Lee los n números e insértalos\n\n  // 3. Escribe cuántos distintos hay\n\n  return 0;\n}",
      },
    },
    {
      slug: "quiz-stl",
      title: "Repaso final",
      kind: "quiz",
      estimatedMinutes: 8,
      summary:
        "Seis preguntas que cierran el curso y comprueban que sabes elegir la herramienta adecuada.",
      blocks: [
        {
          type: "heading",
          text: "Has terminado C++ Fundamentos",
        },
        {
          type: "paragraph",
          text: "Ya tienes todo lo necesario para enfrentarte a un problema sencillo de programación competitiva: leer la entrada, guardar los datos si hace falta, recorrerlos, decidir, repetir y escribir la respuesta con el formato exacto.",
        },
        {
          type: "heading",
          text: "El repertorio completo",
        },
        {
          type: "list",
          items: [
            "Tipos y desbordamiento: long long cuando el resultado pueda crecer.",
            "Entrada y salida, con el formato exacto que pida el enunciado.",
            "Aritmética entera, división y resto, comparaciones y condiciones.",
            "if, else if y switch para decidir; for y while para repetir.",
            "Los patrones de acumular, contar y quedarse con el mejor.",
            "Funciones, y la diferencia entre copia y referencia.",
            "vector y string para guardar datos, sort para ordenarlos.",
            "set y map para responder «¿ya apareció?» y «¿cuántas veces?».",
          ],
        },
        {
          type: "callout",
          variant: "key",
          title: "Cómo abordar tu primer problema",
          text: "Lee el enunciado dos veces. Pregúntate qué te dan, qué te piden y qué necesitas recordar mientras recorres los datos. Esa última respuesta te dice qué variables declarar. El código suele ser la parte más corta del proceso.",
        },
        {
          type: "callout",
          variant: "tip",
          title: "Lo que viene después",
          text: "El siguiente paso es aprender a estimar si tu idea entra en el tiempo límite antes de escribirla, y conocer las técnicas que resuelven los problemas clásicos. Eso es justo lo que verás en Introducción a la programación competitiva.",
        },
      ],
      quiz: {
        questions: [
          {
            id: "final-1",
            kind: "apply",
            prompt:
              "Un problema te da hasta 100.000 números y pide su suma. ¿Qué tipo usas para el total?",
            options: [
              { id: "a", text: "long long, por si el total desborda un int." },
              { id: "b", text: "int, que es suficiente." },
              { id: "c", text: "double, para tener más rango." },
            ],
            correctOptionId: "a",
            explanation:
              "Es el reflejo que conviene automatizar: en cuanto haya una suma de muchos elementos, el acumulador va en long long.",
          },
          {
            id: "final-2",
            kind: "apply",
            prompt:
              "Necesitas saber si un número ya había aparecido antes en la entrada. ¿Qué estructura eliges?",
            options: [
              { id: "a", text: "Un set." },
              { id: "b", text: "Un vector, recorriéndolo entero cada vez." },
              { id: "c", text: "Dos variables sueltas." },
            ],
            correctOptionId: "a",
            explanation:
              "Recorrer el vector en cada consulta convierte el problema en n², que para entradas grandes no entra en tiempo.",
          },
          {
            id: "final-3",
            kind: "spot-error",
            prompt: "Este programa busca el mínimo y falla con entradas de números positivos grandes. ¿Por qué?",
            code: "int minimo = 0;\nfor (int i = 0; i < n; i++) {\n  int x; cin >> x;\n  if (x < minimo) minimo = x;\n}",
            options: [
              { id: "a", text: "Si todos son positivos, ninguno baja de 0 y responde 0." },
              { id: "b", text: "La comparación debería ser <=." },
              { id: "c", text: "El bucle debería empezar en 1." },
            ],
            correctOptionId: "a",
            explanation:
              "Mismo fallo que con el máximo, en espejo: hay que partir del primer elemento leído, no de un valor inventado.",
          },
          {
            id: "final-4",
            kind: "predict-output",
            prompt: "Con la entrada 3 seguida de 4 4 9, ¿qué escribe este programa?",
            code: "int n; cin >> n;\nset<int> s;\nfor (int i = 0; i < n; i++) {\n  int x; cin >> x;\n  s.insert(x);\n}\ncout << s.size();",
            options: [
              { id: "a", text: "2" },
              { id: "b", text: "3" },
              { id: "c", text: "17" },
            ],
            correctOptionId: "a",
            explanation: "Hay tres números pero solo dos valores distintos: el 4 y el 9.",
          },
          {
            id: "final-5",
            kind: "apply",
            prompt: "El problema pide el tercer número más grande de una lista. ¿Cuál es el camino más corto?",
            options: [
              { id: "a", text: "Ordenar de mayor a menor y tomar la posición 2." },
              { id: "b", text: "Recorrer la lista tres veces quitando el máximo cada vez." },
              { id: "c", text: "Usar un map para contar frecuencias." },
            ],
            correctOptionId: "a",
            explanation:
              "La opción b funciona pero es bastante más código. Ordenar convierte la pregunta en un acceso directo.",
          },
          {
            id: "final-6",
            kind: "concept",
            prompt:
              "Al leer un problema nuevo, ¿qué pregunta te dice qué variables declarar antes del bucle?",
            options: [
              { id: "a", text: "¿Qué necesito recordar mientras recorro los datos?" },
              { id: "b", text: "¿Cuántas líneas tendrá mi programa?" },
              { id: "c", text: "¿Qué biblioteca tengo que incluir?" },
            ],
            correctOptionId: "a",
            explanation:
              "Lo que debe sobrevivir de una vuelta a la siguiente es exactamente lo que va fuera del bucle. Es la pregunta que más rentabiliza pensar antes de escribir.",
          },
        ],
      },
      challenge: null,
    },
  ],
};
