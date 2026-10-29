// Runs the REAL Materials book rules out of index.html (v1.97.0). Same trick
// as the others: slice the shipped PARTS block out by its comment markers and
// run it in a vm, so what is tested is what ships.
//
//   node tests/materials.js index.html
//
// WHAT THIS PROTECTS. The book is on trial: it has to be possible to switch it
// off and lose nothing. So a part line filled in from the book must still carry
// its own words, a line that never saw the book must read exactly as before,
// codes must never be reused, and a link can only ever be a plain https://
// address.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // PARTS (v1.92.0)';
const END = '  // COMPLAINTS: END';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the parts block'); process.exit(2); }

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(HTML.slice(a, b) + '\nthis.T = { normParts, partsOf, partsColumns, nextLotCode, docsLink, cleanLot, mergeLots, lotLine, lotTitle, lotUsedIn, traceItems };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}
const J = (v) => JSON.stringify(v);

console.log('\nCodes');
check('an empty book starts at M-001', T.nextLotCode([]) === 'M-001');
check('the next code follows the highest, deleted ones included',
  T.nextLotCode([{ code: 'M-002' }, { code: 'M-009', deleted: true }, { code: 'junk' }]) === 'M-010');

console.log('\nLinks');
check('a Drive link is kept', T.docsLink(' https://drive.google.com/drive/folders/abc ') === 'https://drive.google.com/drive/folders/abc');
check('http:// is refused', T.docsLink('http://example.com') === '');
check('javascript: is refused', T.docsLink('javascript:alert(1)') === '');
check('a quote cannot break out of the link', T.docsLink('https://x.com/"onmouseover=') === '');

console.log('\nA purchase from the form');
const lot = T.cleanLot({ id: 'Labc123', code: 'M-001', part: '  Glass  beads ', from: 'Bead Shop', batch: '4821',
  bought: '2026-10-20', docs: 'https://drive.google.com/x', note: '' }, 5);
check('words are tidied and the empty note left off', J(lot) === J({ id: 'Labc123', code: 'M-001', part: 'Glass beads', from: 'Bead Shop',
  batch: '4821', updatedAt: 5, bought: '2026-10-20', docs: 'https://drive.google.com/x' }), J(lot));
let threw = '';
try { T.cleanLot({ id: 'Labc123', code: 'M-001', part: '' }, 1); } catch (e) { threw = e.message; }
check('no part is refused with a message', /part/.test(threw), threw);
threw = '';
try { T.cleanLot({ id: 'Labc123', code: 'M-001', part: 'Clasp', docs: 'http://drive.google.com/x' }, 1); } catch (e) { threw = e.message; }
check('an http:// link is refused with a message', /https/.test(threw), threw);
const pc = T.cleanLot({ id: 'Labc123', code: 'M-001', part: 'Clasp', docs: ' C:\\Users\\Kay\\Safety papers\\M-001 ' }, 1);
check('a computer folder is kept as words, never as a link', !('docs' in pc) && pc.papersAt === 'C:\\Users\\Kay\\Safety papers\\M-001', JSON.stringify(pc));

console.log('\nTwo tills');
const m = T.mergeLots([{ id: 'L1', code: 'M-001', part: 'old', updatedAt: 1 }], [{ id: 'L1', code: 'M-001', part: 'new', updatedAt: 2 }, { id: 'L2', code: 'M-002', part: 'x', updatedAt: 1 }]);
check('the later change wins, newest code first', m.changed && m.list.map(l => l.part).join() === 'x,new');
check('an older copy changes nothing', !T.mergeLots(m.list, [{ id: 'L1', code: 'M-001', part: 'older', updatedAt: 1 }]).changed);

console.log('\nPart lines');
const line = T.lotLine(lot);
check('a line from the book carries its own words and the link', J(line) === J({ part: 'Glass beads', from: 'Bead Shop', batch: '4821', lot: 'Labc123', bought: '2026-10-20' }), J(line));
check('the link survives normParts', T.normParts([line])[0].lot === 'Labc123');
check('a line that never saw the book reads exactly as before',
  J(T.normParts([{ part: 'Clasp', from: 'A', batch: '' }])) === J([{ part: 'Clasp', from: 'A', batch: '' }]));
check('a bad lot id is dropped', !('lot' in T.normParts([{ part: 'Clasp', lot: '<b>' }])[0]));
const items = { KA1: { name: 'Bracelet', counted: 2, parts: [line, { part: 'Elastic', from: '', batch: '' }] }, KA2: { name: 'Ring', parts: [] } };
check('the export columns do not change with the book', T.partsColumns(items.KA1).materials === 'Glass beads, Elastic'
  && T.partsColumns(items.KA1).batch === 'Glass beads: 4821');
check('lotUsedIn finds the items made from it', J(T.lotUsedIn(items, 'Labc123')) === J(['KA1']));
check('the title reads in order', T.lotTitle(lot) === 'M-001 · Glass beads · Bead Shop · 4821 · 20/10/2026', T.lotTitle(lot));

console.log('\nTrace');
const codeOf = (id) => id === 'Labc123' ? 'M-001' : '';
const hits = T.traceItems(items, 'm-001', codeOf);
check('the code finds the item', hits.length === 1 && hits[0].bc === 'KA1' && /^M-001 · Glass beads/.test(hits[0].lines[0]), J(hits));
check('without the book the trace works as before', T.traceItems(items, 'bead shop').length === 1 && T.traceItems(items, 'm-001').length === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
