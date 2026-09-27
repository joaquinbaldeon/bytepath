// Validación en el SERVIDOR de las dos casillas del registro (src/lib/auth/signup-consents.ts).
// Es la función que usa `signUpAction`; se le pasa un FormData real, igual que el que recibe la
// Server Action, incluidas peticiones manipuladas que el formulario nunca enviaría.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AGE_CONFIRMATION_FIELD,
  checkSignUpConsents,
  SIGNUP_CONSENT_ERRORS,
  TERMS_ACCEPTANCE_FIELD,
} from "../src/lib/auth/signup-consents.ts";

function form(fields) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

test("1) 14+ confirmado y Términos aceptados → permitido", () => {
  assert.equal(checkSignUpConsents(form({ confirmAge: "on", acceptTerms: "on" })), null);
});

test("2) sin aceptar los Términos → rechazado", () => {
  assert.equal(checkSignUpConsents(form({ confirmAge: "on" })), SIGNUP_CONSENT_ERRORS.terms);
});

test("3) sin confirmar 14+ → rechazado", () => {
  assert.equal(checkSignUpConsents(form({ acceptTerms: "on" })), SIGNUP_CONSENT_ERRORS.age);
});

test("4) petición manipulada: cualquier valor distinto de 'on' no cuenta como confirmación", () => {
  for (const forged of ["", "true", "1", "ON", "yes", "on ", "off", "false"]) {
    assert.equal(
      checkSignUpConsents(form({ confirmAge: forged, acceptTerms: "on" })),
      SIGNUP_CONSENT_ERRORS.age,
      `confirmAge=${JSON.stringify(forged)} no debería aceptarse`,
    );
  }
  const file = new FormData();
  file.append("confirmAge", new Blob(["on"]), "on");
  file.append("acceptTerms", "on");
  assert.equal(checkSignUpConsents(file), SIGNUP_CONSENT_ERRORS.age, "un archivo no es una casilla marcada");
});

test("8) las dos casillas son independientes: una no suple a la otra", () => {
  assert.equal(checkSignUpConsents(form({ confirmAge: "on", acceptTerms: "true" })), SIGNUP_CONSENT_ERRORS.terms);
  assert.equal(checkSignUpConsents(form({ confirmAge: "true", acceptTerms: "on" })), SIGNUP_CONSENT_ERRORS.age);
  assert.equal(checkSignUpConsents(form({})), SIGNUP_CONSENT_ERRORS.age);
  assert.notEqual(AGE_CONFIRMATION_FIELD, TERMS_ACCEPTANCE_FIELD);
});

test("los mensajes no atribuyen la edad a la ley", () => {
  for (const message of Object.values(SIGNUP_CONSENT_ERRORS)) {
    assert.doesNotMatch(message, /ley|legal|29733/i);
  }
});
