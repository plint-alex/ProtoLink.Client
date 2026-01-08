export interface EntityViewMapping {
    entityId: string;
    viewId: string;
}

export interface ViewData {
    scripts?: string;
    originalScripts?: string;
    entityViews: EntityViewMapping[]
}