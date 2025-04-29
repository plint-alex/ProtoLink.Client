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
    mainParentId?: string;
    name?: string;
    description?: string;
    codeIsUnique?: boolean;
    order?: number;
    parentIds?: string;
    hidden?: boolean;
    version?: number;
} 