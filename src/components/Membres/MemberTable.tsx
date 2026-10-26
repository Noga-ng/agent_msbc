import { Link } from "react-router";
import { BiChevronRight } from "react-icons/bi";
import type { Contenus } from "../../service/Type";
import { memberStatusLabel, normalizeMemberStatus } from "../../service/memberRules";
import PhotoLink from "../../service/Setups/photoSetup";



interface PropsM {
    membres:Contenus[];
}

export default function MembersTable({membres}:PropsM){
  
    return (
      <>
         <table className="members-table">
                  <thead>
                    <tr>
                      <th>Membre</th>
                      <th>Contact</th>
                      <th>Catégorie</th>
                      <th>Inscription</th>
                      <th>Statut</th>
                      <th><span className="sr-only">Détails</span></th>
                     </tr>
                  </thead>
                  <tbody>
                    {
                      membres && membres.map((membre) =>
                        (
                          
                         <tr key={membre.identifiant}>
                        <td>
                          <Link to={`/membres/${encodeURIComponent(membre.identifiant)}`} className="member-identity">
                            <span className="table-avatar overflow-hidden">
                              {membre.photo ?  
                              <img src={membre.photo ? PhotoLink('titulaire',membre.photo) : ''} 
                                className="w-full h-full object-cover" 
                                alt={(membre.noms || "M").slice(0,1)} /> : 
                              (membre.noms || "M").slice(0,1) 
                              }
                            </span>
                            <span>
                              <strong>{`${membre.noms || ""} ${membre.prenoms || ""}`}</strong>
                              <small>
                                {membre.cin || "CIN non renseigné"} · 
                                {membre.age ? `${String(membre.age).replace("ans", "").trim()} ans` : 
                                "Âge non renseigné"}
                              </small>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <strong className="table-primary">{membre.telephone || "—"}</strong>
                          <small className="table-secondary">{membre.adresse || "—"}</small>
                        </td>
                        <td>
                          <strong className="table-primary">{membre.categorie || "—"}</strong>
                          <small className="table-secondary">{membre.identifiant}/MSBC-TM</small>
                        </td>
                        <td>
                          <strong className="table-primary">
                            {membre.inscription && !Number.isNaN(Date.parse(membre.inscription)) ? 
                            new Date(membre.inscription).toLocaleDateString("fr-FR") : "—"}
                          </strong>
                          <small className="table-secondary">
                            à {
                            membre.inscription && !Number.isNaN(Date.parse(membre.inscription)) ? 
                            new Date(membre.inscription).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : 
                            "—"
                            }
                           </small>
                        </td>
                        <td>
                          <span className={
                            `member-status member-status-${normalizeMemberStatus(membre.status)}`
                            }>
                              {memberStatusLabel(membre.status)}
                          </span>
                        </td>
                        <td>
                          <Link to={`/membres/${encodeURIComponent(membre.identifiant)}`} className="row-action" 
                          aria-label={`Voir le profil de ${membre.noms} ${membre.prenoms}`}>
                            <BiChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                      ))
                    }
                  </tbody>
                </table>
          </>
    )
}