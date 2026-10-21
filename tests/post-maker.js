// Runs the REAL Post maker rules out of index.html.
//
//   node tests/post-maker.js index.html
//
// WHAT THIS PROTECTS. Settings → Etsy → Make a post builds Instagram and
// Facebook carousels from what is live on Etsy. A post is an advert, so: no
// health or effect claims about crystals in names or captions; prices shown
// as Kay would write them; "Under £10" means under £10; a mix really mixes
// the kinds of thing; Instagram gets at most 10 hashtags. And the background
// cut-out must only ever take away a PLAIN background flooding in from the
// edges: a pale part in the middle of the item stays, and a busy photo is
// refused (it then stays whole in a frame) rather than cut badly.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // POST MAKER: THE PURE PART (v1.81.0)';
const END = '  // POST MAKER: END OF THE PURE PART';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the Post maker block'); process.exit(2); }
const ctx = { console, Uint8Array, Uint8ClampedArray, Math };
vm.createContext(ctx);
vm.runInContext(HTML.slice(a, b) + '\nthis.T = { pmSafe, pmShortName, pmPrice, pmTypeOf, pmPick, pmHashtags, pmCaptions, pmMask, pmPinText };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

// ---- words ----
check('claim words come out of names', T.pmSafe('Handmade Chakra Healing Stones') === 'Handmade Chakra Stones', T.pmSafe('Handmade Chakra Healing Stones'));
check('protection and energy too', !/protect|energy/i.test(T.pmSafe('Evil Eye Protection Keyring with Energy Beads')));
check('an Etsy title is cut to its first part', T.pmShortName('Amethyst Feather Bookmark - Crystal Gift for Book Lovers') === 'Amethyst Feather Bookmark');
check('a comma cuts too', T.pmShortName('7 Chakra Drop Earrings, natural stones, boho') === '7 Chakra Drop Earrings');
check('a long name is shortened at a word', (() => { const s = T.pmShortName('Crescent Moon Crystal Keyring With Evil Eye Charm And Matching Tassel'); return s.length <= 43 && s.endsWith('…') && !/\s…$/.test(s); })());
check('a short first part is not cut off', T.pmShortName('Bat - purple resin runes') !== 'Bat');

// ---- prices ----
check('whole pounds have no pence', T.pmPrice(7) === '£7');
check('pence are shown as two figures', T.pmPrice(8.5) === '£8.50' && T.pmPrice(5.99) === '£5.99');
check('no price, no text', T.pmPrice(null) === '' && T.pmPrice(undefined) === '');

// ---- kinds ----
check('kids\' earrings are kids', T.pmTypeOf('Kay/Kids Collection/Ear Rings Kids Beaded Dangle Earrings') === 'kids');
check('earrings', T.pmTypeOf('Kay/Jewellery/Earrings Amethyst Bead Drop Earrings') === 'earrings');
check('a wind spinner is a hanging, not crochet', T.pmTypeOf('Kay/Crochet Wind Spinner') === 'hangings');
check('a tarot holder is crochet', T.pmTypeOf('Kay/Crochet Crochet tarot card holder') === 'crochet');
check('runes are witchy', T.pmTypeOf('Kay/Witchcraft Purple Bat Runes') === 'witchy');
check('keyrings and key chains', T.pmTypeOf('Chakra Key Chain') === 'keyrings' && T.pmTypeOf('Crystal Heart Charm Keyring') === 'keyrings');

// ---- picking ----
const L = (id, price, type, created, photos) => ({ listingId: String(id), price, type, created, photos: photos === undefined ? [{ full: 'x', medium: 'x' }] : photos, title: 'Item ' + id });
const list = [
  L(1, 3, 'kids', 10), L(2, 10, 'earrings', 20), L(3, 7, 'bookmarks', 30), L(4, 12, 'crochet', 40),
  L(5, 9.99, 'earrings', 50), L(6, 8, 'keyrings', 60), L(7, 15, 'hangings', 70), L(8, 5, 'kids', 80, []),
];
const ids = (r) => Array.from(r, (l) => l.listingId).join(',');
check('newest comes first, and only listings with a photo', ids(T.pmPick(list, 'newest', 3)) === '7,6,5', ids(T.pmPick(list, 'newest', 3)));
check('under £10 is strictly under £10', ids(T.pmPick(list, 'under10', 9)) === '6,5,3,1', ids(T.pmPick(list, 'under10', 9)));
const mix = T.pmPick(list, 'mix', 5);
check('a mix takes one of each kind before any second', new Set(Array.from(mix, (l) => l.type)).size === 5, ids(mix));
check('at most n', T.pmPick(list, 'mix', 2).length === 2);

// ---- captions ----
const picked = [Object.assign(L(3, 7, 'bookmarks', 30), { name: 'Amethyst Bookmark' }), Object.assign(L(6, 8.5, 'keyrings', 60), { name: 'Crystal Heart Keyring' })];
const c = T.pmCaptions('under10', picked, 10, 'https://www.etsy.com/shop/SoulCreationsByKay');
check('the caption names each item with its price', c.instagram.includes('Amethyst Bookmark – £7') && c.instagram.includes('Crystal Heart Keyring – £8.50'));
check('Instagram says link in bio; Facebook has the shop link', /link in bio/.test(c.instagram) && c.facebook.includes('https://www.etsy.com/shop/SoulCreationsByKay') && !/link in bio/.test(c.facebook));
check('Facebook gets no hashtags', !/#/.test(c.facebook));
const tags = c.instagram.match(/#\w+/g) || [];
check('Instagram: at most 10 hashtags, no repeats', tags.length <= 10 && new Set(tags).size === tags.length, tags.join(' '));
check('Christmas hashtag in November and December only', c.instagram.includes('#christmasgiftideas') && !T.pmCaptions('newest', picked, 5).instagram.includes('#christmas'));
check('no claim words anywhere in a caption', !/heal|protect|energy|cleans/i.test(c.instagram + c.facebook));
check('the cover slide title follows the choice', c.slideTitle === 'Gifts under £10');

// ---- the cut-out ----
// A w x h picture: background colour everywhere, then shapes painted on.
function picture(w, h, bg, paint) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = paint(x, y) || bg, i = (y * w + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  return d;
}
const WHITE = [245, 245, 242], PURPLE = [110, 50, 150];
// A purple ring with a white middle: the middle is part of the item (a pale
// stone), so it must stay, because it does not touch the edge.
const ring = picture(60, 60, WHITE, (x, y) => {
  const r = Math.hypot(x - 30, y - 30);
  return r < 18 && r > 8 ? PURPLE : null;
});
const m = T.pmMask(ring, 60, 60);
check('a plain background is found', m.ok === true, m.why);
check('the background goes', m.ok && m.alpha[0] === 0 && m.alpha[59] === 0);
check('the item stays', m.ok && m.alpha[30 * 60 + 17] === 255);
check('a pale part in the middle of the item stays', m.ok && m.alpha[30 * 60 + 30] === 255);
check('the item\'s box is found', m.ok && m.box.x >= 11 && m.box.x <= 13 && m.box.w >= 34 && m.box.w <= 38, JSON.stringify(m.box));
// Stripes at the edge: not a plain background, so refused.
const busy = picture(60, 60, WHITE, (x, y) => ((x >> 2) % 2 ? [40, 90, 30] : [200, 60, 60]));
check('a busy background is refused, not cut', T.pmMask(busy, 60, 60).ok === false);
// The item fills the whole photo: nothing to take away.
const fills = picture(60, 60, WHITE, (x, y) => (x > 1 && y > 1 && x < 58 && y < 58 ? PURPLE : null));
check('a photo the item fills is refused', T.pmMask(fills, 60, 60).ok === false);
// A pair of earrings: two pieces is fine.
const pair = picture(60, 60, WHITE, (x, y) => (Math.hypot(x - 18, y - 30) < 8 || Math.hypot(x - 42, y - 30) < 8 ? PURPLE : null));
check('a pair (two pieces) is cut out', T.pmMask(pair, 60, 60).ok === true);
// One item and lots of crumbs: the background was not really plain.
const crumbs = picture(60, 60, WHITE, (x, y) => (Math.hypot(x - 30, y - 30) < 7 || ((x % 6 === 3) && (y % 6 === 3) && (x < 18 || x > 42)) ? PURPLE : null));
check('an item among scattered bits is refused', T.pmMask(crumbs, 60, 60).ok === false, T.pmMask(crumbs, 60, 60).why);
// A slightly textured background (a table, paper): refused.
const textured = picture(60, 60, WHITE, (x, y) => (Math.hypot(x - 30, y - 30) < 12 ? PURPLE : ((x * 7 + y * 13) % 5 === 0 ? [200, 185, 160] : null)));
check('a textured background is refused', T.pmMask(textured, 60, 60).ok === false, T.pmMask(textured, 60, 60).why);
// Nothing there at all.
check('an empty photo is refused', T.pmMask(picture(60, 60, WHITE, () => null), 60, 60).ok === false);

// ---- Pinterest pins (v1.82.0) ----
const pinItem = (over) => Object.assign({ listingId: '5', title: 'Amethyst Feather Bookmark - Crystal Gift', name: 'Amethyst Feather Bookmark', price: 7, type: 'bookmarks', url: 'https://www.etsy.com/listing/5', photos: [{}] }, over || {});
const p1 = T.pmPinText(pinItem(), 10);
check('a pin links to its own Etsy listing', p1.link === 'https://www.etsy.com/listing/5');
check('pin title is at most 100 characters', T.pmPinText(pinItem({ name: 'A very long name '.repeat(10) }), 10).title.length <= 100);
check('pin description is at most 500 characters', T.pmPinText(pinItem({ name: 'Long '.repeat(150) }), 10).description.length <= 500);
check('a bookmark goes on the bookmarks board, then Gifts Under £10', p1.boards[0] === 'Crystal Bookmarks for Book Lovers' && p1.boards[1] === 'Gifts Under £10', p1.boards.join(' / '));
check('£10 or more goes to the Christmas board in Oct-Dec', T.pmPinText(pinItem({ price: 12, type: 'earrings' }), 10).boards[1] === 'Christmas Gifts & Stocking Fillers');
check('outside Oct-Dec it goes to the gift ideas board', T.pmPinText(pinItem({ price: 12, type: 'earrings' }), 4).boards[1] === 'Spiritual Gift Ideas for Her');
check('a Tree of Life hanging goes on the Tree of Life board', T.pmPinText(pinItem({ type: 'hangings', name: 'Tree of Life Wall Hanging', price: 15 }), 10).boards[0] === 'Crochet Tree of Life Wall Hangings');
check('never the same board twice', (() => { const b = T.pmPinText(pinItem({ type: 'brooches', price: 12 }), 4).boards; return b[0] !== b[1]; })());
const claimy = T.pmPinText(pinItem({ name: 'Chakra Healing Energy Protection Keyring', type: 'keyrings' }), 10);
check('no claim words in a pin title or description', !/heal|energy|protect/i.test(claimy.title + claimy.description), claimy.title);
check('the price is in the description', p1.description.includes('£7'));
check('kids\' things go on the kids board', T.pmPinText(pinItem({ type: 'kids', price: 3 }), 10).boards[0] === "Kids' Earrings, Bracelets & Hair Clips");
// Pinterest refuses a board name over 50 characters (seen 21 Oct 2026).
const allBoards = new Set();
['earrings', 'bracelets', 'necklaces', 'bookmarks', 'keyrings', 'kids', 'crochet', 'hangings', 'witchy', 'brooches', 'other'].forEach((type) => {
  [3, 12].forEach((price) => [2, 10].forEach((month) => T.pmPinText(pinItem({ type, price, name: type === 'hangings' ? 'Tree of Life Hanging' : 'Thing' }), month).boards.forEach((b) => allBoards.add(b))));
  T.pmPinText(pinItem({ type, price: 15, name: 'Suncatcher' }), 10).boards.forEach((b) => allBoards.add(b));
});
const tooLong = Array.from(allBoards).filter((b) => b.length > 50);
check('every suggested board name fits Pinterest\'s 50 characters', tooLong.length === 0, tooLong.join(' | '));
check('a crochet tote goes on the crochet gifts & bags board', T.pmPinText(pinItem({ type: 'crochet', name: 'Handmade Crochet Granny Square Tote Bag', price: 15 }), 10).boards[0] === 'Handmade Crochet Gifts & Bags');

// ---- tagged topics (v1.82.1) ----
const tote = T.pmPinText(pinItem({ type: 'crochet', name: 'Handmade Crochet Granny Square Tote Bag', price: 15 }), 10).topics;
check('a crochet tote is tagged as a bag and a granny square', tote.includes('Crochet bag') && tote.includes('Tote bag') && tote.includes('Granny square'), tote.join(', '));
check('at most five topics, no repeats', tote.length <= 5 && new Set(tote).size === tote.length);
const cheap = T.pmPinText(pinItem({ price: 7 }), 10).topics;
check('under £10 is tagged as a stocking stuffer', cheap.includes('Stocking stuffers'), cheap.join(', '));
check('kids\' things are not tagged "Gifts for her"', !T.pmPinText(pinItem({ type: 'kids', price: 3 }), 4).topics.includes('Gifts for her'));
check('no claim words in topics', !/heal|energy|protect/i.test(Object.keys({ a: 1 }).map(() => ['earrings', 'witchy', 'hangings', 'other'].map((type) => T.pmPinText(pinItem({ type }), 10).topics.join(' ')).join(' ')).join('')));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
