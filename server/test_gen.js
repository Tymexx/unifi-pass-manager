const niceware = require('niceware');

function generatePassword(policy = {}) {
  const p = {
    type: 'passphrase',
    wordCount: 3,
    separator: '-',
    capitalize: false,
    includeNumber: false,
    length: 14,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    ...policy
  };

  if (p.type === 'passphrase') {
    const words = [];
    while (words.length < p.wordCount) {
      let word = niceware.generatePassphrase(2)[0];
      if (word.length <= 8) { 
        if (p.capitalize) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        words.push(word);
      }
    }
    let sep = p.separator;
    if (sep === 'none') sep = '';
    if (sep === 'space') sep = ' ';
    
    let pass = words.join(sep);
    if (p.includeNumber) {
      pass += Math.floor(Math.random() * 10);
    }
    return pass;
  } else {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let chars = '';
    if (p.uppercase) chars += upper;
    if (p.lowercase) chars += lower;
    if (p.numbers) chars += nums;
    if (p.symbols) chars += syms;
    if (!chars) chars = lower + nums; // fallback

    let pass = '';
    for (let i = 0; i < p.length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }
}

console.log(generatePassword({ type: 'password' }));
console.log(generatePassword({ type: 'passphrase' }));
console.log(generatePassword(undefined));
