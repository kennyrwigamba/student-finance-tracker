// Safely compiles regex search and performs matching highlight
export function compileRegex(input, flags = 'i') {
  if (!input) return null;
  try {
    let finalFlags = flags;
    if (!flags.includes('g')) {
      finalFlags = flags + 'g';
    }
    return new RegExp(input, finalFlags);
  } catch (error) {
    return null;
  }
}

export function highlight(text, re) {
  if (!re) return text;
  try {
    return text.replace(re, match => `<mark class="search-match">${match}</mark>`);
  } catch (error) {
    return text;
  }
}
