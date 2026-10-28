import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiFileText,
  FiHash,
  FiInfo,
  FiLock,
  FiPhone,
  FiRefreshCw,
  FiRotateCcw,
  FiSave,
  FiShield,
  FiUser,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuth } from "../../Auth/UseAuth";
import PasswordChangeForm from "./PasswordChangeForm";
import client from "../../service/Client";
import type { DataSession } from "../../Response";
import "../../assets/css/compte.css";

interface User {
  id:number;
  noms:string;
  prenoms:string;
  cin:string;
  telephone:string;
  photo:File|null;
}

type Profile = Pick<
  DataSession,
  "noms" | "prenoms" | "telephone" | "fonction" | "cin" | "photo"|"description"
>;
type Errors = Partial<Record<keyof Profile, string>>;
type Section = "overview" | "edit" | "security";

const fields: (keyof Profile)[] = [
  "noms",
  "prenoms",
  "telephone",
  "fonction",
  "description",
  "photo",
];
const normalize = (user: DataSession): Profile => ({
  noms: user.noms ?? "",
  prenoms: user.prenoms ?? "",
  telephone: user.telephone ?? "",
  fonction: user.fonction ?? "",
  description: user.description ?? "",
  photo: user.photo ?? "",
  cin: user.cin ?? ""
});

function validate(profile: Profile): Errors {
  const errors: Errors = {};
  if (!profile.noms.trim()) errors.noms = "Veuillez renseigner votre nom.";
  if (!profile.prenoms.trim())
    errors.prenoms = "Veuillez renseigner vos prénoms.";
  if (profile.telephone && !/^[+\d\s().-]{7,20}$/.test(profile.telephone)) {
    errors.telephone = "Saisissez un numéro de téléphone valide.";
  }
  if (profile.description.length > 500)
    errors.description = "Maximum 500 caractères.";
  return errors;
}

const notify = (
  icon: "success" | "error" | "info",
  title: string,
  text?: string,
) => {
  void Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: "#147d68",
    confirmButtonText: "Compris",
    customClass: { popup: "ms-account-alert" },
  });
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.065, delayChildren: 0.08 },
  },
};
const cardReveal: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 230, damping: 24 },
  },
};

export default function Compte() {
  const reducedMotion = useReducedMotion();
  const { user, loading, checkSession } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [draft, setDraft] = useState<Profile | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview,setPreview] = useState<string|null>(null);
  const [FileImg,setPhoto] = useState<File|null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [visible,setVisibility] = useState<boolean>(false);

  const base = useMemo(() => (user ? normalize(user) : null), [user]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDraft(base);
      setErrors({});
    });
    return () => window.cancelAnimationFrame(frame);
  }, [base]);

  const profile = draft ?? base;
  const hasUnsavedChanges = useMemo(
    () =>
      Boolean(
        profile && base && fields.some((key) => profile[key] !== base[key]),
      ),
    [profile, base],
  );
  const fullName = profile ? `${profile.noms} ${profile.prenoms}`.trim() : "";
  const initials = profile
    ? `${profile.prenoms.charAt(0)}${profile.noms.charAt(0)}`.toUpperCase() ||
      "MS"
    : "MS";
  const profileCompletion = profile
    ? Math.round(
        (fields.filter((key) => profile[key].trim()).length / fields.length) *
          100,
      )
    : 0;

  const setField = (key: keyof Profile, value: string) => {
    setDraft((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile || !base || saving) return;

    const nextErrors = validate(profile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      notify(
        "error",
        "Formulaire incomplet",
        "Corrigez les champs avant l'envoi.",
      );
      return;
    }
    // if (!hasUnsavedChanges) {
    //   setSection("overview");
    //   return;
    // }
    setSaving(true);
    try {
      // Endpoint PHP requis : aucune sauvegarde locale ou réussite simulée.
      const endpoint = endpointUpdateProfile ? `/${endpointUpdateProfile}` :"/auth/profile";
      
      if (
        !/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(endpoint) ||
        endpoint.includes("..") ||
        endpoint.includes("//")
      ) {
        throw new Error("Le chemin API de mise à jour du profil est invalide.");
      }
      const data:User = {
        id:user ? user.id : 0,
        noms:profile.noms,
        prenoms:profile.prenoms,
        telephone:profile.telephone,
        cin:profile.cin,
        photo:FileImg
      };
      
      const form = SetFormData(data);

      const response = await client.post<{ status: boolean; message?: string }>(
        endpoint,
        form,
        { credentials: "include", retries: 0, timeout: 20000 },
      );
      if (response.status === 404 || response.status === 405)
        throw new Error("La modification du profil n'est pas disponible.");
      if (!response.ok || response.data?.status !== true)
        throw new Error(
          response.data?.message ||
            "Le serveur n'a pas confirmé la mise à jour.",
        );
      const fresh = await checkSession();
      if (!fresh)
        throw new Error(
          `Profil envoyé, mais la session n'a pas pu être actualisée. 
          Reconnectez-vous pour vérifier vos informations.`,
        );
      setSection("overview");
      notify(
        "success",
        "Profil mis à jour",
        "La modification a été confirmée.",
      );
    } catch (cause) {
      notify(
        "error",
        "Mise à jour impossible",
        cause instanceof Error
          ? cause.message
          : "Impossible de contacter le serveur.",
      );
      
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(base);
    setErrors({});
    setSection("overview");
    setPreview(null);
    setPhoto(null);
  };

  const restore = async () => {
    const confirmed = await Swal.fire({
      title: "Annuler les changements ?",
      text: "Les modifications non enregistrées seront abandonnées.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Réinitialiser",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#147d68",
    });
    if (!confirmed.isConfirmed) return;
    setDraft(base);
    setErrors({});
    setSection("overview");
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const ok = await checkSession();
      notify(
        ok ? "success" : "error",
        ok ? "Session actualisée" : "Session expirée",
        ok
          ? "Les informations du serveur ont été rechargées."
          : "Veuillez vous reconnecter.",
      );
    } catch {
      notify(
        "error",
        "Erreur réseau",
        "Impossible de joindre le serveur pour actualiser la session.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    console.log(photoInput);
    if(!file) return;
    const photo = await ResizeImg(file);
    const photoPreview = await PhotoUrl(photo);
    setPreview(photoPreview);
    if(photo === null) return;
    setPhoto(photo);
  };

  if (loading)
    return (
      <div className="account-state" role="status">
        <FiRefreshCw className="account-spin" /> Chargement de votre compte…
      </div>
    );
  if (!user || !profile)
    return (
      <div className="account-state" role="alert">
        <FiLock /> Session indisponible. Veuillez vous reconnecter.
      </div>
    );

  const details = [
    { icon: <FiUser />, label: "Nom", value: profile.noms || "Non renseigné" },
    {
      icon: <FiUserCheck />,
      label: "Prénoms",
      value: profile.prenoms || "Non renseigné",
    },
    {
      icon: <FiPhone />,
      label: "Téléphone",
      value: profile.telephone || "Non renseigné",
    },
    {
      icon: <FiActivity />,
      label: "Fonction",
      value: profile.fonction.replaceAll("_"," ") || "Non renseignée",
    },
    { icon: <FiHash />, label: "CIN", value: user.cin || "Non renseigné" },
    {
      icon: <FiShield />,
      label: "Identifiant utilisateur",
      value: `#${user.id}`,
    },
  ];

    const photoUsers = PhotoLink('users',user?.photo); 

  const show = () =>{
    setVisibility(true);
  }

  return (
    <motion.main
      className="account-page"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <MyProfile type="users" visible={visible} setting={setVisibility} photo={photoUsers}/>
      <motion.div
        className="account-heading"
        initial={reducedMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <div>
          <span className="account-overline">
            <span /> ESPACE PERSONNEL / PARAMÈTRES
          </span>
        </div>
        <button
          className="account-btn account-btn-light"
          onClick={() => void refresh()}
          disabled={refreshing}
          type="button"
        >
          <FiRefreshCw className={refreshing ? "account-spin" : ""} />{" "}
          Actualiser
        </button>
      </motion.div>

      <motion.section
        className="account-cover"
        initial={reducedMotion ? false : { opacity: 0, y: 34, scale: 0.975 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 130, damping: 19 }}
      >
        <div className="account-cover-art" aria-hidden="true">
          <motion.span
            animate={
              reducedMotion
                ? undefined
                : { x: [0, -18, 0], y: [0, 14, 0], scale: [1, 1.07, 1] }
            }
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            animate={
              reducedMotion ? undefined : { x: [0, 15, 0], y: [0, -12, 0] }
            }
            transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            animate={
              reducedMotion
                ? undefined
                : { rotate: [0, 8, 0], scale: [1, 1.04, 1] }
            }
            transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="account-cover-top">
          <span className="account-cover-kicker">
            <FiShield /> MSBC TOAMASINA
          </span>
          <span className="account-session-dot">
            <i /> SESSION CONNECTÉE
          </span>
        </div>
        <motion.div
          className="account-cover-profile"
          variants={staggerContainer}
          initial={reducedMotion ? false : "hidden"}
          animate="visible"
        >
          <motion.div
            className="account-photo-shell"
            variants={cardReveal}
            whileHover={
              reducedMotion ? undefined : { scale: 1.055, rotate: -2 }
            }
          >
            <div className="account-photo">
              {profile?.photo ? (
                <img src={PhotoLink('users',profile?.photo)} alt=" " onClick={show}/>
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <span className="account-photo-status">
              <FiCheck />
            </span>
          </motion.div>
          <motion.div className="account-cover-name" variants={cardReveal}>
            <span className="account-mini-label">PROFIL UTILISATEUR</span>
            <h2>{fullName || "Utilisateur MSBC"}</h2>
            <p>
              <FiActivity /> {profile?.fonction.replaceAll("_"," ") || "Fonction non renseignée"}
            </p>
          </motion.div>
          <motion.button
            variants={cardReveal}
            whileHover={reducedMotion ? undefined : { y: -3, scale: 1.025 }}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            type="button"
            onClick={() => setSection("edit")}
            className="account-cover-edit"
          >
            <FiEdit3 /> Modifier mon profil <FiArrowRight />
          </motion.button>
        </motion.div>
        <div
          className="account-completion"
          aria-label={`Profil complété à ${profileCompletion} %`}
        >
          <span>
            <small>PROFIL COMPLÉTÉ</small>
            <strong>{profileCompletion}%</strong>
          </span>
          <div>
            <i style={{ width: `${profileCompletion}%` }} />
          </div>
        </div>
      </motion.section>

      <motion.div
        className="account-status-strip"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <span>
          <FiCheckCircle /> Compte connecté via MSBC
        </span>
        <span>
          <FiShield /> Informations
        </span>
        {hasUnsavedChanges && (
          <span className="account-local-mark">
            <FiInfo /> Modifications non enregistrées
          </span>
        )}
      </motion.div>

      <div className="account-body">
        <motion.aside
          className="account-side"
          initial={reducedMotion ? false : { opacity: 0, x: -22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          <div className="account-side-menu">
            <span className="account-side-title">GESTION DU COMPTE</span>
            <motion.button
              layout
              whileHover={{ x: reducedMotion ? 0 : 4 }}
              whileTap={{ scale: reducedMotion ? 1 : 0.98 }}
              className={section === "overview" ? "selected" : ""}
              onClick={() => setSection("overview")}
              type="button"
            >
              {section === "overview" && (
                <motion.span
                  layoutId="account-active-pill"
                  className="account-active-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                />
              )}
              <FiUser /> Vue d’ensemble <FiArrowRight />
            </motion.button>
            <motion.button
              layout
              whileHover={{ x: reducedMotion ? 0 : 4 }}
              whileTap={{ scale: reducedMotion ? 1 : 0.98 }}
              className={section === "edit" ? "selected" : ""}
              onClick={() => setSection("edit")}
              type="button"
            >
              {section === "edit" && (
                <motion.span
                  layoutId="account-active-pill"
                  className="account-active-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                />
              )}
              <FiEdit3 /> Modifier le profil <FiArrowRight />
            </motion.button>
            <motion.button
              layout
              whileHover={{ x: reducedMotion ? 0 : 4 }}
              whileTap={{ scale: reducedMotion ? 1 : 0.98 }}
              className={section === "security" ? "selected" : ""}
              onClick={() => setSection("security")}
              type="button"
            >
              {section === "security" && (
                <motion.span
                  layoutId="account-active-pill"
                  className="account-active-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                />
              )}
              <FiLock /> Sécurité <FiArrowRight />
            </motion.button>
          </div>
          <div className="account-side-help">
            <div className="account-help-icon">
              <FiShield />
            </div>
            <h3>Vos données, votre contrôle</h3>
            <p>
              Les changements sont enregistré et validés uniquement
              après confirmation de celui-ci.
            </p>
          </div>
        </motion.aside>

        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            className="account-panel"
            initial={
              reducedMotion ? false : { opacity: 0, x: 18, filter: "blur(4px)" }
            }
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -12, filter: "blur(3px)" }
            }
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {section === "overview" && (
              <>
                <header className="account-panel-head">
                  <div>
                    <span className="account-section-tag">
                      <FiFileText /> VOTRE IDENTITÉ
                    </span>
                    <h2>Informations personnelles</h2>
                    <p>Renseignements associés à votre espace MSBC.</p>
                  </div>
                  <button
                    className="account-btn account-btn-outline"
                    type="button"
                    onClick={() => setSection("edit")}
                  >
                    <FiEdit3 /> Modifier
                  </button>
                </header>
                <motion.div
                  className="account-details"
                  variants={staggerContainer}
                  initial={reducedMotion ? false : "hidden"}
                  animate="visible"
                >
                  {details.map((item) => (
                    <motion.div
                      variants={cardReveal}
                      whileHover={
                        reducedMotion
                          ? undefined
                          : {
                              y: -3,
                              boxShadow: "0 8px 28px rgba(10,70,55,.07)",
                            }
                      }
                      className="account-detail"
                      key={item.label}
                    >
                      <span className="account-detail-icon">{item.icon}</span>
                      <div>
                        <small>{item.label}</small>
                        <strong>{item.value || "Non renseigné"}</strong>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                <div className="account-description">
                  <span>
                    <FiFileText /> À PROPOS
                  </span>
                  <p>
                    {profile?.description ||
                      "Aucune description renseignée pour ce profil."}
                  </p>
                </div>
                <div className="account-panel-foot">
                  <span>
                    <FiInfo /> Informations
                  </span>
                  <button type="button" onClick={() => setSection("edit")}>
                    Mettre à jour mes informations <FiArrowRight />
                  </button>
                </div>
              </>
            )}

            {section === "edit" && (
              <>
                <header className="account-panel-head">
                  <div>
                    <span className="account-section-tag">
                      <FiEdit3 /> MODIFICATION DU PROFIL
                    </span>
                    <h2>Modifier mes informations</h2>
                    <p>
                      Vos changements seront traité lorsque vous
                      enregistrerez.
                    </p>
                  </div>
                  <button
                    className="account-btn account-btn-outline"
                    type="button"
                    onClick={cancel}
                  >
                    <FiArrowLeft /> Retour
                  </button>
                </header>
                <form onSubmit={save} method="post">
                  <motion.div
                    className="account-edit-photo"
                    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                  >
                    <div className="account-edit-avatar">
                      {profile?.photo || preview ? (
                        <img src={preview === null ? PhotoLink('users',profile.photo) : preview} alt=" " />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div>
                      <h3>Photo de profil</h3>
                      <p>
                        JPG, PNG ou WebP — 5 Mo maximum. Image optimisée
                        automatiquement.
                      </p>
                      <button
                        className="account-btn account-btn-outline"
                        type="button"
                        onClick={() => photoInput.current?.click()}
                      >
                        <FiCamera /> Changer la photo
                      </button>
                     
                      <input
                        ref={photoInput}
                        type="file"
                        hidden
                        accept="image/png,image/jpeg,image/webp"
                        onChange={uploadPhoto}
                      />
                      {errors.photo && (
                        <small className="account-error" role="alert">
                          {errors.photo}
                        </small>
                      )}
                    </div>
                  </motion.div>
                  <motion.div
                    className="account-form-grid"
                    variants={staggerContainer}
                    initial={reducedMotion ? false : "hidden"}
                    animate="visible"
                  >
                    {(
                      [
                        ["noms", "Nom", "text"],
                        ["prenoms", "Prénoms", "text"],
                        ["telephone", "Téléphone", "tel"],
                        ["cin","CIN","text"]
                      ] as const
                    ).map(([key, label, type]) => (
                      <motion.label
                        variants={cardReveal}
                        className="account-field"
                        key={key}
                      >
                        <span>
                          {label}
                          {(key === "noms" || key === "prenoms") && " *"}
                        </span>
                        <input
                          type={type}
                          value={profile?.[key]}
                          onChange={(event) =>
                            setField(key, event.target.value)
                          }
                          aria-invalid={Boolean(errors[key])}
                          placeholder={`Votre ${label.toLowerCase()}`}
                        />
                        {errors[key] && (
                          <small className="account-error" role="alert">
                            {errors[key]}
                          </small>
                        )}
                      </motion.label>
                    ))}
                    <motion.label
                      variants={cardReveal}
                      className="account-field"
                    >
                      <span>Fonction</span>
                      <input
                        type="text"
                        value={user?.fonction.replaceAll("_"," ") || "Non renseigné"}
                        disabled
                      />
                      <small></small>
                    </motion.label>
                    <motion.label
                      variants={cardReveal}
                      className="account-field"
                    >
                      <span>Numéro de compte</span>
                      <input
                        type="text"
                        value={`MSBC-USER-${user?.id}`}
                        disabled
                      />
                      <small>Identifiant interne non modifiable.</small>
                    </motion.label>
                    <motion.label
                      variants={cardReveal}
                      className="account-field full"
                    >
                      <span>Description personnelle</span>
                      <textarea
                      readOnly
                      disabled
                        rows={4}
                        value={profile?.description}
                        maxLength={501}
                      
                        placeholder="Parlez de votre rôle au sein de MSBC…"
                      />
                      <small
                        className={
                          errors.description
                            ? "account-error"
                            : "account-counter"
                        }
                      >
                        {errors.description ||
                          `${profile?.description.length}/500 caractères`}
                      </small>
                    </motion.label>
                  </motion.div>
                  <div className="account-editor-footer">
                    <button
                      className="account-btn account-btn-light"
                      type="button"
                      onClick={cancel}
                    >
                      <FiX /> Annuler
                    </button>
                    <button
                      className="account-btn account-btn-primary"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? 
                        <>
                          <FiRefreshCw className="account-spin" />{" "}
                          Enregistrement…
                        </>
                       : 
                        <>
                          <FiSave /> <p>Enregistrer sur le serveur</p> <FiArrowRight />
                        </>
                      }
                    </button>
                  </div>
                </form>
              </>
            )}

            {section === "security" && (
              <>
                <header className="account-panel-head">
                  <div>
                    <span className="account-section-tag">
                      <FiShield /> CONFIDENTIALITÉ ET ACCÈS
                    </span>
                    <h2>Sécurité du compte</h2>
                    <p>
                      Gérez le mot de passe de votre compte et les accès à votre
                      session.
                    </p>
                  </div>
                </header>
                <div className="account-security-feature">
                  <div className="account-security-symbol">
                    <FiLock />
                  </div>
                  <div>
                    {/* <h3>Votre compte</h3>
                    <p>
                      Votre mot de passe sera vérifié et modifié.
                    </p> */}
                    <span>
                      <FiCheckCircle /> Session contrôlée et sécurisés
                      existant
                    </span>
                  </div>
                </div>
                <PasswordChangeForm csrfToken={user.csrfToken} />
                <div className="account-security-row">
                  <span className="account-detail-icon">
                    <FiRotateCcw />
                  </span>
                  <div>
                    <strong>Annuler les modifications en cours</strong>
                    <p>
                      Retrouver les informations confirmées.
                    </p>
                  </div>
                  <button
                    className="account-btn account-btn-outline"
                    type="button"
                    onClick={() => void restore()}
                  >
                    Restaurer
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* <div className="account-disclaimer">
        <FiInfo />
        <p>
          <strong>Profil et mot de passe :</strong> les modifications passent
          exclusivement par les API PHP. Les endpoints /auth/profile et
          /auth/change-password doivent être présents et sécurisés côté serveur.
        </p>
      </div> */}
    </motion.main>
  );
}

import "../../assets/css/compte.mobile.css";
import ResizeImg, { PhotoUrl } from "../../service/ResizeImg";
import SetFormData from "../../service/formData";
import { endpointUpdateProfile } from "../../service/Setups/NormalizeEnv";
import MyProfile from "../../service/Setups/showProfile";
import PhotoLink from "../../service/Setups/photoSetup";

