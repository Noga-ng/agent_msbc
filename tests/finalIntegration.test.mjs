import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const read = path => readFileSync(new URL(`../${path}`, import.meta.url),"utf8");
const js = ts.transpileModule(read("src/components/Membres/memberSearch.ts"), {
  compilerOptions: {module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022},
}).outputText;
// Réutilise la vraie normalisation du contrat d'adhésion, sans simuler d'anciens statuts.
const normalizedJs = ts.transpileModule(read("src/service/memberRules.ts"), {
  compilerOptions: {module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022},
}).outputText;
const statusFn = normalizedJs.match(/export function normalizeMemberStatus[\s\S]*?\n\}/)?.[0];
assert.ok(statusFn, "Normalisation des statuts introuvable");
const moduleText = js.replace(/^import \{ normalizeMemberStatus \} from .*?;$/m,
  statusFn.replace(/^export /, ""));
const {filterApiMembers} = await import(`data:text/javascript;base64,${Buffer.from(moduleText).toString("base64")}`);
const examples = [
  {noms:"RABÉ",prenoms:"Soa",telephone:"034 55 123 45",identifiant:"M-1",cin:"301002003004",status:"20250443566",categorie:"Ankohonana",adresse:"Toamasina"},
  {noms:"RANDRIA",prenoms:"Hery",identifiant:"M-2",status:null,categorie:"Salam@"},
];
test("recherche insensible aux accents, casse et ordre des mots", () => {
  assert.equal(filterApiMembers(examples,"rabe soa","all").length,1);
  assert.equal(filterApiMembers(examples,"SOA RABE","all").length,1);
  assert.equal(filterApiMembers(examples,"03455","all").length,1);
  assert.equal(filterApiMembers(examples,"301002","all").length,1);
  assert.equal(filterApiMembers(examples,"", "all").length,2);
});
test("filtre statut sur résultats de l'API", () => {
  assert.deepEqual(filterApiMembers(examples,"", "active").map(m=>m.identifiant),["M-1"]);
  assert.deepEqual(filterApiMembers(examples,"rabe", "pending"),[]);
});
test("aucune persistance des données locales dans l'application", () => {
  const sources = (dir) => readdirSync(new URL(`../${dir}/`,import.meta.url),{withFileTypes:true}).flatMap(ent=>ent.isDirectory()?sources(`${dir}/${ent.name}`):ent.name.endsWith(".ts")||ent.name.endsWith(".tsx") ? [`${dir}/${ent.name}`]:[]);
  for(const file of sources("src")) assert.doesNotMatch(read(file),/\b(?:localStorage|sessionStorage|indexedDB)\b/,file);
  assert.match(read("src/components/Compte/Compte.tsx"),/"\/auth\/profile"/);
  assert.match(read("src/components/Membres/Membres.tsx"),/recuperationMembres/);
});
test("navigation animée et loaders accessibles",()=>{
  assert.match(read("src/components/NavBar/NavBar.tsx"),/motion\.aside/);
  assert.match(read("src/components/NavBar/NavBar.tsx"),/aria-expanded=/);
  assert.match(read("src/components/Loaders/LoadingState.tsx"),/role="status"/);
});
