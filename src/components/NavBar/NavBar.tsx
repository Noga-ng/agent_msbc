import { useEffect, useRef, useState, type ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BiLogOut } from "react-icons/bi";
import type { IconType } from "react-icons";
import { BsHouse } from "react-icons/bs";
import { FiArrowRight, FiMenu, FiX } from "react-icons/fi";
import { GiSparkles } from "react-icons/gi";
import {
  LuLayoutDashboard,
  LuUserRound,
  LuUserRoundPlus,
  LuUsersRound,
} from "react-icons/lu";
import { NavLink, useLocation } from "react-router";
import Swal from "sweetalert2";
import msbc from "../../assets/images/msbc.jpg";
import { useAuth } from "../../Auth/UseAuth";
import "../../assets/css/navigation.css";
import LoadingState from "../Loaders/LoadingState";
import MyProfile from "../../service/Setups/showProfile";
import PhotoLink from "../../service/Setups/photoSetup";

const entries: {
  to: string;
  label: string;
  icon: IconType;
  exact?: boolean;
}[] = [
  { to: "https://msbc-toamasina.mg", label: "Accueil", icon: BsHouse, exact: true },
  { to: "/dashboard", label: "Tableau de bord", icon: LuLayoutDashboard },
  { to: "/inscription", label: "Nouvelle inscription", icon: LuUserRoundPlus },
  { to: "/membres", label: "Liste des membres", icon: LuUsersRound },
  // { to: "/ajouter-utilisateurs", label: "ajouter un(e) utilisateur", icon: LuUserRoundPlus },
  { to: "/compte", label: "Mon compte", icon: LuUserRound },
];

export default function NavBar(): ReactElement {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const reduced = useReducedMotion();
  const [load,setLoad] = useState<boolean>(false);
  const [visible,setVisibility] = useState<boolean>(false);

  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const current =
    entries.findLast((entry) =>
      entry.exact
        ? location.pathname === entry.to
        : location.pathname.startsWith(entry.to),
    ) ?? entries[0];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const onOutside = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !sidebarRef.current?.contains(target) &&
        !menuButtonRef.current?.contains(target)
      )
        setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [open]);

  const handleLogOut = async () => {
    if (signingOut) return;
    const confirm = await Swal.fire({
      icon: "question",
      title: "Se déconnecter ?",
      text: "Votre session sera fermée sur cet appareil.",
      showCancelButton: true,
      confirmButtonText: "Déconnexion",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#147d68",
      allowOutsideClick: true,
    });

    if (!confirm.isConfirmed) return;

    setLoad(true);
    setSigningOut(true);
    
    try {
      await logout(user?.cin ?? "");
      
    } finally {
      setSigningOut(false);
      setLoad(false)
    }
  };

  const photoUsers = user?.photo;

  const show = () =>{
    setVisibility(true);
  }

  return (
    <>
    <MyProfile type="users" photo={photoUsers} setting={setVisibility} visible={visible} />

      {load && <LoadingState label="Deconnexion..." compact={true}/>}
      <header className="agent-topbar">
        <div className="agent-topbar-left">
          <motion.button
            ref={menuButtonRef}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            className="agent-menu-toggle"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer la navigation" : "Ouvrir la navigation"}
            aria-controls="agent-sidebar"
            aria-expanded={open}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "menu"}
                initial={
                  reduced ? false : { rotate: -70, opacity: 0, scale: 0.8 }
                }
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={
                  reduced ? undefined : { rotate: 70, opacity: 0, scale: 0.8 }
                }
                transition={{ duration: 0.18 }}
              >
                {open ? <FiX size={21} /> : <FiMenu size={21} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <span className="agent-topbar-brand">
            MSBC
            <span>/</span>
            <strong>{current.label}</strong>
          </span>
        </div>
        <div className="agent-topbar-actions">
          <span className="agent-online">
            <i aria-hidden="true" /> {user ? `${user?.noms}  ${user?.prenoms}` : "mon compte"}
          </span>
          <NavLink
            className="agent-topbar-avatar items-center-safe justify-center-safe"
            to="/compte"
            title="Mon compte"
            aria-label="Mon compte"
          >
            {user?.photo ? (
              <img src={PhotoLink('users',user.photo) ?? ""} 
                   alt={user.noms.slice(0,1).toUpperCase()} 
                   className="flex! items-center-safe justify-center-safe" 
                />
            ) : (
              <span>
                {(user?.prenoms || user?.noms || "M").charAt(0).toUpperCase()}
              </span>
            )}
          </NavLink>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            className="agent-nav-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <motion.aside
        ref={sidebarRef}
        id="agent-sidebar"
        className="agent-sidebar"
        aria-label="Menu de l'espace agent"
        initial={false}
        animate={open ? "open" : "closed"}
        variants={{
          open: { x: 0, opacity: 1 },
          closed: { x: "-105%", opacity: 0.7 },
        }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 340, damping: 34 }
        }
        inert={!open}
      >
        <div className="agent-sidebar-header">
          <div className="agent-brand-logo">
            <img src={msbc} alt=" " />
          </div>
          <div>
            <span className="agent-brand-name">MSBC Toamasina</span>
            <small>ESPACE AGENT DE TERRAIN</small>
          </div>
          <button
            type="button"
            className="agent-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          >
            <FiX />
          </button>
        </div>
        <div className="agent-nav-section-label">VOTRE ESPACE</div>
        <nav className="agent-nav-links" aria-label="Navigation principale">
          {entries.map(({ to, label, icon: Icon, exact }, index) => (
            <motion.div
              key={to}
              initial={false}
              animate={open ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
              transition={{
                delay: reduced ? 0 : index * 0.045,
                duration: reduced ? 0 : 0.22,
              }}
            >
              <NavLink
                to={to}
                end={Boolean(exact)}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `agent-nav-link${isActive ? " is-active" : ""}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="agent-nav-link-icon">
                      <Icon size={20} />
                    </span>
                    <span>{label}</span>
                    <FiArrowRight className="agent-nav-link-arrow" size={16} />
                    {isActive && (
                      <motion.span
                        layoutId="agent-nav-active"
                        className="agent-nav-active-mark"
                        transition={
                          reduced
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 400, damping: 32 }
                        }
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>
        <div className="agent-sidebar-fill" />
        <div className="agent-nav-tip">
          <GiSparkles size={20} />
          <div>
            <strong>Suivi des adhésions</strong>
            <small>Vos inscriptions sont synchronisées.</small>
          </div>
        </div>
        <div className="agent-nav-account">
          <div className="agent-nav-profile-avatar">
            {user?.photo ? (
              <img src={PhotoLink('users',user.photo)} 
                   alt={user.noms.slice(0,1).toUpperCase()} 
                   className="flex! items-center-safe justify-center-safe" 
                   onClick={show}
                   />
            ) : (
              <span>{(user?.noms || "M").charAt(0)}</span>
            )}
          </div>
          <div className="agent-nav-profile-info">
            <strong>
              {[user?.noms, user?.prenoms].filter(Boolean).join(" ") ||
                "Agent MSBC"}
            </strong>
            <small className="block">{user?.fonction.replaceAll("_"," ") || "Agent"}</small>
          </div>
          <button
            type="button"
            className="agent-nav-logout"
            aria-label="Se déconnecter"
            title="Se déconnecter"
            disabled={signingOut}
            onClick={() => void handleLogOut()}
          >
            {signingOut ? (
              <span className="agent-spinner" />
            ) : (
              <BiLogOut size={21} />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
