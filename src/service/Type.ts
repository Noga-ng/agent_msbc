import type { Members } from "../Response";

export type Status = "active"|"pending";

export type StatusFilter = "all" | Status;

export interface Contenus extends Members{
    age:string;
    district:string;
    operateur:string;
}