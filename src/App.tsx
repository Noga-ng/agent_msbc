import { Route, Routes, useLocation } from "react-router";
import Layout from "./Layout";
import ProtectedRoute from "./Auth/ProtectedRoute";
import Titulaire from "./components/Inscriptions/Titulaire";
import Conjoint from "./components/Inscriptions/Conjoint";
import Enfants from "./components/Inscriptions/Enfants";
import MembersPage from "./components/Membres/Membres";
import MemberState from "./components/Membres/MemberState";
import MemberEdit from "./components/Membres/MemberEdit";
import DashBoard from "./components/dashboard/Dashboard";
import Login from "./components/Login";
import Compte from "./components/Compte/Compte";
import { AnimatePresence } from "framer-motion";
import LoadingState from "./components/Loaders/LoadingState";
import ErrorPage from "./components/404Error/ErrorPage";

export default function App() {
  const location = useLocation();
  return (
    <>
    <AnimatePresence mode="wait">
      <LoadingState keys={location.pathname} label="chargement..." log={true} />
    </AnimatePresence>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Login />} />
        <Route path="login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashBoard />} />
          <Route path="inscription" element={<Titulaire />} />
          <Route path="membres" element={<MembersPage />} />
          <Route path="membres/:id" element={<MemberState />} />
          <Route
            path="membres/:id/modifier"
            element={<MemberEdit kind="titulaire" />}
          />
          <Route
            path="membres/:id/modifier-conjoint/:personId"
            element={<MemberEdit kind="conjoint" />}
          />
          <Route
            path="membres/:id/modifier-enfant/:personId"
            element={<MemberEdit kind="enfant" />}
          />
          <Route path="membres/:id/ajouter-conjoint" element={<Conjoint />} />
          <Route path="membres/:id/ajouter-enfant" element={<Enfants />} />
          <Route path="compte" element={<Compte />} />
        </Route>
        <Route path="*" element={<ErrorPage/>} />
      </Route>
    </Routes>
    </>
  );
}
