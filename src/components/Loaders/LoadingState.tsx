import { motion, useReducedMotion, type Variants } from "framer-motion";
import "../../assets/css/loading.css";

/** Indicateur accessible réutilisable : aucune donnée factice pendant le chargement API. */
export default function LoadingState({ 
  label = "Chargement des données…", 
  compact = false,log = false,keys = "" }: {
    label?: string; compact?: boolean,log?:boolean,keys?:string
  }) {
  const reduced = useReducedMotion();

 const LoadingVariants: Variants = {
  hidden: {
    display:"none",
    transition:{
      duration:2,
      ease:"easeInOut"
    }
  },
  visible: {
    display:"flex",
    transition: {
      duration: 2,
      ease: "easeInOut",
    },
  },
};

  return <motion.div 
            key={keys}
            className={`msbc-loading ${compact ? "msbc-loading-compact" : ""}`} 
            variants={log ? LoadingVariants : undefined}
            initial="visible"
            animate="hidden"
              role="status" aria-live="polite" aria-busy="true">
    <motion.div className="msbc-loading-symbol" aria-hidden="true"
      animate={reduced ? undefined : { rotate: 360 }} 
      transition={{ 
        duration: 1.1, 
        ease: "linear", 
        repeat: Infinity 
        }}>
      <span />
    <span />
 <span />
    </motion.div>
    <p>{label}</p>
  </motion.div>;
}

