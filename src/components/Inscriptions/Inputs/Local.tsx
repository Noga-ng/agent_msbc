import type { ChangeEventHandler, ReactElement } from "react";
import type { FormInsert } from "./TypeInput";
import {motion} from "framer-motion";

interface LocalProps {
  local:FormInsert;
  handleChange:ChangeEventHandler<HTMLSelectElement | HTMLInputElement>;
}

export default function Local({local,handleChange}:LocalProps):ReactElement{
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
                <span>Adresse *</span>
                <input required type="text" name="adresse" value={local.adresse} 
                       onChange={handleChange} placeholder="Ex : Tanamborozano... "/>
            </label>

              <label className="field">
                <span>Arrondissement *</span>
                <select required name="arrondissement" value={local.arrondissement} 
                        onChange={handleChange} id="arrondissement">
                    <option disabled value={""} className="text-gray-600">Arrondissement....</option>
                    <option value="ambodimanga">AMBODIMANGA</option>
                    <option value="ankirihiry">ANKIRIHIRY</option>
                    <option value="anjoma">ANJOMA</option>
                    <option value="tanambao V">TANAMBAO V</option>
                    <option value="morarano">MORARANO</option>
                    <option value="toamasina II">TOAMASINA II</option>
                </select>
              </label>

              <label className="field">
                <span>Origine</span>
                <input  type="text" name="origine" 
                        value={local.origine} onChange={handleChange} placeholder="Ex : Toamasina I"/>
              </label>

              <label className="field">
                <span>District *</span>
                <select required name="district" value={local.district} onChange={handleChange} id="district">
                    <option disabled value={""}>district...</option>
                    <option value={"toamasina I"}>TOAMASINA I</option>
                    <option value={"toamasina II"}>TOAMASINA II</option>
                </select>
              </label>

               <label className="field">
                <span>Région *</span>
                <select required name="region" value={local.region} onChange={handleChange} id="region">
                    <option  value={""}>region...</option>
                    <option value={"Atsinanana"}>ATSINANANA</option>
                </select>
              </label>

        </motion.div>
    );
}