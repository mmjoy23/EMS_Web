/** Join truthy class names. Ported verbatim from the prototype's `cn` helper. */
export const cn = (...c: (string | false | null | undefined)[]): string =>
  c.filter(Boolean).join(" ");
