
export type Categorie = "salam@"|"salam@Be"|"ankohonanaSalam@"|"ankohonanaSalam@Be";

export interface BaseFormInsert {
  noms:string,
  prenoms:string,
  age:number,
  naissance:string,
  lieu:string,
  genre:string,
  photo:File|null,
  origine:string,
  famille:string,
  profession:string,
  telephone:string,
  telephone2:string,
  region?:string,
  users:number
} 

export interface FormInsert extends BaseFormInsert {
  categorie:number,
  adresse:string,
  arrondissement:string,
  district:string,
  cin:string,
  delivrance:string
}

export function EmptyForm():FormInsert {
    return{ 
      categorie:0,
      noms:"",
      prenoms:"",
      age:0,
      naissance:"",
      lieu:"",
      genre:"",
      profession:"",
      photo:null,
      telephone:"",
      telephone2:"",
      famille:"",
      adresse:"",
      arrondissement:"",
      origine:"",
      district:"",
      cin:"",
      delivrance:"",
      region:"",
      users:0
    };
};


export interface Response{
  status:boolean,
  message:string,
}

export interface ResPost<T> extends Response{
  data:T
}

export interface ConjointInsert extends BaseFormInsert {
    idTitulaire:string,
    telephone:string,
    telephone2:string,
    cin:string,
    delivrance:string
}

export function EmptyFormConjoint():ConjointInsert{
  return {
  idTitulaire:"",
  telephone: "",
  telephone2: "",
  profession: "",
  cin:"",
  delivrance:"",
  noms: "",
  prenoms: "",
  age: 0,
  genre:"",
  naissance: "",
  lieu: "",
  photo: null,
  origine: "",
  famille: "",
  users:0
};

}

export interface EnfantInsert extends BaseFormInsert{
  cin?:string,
  delivrance?:string
}

export function EmptyFormEnfant():EnfantInsert{
  return {
  profession: "",
  noms: "",
  prenoms: "",
  age: 0,
  naissance: "",
  genre:"",
  lieu: "",
  photo: null,
  origine: "",
  famille: "",
  telephone: "",
  telephone2: "",
  cin:"",
  delivrance:"",
  users:0
};
}