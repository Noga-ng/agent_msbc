import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FiRefreshCw, FiSearch, FiX } from "react-icons/fi";
import { LuUsersRound } from "react-icons/lu";
import { Link } from "react-router";
import { useAuth } from "../../Auth/UseAuth";
import client from "../../service/Client";
import type { Contenus } from "../../service/Type";
import { filterApiMembers, type MemberStatusFilter } from "./memberSearch";
import LoadingState from "../Loaders/LoadingState";
import MembersTable from "./MemberTable";
import "../../assets/css/membres-search.css";

type ResRecuperation = { 
  status: boolean; 
  message?: string; 
  data: Contenus[] | null 
};

export default function MembersPage(): ReactElement {
  const { user } = useAuth();
  const id = user?.id;
  const [members, setMembers] = useState<Contenus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [filter, setFilter] = useState<MemberStatusFilter>("all");
  const [revision, setRevision] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (id == null) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true); setError("");
      try {
        const response = await client.get<ResRecuperation>(
          `/recuperationMembres/${encodeURIComponent(id)}`, 
          { 
            credentials: "include", 
            signal: controller.signal, 
            cache: false 
          }
        );

        if (!response.ok || response.data?.status !== true || !Array.isArray(response.data.data)) 
                throw new Error(response.data?.message || "Impossible de récupérer les membres.");

        if (!controller.signal.aborted) setMembers(response.data.data.filter((member): member is Contenus =>
          Boolean(member && typeof member.identifiant === "string" && typeof member.noms === "string")
        ));
      } catch (cause) {
        if (!controller.signal.aborted) { 
          setMembers([]); 
          setError(cause instanceof Error ? cause.message : "Erreur de connexion."); 
        }
      } finally { 
        if (!controller.signal.aborted) setLoading(false); 
      }
    })();
    
    return () => controller.abort();
  }, [id, revision]);

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);

  const filtered = useMemo(() => {
    return filterApiMembers(members, deferredQuery, filter);
  }, [members, deferredQuery, filter]);

  if (id == null) 
    return <main className="members-empty" role="alert">Session de l'agent indisponible. Reconnectez-vous.</main>;

  return <section className="members-table-wrap ms-member-list">

    <div className="ms-members-toolbar">
       <button type="button" className="ms-members-refresh" 
              disabled={loading} onClick={() => setRevision(r => r + 1)}>
                <FiRefreshCw className={loading ? "ms-refresh-spin" : ""} />
      </button>

      <label className="ms-members-search" htmlFor="msbc-members-search">
        <FiSearch aria-hidden="true" size={20}/>
        <input id="msbc-members-search" ref={searchRef} type="search" 
               autoComplete="off" value={query} onChange={event => setQuery(event.target.value)} 
               placeholder="Nom, prénom, CIN, identifiant, téléphone…" aria-label="Rechercher parmi les membres" />
        {query ? 
        <button type="button" className="ms-members-clear" 
                onClick={() => { setQuery(""); searchRef.current?.focus(); }} 
                aria-label="Effacer la recherche">
                  <FiX size={18}/>
        </button> : <kbd>Ctrl K</kbd>
        }
      </label>
      <label className="ms-members-filter">
        <select aria-label="Filtrer selon le statut" value={filter} 
                onChange={event => setFilter(event.target.value as MemberStatusFilter)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="pending">En attente</option>
        </select>
      </label>
      
    </div>
    {!loading && !error && 
    <div className="ms-members-counter" aria-live="polite">
      <span>
        <b>{filtered.length}</b> {`résultat${filtered.length > 1 ? "s" : ""} 
            sur ${members.length} membres`}
      </span>
    </div>
    }
    {loading ? <LoadingState label="Récupération des membres…" /> :
      error ? 
      <div className="members-empty" role="alert">
        <h3>Impossible de charger les membres</h3>
        <p>{error}</p>
        <button type="button" className="ms-members-refresh" onClick={() => setRevision(r => r + 1)}>
          Réessayer
        </button>
      </div> :
      filtered.length ? 
      <motion.div 
      className="ms-members-table-scroll" 
      initial={reduced ? false : 
        { opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: .28 }}
        >
          <MembersTable membres={filtered} />
          </motion.div> :
      <div className="members-empty">
        <LuUsersRound size={53} aria-hidden="true" />
        <h3>{members.length ? "Aucun résultat" : "Aucun membre enregistré"}</h3>
        <p>{
        members.length ? 
        "Essayez une autre recherche ou réinitialisez les filtres." : 
        "Les nouvelles inscriptions seront affichées ici après l'enregistrement."
        }
        </p>
        {members.length ? 
        <button type="button" className="ms-members-refresh" 
                onClick={() => { setQuery(""); setFilter("all"); }}>
                  Effacer les filtres
        </button> : 
        <Link to="/inscription" className="ms-members-refresh">Nouvelle inscription</Link>
        }
      </div>}
  </section>;
}
