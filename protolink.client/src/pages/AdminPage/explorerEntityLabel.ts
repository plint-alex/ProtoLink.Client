/** Admin Explorer row label: code → display name → id (never blank). */
export function explorerEntityLabel(entity: {
    id: string
    code?: string | null
    name?: string | null
}): string {
    const code = entity.code?.trim()
    if (code) return code
    const name = entity.name?.trim()
    if (name) return name
    return entity.id
}
