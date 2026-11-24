/** Matches DataAccess.PredefinedEntities — stable GUIDs shared with ProtoLink.Api */
export const NAME_TYPE_ENTITY_ID = '00010003-0000-0000-0000-000000000000'
export const MIME_TYPE_ENTITY_ID = '00010012-0000-0000-0000-000000000000'

/** PredefinedEntities["public"] — anonymous / peer read principal */
export const PUBLIC_ENTITY_ID = '00000000-0000-0000-0000-000000000001'

/** Placeholder Id for AddPermission rows on AddEntity (server allocates real Ids). */
export const EMPTY_PERMISSION_ID = '00000000-0000-0000-0000-000000000000'

/** BusinessLayer.Services.FilesService.CloudFileCode */
export const CLOUD_FILE_CODE = 'CloudFile'

/** DataAccess.CloudTreeSeedIds.CloudFileTypeEntityId — D2 typeCloudFile */
export const CLOUD_FILE_TYPE_ENTITY_ID = 'b0000005-0000-4000-8000-000000000002'

/** Legacy Entity.Code discriminators before Code=name rewrite (Api tip e8e5209+). */
export const LEGACY_CLOUD_DISCRIMINATOR_CODES = new Set([
    'CloudFile',
    'CloudFolder',
    'CloudRoot',
])

/** BusinessLayer.Services.Contracts.TypeOfValue.String */
export const TYPE_OF_VALUE_STRING = 0

export type AddEntityPermissionPayload = {
    id: string
    permissionForId: string
    canWrite: boolean
}

/**
 * Owner write + public read — required for avatar CloudFiles (and Photos gallery files)
 * so getImage works for peers/anonymous after file ACL.
 */
export function buildOwnerAndPublicReadPermissions(
    ownerUserId: string
): AddEntityPermissionPayload[] {
    const owner = String(ownerUserId || '').trim()
    if (!owner) throw new Error('ownerUserId required')
    return [
        {
            id: EMPTY_PERMISSION_ID,
            permissionForId: owner,
            canWrite: true,
        },
        {
            id: EMPTY_PERMISSION_ID,
            permissionForId: PUBLIC_ENTITY_ID,
            canWrite: false,
        },
    ]
}
