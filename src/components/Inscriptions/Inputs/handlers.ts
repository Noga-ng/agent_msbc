import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import CalculeAge from "../../../service/CalculAge";
import ResizeImg, { PhotoUrl } from "../../../service/ResizeImg";
import Swal from "sweetalert2";

type eventChange<T> = ChangeEvent<T>;
type StateDispatch<T> = Dispatch<SetStateAction<T>>;

export default function HandleChange<T>(
  setFormInsert: StateDispatch<T>,
): (event: eventChange<HTMLInputElement | HTMLSelectElement>) => void {
  return (event: eventChange<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    const key = name as keyof T;
    setFormInsert((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
}

export function HandleNaissance<T>(
  setFormInsert: StateDispatch<T>,
): (e: eventChange<HTMLInputElement>) => void {
  return (e: eventChange<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof T;
    setFormInsert((prev) => ({
      ...prev,
      [key]: value,
      age: CalculeAge(value),
    }));
  };
}

interface HandleFileInterface<T> {
  setFormInsert: StateDispatch<T>;
  setPreview: StateDispatch<string | null>;
  setProcessing?: (processing: boolean) => void;
}

export function HandleFile<T>({
  setFormInsert,
  setPreview,
  setProcessing,
}: HandleFileInterface<T>): (
  e: eventChange<HTMLInputElement>,
) => Promise<void> {
  return async (e: eventChange<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const name = e.target.id;
    const key = name as keyof T;
    // L'annulation de la boîte de dialogue ne doit pas effacer la photo choisie.
    if (!file) return;

    if (key === "photo") {
      setProcessing?.(true);
      let resizedFile: File | null;
      let photoPreview: string | null;
      try {
        resizedFile = await ResizeImg(file);
        if (!resizedFile) throw new Error("Impossible de traiter la photo.");
        photoPreview = await PhotoUrl(resizedFile);
      } catch (cause) {
        e.target.value = "";

        void Swal.fire({
          icon: "error",
          title: "Photo non acceptée",
          text: cause instanceof Error ? cause.message : "Image illisible.",
        });

        setProcessing?.(false);
        return;
      }

      setFormInsert((p) => ({
        ...p,
        photo: resizedFile,
      }));

      setPreview(photoPreview);
      setProcessing?.(false);

      return;
    }

    setFormInsert((p) => ({
      ...p,
      [key]: file,
    }));
  };
}

export function HandleCategorie<T>({
  setFormInsert,
}: {
  setFormInsert: StateDispatch<T>;
}): (e: eventChange<HTMLSelectElement>) => void {
  return (e: eventChange<HTMLSelectElement>) => {
    const categorie = Number(e.target.value);

    setFormInsert((prev) => ({
      ...prev,
      categorie,
    }));
  };
}
