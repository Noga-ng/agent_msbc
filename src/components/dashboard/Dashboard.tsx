import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { Link } from "react-router";
import { FiAlertCircle, FiArrowRight, FiCheckCircle, FiClock, FiRefreshCw, FiUserPlus, FiUsers } from "react-icons/fi";
import { useAuth } from "../../Auth/UseAuth";
import client from "../../service/Client";
import type { Contenus } from "../../service/Type";
import "../../assets/css/dashboard.css";
import LoadingState from "../Loaders/LoadingState";
import formatDate from "../../service/formatDate";
import { normalizeMemberStatus } from "../../service/memberRules";
import { COLORS, MONTHS, type DashboardMember } from "./TypeD";
import type ApiResponse from "./TypeD";

/** Contrat exact de GET /recuperationtotalM/{users} */
type DashboardApiResponse = ApiResponse & {
  active: number;
  pending: number;
  total: number;
};




function normalizeKind(value: unknown): DashboardMember["kind"] {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("conjoint")) return "Conjoint(e)";
  if (normalized.includes("enfant")) return "Enfant";
  return "Titulaire";
}

function normalizeApiMember(member: Contenus & { date?: string }): DashboardMember {
  return {
    id: String(member.identifiant),
    name: `${member.noms ?? ""} ${member.prenoms ?? ""}`.trim(),
    kind: normalizeKind(member.titre),
    category: member.categorie ?? "Non renseignée",
    date: (typeof member.date === "string" && member.date.trim())
      ? member.date
      : (member.inscription ?? ""),
    status: normalizeMemberStatus(member.status),
  };
}

/** Regroupe les dates PHP par mois sans dépendre de Date.parse (non fiable pour JJ/MM/AAAA). */
function registrationMonthKey(raw: string): string | null {
  const date = raw.trim();
  const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/.exec(date);
  const french = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s.*)?$/.exec(date);
  if (!iso && !french) return null;

  const year = Number(iso ? iso[1] : french![3]);
  const month = Number(iso ? iso[2] : french![2]);
  const day = Number(iso ? iso[3] : french![1]);
  const validated = new Date(Date.UTC(year, month - 1, day));
  if (
    validated.getUTCFullYear() !== year ||
    validated.getUTCMonth() + 1 !== month ||
    validated.getUTCDate() !== day
  ) return null;

  return `${year}-${String(month).padStart(2, "0")}`;
}

const commonOptions: ApexOptions = {
  chart: { 
    fontFamily: "inherit", 
    toolbar: { show: false }, 
    animations: { enabled: true } 
  },
  dataLabels: { enabled: false },
  legend: { position: "bottom", fontSize: "12px" },
  grid: { borderColor: "#eef1f4", strokeDashArray: 4 },
  tooltip: { theme: "light" },
  noData: { text: "Aucune donnée disponible" },
};

export default function DashBoard() {

  const { user } = useAuth();
  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [totals, setTotals] = useState({ active: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      if (user?.id == null) {
        throw new Error("Session indisponible. Reconnectez-vous pour afficher les statistiques.");
      }
      const response = await client.get<DashboardApiResponse>(`/recuperationtotalM/${user.id}`, {
        credentials: "include",
        signal,
      });

      if (!response.ok || !response.data?.status) {
        throw new Error(response.data?.message || "Impossible de récupérer les membres.");
      }

      const payload = response.data;
      if (!payload || !Array.isArray(payload.data)) {
        throw new Error("Réponse est invalide : liste des membres absente.");
      }
      const { active, pending, total } = payload;
      if (![active, pending, total].every((value) => Number.isInteger(value) && value >= 0)) {
        throw new Error("Réponse PHP invalide : statistiques manquantes.");
      }
      if (!signal?.aborted) {
        setMembers(payload.data.map(normalizeApiMember));
        setTotals({ active, pending, total });
      }

    } catch (cause) {

      if (!signal?.aborted) {
        setMembers([]);
        setTotals({ active: 0, pending: 0, total: 0 });
        setError(cause instanceof Error ? cause.message : "Une erreur inconnue est survenue.");
      }

    } finally {
      if (!signal?.aborted) 
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void reload(controller.signal), 0);
    return () => {
      window.clearTimeout(task);
      controller.abort();
    };
  }, [reload]);

  const statistics = useMemo(() => {
    const kinds = ["Titulaire", "Conjoint(e)", "Enfant"] as const;
    const kindValues = kinds.map((kind) => members.filter((member) => member.kind === kind).length);
    const today = new Date();
    const labels: string[] = [];
    const monthly: number[] = [];
    const counts = new Map<string, number>();
    let validDateCount = 0;

    for (const member of members) {
      const month = registrationMonthKey(member.date);
      if (!month) continue;
      validDateCount += 1;
      counts.set(month, (counts.get(month) ?? 0) + 1);
    }

    for (let offset = 11; offset >= 0; offset -= 1) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      labels.push(`${MONTHS[monthDate.getMonth()]} ${String(monthDate.getFullYear()).slice(-2)}`);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      monthly.push(counts.get(key) ?? 0);
    }
    const categories = Array.from(new Set(members.map((member) => member.category || "Non renseignée")));
    const categoryCounts = categories.map((category) => members.filter((member) => member.category === category).length);
    return { 
      kinds, kindValues, labels, monthly, validDateCount, categories, categoryCounts 
    };
  }, [members]);

  const areaOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "area" },
    colors: [COLORS[0]],
    stroke: { width: 3, curve: "smooth" },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.32, opacityTo: 0.03 } },
    xaxis: { categories: statistics.labels, labels: { rotate: -45, style: { fontSize: "11px" } } },
    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (value) => String(Math.round(value)) } },
  };

  const donutOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "donut" },
    labels: ["Actifs", "En attente"],
    colors: COLORS.slice(0, 2),
    plotOptions: { pie: { donut: {
       size: "68%", 
       labels: { 
        show: true, 
        total: { 
          show: true, 
          label: "Membres", 
          formatter: () => String(totals.total) 
        } 
        }
       } 
      } 
    },
    stroke: { width: 3, colors: ["#ffffff"] },
  };

  const barOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, type: "bar" },
    colors: COLORS,
    plotOptions: { bar: {
       horizontal: true, 
       distributed: true, 
       borderRadius: 7, 
       borderRadiusApplication: "end", 
       barHeight: "55%"
       }
      },
    xaxis: { 
      categories: statistics.categories, 
      labels: { 
        formatter: (value) => String(Math.round(Number(value))) 
      } 
    },
    yaxis: {
       labels: { 
        maxWidth: 160 
      } 
    },
    legend: { 
      show: false 
    },
  };

  const recent = [...members].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)).slice(0, 5);

  const formatMoney = (montant: number): string => {
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
};

  return (
    <section className="content-wrap ms-dashboard">
      <header className="ms-dash-header">
        <div>
          <span className="ms-dash-eyebrow">MSBC TOAMASINA · VUE D’ENSEMBLE</span>
        </div>
        <div className="ms-dash-actions">
          {/* <span className="ms-dash-mode">Données synchronisées · API PHP</span> */}
          <button type="button" onClick={() => void reload()} disabled={loading} className="ms-dash-refresh">
            <FiRefreshCw aria-hidden="true" /> Actualiser
          </button>
          <Link to="/inscription" className="ms-dash-add"><FiUserPlus aria-hidden="true" /> Inscrire</Link>
        </div>
      </header>

      {error && (
        <div className="ms-dash-alert" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => void reload()}>Réessayer</button>
        </div>
      )}

      {loading ? (
        <LoadingState label="Chargement des statistiques..." />
      ) : error ? null : (
        <>
          <div className="ms-dash-stats">
            <article className="ms-dash-stat primary">
              <FiUsers /><span>Total des membres</span>
              <strong>{totals.total.toLocaleString("fr-FR")}</strong>
              <small>Toutes les fiches recensées</small>
            </article>

            <article className="ms-dash-stat">
              <FiCheckCircle /><span>Profils actifs (Ar)</span>
              <strong>{formatMoney(totals.active * 3400)}</strong>
              <small>{totals.active ?? 0} actif(s) soit {totals.total ? Math.round(totals.active * 100 / totals.total) : 0} % des membres</small>
            </article>

            <article className="ms-dash-stat">
              <FiClock /><span>En attente</span>
              <strong>{totals.pending.toLocaleString("fr-FR")}</strong>
              <small>{totals.total ? Math.round(totals.pending * 100 / totals.total) : 0} % des membres Profils à examiner</small>
            </article>

            <article className="ms-dash-stat">
              <FiUserPlus /><span>Titulaires</span>
              <strong>{statistics.kindValues[0].toLocaleString("fr-FR")}</strong>
              <small>Fiches de référence</small>
            </article>
          </div>

          {members.length === 0 ? (
            <div className="ms-dash-empty"><FiUsers size={34} />
              <h2>Aucun membre enregistré</h2>
              <p>Les graphiques apparaîtront dès que des inscriptions seront disponibles.</p>
              <Link to="/inscription">Créer une inscription <FiArrowRight /></Link>
            </div>
          ) : (
            <div className="ms-dash-charts">
              <article className="ms-dash-panel ms-dash-wide">
                <div className="ms-dash-panel-heading">
                  <div>
                    <h2>Évolution des inscriptions</h2>
                    <p>Nombre de fiches créées sur les 12 derniers mois</p>
                  </div>
                </div>
                {statistics.validDateCount === 0 ? (
                  <p className="ms-dash-empty" role="status">
                    Aucune date d'inscription valide dans les données. Vérifiez le champ date.
                  </p>
                ) : statistics.monthly.every((count) => count === 0) ? (
                  <p className="ms-dash-empty" role="status">
                    Aucune fiche créée sur les 12 derniers mois.
                  </p>
                ) : (
                  <Chart
                    options={areaOptions}
                    series={[{ name: "Inscriptions", data: statistics.monthly }]}
                    type="area"
                    height={310}
                    width="100%"
                  />
                )}
              </article>
              <article className="ms-dash-panel">
                <div className="ms-dash-panel-heading">
                <div>
                  <h2>Statut des membres</h2>
                  <p>Actifs et en attente</p>
                </div>
                </div>
                <Chart options={donutOptions} series={[totals.active, totals.pending]} type="donut" height={310} width="100%" />
              </article>
              <article className="ms-dash-panel ms-dash-wide">
                <div className="ms-dash-panel-heading">
                  <div>
                    <h2>Répartition par catégorie</h2>
                    <p>Catégories déclarées dans les fiches</p>
                  </div>
                </div>
                <Chart options={barOptions} 
                       series={[{ name: "Membres", data: statistics.categoryCounts }]} 
                       type="bar" height={Math.max(290, statistics.categories.length * 50 + 90)} 
                       width="100%" 
                    />
              </article>
              <article className="ms-dash-panel">
                <div className="ms-dash-panel-heading">
                  <div>
                    <h2>Dernières inscriptions</h2>
                    <p>Les cinq fiches les plus récentes</p>
                  </div>
                  <Link to="/membres">Voir tout <FiArrowRight /></Link></div>
                <div className="ms-dash-recent">
                  {recent.map((member) => (
                    <div className="ms-dash-person" key={member.id}>
                      <span className="ms-dash-avatar">{member.name.slice(0, 1).toUpperCase() || "M"}</span>
                      <span className="ms-dash-person-name">
                        <strong>{member.name || "Sans nom"}</strong>
                        <small>{member.kind} · {formatDate(member.date)}</small>
                      </span>
                      <span className={member.status === "active" ? "ms-dash-status active" : "ms-dash-status"}>
                        {member.status === "active" ? "Actif" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}
        </>
      )}
    </section>
  );
}
