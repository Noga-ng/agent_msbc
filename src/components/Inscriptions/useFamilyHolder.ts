import { useEffect, useState } from "react";
import { useParams } from "react-router";
import client from "../../service/Client";
import type { Members } from "../../Response";

type HolderReply = { 
  status: boolean; 
  message: string; 
  data?: { 
    titularies: Members | null; 
    conjoint?: { 
      id?: number; 
      identifiant?: string; 
      noms?: string 
    } | null 
  } 
};

const NO_FAMILY = new Set(["salam@", "salam@be"]);

/** Vérification de chaque rattachement via la fiche du titulaire en API PHP. */
export default function useFamilyHolder() {

  const { id } = useParams<{ id: string }>();
  const [holder, setHolder] = useState<Members | null>(null);
  const [hasConjoint, setHasConjoint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {

      setLoading(true); setHolder(null); setHasConjoint(false); setError("");

      if (!id || !/^[a-zA-Z0-9_-]{1,90}$/.test(id)) {
        setError("Identifiant du titulaire invalide.");
        setLoading(false);

        return;
      }
      try {
        const response = await client.get<HolderReply>(`/membres/${encodeURIComponent(id)}`, {
          credentials: "include", signal: controller.signal, cache: false,
        });

        if (!response.ok || !response.data?.status || !response.data.data?.titularies) {
          throw new Error(response.data?.message || "Titulaire introuvable ou inaccessible.");
        }

        const person = response.data.data.titularies;
        if (person.identifiant !== id || NO_FAMILY.has(person.categorie?.toLowerCase())) {
          throw new Error("Cette catégorie n'autorise pas de rattachement familial.");
        }

        if (!controller.signal.aborted) {
          setHolder(person);
          const spouse = response.data.data.conjoint;
          setHasConjoint(Boolean(spouse && (spouse.identifiant || spouse.noms || spouse.id)));
        }

      } catch (cause) {
        if (!controller.signal.aborted) 
          setError(cause instanceof Error ? cause.message : "Impossible de vérifier le titulaire.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();

    return () => controller.abort();

  }, [id]);
  return {
     holder, 
     hasConjoint, 
     titulaire: holder?.identifiant ?? "", 
     loading, error 
    };
}
