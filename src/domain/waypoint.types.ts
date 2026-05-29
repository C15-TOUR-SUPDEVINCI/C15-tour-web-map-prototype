// Types de points possibles dans l'API backend
// PASSAGE & INTERET & PAUSE correspondent aux types de l'API
// EXTREMITY est utilisé en interne (départ/arrivée) → traité comme PASSAGE pour l'API
export type TypeOfPoint = "PAUSE" | "PASSAGE" | "INTERET" | "EXTREMITY" | "USER";

// Traduction du type interne vers le type attendu par l'API
export const toApiPointType = (type: TypeOfPoint): "PASSAGE" | "INTERET" | "PAUSE" => {
    if (type === "EXTREMITY" || type === "USER") return "PASSAGE";
    return type;
};

// Niveaux de difficulté d'une route (groupe de balises)
export type DifficultyLevel = "FACILE" | "MOYEN" | "DIFFICILE";

// Types de route possibles
export type RouteType = "NATIONALE" | "DEPARTEMENTALE" | "AUTOROUTE" | "MIXTE";

// Groupe de points sur le trajet (= "Route" dans l'API)
export interface Group {
    id: string;
    name: string;
    description?: string;                            // description du segment
    routeType: RouteType;                            // NOUVEAU : type de route
    difficultyLevel: DifficultyLevel;               // NOUVEAU : niveau de difficulté
    color?: string;
}

// Un waypoint = un point d'étape sur le trajet (= "Point" dans l'API)
export interface Waypoint {
    id: string;
    lat: number;
    lng: number;
    label: string;              // → "name" dans l'API
    address?: string;           // adresse lisible (géocodage)
    description?: string;       // NOUVEAU : description du point
    pauseDurationMinutes?: number; // NOUVEAU : durée de pause (si type PAUSE)
    order: number;              // position dans le trajet (commence à 1)
    type: TypeOfPoint;
    groupId: string;
    isCustomName?: boolean;     // NOUVEAU : indique si le titre a été personnalisé
}
