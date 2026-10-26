import LoadingState from "../Loaders/LoadingState";
import { useEffect, useState, type ReactElement } from "react";
import {
  BiBadgeCheck,
  BiCheck,
  BiMapPin,
  BiPhone,
} from "react-icons/bi";
import { GiSparkles } from "react-icons/gi";
import {
  LuBriefcaseBusiness,
  LuCircleUserRound,
  LuClock3,
  LuPlus,
  LuPencil,
} from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router";
import { memberStatusLabel, normalizeMemberStatus } from "../../service/memberRules";

import type { Conjoint, Enfant, Members } from "../../Response";
import ConjointState from "./ConjointState";
import EnfantsState from "./EnfantsState";
import client from "../../service/Client";
import PhotoLink from "../../service/Setups/photoSetup";
import MyProfile from "../../service/Setups/showProfile";

interface Family {
  titularies: Members | null;
  conjoint: Conjoint | null;
  enfants: Enfant[] | null;
}

interface ResMembers {
  status: boolean;
  message: string;
  data: Family;
}

export default function MemberState(): ReactElement {
  const navigate = useNavigate();
  const { id: identifiant } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [member, setMember] = useState<Members | null>(null);
  const [conjoint, setConjoint] = useState<Conjoint | null>(null);
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [visible,setVisibility] = useState<boolean>(false);
  const [status,setStatus] = useState<"titulaire"|"conjoint"|"enfant">("titulaire");
  const [imageM,setImage] = useState<string>("");
  /**
   * Catégories qui ne permettent pas
   * l'ajout d'un conjoint ou d'enfants.
   */
  const excludedCategories = ["salam@", "salam@be"];

  const hasFamily =
    member !== null &&
    !excludedCategories.includes(member.categorie?.toLowerCase());

  /**
   * Nom complet du titulaire
   */
  const fullname =
    member !== null
      ? `${member.noms} ${member.prenoms}`
      : "";

  /**
   * Chargement du membre
   */
  useEffect(() => {
    if (!identifiant) {
      const frame = window.requestAnimationFrame(() => { 
        setLoading(false); 
        setError("Identifiant du membre manquant."); 
      });

      return () => window.cancelAnimationFrame(frame);
    }

    let cancelled = false;
    const loadMember = async (): Promise<void> => {
      setLoading(true); setError(""); setMember(null);
      try {
        const res = await client.get<ResMembers>(
          `/membres/${encodeURIComponent(identifiant)}`,
          {
            credentials: "include",
          }
        );

        const data = res.data;

        if (!res.ok || !data?.status) {
          throw new Error(
            data?.message ?? "Impossible de récupérer le membre."
          );
        }

        if (cancelled) {
          return;
        }

        const values = data.data;

        setMember(values.titularies);
        setConjoint(values.conjoint);
        setEnfants(values.enfants ?? []);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(error instanceof Error ? error.message : "Impossible de charger cette fiche.");
      }
      finally { 
        if (!cancelled) setLoading(false);
       }
    };

    void loadMember();

    return () => {
      cancelled = true;
    };
  }, [identifiant]);


  /**
   * Ajouter un conjoint
   */
  const handleAddConjoint = (): void => {
    if (!member?.identifiant) {
      return;
    }

    navigate(`/membres/${encodeURIComponent(member.identifiant)}/ajouter-conjoint`);
  };

  /**
   * Ajouter un enfant
   */
  const handleAddEnfant = (): void => {
    if (!member?.identifiant) {
      return;
    }

    navigate(`/membres/${encodeURIComponent(member.identifiant)}/ajouter-enfant`);
  };

  const show = (status:"titulaire"|"conjoint"|"enfant",photo:string) =>{
      setStatus(status)
      setImage(photo)
      setVisibility(true)
  }

  if (loading) return <LoadingState label="Chargement de la fiche membre…" />;
  if (error || !member) 
    return <main className="content-wrap" role="alert">
    <p>{error || "Fiche introuvable."}</p>
    <button className="secondary-button" onClick={() => navigate("/membres")}>Retour aux membres</button>
   </main>;

  return (
    <main>
      <MyProfile 
        visible={visible} 
        photo={imageM} 
        type={status} 
        setting={setVisibility}
        />
      <section className="content-wrap dashboard-view">
        {/* ================= HEADER ================= */}

        <div className="dashboard-heading">
          <div className="page-heading" />
        </div>

        {/* ================= STATISTIQUES ================= */}

        <div className="stats-grid">
          {/* Statut */}
          <article className="stat-card stat-highlight">
            <span className="stat-icon">
              <BiBadgeCheck size={21} />
            </span>

            <div>
              <small>Statut du profil</small>

              <strong>
                {memberStatusLabel(member.status)}
              </strong>
            </div>

            <span
              className={`status-dot status-dot-${
                normalizeMemberStatus(member.status)
              }`}
            />
          </article>

          {/* Catégorie */}
          <article className="stat-card">
            <span className="stat-icon">
              <GiSparkles size={21} />
            </span>

            <div>
              <small>Catégorie</small>
              <strong>{member.categorie}</strong>
            </div>
          </article>

          {/* Date d'inscription */}
          <article className="stat-card">
            <span className="stat-icon">
              <LuClock3 size={21} />
            </span>

            <div>
              <small>Inscription</small>

              <strong>
                {new Date(
                  member.inscription
                ).toLocaleDateString("fr-FR")}{" "}
                à{" "}
                {new Date(
                  member.inscription
                ).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </div>
          </article>
        </div>

        {/* ================= CONTENU ================= */}

        <div className="dashboard-grid">
          {/* ================= PROFIL ================= */}

          <article className="profile-card">
            <div className="profile-hero">
              {/* Photo */}
              <span className="w-25 h-25 block overflow-hidden rounded-2xl">
                {member.photo ? (
                  <img
                    src={`${member.photo ? PhotoLink('titulaire',member.photo) : ''}`}
                    className="w-full h-full block object-cover"
                    alt={member.noms?.slice(0, 1) ?? ""}
                    onClick={()=>show("titulaire",member.photo)}
                  />
                ) : (
                  <span
                    className="
                      bg-green-400
                      text-white
                      font-bold
                      flex
                      w-full
                      h-full
                      items-center
                      justify-center
                      text-6xl
                    "
                  >
                    {member.noms?.slice(0, 1) ?? "?"}
                  </span>
                )}
              </span>

              {/* Informations */}
              <div>
                <span
                  className={`profile-tag profile-tag-${
                    normalizeMemberStatus(member.status)
                  }`}
                >
                  <BiCheck size={13} />

                  {normalizeMemberStatus(member.status) === "active"
                    ? "profil actif"
                    : "profil en attente"}
                </span>

                <h2>{fullname}</h2>

                <p aria-label="identifiant du membre">
                  {member.identifiant}-MSBC/TM
                </p>
              </div>
              <Link className="member-profile-edit" 
                    to={`/membres/${encodeURIComponent(member.identifiant)}/modifier`}>
                <LuPencil size={16} />edit
              </Link>
            </div>

            {/* ================= INFORMATIONS ================= */}

            <div className="info-list">
              <div>
                <span>
                  <LuCircleUserRound size={18} />
                  Carte d'identité Nationale
                </span>

                <strong>{member.cin}</strong>
              </div>

              <div>
                <span>
                  <BiMapPin size={18} />
                  Localisation
                </span>

                <strong>
                  {member.adresse || "Non renseignée"}
                </strong>
              </div>

              <div>
                <span>
                  <BiPhone size={18} />
                  Contact
                </span>

                <strong>
                  {member.telephone ?? ""}
                </strong>
              </div>

              <div>
                <span>
                  <LuBriefcaseBusiness size={18} />
                  Activité
                </span>

                <strong>
                  {member.profession}
                </strong>
              </div>
            </div>
          </article>

          {/* ================= FAMILLE ================= */}

          {hasFamily && (
            <div className="dashboard-side">
              {/* ================= CONJOINT ================= */}

              <article className="skills-card">
                <div
                  className="
                    w-full
                    p-5
                    h-5
                    rounded-tl-2xl
                    rounded-tr-2xl
                    flex
                    items-center
                    justify-baseline
                    bg-(--ink)
                  "
                >
                  <span className="text-white font-bold">
                    Conjoint(e)
                  </span>
                </div>

                {conjoint === null ? (
                  <div className="bg-white rounded-2xl flex items-center justify-center p-5">
                    <button
                      className="
                        border-none
                        bg-transparent
                        w-full
                        h-full
                        flex
                        justify-center
                        items-center
                        cursor-pointer
                      "
                      type="button"
                      onClick={handleAddConjoint}
                    >
                      <LuPlus />
                      Ajouter
                    </button>
                  </div>
                ) : (
                  <ConjointState 
                    conjoint={conjoint} 
                    show={show} 
                    holderId={member.identifiant} 
                    />
                )}
              </article>

              {/* ================= ENFANTS ================= */}

              <article
                className="list-child"
                aria-label="liste des enfants"
              >
                <div
                  className="
                    w-full
                    p-5
                    h-5
                    rounded-tl-2xl
                    rounded-tr-2xl
                    flex
                    items-center
                    justify-between
                    bg-(--ink)
                  "
                >
                  <span className="text-white font-bold">
                    Enfant(s)
                  </span>
                  <button
                      className="
                        border-none
                        w-fit
                        h-fit
                        flex
                        rounded
                        p-2
                        justify-center
                        items-center
                        cursor-pointer
                      "
                      type="button"
                      onClick={handleAddEnfant}
                    >
                      <span className="flex gap-2 items-center-safe text-white text-sm">
                        <LuPlus />Ajouter
                      </span>
                    </button>
                </div>

                {enfants.length === 0 ? (
                  <div className="bg-white rounded-2xl flex items-center justify-center p-5">
                    <button
                      className="
                        border-none
                        bg-transparent
                        w-full
                        h-full
                        flex
                        justify-center
                        items-center
                        cursor-pointer
                      "
                      type="button"
                      onClick={handleAddEnfant}
                    >
                      <LuPlus />
                      Ajouter
                    </button>
                  </div>
                ) : (
                  <div className="contact-card">
                    {
                    enfants.map((enfant) => (
                      <EnfantsState
                        key={enfant.identifiant}
                        enfant={enfant}
                        show={show}
                        holderId={member.identifiant}
                      />
                    ))
                    }
                  </div>
                )}
              </article>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
