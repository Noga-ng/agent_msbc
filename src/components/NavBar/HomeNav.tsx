import { motion, useReducedMotion } from "framer-motion";
import { FiLogIn } from "react-icons/fi";
import { AiFillDashboard } from "react-icons/ai";
import { Link } from "react-router";
import type { ReactElement } from "react";
import msbc from "../../assets/images/msbc.jpg";
import { useAuth } from "../../Auth/UseAuth";

const MotionLink = motion.create(Link);

export default function HomeNav(): ReactElement {
  const { authenticated } = useAuth();
  const reduced = useReducedMotion();
  const hover = reduced ? undefined : { y: -2, scale: 1.035 };
  return <motion.nav
    className="landing-nav"
    aria-label="Navigation de la page d'accueil"
    initial={reduced ? false : { opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: reduced ? 0 : .5, ease: "easeOut" }}
  >
    <MotionLink whileHover={hover} whileTap={reduced ? undefined : { scale: .97 }} 
                className="brand brand-dark" to="/" aria-label="Accueil MSBC">
      <span className="cover-img"><img src={msbc} alt="MSBC" className="nav-icon bg-transparent" /></span>
      <span>MSBC</span>
    </MotionLink>
    <div className="landing-links">
      <MotionLink whileHover={hover} to="/#avantages">Avantages</MotionLink>
      <MotionLink whileHover={hover} to="/#fonctionnement">Fonctionnement</MotionLink>
    </div>
    {authenticated ?
      <MotionLink whileHover={hover} whileTap={reduced ? undefined : { scale: .96 }} to="/dashboard" className="landing-nav-cta">
        Tableau de bord <AiFillDashboard size={16} />
      </MotionLink> :
      <MotionLink whileHover={hover} whileTap={reduced ? undefined : { scale: .96 }} to="/login" className="landing-nav-cta">
        Se connecter <FiLogIn size={16} />
      </MotionLink>
    }
  </motion.nav>;
}
