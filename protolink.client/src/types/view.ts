export interface EntityViewMapping {
    entityId: string;
    viewId: string | null;
}

export interface ViewData {
    scripts?: string;
    originalScripts?: string;
    entityViews: EntityViewMapping[]
}