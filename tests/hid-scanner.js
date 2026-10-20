// Runs the REAL Bluetooth scanner reader out of index.html.
//
//   node tests/hid-scanner.js index.html
//
// WHAT THIS PROTECTS. A scanner paired in HID mode types the code fast and
// presses Enter. The till has to take that as a scan from any screen, and must
// not take somebody pressing keys by hand as one.
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // HID SCAN READER';
const END = '  // END HID SCAN READER';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the scan reader block'); process.exit(2); }
const SRC = HTML.slice(a, b);

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { makeScanReader };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

// Feeds keys with the given gap (ms) between them; returns codes read and the
// last key's "used up" answer.
function feed(keys, gap, start) {
  const got = [];
  const key = T.makeScanReader(c => got.push(c));
  let t = start || 1000, used = false;
  for (const k of keys) { used = key(k, t); t += gap; }
  return { got, used };
}
const chars = s => s.split('');

console.log('\nA scanner');
{
  let r = feed([...chars('KA-001'), 'Enter'], 10);
  check('a fast run ending in Enter is a scan', r.got.length === 1 && r.got[0] === 'KA-001', JSON.stringify(r.got));
  check('and the Enter is used up', r.used === true);
  r = feed([...chars('KA-001'), 'Tab'], 10);
  check('Tab ends a scan too', r.got[0] === 'KA-001');
  r = feed(['Shift', 'K', 'Shift', 'A', '-', '0', '0', '1', 'Enter'], 10);
  check('Shift between capitals does not break it', r.got[0] === 'KA-001', JSON.stringify(r.got));
  r = feed([...chars('KA-001'), 'Enter'], 70);
  check('a slower Bluetooth scanner still counts', r.got[0] === 'KA-001');
}

console.log('\nNot a scanner');
{
  let r = feed([...chars('KA-001'), 'Enter'], 200);
  check('typing by hand is left alone', r.got.length === 0);
  check('and its Enter is not swallowed', r.used === false);
  r = feed(['Enter'], 10);
  check('Enter on its own does nothing', r.got.length === 0 && r.used === false);
  r = feed([...chars('ab'), 'Enter'], 10);
  check('two keys are too short to be a code', r.got.length === 0);
}

console.log('\nTwo scans in a row');
{
  const got = [];
  const key = T.makeScanReader(c => got.push(c));
  let t = 1000;
  for (const k of [...chars('KA-001'), 'Enter']) { key(k, t); t += 10; }
  t += 1500;
  for (const k of [...chars('KA-002'), 'Enter']) { key(k, t); t += 10; }
  check('each is read on its own', got.join(',') === 'KA-001,KA-002', got.join(','));
  // A stray key long before a scan must not end up in front of the code.
  const got2 = [];
  const key2 = T.makeScanReader(c => got2.push(c));
  key2('x', 0);
  t = 5000;
  for (const k of [...chars('KA-003'), 'Enter']) { key2(k, t); t += 10; }
  check('a stray key earlier is dropped', got2[0] === 'KA-003', got2.join(','));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
