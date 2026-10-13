// Runs the REAL wording of the Etsy connection out of index.html.
//
//   node tests/etsy-link.js index.html
//
// WHAT THIS PROTECTS. Settings → Etsy → Connection to Etsy is where Kay finds
// out whether the till can see her shop, and what Etsy still needs before a
// listing can go live (shipping and processing profiles). It must never claim
// a connection that is not there, must say "connect again" when the
// connection has expired rather than just "not connected", and a part Etsy did
// not answer must say so instead of looking like "none set up".
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // ETSY LINK: WHAT THE TILL SAYS (v1.58.0)';
const END = '  // ETSY LINK: END OF THE PURE PART';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0 || b < a) { console.error('could not locate the Etsy link block'); process.exit(2); }
const SRC = HTML.slice(a, b);

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(SRC + '\nthis.T = { describeEtsyStatus, etsyDateText };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

const full = {
  connected: true,
  connectedAt: Date.UTC(2026, 9, 13, 12),
  renewBy: Date.UTC(2027, 0, 11, 12),
  shop: { name: 'SoulCreationsByKay', activeListings: 0, onVacation: false },
  shipping: { items: [{ id: 11, title: 'Large letter' }, { id: 12, title: 'Small parcel' }] },
  processing: { items: [{ id: 21, label: '1-3 days', min: 1, max: 3 }] },
  returns: { items: [{ id: 31, returns: true, days: 14 }] },
};

console.log('\nNot connected');
{
  const d = T.describeEtsyStatus({ connected: false });
  check('says not connected', /Not connected yet/.test(d.note) && d.connected === false);
  check('and lists nothing', d.lines.length === 0);
  const ex = T.describeEtsyStatus({ connected: false, expired: true });
  check('an expired connection says connect again', /expired/.test(ex.note) && /connect again/i.test(ex.note));
  check('no answer at all is not a connection', T.describeEtsyStatus(null).connected === false);
}

console.log('\nConnected');
{
  const d = T.describeEtsyStatus(full);
  check('names the shop and the day', /Connected to SoulCreationsByKay since 13 Oct 2026/.test(d.note), d.note);
  check('counts the active listings', d.lines.some(l => /0 active listings/.test(l)));
  check('lists the shipping profiles', d.lines.some(l => l === 'Shipping profiles: Large letter, Small parcel.'));
  check('lists the processing profiles', d.lines.some(l => l === 'Processing profiles: 1-3 days.'));
  check('lists the return policy', d.lines.some(l => /returns within 14 days/.test(l)));
  check('says when to connect again if unused', d.lines.some(l => /before 11 Jan 2027/.test(l)));
  const one = T.describeEtsyStatus({ ...full, shop: { name: 'X', activeListings: 1 } });
  check('one listing, not one listings', one.lines.some(l => /1 active listing\./.test(l)));
  const hol = T.describeEtsyStatus({ ...full, shop: { name: 'X', activeListings: 0, onVacation: true } });
  check('holiday mode is mentioned', hol.lines.some(l => /holiday/.test(l)));
}

console.log('\nWhat Etsy still needs');
{
  const d = T.describeEtsyStatus({ ...full, shipping: { items: [] }, processing: { items: [] } });
  check('no shipping profiles points at plan step e5', d.lines.some(l => /Shipping profiles: none yet.*e5/.test(l)));
  check('no processing profile says Etsy needs one', d.lines.some(l => /Processing profiles: none yet.*needs one/.test(l)));
}

console.log('\nA part Etsy did not answer');
{
  const d = T.describeEtsyStatus({ ...full, shipping: { error: 'HTTP 500' } });
  check('says Etsy did not answer', d.lines.some(l => /Shipping profiles: Etsy did not answer \(HTTP 500\)/.test(l)));
  check('and does not pretend there are none', !d.lines.some(l => /Shipping profiles: none/.test(l)));
  check('the rest still shows', d.lines.some(l => /Processing profiles: 1-3 days/.test(l)));
  const s = T.describeEtsyStatus({ ...full, shop: { error: 'HTTP 503' } });
  check('the shop itself failing still says connected', s.connected === true && s.lines.some(l => /Shop: Etsy did not answer/.test(l)));
  const missing = T.describeEtsyStatus({ ...full, returns: undefined });
  check('a part missing altogether reads as not answered', missing.lines.some(l => /Return policies: Etsy did not answer/.test(l)));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
