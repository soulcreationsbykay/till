// Runs the REAL Etsy rules out of index.html.
//
//   node tests/etsy.js index.html
//
// WHAT THIS PROTECTS. Some items are KEPT FOR ETSY. Etsy will not take AI-made
// pictures and every website photograph has been tidied with AI, so an Etsy
// item has its own real photographs and is never ready without one. And an
// item kept for Etsy is never on the website as well, or one handmade piece
// could sell twice. The photographs themselves live in the workspace; the
// record keeps only their fingerprints, in order, so that list must never hold
// a duplicate, go over Etsy's limit, or be left behind empty.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // ETSY: WHAT IS KEPT FOR ETSY';
const END = '  // ETSY: END OF THE PURE PART';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the Etsy block'); process.exit(2); }
// v1.63.0: colour groups use the website's name rule, which lives in its own
// block; it is loaded too, so what is checked is the shipped rule.
const VA = HTML.indexOf('  // ---- variant names ----'), VB = HTML.indexOf('  // ---- end variant names ----');
if (VA < 0 || VB < 0) { console.error('could not locate the variant names block'); process.exit(2); }
const SRC = HTML.slice(VA, VB) + HTML.slice(a, b);

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { ETSY_PHOTO_MAX, etsyPicsOf, etsyPhotoDocId, etsyStatus, applyEtsyChoice, etsyAddPic, etsyRemovePic, etsyMovePic, etsyTodo, cleanEtsyTitle, parseEtsyTags, etsyTagsOf, ETSY_TITLE_MAX, ETSY_TAG_MAX, ETSY_TAG_LEN, isEarring, etsyReturnsFor, etsyDeliveryFor, etsyDraftPayload, searchEtsyCategories, etsyFolderLevels, etsyCategoryFor, etsyWords, suggestEtsyCategories, etsyColourGroup, etsyGroupPayload, etsyStockList, etsyChecklist, etsyWordsPayload };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}
const ready = () => ({ name: 'Blue scarf', etsy: 1, etsyPics: ['f1'], price: 18, counted: 1 });

console.log('\nWhen an item is ready for Etsy');
{
  check('not ticked is off, whatever else it has', T.etsyStatus({ etsyPics: ['f1'], price: 5, counted: 1 }) === 'off');
  check('no item at all is off', T.etsyStatus(undefined) === 'off');
  check('ticked with a photo, a price and stock is ready', T.etsyStatus(ready()) === 'ready');
  const noPic = ready(); delete noPic.etsyPics;
  check('no real photo is never ready', T.etsyStatus(noPic) === 'photos');
  const website = ready(); delete website.etsyPics; website.photo = 'data:image/jpeg;base64,AAAA'; website.photoKey = 'data:x';
  check('the website photo does not count as an Etsy one', T.etsyStatus(website) === 'photos');
  check('an empty list is no photo', T.etsyStatus(Object.assign(ready(), { etsyPics: [] })) === 'photos');
  check('junk in the list is no photo', T.etsyStatus(Object.assign(ready(), { etsyPics: ['', null, 3] })) === 'photos');
  check('no price is not ready', T.etsyStatus(Object.assign(ready(), { price: 0 })) === 'price');
  check('none in stock is not ready', T.etsyStatus(Object.assign(ready(), { counted: 0 })) === 'stock');
  check('photos are asked for before the price',
    T.etsyStatus({ etsy: 1, price: 0, counted: 0 }) === 'photos');
}

console.log('\nEtsy or the website, never both');
{
  const it = { web: 1 };
  T.applyEtsyChoice(it, true, true);
  check('ticking Etsy takes it off the website, even with both ticked', it.etsy === 1 && !('web' in it));
  T.applyEtsyChoice(it, false, true);
  check('unticking Etsy and ticking the website swaps it over', !('etsy' in it) && it.web === 1);
  T.applyEtsyChoice(it, false, false);
  check('neither leaves no stray fields', !('etsy' in it) && !('web' in it));
  const kept = { etsyPics: ['f1'] };
  T.applyEtsyChoice(kept, false, false);
  check('unticking Etsy keeps its photos for next time', kept.etsyPics.length === 1);
}

console.log('\nThe list of photographs on the record');
{
  const it = {};
  check('adding the first works', T.etsyAddPic(it, 'f1').added && it.etsyPics.join() === 'f1');
  const again = T.etsyAddPic(it, 'f1');
  check('the same picture twice is refused', !again.added && again.already && it.etsyPics.length === 1);
  check('a blank fingerprint is refused', !T.etsyAddPic(it, '').added && it.etsyPics.length === 1);
  for (let i = 2; i <= T.ETSY_PHOTO_MAX; i++) T.etsyAddPic(it, 'f' + i);
  const over = T.etsyAddPic(it, 'one-too-many');
  check('no more than Etsy\'s ' + T.ETSY_PHOTO_MAX, !over.added && over.full && it.etsyPics.length === T.ETSY_PHOTO_MAX);

  const m = { etsyPics: ['a', 'b', 'c'] };
  check('moving later swaps with the next', T.etsyMovePic(m, 'a', +1) && m.etsyPics.join() === 'b,a,c');
  check('moving earlier swaps with the one before', T.etsyMovePic(m, 'c', -1) && m.etsyPics.join() === 'b,c,a');
  check('the first cannot move earlier', !T.etsyMovePic(m, 'b', -1) && m.etsyPics.join() === 'b,c,a');
  check('the last cannot move later', !T.etsyMovePic(m, 'a', +1) && m.etsyPics.join() === 'b,c,a');
  check('a picture it does not have cannot move', !T.etsyMovePic(m, 'zz', +1));

  T.etsyRemovePic(m, 'c');
  check('removing one closes the gap', m.etsyPics.join() === 'b,a');
  T.etsyRemovePic(m, 'b'); T.etsyRemovePic(m, 'a');
  check('removing the last leaves no empty list behind', !('etsyPics' in m));

  const dup = { etsyPics: ['x', 'x', 'y'] };
  check('a duplicate already on a record is read once', T.etsyPicsOf(dup).join() === 'x,y');
}

console.log('\nWhere a photograph is kept');
{
  check('the document names the item and the picture', T.etsyPhotoDocId('KA-0001', 'f1') === 'KA-0001~f1');
  check('one picture on two items is two documents', T.etsyPhotoDocId('KA-0001', 'f1') !== T.etsyPhotoDocId('KA-0002', 'f1'));
  check('characters Firestore cannot take are made safe', T.etsyPhotoDocId('KA/1.2#$[]', 'f') === 'KA_1_2____~f');
  check('a ~ in a barcode cannot fake another item\'s picture',
    T.etsyPhotoDocId('KA~f1', 'x') !== T.etsyPhotoDocId('KA', 'f1~x'));
}

console.log('\nThe Etsy list in Settings');
{
  const all = {
    'KA-1': Object.assign(ready(), { name: 'Zebra brooch' }),
    'KA-2': { name: 'Apple earrings', etsy: 1, price: 9, counted: 2 },
    'KA-3': { name: 'Website only', web: 1, price: 4, counted: 3 },
    'KA-4': Object.assign(ready(), { name: 'Bag', price: 0 }),
    'KA-5': Object.assign(ready(), { name: 'Anklet' }),
  };
  const t = T.etsyTodo(all);
  check('only items kept for Etsy are listed', t.ready.length + t.waiting.length === 4);
  check('ready ones are apart, by name', t.ready.map(r => r.bc).join() === 'KA-5,KA-1');
  check('waiting ones say why', t.waiting.map(r => r.bc + ':' + r.status).join() === 'KA-2:photos,KA-4:price');
  check('each row carries its photo count', t.ready[0].pics === 1 && t.waiting[0].pics === 0);
  const none = T.etsyTodo({});
  check('nothing kept for Etsy is an empty list', !none.ready.length && !none.waiting.length);
}

// v1.57.0. Etsy refuses a whole listing over one bad tag, so the till must
// never hand it one: no tag over 20 characters, no more than 13, nothing but
// letters, numbers, spaces, hyphens and apostrophes. A tag that is too long is
// reported, never cut, because a cut tag says something else.
console.log('\nThe Etsy title');
{
  check('spaces are tidied', T.cleanEtsyTitle('  Crochet   spider  toy ') === 'Crochet spider toy');
  check('never over 140', T.cleanEtsyTitle('x'.repeat(200)).length === T.ETSY_TITLE_MAX);
  check('empty stays empty, so the name is used', T.cleanEtsyTitle('   ') === '');
}

console.log('\nThe Etsy tags');
{
  const p = T.parseEtsyTags('crochet spider, Halloween gift ,amigurumi,, ');
  check('split on commas and tidied', p.tags.join('|') === 'crochet spider|Halloween gift|amigurumi', p.tags.join('|'));
  check('the same tag twice, in any case, is kept once',
    T.parseEtsyTags('Spider, spider, SPIDER').tags.length === 1);
  check('characters Etsy refuses are dropped', T.parseEtsyTags('gift!, toy & game, kid\'s-toy').tags.join('|') === 'gift|toy game|kid\'s-toy',
    T.parseEtsyTags('gift!, toy & game, kid\'s-toy').tags.join('|'));
  check('accented letters are kept', T.parseEtsyTags('crème, naïve').tags.join('|') === 'crème|naïve');
  const long = T.parseEtsyTags('short, this tag is far too long for etsy');
  check('a tag over 20 is reported, not kept', long.tags.join('|') === 'short' && long.tooLong.length === 1);
  check('and not cut short', long.tooLong[0] === 'this tag is far too long for etsy');
  check('exactly 20 is fine', T.parseEtsyTags('a'.repeat(20)).tags.length === 1);
  const many = T.parseEtsyTags(Array.from({ length: 16 }, (_, i) => 'tag' + i).join(','));
  check('no more than 13 kept', many.tags.length === T.ETSY_TAG_MAX, String(many.tags.length));
  check('and the extra ones are counted', many.over === 3, String(many.over));
  check('a line break also separates tags', T.parseEtsyTags('one\ntwo').tags.length === 2);
  check('nothing typed is no tags', T.parseEtsyTags('').tags.length === 0);
  check('tags read off a record ignore junk', T.etsyTagsOf({ etsyTags: ['ok', '', null, 5] }).join() === 'ok');
}

// v1.59.0. What a draft listing is sent with. Earrings must never go with a
// returns policy by accident, the delivery profile must never be the cheaper
// one by accident, and what is sent is the record, not the website's photo.
console.log('\nReturns on Etsy');
{
  check('earrings in the name are no returns', T.etsyReturnsFor({ name: 'Amethyst Drop Earrings' }).noReturns === true);
  check('earrings in the folder are no returns', T.etsyReturnsFor({ name: 'Studs', folder: 'Kay/Jewellery/Earrings' }).noReturns === true);
  check('an earring and pendant set counts as earrings', T.isEarring({ name: 'Black Agate Earrings and Pendant Set' }));
  check('anything else has returns', T.etsyReturnsFor({ name: 'Crochet spider', folder: 'Kay/Crafted Gifts' }).noReturns === false);
  check('and says it was automatic', T.etsyReturnsFor({ name: 'Crochet spider' }).auto === true);
  check('Kay can allow returns on earrings', T.etsyReturnsFor({ name: 'Drop Earrings', etsyReturns: 'returns' }).noReturns === false);
  check('Kay can refuse returns on anything', T.etsyReturnsFor({ name: 'Scarf', etsyReturns: 'none' }).noReturns === true);
  check('an unknown override falls back to automatic', T.etsyReturnsFor({ name: 'Drop Earrings', etsyReturns: 'maybe' }).noReturns === true);
}

console.log('\nDelivery profile on Etsy');
{
  check('a large letter is Large letter', T.etsyDeliveryFor({ post: 'letter' }) === 'Large letter');
  check('a parcel is Small parcel', T.etsyDeliveryFor({ post: 'parcel' }) === 'Small parcel');
  check('not chosen is a parcel, never the cheaper one', T.etsyDeliveryFor({}) === 'Small parcel');
}

console.log('\nWhat a draft is sent with');
{
  const it = { name: 'Spider', etsyTitle: 'Hand-crocheted spider toy', webDesc: ' A spider. ', price: 15, counted: 2,
    etsyTags: ['spider', 'gift'], post: 'letter', folder: 'Kay/Crafted Gifts', photo: 'data:image/jpeg;base64,WEBSITE', etsy: 1, etsyPics: ['f1'] };
  const p = T.etsyDraftPayload(it, 'KA-0201', { key: 'crafted gift', label: 'Crafted Gifts' });
  check('the Etsy title when there is one', p.title === 'Hand-crocheted spider toy');
  check('the name when there is not', T.etsyDraftPayload({ name: 'Spider' }, 'KA-1', { key: 'k', label: 'L' }).title === 'Spider');
  check('the description, tidied', p.description === 'A spider.');
  check('the stock count is the quantity', p.quantity === 2);
  check('the tags', p.tags.join() === 'spider,gift');
  check('the postage size', p.post === 'letter');
  check('no postage size goes as a parcel', T.etsyDraftPayload({ name: 'x' }, 'KA-1', { key: 'k', label: 'L' }).post === 'parcel');
  check('the folder category', p.category === 'crafted gift' && p.categoryLabel === 'Crafted Gifts');
  check('the returns choice', p.noReturns === false);
  check('never the website photo', !JSON.stringify(p).includes('WEBSITE') && !('photo' in p));
}

console.log('\nSearching Etsy categories');
{
  const list = [
    { id: 1, path: 'Jewelry' }, { id: 2, path: 'Jewelry › Earrings' },
    { id: 3, path: 'Jewelry › Earrings › Dangle & Drop Earrings' }, { id: 4, path: 'Toys & Games › Stuffed Animals & Plushies' },
  ];
  check('every word must match', T.searchEtsyCategories(list, 'drop earrings').map(c => c.id).join() === '3');
  check('shortest first', T.searchEtsyCategories(list, 'earrings').map(c => c.id).join() === '2,3');
  check('capitals do not matter', T.searchEtsyCategories(list, 'JEWELRY').length === 3);
  check('nothing typed is nothing shown', T.searchEtsyCategories(list, '  ').length === 0);
  check('at most the number asked for', T.searchEtsyCategories(list, 'e', 2).length === 2);
}

// v1.60.0. A category can be chosen for a subfolder (Crafted Gifts ›
// Bookmarks) as well as a folder. The most specific choice must win, a
// subfolder with none must fall back to its folder's, and the folder's key
// must stay the one v1.59.0 used, so choices already made still apply.
console.log('\nCategories for subfolders');
{
  const lv = T.etsyFolderLevels('Kay/Crafted Gifts/Bookmarks');
  check('most specific first', lv.map(l => l.key).join(' | ') === 'crafted gift/bookmark | crafted gift', lv.map(l => l.key).join(' | '));
  check('labels read as a path', lv[0].label === 'Crafted Gifts › Bookmarks' && lv[1].label === 'Crafted Gifts');
  check('the folder key is the one v1.59.0 used', T.etsyFolderLevels('Kay/Crafted Gifts')[0].key === 'crafted gift');
  check('the maker is never a level', T.etsyFolderLevels('Kay').length === 0);
  check('stray spaces and slashes are ignored', T.etsyFolderLevels(' Kay / Jewellery / Earrings /').map(l => l.key).join() === 'jewellery/earring,jewellery');
  const cats = { 'crafted gift': { path: 'Toys' }, 'crafted gift/bookmark': { path: 'Bookmarks' } };
  check('a subfolder with its own uses it', T.etsyCategoryFor('Kay/Crafted Gifts/Bookmarks', cats).cat.path === 'Bookmarks');
  const br = T.etsyCategoryFor('Kay/Crafted Gifts/Brooches', cats);
  check('a subfolder without one uses its folder\'s', br.cat.path === 'Toys' && br.level.label === 'Crafted Gifts');
  check('nothing chosen anywhere is none', T.etsyCategoryFor('Kay/Witchcraft/Runes', cats).cat === null);
  check('categories not loaded yet is none, not a crash', T.etsyCategoryFor('Kay/Crafted Gifts', null).cat === null);
  const p = T.etsyDraftPayload({ name: 'x' }, 'KA-1', { key: 'crafted gift/bookmark', label: 'Crafted Gifts › Bookmarks', keys: ['crafted gift/bookmark', 'crafted gift'] });
  check('a draft is sent every level, most specific first', p.categories.join() === 'crafted gift/bookmark,crafted gift');
  check('and still the one key an older service reads', p.category === 'crafted gift/bookmark');
}

// v1.61.0. Suggesting an Etsy category from the words Kay already uses. The
// suggestion must put the obvious match first for a clearly named folder,
// translate UK words to Etsy's US ones, ignore words that say nothing, and
// never suggest anything when there is nothing to go on.
console.log('\nSuggesting an Etsy category');
{
  const etsy = [
    { id: 1, path: 'Jewelry' },
    { id: 2, path: 'Jewelry › Earrings' },
    { id: 3, path: 'Jewelry › Earrings › Dangle & Drop Earrings' },
    { id: 4, path: 'Jewelry › Brooches, Pins & Clips › Brooches' },
    { id: 5, path: 'Books, Movies & Music › Books › Bookmarks' },
    { id: 6, path: 'Toys & Games › Toys › Stuffed Animals & Plushies' },
    { id: 7, path: 'Craft Supplies & Tools › Yarn & Fiber › Yarn' },
    { id: 8, path: 'Home & Living › Home Decor › Candles & Holders › Candles' },
    { id: 9, path: 'Accessories › Keychains & Lanyards › Keychains' },
  ];
  check('words: lower case, plurals and UK spellings agree', T.etsyWords('Bookmarks, JEWELLERY, keyrings').join() === 'bookmark,jewelry,keychain');
  check('words that say nothing are dropped', T.etsyWords('Handmade gift set for my mum').join() === 'mom');
  const bm = T.suggestEtsyCategories(etsy, ['Bookmarks', 'Crafted Gifts'], ['Pressed flower bookmark']);
  check('a Bookmarks folder suggests Bookmarks first', bm[0] && bm[0].id === 5, JSON.stringify(bm));
  const br = T.suggestEtsyCategories(etsy, ['Brooches', 'Crafted Gifts'], ['Bee brooch', 'Owl brooch']);
  check('a Brooches folder suggests Brooches first', br[0] && br[0].id === 4, JSON.stringify(br));
  const ear = T.suggestEtsyCategories(etsy, ['Jewellery'], ['Amethyst Drop Earrings', 'Hoop Earrings', 'Bead Drop Earrings']);
  check('Jewellery full of drop earrings suggests drop earrings, through the US spelling', ear[0] && ear[0].id === 3, JSON.stringify(ear));
  check('and Jewelry itself is among them', ear.some(h => h.path.indexOf('Jewelry') === 0));
  const kr = T.suggestEtsyCategories(etsy, ['Keyrings'], []);
  check('a UK folder name finds its US category', kr[0] && kr[0].id === 9, JSON.stringify(kr));
  check('nothing to go on suggests nothing', T.suggestEtsyCategories(etsy, ['Handmade Gifts'], ['A lovely gift set']).length === 0);
  check('no more than asked for', T.suggestEtsyCategories(etsy, ['Jewellery'], ['earrings brooch'], 2).length === 2);
  check('no list yet is no suggestion, not a crash', T.suggestEtsyCategories(null, ['Bookmarks'], []).length === 0);
}

console.log('\nThe category that IS the thing beats one that merely contains it');
{
  const etsy = [
    { id: 7, path: 'Craft Supplies & Tools › Yarn & Fiber › Yarn' },
    { id: 10, path: 'Yarn & Fiber › Kits' },
  ];
  const y = T.suggestEtsyCategories(etsy, ['Yarn'], []);
  check('Yarn itself first, though the other path is shorter', y[0] && y[0].id === 7, JSON.stringify(y));
}

console.log('\nColour groups go as ONE listing, with only the colours ticked for Etsy (v1.63.0)');
{
  const D = ' — ';
  const col = (label, over) => Object.assign({ name: 'Tarot card holder' + D + label, etsy: 1, etsyPics: ['f-' + label], price: 18, counted: 2, folder: 'Kay/Crochet', post: 'letter' }, over || {});
  const all = {
    'KA-1': col('Purple', { etsyTags: ['tarot', 'crochet'], webDesc: 'Hand crocheted.' }),
    'KA-2': col('Green', { etsyTags: ['Crochet', 'witchy'] }),
    'KA-3': col('Blue', { etsyPics: [] }),
    'KA-4': col('Red', { etsy: undefined }),
    'KA-5': { name: 'Tarot card holder', etsy: 1, etsyPics: ['x'], price: 5, counted: 1 },
    'KA-6': { name: 'tarot CARD holder' + D + 'Amber', etsy: 1, etsyPics: ['a'], price: 20, counted: 1, post: 'parcel' },
  };
  const g = T.etsyColourGroup('KA-1', all);
  check('grouped by the name before the dash, ignoring case, like the website', g && g.group === 'Tarot card holder');
  check('only colours ticked for Etsy and ready are offered, sorted by colour',
    g.ready.map(r => r.label).join() === 'Amber,Green,Purple', JSON.stringify(g.ready));
  check('a ticked colour that is not ready is listed as left out, with why',
    g.waiting.length === 1 && g.waiting[0].label === 'Blue' && /photo/.test(g.waiting[0].why), JSON.stringify(g.waiting));
  check('a colour not ticked for Etsy is not mentioned at all', !JSON.stringify(g).includes('Red'));
  check('the plain item with the same words and no dash is not in the group', !JSON.stringify(g).includes('KA-5'));
  check('an item with no dash is in no group', T.etsyColourGroup('KA-5', all) === null);
  const sent = Object.assign({}, all, { 'KA-2': Object.assign({}, all['KA-2'], { etsyListingId: 77 }) });
  const gs = T.etsyColourGroup('KA-1', sent);
  check('a colour already on Etsy is counted as sent, not offered again',
    gs.sent.length === 1 && gs.sent[0].bc === 'KA-2' && !gs.ready.some(r => r.bc === 'KA-2'));

  const cat = { key: 'kay/crochet', keys: ['kay/crochet', 'kay'], label: 'Crochet' };
  const p = T.etsyGroupPayload(all['KA-1'], 'KA-1', cat, g, all);
  check('the title is the group, never one colour', p.title === 'Tarot card holder', p.title);
  check('one entry per ready colour, each with its own barcode, price and stock',
    JSON.stringify(p.variants) === JSON.stringify([
      { barcode: 'KA-6', label: 'Amber', price: 20, quantity: 1 },
      { barcode: 'KA-2', label: 'Green', price: 18, quantity: 2 },
      { barcode: 'KA-1', label: 'Purple', price: 18, quantity: 2 },
    ]), JSON.stringify(p.variants));
  check('no single price or stock is sent for a colour listing', !('price' in p) && !('quantity' in p));
  check('tags from every colour, no repeats ignoring case', p.tags.join() === 'tarot,crochet,witchy', p.tags.join());
  check('a parcel if any colour is a parcel', p.post === 'parcel');
  check('its own Etsy title wins over the group name',
    T.etsyGroupPayload(Object.assign({}, all['KA-1'], { etsyTitle: 'Crochet tarot pouch' }), 'KA-1', cat, g, all).title === 'Crochet tarot pouch');
  const g2 = T.etsyColourGroup('KA-2', all);
  check('no description of its own borrows a colour\'s', T.etsyGroupPayload(all['KA-2'], 'KA-2', cat, g2, all).description === 'Hand crocheted.');
}

console.log('\nWhat the Etsy service is told after a stock change (v1.64.0)');
{
  const all = {
    'KA-2': { name: 'B', etsy: 1, etsyListingId: 9, counted: 0 },
    'KA-1': { name: 'A', etsy: 1, etsyListingId: 9, counted: 2.7 },
    'KA-3': { name: 'C', etsy: 1, counted: 4 },
    'KA-4': { name: 'D', web: 1, counted: 1 },
    'KA-5': { name: 'E', etsy: 1, etsyListingId: 7, counted: -3 },
    'KA-6': { name: 'F', etsy: 1, etsyListingId: 7 },
  };
  const list = T.etsyStockList(all);
  check('only items that are on Etsy', list.map(x => x.barcode).join() === 'KA-1,KA-2,KA-5,KA-6', JSON.stringify(list));
  check('0 is sent as 0, not left out (that is the sale that matters)', list[1].counted === 0);
  check('never a fraction', list[0].counted === 2);
  check('never a negative, and a missing count is 0', list[2].counted === 0 && list[3].counted === 0);
  check('nothing on Etsy, nothing to send', T.etsyStockList({ a: { counted: 1 } }).length === 0 && T.etsyStockList(null).length === 0);
}

console.log('\nThe checklist on Edit item');
{
  const full = { pics: 4, price: 12, counted: 2, desc: 'Words', post: 'letter', title: 'T', tags: ['a', 'b'], catPath: 'Toys › Plush' };
  const states = (f) => T.etsyChecklist(f).map((r) => r.state).join(',');
  check('everything there is all ticks', states(full) === 'ok,ok,ok,ok,ok,ok,ok', states(full));
  const none = T.etsyChecklist({ catNeeded: 'Category: choose one for Crochet in Settings → Etsy' });
  check('photos, price, stock and category are needed', none.slice(0, 4).every((r) => r.state === 'need'), JSON.stringify(none));
  check('description, postage, title and tags are only tips', none.slice(4).every((r) => r.state === 'tip'));
  check('the category line says where to choose it', /Crochet in Settings/.test(none[3].text));
  check('a category not checked with Etsy yet is neutral, not a cross',
    T.etsyChecklist({ catUnknown: true })[3].state === 'tip');
  check('one or two photos are fine but nudged towards more', /3 to 5/.test(T.etsyChecklist({ pics: 1 })[0].text)
    && !/3 to 5/.test(T.etsyChecklist({ pics: 3 })[0].text));
  check('a title with no tags is still only a tip', T.etsyChecklist(Object.assign({}, full, { tags: [] }))[6].state === 'tip');
  check('no postage says it goes as a parcel', /Small parcel/.test(T.etsyChecklist({})[5].text));
}

console.log('\nUpdate words on Etsy');
{
  const one = T.etsyWordsPayload({ name: 'Spider toy', etsyTitle: ' Crochet spider ', webDesc: 'New words', etsyTags: ['crochet'], etsyListingId: 9 }, 'KA-9', {});
  check('an ordinary item sends its Etsy title, description and tags', one.barcode === 'KA-9' && one.title === 'Crochet spider'
    && one.description === 'New words' && one.tags.join() === 'crochet', JSON.stringify(one));
  check('no Etsy title falls back to the name', T.etsyWordsPayload({ name: 'Spider toy' }, 'KA-9', {}).title === 'Spider toy');
  check('never price, stock or photos', Object.keys(one).sort().join() === 'barcode,description,tags,title');
  const all = {
    'KA-1': { name: 'Tarot holder — Purple', etsyListingId: 77, etsyTags: ['tarot'] },
    'KA-2': { name: 'Tarot holder — Green', etsyListingId: 77, webDesc: 'Green words', etsyTags: ['tarot', 'crochet'] },
    'KA-3': { name: 'Tarot holder — Red', etsyListingId: 88, webDesc: 'Other listing', etsyTags: ['red'] },
  };
  const g = T.etsyWordsPayload(all['KA-1'], 'KA-1', all);
  check('a colour listing takes the group name as its title', g.title === 'Tarot holder', g.title);
  check('and a description from a colour in the SAME listing only', g.description === 'Green words', g.description);
  check('and every colour in it gives its tags, once each', g.tags.join() === 'tarot,crochet', g.tags.join());
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
