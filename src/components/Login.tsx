import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiLock,
  FiLogIn,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../Auth/UseAuth";
import msbc from "../assets/images/msbc.jpg";
import http from "../service/Client.ts";
import { LuIdCard, LuPhone } from "react-icons/lu";
import type { UsersResponse } from "../Response";
import { endPointLogin } from "../service/Setups/NormalizeEnv.ts";


export default function Login() {
  
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated,checkSession } = useAuth();

  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [cin,setCin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 

 const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
  
  event.preventDefault();
  setLoading(true);
  setError("");

  try {
    if(!endPointLogin) 
      throw new Error(
    "impossible de se connecter car endpoint de connection est manquant.",
    {cause:endPointLogin}
  );
    const response = await http.post<UsersResponse>(`/${endPointLogin}`, {
      telephone,
      cin,
      remember,
      password
    },{
      credentials:"include"
    });

    const data = response.data;

    if (!response.ok || data?.status !== true) {
      setError(
        data?.message ?? `Connexion refusée (${response.status}).`,
      );
      return;
    }
    
    if (!await checkSession()) {
      setError("Connexion reçue, mais aucune session valide n’a été confirmée.");
      return;
    }
    const requested = (location.state as {from?: string} | null)?.from;
    navigate(requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard", { replace: true });

  } catch (loginError: unknown) {
    setError(
      loginError instanceof Error
        ? loginError.message
        : "Impossible de se connecter au serveur.",
    );
  } finally {
    setLoading(false);
  }
};

useEffect(()=>{
  const log = () => authenticated && navigate('/dashboard',{replace:true});
  log();
},[authenticated,navigate])

  return (
    <main className="login-page">
      <section className="login-presentation">
        
        <Link to="/" className="login-brand">
          <img src={msbc} alt="Logo MSBC" />
          <span>MSBC</span>
        </Link>

        <div className="login-presentation-content">

          <h1>
            Votre santé,
            <br />
            notre engagement.
          </h1>

          <p>
            Connectez-vous pour consulter votre compte, suivre votre
            statut et gérer vos informations personnelles.
          </p>
        </div>

        <p className="login-copyright">
          © {new Date().getFullYear()} Mutuelle de Santé à Base Communautaire
        </p>
      </section>

      <section className="login-form-section">
        <div className="login-form-container">
          <Link to="/" className="login-back">
            <FiArrowLeft />
            Retour à l’accueil
          </Link>

          <div className="login-heading">
            <h2>Bienvenue</h2>

            <p>
              Saisissez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            
             <label className="login-field">
              <span>Telephone</span>

              <div className="login-input">
                <LuPhone aria-hidden="true" />

                <input type="tel"
                  value={telephone}
                  onChange={(event) => {
                    setTelephone(event.target.value);
                    setError("");
                  }}
                  placeholder="votre numéro telephone"
                  autoComplete="tel"
                />
              </div>
            </label>

            <label className="login-field">
              <span>CIN</span>

              <div className="login-input">
                <LuIdCard aria-hidden="true" />

                <input type="text"
                  value={cin}
                  onChange={(event) => {
                    setCin(event.target.value);
                    setError("");
                  }}
                  placeholder="votre cin..."
                  autoComplete="off"
                />
              </div>
            </label>

            <label className="login-field">
              <span>Mot de passe</span>

              <div className="login-input">
                <FiLock aria-hidden="true" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />

                <span className="cursor-pointer">Se souvenir de moi</span>
              </label>

              {/* <Link to="/mot-de-passe-oublie">
                Mot de passe oublié ?
              </Link> */}
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? <span className="msbc-inline-spinner" aria-hidden="true" /> : <FiLogIn />}
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}