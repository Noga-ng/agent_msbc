import { AnimatePresence,motion } from "framer-motion";
import type { ReactElement } from "react";
import { Outlet, useLocation } from "react-router";
import NavBar from "./components/NavBar/NavBar";

export default function Layout():ReactElement{
const location = useLocation();
const exceptPage:string[] = ["/","/login"];

const showNav = !exceptPage.includes(location.pathname);

    return (
    <AnimatePresence mode="wait">
      <motion.div
        key=""
        initial={{ opacity: 0, x:8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full h-full "
      >
      {showNav && <NavBar/>}
      <Outlet/>

    </motion.div>
    </AnimatePresence>
    );
}