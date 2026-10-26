
interface Profile {
    id:number,
    identifiant:string,
    noms:string,
    prenoms:string,
    titre:string,
    photo:string
}

export interface Members extends Profile {
    inscription:string,
    cin:string,
    telephone:string,
    adresse:string,
    titre:string,
    categorie:string,
    status:string|null,
    photo:string,
    profession:string
}

export interface Conjoint extends Profile {
    telephone:string,
    cin:string,
    photo:string
}

export interface Enfant extends Profile {
    school:string
}

export interface FamilyResponse {
    status:boolean,
    message:string,
    data:{
        titularies:Members,
        conjoint:Conjoint,
        enfant:Enfant
    }
}

export type MembresResponse = {
    status:boolean,
    message:string,
    data:Members
}

export interface UsersResponse {
    status:boolean,
    message:string,
    data:string,
}

export interface DataSession {
    csrfToken?: string,
    link: string,
    cin: string,
    fonction:string,
    description:string,
    id:number,
    noms: string,
    photo: string,
    prenoms: string,
    telephone: string
}

export interface SessionResponse {
    status:boolean,
    message:string,
    data:DataSession
}

export interface clientResponse {
    status:boolean;
    message?:string;
    token?:string;
    data?:Record<string,unknown> | null;

}