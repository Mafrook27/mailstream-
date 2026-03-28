// A curated list of common spam trigger words that hurt deliverability
export const SPAM_WORDS = [
  '100%', 'act now', 'action', 'apply now', 'as seen on', 'bargain', 'bonus',
  'buy direct', 'call now', 'cancel at any time', 'cash', 'click here',
  'clearance', 'compare rates', 'credit card', 'deal', 'direct email',
  'discount', 'earn', 'exclusive deal', 'free', 'guarantee', 'increase sales',
  'investment', 'limited time', 'make money', 'no catch', 'no hidden costs',
  'no obligation', 'offer', 'opportunity', 'order now', 'passwords', 'pennies a day',
  'promise', 'pure profit', 'risk free', 'save $', 'special promotion',
  'urgent', 'winner', 'winning', 'work from home', '$$$', 'buy now', 'cheap',
  'double your', 'earn money', 'extra income', 'fast cash', 'financial freedom',
  'get paid', 'hidden assets', 'income', 'investment decision', 'lowest price',
  'make $', 'money making', 'multi-level marketing', 'no investment', 'obligation',
  'one time', 'pennies', 'potential earnings', 'prize', 'promise you', 'pure profit',
  'quote', 'rates', 'refinance', 'save big money', 'save up to', 'serious cash',
  'stock alert', 'unsecured credit', 'unsecured debt', 'weight loss'
];

export interface DeliverabilityReport {
  score: number;
  status: 'Excellent' | 'Good' | 'Warning' | 'Poor';
  issues: string[];
}

export function analyzeDeliverability(subject: string, body: string): DeliverabilityReport {
  const issues: string[] = [];
  let score = 100;

  const lowerSubject = subject.toLowerCase();
  const lowerBody = body.toLowerCase();

  // 1. Spam Words Check
  const foundSpamWords = SPAM_WORDS.filter(word =>
    lowerSubject.includes(word) || lowerBody.includes(word)
  );

  if (foundSpamWords.length > 0) {
    const penalty = Math.min(foundSpamWords.length * 5, 40); // Cap penalty at 40
    score -= penalty;
    issues.push(`Contains ${foundSpamWords.length} spam trigger words: ${foundSpamWords.slice(0, 3).join(', ')}${foundSpamWords.length > 3 ? '...' : ''}`);
  }

  // 2. Subject Length
  const subjectWords = subject.split(/\s+/).filter(w => w.length > 0);
  if (subjectWords.length > 8) {
    score -= 10;
    issues.push('Subject line is too long (optimal is 3-7 words).');
  } else if (subjectWords.length < 2 && subjectWords.length > 0) {
    score -= 5;
    issues.push('Subject line is very short.');
  }

  // 3. Link Density
  const linkCount = (body.match(/<a /g) || []).length + (body.match(/http/g) || []).length;
  if (linkCount > 3) {
    score -= 15;
    issues.push(`Too many links (${linkCount}). High risk of spam folder.`);
  }

  // 4. ALL CAPS
  const capsMatch = body.match(/[A-Z]{5,}/g);
  if (capsMatch && capsMatch.length > 2) {
    score -= 10;
    issues.push('Excessive use of ALL CAPS.');
  }

  // 5. Exclamation marks
  const exclamationCount = (subject.match(/!/g) || []).length + (body.match(/!/g) || []).length;
  if (exclamationCount > 4) {
    score -= 5;
    issues.push('Excessive use of exclamation marks (!).');
  }
  
  // 6. Missing Spintax (Warning only, no penalty)
  if (!body.includes('{') || !body.includes('|') || !body.includes('}')) {
    issues.push('Consider using Spintax (e.g., {Hi|Hello}) to increase uniqueness and avoid spam filters.');
  }

  const finalScore = Math.max(0, score);
  
  let status: 'Excellent' | 'Good' | 'Warning' | 'Poor' = 'Poor';
  if (finalScore >= 90) status = 'Excellent';
  else if (finalScore >= 70) status = 'Good';
  else if (finalScore >= 50) status = 'Warning';

  return {
    score: finalScore,
    status,
    issues
  };
}
