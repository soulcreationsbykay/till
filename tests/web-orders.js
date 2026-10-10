// Runs the REAL planWebOrderSale out of index.html (till v1.52.0).
//
//   node tests/web-orders.js index.html
//
// A website order becomes a web sale here, and that sale is what every report,
// payout and spreadsheet reads afterwards. What must hold:
//   - each item is its own line at the price actually paid after offers
//   - postage is its own line, a misc line flagged `postage`, so it is outside
//     items sold and payouts and gets its own total in the report
//   - the lines add up to exactly what SumUp took
//   - nothing personal goes into a sale: no name, no address, no email
//   - an item the shelf no longer has is reported, not silently sold twice
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  // A sale from an order, worked out with no page and no storage';
const END = '  // ---- end website orders plan ----';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0) { console.error('could not locate planWebOrderSale'); process.exit(2); }

// The "sold on the website, still on the shop floor" planner, which must
// leave the checkout's orders alone (v1.52.1): there is no shop floor.
const W_START = '  function planWebSoldAlerts(arrived, opts){';
const W_END = '  // Raised by the till itself';
const wa = HTML.indexOf(W_START), wb = HTML.indexOf(W_END);
if (wa < 0 || wb < 0) { console.error('could not locate planWebSoldAlerts'); process.exit(2); }

// The report's own figures, so a test can check postage lands in its own total.
const Z_START = '  function zFigures(fromStr, toStr, maker){';
const Z_END = '  /* ---- Supplier payouts';
const za = HTML.indexOf(Z_START), zb = HTML.indexOf(Z_END);
if (za < 0 || zb < 0) { console.error('could not locate zFigures'); process.exit(2); }

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
ctx.WEB_SOLD_WINDOW_MS = 24 * 60 * 60 * 1000;
vm.createContext(ctx);
vm.runInContext(HTML.slice(a, b) + HTML.slice(za, zb) + HTML.slice(wa, wb)
  + '\nthis.plan = planWebOrderSale; this.zFigures = zFigures; this.alerts = planWebSoldAlerts;', ctx);

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

let n = 0;
const C = { txn: 'T1', receiptNo: 42, now: '2026-10-10T15:00:00.000Z', id: () => 'L' + (++n) };
const items = {
  'KA-121': { name: 'Bat earrings', maker: 'Kay', price: 3, counted: 1 },
  'KA-127': { name: 'Star earrings', maker: 'Kay', price: 3, counted: 2 },
  'KA-062': { name: 'Chakra drops', maker: 'Kay', price: 10, counted: 0 },
};
const order = {
  ref: 'SC-N78C5MEV', total: 21.4, goods: 15, postage: 6.4, postageKind: 'parcel',
  paidAt: Date.parse('2026-10-10T14:50:00Z'), txCode: 'TAAA6UDQCE3',
  name: 'Test Customer', email: 'test@example.com',
  address: { line1: '1 Test Street', town: 'Burton upon Trent', postcode: 'DE15 9DL' },
  lines: [
    { id: 'KA-121', name: 'Bat earrings', qty: 1, price: 3, net: 2.5 },
    { id: 'KA-127', name: 'Star earrings', qty: 1, price: 3, net: 2.5 },
    { id: 'KA-062', name: 'Chakra drops', qty: 1, price: 10, net: 10 },
  ],
};

console.log('\nAn order becomes a web sale');
const p = ctx.plan(order, items, C);
const goods = p.lines.filter((l) => !l.postage);
const post = p.lines.filter((l) => l.postage);
check('one line per item', goods.length === 3);
check('each at what was paid after the offer', goods[0].net === 2.5 && goods[0].disc === 0.5 && goods[0].price === 3);
check('every line is a web sale on one receipt', p.lines.every((l) => l.pay === 'web' && l.txn === 'T1' && l.receiptNo === 42));
check('dated when it was paid', p.lines[0].at === '2026-10-10T14:50:00.000Z', p.lines[0].at);
check('the order number and SumUp code ride on the first line', p.lines[0].webRef === 'SC-N78C5MEV' && p.lines[0].sumupCode === 'TAAA6UDQCE3');
check('and only the first', p.lines.slice(1).every((l) => l.webRef === null && l.sumupCode === null));
check('the maker comes from the stock list', goods.every((l) => l.maker === 'Kay'));

console.log('\nPostage is its own line');
check('there is exactly one', post.length === 1);
check('named for its size', post[0].name === 'Postage (small parcel)', post[0].name);
check('a misc line, so no stock and no payout', post[0].misc === true && post[0].maker === '' && post[0].barcode === 'POSTAGE');
check('for the postage paid', post[0].net === 6.4);
const sum = Math.round(p.lines.reduce((t, l) => t + l.net, 0) * 100) / 100;
check('the lines add up to exactly what SumUp took', sum === order.total, String(sum));
check('a large letter says so',
  ctx.plan({ ...order, postage: 3.55, postageKind: 'letter' }, items, C).lines.find((l) => l.postage).name === 'Postage (large letter)');
check('free postage adds no line', !ctx.plan({ ...order, postage: 0, postageKind: 'free' }, items, C).lines.some((l) => l.postage));

console.log('\nNothing personal goes into a sale');
const text = JSON.stringify(p.lines);
check('no name, email or address anywhere in it', !/Test Customer|example\.com|Test Street|DE15/.test(text));

console.log('\nThe shelf');
check('an item already sold out on the till is reported', p.short.length === 1 && p.short[0] === 'KA-062', JSON.stringify(p.short));
check('an item gone from the stock list is reported too', ctx.plan({ ...order, lines: [{ id: 'GONE', name: 'Gone', qty: 1, price: 5, net: 5 }] }, items, C).short[0] === 'GONE');

console.log('\nNo "take it off the shop floor" banner');
check("every line is marked as the website checkout's", p.lines.every((l) => l.fromCheckout === true));
const NOW = Date.parse('2026-10-10T15:00:00Z');
const heard = p.lines.map((l) => ({ sale: l, by: 'another-till' }));
check('another till hearing of the sale raises no banner',
  ctx.alerts(heard, { mine: 'this-till', known: {}, now: NOW }).length === 0);
const manual = { ...p.lines[0], fromCheckout: undefined, txn: 'T9' };
check('a web sale rung through by hand still does, as before',
  ctx.alerts([{ sale: manual, by: 'another-till' }], { mine: 'this-till', known: {}, now: NOW }).length === 1);

console.log('\nThe report keeps postage apart');
ctx.sales = p.lines.concat([{ id: 'X', txn: 'T2', barcode: 'MISC', name: 'Reading', price: 20, qty: 1, disc: 0, net: 20,
  pay: 'cash', misc: true, kind: 'sale', at: '2026-10-10T16:00:00.000Z' }]);
const f = ctx.zFigures('2026-10-10', '2026-10-10');
check('postage has its own total', f.postage === 6.4, String(f.postage));
check('and is not counted as miscellaneous', f.misc === 20, String(f.misc));
check('nor as an item sold', f.units === 3, String(f.units));
check('but is in the takings and in website money', f.net === 41.4 && f.pay.web === 21.4, f.net + ' / ' + f.pay.web);

console.log('\nEach website order on one row, goods and postage apart');
check('one row for the order', f.webOrders.length === 1, JSON.stringify(f.webOrders));
const row = f.webOrders[0];
check('named by its order number', row.ref === 'SC-N78C5MEV');
check('goods without postage', row.goods === 15, String(row.goods));
check('postage on its own', row.postage === 6.4, String(row.postage));
check('and the total SumUp took', row.total === 21.4, String(row.total));
check('a cash misc sale is not a website order', f.webOrders.every((o) => o.ref));

// The spreadsheet's own tables, out of the export block.
const T_START = '  function zWebOrdersTable(f){';
const T_END = '  // Every misc amount in the period, oldest first.';
const ta = HTML.indexOf(T_START), tb = HTML.indexOf(T_END);
const S_START = '  function zSummaryTable(f, label){';
const sa = HTML.indexOf(S_START);
if (ta < 0 || tb < 0 || sa < 0) { console.error('could not locate the report tables'); process.exit(2); }
ctx.moneyCell = (n) => ({ v: Number(n) || 0, money: true });
ctx.fmtReceiptNo = (n) => '#' + n;
vm.runInContext(HTML.slice(sa, ta) + HTML.slice(ta, tb) + '\nthis.sum = zSummaryTable; this.wo = zWebOrdersTable;', ctx);
const summary = ctx.sum(f, 'today').rows;
const goodsRow = summary.find((r) => r[0] === 'Goods (without postage)');
const postRow = summary.find((r) => r[0] === 'Postage');
check('the summary sheet has goods without postage', goodsRow && goodsRow[1].v === 35, JSON.stringify(goodsRow));
check('and postage', postRow && postRow[1].v === 6.4);
const wt = ctx.wo(f);
check('the Website orders sheet has goods, postage and total columns',
  wt.cols.map((c) => c.h).join() === 'Date,Time,Order No,Receipt,Goods,Postage,Total');
check('with the order on it', wt.rows[0][2] === 'SC-N78C5MEV' && wt.rows[0][4].v === 15 && wt.rows[0][5].v === 6.4 && wt.rows[0][6].v === 21.4);
check('and a total row', wt.rows[wt.rows.length - 1][0] === 'TOTAL');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
