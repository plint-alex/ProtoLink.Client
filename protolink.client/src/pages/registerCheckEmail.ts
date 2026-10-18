export function formatRegisterCheckEmailBody(template: string, email: string | undefined): string {
  const trimmed = email?.trim()
  if (!trimmed) {
    return template
  }
  return template.replaceAll('{email}', trimmed)
}
