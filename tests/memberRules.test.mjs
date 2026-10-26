import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../src/service/memberRules.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { memberAge, validBirthDate, normalizeMemberStatus, memberStatusLabel, validateMemberInput } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const adult = { noms: "RANDRIA", prenoms: "Soa", naissance: "1998-10-21", age: 28, genre: "femme", cin: "301234567890", delivrance: "2019-10-01", telephone: "034 12 345 67", telephone2: "", famille: "" };
const child = { ...adult, naissance: "2015-05-21", age: 11, cin: "", delivrance: "", telephone: "", famille: "0341234567" };
test("adhésion PHP : identifiant présent => actif, null => en attente", () => {
  assert.equal(normalizeMemberStatus("20250443566"), "active");
  assert.equal(normalizeMemberStatus("ADH-2026-001"), "active");
  assert.equal(normalizeMemberStatus(null), "pending");
  assert.equal(normalizeMemberStatus(""), "pending");
  assert.equal(normalizeMemberStatus("  "), "pending");
  assert.equal(memberStatusLabel("20250443566"), "Actif");
  assert.equal(memberStatusLabel(null), "En attente");
});

test("dates réelles et âges", () => {
  assert.equal(validBirthDate("2001-02-30"), false);
  assert.equal(validBirthDate("2099-01-01"), false);
  assert.equal(validBirthDate("2000-02-29"), true);
  assert.equal(memberAge(""), null);
});
test("titulaire majeur valide", () => {
  assert.equal(validateMemberInput(adult, "titulaire", 1, 7, undefined, "major"), null);
  assert.equal(validateMemberInput(adult, "titulaire", 3, 7, undefined, "major"), null);
});
test("mineur et adulte incompatibles à 18 ans", () => {
  assert.match(validateMemberInput(adult, "enfant", 1, undefined, "21"), /moins de 18/);
  assert.match(validateMemberInput(child, "conjoint", 1, undefined, "21"), /18 ans/);
  assert.equal(validateMemberInput(child, "enfant", 1, undefined, "21"), null);
});
test("rattachement et téléphone vérifiés", () => {
  assert.match(validateMemberInput(child, "enfant", 1, undefined, ""), /titulaire/);
  assert.match(validateMemberInput({ ...adult, telephone: "xx" }, "titulaire", 3, 7, undefined, "major"), /téléphone/);
  assert.match(validateMemberInput({ ...adult, cin: "42" }, "titulaire", 1, 7, undefined, "major"), /12 chiffres/);
});
