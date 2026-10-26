import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const text = path => readFileSync(new URL(`../${path}`, import.meta.url),'utf8');
test('les routes agents privées sont imbriquées sous ProtectedRoute', () => {
  const routes=text('src/App.tsx');
  assert.match(routes, /element=\{<ProtectedRoute\s*\/>\}/);
  for(const path of ['dashboard','inscription','membres','membres/:id','membres/:id/ajouter-conjoint','membres/:id/ajouter-enfant','compte']) {
    assert.ok(routes.includes(`path="${path}"`),`route ${path}`);
  }
  assert.ok(!routes.includes('path="membres/edit"'));
});
test('rattachement géré par route et fiche API plutôt que par stockage local', () => {
  for(const path of ['src/components/Inscriptions/Conjoint.tsx','src/components/Inscriptions/Enfants.tsx']) {
    const source=text(path);
    assert.match(source,/useFamilyHolder\(/);
    assert.doesNotMatch(source,/localStorage.*idTitulaire/);
  }
  assert.match(text('src/components/Inscriptions/useFamilyHolder.ts'),/\/membres\/\$\{encodeURIComponent\(id\)\}/);
});
test('les données personnelles fictives ont été retirées du compte et de la navigation', () => {
  assert.doesNotMatch(text('src/components/Compte/Compte.tsx'),/0340488021|301031028609|"germainio"/i);
  assert.doesNotMatch(text('src/components/NavBar/NavBar.tsx'),/import noga from/);
});
test('le code HTTP limite les retries aux requêtes idempotentes', () => {
  assert.match(text('src/libs/Noga_Http.ts'),/const retryCount\s*=\s*\["GET", "HEAD", "OPTIONS"\]/);
  assert.match(text('src/libs/Noga_Http.ts'),/2 \*\* attempt/);
});
