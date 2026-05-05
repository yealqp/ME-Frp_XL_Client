/**
 * Clipboard utility
 * Provides a unified copy-to-clipboard function with fallback support
 */

/**
 * Copy text to clipboard with fallback for insecure contexts
 * @param text - The text to copy
 * @returns Whether the copy operation succeeded
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    return true;
  } catch {
    return false;
  }
}
