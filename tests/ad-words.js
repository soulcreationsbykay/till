// Runs the REAL advertising word check and AI-draft rules out of index.html.
//
//   node tests/ad-words.js index.html
//
// WHAT THIS PROTECTS. A description on the website or Etsy is advertising,
// and the UK code (CAP/ASA) forbids health claims for crystals, unproven metal,
// green and safety claims, and superlatives. The till warns under the box as
// Kay types, and the AI's draft never overwrites her words without asking.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // AD WORDS: THE ADVERTISING WORD CHECK';
const END = '  // AD WORDS: END OF THE PURE PART';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the ad words block'); process.exit(2); }

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(HTML.slice(a, b) + '\nthis.T = { adWordCheck, aiFillPlan, aiPickPhoto };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}
const words = (s) => T.adWordCheck(s).map((h) => h.words.join('|'));

console.log('\nThe word check');
{
  check('a plain description has nothing to warn about',
    T.adWordCheck('A handmade crochet spider in soft black yarn, traditionally associated with Halloween.').length === 0);
  check('empty or missing text is fine', T.adWordCheck('').length === 0 && T.adWordCheck(undefined).length === 0);
  check('"healing" is caught', words('Rose quartz with healing energy').includes('healing'));
  check('the "master healer" nickname is caught', words('often called the "master healer"').includes('healer'));
  check('a condition is caught', words('Amethyst for anxiety and stress').some((w) => /anxiety/.test(w) && /stress/.test(w)));
  check('"known for" is caught', words('known for calmness and clarity').includes('known for'));
  check('"promotes" is caught', words('promotes calm').includes('promotes'));
  check('"sterling silver" and 925 are caught', words('925 sterling silver hook').some((w) => /sterling/.test(w) && /925/.test(w)));
  check('9ct gold is caught', words('a 9ct gold clasp').includes('9ct'));
  check('superlatives are caught', words('The best gift, guaranteed').some((w) => /best/.test(w) && /guaranteed/.test(w)));
  check('green claims are caught', words('Eco-friendly and sustainable').length === 1);
  check('safety claims are caught', words('Hypoallergenic and safe for babies').some((w) => /hypoallergenic/.test(w) && /safe for babies/.test(w)));
  check('"silver-toned" is not a metal claim', T.adWordCheck('a silver-toned feather').length === 0);
  check('"bestow" and "cured ham" style parts of words are not caught',
    T.adWordCheck('bestowed with care, in a curated set').length === 0);
  const hits = T.adWordCheck('Heals and heals and HEALS');
  check('a word that repeats is listed once', hits.length === 1 && hits[0].words.length === 1, JSON.stringify(hits));
  const order = T.adWordCheck('The best bookmark, known for healing');
  check('warnings come in the order they are written', /best/.test(order[0].words[0]), JSON.stringify(order.map((h) => h.words)));
  check('every warning says why', T.adWordCheck('healing 925 eco best hypoallergenic known as').every((h) => h.why && h.why.length > 20));
}

console.log('\nPutting the draft in the form');
{
  const draft = { webDesc: 'New words.', etsyTitle: 'Crochet spider', etsyTags: ['spider', 'halloween'] };
  let p = T.aiFillPlan(draft, { desc: '', etsy: true, title: '', tags: '' });
  check('an empty box is filled without asking', p.desc === 'New words.' && p.ask === false);
  check('an empty Etsy title and tags are filled', p.title === 'Crochet spider' && p.tags === 'spider, halloween');
  p = T.aiFillPlan(draft, { desc: 'Kay wrote this', etsy: true, title: 'Her title', tags: 'her, tags' });
  check('words Kay wrote are only replaced if she says yes', p.ask === true);
  check('her Etsy title and tags are kept and the AI\'s offered', p.title === null && p.tags === null && p.offer.length === 2);
  p = T.aiFillPlan(draft, { desc: 'New words.', etsy: false, title: '', tags: '' });
  check('the same words again need no question', p.ask === false);
  check('a website item gets no Etsy title or tags', p.title === null && p.tags === null && p.offer.length === 0);
}

console.log('\nWhich photo the AI sees');
{
  const etsyPic = 'data:image/jpeg;base64,AAA', web = 'https://images.sumup.com/img_1/x.jpg';
  check('an Etsy item uses its real Etsy photo', T.aiPickPhoto({ etsy: true, etsyPhoto: etsyPic, webPhoto: web }).image === etsyPic);
  check('a website item uses the website photo', T.aiPickPhoto({ etsy: false, etsyPhoto: etsyPic, webPhoto: web }).imageUrl === web);
  check('each falls back to the other', T.aiPickPhoto({ etsy: true, etsyPhoto: '', webPhoto: web }).imageUrl === web);
  check('no photo is no photo', T.aiPickPhoto({ etsy: false, etsyPhoto: '', webPhoto: '' }) === null);
  check('anything that is not a picture or https is ignored', T.aiPickPhoto({ etsy: false, webPhoto: 'javascript:alert(1)' }) === null);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
