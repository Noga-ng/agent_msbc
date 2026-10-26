import type { ChangeEventHandler, ReactElement } from "react";
import type { ConjointInsert, EnfantInsert, FormInsert } from "./TypeInput";
import {motion} from "framer-motion";

export interface ContactInterface {
        contact:FormInsert|ConjointInsert|EnfantInsert,
        handleChange:ChangeEventHandler<HTMLInputElement>,
        child?: boolean
}

export default function Contact({contact,handleChange,child = false}:ContactInterface):ReactElement
{
    return (
       <motion.div 
         initial={{
            opacity:0,
            x:-20
        }}
        animate={{
          opacity:1,
          x:0
        }}
        transition={{
          delay:.3,
          duration:.5
        }}
       className="form-grid"
       >
        
        <label className="field">
            <span>Téléphone principal {child ? "(facultatif si contact familial)" : "*"}</span>
            <input required={!child} type="tel" name="telephone" 
                   value={contact.telephone} onChange={handleChange} placeholder="Ex : 03* ** *** **"/>
        </label>

        <label className="field">
            <span>Téléphone secondaire (facultatif)</span>
            <input  type="tel" name="telephone2" value={contact.telephone2} 
                    onChange={handleChange} placeholder="Ex : 03* ** *** **"/>
        </label>

         <label className="field">
            <span>Téléphone de la famille (facultatif{child ? ", sauf si aucun téléphone principal" : ""})</span>
            <input  type="tel" name="famille" value={contact.famille} onChange={handleChange} placeholder="Ex : 032*****"/>
        </label>

        {child && <p className="text-sm">
          Pour un enfant, renseignez au moins le téléphone principal ou celui de la famille.
          </p>
        }
      </motion.div>
    );
}