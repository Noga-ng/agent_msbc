import { ReqError } from "../libs/Noga_Http";
import client from "./Client";
import type { ResPost } from "../components/Inscriptions/Inputs/TypeInput";

/** Supporte les anciennes réponses PHP data:"T001" et data:{identifiant:"T001"}. */
export function createdIdentifier(value: unknown): string | null {
  const id = value && typeof value === "object"
    ? (value as Record<string, unknown>).identifiant ?? (value as Record<string, unknown>).id
    : value;
  if (typeof id !== "string" && typeof id !== "number") return null;
  const normalized = String(id).trim();
  return /^[\w-]{1,90}$/.test(normalized) ? normalized : null;
}

const serverMessage = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const msg = (value as Record<string, unknown>).message;
  return typeof msg === "string" && msg.trim() ? msg.trim().slice(0, 400) : null;
};

export async function registerMember(endpoint: string, data: FormData, csrfToken?: string):
Promise<{id:string|null,message:string|null}> 
{
  try {
    const response = await client.post<ResPost<unknown>>(endpoint, data, {
      credentials: "include",
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
      timeout: 30000,
    });
    if (!response.ok || !response.data || response.data.status !== true) {
      const msg = serverMessage(response.data);

      if (response.status === 401 || response.status === 403) 
        throw new Error("Session expirée ou accès refusé. Reconnectez-vous.");

      if (response.status === 409) 
        throw new Error(msg || "Cette personne est déjà inscrite. Vérifiez les doublons.");

      if (response.status === 422 || response.status === 400) 
        throw new Error(msg || "Certaines informations sont refusées par le serveur.");

      if (response.status === 429) 
        throw new Error("Trop de tentatives. Réessayez dans quelques instants.");

      throw new Error(msg || "Le serveur n'a pas confirmé l'inscription.");
    }
    return {
      id: createdIdentifier(response.data.data),
      message: serverMessage(response.data) || "Inscription enregistrée sur le serveur.",
    };
  } catch (err) {
    if (err instanceof ReqError) {
      const msg = serverMessage(err.data);

      if (err.status === 409) 
        throw new Error(msg || "Cette personne est déjà inscrite.", { cause: err });

      if (err.status === 401 || err.status === 403) 
        throw new Error("Session expirée ou accès refusé. Reconnectez-vous.", { cause: err });

      throw new Error(msg || "Connexion au serveur est impossible. Vérifiez votre connexion et réessayez.", { cause: err });
    }
    if (err instanceof Error && (err instanceof TypeError || err.name === "AbortError"))
      throw new Error("Impossible de connecter au serveur. Vérifiez la connexion.", { cause: err });
    throw err;
  }
}
