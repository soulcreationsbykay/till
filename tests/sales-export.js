// Runs the REAL sales export out of index.html. Same trick as the others:
// slice the shipped source out by its comment markers and run it in a vm, so
// what is tested is what ships rather than a copy that can drift.
//
// Two things are being checked here, and they are different in kind:
//   1. The CSV has not changed. The shop has been handing these files to an
//      accountant for months, so byte-for-byte against the old code matters
//      more than any opinion about how it ought to look. The old code is
//      reproduced at the bottom of this file as the reference.
//   2. The .xlsx is really a .xlsx. It is written here by hand, so the parts
//      have to agree with each other - every part the workbook claims exists,
//      every CRC in the ZIP correct - or Excel will refuse the file outright
//      rather than open it with something missing.
const fs = require('fs');
const vm = require('vm');
const zlib = require('zlib');

const HTML = fs.readFileSync(process.argv[2], 'utf8');
const START = '  /* ===================== Spreadsheet export =====================';
const END = '  /* =================== end spreadsheet export =================== */';
const a = HTML.indexOf(START), b = HTML.indexOf(END);
if (a < 0 || b < 0) { console.error('could not locate the spreadsheet export block'); process.exit(2); }
// v1.67.0: the Expenses section names each kind from the expenses block.
const ea = HTML.indexOf('  // ---- expenses ----'), eb = HTML.indexOf('  // ---- end expenses ----');
if (ea < 0 || eb < 0) { console.error('could not locate the expenses block'); process.exit(2); }
// v1.92.0: the stock export reads each item's parts lines.
const pa = HTML.indexOf('  // PARTS (v1.92.0)'), pb = HTML.indexOf('  // PARTS: END');
if (pa < 0 || pb < 0) { console.error('could not locate the parts block'); process.exit(2); }
const SRC = HTML.slice(pa, pb) + HTML.slice(ea, eb) + HTML.slice(a, b);

// The page's own bits that the export leans on. sales and items are the real
// shape the app stores; the rest are the one-line helpers it calls.
const ctx = {
  console, TextEncoder, Blob, Uint8Array, Uint32Array,
  round2: (n) => Math.round((Number(n) || 0) * 100) / 100,
  sales: [],
  items: {},
  // copied from index.html - a sale line carries its own net, already signed
  lineQty: s => (s.qty != null) ? (Number(s.qty) || 0) : 1,
  lineNet: s => (s.net != null) ? (Number(s.net) || 0) : (Number(s.price) || 0),
  fmtReceiptNo: n => '#SA-' + String(n).padStart(4, '0'),
  // the stock take export leans on these three
  itemFolder: it => String((it && it.folder) || ''),
  fmtDate: iso => new Date(iso).toLocaleDateString(),
  sessionDate: '2026-08-01T09:00:00.000Z',
};
vm.createContext(ctx);
vm.runInContext(SRC + `
this.moneyCell = moneyCell; this.tableToCsv = tableToCsv; this.salesTable = salesTable;
this.buildXlsx = buildXlsx; this.xlsxSheetXml = xlsxSheetXml; this.xlsxSheetName = xlsxSheetName;
this.xlsxColName = xlsxColName; this.zReportCsv = zReportCsv; this.zReportSheets = zReportSheets;
this.zipStore = zipStore; this.stockTable = stockTable;
`, ctx);

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

/* ---------- the sale records everything below is built from ---------- */

// the app stores the time as an ISO string, not a number - it sorts sales by
// comparing them as text
const AT = Date.UTC(2026, 7, 20, 11, 30, 0);
const iso = ms => new Date(ms).toISOString();
const SALES = [
  { at: iso(AT), receiptNo: 12, barcode: '0012345', name: 'Rose Quartz "Heart"', maker: 'Kay',
    price: 12.5, qty: 2, disc: 1.25, net: 22.5, pay: 'cash', staff: 'Ann' },
  { at: iso(AT + 60000), receiptNo: 13, barcode: 'CA-031', name: 'Salt Lamp & Base',
    price: 24, qty: 1, disc: 0, net: 24, pay: 'card', webRef: '0099', staff: 'Bea' },
  // a refund is recorded with a negative net, not by flipping the sign later
  { at: iso(AT + 120000), receiptNo: 14, barcode: 'CA-055', name: 'Tarot Deck', maker: 'Jo',
    price: 15, qty: 1, disc: 0, net: -15, pay: 'card', kind: 'refund', staff: 'Ann' },
];
// the second sale has no maker on the line, which is what an older record looks
// like - it has to come off the item instead
const ITEMS = { 'CA-031': { maker: 'Meg' } };

// the shelf, for the stock take export
const STOCK = {
  'CA-001': { name: 'Rose Quartz "Heart"', folder: 'Kay/Jewellery', maker: 'Kay',
              price: 12.5, qty: 2, counted: 1, label: 'Small swing tag', materials: 'Mixed fibres yarn, alloy clasp', batch: 'lot 4821', boughtFrom: 'Wool Warehouse',
              addedAt: '2026-08-01T09:00:00.000Z' },
  // no addedAt - it falls back to the date the count started. No label either,
  // which is the normal case: most items will never have one.
  'CA-002': { name: 'Salt Lamp & Base', folder: 'Home', price: 24, qty: 1, counted: 1 },
  '0012345': { name: 'Jasper Tumble', folder: '', maker: 'Jo', price: 4, qty: 4, counted: 4 },
};

function withSales(fn) {
  ctx.sales = SALES.slice();
  ctx.items = ITEMS;
  return fn();
}

/* ---------- 1. the CSV has not changed ---------- */

console.log('\nThe sales CSV');
{
  const csv = withSales(() => { const t = ctx.salesTable(); return ctx.tableToCsv(t.cols, t.rows); });
  const want = oldSalesCsv(SALES, ITEMS);
  check('byte for byte what the old export wrote', csv === want,
        csv === want ? '' : '\n--- got ---\n' + csv + '--- want ---\n' + want);

  const lines = csv.trim().split('\n');
  check('the header row is not quoted', lines[0] === 'Date,Time,Receipt,Type,Barcode,Item,Made By,Unit Price,Qty,Discount,Net,Payment,Order No,Staff');
  check('one row per sale, plus a total', lines.length === SALES.length + 2, lines.length + ' lines');
  check('money is written to two places', lines[1].indexOf('"12.50"') !== -1);
  // Number('') is 0, so a blank money column must not be run through the money
  // formatter - it would turn every empty cell in the total row into "0.00".
  check('the total row keeps its blanks blank',
        lines[4] === '"TOTAL","","","","","","","","","","31.50","","",""', lines[4]);
  check('a quote in an item name is doubled, not dropped', lines[1].indexOf('Rose Quartz ""Heart""') !== -1);
  check('the maker falls back to the item record', lines[2].indexOf('"Meg"') !== -1);
  check('a refund is marked as one', lines[3].indexOf('"refund"') !== -1);
  check('a refund is a negative net', lines[3].indexOf('"-15.00"') !== -1);
}

console.log('\nThe sales report CSV');
{
  const f = reportFigures();
  const p = payoutFigures();
  const csv = ctx.zReportCsv(f, '20 August 2026', p);
  const want = oldReportCsv(f, '20 August 2026', p);
  check('byte for byte what the old export wrote', csv === want,
        csv === want ? '' : '\n--- got ---\n' + csv + '--- want ---\n' + want);
  check('the three sections are all still there',
        csv.indexOf('Metric,Value') === 0 &&
        csv.indexOf('\nTop sellers\n') !== -1 &&
        csv.indexOf('\nSupplier payouts\n') !== -1);
  // the heading is written even for a quiet period, which is what it did before
  const empty = ctx.zReportCsv(f, 'x', { rows: [], ratePct: 1.69, webRatePct: 2.5 });
  check('a period with no makers still gets the payouts heading', empty.indexOf('\nSupplier payouts\n') !== -1);
  // A shop that has never taken a misc amount must get the file it always got,
  // which is the whole reason the section is conditional.
  check('a period with no misc amounts has no Miscellaneous section',
        csv.indexOf('Miscellaneous') === -1);
}

console.log('\nThe sales report CSV, with misc amounts in it');
{
  const f = miscReportFigures();
  const p = payoutFigures();
  const csv = ctx.zReportCsv(f, '20 August 2026', p);
  const want = oldReportCsv(f, '20 August 2026', p);
  check('byte for byte what the reference writes', csv === want,
        csv === want ? '' : '\n--- got ---\n' + csv + '--- want ---\n' + want);
  check('the Miscellaneous section is there', csv.indexOf('\nMiscellaneous\n') !== -1);
  // It goes between the sellers and the payouts, so the two lists of what was
  // taken sit together and the money owed stays at the bottom.
  check('it sits after Top sellers and before Supplier payouts',
        csv.indexOf('\nTop sellers\n') < csv.indexOf('\nMiscellaneous\n') &&
        csv.indexOf('\nMiscellaneous\n') < csv.indexOf('\nSupplier payouts\n'));
  check('the summary names the total', csv.indexOf('"Miscellaneous","27.50"') !== -1);
  // The description is the only record of what the money was for, so losing it
  // here would make the whole feature pointless.
  check('each description is written out',
        csv.indexOf('"Tarot reading"') !== -1 && csv.indexOf('Workshop deposit ""June""') !== -1);
  check('how it was paid for is written out', csv.indexOf('"card"') !== -1 && csv.indexOf('"cash"') !== -1);
  check('a refunded misc amount is marked as one and is negative',
        csv.indexOf('"refund"') !== -1 && csv.indexOf('"-12.50"') !== -1);
  const miscBlock = csv.slice(csv.indexOf('\nMiscellaneous\n'), csv.indexOf('\nSupplier payouts\n'));
  check('the section has a header, its three lines and a total',
        miscBlock.trim().split('\n').length === 6, miscBlock);
  check('the total row keeps its blanks blank',
        miscBlock.indexOf('"TOTAL","","","","","","27.50"') !== -1, miscBlock);
}

console.log('\nThe stock take CSV');
{
  ctx.items = STOCK;
  const t = ctx.stockTable();
  const csv = ctx.tableToCsv(t.cols, t.rows);
  // The old export left the item count in the total row unquoted while quoting
  // every other cell in the file. Quoting it is the ONE deliberate difference -
  // every CSV reader treats "6" and 6 alike - and this spells it out rather
  // than letting the byte comparison quietly slide.
  const want = oldStockCsv(STOCK).replace('"","",6,""', '"","","6",""');
  check('byte for byte what the old export wrote, bar the quoted total', csv === want,
        csv === want ? '' : '\n--- got ---\n' + csv + '--- want ---\n' + want);
  const lines = csv.trim().split('\n');
  check('the header row is not quoted',
        lines[0] === 'Barcode,Name,Folder,Made By,Price Each,Expected Qty,Counted Qty,Difference,Counted Value,Date Added,Label,Materials,Batch Numbers,Bought From');
  check('one row per item, plus a total', lines.length === Object.keys(STOCK).length + 2);
  check('the price is money', lines[1].indexOf('"12.50"') !== -1);
  check('a short count shows as a negative difference', lines[1].indexOf('"-1"') !== -1);
  check('the counted value is the counted quantity, not the expected one',
        lines[1].indexOf('"12.50"') !== -1 && lines[1].split(',')[8] === '"12.50"', lines[1]);
  check('the total row counts the units and their value',
        lines[4] === '"TOTAL","","","","","","6","","52.50","","","","",""', lines[4]);

  // The label the shop needs to print. It rides in the export and nowhere else:
  // shop-worker never asks Firestore for it, which test/sets.test.js over there
  // pins, and SHARED.md says why.
  check('the label the shop typed comes out in its own column',
        lines[1].split(',')[10] === '"Small swing tag"', lines[1]);
  check('an item with no label gets an empty cell, not the word undefined',
        lines[2].split(',').slice(-2)[0] === '""', lines[2]);
  // v1.90.0: the materials go on the label too, so they ride next to it.
  check('the materials come out after the label, commas and all',
        lines[1].indexOf('"Small swing tag","Mixed fibres yarn, alloy clasp",') !== -1, lines[1]);
  check('the batch numbers come next, then who the parts came from',
        lines[1].endsWith('"lot 4821","Wool Warehouse"'), lines[1]);
  check('an item with none of them gets empty cells',
        lines[2].endsWith(',"","",""'), lines[2]);
}

/* ---------- 2. the .xlsx is really a .xlsx ---------- */

console.log('\nThe worksheet XML');
{
  const t = withSales(() => ctx.salesTable());
  const xml = ctx.xlsxSheetXml(t.cols, t.rows);
  check('the header row is bold', xml.indexOf('<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Date</t></is></c>') !== -1);
  // The whole point of offering Excel: a column of takings you can add up. A
  // price written as text is the failure this is guarding against.
  check('money is a number, not text', xml.indexOf('<c r="H2" s="2"><v>12.50</v></c>') !== -1);
  check('the money cells carry no text type', /<c r="K\d+" s="2" t="inlineStr"/.test(xml) === false);
  check('a quantity is a plain number', xml.indexOf('<c r="I2"><v>2</v></c>') !== -1);
  // A barcode written as a number loses its leading zero, and then it no longer
  // matches anything in the till.
  check('a barcode keeps its leading zero', xml.indexOf('>0012345</t>') !== -1);
  check('the header row is frozen', xml.indexOf('state="frozen"') !== -1);
  check('columns are given a width', xml.indexOf('<col min="1" max="1"') !== -1);
  check('empty cells are left out rather than written empty', xml.indexOf('<c r="B5"') === -1);
}

console.log('\nWhat XML cannot carry');
{
  const cols = [{ h: 'Item' }, { h: 'Net' }];
  const rows = [['Bell & "Bowl" <small>', ctx.moneyCell(3)], ['bad\u0007char', ctx.moneyCell(1)]];
  const xml = ctx.xlsxSheetXml(cols, rows);
  check('an ampersand is escaped', xml.indexOf('Bell &amp; ') !== -1);
  check('angle brackets are escaped', xml.indexOf('&lt;small&gt;') !== -1);
  check('a quote in the text is left alone', xml.indexOf('"Bowl"') !== -1);
  // Excel refuses the whole file over one of these rather than skipping it.
  check('a control character is dropped', xml.indexOf('\u0007') === -1 && xml.indexOf('badchar') !== -1);
}

console.log('\nSheet names Excel will accept');
{
  check('an illegal character is replaced', ctx.xlsxSheetName('Sales/2026') === 'Sales 2026');
  check('a long name is cut to 31', ctx.xlsxSheetName('x'.repeat(40)).length === 31);
  check('a blank name still gets one', ctx.xlsxSheetName('') === 'Sheet');
  const taken = [];
  check('the first of a duplicate pair is untouched', ctx.xlsxSheetName('Sales', taken) === 'Sales');
  check('the second is made different', ctx.xlsxSheetName('Sales', taken) === 'Sales 2');
}

console.log('\nColumn letters');
{
  check('A is the first', ctx.xlsxColName(0) === 'A');
  check('Z is the twenty-sixth', ctx.xlsxColName(25) === 'Z');
  check('AA follows Z', ctx.xlsxColName(26) === 'AA');
}

/* ---------- the ZIP the workbook is packed in ---------- */

// Reads the archive back the way a zip tool would: from the end of file
// directory, not from the front. Anything the writer got wrong about sizes or
// offsets shows up here rather than in Excel.
function readZip(buf) {
  const eocd = buf.length - 22;
  if (buf.readUInt32LE(eocd) !== 0x06054b50) throw new Error('no end of directory record');
  const count = buf.readUInt16LE(eocd + 10);
  const dirSize = buf.readUInt32LE(eocd + 12);
  const dirStart = buf.readUInt32LE(eocd + 16);
  if (dirStart + dirSize !== eocd) throw new Error('directory does not end where the record starts');
  const out = [];
  let p = dirStart;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad directory entry ' + i);
    const crc = buf.readUInt32LE(p + 16);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    if (buf.readUInt32LE(offset) !== 0x04034b50) throw new Error('bad local header for ' + name);
    if (buf.readUInt16LE(offset + 8) !== 0) throw new Error(name + ' claims to be compressed');
    const localNameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const dataAt = offset + 30 + localNameLen + extraLen;
    out.push({ name, crc, data: buf.slice(dataAt, dataAt + size) });
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  return out;
}

(async () => {
  console.log('\nThe workbook as a file');
  const t = withSales(() => ctx.salesTable());
  const blob = ctx.buildXlsx([{ name: 'Sales', cols: t.cols, rows: t.rows }]);
  const buf = Buffer.from(await blob.arrayBuffer());

  check('it is offered as a spreadsheet, not a zip',
        blob.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', blob.type);
  check('it starts with the zip signature', buf.readUInt32LE(0) === 0x04034b50);

  let entries = [];
  let readable = true;
  try { entries = readZip(buf); } catch (e) { readable = false; check('the archive reads back', false, e.message); }
  if (readable) {
    check('the archive reads back from its directory', true);
    // Written by hand, so this is not a formality: a wrong CRC is the usual way
    // a hand-rolled zip is refused.
    const bad = entries.filter(e => zlib.crc32(e.data) !== e.crc).map(e => e.name);
    check('every CRC matches the bytes stored', bad.length === 0, bad.join(', '));

    const names = entries.map(e => e.name);
    ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels',
     'xl/styles.xml', 'xl/worksheets/sheet1.xml'].forEach(n => {
      check('the workbook contains ' + n, names.indexOf(n) !== -1);
    });

    const part = n => entries.filter(e => e.name === n)[0].data.toString('utf8');
    // This is the check that matters. Excel does not open a workbook that
    // promises a part it has not got, and it says nothing useful when it fails.
    const declared = (part('[Content_Types].xml').match(/PartName="\/([^"]+)"/g) || [])
      .map(s => s.replace(/PartName="\//, '').replace(/"$/, ''));
    const missingDeclared = declared.filter(n => names.indexOf(n) === -1);
    check('every part the content types claim really exists', missingDeclared.length === 0, missingDeclared.join(', '));

    const targets = (part('xl/_rels/workbook.xml.rels').match(/Target="([^"]+)"/g) || [])
      .map(s => 'xl/' + s.replace(/Target="/, '').replace(/"$/, ''));
    const missingTargets = targets.filter(n => names.indexOf(n) === -1);
    check('every relationship points at a part that exists', missingTargets.length === 0, missingTargets.join(', '));

    const rootTarget = part('_rels/.rels').indexOf('Target="xl/workbook.xml"') !== -1;
    check('the package points at the workbook', rootTarget);
    check('the sheet is named in the workbook', part('xl/workbook.xml').indexOf('name="Sales"') !== -1);
    check('the styles the cells use are defined', part('xl/styles.xml').indexOf('<cellXfs count="3">') !== -1);
    check('the sheet holds the sales', part('xl/worksheets/sheet1.xml').indexOf('Rose Quartz') !== -1);

    // Money should read as £12.50 in the sheet and still be a number underneath.
    // Excel's built-in currency formats are all dollars, so this has to be a
    // custom one, and a custom format that nothing refers to does nothing.
    const styles = part('xl/styles.xml');
    check('a pound sign currency format is defined',
          /<numFmt numFmtId="164" formatCode="&quot;£&quot;#,##0\.00"\/>/.test(styles), styles.slice(0, 240));
    check('the money style actually uses it',
          /<xf numFmtId="164"[^>]*applyNumberFormat="1"/.test(styles));
    check('the money style is the third one, which is what the cells ask for',
          styles.indexOf('numFmtId="164"', styles.indexOf('<cellXfs')) > styles.indexOf('<cellXfs'));
    check('the count of formats matches what is listed', styles.indexOf('<numFmts count="1">') !== -1);
  }

  console.log('\nThe stock take as a workbook');
  {
    ctx.items = STOCK;
    const st = ctx.stockTable();
    const sbuf = Buffer.from(await ctx.buildXlsx([{ name: 'Stock take', cols: st.cols, rows: st.rows }]).arrayBuffer());
    let sentries = [];
    try { sentries = readZip(sbuf); } catch (e) { check('the stock archive reads back', false, e.message); }
    const spart = n => (sentries.filter(e => e.name === n)[0] || { data: Buffer.alloc(0) }).data.toString('utf8');
    const sheet = spart('xl/worksheets/sheet1.xml');
    check('every CRC matches the bytes stored', sentries.every(e => zlib.crc32(e.data) === e.crc));
    check('the price is a number in the money style', sheet.indexOf('<c r="E2" s="2"><v>12.50</v></c>') !== -1);
    check('the counted value is too', sheet.indexOf('<c r="I2" s="2"><v>12.50</v></c>') !== -1);
    // Quantities are counts, not money - a £ in front of them would be wrong.
    check('a quantity is left as a plain number', sheet.indexOf('<c r="F2"><v>2</v></c>') !== -1);
    check('a short count keeps its minus sign', sheet.indexOf('<c r="H2"><v>-1</v></c>') !== -1);
    check('a barcode keeps its leading zero', sheet.indexOf('>0012345</t>') !== -1);
    check('the sheet is named for what it is', spart('xl/workbook.xml').indexOf('name="Stock take"') !== -1);
    // Column K, on the end, so nothing that was already there has moved.
    check('the label is the last column and reads as text',
          sheet.indexOf('<c r="K1" s="1" t="inlineStr"><is><t xml:space="preserve">Label</t></is></c>') !== -1 &&
          sheet.indexOf('<c r="K2" t="inlineStr"><is><t xml:space="preserve">Small swing tag</t></is></c>') !== -1);
    check('an item with no label leaves the cell out altogether', sheet.indexOf('<c r="K3"') === -1);
    check('the materials are column L, after the label',
          sheet.indexOf('<c r="L1" s="1" t="inlineStr"><is><t xml:space="preserve">Materials</t></is></c>') !== -1 &&
          sheet.indexOf('<c r="L2" t="inlineStr"><is><t xml:space="preserve">Mixed fibres yarn, alloy clasp</t></is></c>') !== -1 &&
          sheet.indexOf('<c r="L3"') === -1);
    check('the batch numbers are column M',
          sheet.indexOf('<c r="M1" s="1" t="inlineStr"><is><t xml:space="preserve">Batch Numbers</t></is></c>') !== -1 &&
          sheet.indexOf('<c r="M2" t="inlineStr"><is><t xml:space="preserve">lot 4821</t></is></c>') !== -1);
    check('who the parts came from is column N',
          sheet.indexOf('<c r="N1" s="1" t="inlineStr"><is><t xml:space="preserve">Bought From</t></is></c>') !== -1 &&
          sheet.indexOf('<c r="N2" t="inlineStr"><is><t xml:space="preserve">Wool Warehouse</t></is></c>') !== -1);
  }

  console.log('\nThe report as a workbook');
  const sheets = ctx.zReportSheets(reportFigures(), '20 August 2026', payoutFigures());
  const rbuf = Buffer.from(await ctx.buildXlsx(sheets).arrayBuffer());
  let rentries = [];
  try { rentries = readZip(rbuf); } catch (e) { check('the report archive reads back', false, e.message); }
  const rnames = rentries.map(e => e.name);
  check('three tables become three sheets', sheets.length === 3, String(sheets.length));
  check('each one is a part of its own',
        ['xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml']
          .every(n => rnames.indexOf(n) !== -1));
  const wb = (rentries.filter(e => e.name === 'xl/workbook.xml')[0] || { data: Buffer.alloc(0) }).data.toString('utf8');
  check('all three are listed in the workbook',
        wb.indexOf('name="Summary"') !== -1 && wb.indexOf('name="Top sellers"') !== -1 &&
        wb.indexOf('name="Supplier payouts"') !== -1);
  check('the sheet ids and relationships line up',
        wb.indexOf('sheetId="3" r:id="rId3"') !== -1);
  const rdeclared = ((rentries.filter(e => e.name === '[Content_Types].xml')[0] || { data: Buffer.alloc(0) }).data.toString('utf8')
    .match(/PartName="\/([^"]+)"/g) || []).map(s => s.replace(/PartName="\//, '').replace(/"$/, ''));
  check('nothing is promised that is not there', rdeclared.every(n => rnames.indexOf(n) !== -1));
  const badR = rentries.filter(e => zlib.crc32(e.data) !== e.crc);
  check('every CRC still matches with three sheets', badR.length === 0);

  console.log('\nThe report as a workbook, with misc amounts in it');
  const msheets = ctx.zReportSheets(miscReportFigures(), '20 August 2026', payoutFigures());
  const mbuf = Buffer.from(await ctx.buildXlsx(msheets).arrayBuffer());
  let mentries = [];
  try { mentries = readZip(mbuf); } catch (e) { check('the misc report archive reads back', false, e.message); }
  const mnames = mentries.map(e => e.name);
  check('the misc amounts get a sheet of their own', msheets.length === 4, String(msheets.length));
  check('four sheets means four parts',
        ['xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml',
         'xl/worksheets/sheet4.xml'].every(n => mnames.indexOf(n) !== -1));
  const mwb = (mentries.filter(e => e.name === 'xl/workbook.xml')[0] || { data: Buffer.alloc(0) }).data.toString('utf8');
  check('it is named in the workbook, before the payouts',
        mwb.indexOf('name="Miscellaneous"') !== -1 &&
        mwb.indexOf('name="Miscellaneous"') < mwb.indexOf('name="Supplier payouts"'));
  check('the sheet ids and relationships line up', mwb.indexOf('sheetId="4" r:id="rId4"') !== -1);
  const mdeclared = ((mentries.filter(e => e.name === '[Content_Types].xml')[0] || { data: Buffer.alloc(0) }).data.toString('utf8')
    .match(/PartName="\/([^"]+)"/g) || []).map(s => s.replace(/PartName="\//, '').replace(/"$/, ''));
  check('nothing is promised that is not there', mdeclared.every(n => mnames.indexOf(n) !== -1));
  check('every CRC still matches with four sheets',
        mentries.filter(e => zlib.crc32(e.data) !== e.crc).length === 0);
  const msheet = (mentries.filter(e => e.name === 'xl/worksheets/sheet3.xml')[0] || { data: Buffer.alloc(0) }).data.toString('utf8');
  // The amount has to arrive as a number in the money style, the same as every
  // other sum in the workbook - a description column next to it is no excuse.
  check('the amount is a number in the money style', msheet.indexOf('<c r="G2" s="2"><v>30.00</v></c>') !== -1, msheet.slice(0, 400));
  check('a refunded one keeps its minus sign', msheet.indexOf('<v>-12.50</v>') !== -1);
  check('the description reads as text',
        msheet.indexOf('<c r="E2" t="inlineStr"><is><t xml:space="preserve">Tarot reading</t></is></c>') !== -1);

  // v1.66.1: the tax year against the £1,000 trading allowance, at the end of
  // the summary, ONLY when the report supplies it (the Export button does). A
  // report built without it is the file it always was, as checked above.
  console.log('\nThe sales report CSV, with the tax year in it');
  {
    const p2 = payoutFigures();
    const base = ctx.zReportCsv(reportFigures(), '20 August 2026', p2);
    const under = reportFigures();
    under.taxYear = { label: '2026–27', period: '6 Apr 2026 to 20 Aug 2026', gross: 412.5, left: 587.5, over: 0, state: 'under', registerBy: '5 October 2027' };
    const csvU = ctx.zReportCsv(under, '20 August 2026', p2);
    check('the tax year gross is in the summary',
          csvU.indexOf('"Gross income, tax year 2026–27 (6 Apr 2026 to 20 Aug 2026)","412.50"') !== -1, csvU.slice(0, 600));
    check('with what is left of the allowance', csvU.indexOf('"£1,000 trading allowance left","587.50"') !== -1);
    check('and no register-by date while under', csvU.indexOf('Register with HMRC') === -1);
    check('it comes after the rest of the summary, before Top sellers',
          csvU.indexOf('Gross income, tax year') > csvU.indexOf('"Refunds"') && csvU.indexOf('Gross income, tax year') < csvU.indexOf('\nTop sellers\n'));
    check('nothing else in the file moved',
          csvU.replace(/"Gross income, tax year[^\n]*\n"£1,000 trading allowance left"[^\n]*\n/, '') === base);
    const over = reportFigures();
    over.taxYear = { label: '2026–27', period: '6 Apr 2026 to 14 Oct 2026', gross: 1050, left: 0, over: 50, state: 'over', registerBy: '5 October 2027' };
    const csvO = ctx.zReportCsv(over, '20 August 2026', p2);
    check('over: by how much', csvO.indexOf('"Over the £1,000 trading allowance by","50.00"') !== -1);
    check('over: the date to register', csvO.indexOf('"Register with HMRC as self-employed by","5 October 2027"') !== -1);
    check('over: no "left" row', csvO.indexOf('allowance left') === -1);
  }

  // v1.67.0: net profit and the expenses behind it, ONLY when supplied.
  console.log('\nThe sales report CSV, with net profit and expenses in it');
  {
    const p3 = payoutFigures();
    const base = ctx.zReportCsv(reportFigures(), '20 August 2026', p3);
    const f = reportFigures();
    f.profit = { gross: 200, cardFees: 1.69, webFees: 1, etsyFees: 1.5, etsyFeesUnknown: 0, expenses: 14.85, byCat: {}, net: 180.96 };
    f.expenseLines = [
      { id: '1', date: '2026-08-02', what: 'Yarn, "Hobbycraft"', cat: 'materials', amount: 10.25, hasPhoto: true },
      { id: '2', date: '2026-08-20', what: 'Stamps', cat: 'postage', amount: 4.6, hasPhoto: false },
    ];
    const csv = ctx.zReportCsv(f, '20 August 2026', p3);
    const at = csv.indexOf('\nExpenses\n');
    check('net profit is in the summary', csv.indexOf('"Net profit","180.96"') !== -1, csv.slice(0, 700));
    check('with each fee and the expenses above it',
          csv.indexOf('"Card fees (SumUp)","1.69"') !== -1 && csv.indexOf('"Website card fees","1.00"') !== -1
          && csv.indexOf('"Etsy\'s card fees","1.50"') !== -1 && csv.indexOf('"Expenses","14.85"') !== -1);
    check('an Expenses section lists each one, quotes doubled', at !== -1
          && csv.indexOf('"' + new Date('2026-08-02T12:00:00').toLocaleDateString() + '","Yarn, ""Hobbycraft""","Materials","10.25","yes"') !== -1, csv.slice(at, at + 300));
    check('with a total', csv.indexOf('"TOTAL","","","14.85",""') !== -1);
    check('it sits before Supplier payouts', at < csv.indexOf('\nSupplier payouts\n'));
    check('without them, the file it always was', ctx.zReportCsv(reportFigures(), '20 August 2026', p3) === base);
    const none = reportFigures(); none.expenseLines = [];
    check('no expenses in the period: no Expenses section', ctx.zReportCsv(none, '20 August 2026', p3).indexOf('\nExpenses\n') === -1);
  }

  // v1.67.2: the accountant's workbook. Every sale line and every expense of
  // the period, straight after the Summary, when the report supplies them.
  console.log('\nThe report export for an accountant: a Sales tab and the Expenses beside it');
  {
    const p4 = payoutFigures();
    const at = (h) => '2026-08-20T' + h + ':00:00.000Z';
    const f = reportFigures();
    f.rates = { card: 1.69, web: 2.5 };
    f.saleLines = [
      { id: 'a', txn: 'T1', receiptNo: 11, pay: 'card', kind: 'sale', barcode: 'KA-1', name: 'Bracelet', maker: 'Kay', price: 10, qty: 3, disc: 2, net: 28, at: at('09') },
      { id: 'b', txn: 'T2', receiptNo: 12, pay: 'card', kind: 'refund', barcode: 'KA-1', name: 'Bracelet', maker: 'Kay', price: 10, qty: -1, disc: 0, net: -10, at: at('10') },
      { id: 'c', txn: 'T3', receiptNo: 13, pay: 'cash', kind: 'sale', barcode: 'KA-2', name: 'Ring', maker: 'Kay', price: 5, qty: 1, disc: 0, net: 5, at: at('11') },
      { id: 'd', txn: 'T4', receiptNo: 14, pay: 'web', kind: 'sale', barcode: 'KA-3', name: 'Hanging', maker: 'Kay', price: 40, qty: 1, disc: 0, net: 40, at: at('12'), webRef: 'SC-1001' },
      { id: 'e', txn: 'T5', receiptNo: 15, pay: 'etsy', kind: 'sale', barcode: 'KA-4', name: 'Spider', maker: 'Kay', price: 15, qty: 1, disc: 0, net: 15, at: at('13'), etsyRef: '5001', etsyFee: 0.61 },
      { id: 'f', txn: 'T5', receiptNo: 15, pay: 'etsy', kind: 'sale', barcode: 'POSTAGE', name: 'Postage (Etsy)', maker: '', price: 3.55, qty: 1, disc: 0, net: 3.55, at: at('13'), etsyRef: null, etsyFee: null, misc: true, postage: true },
      { id: 'g', txn: 'T6', receiptNo: 16, pay: 'etsy', kind: 'sale', barcode: 'KA-5', name: 'Holder', maker: 'Kay', price: 18, qty: 1, disc: 0, net: 18, at: at('14'), etsyRef: '5002', etsyFee: null },
    ];
    f.expenseLines = [{ id: '1', date: '2026-08-02', what: 'Yarn', cat: 'materials', amount: 10.25, hasPhoto: true }];
    const csv = ctx.zReportCsv(f, 'Tax year 2026–27', p4);
    const s = csv.indexOf('\nSales\n'), e = csv.indexOf('\nExpenses\n'), t = csv.indexOf('\nTop sellers\n');
    check('Sales, then Expenses, straight after the Summary and before Top sellers', s > 0 && s < e && e < t, [s, e, t].join());
    const sales = csv.slice(s, e);
    check('the Sales columns an accountant needs',
      sales.indexOf('Date,Time,Receipt,Type,Barcode,Item,Made By,Unit Price,Qty,Gross,Discount,Net received,Payment,Order No,Payment fee,Net after fee') !== -1, sales.slice(0, 300));
    check('a card sale: gross 3 × £10, discount, net received, 1.69% fee, net after fee',
      sales.indexOf('"sale","KA-1","Bracelet","Kay","10.00","3","30.00","2.00","28.00","Card","","0.47","27.53"') !== -1, sales);
    check('a card refund: negative, and no fee back', sales.indexOf('"refund","KA-1","Bracelet","Kay","10.00","-1","-10.00","0.00","-10.00","Card","","0.00","-10.00"') !== -1);
    check('cash: no fee', sales.indexOf('"Ring","Kay","5.00","1","5.00","0.00","5.00","Cash","","0.00","5.00"') !== -1);
    check('a website order: its order number and the website rate', sales.indexOf('"Website","SC-1001","1.00","39.00"') !== -1);
    check('an Etsy order: its order number and Etsy\'s own fee', sales.indexOf('"Etsy","5001","0.61","14.39"') !== -1);
    check('the rest of that Etsy order carries no second fee', sales.indexOf('"Postage (Etsy)","","3.55","1","3.55","0.00","3.55","Etsy","","0.00","3.55"') !== -1);
    check('an Etsy fee not known says so, never £0', sales.indexOf('"Etsy","5002","not known",""') !== -1);
    // 28 − 10 + 5 + 40 + 15 + 3.55 + 18 = 99.55 received; fees 0.4732 + 1 + 0.61 = 2.0832
    check('totals: gross, discount, net received and the known fees; after-fees blank while one is unknown',
      sales.indexOf('"TOTAL","","","","","","","","","101.55","2.00","99.55","","","2.08",""') !== -1, sales.slice(sales.lastIndexOf('"TOTAL"')));
    // Written the way this machine writes a date, as the Date column of the sales is.
    check('the Expenses tab lists the purchases', csv.slice(e, t).indexOf('"' + new Date('2026-08-02T12:00:00').toLocaleDateString() + '","Yarn","Materials","10.25","yes"') !== -1);
    check('and appears once', csv.split('\nExpenses\n').length === 2);
    const sheets = ctx.zReportSheets(f, 'Tax year 2026–27', p4).map(x => x.name).join();
    check('the workbook: Summary, Sales, Expenses, then the rest', sheets.indexOf('Summary,Sales,Expenses,Top sellers') === 0, sheets);
    const plain = ctx.zReportSheets(reportFigures(), 'x', p4).map(x => x.name).join();
    check('without them, no Sales tab', plain.indexOf('Sales') === -1 || plain.indexOf('Sales,') === -1 && !/(^|,)Sales(,|$)/.test(plain), plain);
  }

  // v1.67.3: in the accountant's workbook the Sales and Expenses tabs are
  // always there, saying so when there is nothing, never silently missing.
  console.log('\nThe accountant\'s workbook always has its Sales and Expenses tabs');
  {
    const p5 = payoutFigures();
    const f = reportFigures();
    f.rates = { card: 1.69, web: 2.5 };
    f.saleLines = [];
    f.expenseLines = [];
    const names = ctx.zReportSheets(f, 'Tax year 2026–27', p5).map(x => x.name).join();
    check('no sales and no expenses: both tabs still there, in order', names.indexOf('Summary,Sales,Expenses,Top sellers') === 0, names);
    const csv = ctx.zReportCsv(f, 'Tax year 2026–27', p5);
    check('the empty Sales tab says so', csv.indexOf('"No sales in this period"') !== -1);
    check('the empty Expenses tab says so', csv.indexOf('"No expenses recorded for this period"') !== -1);
    f.expenseLines = [{ id: '1', date: '2026-08-02', what: 'Yarn', cat: 'materials', amount: 3, hasPhoto: false }];
    check('with an expense, no "none" line', ctx.zReportCsv(f, 'x', p5).indexOf('No expenses recorded') === -1);
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();

/* ---------- the figures the report is built from ---------- */

function reportFigures() {
  return {
    net: 21.75, txns: 3, units: 4,
    pay: { cash: 23.75, card: 24, web: 0, other: 0 },
    discounts: 2.5, refunds: 15,
    sellers: {
      a: { name: 'Rose Quartz "Heart"', qty: 2, net: 22.5 },
      b: { name: 'Salt Lamp & Base', qty: 1, net: 24 },
      c: { name: 'Tarot Deck', qty: 1, net: -15 },
    },
  };
}

// The same period, but with three misc amounts taken in it: two sold and one
// given back. The refund is what proves f.misc is the money actually kept.
function miscReportFigures() {
  const f = reportFigures();
  f.misc = 27.5;
  f.miscLines = [
    { at: iso(AT + 180000), receiptNo: 15, name: 'Tarot reading', qty: 1, pay: 'card', net: 30, kind: 'sale' },
    { at: iso(AT + 240000), receiptNo: 16, name: 'Workshop deposit "June"', qty: 1, pay: 'cash', net: 10, kind: 'sale' },
    { at: iso(AT + 300000), receiptNo: 17, name: 'Tarot reading', qty: -1, pay: 'card', net: -12.5, kind: 'refund' },
  ];
  return f;
}

function payoutFigures() {
  return {
    ratePct: 1.69, webRatePct: 2.5, commPct: 20,
    rows: [
      // Kay on the shop's rate and Meg deliberately on none, so the export is
      // checked with a commissioned supplier AND an exempt one in it.
      { name: 'Kay', units: 2, fromCash: 22.5, fromCard: 0, fromWeb: 0, fromOther: 0,
        sold: 22.5, owed: 18, cardSales: 0, webSales: 0, refunds: 0, fee: 0, webFee: 0,
        commissionPct: 20, commission: 4.5 },
      { name: 'Meg', units: 1, fromCash: 0, fromCard: 23.59, fromWeb: 0, fromOther: 0,
        sold: 24, owed: 23.59, cardSales: 24, webSales: 0, refunds: 0, fee: 0.41, webFee: 0,
        commissionPct: 0, commission: 0 },
    ],
  };
}

/* ---------- the old exports, kept as the reference ---------- */
// Copied from index.html as it stood at v1.15.0. If a change to the export is
// meant to change the file the shop gets, change these too - deliberately.

function oldSalesCsv(sales, items) {
  const lineQty = ctx.lineQty, lineNet = ctx.lineNet, fmtReceiptNo = ctx.fmtReceiptNo;
  let csv = 'Date,Time,Receipt,Type,Barcode,Item,Made By,Unit Price,Qty,Discount,Net,Payment,Order No,Staff\n';
  let total = 0;
  sales.forEach(s => {
    const d = new Date(s.at);
    const q = lineQty(s), net = lineNet(s);
    total += net;
    const it = items[s.barcode];
    const maker = s.maker || (it && it.maker) || '';
    const row = [
      d.toLocaleDateString(), d.toLocaleTimeString(), fmtReceiptNo(s.receiptNo),
      s.kind === 'refund' ? 'refund' : 'sale', s.barcode, s.name, maker,
      (Number(s.price) || 0).toFixed(2), q, (Number(s.disc) || 0).toFixed(2),
      net.toFixed(2), s.pay || '', s.webRef || '', s.staff || ''
    ];
    csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });
  csv += `"TOTAL","","","","","","","","","","${total.toFixed(2)}","","",""\n`;
  return csv;
}

// v1.18.0 added the Label column to this file DELIBERATELY - it is the one
// change to the stock CSV since this reference was taken, written in here
// rather than papered over by loosening the comparison. v1.90.0 added Materials
// and Batch Numbers and Bought From after it, the same way and for the same reason: they go on the label.
function oldStockCsv(items) {
  const itemFolder = ctx.itemFolder, fmtDate = ctx.fmtDate, sessionDate = ctx.sessionDate;
  let csv = 'Barcode,Name,Folder,Made By,Price Each,Expected Qty,Counted Qty,Difference,Counted Value,Date Added,Label,Materials,Batch Numbers,Bought From\n';
  let totalUnits = 0, totalValue = 0;
  Object.keys(items).forEach(bc => {
    const it = items[bc];
    const counted = Number(it.counted) || 0;
    const price = Number(it.price) || 0;
    const diff = counted - it.qty;
    const lineValue = counted * price;
    totalUnits += counted;
    totalValue += lineValue;
    const row = [bc, it.name, itemFolder(it), it.maker || '', price.toFixed(2), it.qty, counted, diff,
      lineValue.toFixed(2), fmtDate(it.addedAt || sessionDate), it.label || '', it.materials || '', it.batch || '', it.boughtFrom || ''];
    csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });
  csv += `"TOTAL","","","","","",${totalUnits},"","${totalValue.toFixed(2)}","","","","",""\n`;
  return csv;
}

function oldReportCsv(f, label, p) {
  const esc = v => `"${String(v).replace(/"/g, '""')}"`;
  let csv = 'Metric,Value\n';
  const summary = [['Period', label], ['Net takings', f.net.toFixed(2)], ['Transactions', f.txns],
   ['Items sold', f.units], ['Cash', f.pay.cash.toFixed(2)], ['Card', f.pay.card.toFixed(2)],
   ['Website', f.pay.web.toFixed(2)], ['Other', f.pay.other.toFixed(2)],
   ['Discounts', f.discounts.toFixed(2)], ['Refunds', f.refunds.toFixed(2)]];
  // v1.27.0 added misc amounts, and with them these two additions to this file,
  // DELIBERATELY: money taken for something that was not stock is in the
  // takings, and until now there was nowhere to read back what it was for.
  // Both are written only when there were any, so a shop that has never taken
  // one gets a byte-identical file to the one it has always got.
  if (f.misc) summary.push(['Miscellaneous', f.misc.toFixed(2)]);
  summary.forEach(r => { csv += r.map(esc).join(',') + '\n'; });
  csv += '\nTop sellers\nItem,Qty,Net\n';
  Object.keys(f.sellers).map(k => f.sellers[k]).sort((x, y) => y.net - x.net).forEach(t => {
    csv += [t.name, t.qty, t.net.toFixed(2)].map(esc).join(',') + '\n';
  });
  if (f.miscLines && f.miscLines.length) {
    let misc = 'Date,Time,Receipt,Type,For,Payment,Amount\n';
    f.miscLines.forEach(m => {
      const d = new Date(m.at);
      misc += [d.toLocaleDateString(), d.toLocaleTimeString(), ctx.fmtReceiptNo(m.receiptNo),
        m.kind === 'refund' ? 'refund' : 'sale', m.name, m.pay || '', m.net.toFixed(2)]
        .map(esc).join(',') + '\n';
    });
    misc += ['TOTAL', '', '', '', '', '', f.misc.toFixed(2)].map(esc).join(',') + '\n';
    csv += '\nMiscellaneous\n' + misc;
  }
  let payouts = `Maker,Items,Pay from cash,Pay from card,Pay from website,Pay from other,Owed,`
    // CHANGED DELIBERATELY at v1.34.0: two columns for the shop's own
    // commission. The payout sheet is what somebody hands real money out from,
    // so a deduction missing from it would be a hole.
    + `Card sales,Website sales,Refunds,Card fee (${p.ratePct}%),Website fee (${p.webRatePct}%),`
    + `Commission %,Shop commission\n`;
  p.rows.forEach(m => {
    payouts += [m.name, m.units, m.fromCash.toFixed(2), m.fromCard.toFixed(2),
      m.fromWeb.toFixed(2), m.fromOther.toFixed(2), m.owed.toFixed(2),
      m.cardSales.toFixed(2), m.webSales.toFixed(2),
      m.refunds.toFixed(2), m.fee.toFixed(2), m.webFee.toFixed(2),
      m.commissionPct, m.commission.toFixed(2)].map(esc).join(',') + '\n';
  });
  csv += '\nSupplier payouts\n' + payouts;
  return csv;
}
