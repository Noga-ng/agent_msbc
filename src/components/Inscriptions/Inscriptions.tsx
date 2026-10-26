
import { type ReactElement } from "react";
import { useLocation } from "react-router";
import Conjoint from "./Conjoint";
import Enfants from "./Enfants";
import Titulaire from "./Titulaire";

export default function Inscription():ReactElement{
    const locationName = useLocation().pathname;
    return (
            locationName === '/inscription/enfants' ? <Enfants /> :
            locationName === '/inscription/conjoint' ? <Conjoint/> :
            locationName === '/inscription' ? <Titulaire/> : 
            <></>
    );
}