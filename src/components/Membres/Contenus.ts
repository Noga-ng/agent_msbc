import type { Contenus } from "../../service/Type";

export default function ContenusEmpty():Contenus[]{
    return [{
        identifiant: "",
        noms: "",
        prenoms: "",
        categorie: "",
        adresse: "",
        telephone: "",
        operateur: "",
        profession: "",
        status: "",
        district: "",
        age: "",
        titre: "",
        photo: "",
        cin: "",
        inscription: "",
        id: 0
    }];
}