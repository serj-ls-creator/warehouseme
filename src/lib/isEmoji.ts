/** Check if a string is an emoji (not a URL) */
export const isEmoji = (value: string | null | undefined): boolean => {
  if (!value) return false;
  // URLs start with http or data:
  if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("/")) return false;
  return true;
};
