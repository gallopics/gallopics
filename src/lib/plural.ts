const pluralRules = new Intl.PluralRules("en")

/** "1 photo", "2 photos"; pass the plural for irregular words ("class", "classes") */
export function plural(count: number, one: string, other = `${one}s`) {
  return `${count} ${pluralRules.select(count) === "one" ? one : other}`
}
