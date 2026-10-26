import client from "../Client";
import { ReqError } from "../../libs/Noga_Http";
import type { PasswordFieldErrors, PasswordFields } from "../passwordRules";
import { changePasswordEndPoint } from "../Setups/NormalizeEnv";

/** Contrat attendu du backend : POST /auth/change-password. */
type ApiReply = {
  status: boolean;
  message?: string;
  code?: string;
};

interface MdpFileds extends PasswordFields {
  id:number;
}

export class PasswordChangeError extends Error {
  constructor(
    message: string,
    public readonly field?: keyof PasswordFields,
    public readonly expiredSession = false,
  ) {
    super(message);
    this.name = "PasswordChangeError";
  }
}



const ERROR_CODES: Record<
  string,
  { message: string; field?: keyof PasswordFields }
> = {
  INVALID_CURRENT_PASSWORD: {
    message: "Le mot de passe actuel est incorrect.",
    field: "currentPassword",
  },
  PASSWORD_REUSED: {
    message: "Le nouveau mot de passe doit être différent du précédent.",
    field: "newPassword",
  },
  PASSWORD_TOO_WEAK: {
    message:
      "Le nouveau mot de passe ne respecte pas les exigences du serveur.",
    field: "newPassword",
  },
  PASSWORD_TOO_SHORT: {
    message: "Le mot de passe est trop court pour le serveur.",
    field: "newPassword",
  },
  PASSWORD_TOO_LONG: {
    message: "Le mot de passe est trop long pour le serveur.",
    field: "newPassword",
  },
  PASSWORD_CONFIRMATION_MISMATCH: {
    message: "La confirmation du mot de passe est incorrecte.",
    field: "confirmPassword",
  },
};

// L'URL doit rester relative à VITE_API_URL : aucune destination extérieure pour les secrets.
function passwordEndpoint(): string {
  const value = changePasswordEndPoint ? `/${changePasswordEndPoint}` : "/auth/change-password";
  if (
    !/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(value) ||
    value.includes("..") ||
    value.includes("//")
  ) {
    console.log(value);
    throw new PasswordChangeError(
      "Le chemin API de changement de mot de passe est invalide.",
    );
  }
  return value;
}

function asReply(value: unknown): ApiReply | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  return typeof r.status === "boolean"
    ? {
        status: r.status,
        code: typeof r.code === "string" ? r.code : undefined,
        message: typeof r.message === "string" ? r.message : undefined,
      }
    : null;
}

/** Aucune persistance des secrets ; JSON sérialisé une seule fois par Noga_Http. */
export async function changePassword(
  fields: Pick<MdpFileds, "currentPassword" | "newPassword"|"id">,
  signal: AbortSignal,
  csrfToken?: string
): Promise<void> {
  try {
    const response = await client.post<unknown>(passwordEndpoint(), fields, {
      credentials: "include",
      signal,
      retries: 0,
      timeout: 15000,
      ...(csrfToken ? { headers: { "X-CSRF-Token": csrfToken } } : {}),
    });

    if (response.status === 401)
      throw new PasswordChangeError(
        "Votre session a expiré. Reconnectez-vous.",
        undefined,
        true,
      );
    if (response.status === 403)
      throw new PasswordChangeError(
        "Modification refusée par le serveur. Vérifiez vos droits ou la protection CSRF.",
      );
    if (response.status === 404 || response.status === 405)
      throw new PasswordChangeError(
        "La modification du mot de passe n'est pas encore disponible sur le serveur.",
      );
    if (response.status === 429)
      throw new PasswordChangeError("Trop de tentatives. Réessayez plus tard.");

    const result = asReply(response.data);
    if (response.ok && result?.status === true) return;
    if (result?.code && ERROR_CODES[result.code]) {
      const { message, field } = ERROR_CODES[result.code];
      throw new PasswordChangeError(message, field);
    }
    if (response.status === 400 || response.status === 422) {
      throw new PasswordChangeError(
        "Vérifiez votre mot de passe actuel et les informations saisies.",
      );
    }
    if (!response.ok)
      throw new PasswordChangeError(
        "Le serveur n'a pas pu modifier le mot de passe. Réessayez plus tard.",
      );
    throw new PasswordChangeError(
      "La modification n'a pas été confirmée par le serveur.",
    );
  } catch (error) {
    if (signal.aborted) throw error;
    if (error instanceof PasswordChangeError) throw error;
    if (
      error instanceof ReqError &&
      error.status !== null &&
      error.status >= 500
    ) {
      throw new PasswordChangeError(
        "Le serveur est momentanément indisponible.",
      );
    }
    throw new PasswordChangeError(
      "Connexion au serveur impossible. Vérifiez votre réseau et réessayez.",
    );
  }
}

/** Permet le rendu d'erreurs de champs sans diffuser les données du formulaire. */
export function toPasswordFieldError(
  error: PasswordChangeError,
): PasswordFieldErrors {
  return error.field ? { [error.field]: error.message } : {};
}
