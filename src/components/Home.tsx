import {
  FiArrowRight as ArrowRight,
  FiAward as BadgeCheck,
  FiCheck as Check,
  FiCheckCircle as CheckCircle2,
  FiGrid as LayoutDashboard,
  FiShield as ShieldCheck,
  FiStar as Sparkles,
  FiUserPlus as UserRoundPlus,
  FiUsers as UsersRound,
} from "react-icons/fi";
import HomeNav from "./NavBar/HomeNav";
import { Link } from "react-router";
import msbc from "../assets/images/msbc.jpg";
import {motion} from "framer-motion";
import type { ReactElement } from "react";

export default function Home():ReactElement {

  return (
    <>
      <HomeNav />

    <main className="landing-page" aria-label="main de la page d'aceuil" id="accueil">

      <motion.section
      initial={{
        opacity:0,
        y:20
      }}
      animate={{
        opacity:1,
        y:0
      }}
      transition={{
        duration:.4
      }}

      className="landing-hero">
        <div className="hero-glow hero-glow-coral" />
        <div className="hero-glow hero-glow-lime" />
        <div className="landing-hero-copy">
          <span className="landing-badge"><Sparkles size={14} /> Simple, clair et bien organisé</span>
          <h1>Vos membres.<br />Leurs talents.<br />
          <em>Un seul espace.</em>
          </h1>
          <p>
            Centralisez les inscriptions, valorisez les compétences et gérez
            vos membres depuis une plateforme moderne. L’accès aux données nécessite une connexion autorisée.
          </p>
          <div className="landing-hero-actions">

            <Link className="primary-button landing-primary" to="/inscription">
              Commencer l'inscription
              <ArrowRight size={18} />
            </Link>
            <Link className="landing-text-link" to={{pathname:"/",hash:"#fonctionnement"}}>
            Découvrir le fonctionnement
            </Link>
          </div>
          <div className="landing-trust-row">
            <span><CheckCircle2 size={16} /> Inscription facile </span>
            <span><ShieldCheck size={16} /> Accès réservé </span>
            <span><BadgeCheck size={16} /> Profils validés</span>
          </div>
        </div>

        <div className="hero-product" aria-label="Aperçu du tableau de bord">
          <div className="hero-product-topbar">
            <span className="hero-mini-brand"><img src={msbc} className="nav-icon rounded" alt="MSBC" /></span>
            <div><i /><i /><i /></div>
          </div>
          <div className="hero-product-body">
            <aside className="hero-product-sidebar">
              <span className="active"><LayoutDashboard size={15} /></span>
              <span><UsersRound size={15} /></span>
              <span><ShieldCheck size={15} /></span>
            </aside>
            <div className="hero-product-content">
              <div className="hero-product-heading"><div><small>Aperçu fictif du tableau de bord</small><strong>Bonjour, agent</strong></div><span>M</span></div>
              <div className="hero-kpis" aria-label="Statistiques fictives pour illustration">
                <article><small>Membres</small><strong>128</strong><em>+12 ce mois</em></article>
                <article><small>Validés</small><strong>94</strong><em>73% du total</em></article>
                <article><small>En attente</small><strong>18</strong><em>À examiner</em></article>
              </div>
              <div className="hero-list-card">
                <div className="hero-list-title">
                  <strong>Nouvelles inscriptions</strong>
                  <span>Voir tout</span>
                </div>

                {[
                  ["A", "Membre A", "Adhésion", "Validé"],
                  ["B", "Membre B", "Adhésion", "En attente"],
                  ["C", "Membre C", "Adhésion", "Validé"],
                ].map(([letter, name, activity, status]) => (

                  <div className="hero-list-row" key={name}>
                    <span className="hero-list-avatar">{letter}</span>
                    <span>
                      <strong>{name}</strong>
                      <small>{activity}</small>
                    </span>
                    <em className={status === "Validé" ? "approved" : "pending"}>{status}</em>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <span className="hero-floating-card"><Check size={16} /> Profil validé</span>
        </div>
      </motion.section>

      <motion.section 
       initial={{
        opacity:0,
        y:20
      }}
      animate={{
        opacity:1,
        y:0
      }}
      transition={{
        duration:.4
      }}
      className="landing-section benefits-section" id="avantages">
        <div className="section-heading centered-heading">
          <span className="eyebrow">Pensé pour votre communauté</span>
          <h2>Moins de papiers.<br />Plus de visibilité.</h2>
          <p>Chaque information utile reste accessible, lisible et facile à mettre à jour.</p>
        </div>
        <div className="benefits-grid">
          <article className="benefit-card benefit-coral">
            <span><UserRoundPlus size={24} /></span>
            <small>01</small>
            <h3>Inscription fluide</h3>
            <p>Un formulaire guidé en trois étapes pour recueillir uniquement les informations essentielles.</p>
          </article>
          <article className="benefit-card benefit-lime">
            <span><LayoutDashboard size={24} /></span>
            <small>02</small>
            <h3>Profil personnel</h3>
            <p>Chaque membre retrouve ses coordonnées, son activité, ses compétences et son statut.</p>
          </article>
          <article className="benefit-card benefit-teal">
            <span><UsersRound size={24} /></span>
            <small>03</small>
            <h3>Gestion centralisée</h3>
            <p>Retrouvez les inscriptions des agents dans un tableau centralisé.</p>
          </article>
        </div>
      </motion.section>

      <motion.section 
       initial={{
        opacity:0,
        y:20
      }}
      animate={{
        opacity:1,
        y:0
      }}
      transition={{
        duration:.4
      }}
      className="landing-section process-section" id="fonctionnement">
        <div className="process-visual">
          <div className="process-ring process-ring-one" />
          <div className="process-ring process-ring-two" />
          <div className="process-center">
            <span className="brand-mark">MSBC</span>
            <strong>Votre espace<br />est prêt</strong>
          </div>
          <span className="process-chip chip-one"><UserRoundPlus size={18} /> Inscription</span>
          <span className="process-chip chip-two"><BadgeCheck size={18} /> Validation</span>
          <span className="process-chip chip-three"><LayoutDashboard size={18} /> Suivi</span>
        </div>
        <div className="process-copy">
          <span className="eyebrow">Comment ça marche ?</span>
          <h2>Trois étapes,<br />et c’est parti.</h2>
          <div className="process-list">
            <article>
              <span>1</span>
              <div>
                <h3>Créez votre profil</h3>
                <p>Renseignez votre identité, vos coordonnées et votre activité.</p>
                </div>
            </article>

            <article>
              <span>2</span>
              <div>
                <h3>Soumettez l’inscription</h3>
                <p>Vos informations sont enregistrées et transmises pour validation.</p>
                </div>
             </article>

            <article>
              <span>3</span>
              <div>
                <h3>Suivez votre espace</h3>
                <p>Consultez les fiches et suivez les statuts de validation.</p>
                </div>
            </article>

          </div>
          <Link className="primary-button" to="/inscription">Ajouter des membres <ArrowRight size={17} /></Link>
        </div>
      </motion.section>

      <motion.section 
       initial={{
        opacity:0,
        y:20
      }}
      animate={{
        opacity:1,
        y:0
      }}
      transition={{
        duration:.4
      }}
      className="landing-final-cta">
        <h2>Prêt à créer votre espace membre ?</h2>
        <Link to="/login" className="primary-button landing-primary" >
          Commencer maintenant <ArrowRight size={18} />
        </Link>
      </motion.section>

      <motion.footer 
       initial={{
        opacity:0,
        y:20
      }}
  
      animate={{
        opacity:1,
        y:0
      }}
      exit={{
        opacity:0,
        y:20
      }}
      transition={{
        duration:.4
      }}
      className="landing-footer">
        <Link className="brand" to="/">
          <span className="cover-img">
            <img src={msbc} className="nav-icon bg-transparent" alt="MSBC" />
            </span>
            <span>Espace Utilisateur</span>
        </Link>
        <p>Mutuelle de Santé à Base Communautaire</p>
        <span>© {new Date().getFullYear()} Espace Utilisateur</span>
      </motion.footer>
    </main>
    </>
  );
}
