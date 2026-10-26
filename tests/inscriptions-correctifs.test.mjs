import {
  test
} from 'node:test';
import assert from 'node:assert/strict';
import {
  readFileSync
} from 'node:fs';
import {
  createRequire
} from 'node:module';
const require = createRequire(
  import.meta.url);
const ts = require('typescript');
const read = path => readFileSync(new URL(`../${path}`,
  import.meta.url), 'utf8');
const transpile = path => ts.transpileModule(read(path), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  },
}).outputText;
const dynamicModule = js => import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const rules = await dynamicModule(transpile('src/service/memberRules.ts'));
const {
  validBirthDate,
  memberAge,
  localToday,
  validateMemberInput,
  validateMemberForm
} = rules;
const today = localToday();
const adult = {
  noms: 'RASOANAIVO',
  prenoms: 'Lova',
  naissance: '2000-01-01',
  age: 25,
  genre: 'femme',
  cin: '301123456789',
  delivrance: '2020-02-01',
  telephone: '0341234567',
  telephone2: '',
  famille: '',
  adresse: 'Tanamborozano C5',
  arrondissement: 'ankirihiry',
  district: 'toamasina I',
  region: 'Atsinanana',
};
const child = {
  ...adult,
  naissance: '2018-05-01',
  cin: '',
  delivrance: '',
  telephone: '',
  famille: '0341234567'
};

test('la date locale du jour est valide même avant midi', () => {
  assert.equal(validBirthDate(today), true);
  assert.equal(memberAge(today), 0);
  const future = new Date();
  future.setDate(future.getDate() + 1);
  const tomorrow = `${future.getFullYear()}-${String(future.getMonth()+1).padStart(2,'0')}-${String(future.getDate()).padStart(2,'0')}`;
  assert.equal(validBirthDate(tomorrow), false);
  assert.equal(validBirthDate('2025-02-29'), false);
});
test('titulaire : adresse, arrondissement, district, région sont obligatoires étape 2', () => {
  assert.equal(validateMemberInput(adult, 'titulaire', 2, 7, undefined, 'major'), null);
  for (const field of ['adresse', 'arrondissement', 'district', 'region']) {
    const copy = {
      ...adult,
      [field]: ' '
    };
    assert.ok(validateMemberInput(copy, 'titulaire', 2, 7, undefined, 'major'), field);
    assert.equal(validateMemberForm(copy, 'titulaire', 7, undefined, 'major')?.step, 2);
  }
});
test('enfant et conjoint gardent seulement leurs étapes utiles', () => {
  assert.equal(validateMemberForm(child, 'enfant', undefined, 'A123'), null);
  assert.equal(validateMemberForm({
    ...adult,
    adresse: ''
  }, 'conjoint', undefined, 'A123'), null);
  assert.match(validateMemberInput(child, 'conjoint', 1, undefined, 'A123'), /18 ans/);
  assert.match(validateMemberInput(adult, 'enfant', 1, undefined, 'A123'), /moins de 18/);
});
test('téléphone titulaire facultatif et contact enfant obligatoire', () => {
  assert.equal(validateMemberInput({
    ...adult,
    telephone: ''
  }, 'titulaire', 3, 7, undefined, 'major'), null);
  assert.match(validateMemberInput({
    ...adult,
    telephone: 'incorrect'
  }, 'titulaire', 3, 7, undefined, 'major'), /téléphone/);
  assert.match(validateMemberInput({
    ...child,
    famille: ''
  }, 'enfant', 3, undefined, 'A123'), /au moins un contact/);
  assert.equal(validateMemberInput({
    ...child,
    famille: '',
    telephone: '0341234567'
  }, 'enfant', 3, undefined, 'A123'), null);
});
test('CIN facultatif mais format et date associée contrôlés', () => {
  assert.equal(validateMemberInput({
    ...adult,
    cin: '',
    delivrance: ''
  }, 'titulaire', 1, 7, undefined, 'major'), null);
  assert.match(validateMemberInput({
    ...adult,
    cin: '123'
  }, 'titulaire', 1, 7, undefined, 'major'), /12 chiffres/);
  assert.match(validateMemberInput({
    ...adult,
    cin: '',
    delivrance: '2020-01-01'
  }, 'titulaire', 1, 7, undefined, 'major'), /CIN associé/);
});

const simulatedClient = {
  post: async () => {
    throw new Error('Not configured');
  }
};
class FakeReqError extends Error {
  constructor(message, status = null, data = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
globalThis.__msbcFormsTest = {
  simulatedClient,
  FakeReqError
};
const registration = await dynamicModule(transpile('src/service/memberRegistration.ts')
  .replace(/import \{ ReqError \} from "\.\.\/libs\/Noga_Http";/, 'const {FakeReqError:ReqError} = globalThis.__msbcFormsTest;')
  .replace(/import client from "\.\/Client";/, 'const client = globalThis.__msbcFormsTest.simulatedClient;'));
const {
  createdIdentifier,
  registerMember
} = registration;

test('identifiants serveur strictement validés', () => {
  assert.equal(createdIdentifier('MSBC-123'), 'MSBC-123');
  assert.equal(createdIdentifier({
    identifiant: 'AG_44'
  }), 'AG_44');
  assert.equal(createdIdentifier({
    id: 42
  }), '42');
  assert.equal(createdIdentifier(''), null);
  assert.equal(createdIdentifier('../admin'), null);
  assert.equal(createdIdentifier(null), null);
});
test('confirmation positive PHP sans ID ne produit pas de fausse fiche', async () => {
  simulatedClient.post = async () => ({
    ok: true,
    status: 200,
    data: {
      status: true,
      message: 'OK'
    }
  });
  const result = await registerMember('/insertMembres', new FormData());
  assert.equal(result.id, null);
  assert.equal(result.message, 'OK');
});
test('les réponses HTTP 409 et 422 affichent le vrai rejet PHP', async () => {
  simulatedClient.post = async () => ({
    ok: false,
    status: 409,
    data: {
      status: false,
      message: 'CIN déjà inscrit'
    }
  });
  await assert.rejects(registerMember('/insertMembres', new FormData()), /CIN déjà inscrit/);
  simulatedClient.post = async () => ({
    ok: false,
    status: 422,
    data: {
      status: false,
      message: 'Date incohérente'
    }
  });
  await assert.rejects(registerMember('/insertMembres', new FormData()), /Date incohérente/);
});
test('erreurs serveur, session expirée, réseau et réponse invalide', async () => {
  simulatedClient.post = async () => ({
    ok: false,
    status: 401,
    data: {
      status: false,
      message: 'no'
    }
  });
  await assert.rejects(registerMember('/insertMembres', new FormData()), /Session expirée/);
  simulatedClient.post = async () => {
    throw new FakeReqError('server', 503);
  };
  await assert.rejects(registerMember('/insertMembres', new FormData()), /Connexion au serveur.*impossible/i);
  simulatedClient.post = async () => ({
    ok: true,
    status: 200,
    data: {
      status: false,
      message: 'Non autorisé'
    }
  });
  await assert.rejects(registerMember('/insertMembres', new FormData()), /Non autorisé/);
});
test('trois formulaires utilisent la validation et l’envoi partagés', () => {
  for (const file of ['Titulaire', 'Conjoint', 'Enfants']) {
    const source = read(`src/components/Inscriptions/${file}.tsx`);
    assert.match(source, /validateMemberForm\(/);
    assert.match(source, /registerMember\(/);
    assert.match(source, /photoProcessing/);
  }
  assert.match(read('src/components/Inscriptions/useFamilyHolder.ts'), /hasConjoint/);
  assert.match(read('src/service/ResizeImg.ts'), /\.jpg/);
});