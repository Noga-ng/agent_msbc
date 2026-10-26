import {type ChangeEventHandler, type ReactElement } from "react";
import msbc from "../../../assets/images/msbc.jpg";
import { localToday } from "../../../service/memberRules";
import {motion} from "framer-motion";
import type { ConjointInsert, EnfantInsert, FormInsert } from "./TypeInput";

interface PropsProfile<T> {
    profile:T;
    handleChange:ChangeEventHandler<HTMLInputElement|HTMLSelectElement>;
    handleNaissance:ChangeEventHandler<HTMLInputElement>;
    handleFile:ChangeEventHandler<HTMLInputElement>;
    previewPhoto:string|null;
    categorie:"minor"|"major"|null;
    photoProcessing?: boolean
}

type Form = FormInsert|ConjointInsert|EnfantInsert;

export default function Profile(
  {profile,handleChange,handleNaissance,handleFile,previewPhoto,categorie,photoProcessing = false}:PropsProfile<Form>
): ReactElement {
 
  const person = categorie;
  const checkAge = Boolean(profile.naissance) &&
                  ((person === "minor" && profile.age < 18 && profile.age >= 0) || 
                  (person === "major" && profile.age >= 18));
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
        <span className="flex gap-5 items-center">Nom *</span>
        <input
          name="noms"
          value={profile.noms}
          onChange={handleChange}
          type="text"
          placeholder="Ex. Randria"
          autoComplete="family-name"
          required
        />
      </label>

      <label className="field">
        <span className="flex gap-5 items-center ">Prénoms *</span>
        <input
          name="prenoms"
          value={profile.prenoms}
          onChange={handleChange}
          type="text"
          placeholder="Ex. Noga"
          required
        />
      </label>

      <label className="field">
        <span>Date de naissance *</span>
        <input
          name="naissance"
          value={profile.naissance}
          onChange={handleNaissance}
          type="date"
          required
          max={localToday()}
        />
      </label>

      <label className="field">
        <span>Âge</span>
        <input
          type="number"
          name="age"
          value={profile.age}
          className={
            checkAge ? "" :
              "border-red-300!" }
          disabled
        />
       {Boolean(profile.naissance) && !checkAge && 
       <span className="text-red-400! font-light!">
        {person === 'major' ? "L’âge doit être d’au moins 18 ans." : "L’âge doit être inférieur à 18 ans."}
       </span>
       }
      </label>

      <label className="field">
        <span>Lieu de naissance</span>
        <input
          name="lieu"
          value={profile.lieu}
          onChange={handleChange}
          type="text"
          placeholder="Ex : Toamasina I"
        />
      </label>

       <label className="field">
                <span>Genre *</span>
                <select required name="genre" value={profile.genre} onChange={handleChange} id="genre">
                    <option disabled value={""} className="text-gray-600">Genre....</option>
                    <option value="femme">Femme</option>
                    <option value="homme">Homme</option>
                </select>
              </label>

      {
        person !== null && person === "major" && (
     <>
      <label className="field">
        <span>CIN</span>
        <input
          name="cin"
          value={profile.cin}
          onChange={handleChange}
          type="text"
          placeholder="Ex : 301 000 000 000"
          inputMode="numeric"
          maxLength={12}
        />

      </label>

      <label className="field">
        <span>Date de délivrance du CIN (si connue)</span>
        <input
          name="delivrance"
          value={profile.delivrance}
          onChange={handleChange}
          type="date"
          max={localToday()}
        />
      </label>
     </>
        )

      }

       <label className="field">
        <span>{ person === "minor" ? "école" : "Profession"}</span>
        <input
          name="profession"
          value={profile.profession}
          onChange={handleChange}
          type="text"
          placeholder={person === "minor" ? "votre école ..." : "Ex : Developer web"}
        />
      </label>

      <label htmlFor="photo" className="field">
        <span>Photo (facultative)</span>
        <div className="w-20 h-20 block overflow-hidden rounded-[20px] cursor-pointer">
          <img 
          src={previewPhoto ?? msbc} 
          alt="Aperçu de la photo du membre" 
          aria-label={profile.noms + " " + profile.prenoms} 
          className="w-full h-full object-cover block" 
          />
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          id="photo"
          className="hidden!"
          onChange={handleFile}
          disabled={photoProcessing}
        />
        {photoProcessing && 
        <span role="status" className="text-sm">
          Traitement de la photo… 
        <span className="msbc-inline-spinner" aria-hidden="true" />
        </span>
        }
      </label>
    </motion.div>
  );
}