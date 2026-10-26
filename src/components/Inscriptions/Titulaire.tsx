import { useState, type MouseEvent, type ReactElement } from "react";

import { BsArrowRight } from "react-icons/bs";
import { LuCircleUserRound, LuContact } from "react-icons/lu";
import { BiSave } from "react-icons/bi";
import { FaLocationDot } from "react-icons/fa6";

import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { useNavigate } from "react-router";

import Profile from "./Inputs/Profile";
import Local from "./Inputs/Local";
import Contact from "./Inputs/Contact";
import CheckCategorie from "./Inputs/CategorieCheked";

import { EmptyForm, type Categorie, type FormInsert } from "./Inputs/TypeInput";

import HandleChange, { HandleFile, HandleNaissance } from "./Inputs/handlers";

import SetFormData from "../../service/formData";
import { useAuth } from "../../Auth/UseAuth";
import {
  validateMemberForm,
  validateMemberInput,
} from "../../service/memberRules";
import { registerMember } from "../../service/memberRegistration";
import { endPointTitulaire } from "../../service/Setups/NormalizeEnv";

type PersonCategory = "minor" | "major";

const categorieText: Record<number, Categorie> = {
  5: "salam@",
  6: "salam@Be",
  7: "ankohonanaSalam@",
  8: "ankohonanaSalam@Be",
};

export default function Titulaire(): ReactElement {
  const navigate = useNavigate();

  const [setup, setSetup] = useState<number>(1);

  const [formInsert, setFormInsert] = useState<FormInsert>(EmptyForm());

  const [preview, setPreview] = useState<string | null>(null);

  const [submitE, setSubmitE] = useState<boolean>(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);

  const [error, setError] = useState<Error | null>(null);
  const users = useAuth();
  /**
   * Catégorie MSBC
   * 0 = aucune catégorie sélectionnée
   */
  const [categorie, setCategorie] = useState<number>(0);

  /**
   * Catégorie de la personne
   */
  const [personCategory, setPersonCategory] = useState<PersonCategory | null>(
    null,
  );

  /**
   * Étape du contrôle de catégorie
   */
  const [checkStups, setCheckStups] = useState<number>(1);

  const onChange = HandleChange<FormInsert>(setFormInsert);

  const naissance = HandleNaissance<FormInsert>(setFormInsert);

  const onFile = HandleFile<FormInsert>({
    setFormInsert,
    setPreview,
    setProcessing: setPhotoProcessing,
  });

  /**
   * Texte correspondant à la catégorie MSBC
   */
  const categoriChoose =
    categorie === 0 ? null : (categorieText[categorie] ?? null);

  const checkAge =
    Boolean(formInsert.naissance) &&
    ((personCategory === "minor" && formInsert.age < 18) ||
      (personCategory === "major" && formInsert.age >= 18));

  /**
   * Choix de la catégorie MSBC
   */
  const handleCategorie = (e: MouseEvent<HTMLButtonElement>): void => {
    const value = Number(e.currentTarget.value);

    if (!value) {
      return;
    }

    setCategorie(value);
    setCheckStups(2);
  };

  /**
   * Choix de la catégorie de personne
   */
  const handlePerson = (e: MouseEvent<HTMLButtonElement>): void => {
    const value = e.currentTarget.value;

    if (value !== "minor" && value !== "major") {
      return;
    }

    const category = value as PersonCategory;

    setPersonCategory(category);
  };

  /**
   * Vérifie si les deux catégories sont sélectionnées
   */
  const categoryCompleted = categorie !== 0 && personCategory !== null;

  /**
   * Enregistrement du formulaire
   */
  async function handleSubmit(
    e: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    if (submitE || photoProcessing) return;

    const issue = validateMemberForm(
      formInsert,
      "titulaire",
      categorie,
      undefined,
      personCategory ?? undefined,
    );
    if (issue) {
      setError(new Error(issue.message));
      setSetup(issue.step);
      return;
    }

    if (!users.user?.id) {
      setError(new Error("La session de l'agent a expiré. Reconnectez-vous."));
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Confirmer l'inscription",
      text: "Vérifiez les informations du titulaire avant de les envoyer au serveur MSBC.",
      showCancelButton: true,
      confirmButtonText: "Enregistrer",
      cancelButtonText: "Annuler",
    });

    if (!confirmation.isConfirmed) return;

    setError(null);
    setSubmitE(true);

    try {
      const form = SetFormData({
        ...formInsert,
        categorie,
        users: users.user.id,
      });

      const result = await registerMember(
        `/${endPointTitulaire}`,
        form,
        users.user.csrfToken,
      );
      const mess = result.id
        ? result.message
        : `${result.message} Le serveur n'a pas renvoyé d'identifiant : consultez la liste des membres.`;

      await Swal.fire({
        icon: result.id ? "success" : "warning",
        title: "Inscription enregistrée",
        text: mess as string,
      });

      navigate(
        result.id ? `/membres/${encodeURIComponent(result.id)}` : "/membres",
        { replace: true },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Enregistrement impossible. Réessayez."),
      );
    } finally {
      setSubmitE(false);
    }
  }

  /**
   * Réinitialisation du formulaire
   */
  function onExit(): void {
    setSetup(1);
    setFormInsert(EmptyForm());
    setPreview(null);
    setError(null);

    setCategorie(0);
    setPersonCategory(null);
    setCheckStups(1);
  }

  return (
    <>
      {/**
       * Tant que les deux catégories ne sont pas définies,
       * on affiche l'écran de sélection.
       */}
      {!categoryCompleted && (
        <CheckCategorie
          handleClick={handleCategorie}
          handlePerson={handlePerson}
          state={{ steps: checkStups, categorie: categorie }}
        />
      )}

      {/**
       * Le formulaire n'est affiché qu'après
       * sélection des deux catégories.
       */}
      {categoryCompleted && (
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
              {setup === 1 ? (
                <LuCircleUserRound size={23} />
              ) : setup === 2 ? (
                <FaLocationDot size={23} />
              ) : setup === 3 ? (
                <LuContact size={23} />
              ) : null}
            </span>

            <div className="flex gap-2">
              <label className="field">
                <p>{categoriChoose}</p>
              </label>
            </div>
          </motion.div>

          {setup === 1 && (
            <Profile
              profile={formInsert}
              handleChange={onChange}
              handleFile={onFile}
              handleNaissance={naissance}
              previewPhoto={preview}
              categorie={personCategory}
              photoProcessing={photoProcessing}
            />
          )}

          {setup === 2 && <Local local={formInsert} handleChange={onChange} />}

          {setup === 3 && (
            <Contact contact={formInsert} handleChange={onChange} />
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
              {error.message}
            </motion.p>
          )}

          <div className="form-actions">
            {setup === 1 ? (
              <button
                className="secondary-button"
                type="button"
                onClick={onExit}
                disabled={submitE || photoProcessing}
              >
                Annuler
              </button>
            ) : (
              <button
                className="secondary-button"
                type="button"
                disabled={submitE || photoProcessing}
                onClick={() => setSetup((current) => Math.max(current - 1, 1))}
              >
                Retour
              </button>
            )}

            {setup >= 3 ? (
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
                  const validation = validateMemberInput(
                    formInsert,
                    "titulaire",
                    setup as 1 | 2,
                    categorie,
                    undefined,
                    personCategory ?? undefined,
                  );
                  if (validation) {
                    setError(new Error(validation));
                    return;
                  }
                  setError(null);
                  setSetup((current) => Math.min(current + 1, 3));
                }}
                disabled={!checkAge || photoProcessing}
              >
                Continuer
                <BsArrowRight size={18} />
              </button>
            )}
          </div>
        </motion.form>
      )}
    </>
  );
}
