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
          + slice('  // SOLD ITEMS RECORD (v1.89.0)', '  // SOLD ITEMS RECORD: END')
          + slice('  // PARTS (v1.92.0)', '  // PARTS: END')
          + slice('  // COMPLAINTS (v1.90.0)', '  // COMPLAINTS: END');

const ctx = { console, Date };
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { planSoldClearout, soldRecordHtml, SOLD_CLEAR_DAYS, newComplaint, allComplaints, complaintsTable, traceItems, partsOf, partsNoteOf, partsColumns, usualSupplier, normParts, batchesFor, boughtFor };', ctx);
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

console.log('\nSafety complaints');
{
  const items = {
    'KA-050': { name: 'Clasp went green', counted: 0, complaints: [{ date: '2026-07-01', what: 'Clasp went green' }] },
    'KA-051': { name: 'Fine', counted: 0 },
    'KA-052': { name: 'Two', counted: 1, complaints: [{ date: '2026-09-02', what: 'Loose bead', done: 'Refunded' }, { date: '2026-05-01', what: 'Thread snapped' }] },
  };
  const p = T.planSoldClearout(items, [sale('KA-050', 90), sale('KA-051', 90)], { now: NOW });
  check('an item with a complaint is never cleared out', p.kept.some(k => k.bc === 'KA-050' && k.why === 'has a complaint logged'));
  check('one without is', p.ready.some(r => r.bc === 'KA-051'));
  const all = T.allComplaints(items);
  check('every complaint is in the log, newest first',
    all.map(c => c.date).join() === '2026-09-02,2026-07-01,2026-05-01', all.map(c => c.date).join());
  check('each carries its code, item and what was done',
    all[0].bc === 'KA-052' && all[0].name === 'Two' && all[0].done === 'Refunded');
  const t = T.complaintsTable(all);
  check('the export has a column for each part', t.cols.map(c => c.h).join('|') === 'Date|Code|Item|What went wrong|What was done');
  check('dates read the UK way', t.rows[0][0] === '02/09/2026', t.rows[0][0]);
  const c = T.newComplaint({ date: '2026-10-20', what: '  Bead fell off ', done: ' ' }, NOW);
  check('a new complaint keeps its date and words', c.date === '2026-10-20' && c.what === 'Bead fell off');
  check('nothing done yet leaves no field', !('done' in c));
  check('no words, no complaint', T.newComplaint({ what: '  ' }, NOW) === null);
  check('a bad date becomes today', T.newComplaint({ date: 'soon', what: 'x' }, NOW).date === '2026-10-28');
}

console.log('\nTrace a part or batch');
{
  const items = {
    'KA-060': { name: 'Spinner', materials: '100% acrylic yarn', batch: 'Yarn lot 4821', counted: 2 },
    'KA-061': { name: 'Keyring', materials: 'Glass beads, Alloy clasp', batch: 'clasps order 48213', boughtFrom: 'Beads Direct', counted: 0 },
    'KA-062': { name: 'Brooch', materials: 'Mixed fibres', counted: 1 },
  };
  check('a batch number finds its item, any capitals', T.traceItems(items, 'LOT 4821').map(h => h.bc).join() === 'KA-060');
  check('a part finds its item', T.traceItems(items, 'alloy clasp').map(h => h.bc).join() === 'KA-061');
  check('a number in either box is found', T.traceItems(items, '482').map(h => h.bc).join() === 'KA-060,KA-061');
  check('sold out items are found too, with what is left', T.traceItems(items, 'clasp')[0].left === 0);
  check('one letter finds nothing yet', T.traceItems(items, 'a').length === 0);
  check('nothing matching, nothing found', T.traceItems(items, 'cotton').length === 0);
  check('a supplier finds what was made from its parts', T.traceItems(items, 'beads direct').map(h => h.bc).join() === 'KA-061');
  check('and says what matched', T.traceItems(items, 'beads direct')[0].lines.join() === 'Batch numbers: clasps order 48213; Bought from: Beads Direct',
    T.traceItems(items, 'beads direct')[0].lines.join());
  const lined = {
    'KA-070': { name: 'Keyring', counted: 0, parts: [{ part: 'Glass beads', from: 'Beads Direct', batch: 'Order 48213' }, { part: 'Alloy clasp', from: 'Clasp Co', batch: 'Order 50112' }] },
    'KA-071': { name: 'Spinner', counted: 3, parts: [{ part: '100% acrylic yarn', from: 'Wool Warehouse', batch: 'Lot 4821' }] },
  };
  const t = T.traceItems(lined, '48213');
  check('a batch finds only the line it is on', t.length === 1 && t[0].lines.join() === 'Glass beads · Beads Direct · Order 48213', JSON.stringify(t));
  check('a supplier finds every item with a part from them', T.traceItems(lined, 'wool warehouse').map(h => h.bc).join() === 'KA-071');
}

console.log('\nParts lines (v1.92.0)');
{
  const lined = { name: 'Keyring', parts: [
    { part: 'Glass beads', from: 'Beads Direct', batch: 'Order 48213' },
    { part: 'Alloy clasp', from: '', batch: 'Order 50112' },
    { part: ' ', from: ' ', batch: ' ' } ] };
  const c = T.partsColumns(lined);
  check('Materials is the plain list of parts, for the label', c.materials === 'Glass beads, Alloy clasp', c.materials);
  check('each batch says which part it is', c.batch === 'Glass beads: Order 48213; Alloy clasp: Order 50112', c.batch);
  check('each supplier says which part it is', c.from === 'Glass beads: Beads Direct', c.from);
  check('empty lines are dropped', T.partsOf(lined).length === 2);
  const old = { materials: 'Mixed fibres, Alloy clasp', batch: 'lot 4821', boughtFrom: 'Wool Warehouse' };
  check('an item from v1.90 reads as one line per part', JSON.stringify(T.partsOf(old).map(r => r.part)) === '["Mixed fibres","Alloy clasp"]');
  check('its batch and supplier wording are kept as a note', T.partsNoteOf(old) === 'Batch numbers: lot 4821; Bought from: Wool Warehouse', T.partsNoteOf(old));
  const oc = T.partsColumns(old);
  check('and its export columns are exactly what they were', oc.materials === 'Mixed fibres, Alloy clasp' && oc.batch === 'lot 4821' && oc.from === 'Wool Warehouse');
  const moved = { parts: [{ part: 'Mixed fibres' }], partsNote: 'Bought from: Wool Warehouse' };
  check('once saved, a note left over still reaches the export', T.partsColumns(moved).batch === 'Note: Bought from: Wool Warehouse', T.partsColumns(moved).batch);
  const items = {
    'A': { addedAt: '2026-01-01', parts: [{ part: 'Glass beads', from: 'Old Bead Shop' }] },
    'B': { addedAt: '2026-09-01', parts: [{ part: 'glass beads', from: 'Beads Direct' }] },
    'C': { addedAt: '2026-10-01', parts: [{ part: 'Glass beads', from: '' }] },
  };
  check('the usual supplier is the latest one used for that part, any capitals', T.usualSupplier(items, 'Glass Beads') === 'Beads Direct');
  check('a part never bought before has no usual supplier', T.usualSupplier(items, 'Felt') === '');
  const lots = {
    'A': { addedAt: '2026-08-01', parts: [{ part: '100% acrylic yarn', from: 'Wool Warehouse', batch: 'Lot 4000' }] },
    'B': { addedAt: '2026-10-01', parts: [{ part: '100% acrylic yarn', from: 'Wool Warehouse', batch: 'Lot 4821' }] },
    'C': { addedAt: '2026-10-05', parts: [{ part: '100% Acrylic Yarn', from: 'Wool Warehouse', batch: 'lot 4821' }] },
    'D': { addedAt: '2026-10-10', parts: [{ part: '100% acrylic yarn', from: 'Hobbycraft', batch: 'HC-9' }] },
    'E': { addedAt: '2026-10-12', parts: [{ part: 'Glass beads', from: 'Wool Warehouse', batch: 'Order 7' }] },
  };
  check('batches for a part from a supplier, newest first, once each',
    T.batchesFor(lots, '100% acrylic yarn', 'Wool Warehouse').join('|') === 'lot 4821|Lot 4000',
    T.batchesFor(lots, '100% acrylic yarn', 'Wool Warehouse').join('|'));
  check('with no supplier given, every batch of that part', T.batchesFor(lots, '100% acrylic yarn', '').join('|') === 'HC-9|lot 4821|Lot 4000');
  check('another part\'s batches are never offered', T.batchesFor(lots, '100% acrylic yarn', 'Wool Warehouse').indexOf('Order 7') < 0);
  check('a new part has none yet', T.batchesFor(lots, 'Felt', '').length === 0);
}

console.log('\nPurchase dates (v1.95.0)');
{
  const it = { name: 'Keyring', parts: [
    { part: 'Glass beads', from: 'Beads Direct', batch: 'Order 48213', bought: '2026-09-14' },
    { part: 'Alloy clasp', from: 'Clasp Co', batch: '', bought: 'last week' },
    { part: '', from: '', batch: '', bought: '2026-10-01' } ] };
  const p = T.normParts(it.parts);
  check('a purchase date is kept on its line', p[0].bought === '2026-09-14');
  check('words that are not a date are dropped', !('bought' in p[1]), JSON.stringify(p[1]));
  check('a line with only a date is kept', p.length === 3);
  check('a line with no date has no field, so older lines are stored as before',
    JSON.stringify(T.normParts([{ part: 'Felt', from: 'X', batch: '1' }])) === '[{"part":"Felt","from":"X","batch":"1"}]');
  const c = T.partsColumns(it);
  check('the Bought On column says which part, the UK way', c.bought === 'Glass beads: 14/09/2026; 01/10/2026', c.bought);
  check('an item from v1.90 has an empty Bought On', T.partsColumns({ materials: 'Felt' }).bought === '');
  const items = {
    'A': { addedAt: '2026-09-01', parts: [{ part: '100% acrylic yarn', from: 'Wool Warehouse', batch: 'Lot 4821', bought: '2026-08-28' }] },
    'B': { addedAt: '2026-10-01', parts: [{ part: '100% Acrylic Yarn', from: 'Wool Warehouse', batch: 'lot 4821' }] },
    'C': { addedAt: '2026-10-05', parts: [{ part: '100% acrylic yarn', from: 'Wool Warehouse', batch: 'Lot 5000', bought: '2026-10-03' }] },
  };
  check('a batch bought before fills in its date, any capitals', T.boughtFor(items, '100% acrylic yarn', 'wool warehouse', 'LOT 4821') === '2026-08-28');
  check('each batch keeps its own date', T.boughtFor(items, '100% acrylic yarn', 'Wool Warehouse', 'Lot 5000') === '2026-10-03');
  check('from another supplier, no date', T.boughtFor(items, '100% acrylic yarn', 'Hobbycraft', 'Lot 4821') === '');
  check('no batch, no date', T.boughtFor(items, '100% acrylic yarn', 'Wool Warehouse', '') === '');
  const t = T.traceItems({ 'KA-1': { name: 'K', counted: 1, parts: it.parts } }, '14/09/2026');
  check('a purchase date finds its item and shows on the line',
    t.length === 1 && t[0].lines.join() === 'Glass beads · Beads Direct · Order 48213 · bought 14/09/2026', JSON.stringify(t));
  check('the sold items record has a Bought on column',
    T.soldRecordHtml([{ bc: 'KA-1', it: it, lines: [] }], NOW).indexOf('<td>Order 48213</td><td>14/09/2026</td>') > -1);
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
      it: { name: 'Star <Brooch>', price: 10, folder: 'Kay/Brooches', label: 'Small tag', materials: 'Mixed fibres yarn, alloy clasp', batch: 'lot 4821', boughtFrom: 'Wool Warehouse', webDesc: 'Line one\nLine two' },
      lines: [{ at: '2026-08-01T10:00:00Z', kind: 'sale', qty: 1, net: 9.5, pay: 'card', receiptNo: 'R-12' }] },
    { bc: 'KA-040', photo: 'javascript:alert(1)', it: { name: 'No pic' }, lines: [] },
  ], Date.parse('2026-10-28T12:00:00Z'));
  check('it is a whole page', /^<!doctype html>/.test(html) && /<\/html>$/.test(html));
  check('it says how many items', html.indexOf('2 items') > -1);
  check('the photo is in the file itself', html.indexOf('src="data:image/jpeg;base64,AAAA"') > -1);
  check('the name is escaped', html.indexOf('Star &lt;Brooch&gt;') > -1 && html.indexOf('<Brooch>') < 0);
  check('code, price, folder and label are there',
    ['KA-037', '£10.00', 'Kay/Brooches', 'Small tag'].every(s => html.indexOf(s) > -1));
  check('who the parts came from is there', html.indexOf('Bought from') > -1 && html.indexOf('Wool Warehouse') > -1);
  check('the parts lines are a table of their own',
    T.soldRecordHtml([{ bc: 'KA-070', it: { name: 'K', parts: [{ part: 'Glass beads', from: 'Beads Direct', batch: 'Order 48213' }] }, lines: [] }], NOW)
      .indexOf('<td>Glass beads</td><td>Beads Direct</td><td>Order 48213</td><td></td>') > -1);
  check('the batch numbers are there', html.indexOf('Batch numbers') > -1 && html.indexOf('lot 4821') > -1);
  check('the materials are there', html.indexOf('Materials') > -1 && html.indexOf('Mixed fibres yarn, alloy clasp') > -1);
  check('the description is kept', html.indexOf('Line one\nLine two') > -1);
  check('each sale is listed with amount, payment and receipt',
    ['£9.50', 'Card', 'R-12'].every(s => html.indexOf(s) > -1));
  check('a bad photo address is never put in the page', html.indexOf('javascript:') < 0 && html.indexOf('No photo') > -1);
  check('it says to keep it six years, to the date', html.indexOf('2032') > -1);
  check('it links to nothing outside itself', !/<(script|link)\b/i.test(html));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
