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
const SRC = HTML.slice(a, b);

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { ETSY_PHOTO_MAX, etsyPicsOf, etsyPhotoDocId, etsyStatus, applyEtsyChoice, etsyAddPic, etsyRemovePic, etsyMovePic, etsyTodo, cleanEtsyTitle, parseEtsyTags, etsyTagsOf, ETSY_TITLE_MAX, ETSY_TAG_MAX, ETSY_TAG_LEN };', ctx);
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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
