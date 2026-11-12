function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Word-boundary, case-insensitive matcher for a brand name.
 * Tolerates straight, curly or missing apostrophes ("Wendy's", "Wendy’s", "Wendys")
 * and also matches the name without a domain ending ("otterly.ai" -> "otterly").
 */
function createBrandRegex(name: string): RegExp {
  const clean = name.trim();
  const domainLess = clean.replace(/\.(ai|com|io|co|org|net)$/i, "");
  const esc = (s: string) => escapeRegex(s).replace(/['’‘`´]/g, "['’‘`´]?");

  const pattern =
    clean === domainLess
      ? `\\b${esc(clean)}\\b`
      : `(\\b${esc(clean)}\\b|\\b${esc(domainLess)}\\b)`;
  return new RegExp(pattern, "gi");
}

/** How many times `name` appears in `text`. */
export function countMentions(text: string, name: string): number {
  if (!name.trim()) return 0;
  return (text.match(createBrandRegex(name)) || []).length;
}
