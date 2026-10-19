/** Copies plain text to the clipboard. Throws if the Clipboard API is unavailable. */
export async function copyText(text: string): Promise<void> {
    if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
    }
    await navigator.clipboard.writeText(text)
}
