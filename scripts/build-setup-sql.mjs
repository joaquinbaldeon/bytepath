// Junta security.sql + energy.sql + economy.sql + progress.sql + legal.sql + auth-guard.sql, en ese orden, en supabase/setup.sql:
// un solo archivo para pegar en el SQL Editor de Supabase (después de schema.sql).
// Uso: npm run db:bundle
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = new URL("../supabase/", import.meta.url);
const parts = ["security.sql", "energy.sql", "economy.sql", "progress.sql", "legal.sql", "auth-guard.sql"];

const header = `-- ===========================================================================
-- BytePath · setup.sql
--
-- GENERADO por \`npm run db:bundle\` a partir de security.sql, energy.sql,
-- economy.sql, progress.sql, legal.sql y auth-guard.sql. No lo edites a mano: edita esos
-- archivos y vuelve a generarlo.
--
-- Cómo usarlo: pégalo ENTERO en el SQL Editor del proyecto de Supabase que usa
-- BytePath (el de NEXT_PUBLIC_SUPABASE_URL), DESPUÉS de schema.sql, y ejecútalo.
-- Es idempotente y no destruye datos: CREATE ... IF NOT EXISTS, CREATE OR
-- REPLACE y ADD COLUMN IF NOT EXISTS. Si algo falla, no se aplica NADA (el
-- editor ejecuta el texto como una sola transacción).
--
-- Después, ejecuta verify.sql para comprobar que todo quedó como debe.
-- ===========================================================================

`;

const body = parts
  .map((name) => {
    const text = readFileSync(new URL(name, dir), "utf8").replace(/^﻿/, "").trimEnd();
    return `-- ---------------------------------------------------------------------------\n-- >>> ${name}\n-- ---------------------------------------------------------------------------\n\n${text}\n`;
  })
  .join("\n\n");

const out = new URL("setup.sql", dir);
writeFileSync(out, header + body);
console.log(`Escrito ${fileURLToPath(out)} (${(header + body).length} caracteres)`);
