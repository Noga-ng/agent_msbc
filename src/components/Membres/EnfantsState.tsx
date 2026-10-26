import type { Enfant } from "../../Response";
import { Link } from "react-router";
import { LuPencil } from "react-icons/lu";
import PhotoLink from "../../service/Setups/photoSetup";

export default function EnfantsState({enfant,holderId,show}:{
    enfant:Enfant;holderId:string;show:(status:"enfant",photo:string)=>void
}){
   const fullname = `${enfant.noms} ${enfant.prenoms}`;
    return (
       
                  <div key={enfant.identifiant ?? ""} aria-label={enfant.prenoms}>
                    <span className="contact-icon rounded-2xl overflow-hidden">
                        {enfant.photo
                          ? <img src={enfant.photo ? PhotoLink("enfant",enfant.photo) : ''}
                              alt={enfant.noms?.slice(0,1)} 
                              className="w-full h-full object-cover" 
                              onClick={()=>show('enfant',enfant.photo)}
                              />
                          : <span aria-label="Sans photo">{enfant.noms?.slice(0,1) || "E"}</span>}
                    </span>
                    <span className="flex justify-between w-full">
                        <span>
                            <strong>{fullname}</strong>

                            <small>{enfant.identifiant ?? ""}/MSBC-enf</small>
                            {enfant.identifiant && 
                            <Link className="member-profile-edit member-family-edit" 
                                to={`/membres/${encodeURIComponent(holderId)}/modifier-enfant/${encodeURIComponent(enfant.identifiant)}`}
                               >
                                <LuPencil size={14} /> edit
                            </Link>
                            }
                        </span>
                    </span>
                  </div>
    );
}