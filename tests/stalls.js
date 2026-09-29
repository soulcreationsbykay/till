// Runs the REAL stall-date helpers out of index.html.
//
//   node tests/stalls.js index.html
//
// WHAT THIS PROTECTS. Kay types her stall dates into the till and the website
// shows them under "Where to find us". Everything she types goes to a public
// page, so the list is rebuilt from five named fields and nothing else, a link
// that is not https:// is dropped (the website draws it as a button), and a
// date that has passed is gone. Two devices editing the list settle on the
// newer one, and a list that arrives from another device must never be sent
// straight back up.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // ---- STALL DATES ----';
const END = '  // ---- END STALL DATES ----';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the stall block'); process.exit(2); }
const SRC = HTML.slice(a, b);

const store = {};
const pushed = [];
let rendered = 0;
const ctx = {
  console,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  },
  Sync: { onLocalStalls: (rec) => pushed.push(rec) },
  renderStalls: () => { rendered++; },
  Date, JSON, Math, String, Number, Array, isNaN,
};
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { normStall, cleanStalls, readStalls, writeStalls, applyRemoteStalls, stallToday };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

const TODAY = '2026-10-01';

console.log('\nWhat a stall is');
{
  const e = T.normStall({ date: '2026-12-05', title: '  Christmas   Craft Fair ', time: '10am – 4pm',
    where: 'Town Hall', link: 'https://example.org/fair', extra: 'nope', id: 'S1' });
  check('the name is tidied', e && e.title === 'Christmas Craft Fair');
  check('the five fields come through', e && e.time === '10am – 4pm' && e.where === 'Town Hall' && e.link === 'https://example.org/fair');
  check('and nothing else does', e && !('extra' in e));
  check('no date, no stall', T.normStall({ title: 'Fair' }) === null);
  check('no name, no stall', T.normStall({ date: '2026-12-05', title: '   ' }) === null);
  check('a date that is not a date is refused', T.normStall({ date: '2026-13-45', title: 'Fair' }) === null);
  check('a link that is not https is dropped',
    !('link' in T.normStall({ date: '2026-12-05', title: 'Fair', link: 'javascript:alert(1)' })));
  check('and so is plain http',
    !('link' in T.normStall({ date: '2026-12-05', title: 'Fair', link: 'http://example.org' })));
  check('a stall without an id is given one', !!T.normStall({ date: '2026-12-05', title: 'Fair' }).id);
}

console.log('\nThe list');
{
  const list = T.cleanStalls([
    { date: '2026-11-20', title: 'B fair' },
    { date: '2026-09-01', title: 'Gone' },
    { date: TODAY, title: 'Today' },
    { date: '2026-11-20', title: 'A fair' },
    { title: 'broken' },
  ], TODAY);
  check('past dates drop off, today stays', list.every((e) => e.date >= TODAY) && list.some((e) => e.title === 'Today'));
  check('in date order, then by name', list.map((e) => e.title).join(',') === 'Today,A fair,B fair');
  check('a broken entry is dropped', list.length === 3);
}

console.log('\nSaving and syncing');
{
  const rec = T.writeStalls([{ date: '2099-01-01', title: 'Fair' }]);
  check('a change here is kept', T.readStalls().events.length === 1 && rec.updatedAt > 0);
  check('and sent to the workspace', pushed.length === 1 && pushed[0].events[0].title === 'Fair');

  T.applyRemoteStalls({ events: [{ date: '2099-02-02', title: 'From the other till' }], updatedAt: rec.updatedAt + 5 });
  check('a change from another device is kept', T.readStalls().events[0].title === 'From the other till');
  check('and is not sent straight back', pushed.length === 1);
  check('and the card is redrawn', rendered === 1);

  T.applyRemoteStalls({ events: [{ date: '2099-03-03', title: '<b>x</b>', link: 'javascript:1' }], updatedAt: rec.updatedAt + 9 });
  const got = T.readStalls().events[0];
  check('what arrives from elsewhere is tidied too', got && !('link' in got));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
