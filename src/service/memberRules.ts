export type MemberStatus = "active" | "pending";
export type MemberKind = "titulaire" | "conjoint" | "enfant";
export type Step = 1 | 2 | 3;

/** data[i].status : identifiant d'adhésion non vide ou null (API PHP). */
export function normalizeMemberStatus(value: unknown): MemberStatus {
  return typeof value === "string" && value.trim() !== ""
    ? "active"
    : "pending";
}

export function memberStatusLabel(value: unknown): string {
  return normalizeMemberStatus(value) === "active" ? "Actif" : "En attente";
}

export interface MemberInput {
  noms: string;
  prenoms: string;
  naissance: string;
  age: number;
  genre: string;
  cin?: string;
  delivrance?: string;
  telephone: string;
  telephone2: string;
  famille: string;
  adresse?: string;
  arrondissement?: string;
  district?: string;
  region?: string;
  photo?: File | null;
}

/** Date locale du jour, indépendante d'UTC et de l'heure courante. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function validBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
    && value <= localToday();
}

export function memberAge(value: string): number | null {
  if (!validBirthDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const now = new Date();
  let years = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) years--;
  return years;
}

const validPhone = (value: string) => /^\+?[\d\s().-]+$/.test(value) &&
  value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15;

/** Un message unique par étape évite que l'erreur soit cachée dans un autre onglet. */
export function validateMemberInput(
  input: MemberInput,
  kind: MemberKind,
  step: Step,
  category?: number,
  holderId?: string,
  ageCategory?: "minor" | "major"
): string | null {
  if (kind !== "titulaire" && !holderId?.trim()) return "Aucun titulaire de rattachement valide n'a été sélectionné.";
  if (step === 1) {
    if (kind === "titulaire" && ![5, 6, 7, 8].includes(category ?? 0)) 
      return "Choisissez une catégorie MSBC valide.";

    if (!input.noms.trim()) 
      return "Le nom est obligatoires.";

    if (input.noms.trim().length > 120 || input.prenoms.trim().length > 160) 
      return "Le nom ou les prénoms sont trop longs.";

    const years = memberAge(input.naissance);
    if (years === null || years > 120) 
      return "La date de naissance est invalide.";

    const minor = kind === "enfant" || (kind === "titulaire" && ageCategory === "minor");

    if (minor && years >= 18) 
      return "Ce formulaire est réservé aux personnes de moins de 18 ans.";

    if (!minor && years < 18) 
      return "Ce formulaire est réservé aux adultes de 18 ans ou plus.";

    if (!["femme", "homme"].includes(input.genre)) 
      return "Veuillez renseigner le genre.";

    const cin = input.cin?.trim() ?? "";
    if (cin && !/^\d{12}$/.test(cin)) 
      return "Le CIN doit contenir exactement 12 chiffres.";

    if (input.delivrance?.trim()) {
      if (!cin) 
        return "Renseignez le CIN associé à la date de délivrance.";

      if (!validBirthDate(input.delivrance) || input.delivrance < input.naissance)
        return "La date de délivrance du CIN est invalide.";
    }
  }
  if (step === 2 && kind === "titulaire") {
    if (!input.adresse?.trim()) return "L'adresse du titulaire est obligatoire.";
    if (!input.arrondissement?.trim()) return "Sélectionnez l'arrondissement.";
    if (!input.district?.trim()) return "Sélectionnez le district.";
    if (!input.region?.trim()) return "Sélectionnez la région.";
  }
  if (step === 3) {
    // if (kind !== "enfant" && !input.telephone.trim()) return "Le téléphone principal est obligatoire.";
    if (kind === "enfant" && !input.telephone.trim() && !input.famille.trim())
      return "Renseignez au moins un contact téléphonique pour l'enfant.";
    for (const phone of [input.telephone, input.telephone2, input.famille]) {
      if (phone?.trim() && !validPhone(phone.trim()))
        return "Le téléphone doit comporter entre 7 et 15 chiffres (espaces et + autorisés).";
    }
  }
  return null;
}

export function validateMemberForm(
  input: MemberInput, kind: MemberKind, category?: number, holderId?: string,
  ageCategory?: "minor" | "major"
): { step: Step; message: string } | null {
  const steps: Step[] = kind === "titulaire" ? [1, 2, 3] : [1, 3];
  for (const step of steps) {
    const message = validateMemberInput(input, kind, step, category, holderId, ageCategory);
    if (message) return { step, message };
  }
  return null;
}
