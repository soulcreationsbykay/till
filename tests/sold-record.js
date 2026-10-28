// Runs the REAL sold items record rules out of index.html.
//
//   node tests/sold-record.js index.html
//
// WHAT THIS PROTECTS. Settings -> Sold items record writes sold-out items into
// a file and then removes them from the till for good. Removing the wrong item
// is the failure that matters: something still on the shelf, still offered on
// Etsy or the website, part of a set, sold only last week, or an Etsy item
// whose photos could not be put in the file. And the file has to carry what
// identifies a piece six years on: its photo, code, name and every sale.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
function slice(start, end){
  const a = HTML.indexOf(start), b = HTML.indexOf(end);
  if (a < 0 || b < 0 || b < a) { console.error('could not locate ' + start.trim()); process.exit(2); }
  return HTML.slice(a, b);
}
const SRC = slice('  // WHERE AN ITEM SELLS (v1.56.0)', '  // WHERE AN ITEM SELLS: END')
          + slice('  // SOLD ITEMS RECORD (v1.89.0)', '  // SOLD ITEMS RECORD: END');

const ctx = { console, Date };
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { planSoldClearout, soldRecordHtml, SOLD_CLEAR_DAYS };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

const NOW = Date.parse('2026-10-28T12:00:00Z');
const ago = d => new Date(NOW - d * 864e5).toISOString();
const sale = (bc, d, extra) => Object.assign({ barcode: bc, kind: 'sale', qty: 1, net: 10, pay: 'cash', at: ago(d) }, extra || {});

console.log('\nWhich items are ready to go');
{
  const items = {
    'KA-001': { name: 'Old brooch', counted: 0, price: 10 },
    'KA-002': { name: 'Recent brooch', counted: 0 },
    'KA-003': { name: 'Still in stock', counted: 2 },
    'KA-004': { name: 'Never sold', counted: 0 },
    'KA-005': { name: 'Set member', counted: 0 },
    'KA-006': { name: 'Own set', counted: 0, set: { with: ['KA-007'] } },
    'KA-007': { name: 'Still online', counted: 0, web: 1, webQty: 1 },
    'KA-008': { name: 'Sold out online', counted: 0, web: 1, webQty: 0 },
    'KA-009': { name: 'Refunded lately', counted: 0 },
  };
  const sales = [
    sale('KA-001', 60), sale('KA-002', 5), sale('KA-003', 90), sale('KA-005', 60),
    sale('KA-006', 60), sale('KA-007', 60), sale('KA-008', 60),
    sale('KA-009', 90, { qty: 2 }), sale('KA-009', 3, { kind: 'refund', qty: -1 }),
    { barcode: 'KA-001', misc: true, kind: 'sale', qty: 1, at: ago(1) },   // misc lines never count
  ];
  const p = T.planSoldClearout(items, sales, { now: NOW, inSet: { 'KA-005': 1 } });
  const ready = p.ready.map(r => r.bc).join(',');
  const why = {}; p.kept.forEach(k => { why[k.bc] = k.why; });
  check('an item sold out for over a month is ready', ready.indexOf('KA-001') > -1);
  check('one sold out on the website too is ready', ready.indexOf('KA-008') > -1);
  check('only those two are ready', ready === 'KA-001,KA-008', ready);
  check('a sale in the last 30 days keeps it', /last 30 days/.test(why['KA-002'] || ''));
  check('a recent refund keeps it, even after an old sale', /last 30 days/.test(why['KA-009'] || ''));
  check('something still on the shelf is not listed at all', !why['KA-003'] && ready.indexOf('KA-003') < 0);
  check('something never sold is not listed at all', !why['KA-004'] && ready.indexOf('KA-004') < 0);
  check('a member of a set is kept', why['KA-005'] === 'part of a set');
  check('an item carrying its own set is kept', why['KA-006'] === 'part of a set');
  check('one still offered on the website is kept', why['KA-007'] === 'still on the website');
  check('the misc line did not make KA-001 recent', ready.indexOf('KA-001') > -1);
  check('a ready item carries every sale of it, oldest first',
    p.ready[0].lines.length === 1 && p.ready[0].lastAt === ago(60));
  check('the default wait is 30 days', T.SOLD_CLEAR_DAYS === 30);
}

console.log('\nEtsy items');
{
  const items = {
    'E-1': { name: 'Live', counted: 0, etsy: 1, etsyListingId: 111 },
    'E-2': { name: 'Draft', counted: 0, etsy: 1, etsyListingId: 222 },
    'E-3': { name: 'Not checked', counted: 0, etsy: 1, etsyListingId: 333 },
    'E-4': { name: 'Sold out on Etsy', counted: 0, etsy: 1, etsyListingId: 444, etsyPics: ['f1', 'f2'] },
    'E-5': { name: 'Never sent', counted: 0, etsy: 1 },
  };
  const sales = Object.keys(items).map(bc => sale(bc, 60, { pay: 'etsy' }));
  const states = { '111': 'active', '222': 'draft', '444': 'sold_out' };
  const on = T.planSoldClearout(items, sales, { now: NOW, etsyStates: states, syncOn: true });
  const why = {}; on.kept.forEach(k => { why[k.bc] = k.why; });
  check('a live listing is kept', why['E-1'] === 'still on Etsy');
  check('a draft is kept', why['E-2'] === 'still on Etsy');
  check('a listing Etsy has not been asked about is kept', why['E-3'] === 'on Etsy, not checked yet');
  check('sold out on Etsy, with Team sync on, is ready', on.ready.some(r => r.bc === 'E-4'));
  check('kept for Etsy but never sent is ready', on.ready.some(r => r.bc === 'E-5'));
  const off = T.planSoldClearout(items, sales, { now: NOW, etsyStates: states, syncOn: false });
  check('with Team sync off, one with Etsy photos is kept', off.kept.some(k => k.bc === 'E-4' && /Team sync/.test(k.why)));
  check('with Team sync off, one with no Etsy photos is still ready', off.ready.some(r => r.bc === 'E-5'));
}

console.log('\nNothing to do');
{
  check('no items, no crash', T.planSoldClearout({}, [], { now: NOW }).ready.length === 0);
  check('missing arguments, no crash', T.planSoldClearout(undefined, undefined).ready.length === 0);
}

console.log('\nThe file');
{
  const html = T.soldRecordHtml([
    { bc: 'KA-037', photo: 'data:image/jpeg;base64,AAAA',
      it: { name: 'Star <Brooch>', price: 10, folder: 'Kay/Brooches', label: 'Small tag', webDesc: 'Line one\nLine two' },
      lines: [{ at: '2026-08-01T10:00:00Z', kind: 'sale', qty: 1, net: 9.5, pay: 'card', receiptNo: 'R-12' }] },
    { bc: 'KA-040', photo: 'javascript:alert(1)', it: { name: 'No pic' }, lines: [] },
  ], Date.parse('2026-10-28T12:00:00Z'));
  check('it is a whole page', /^<!doctype html>/.test(html) && /<\/html>$/.test(html));
  check('it says how many items', html.indexOf('2 items') > -1);
  check('the photo is in the file itself', html.indexOf('src="data:image/jpeg;base64,AAAA"') > -1);
  check('the name is escaped', html.indexOf('Star &lt;Brooch&gt;') > -1 && html.indexOf('<Brooch>') < 0);
  check('code, price, folder and label are there',
    ['KA-037', '£10.00', 'Kay/Brooches', 'Small tag'].every(s => html.indexOf(s) > -1));
  check('the description is kept', html.indexOf('Line one\nLine two') > -1);
  check('each sale is listed with amount, payment and receipt',
    ['£9.50', 'Card', 'R-12'].every(s => html.indexOf(s) > -1));
  check('a bad photo address is never put in the page', html.indexOf('javascript:') < 0 && html.indexOf('No photo') > -1);
  check('it says to keep it six years, to the date', html.indexOf('2032') > -1);
  check('it links to nothing outside itself', !/<(script|link)\b/i.test(html));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
