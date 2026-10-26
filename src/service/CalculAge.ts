import { memberAge } from "./memberRules";

export default function CalculeAge(naissance: string): number {
  return memberAge(naissance) ?? 0;
}
