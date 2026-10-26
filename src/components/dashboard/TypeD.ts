import type { Contenus } from "../../service/Type";


export const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
export const COLORS = ["#16a37b", "#477bda", "#a37be0", "#e6ac55", "#55a5b9"];

export type DashboardMember = {
  id: string;
  name: string;
  kind: "Titulaire" | "Conjoint(e)" | "Enfant";
  category: string;
  date: string;
  status: "active" | "pending";
};

export default interface ApiResponse {
  status: boolean;
  message?: string;
  data: Contenus[] | null;
};