import type { ReactElement } from "react";
import { BiError } from "react-icons/bi";

export default function ErrorPage():ReactElement{
    return (
        <main className="content-wrap fixed! bg-amber-50 z-50 left-0 top-0 flex flex-col items-center-safe justify-center-safe w-full! h-full">
               <BiError size={80} className="text-red-400"/>
              <h1 className="text-2xl font-bold">Page {location.pathname.replace(/^\/+/g,"")} introuvable</h1>
              <a href="/" className="text-sm underline! font-bold text-green-700!">Retour à l'accueil</a>
        </main>
    );
}