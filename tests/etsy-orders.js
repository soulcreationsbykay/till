// Runs the REAL planEtsyOrderSale and zFigures out of index.html (till v1.65.0).
//
//   node tests/etsy-orders.js index.html
//
// An Etsy order becomes an Etsy sale here, and that sale is what every report
// and spreadsheet reads afterwards. What must hold:
//   - each known item is its own line at what the buyer paid after any coupon
//   - something the till does not know is still takings, with no stock, and
//     is named so Kay hears about it
//   - postage is its own line, flagged `postage`
//   - the lines add up to what the buyer paid for goods and postage
//   - Etsy's fee rides on the first line; unknown stays unknown, never 0
//   - nothing personal goes into a sale
//   - the report shows Etsy takings on their own, and the fees beside them
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
function slice(start, end, what) {
  const a = HTML.indexOf(start), b = HTML.indexOf(end);
  if (a < 0 || b < 0 || b < a) { console.error('could not locate ' + what); process.exit(2); }
  return HTML.slice(a, b);
}
const PLAN = slice('  // ---- etsy orders plan ----', '  // ---- end etsy orders plan ----', 'planEtsyOrderSale');
const Z = slice('  function zFigures(fromStr, toStr, maker){', '  /* ---- Supplier payouts', 'zFigures');

const ctx = {
  console,
  round2: (n) => Math.round((Number(n) || 0) * 100) / 100,
  sales: [],
  lineQty: (s) => (s.qty != null) ? (Number(s.qty) || 0) : 1,
  lineNet: (s) => (s.net != null) ? (Number(s.net) || 0) : (Number(s.price) || 0),
  lineTxn: (s) => s.txn || s.id,
  localDateStr: (d) => d.toISOString().slice(0, 10),
  makerKeyOf: (s) => String(s.maker || '').trim() || '—',
};
vm.createContext(ctx);
vm.runInContext(PLAN + Z + '\nthis.T = { planEtsyOrderSale, zFigures };', ctx);
const T = ctx.T;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

let n = 0;
const C = () => ({ txn: 'T1', receiptNo: 'K-0007', now: '2026-10-20T10:00:00.000Z', id: () => 'L' + (++n) });
const items = {
  'KA-0201': { name: 'Spider hanging', counted: 2, maker: 'Kay' },
  'KA-0502': { name: 'Tarot card holder — Green', counted: 0, maker: 'Kay' },
};
const order = {
  ref: '5001', paidAt: Date.parse('2026-10-20T09:00:00Z'), fee: 1.45, postage: 3.55,
  lines: [
    { barcode: 'KA-0201', name: 'Spider hanging', qty: 1, price: 15, net: 13.5 },
    { barcode: 'KA-0502', name: 'Tarot card holder — Green', qty: 1, price: 20, net: 18 },
    { barcode: null, name: 'Made on Etsy itself', qty: 2, price: 4, net: 7.2 },
  ],
};
const total = (ls) => Math.round(ls.reduce((a, l) => a + l.net, 0) * 100) / 100;

console.log('\nAn Etsy order as a till sale');
{
  const p = T.planEtsyOrderSale(order, items, C());
  const [spider, green, other, post] = p.lines;
  check('a line per thing bought, then postage', p.lines.length === 4 && post.barcode === 'POSTAGE');
  check('every line is an Etsy sale, at the time Etsy says it was paid',
    p.lines.every(l => l.pay === 'etsy' && l.kind === 'sale' && l.staff === 'Etsy' && l.fromEtsy === true && l.at === '2026-10-20T09:00:00.000Z'));
  check('a known item: its own line, its till name, its maker, at what the buyer paid',
    spider.barcode === 'KA-0201' && spider.name === 'Spider hanging' && spider.maker === 'Kay' && spider.net === 13.5 && !spider.misc);
  check('the coupon shows as that line\'s discount', spider.disc === 1.5 && green.disc === 2);
  check('the till had none: still recorded, and named as short', green.barcode === 'KA-0502' && p.short.join() === 'KA-0502');
  check('something the till does not know is takings with no stock, and named',
    other.misc === true && other.barcode === 'ETSY' && /Made on Etsy itself/.test(other.name) && other.net === 7.2 && p.unknown.join() === 'Made on Etsy itself');
  check('postage is its own misc line, flagged', post.misc === true && post.postage === true && post.net === 3.55);
  check('the lines add up to what the buyer paid for goods and postage', total(p.lines) === 42.25, total(p.lines));
  check('order number and fee ride on the first line only',
    p.lines[0].etsyRef === '5001' && p.lines[0].etsyFee === 1.45 && p.lines.slice(1).every(l => l.etsyRef === null && l.etsyFee === null));
  check('no undefined anywhere (Firestore refuses it)', p.lines.every(l => Object.keys(l).every(k => l[k] !== undefined)));
  const json = JSON.stringify(p);
  check('nothing personal: no name, address or email fields', !/address|email|buyer|"customer/.test(json));
  check('a fee Etsy did not give stays unknown, never 0',
    T.planEtsyOrderSale(Object.assign({}, order, { fee: null }), items, C()).lines[0].etsyFee === null);
  check('no postage, no postage line',
    !T.planEtsyOrderSale(Object.assign({}, order, { postage: 0 }), items, C()).lines.some(l => l.postage));
  check('a line of nothing is left out', T.planEtsyOrderSale({ ref: '1', lines: [{ barcode: 'KA-0201', qty: 0, price: 5, net: 0 }] }, items, C()).lines.length === 0);
}

console.log('\nThe report: Etsy takings on their own, fees beside them');
{
  const a = T.planEtsyOrderSale(order, items, C()).lines;
  const b = T.planEtsyOrderSale(Object.assign({}, order, { ref: '5002', fee: null }), items, C()).lines
    .map(l => Object.assign({}, l, { txn: 'T2' }));
  ctx.sales = a.concat(b, [{ id: 'X', txn: 'T3', pay: 'cash', kind: 'sale', qty: 1, price: 10, net: 10, at: '2026-10-20T11:00:00.000Z' }]);
  const f = T.zFigures('2026-10-20', '2026-10-20');
  check('Etsy takings are their own total', f.pay.etsy === 84.5, f.pay.etsy);
  check('and not counted as "other"', f.pay.other === 0 && f.pay.cash === 10);
  check('Etsy postage lands in the postage total', f.postage === 7.1, f.postage);
  check('the known fees are added up', f.etsyFees === 1.45, f.etsyFees);
  check('an order with no fee is counted as not known, not as 0', f.etsyFeesUnknown === 1, f.etsyFeesUnknown);
  ctx.sales = [{ id: 'X', txn: 'T3', pay: 'cash', kind: 'sale', qty: 1, price: 10, net: 10, at: '2026-10-20T11:00:00.000Z' }];
  const g = T.zFigures('2026-10-20', '2026-10-20');
  check('no Etsy sales: nothing Etsy in the figures', g.pay.etsy === 0 && g.etsyFees === 0 && g.etsyFeesUnknown === 0);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
