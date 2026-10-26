import type { Contenus } from "../../service/Type";
import { normalizeMemberStatus } from "../../service/memberRules";

export type MemberStatusFilter = "all" | "active" | "pending";

export function normalizeSearch(value: unknown): string {
  return String(value ?? "").
  normalize("NFD").
  replace(/[\u0300-\u036f]/g, "").
  toLowerCase().replace(/\s+/g, " ").
  trim();
}

/** Recherche seulement dans la réponse PHP déjà en mémoire React ; aucune persistance locale. */
export function filterApiMembers<T extends Contenus>(members: T[], query: string, status: MemberStatusFilter): T[] {
  const tokens = normalizeSearch(query).split(" ").filter(Boolean);
  return members.filter(member => {
    if (status !== "all" && normalizeMemberStatus(member.status) !== status) return false;
    const searchable = normalizeSearch([
      [member.noms, member.prenoms].join(" "),
      [member.prenoms, member.noms].join(" "),
      member.identifiant, 
      member.cin, member.telephone,
      member.categorie, member.adresse, 
      member.district, member.profession,
    ].join(" "));
    // Accepte aussi les numéros saisis sans espaces / tirets / parenthèses.
    const compact = searchable.replace(/[\s+().-]/g, "");
    return tokens.every(token => searchable.includes(token) ||
           compact.includes(token.replace(/[\s+().-]/g, "")));
  });
}
