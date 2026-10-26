import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiSave,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useNavigate } from "react-router";
import { useAuth } from "../../Auth/UseAuth";

import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  validatePasswordChange,
  type PasswordFieldErrors,
  type PasswordFields,
} from "../../service/passwordRules";
import {
  changePassword,
  PasswordChangeError,
  toPasswordFieldError,
} from "../../service/apis/changePassword";

const EMPTY: PasswordFields = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};
type PasswordKey = keyof PasswordFields;
const INPUTS: { key: PasswordKey; label: string; autoComplete: string }[] = [
  {
    key: "currentPassword",
    label: "Mot de passe actuel",
    autoComplete: "current-password",
  },
  {
    key: "newPassword",
    label: "Nouveau mot de passe",
    autoComplete: "new-password",
  },
  {
    key: "confirmPassword",
    label: "Confirmer le nouveau mot de passe",
    autoComplete: "new-password",
  },
];

export default function PasswordChangeForm({csrfToken}: {csrfToken?: string;}) {
  const navigate = useNavigate();
  const { user,checkSession } = useAuth();
  const [values, setValues] = useState<PasswordFields>(EMPTY);
  const [errors, setErrors] = useState<PasswordFieldErrors>({});
  const [visible, setVisible] = useState<Partial<Record<PasswordKey, boolean>>>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => {request.current?.abort();},[]);

  const update = (key: PasswordKey, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setRequestError("");
  };

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setRequestError("");
    const nextErrors = validatePasswordChange(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const controller = new AbortController();
    request.current = controller;
    setSubmitting(true);
    try {
      if(!user) return;

      await changePassword(
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          id:user.id
        },
        controller.signal,
        csrfToken,
      );
      if (controller.signal.aborted) return;
      setValues(EMPTY);
      setVisible({});
      setErrors({});
      // Certains serveurs révoquent la session après le changement du mot de passe.
      const active = await checkSession();
      if (controller.signal.aborted) return;
      if (!active) {
        navigate("/login", { replace: true });
        void Swal.fire({
          icon: "success",
          title: "Mot de passe modifié",
          text: "Reconnectez-vous avec votre nouveau mot de passe.",
          confirmButtonColor: "#147d68",
        });
      } else {
        void Swal.fire({
          icon: "success",
          title: "Mot de passe modifié",
          text: "Votre nouveau mot de passe est maintenant enregistré sur le serveur.",
          confirmButtonColor: "#147d68",
        });
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      const failure =
        error instanceof PasswordChangeError
          ? error
          : new PasswordChangeError("La modification a échoué.");
      setErrors(toPasswordFieldError(failure));
      setRequestError(failure.message);
      if (failure.expiredSession) navigate("/login", { replace: true });
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setSubmitting(false);
    }
  };

  return (
    <form
      className="account-password-form"
      onSubmit={(event) => void submit(event)}
      noValidate
      autoComplete="on"
    >
      <div className="account-password-intro">
        <FiLock aria-hidden="true" />
        <div>
          <strong>Changer votre mot de passe</strong>
          <p>
            Choisissez une mot de passe unique de {MIN_PASSWORD_LENGTH} à{" "}
            {MAX_PASSWORD_LENGTH} caractères. Les espaces sont autorisés.
          </p>
        </div>
      </div>
      <div className="account-password-fields">
        {INPUTS.map(({ key, label, autoComplete }) => (
          <div className="account-field" key={key}>
            <label htmlFor={`msbc-password-${key}`}>
              {label} <span aria-hidden="true">*</span>
            </label>
            <div className="account-password-input">
              <input
                id={`msbc-password-${key}`}
                name={key}
                type={visible[key] ? "text" : "password"}
                autoComplete={autoComplete}
                value={values[key]}
                onChange={(event) => update(key, event.target.value)}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={
                  errors[key] ? `msbc-password-error-${key}` : undefined
                }
                required
                minLength={
                  key === "newPassword" ? MIN_PASSWORD_LENGTH : undefined
                }
                maxLength={
                  key !== "currentPassword"
                    ? MAX_PASSWORD_LENGTH * 4
                    : undefined
                }
                disabled={submitting}
                spellCheck={false}
                autoCapitalize="off"
              />
              <button
                type="button"
                disabled={submitting}
                className="account-password-toggle"
                aria-label={`${visible[key] ? "Masquer" : "Afficher"} : ${label.toLowerCase()}`}
                aria-pressed={Boolean(visible[key])}
                onClick={() =>
                  setVisible((previous) => ({
                    ...previous,
                    [key]: !previous[key],
                  }))
                }
              >
                {visible[key] ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors[key] && (
              <small
                id={`msbc-password-error-${key}`}
                className="account-error"
                role="alert"
              >
                {errors[key]}
              </small>
            )}
          </div>
        ))}
      </div>
      {requestError && (
        <div className="account-password-feedback" role="alert">
          <FiAlertCircle aria-hidden="true" /> {requestError}
        </div>
      )}
      <div className="account-password-advice">
        <FiCheckCircle aria-hidden="true" />
        <span>
          
        </span>
      </div>
      <div className="account-editor-footer">
        <button
          className="account-btn account-btn-light"
          type="reset"
          disabled={submitting}
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setRequestError("");
            setVisible({});
          }}
        >
          Effacer
        </button>
        <button
          className="account-btn account-btn-primary"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="account-password-loader" aria-hidden="true" />{" "}
              Enregistrement…
            </>
          ) : (
            <>
              <FiSave /> <p>Modifier le mot de passe</p>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
