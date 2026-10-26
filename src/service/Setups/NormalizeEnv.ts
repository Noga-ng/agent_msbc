export const endpointAuthSession =
    import.meta.env.VITE_AUTH_SESSION_ENDPOINT?.replace(/^\/+|\/+$/g, "");
export const endPointLogout = import.meta.env.VITE_LOGOUT_ENDPOINT?.replace(
    /^\/+|\/+$/g,
    "",
);
export const endPointLogin = import.meta.env.VITE_LOGIN_ENDPOINT?.replace(
    /^\/+|\/+$/g,
    "",
);

export const endpointUpdateProfile = import.meta.env.VITE_PROFILE_UPDATE_ENDPOINT?.replace(
    /^\/+|\/+$/g,
    "",
);

export const endPointTitulaire =
    import.meta.env.VITE_MEMBER_INSERTION_TITULAIRE.replace(/^\/+|\/+$/g, "");
export const endPointConjoint =
    import.meta.env.VITE_MEMBER_INSERTION_CONJOINT.replace(/^\/+|\/+$/g, "");
export const endPointEnfant =
    import.meta.env.VITE_MEMBER_INSERTION_ENFANT.replace(/^\/+|\/+$/g, "");

export const urlFile = import.meta.env.VITE_FILE_URL?.replace(/^\/+|\/+$/g, "");

export const changePasswordEndPoint =
    import.meta.env.VITE_PASSWORD_CHANGE_ENDPOINT?.replace(/^\/+|\/+$/g, "");

interface EndpointInterface {
    titulaire?: string;
    conjoint?: string;
    enfant?: string;
}

export default function endPoints(): EndpointInterface {
    return {
        titulaire: endPointTitulaire,
        conjoint: endPointConjoint,
        enfant: endPointEnfant,
    };
}
