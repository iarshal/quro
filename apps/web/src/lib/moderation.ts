const profanityWords = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'mf', 'wtf', 'stfu', 'motherfucker', 'phuck', 'phuckeerrr', 'phucker', 'fck', 'fcker',
  // Indian/Hindi Profanity & Slangs
  'bhenchod', 'madarchod', 'maaadaaar', 'madar', 'maderchod', 'chod', 'chodon', 'chodu', 'chut', 'choot', 'chuchi',
  'chutiya', 'chutiye', 'randi', 'rand', 'raand', 'randddduuu', 'randu', 'harami', 'bhosadike', 'bsdk', 'bhosada', 
  'lodu', 'lawde', 'laude', 'lund', 'land', 'gandu', 'gaandu', 'gaand', 'gandi', 'mc', 'mkc', 'bc', 'muthal',
  'tatty', 'tatti', 'tatte', 'jhant', 'jhaant', 'suar', 'kutte', 'kuta', 'kute', 'kamina', 'kaminay', 'kameena', 'kamini',
  'bhendi', 'chinal', 'dallah', 'dalla', 'haramzada', 'haramzadi', 'ullu ke patthe', 'ullu ka patha'
];
const homophobiaWords = ['faggot', 'fag', 'fags', 'dyke', 'tranny', 'chhakka', 'chakka', 'meetha', 'gudda', 'hijra', 'pansy', 'homo', 'batty boy'];
const racismWords = ['nigger', 'nigga', 'nigg', 'spic', 'chink', 'retard'];
const terrorismWords = ['bomb', 'kill', 'murder', 'terrorist', 'isis', 'jihad'];

export function moderateMessage(content: string): { level: number, censoredContent: string } {
  let level = 0;
  let censoredContent = content;

  const checkAndCensor = (words: string[], severity: number) => {
    let found = false;
    
    // Convert a word to a regex that matches repeated letters and spaces, e.g. "madarchod" -> "m+\s*a+\s*d+\s*a+\s*r+\s*c+\s*h+\s*o+\s*d+"
    const buildFuzzyRegex = (w: string) => {
      // For short acronyms (like mc, bc), match exactly but allow surrounding punctuation
      if (w.length <= 3) return new RegExp(`(?:^|[^a-zA-Z])${w.split('').map(char => `${char}+\\s*[^a-zA-Z]*\\s*`).join('')}(?:$|[^a-zA-Z])`, 'gi');
      
      // For longer words, aggressively match repeated letters, spaces, and punctuation between letters
      // e.g. "g a y s", "g.a.y.s", "g a y   s"
      const fuzzyPattern = w.split('').map(char => `${char}+[\\s_.,\\-!@#$%^&*]*`).join('');
      return new RegExp(fuzzyPattern, 'gi');
    };

    words.forEach(w => {
      const regex = buildFuzzyRegex(w);
      if (regex.test(censoredContent)) {
        found = true;
        censoredContent = censoredContent.replace(regex, match => '*'.repeat(match.length));
      }
    });

    if (found) level += severity;
  };

  checkAndCensor(profanityWords, 1);
  checkAndCensor(homophobiaWords, 2);
  checkAndCensor(racismWords, 3);
  checkAndCensor(terrorismWords, 3);

  // Political Humor Intercept (The "Modi" Rule)
  const modiRegex = /i\s*(hate|don't like|do not like|dislike)\s*modi|modi\s*is\s*(bad|a bad guy|terrible|worst)/i;
  if (modiRegex.test(censoredContent)) {
    // Override the output completely with praise
    censoredContent = "I like Modi, Modi is a good guy!";
    // Reset level so they don't get banned for this joke
    level = 0; 
  }

  return { level: Math.min(level, 3), censoredContent };
}
