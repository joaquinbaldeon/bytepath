import "server-only";

/**
 * Casos de prueba y soluciones de referencia de los desafíos.
 *
 * Este módulo **nunca** debe llegar al navegador: `import "server-only"` hace
 * que importarlo desde un componente cliente sea un error de compilación, no un
 * descuido que se descubre en producción.
 *
 * Aquí viven los datos que el estudiante no debe ver. Lo que sí puede ver
 * —enunciado, ejemplos, código inicial— sigue en `src/content/courses`.
 *
 * Convención: los casos que el enunciado muestra como ejemplo van visibles,
 * para que el estudiante pueda comparar su salida con la esperada cuando falle.
 * Los casos marcados como ocultos existen para que no baste con escribir a mano
 * la respuesta del ejemplo, y de ellos solo se devuelve si pasaron.
 */

export type ChallengeTest = {
  id: string;
  stdin?: string;
  expectedOutput: string;
  /**
   * Un caso oculto no devuelve al navegador ni su entrada ni su salida: solo
   * si pasó.
   */
  hidden?: boolean;
};

export type ChallengeLimits = {
  cpuSeconds: number;
  wallSeconds: number;
  memoryMb: number;
};

export type ChallengeTestSuite = {
  tests: ChallengeTest[];
  limits: ChallengeLimits;
  /** Solución del autor. No se devuelve jamás. */
  solution?: string;
};

const defaultLimits: ChallengeLimits = {
  cpuSeconds: 2,
  wallSeconds: 6,
  memoryMb: 128,
};

const suites: Record<string, ChallengeTestSuite> = {
  /* ------------------------- Módulo 1 · Primeros pasos ------------------------ */

  "primer-programa-desafio": {
    limits: defaultLimits,
    tests: [{ id: "unico", expectedOutput: "Hola, BytePath!\nHoy empiezo C++" }],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hola, BytePath!" << endl;\n  cout << "Hoy empiezo C++" << endl;\n  return 0;\n}',
  },

  "variables-desafio": {
    limits: defaultLimits,
    tests: [{ id: "caso-unico", expectedOutput: "17\n18" }],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int edad = 17;\n  int siguiente = edad + 1;\n\n  cout << edad << endl;\n  cout << siguiente << endl;\n\n  return 0;\n}",
  },

  "tipos-desafio": {
    limits: defaultLimits,
    tests: [{ id: "unico", expectedOutput: "17\n7.5\n9000000000\nB" }],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int edad = 17;\n  double nota = 7.5;\n  long long distancia = 9000000000;\n  char inicial = 'B';\n\n  cout << edad << endl;\n  cout << nota << endl;\n  cout << distancia << endl;\n  cout << inicial << endl;\n  return 0;\n}",
  },

  /* ------------------------ Módulo 2 · Entrada y salida ----------------------- */

  "leer-datos-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "17 25\n", expectedOutput: "42" },
      { id: "ejemplo-2", stdin: "100 -30\n", expectedOutput: "70" },
      { id: "oculto-ceros", stdin: "0 0\n", expectedOutput: "0", hidden: true },
      { id: "oculto-grandes", stdin: "123456 654321\n", expectedOutput: "777777", hidden: true },
    ],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a + b << endl;\n  return 0;\n}",
  },

  "salida-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "1 2 3\n", expectedOutput: "2.00" },
      { id: "ejemplo-2", stdin: "7 8 10\n", expectedOutput: "8.33" },
      { id: "oculto-negativos", stdin: "-1 -2 -3\n", expectedOutput: "-2.00", hidden: true },
      { id: "oculto-redondeo", stdin: "1 1 2\n", expectedOutput: "1.33", hidden: true },
    ],
    solution:
      "#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n  int a, b, c;\n  cin >> a >> b >> c;\n  double media = (a + b + c) / 3.0;\n  cout << fixed << setprecision(2) << media << endl;\n  return 0;\n}",
  },

  /* -------------------------- Módulo 3 · Operadores -------------------------- */

  "aritmetica-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "17 5\n", expectedOutput: "3 2" },
      { id: "ejemplo-2", stdin: "20 4\n", expectedOutput: "5 0" },
      { id: "oculto-menos-que-ninos", stdin: "3 10\n", expectedOutput: "0 3", hidden: true },
      { id: "oculto-uno", stdin: "7 1\n", expectedOutput: "7 0", hidden: true },
    ],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int total, ninos;\n  cin >> total >> ninos;\n  cout << total / ninos << \" \" << total % ninos << endl;\n  return 0;\n}",
  },

  "logicos-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "7 1 10\n", expectedOutput: "1" },
      { id: "ejemplo-2", stdin: "15 1 10\n", expectedOutput: "0" },
      { id: "ejemplo-3", stdin: "10 1 10\n", expectedOutput: "1" },
      { id: "oculto-extremo-inferior", stdin: "1 1 10\n", expectedOutput: "1", hidden: true },
      { id: "oculto-negativos", stdin: "-5 -10 0\n", expectedOutput: "1", hidden: true },
    ],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n, bajo, alto;\n  cin >> n >> bajo >> alto;\n  cout << (n >= bajo && n <= alto) << endl;\n  return 0;\n}",
  },

  /* -------------------------- Módulo 4 · Decisiones -------------------------- */

  "if-else-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "4\n", expectedOutput: "par" },
      { id: "ejemplo-2", stdin: "7\n", expectedOutput: "impar" },
      { id: "ejemplo-3", stdin: "-3\n", expectedOutput: "impar" },
      { id: "oculto-cero", stdin: "0\n", expectedOutput: "par", hidden: true },
      { id: "oculto-negativo-par", stdin: "-8\n", expectedOutput: "par", hidden: true },
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  if (n % 2 == 0) {\n    cout << "par" << endl;\n  } else {\n    cout << "impar" << endl;\n  }\n  return 0;\n}',
  },

  "switch-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-suma", stdin: "10 3 +\n", expectedOutput: "13" },
      { id: "ejemplo-division", stdin: "10 3 /\n", expectedOutput: "3" },
      { id: "ejemplo-producto", stdin: "10 3 *\n", expectedOutput: "30" },
      { id: "oculto-resta", stdin: "10 3 -\n", expectedOutput: "7", hidden: true },
      { id: "oculto-negativos", stdin: "-4 2 *\n", expectedOutput: "-8", hidden: true },
    ],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  char op;\n  cin >> a >> b >> op;\n  switch (op) {\n    case '+': cout << a + b << endl; break;\n    case '-': cout << a - b << endl; break;\n    case '*': cout << a * b << endl; break;\n    case '/': cout << a / b << endl; break;\n  }\n  return 0;\n}",
  },

  /* ---------------------------- Módulo 5 · Bucles ---------------------------- */

  "for-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "5\n", expectedOutput: "15" },
      { id: "ejemplo-2", stdin: "1\n", expectedOutput: "1" },
      { id: "ejemplo-3", stdin: "100\n", expectedOutput: "5050" },
      { id: "oculto-grande", stdin: "1000\n", expectedOutput: "500500", hidden: true },
    ],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  long long suma = 0;\n  for (int i = 1; i <= n; i++) suma += i;\n  cout << suma << endl;\n  return 0;\n}",
  },

  "while-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "237\n", expectedOutput: "3" },
      { id: "ejemplo-2", stdin: "5\n", expectedOutput: "1" },
      { id: "ejemplo-3", stdin: "1000000\n", expectedOutput: "7" },
      { id: "oculto-nueve", stdin: "9\n", expectedOutput: "1", hidden: true },
      { id: "oculto-diez", stdin: "10\n", expectedOutput: "2", hidden: true },
    ],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  int cifras = 0;\n  while (n > 0) {\n    cifras++;\n    n /= 10;\n  }\n  cout << cifras << endl;\n  return 0;\n}",
  },

  "acumuladores-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "5\n3 9 4 1 7\n", expectedOutput: "9" },
      { id: "ejemplo-2", stdin: "3\n-5 -2 -9\n", expectedOutput: "-2" },
      { id: "oculto-uno", stdin: "1\n-100\n", expectedOutput: "-100", hidden: true },
      { id: "oculto-primero-mayor", stdin: "4\n50 1 2 3\n", expectedOutput: "50", hidden: true },
    ],
    solution:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  int maximo;\n  cin >> maximo;\n  for (int i = 1; i < n; i++) {\n    int x;\n    cin >> x;\n    if (x > maximo) maximo = x;\n  }\n  cout << maximo << endl;\n  return 0;\n}",
  },

  /* --------------------------- Módulo 6 · Funciones -------------------------- */

  "funciones-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-primo", stdin: "7\n", expectedOutput: "si" },
      { id: "ejemplo-compuesto", stdin: "9\n", expectedOutput: "no" },
      { id: "ejemplo-uno", stdin: "1\n", expectedOutput: "no" },
      { id: "ejemplo-dos", stdin: "2\n", expectedOutput: "si" },
      { id: "oculto-cuadrado", stdin: "49\n", expectedOutput: "no", hidden: true },
      { id: "oculto-primo-grande", stdin: "7919\n", expectedOutput: "si", hidden: true },
    ],
    solution:
      '#include <iostream>\nusing namespace std;\n\nbool esPrimo(int n) {\n  if (n < 2) return false;\n  for (int d = 2; d * d <= n; d++) {\n    if (n % d == 0) return false;\n  }\n  return true;\n}\n\nint main() {\n  int n;\n  cin >> n;\n  cout << (esPrimo(n) ? "si" : "no") << endl;\n  return 0;\n}',
  },

  /* -------------------------- Módulo 7 · Colecciones ------------------------- */

  "vector-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "5\n1 2 3 4 5\n", expectedOutput: "5 4 3 2 1" },
      { id: "ejemplo-2", stdin: "3\n7 -2 9\n", expectedOutput: "9 -2 7" },
      { id: "oculto-uno", stdin: "1\n42\n", expectedOutput: "42", hidden: true },
    ],
    solution:
      '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  vector<int> v(n);\n  for (int i = 0; i < n; i++) cin >> v[i];\n  for (int i = n - 1; i >= 0; i--) {\n    cout << v[i];\n    if (i > 0) cout << " ";\n  }\n  cout << endl;\n  return 0;\n}',
  },

  "recorrer-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "5\n1 2 3 4 5\n", expectedOutput: "2" },
      { id: "ejemplo-2", stdin: "4\n10 10 10 10\n", expectedOutput: "0" },
      { id: "ejemplo-3", stdin: "3\n1 2 9\n", expectedOutput: "1" },
      { id: "oculto-negativos", stdin: "4\n-10 -20 -30 -40\n", expectedOutput: "2", hidden: true },
    ],
    solution:
      "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  vector<int> v(n);\n  long long suma = 0;\n  for (int i = 0; i < n; i++) {\n    cin >> v[i];\n    suma += v[i];\n  }\n  double media = (double)suma / n;\n  int cuantos = 0;\n  for (int x : v) {\n    if (x > media) cuantos++;\n  }\n  cout << cuantos << endl;\n  return 0;\n}",
  },

  "strings-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "programacion\n", expectedOutput: "5" },
      { id: "ejemplo-2", stdin: "ritmo\n", expectedOutput: "2" },
      { id: "ejemplo-3", stdin: "xyz\n", expectedOutput: "0" },
      { id: "oculto-todas", stdin: "aeiou\n", expectedOutput: "5", hidden: true },
      { id: "oculto-larga", stdin: "murcielago\n", expectedOutput: "5", hidden: true },
    ],
    solution:
      "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  string palabra;\n  cin >> palabra;\n  int vocales = 0;\n  for (char c : palabra) {\n    if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') vocales++;\n  }\n  cout << vocales << endl;\n  return 0;\n}",
  },

  /* --------------------------- Módulo 8 · STL esencial ----------------------- */

  "ordenar-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "5\n5 2 9 1 7\n", expectedOutput: "5" },
      { id: "ejemplo-2", stdin: "3\n10 -4 2\n", expectedOutput: "2" },
      { id: "ejemplo-3", stdin: "1\n42\n", expectedOutput: "42" },
      { id: "oculto-ordenado", stdin: "5\n1 2 3 4 5\n", expectedOutput: "3", hidden: true },
      { id: "oculto-repetidos", stdin: "5\n4 4 4 1 9\n", expectedOutput: "4", hidden: true },
    ],
    solution:
      "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  vector<int> v(n);\n  for (int i = 0; i < n; i++) cin >> v[i];\n  sort(v.begin(), v.end());\n  cout << v[n / 2] << endl;\n  return 0;\n}",
  },

  "set-desafio": {
    limits: defaultLimits,
    tests: [
      { id: "ejemplo-1", stdin: "5\n1 2 2 3 1\n", expectedOutput: "3" },
      { id: "ejemplo-2", stdin: "4\n7 7 7 7\n", expectedOutput: "1" },
      { id: "ejemplo-3", stdin: "3\n5 -5 0\n", expectedOutput: "3" },
      { id: "oculto-uno", stdin: "1\n99\n", expectedOutput: "1", hidden: true },
      {
        id: "oculto-todos-distintos",
        stdin: "6\n10 20 30 40 50 60\n",
        expectedOutput: "6",
        hidden: true,
      },
    ],
    solution:
      "#include <iostream>\n#include <set>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  set<int> vistos;\n  for (int i = 0; i < n; i++) {\n    int x;\n    cin >> x;\n    vistos.insert(x);\n  }\n  cout << vistos.size() << endl;\n  return 0;\n}",
  },
};

export function getTestSuite(challengeId: string): ChallengeTestSuite | undefined {
  return suites[challengeId];
}

/** Identificadores de todos los desafíos con casos definidos. */
export function getChallengeIds(): string[] {
  return Object.keys(suites);
}
