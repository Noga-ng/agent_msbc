import type { MemberKind } from "../memberRules";
import { urlFile } from "./NormalizeEnv";

export default function PhotoLink(kind: MemberKind|"users", raw: string): string {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
  const directory = kind === "users" ? "users" : kind === "titulaire" ? "titulaires" : kind === "conjoint" ? "conjoint" : "enfants";
  return `${urlFile}/${directory}/${encodeURIComponent(raw)}`;
}