import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router";
import Swal from "sweetalert2";
import { BiSave } from "react-icons/bi";
import {
  LuArrowLeft,
  LuCircleUserRound,
  LuContact,
  LuMapPin,
  LuPencil,
} from "react-icons/lu";

import { useAuth } from "../../Auth/UseAuth";
import type { Conjoint, Enfant, Members } from "../../Response";
import client from "../../service/Client";
import { EmptyForm, type FormInsert } from "../Inscriptions/Inputs/TypeInput";
import { HandleFile, HandleNaissance } from "../Inscriptions/Inputs/handlers";
import Profile from "../Inscriptions/Inputs/Profile";
import Local from "../Inscriptions/Inputs/Local";
import Contact from "../Inscriptions/Inputs/Contact";
import LoadingState from "../Loaders/LoadingState";
import { memberToForm, changedMemberFields } from "../../service/memberEditing";
import { updateMember } from "../../service/memberUpdateApi";
import {
  memberAge,
  validateMemberForm,
  validateMemberInput,
  type MemberKind,
  type Step,
} from "../../service/memberRules";
import "../../assets/css/member-edit.css";
import PhotoLink from "../../service/Setups/photoSetup";

type Family = {
  titularies: Members | null;
  conjoint: Conjoint | null;
  enfants: Enfant[] | null;
};

type FamilyRes = {
  status: boolean;
  message?: string;
  data?: Family;
};

type EditRouteParams = {
  id?: string;
  personId?: string;
};

type EditProps = {
  kind: MemberKind;
};

type EditDraft = {
  initial: FormInsert;
  memberId: string;
  holderId: string;
  existingPhoto: string;
};

function personFromFamily(
  family: Family,
  kind: MemberKind,
  personId: string,
): Record<string, unknown> | null {
  if (kind === "titulaire")
    return family.titularies as unknown as Record<string, unknown> | null;

  if (kind === "conjoint") {
    return String(family.conjoint?.identifiant ?? "") === personId
      ? (family.conjoint as unknown as Record<string, unknown>)
      : null;
  }

  const children = Array.isArray(family.enfants) ? family.enfants : [];
  const child = children.find(
    (person) => String(person.identifiant ?? "") === personId,
  );

  return child ? (child as unknown as Record<string, unknown>) : null;
}

function nameFor(kind: MemberKind) {
  return kind === "titulaire"
    ? "titulaire"
    : kind === "conjoint"
      ? "conjoint(e)"
      : "enfant";
}

/** Page d'édition commune ; GET et POST uniquement via PHP, aucun stockage local. */
export default function MemberEdit({ kind }: EditProps) {
  const { id, personId } = useParams<EditRouteParams>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const reducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [form, setForm] = useState<FormInsert>(EmptyForm);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [ageCategory, setAgeCategory] = useState<"major" | "minor">("major");
  const [saving, setSaving] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [error, setError] = useState("");
  const returnPath = id ? `/membres/${encodeURIComponent(id)}` : "/membres";
  const memberId = kind === "titulaire" ? id : personId;

  useEffect(() => {
    let cancelled = false;
    if (!id || !memberId) return;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      setDraft(null);
      try {
        const isRattache = kind === "enfant";
        const params = isRattache ? {enfant:memberId} : undefined;

        const response = await client.get<FamilyRes>(
          `/membresData/${encodeURIComponent(id)}`,
          { credentials: "include", cache: false,data:params },
        );

        if (
          !response.ok ||
          !response.data?.status ||
          !response.data.data?.titularies
        ) {
          throw new Error(
            response.data?.message || "La fiche n'a pas pu être récupérée.",
          );
        }
        const family = response.data.data;
        if (!family.titularies)
          throw new Error("Titulaire introuvable sur le serveur.");
        if (String(family.titularies.identifiant) !== id)
          throw new Error(
            "Le serveur a renvoyé un titulaire différent de celui demandé.",
          );

        const found = personFromFamily(family, kind, memberId);
        if (!found || String(found.identifiant ?? "") !== memberId)
          throw new Error("Ce membre n'est pas rattaché à la fiche demandée.");

        const initial = memberToForm(found);
        if (!cancelled) {
          setDraft({
            initial,
            holderId: id,
            memberId,
            existingPhoto: typeof found.photo === "string" ? found.photo : "",
          });
          setForm({ ...initial });
          setAgeCategory(
            kind === "enfant" ||
              (kind === "titulaire" &&
                initial.naissance &&
                (memberAge(initial.naissance) ?? 99) < 18)
              ? "minor"
              : "major",
          );

          setPreview(
            PhotoLink(kind, typeof found.photo === "string" ? found.photo : ""),
          );
          setError("");
          setStep(1);
          setLoading(false);
        }
      } catch (cause) {
        if (!cancelled) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger la fiche.",
          );
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, memberId, kind]);

  // Champs de formulaires partagés avec les inscriptions ; l'ID et le titulaire ne sont pas éditables.
  const setField = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((old) => ({
      ...old,
      [name]: name === "categorie" ? Number(value) : value,
    }));
    setError("");
  };

  const setBirth = useMemo(() => HandleNaissance<FormInsert>(setForm), []);

  const setFile = useMemo(
    () =>
      HandleFile<FormInsert>({
        setFormInsert: setForm,
        setPreview,
        setProcessing: setPhotoProcessing,
      }),
    [],
  );
  const steps: Step[] = kind === "titulaire" ? [1, 2, 3] : [1, 3];
  const currentIndex = steps.indexOf(step);
  const validationKind =
    kind === "titulaire" ? ageCategory : kind === "enfant" ? "minor" : "major";

  function validate(stepToCheck: Step): string | null {
    if (!draft) return "La fiche du membre est indisponible.";
    return validateMemberInput(
      form,
      kind,
      stepToCheck,
      form.categorie,
      draft.holderId,
      validationKind,
    );
  }

  function nextStep() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep(steps[Math.min(currentIndex + 1, steps.length - 1)]);
  }

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || photoProcessing || !draft) return;
    if (!user?.id) {
      setError("La session a expiré. Reconnectez-vous.");
      return;
    }

    const issue = validateMemberForm(
      form,
      kind,
      form.categorie,
      draft.holderId,
      validationKind,
    );

    if (issue) {
      setError(issue.message);
      setStep(issue.step);
      return;
    }

    const changes = changedMemberFields(draft.initial, form, kind);

    if (!Array.from(changes.keys()).length) {
      setError("Aucune donnée n'a été modifiée.");
      return;
    }

    const confirmed = await Swal.fire({
      icon: "question",
      title: `Modifier la fiche ${nameFor(kind)} ?`,
      showCancelButton: true,
      confirmButtonText: "Enregistrer",
      cancelButtonText: "Annuler",
    });

    if (!confirmed.isConfirmed) return;

    setSaving(true);
    setError("");

    try {
      const message = await updateMember(
        kind,
        draft.memberId,
        draft.holderId,
        changes,
        user.csrfToken,
      );
      await Swal.fire({
        icon: "success",
        title: "Fiche modifiée",
        text: message,
      });
      navigate(returnPath, { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "La modification n'a pas été confirmée.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!id || !memberId)
    return (
      <main className="content-wrap w-full h-full flex items-center-safe justify-center-safe flex-col" role="alert">
        <p className="font-bold">Identifiant de la fiche manquant.</p>
        <Link to="/membres">Retour aux membres</Link>
      </main>
    );

  if (loading)
    return <LoadingState label={`Chargement de la fiche ${nameFor(kind)}`} />;
  if (loadError || !draft)
    return (
      <main className="content-wrap w-full h-full flex items-center-safe justify-center-safe flex-col" role="alert">
        <p>{loadError || "Données indisponibles."}</p>
        <Link className="secondary-button" to={returnPath}>
          Retour à la fiche
        </Link>
      </main>
    );

  return (
    <main className="content-wrap member-edit-page">
      <div className="member-edit-heading">
        <Link to={returnPath} className="member-edit-back">
          <LuArrowLeft /> Retour à la famille
        </Link>
        <div className="member-edit-title">
          <span className="member-edit-icon">
            <LuPencil />
          </span>
          <div>
            <p className="member-edit-eyebrow">MSBC · Gestion des membres</p>
            <h1>{nameFor(kind)}</h1>
            <p>
              {form.noms} {form.prenoms} · <strong>{draft.memberId}</strong>
            </p>
          </div>
        </div>
        {/* <p className="member-edit-notice">
          
          </p> */}
      </div>
      <motion.form
        className="form-card member-edit-form"
        encType="multipart/form-data"
        onSubmit={submit}
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26 }}
      >
        <div className="member-edit-steps" aria-label="Étapes du formulaire">
          {steps.map((s, i) => (
            <button
              type="button"
              key={s}
              className={s === step ? "is-active" : ""}
              onClick={() => {
                if (s <= step) {
                  setStep(s);
                  setError("");
                }
              }}
            >
              <span>{i + 1}</span>
              {s === 1 ? "Identité" : s === 2 ? "Résidence" : "Contacts"}
            </button>
          ))}
        </div>
        <div className="form-card-heading">
          <span className="form-icon">
            {step === 1 ? (
              <LuCircleUserRound />
            ) : step === 2 ? (
              <LuMapPin />
            ) : (
              <LuContact />
            )}
          </span>
          <div>
            <strong>
              {step === 1
                ? "Identité et photo"
                : step === 2
                  ? "Adresse et localisation"
                  : "Coordonnées"}
            </strong>
            <p>
              Étape {currentIndex + 1} sur {steps.length}
            </p>
          </div>
        </div>
        {step === 1 && (
          <>
            {kind === "titulaire" && (
              <div className="member-edit-options">
                <label className="field">
                  <span>Catégorie MSBC *</span>
                  <select
                    value={form.categorie}
                    name="categorie"
                    onChange={setField}
                    required
                  >
                    <option value="0">Choisir la catégorie</option>
                    <option value="5">Salam@</option>
                    <option value="6">Salam@Be</option>
                    <option value="7">Ankohonana Salam@</option>
                    <option value="8">Ankohonana Salam@Be</option>
                  </select>
                </label>
                <label className="field">
                  <span>Catégorie d'âge *</span>
                  <select
                    value={ageCategory}
                    onChange={(e) =>
                      setAgeCategory(e.target.value as "major" | "minor")
                    }
                  >
                    <option value="major">Adulte (18 ans ou plus)</option>
                    <option value="minor">Mineur (moins de 18 ans)</option>
                  </select>
                </label>
              </div>
            )}
            <Profile
              profile={form}
              handleChange={setField}
              handleNaissance={setBirth}
              handleFile={setFile}
              previewPhoto={preview}
              categorie={validationKind}
              photoProcessing={photoProcessing}
            />
            {draft.existingPhoto && (
              <p className="member-edit-photo-hint">
                La photo actuelle sera conservée si vous ne choisissez pas une
                nouvelle image.
              </p>
            )}
          </>
        )}
        {step === 2 && <Local local={form} handleChange={setField} />}
        {step === 3 && (
          <Contact
            contact={form}
            handleChange={setField}
            child={kind === "enfant"}
          />
        )}
        {error && (
          <p role="alert" className="form-error member-edit-error">
            {error}
          </p>
        )}
        <div className="form-actions member-edit-actions">
          {currentIndex === 0 ? (
            <Link className="secondary-button" to={returnPath}>
              Annuler
            </Link>
          ) : (
            <button
              type="button"
              className="secondary-button"
              disabled={saving || photoProcessing}
              onClick={() => {
                setStep(steps[currentIndex - 1]);
                setError("");
              }}
            >
              Précédent
            </button>
          )}
          {currentIndex === steps.length - 1 ? (
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

              type="submit"
              className="primary-button"
              disabled={saving || photoProcessing}
              aria-busy={saving}
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
              {saving ? (
                <span className="msbc-inline-spinner" aria-hidden="true" />
              ) : (
                <BiSave size={18} />
              )}
            </motion.button>
          ) : (
            <button
              type="button"
              className="primary-button"
              disabled={saving || photoProcessing}
              onClick={nextStep}
            >
              Continuer
            </button>
          )}
        </div>
      </motion.form>
    </main>
  );
}
