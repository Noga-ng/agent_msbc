import type { Conjoint } from "../../Response";
import { Link } from "react-router";
import { LuPencil } from "react-icons/lu";
import PhotoLink from "../../service/Setups/photoSetup";


export default function ConjointState({conjoint,holderId,show}:{
  conjoint:Conjoint;
  holderId:string;
  show:(status:"conjoint",photo:string)=>void;
}){

  const fullname = `${conjoint.noms}  ${conjoint.prenoms}`;

  return (
            <div className="profile-conjointe">
              <span className="w-20 h-20 flex items-center-safe justify-center 
              bg-amber-300/55 overflow-hidden rounded-2xl">
                {
                  conjoint.photo ? 
                  <img src={conjoint.photo ? PhotoLink("conjoint",conjoint.photo) : ``
                    }
                      className="w-full h-full block object-cover" 
                      alt={conjoint.noms?.slice(0,1)} 
                      onClick={()=>show("conjoint",conjoint.photo)}
                   />
                  : <span aria-label="Sans photo" className="font-bold text-2xl text-amber-800">
                    {conjoint.noms?.slice(0,1) || 'N'}
                    </span>
                }
               </span>

              <div>
                <h2 className="text-2xl">{fullname ?? ""}</h2>
                <p aria-label="profession de membres">{conjoint.identifiant ?? ""}-MSBC/conj</p>
                <p aria-label="profession de membres">téléphone : {conjoint.telephone}</p>
                {conjoint.identifiant && 
                <Link className="member-profile-edit member-family-edit" 
                      to={`/membres/${encodeURIComponent(holderId)}/modifier-conjoint/${encodeURIComponent(conjoint.identifiant)}`}>
                        <LuPencil size={14}/>edit
                </Link>
                }

              </div>
            </div>    
    );
}