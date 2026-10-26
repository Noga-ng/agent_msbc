import { ReqError } from "../libs/Noga_Http";
import client from "./Client";
import type { MemberKind } from "./memberRules";

export const updateEndpointEnv: Record<MemberKind, string | undefined> = {
  titulaire: import.meta.env.VITE_MEMBER_UPDATE_TITULAIRE_ENDPOINT,
  conjoint: import.meta.env.VITE_MEMBER_UPDATE_CONJOINT_ENDPOINT,
  enfant: import.meta.env.VITE_MEMBER_UPDATE_ENFANT_ENDPOINT,
};

const defaultEndpoints: Record<MemberKind, string> = {
  titulaire: "/updateMembres",
  conjoint: "/updateMembres/conjoint",
  enfant: "/updateMembres/enfants",
};

/** Supporte les URLs configurables telles que /membres/{id}/update. */
export function updateEndpoint(kind: MemberKind, id: string, configured?: string): string {
  const template = configured?.trim() || defaultEndpoints[kind];
  if (!template.startsWith("/") || template.startsWith("//")) throw new Error("Endpoint de modification est invalide.");

  return template.replace(/\{id\}/g, encodeURIComponent(id));
}

interface ResultRes { status: boolean; message?: string; data?: unknown }

function Message(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const message = (value as Record<string, unknown>).message;
  return typeof message === "string" && message.trim() ? message.trim().slice(0, 400) : null;
}

function apiError(status: number | null, reply: unknown): Error {
  const msg = Message(reply);
  if (status === 401 || status === 403) 
    return new Error("Session expirée ou modification non autorisée. Reconnectez-vous.");

  if (status === 404 || status === 405) 
    return new Error("La modification n'est pas disponible (404/405). Vérifiez sa route serveur.");

  if (status === 409) 
    return new Error(msg || "Modification refusée : données déjà utilisées ou conflit de version.");

  if (status === 400 || status === 422) 
    return new Error(msg || "Le serveur a refusé certains champs. Vérifiez les données.");

  if (status === 429) 
    return new Error("Trop de tentatives. Veuillez réessayer plus tard.");

  if (status !== null && status >= 500) 
    return new Error("Erreur du serveur. Les changements ne sont pas confirmés.");

  return new Error(msg || "Le serveur n'a pas confirmé la modification.");
}

export async function updateMember(
  kind: MemberKind,
  memberId: string,
  holderId: string,
  changes: FormData,
  csrfToken?: string,
): Promise<string> {
  if (!memberId || !holderId) 
    throw new Error("Identifiant du membre ou du titulaire absent.");

  if (![...changes.keys()].length) 
    throw new Error("Aucune modification à enregistrer.");

  const body = new FormData();
  // Identifiants de ressource uniquement ; le backend contrôle les droits via la session.
  body.append("identifiant", memberId);
  if (kind !== "titulaire") body.append("idTitulaire", holderId);
  changes.forEach((value, key) => body.append(key, value));
  const endpoint = updateEndpoint(kind, memberId, updateEndpointEnv[kind]);
  try {
    // POST multipart est compatible avec $_POST et $_FILES en PHP natif.
    const response = await client.post<ResultRes>(endpoint, body, {
      credentials: "include",
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
      timeout: 30000,
      retries: 0,
    });
    if (!response.ok || !response.data || response.data.status !== true)
      throw apiError(response.status, response.data);
    return Message(response.data) || "Les modifications ont été enregistrées sur le serveur.";
  } catch (err) {
    if (err instanceof ReqError) 
      throw apiError(err.status, err.data);
    if (err instanceof Error && (err.name === "AbortError" || err instanceof TypeError))
      throw new Error("Connexion au serveur impossible. Les modifications n'ont pas été confirmées.", { cause: err });
    throw err;
  }
}
