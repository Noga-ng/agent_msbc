/** Règles de saisie côté interface. Le backend doit refaire tous les contrôles. */
export const MIN_PASSWORD_LENGTH = 5;
export const MAX_PASSWORD_LENGTH = 128;

export interface PasswordFields {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordFieldErrors = Partial<Record<keyof PasswordFields, string>>;

export function validatePasswordChange(fields: PasswordFields): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {};
  const { currentPassword, newPassword, confirmPassword } = fields;
  const length = Array.from(newPassword).length;

  if (!currentPassword) errors.currentPassword = "Saisissez votre mot de passe actuel.";
  if (!newPassword) {
    errors.newPassword = "Saisissez votre nouveau mot de passe.";
  } else if (/\p{Cc}/u.test(newPassword)) {
    errors.newPassword = "Le mot de passe ne peut pas contenir de caractères de contrôle.";
  } else if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
    errors.newPassword = `Utilisez entre ${MIN_PASSWORD_LENGTH} et ${MAX_PASSWORD_LENGTH} caractères.`;
  } else if (!newPassword.trim()) {
    errors.newPassword = "Choisissez un mot de passe non vide.";
  } else if (newPassword === currentPassword) {
    errors.newPassword = "Choisissez un mot de passe différent de l’ancien.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirmez votre nouveau mot de passe.";
  } else if (confirmPassword !== newPassword) {
    errors.confirmPassword = "Les deux nouveaux mots de passe ne correspondent pas.";
  }
  return errors;
}
