/** Replace `{email}` in copy templates; leave placeholder if address empty. */
export function formatEmailBodyPlaceholder(template: string, email: string | undefined): string {
  const trimmed = email?.trim()
  if (!trimmed) {
    return template
  }
  return template.split('{email}').join(trimmed)
}
