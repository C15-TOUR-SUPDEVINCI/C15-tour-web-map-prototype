export type TypeOfPoint = "PAUSE" | "PASSAGE" | "EXTREMITY" | "USER";

// Groupe de points sur le trajet
export interface Group {
  id: string;
  name: string;
  color?: string;
}

// Un waypoint = un point d'étape sur le trajet
export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  order: number; // position dans le trajet (commence à 1)
  type: TypeOfPoint;
  groupId: string;
}
