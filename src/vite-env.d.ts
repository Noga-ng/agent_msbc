/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?:string;
  readonly VITE_PROFILE_UPDATE_ENDPOINT?:string;
  readonly VITE_PASSWORD_CHANGE_ENDPOINT?:string;
  
  readonly VITE_AUTH_SESSION_ENDPOINT?:string;
  readonly VITE_LOGOUT_ENDPOINT?:string;
  readonly VITE_LOGIN_ENDPOINT?:string;

  readonly VITE_MEMBER_INSERTION_TITULAIRE:string;
  readonly VITE_MEMBER_INSERTION_CONJOINT:string;
  readonly VITE_MEMBER_INSERTION_ENFANT:string;

  readonly VITE_MEMBER_UPDATE_TITULAIRE_ENDPOINT:string;
  readonly VITE_MEMBER_UPDATE_CONJOINT_ENDPOINT:string;
  readonly VITE_MEMBER_UPDATE_ENFANT_ENDPOINT:string;

  readonly VITE_FILE_URL?:string;
}
