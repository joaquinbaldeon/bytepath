export type DiffRow = {
  actual: string | null;
  expected: string | null;
  match: boolean;
};

export type OutputComparisonResult = {
  rows: DiffRow[];
  matches: boolean;
  /**
   * Las salidas solo se diferencian en espacios. Es el tropiezo clásico al
   * empezar, y merece un aviso propio en vez de un "no coincide" a secas.
   */
  whitespaceOnly: boolean;
};

/** Normaliza saltos de línea, espacios finales y líneas vacías del final. */
function normalize(text: string): string[] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""));

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

export function compareOutputs(actual: string, expected: string): OutputComparisonResult {
  const actualLines = normalize(actual);
  const expectedLines = normalize(expected);
  const rows: DiffRow[] = [];

  for (let i = 0; i < Math.max(actualLines.length, expectedLines.length); i++) {
    const actualLine = i < actualLines.length ? actualLines[i] : null;
    const expectedLine = i < expectedLines.length ? expectedLines[i] : null;
    rows.push({
      actual: actualLine,
      expected: expectedLine,
      match: actualLine === expectedLine,
    });
  }

  const matches = rows.length > 0 && rows.every((row) => row.match);
  const withoutSpaces = (text: string) => text.replace(/\s+/g, "");

  return {
    rows,
    matches,
    whitespaceOnly: !matches && withoutSpaces(actual) === withoutSpaces(expected),
  };
}
