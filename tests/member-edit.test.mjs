import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const transpile = path => ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const load = src => import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
const empty = () => ({ noms:'', prenoms:'', naissance:'', age:0, genre:'', lieu:'', profession:'', photo:null, origine:'',
  telephone:'', telephone2:'', famille:'', cin:'', delivrance:'', adresse:'', arrondissement:'', district:'', region:'', categorie:0, users:0 });
globalThis.__editTest = { empty, memberAge: birth => birth ? 20 : null };
const memberEditing = await load(transpile('src/service/memberEditing.ts')
  .replace(/import \{ EmptyForm \} from "\.\.\/components\/Inscriptions\/Inputs\/TypeInput";/,
    'const EmptyForm = globalThis.__editTest.empty;')
  .replace(/import \{ memberAge \} from "\.\/memberRules";/,
    'const memberAge = globalThis.__editTest.memberAge;'));
const {memberToForm, categoryNumber, dateForInput, changedMemberFields} = memberEditing;

const original = memberToForm({ identifiant:'399248485095', noms:'RAKOTO', prenoms:'Soa', naissance:'1989-10-03',
  genre:'femme', telephone:'0341234567', categorie:'Ankohonana Salam@', adresse:'Tanamborozano',
  arrondissement:'ankirihiry', district:'toamasina I', region:'Atsinanana', photo:'old.jpeg' });

test('catégories réelles et dates PHP vers HTML', () => {
  assert.equal(categoryNumber('Ankohonana Salam@Be'),8);
  assert.equal(categoryNumber('Salam@'),5);
  assert.equal(categoryNumber('???'),0);
  assert.equal(dateForInput('1992-03-04 07:34:13'),'1992-03-04');
  assert.equal(dateForInput('04/03/1992'),'');
});
test('le formulaire se préremplit depuis PHP sans valeurs imaginaires', () => {
  assert.equal(original.noms,'RAKOTO');
  assert.equal(original.categorie,7);
  assert.equal(original.photo,null);
  assert.equal(original.cin,'');
  assert.equal(original.region,'Atsinanana');
});
test('une mise à jour partielle ne touche pas les champs inchangés', () => {
  const changed = changedMemberFields(original, { ...original, telephone:'0336543210' },'titulaire');
  assert.deepEqual([...changed.keys()],['telephone']);
  assert.equal(changed.get('telephone'),'0336543210');
  assert.equal(changed.has('photo'),false);
  assert.equal(changed.has('cin'),false);
});
test('champs du titulaire exclus des modifications enfant/conjoint', () => {
  const changed = changedMemberFields(original, {...original, adresse:'autre', noms:'RANDRIA'},'enfant');
  assert.deepEqual([...changed.keys()],['noms']);
});
test('nouvelle photo seulement lorsque demandée', () => {
  const image = new File(['abc'],'nouvelle.jpg',{type:'image/jpeg'});
  const changed = changedMemberFields(original,{...original,photo:image},'titulaire');
  assert.equal(changed.get('photo').name,'nouvelle.jpg');
});

const simulatedClient = { post: async () => { throw new Error('not mocked'); } };
class FakeReqError extends Error { constructor(status, data=null) { super('request'); this.status=status;this.data=data; } }
globalThis.__editTest.simulatedClient = simulatedClient;
globalThis.__editTest.FakeReqError = FakeReqError;
globalThis.__editTest.env = {};
const service = await load(transpile('src/service/memberUpdateApi.ts')
  .replace('import { ReqError } from "../libs/Noga_Http";', 'const ReqError = globalThis.__editTest.FakeReqError;')
  .replace('import client from "./Client";', 'const client = globalThis.__editTest.simulatedClient;')
  .replace(/import\.meta\.env/g, 'globalThis.__editTest.env'));
const {updateEndpoint, updateMember} = service;
test('endpoints PHP réservés aux trois types et URL paramétrable', () => {
  assert.equal(updateEndpoint('titulaire','399248485095'),'/updateMembres');
  assert.equal(updateEndpoint('conjoint','C14'),'/updateMembres/conjoint');
  assert.equal(updateEndpoint('enfant','E22','/membres/{id}/update'),'/membres/E22/update');
  assert.throws(() => updateEndpoint('titulaire','A','https://evil.example'),/invalide/);
});
test('le POST multipart n’envoie pas une identité du compte arbitraire', async () => {
  let observed;
  simulatedClient.post = async (...args) => { observed=args; return {ok:true,status:200,data:{status:true,message:'Sauvegardé'}}; };
  const changed = new FormData();changed.set('telephone','0321234567');
  const message = await updateMember('enfant','E2','399248485095',changed,'csrf-stub');
  assert.equal(message,'Sauvegardé');
  assert.equal(observed[0],'/updateMembres/enfants');
  assert.equal(observed[1].get('identifiant'),'E2');
  assert.equal(observed[1].get('idTitulaire'),'399248485095');
  assert.equal(observed[1].get('telephone'),'0321234567');
  assert.equal(observed[1].has('users'),false);
  assert.equal(observed[2].headers['X-CSRF-Token'],'csrf-stub');
});
test('réponses PHP négatives, endpoint absent et absence de changement ne sont pas simulés comme succès', async () => {
  const changed = new FormData();changed.append('noms','AAAA');
  simulatedClient.post = async () => ({ok:false,status:404,data:{status:false}});
  await assert.rejects(updateMember('titulaire','A','A',changed),/404\/405/);
  simulatedClient.post = async () => ({ok:false,status:422,data:{status:false,message:'CIN invalide'}});
  await assert.rejects(updateMember('titulaire','A','A',changed),/CIN invalide/);
  simulatedClient.post = async () => ({ok:true,status:200,data:{status:false,message:'Rejeté'}});
  await assert.rejects(updateMember('titulaire','A','A',changed),/Rejeté/);
  simulatedClient.post = async () => {throw new FakeReqError(401)};
  await assert.rejects(updateMember('titulaire','A','A',changed),/Session expirée/);
  await assert.rejects(updateMember('titulaire','A','A',new FormData()),/Aucune modification/);
});

test('les trois boutons Modifier et les routes protégées existent', () => {
  const app=read('src/App.tsx');
  assert.match(app,/membres\/:id\/modifier/);
  assert.match(app,/membres\/:id\/modifier-conjoint\/:personId/);
  assert.match(app,/membres\/:id\/modifier-enfant\/:personId/);
  for (const file of ['MemberState.tsx','ConjointState.tsx','EnfantsState.tsx']) assert.match(read(`src/components/Membres/${file}`),/member-profile-edit/);
});
