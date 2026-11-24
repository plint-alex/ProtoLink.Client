export interface EntityValue {
    type: string;
    value: string;
    parents: string[];
}

export interface Entity {
    id: string;
    code: string;
    values: EntityValue[];
    viewIds: string[];
    viewId: string;
    mainParentId?: string;
    /** D2 shared type entity id (e.g. typeCloudFile). */
    typeEntityId?: string | null;
    name?: string;
    description?: string;
    codeIsUnique?: boolean;
    order?: number;
    parentIds?: string;
    hidden?: boolean;
    version?: number;
    creationTime?: string;
}

export interface Permission {
    id: string;
    permissionForId: string;
    permissionForCode?: string;
    canWrite: boolean;
    isUser?: boolean;
} 