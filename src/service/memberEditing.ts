import type { FormInsert } from "../components/Inscriptions/Inputs/TypeInput";
import { EmptyForm } from "../components/Inscriptions/Inputs/TypeInput";
import { memberAge, type MemberKind } from "./memberRules";

/** Les noms de propriétés ci-dessous correspondent aux formulaires d'inscription MSBC. */
export const categoryNumbers: Record<string, number> = {
  "salam@": 5,
  "salam@be": 6,
  "ankohonanasalam@": 7,
  "ankohonanasalam@be": 8,
};

export function categoryNumber(value: unknown): number {
  if (typeof value === "number" && [5, 6, 7, 8].includes(value)) return value;
  if (typeof value !== "string") return 0;
  if (["5", "6", "7", "8"].includes(value.trim())) return Number(value);
  return categoryNumbers[value.toLowerCase().replace(/\s+/g, "")] ?? 0;
}

export function dateForInput(value: unknown): string {
  if (typeof value !== "string") return "";
  const date = value.trim();
  const iso = /^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/.exec(date);
  if (iso) return iso[1];
  // Les formats ambigus ne sont pas devinés : l'utilisateur peut les corriger.
  return "";
}

function field(record: Record<string, unknown>, ...names: string[]): string {
  for (const name of names) {
    const value = record[name];
    if (typeof value === "string" || typeof value === "number")
      return String(value);
  }
  return "";
}

/**
 * Certaines réponses PHP renvoient les deux téléphones dans `telephone`,
 * séparés par une virgule. On répartit ces valeurs sans modifier la source.
 */
export function memberPhones(record: Record<string, unknown>): {
  telephone: string;
  telephone2: string;
} {
  const raw = field(record, "telephone").trim();
  if (raw.includes(",")) {
    const [telephone = "", telephone2 = ""] = raw.split(",");
    return { telephone: telephone.trim(), telephone2: telephone2.trim() };
  }
  return {
    telephone: raw,
    telephone2: field(record, "telephone2", "telephone_secondaire").trim(),
  };
}

/** Préremplit uniquement les champs que l'API retourne. Jamais de valeurs fictives. */
export function memberToForm(record: Record<string, unknown>): FormInsert {
  const naissance = dateForInput(
    record.naissance ?? record.dateNaissance ?? record.date_naissance,
  );
  const { telephone, telephone2 } = memberPhones(record);
  return {
    ...EmptyForm(),
    noms: field(record, "noms", "nom"),
    prenoms: field(record, "prenoms", "prenom"),
    naissance,
    age: memberAge(naissance) ?? 0,
    genre: (() => {
      const raw = field(record, "genre", "sexe").toLowerCase().trim();
      return ["femme", "féminin", "f", "female"].includes(raw)
        ? "femme"
        : ["homme", "masculin", "m", "male"].includes(raw)
          ? "homme"
          : raw;
    })(),
    lieu: field(record, "lieu", "lieuNaissance", "lieu_naissance"),
    profession: field(record, "profession", "school", "ecole"),
    origine: field(record, "origine"),
    telephone,
    telephone2,
    famille: field(record, "famille", "telephone_famille"),
    cin: field(record, "cin"),
    delivrance: dateForInput(
      record.delivrance ?? record.dateDelivrance ?? record.date_delivrance,
    ),
    adresse: field(record, "adresse"),
    arrondissement: field(record, "arrondissement"),
    district: field(record, "district"),
    region: field(record, "region"),
    categorie: categoryNumber(record.categorie),
  };
}

export const editableFields = [
  "noms",
  "prenoms",
  "naissance",
  "genre",
  "lieu",
  "profession",
  "origine",
  "telephone",
  "telephone2",
  "famille",
  "cin",
  "delivrance",
  "adresse",
  "arrondissement",
  "district",
  "region",
  "categorie",
] as const;

export function changedMemberFields(
  original: FormInsert,
  draft: FormInsert,
  kind: MemberKind,
): FormData {
  const form = new FormData();
  for (const key of editableFields) {
    if (key === "categorie" && kind !== "titulaire") continue;
    // Champs résidentiels réservés au titulaire dans le formulaire actuel.
    if (
      kind !== "titulaire" &&
      ["adresse", "arrondissement", "district", "region"].includes(key)
    )
      continue;
    if (draft[key] !== original[key])
      form.append(key, String(draft[key] ?? ""));
  }
  if (draft.naissance !== original.naissance)
    form.append("age", String(memberAge(draft.naissance) ?? 0));
  if (draft.photo instanceof File)
    form.append("photo", draft.photo, draft.photo.name);
  return form;
}
