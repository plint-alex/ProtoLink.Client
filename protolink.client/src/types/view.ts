export interface EntityViewMapping {
    entityId: string;
    viewId: string;
}

export interface ViewData {
    scripts: string;
    entityViews: EntityViewMapping[]
}