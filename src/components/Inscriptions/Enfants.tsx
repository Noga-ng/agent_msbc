import LoadingState from "../Loaders/LoadingState";
import React, { useState, type ReactElement } from "react";
import { BsArrowRight } from "react-icons/bs";
import { LuCircleUserRound, LuContact } from "react-icons/lu";
import Profile from "./Inputs/Profile";
import { BiSave } from "react-icons/bi";
import { EmptyFormEnfant, type EnfantInsert } from "./Inputs/TypeInput";
import { useNavigate, Link } from "react-router";
import useFamilyHolder from "./useFamilyHolder";
import {
  validateMemberForm,
  validateMemberInput,
} from "../../service/memberRules";
import { registerMember } from "../../service/memberRegistration";
import { useAuth } from "../../Auth/UseAuth";
import HandleChange, { HandleFile, HandleNaissance } from "./Inputs/handlers";
import { motion } from "framer-motion";
import SetFormData from "../../service/formData";
import Contact from "./Inputs/Contact";
import Swal from "sweetalert2";
import { endPointEnfant } from "../../service/Setups/NormalizeEnv";

export default function Enfants(): ReactElement {
  const [setup, setSetup] = useState<number>(1);
  const [formInsert, setFormInsert] = useState<EnfantInsert>(EmptyFormEnfant());
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const [submitE, setSubmitE] = useState<boolean>(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const {
    holder,
    titulaire,
    loading: holderLoading,
    error: holderError,
  } = useFamilyHolder();
  const { user } = useAuth();

  const onChange = HandleChange<EnfantInsert>(setFormInsert);
  const naissance = HandleNaissance<EnfantInsert>(setFormInsert);
  const onFile = HandleFile<EnfantInsert>({
    setFormInsert,
    setPreview,
    setProcessing: setPhotoProcessing,
  });

  function onExit(): void {
    setSetup(1);
    setFormInsert(EmptyFormEnfant());
    setPreview(null);
    setError(null);
  }

  async function handleSubmit(
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();

    if (submitE || photoProcessing) return;

    setError(null);

    if (!user?.id) {
      setError(new Error("Session de l’agent indisponible. Reconnectez-vous."));
      return;
    }

    if (!holder || !titulaire) {
      setError(new Error(holderError || "Le titulaire n'a pas été vérifié."));
      return;
    }

    const issue = validateMemberForm(
      formInsert,
      "enfant",
      undefined,
      titulaire,
    );

    if (issue) {
      setSetup(issue.step === 3 ? 2 : 1);
      setError(new Error(issue.message));
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Confirmer l'inscription",
      text: "Vérifiez les renseignements avant l'envoi au serveur MSBC.",
      showCancelButton: true,
      confirmButtonText: "Enregistrer",
      cancelButtonText: "Annuler",
    });

    if (!confirmation.isConfirmed) return;
    setSubmitE(true);

    try {
      const form = SetFormData({
        ...formInsert,
        users: user.id,
        idTitulaire: titulaire,
      });
      const result = await registerMember(
        `/${endPointEnfant}`,
        form,
        user.csrfToken,
      );
      await Swal.fire({
        icon: "success",
        title: "Inscription effectué",
        text: result.message as string,
      });

      navigate(`/membres/${encodeURIComponent(titulaire)}`, { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause
          : new Error("Enregistrement impossible."),
      );
    } finally {
      setSubmitE(false);
    }
  }

  if (holderLoading)
    return <LoadingState label="Vérification du titulaire sur le serveur..." />;
  if (holderError || !holder)
    return (
      <main className="form-card" role="alert">
        <p>{holderError || "Titulaire indisponible."}</p>
        <Link to="/membres" className="primary-button">
          Retour aux membres
        </Link>
      </main>
    );

  return (
    <motion.form
      initial={{
        opacity: 0,
        x: -20,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        delay: 0.3,
        duration: 0.5,
      }}
      className="form-card"
      onSubmit={handleSubmit}
      encType="multipart/form-data"
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.3,
          duration: 0.7,
        }}
        className="form-card-heading"
      >
        <span className="form-icon">
          {setup == 1 ? (
            <LuCircleUserRound size={23} />
          ) : setup === 2 ? (
            <LuContact size={23} />
          ) : (
            ""
          )}
        </span>
        <div className="flex gap-2">
          <label className="field">
            <strong>Enfant(e) </strong>
            <p>Titulaire : {titulaire}/MSBC-TM</p>
          </label>
        </div>
      </motion.div>

      {setup === 1 && (
        <Profile
          profile={formInsert}
          handleChange={onChange}
          handleNaissance={naissance}
          handleFile={onFile}
          previewPhoto={preview}
          photoProcessing={photoProcessing}
          categorie={"minor"}
        />
      )}
      {setup === 2 && (
        <Contact contact={formInsert} handleChange={onChange} child />
      )}
      {error?.message && (
        <motion.p
          initial={{
            opacity: 0,
            x: -20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.7,
          }}
          className="form-error"
          role="alert"
        >
          {error?.message}
        </motion.p>
      )}

      <div className="form-actions">
        {setup === 1 ? (
          <button
            className="secondary-button"
            disabled={submitE || photoProcessing}
            type="button"
            onClick={() => onExit()}
          >
            Annuler
          </button>
        ) : (
          <button
            className="secondary-button"
            disabled={submitE || photoProcessing}
            type="button"
            onClick={() => setSetup((current) => Math.max(current - 1, 1))}
          >
            Retour
          </button>
        )}

        {setup >= 2 ? (
          <motion.button
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.4,
              duration: 0.7,
            }}

            className="primary-button"
            disabled={submitE || photoProcessing}
            type="submit"
          >
            {submitE ? "Enregistrement…" : "Enregistrer"}
            {submitE ? (
              <span className="msbc-inline-spinner" aria-hidden="true" />
            ) : (
              <BiSave size={18} />
            )}
          </motion.button>
        ) : (
          <button
            className={`primary-button ${setup < 3 && "disabled:cursor-not-allowed!"}`}
            type="button"
            onClick={() => {
              if (photoProcessing) return;
              const validation = validateMemberInput(
                formInsert,
                "enfant",
                1,
                undefined,
                titulaire,
              );
              if (validation) {
                setError(new Error(validation));
                return;
              }
              setError(null);
              setSetup(2);
            }}
          >
            Continuer <BsArrowRight size={18} />
          </button>
        )}
      </div>
    </motion.form>
  );
}
