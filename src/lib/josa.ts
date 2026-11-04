/** Joins words with 와/과, picked by whether the last syllable has a final consonant. */
export function joinWa(words: string[]) {
  return words.reduce((acc, w, i) => {
    if (i === 0) return w;
    const last = acc[acc.length - 1];
    const code = last.charCodeAt(0) - 0xac00;
    // Latin words (HAVING, NULL, JOIN…) are read aloud, so letters that end in a consonant sound take 과.
    const batchim = code >= 0 && code <= 11171 ? code % 28 !== 0 : /[LMNGKPTB]/i.test(last);
    return `${acc}${batchim ? "과" : "와"} ${w}`;
  }, "");
}
