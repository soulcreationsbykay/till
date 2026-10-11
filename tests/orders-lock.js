// Runs the REAL makeOrdersLock out of index.html (till v1.54.0).
//
//   node tests/orders-lock.js index.html
//
// The orders password hides customers' names and addresses in the Website
// orders panel. What must hold:
//   - with no password set, nothing is hidden (as before v1.54.0)
//   - once set, they are hidden until the right password is typed
//   - they hide again after 5 minutes, or on Lock now
//   - five wrong tries make it wait a minute, even for the right password
//   - the password itself is never stored, only a salted hash
//   - removing it shows everything again
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // ---- orders lock ----';
const END = '  // ---- end orders lock ----';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0) { console.error('could not locate makeOrdersLock'); process.exit(2); }

const ctx = { crypto: globalThis.crypto, TextEncoder, Uint8Array, JSON, Math, String, Array, parseInt, Error };
vm.createContext(ctx);
vm.runInContext(HTML.slice(a, b) + '\nthis.makeOrdersLock = makeOrdersLock;', ctx);

let failed = 0;
function check(name, ok) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name);
  if (!ok) failed++;
}

(async () => {
  const mem = {};
  const store = { get: (k) => (k in mem ? mem[k] : null), set: (k, v) => { mem[k] = v; }, remove: (k) => { delete mem[k]; } };
  let t = 1000000;
  const lock = ctx.makeOrdersLock(store, () => t);

  check('no password: nothing hidden', !lock.isSet() && lock.isOpen());

  let threw = false;
  try { await lock.setPassword('abc'); } catch (e) { threw = true; }
  check('a password under 6 characters is refused', threw && !lock.isSet());

  await lock.setPassword('rose-quartz');
  check('password set: hidden', lock.isSet() && !lock.isOpen());
  check('the password itself is not stored', !mem.posWebOrdersLock.includes('rose-quartz'));
  const savedOnce = JSON.parse(mem.posWebOrdersLock);
  check('a salt and a hash are stored', /^[0-9a-f]{32}$/.test(savedOnce.salt) && /^[0-9a-f]{64}$/.test(savedOnce.hash));

  check('wrong password stays hidden', (await lock.unlock('amethyst')) === 'wrong' && !lock.isOpen());
  check('empty password stays hidden', (await lock.unlock('')) === 'wrong' && !lock.isOpen());
  check('right password shows them', (await lock.unlock('rose-quartz')) === 'ok' && lock.isOpen());

  t += 4 * 60 * 1000;
  check('still shown after 4 minutes', lock.isOpen());
  t += 61 * 1000;
  check('hidden again after 5 minutes', !lock.isOpen());

  await lock.unlock('rose-quartz');
  lock.lock();
  check('Lock now hides them', !lock.isOpen());

  for (let i = 0; i < 4; i++) await lock.unlock('nope');
  check('fifth wrong try makes it wait', (await lock.unlock('nope')) === 'wait' && lock.waitSeconds() === 60);
  check('while waiting, even the right one is refused', (await lock.unlock('rose-quartz')) === 'wait' && !lock.isOpen());
  t += 61 * 1000;
  check('after the wait, the right one works', (await lock.unlock('rose-quartz')) === 'ok');

  await lock.setPassword('rose-quartz');
  check('the same password gets a fresh salt', JSON.parse(mem.posWebOrdersLock).salt !== savedOnce.salt);
  check('setting a password hides them again', !lock.isOpen());

  const again = ctx.makeOrdersLock(store, () => t);
  check('a reload starts hidden', again.isSet() && !again.isOpen());
  check('a reload still knows the password', await again.matches('rose-quartz'));

  store.set('posWebOrdersLock', '{not json');
  check('a damaged setting counts as no password', !again.isSet() && again.isOpen());
  await again.setPassword('rose-quartz');

  again.clear();
  check('removing it shows everything', !again.isSet() && again.isOpen() && !('posWebOrdersLock' in mem));

  if (failed) { console.log(failed + ' failed'); process.exit(1); }
  console.log('all passed');
})();
