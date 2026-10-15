# Change register — Soulful Angels Till & Stock

Every version published to https://soulcreationsbykay.github.io/till/ is recorded here.
(Entries before 28 Sept 2026 are from the Soulful Angels till this was copied from.)
The version at the top of this file is what the app's header shows, so you can tell
at a glance which build a phone or till is running.

Version numbering: the middle number goes up for new features, the last number for
fixes.

---

## v1.70.0 - 15 October 2026

**✨ also suggests a clearer item name, and Use this buttons.**

- After ✨ Write it for me, a **suggested item name** appears under the
  button, with a **Use this** button. The name is never changed by itself,
  because it is also on labels and receipts. A colour group keeps its own
  colour on the end (" — Pink"), so the group stays together.
- For an Etsy item that already has a title or tags, the AI's title and tags
  now come with their own **Use this** buttons instead of being written out
  in the line under the button.
- If you keep your own description, the suggestions still show.

Needs `kay-words` redeployed (it now returns the name).

---

## v1.69.0 - 14 October 2026

**✨ Write it for me: AI-written descriptions, and an advertising word check.**

- Under the description on Add item and Edit item there is now a line for
  facts the photo can't show (stones, size, metal, yarn), a choice of AI
  (Claude Opus, Sonnet or Haiku, or ChatGPT once its key is added) and a
  **✨ Write it for me** button. It writes a draft from the item's photo: the
  first Etsy photo for an Etsy item, otherwise the website photo. For an Etsy
  item it also fills the Etsy title and tags if they are empty. Nothing is
  saved until Add item or Save, and words already in the box are only
  replaced if you say yes. The AI chosen is remembered on each device.
- **The advertising word check** runs on every description as it is typed,
  however it was written: health claims (heal, cure, anxiety...), "known
  for", metal claims (sterling, 925, 9ct), superlatives (best, guaranteed),
  green and safety claims each show in amber with the reason. It warns and
  never stops a save.
- The AI is given the UK advertising rules (CAP Code) every time: no health
  claims, stone meanings only as tradition, no stone, metal or size unless
  you typed it.

Needs the new `kay-words` service deployed with its API keys (see
words-worker/README.md). Until then the button says it can't reach it; the
word check works without it.

---

## v1.68.0 - 14 October 2026

**Etsy's stock follows the till both ways.** Until now the till only ever
lowered Etsy. Now Etsy is set to the till's count less any Etsy orders the
till has not recorded yet, so:

- a **restock** raises Etsy (drafts and live listings), and a colour the till
  switched off at 0 comes back on;
- a colour Kay hid herself on Etsy stays hidden (the Etsy box says so);
- a **deactivated** (sold out) listing is never put back on sale by the
  till: a box says "Back in stock: re-activate on Etsy", once, with the
  quantity to set; after Kay re-activates it, the till keeps it in step;
- it also closes a gap: an Etsy sale not yet recorded plus a stall sale could
  leave a piece on Etsy that was gone. Etsy's orders are read fresh each time,
  and if they cannot be read nothing is changed.

Needs `kay-etsy` with the new stock sync deployed.

---

## v1.67.4 - 14 October 2026

**A switched-off button now looks switched off.** Buttons the till disables
(Send to Etsy as a draft when something blocks it, and others) looked exactly
like live ones, so pressing one seemed to do nothing. They are now greyed
out; the reason is in the line under the button.

---

## v1.67.3 - 14 October 2026

**The Sales and Expenses tabs are always in the report export.** They were
left out when the period had none, which looked like something was missing.
Now they are always there; an empty one says "No sales in this period" or
"No expenses recorded for this period".

`tests/sales-export.js`: 4 new checks (128).

---

## v1.67.2 - 14 October 2026

**The report export is the accountant's workbook.** Export from the sales
report (CSV or Excel) now has, straight after the Summary:

- a **Sales** tab: every sale line in the chosen period (choose Tax year for
  a tax return), with date, time, receipt, sale or refund, barcode, item,
  maker, unit price, quantity, **gross** (price × quantity), discount, **net
  received**, payment, **order number** (website or Etsy), **payment fee** and
  **net after fee**, with totals. The fee is the Settings rate on a card or
  website sale (none back on a refund), Etsy's own fee on an Etsy order (on
  its first line; "not known" when Etsy did not say), none on cash. The fee
  total matches the Summary's.
- the **Expenses** tab beside it, every purchase in the period. Its dates are
  now written the way the sales dates are.

Sales tab → Export sales now fills in the Order No for Etsy orders too.

`tests/sales-export.js`: 14 new checks (124), verified against four broken
copies; checked in the preview by exporting a tax year to CSV and Excel.

---

## v1.67.1 - 14 October 2026

**Tax year on the sales report.** Beside Day, Month, Year and Dates there is
now **Tax year**: 6 April to 5 April, chosen from a list such as "2026–27 (6
Apr 2026 to 5 Apr 2027)", from the tax year of the first sale or expense up
to the current one, newest first. Print and Export use it too (labelled "Tax
year 2026–27").

`tests/trading-allowance.js`: 7 new checks (20), verified against two broken
copies.

---

## v1.67.0 - 14 October 2026

**Expenses, and net profit on the sales report.**

- **🧾 Expenses** (Sales tab, under Report): add each cost with the date
  paid, what it was for, the kind (Materials, Packaging, Postage, Stall and
  event fees, Etsy fees from the Etsy statement, Tools and equipment,
  Travel, Other), the amount and, optionally, a **receipt photo**. Tap one to
  change or delete it. Listed newest first with a total per tax year.
- Expenses sync to every till (collection `expenses`; the later change to an
  expense wins, and a deleted one stays deleted). Receipt photos need Team
  sync and are fetched only when opened (`expensePhotos`). Without sync a
  photo is not kept, and the till says so; the figures still save.
- **Net profit** on the report, for the chosen period: gross income, less
  SumUp card fees (the Settings rate, on card sales), website card fees,
  Etsy's card fees, and the expenses by kind, each step shown. Not shown for
  a single maker, because costs are the whole shop's.
- The tax-year box adds the **net profit this tax year**, with a reminder
  that for tax you take off either the £1,000 trading allowance or your
  actual expenses, not both.
- Exports add Card fees, Website card fees, Etsy's card fees, Expenses and
  Net profit to the Summary, the tax year's net profit, and an **Expenses**
  section (sheet) listing each one. Nothing else in the file moves.
- The weekly backup carries the expenses (figures only; receipt photos stay
  in the workspace). Restoring merges them, never undoing a newer change.
- Card fees and Etsy's card fees are worked out already, so are not entered
  as expenses; Etsy's other fees (listing, transaction) are.

New `tests/expenses.js` (27 checks, verified against four broken copies);
`tests/sales-export.js` 7 more (110).

---

## v1.66.1 - 14 October 2026

**The tax year is in the report exports too.** Export (CSV and Excel) adds,
at the end of the Summary: "Gross income, tax year 2026–27 (6 Apr 2026 to
…)", then either "£1,000 trading allowance left" or, once over, "Over the
£1,000 trading allowance by" and "Register with HMRC as self-employed by".
Whole shop, the same figures as the screen. Nothing else in the file moves:
the row above it is still "Net takings".

`tests/sales-export.js`: 7 new checks (103), verified against two broken
copies.

---

## v1.66.0 - 14 October 2026

**Gross income and the £1,000 trading allowance on the sales report.**

- The top of the report shows **gross income for the tax year so far** (6
  April to 5 April, the tax year of the report's last day, up to today), for
  the whole shop whatever period or maker is chosen, against the UK £1,000
  trading allowance: how much is left, "getting close" from £800, and once
  over it, by how much and the date to register with HMRC as self-employed
  (5 October after that tax year ends).
- Gross income is everything customers paid, after discounts and refunds,
  with postage, website and Etsy sales (before Etsy's fees) included. Card
  and Etsy fees are expenses and are not taken off. Only sales recorded in
  this till count.
- The period figure "Net takings" is now called **Gross income** on screen
  and when printed (same number: "net" meant after discounts, not after
  costs). Spreadsheet exports are unchanged.

`tests/trading-allowance.js` (new): 13 checks. They caught two mistakes
before release: the register-by year was a year late, and refunds could
show more than £1,000 left.

---

## v1.65.0 - 14 October 2026

**Etsy orders come into the till (Etsy step 3b).**

- Every minute while a till is open and signed in, it asks the Etsy service
  for paid Etsy orders no till has recorded yet. Each is claimed first (only
  one till ever records an order) and rung through as an **Etsy** sale: the
  stock comes off, postage is its own line, and an Etsy coupon shows as each
  line's discount.
- **No customer details.** No name, address, email or message reaches the
  till, so none can reach a sale, a backup or a spreadsheet. Post from the
  Etsy app, which has the address.
- Something sold on Etsy that the till does not know is still in the
  takings, with no stock taken; a box names it. So does an order for
  something the till had none of.
- New payment type **Etsy** (🧡) on receipts and the sold list. The report
  shows Etsy takings on their own and **Etsy card fees** beside them (not
  taken off the takings). An order whose fee Etsy did not give is counted as
  "not known", never as £0. Etsy's other fees (transaction fee, listing
  renewals) are not included yet.
- Needs `kay-etsy` with `/staff/orders` deployed.

`tests/etsy-orders.js` (new): 20 checks, verified against four broken
copies.

---

## v1.64.1 - 14 October 2026

**Selling an Etsy item here tells Etsy at once, or says it could not.**

- A sale of anything that is on Etsy is sent to Etsy straight away, not
  after the usual few seconds, so closing the till at once does not delay it.
- If Etsy cannot be told right then (no signal, Team sync not connected, or
  Etsy not answering), a box that stays until OK says so: it comes off Etsy
  by itself later, but until then it could sell there too, so take it off in
  the Etsy app if you can.
- When the device gets its signal back, the till checks Etsy's stock within
  seconds instead of waiting for the five-minute check.

---

## v1.64.0 - 14 October 2026

**A sale anywhere else takes it off Etsy (Etsy step 3a).**

- After every stock change (a sale, an edit, a count arriving from another
  till) and every five minutes while a till is open and signed in, the
  count of every item on Etsy goes to the Etsy service.
- Where the till has fewer than Etsy, Etsy comes down to match. A colour
  with none left is switched off; a live listing with none left at all is
  deactivated (it stays in Etsy's shop manager, ready to re-activate). A
  draft is left alone: nobody can buy a draft.
- **Etsy is never raised.** Until Etsy's own orders come into the till
  (step 3b), a higher till count may just mean Etsy sold one the till has
  not heard about. After restocking, set the quantity on Etsy yourself.
- One message says what was taken off Etsy. The Etsy box on a sent item
  warns when there are none left here, and says when Etsy reports the
  listing gone (press Forget).
- Needs `kay-etsy` with `/staff/stock` deployed.

`tests/etsy.js`: 5 new checks (117), verified against a copy that left
the items at 0 out (the sale that matters most).

---

## v1.63.1 - 14 October 2026

**The Etsy title hint is right for colours.** On a colour item with no Etsy
title it said Etsy would show the whole name ("TEST — Blue"); it now says
Etsy shows the group's name with the colour as a choice, and an Etsy title
typed on a colour is marked as the whole listing's title. Wording only:
what is sent is unchanged.

---

## v1.63.0 - 14 October 2026

**Colours go to Etsy as one listing.**

Items named like "Tarot card holder — Purple", "Tarot card holder — Green"
(the same name rule the website uses for its colour dropdown) now go to Etsy
as ONE listing with a **Colour** choice, not one listing per colour.

- Only the colours **ticked for Etsy** are offered. Each keeps its own price,
  stock and photos, and carries its barcode on Etsy (as the SKU), so later
  steps can change one colour without touching the others.
- The Etsy box on any colour says what the listing will hold, and which
  ticked colours are left out and why (no real photo, none in stock…).
- The title is the group's name (or the item's own Etsy title); the tags of
  all the colours are used, this item's first; a parcel if any colour is.
- Photos: each colour's first photo first, then the rest, up to 10, and each
  colour's first photo is linked to it on Etsy.
- Sent from any colour, every colour in it is marked as on Etsy. **Forget**
  on any colour forgets the whole listing.
- If Etsy will not take the colours, the draft stays but the till says **do
  not publish it**, because it would sell as one thing with every colour's
  stock added together.
- Adding a colour to a listing already on Etsy is not possible yet (it comes
  with the next Etsy step); the till says so instead of making a second one.
- Needs `kay-etsy` with colour support deployed.

`tests/etsy.js` has 14 new checks (112 in all), verified against three
broken copies, and now loads the website's name rule as well.

---

## v1.62.0 - 14 October 2026

**Forget this Etsy draft.**

Once an item had been sent to Etsy, the till would never send it again, even
after the draft was deleted on Etsy.

- An item that has been sent now shows **Forget this Etsy draft** under
  **Open the draft on Etsy**. It is for a draft already deleted on Etsy.
- The till asks the Etsy service, which asks Etsy. If the listing is still
  there (as a draft or anything else), it refuses and says so, because
  sending again would make a duplicate. Delete it on Etsy first.
- Once it is gone on Etsy, the till clears `etsyListingId` and `etsyDraftAt`,
  and **Send to Etsy as a draft** comes back.
- Nothing is deleted on Etsy from the till. Only the Etsy box is redrawn, so
  anything typed in the form and not yet saved stays.
- Needs `kay-etsy` with the `/staff/listings/forget` route deployed.

---

## v1.61.0 - 13 October 2026, 23:01

**The Etsy category picker suggests the best matches.**

Etsy's API has no category suggestion of its own, so the till makes one from
the words Kay already uses.

- When **Choose** opens the picker for a folder, the top shows up to three
  **suggested** categories, the best one highlighted. Tap one to choose
  it, or search below as before.
- They come from the folder's name (a subfolder's own name counts most) and
  the names, Etsy titles and tags of the Etsy items in it, subfolders
  included.
- Etsy's categories are in US English, so UK words are translated:
  jewellery → jewelry, keyring → keychain, jumper → sweater, and a few more.
- Words that say nothing about what a thing is (handmade, gift, set,
  lovely, sterling silver…) are ignored, and plurals match singulars.
- A category whose own name matches beats one where the word only appears
  higher up its path.
- Nothing to go on, nothing suggested. It only ever suggests: Kay still taps.

`tests/etsy.js` has 11 new checks (98 in all), verified against three broken
copies: UK words not translated, empty words kept, and a category's own
name counting no more than its path.

---

## v1.60.0 - 13 October 2026, 22:56

**Etsy categories can be chosen for subfolders too.**

- **Settings → Etsy → Etsy categories for your folders** now lists every
  folder level that has an Etsy item: *Crafted Gifts*, and indented under
  it *Bookmarks*, *Brooches* and so on. Each can have its own Etsy category.
- **The most specific choice wins.** A bookmark uses the Bookmarks category
  if one is chosen, otherwise Crafted Gifts'. A subfolder with none of its
  own says which folder's it is using. Categories already chosen for a
  folder keep working.
- The item's Etsy section says where its category comes from, e.g.
  *Category: … (from Crafted Gifts › Bookmarks)*.
- The picker starts its search with the subfolder's name.
- The Connection to Etsy note now says what the till does since step 2:
  sends drafts, one at a time, and never publishes, changes or deletes.
- Needs `kay-etsy` redeployed: an older service only reads the folder's
  category, so subfolder choices are ignored until it is.

`tests/etsy.js` has 11 new checks (87 in all).

---

## v1.59.0 - 13 October 2026, 22:28

**Items can be sent to Etsy as draft listings, one at a time.**

Step 2 of the Etsy link. Needs `kay-etsy` deployed with its step 2.
**Drafts only**: nobody on Etsy can see or buy one until Kay presses Publish
on Etsy herself. Nothing is published, changed or deleted by the till.

- **Settings → 🧡 Etsy → Etsy categories for your folders.** One row per
  folder that has an item kept for Etsy (Jewellery, Crafted Gifts…), with
  **Choose**. That opens a search of Etsy's own categories (they use US
  words: *Jewelry*); tap the best match. The choice is kept by the Etsy
  service, so every till sees the same.
- **On each Etsy item**, under the tags, the till now shows what Etsy will
  be told:
  - **Delivery profile**: *Large letter* or *Small parcel*, from the
    postage size. No size chosen means a parcel, never the cheaper one by
    accident.
  - **Returns**: automatically *No returns or exchanges* for anything with
    "earring" in its name or folder (for hygiene, as on the website), and
    *Returns within 14 days* for the rest. **Returns on Etsy** changes it
    for one item.
  - **Category**: the one chosen for its folder.
- **Send to Etsy as a draft**, once the item is ready and its folder has a
  category. It saves the item first, then sends its words, price, stock,
  tags and real Etsy photos (never the website photo). The till then shows
  **Open the draft on Etsy** instead, and Settings → Etsy lists it as *On
  Etsy as a draft*. Pressing again, or on another till, never makes a
  second draft.
- A photo Etsy will not take is named in the message; the draft still
  arrives and the photo can be added on Etsy.
- **Not yet:** changes made in the till after a draft is sent do not reach
  Etsy. That is step 3.
- New fields: `etsyReturns`, `etsyListingId`, `etsyDraftAt`. See SHARED.md.

`tests/etsy.js` has 26 new checks (76 in all), verified against three broken
copies: earrings not recognised, no postage size sent as a letter, and the
website photo sent.

---

## v1.58.0 - 13 October 2026, 21:24

**Settings → Etsy can connect the till to Kay's Etsy shop, and look at it.**

Step 1 of the Etsy link. The till only **looks**: nothing is listed, changed
or deleted on Etsy. The new service it talks to is `kay-etsy` (the
`etsy-worker` folder), which has to be deployed before any of this answers.

- **Connection to Etsy**, at the bottom of the 🧡 Etsy card:
  - **Connect Etsy shop** asks the service for a one-off link, then shows
    **Open Etsy to press Allow**. Kay taps it, signs in to Etsy with the
    shop's account if asked, presses Allow, and comes back. (A link she taps,
    not a window opened by the till, because iPads and phones block those.)
    The link works once, for 10 minutes.
  - Back in the till it checks by itself and shows the shop, how many
    listings are active, and the **shipping, processing and return
    profiles** in Etsy, which listings will need in step 2. Anything missing
    says what to set up; anything Etsy did not answer says so.
  - **Check connection** asks again. **Disconnect Etsy** makes the till
    forget the connection; nothing on Etsy changes.
  - **Etsy service address** is filled in already
    (`https://kay-etsy.soulcreations-sales.workers.dev`) and can be changed.
- **Only Kay's shop can be connected.** The service refuses any Etsy
  account whose shop is not SoulCreationsByKay, and keeps nothing from it.
- **Send verification email.** The Etsy service, like the website
  checkout's till routes, only answers a till whose sign-in email has been
  verified, and there was nowhere in the till to do that. When the service
  says the email is not verified, the card says so and offers the button:
  Firebase sends the email, Kay taps its link, then Check connection. This
  also covers plan step o10. A token is fetched fresh once before the till
  gives up, in case the email was verified since.
- The connection lasts while it is used. If the till does not use it for 90
  days, Etsy needs Allow pressing again, and the card says by when.

`tests/etsy-link.js` is new: 19 checks on what the card says, verified
against two broken copies. The till suite is now 32 files. The service has
its own tests: `npm test` in `etsy-worker`.

---

## v1.57.1 - 13 October 2026, 18:11

**With Keep this one for Etsy ticked, the item screens show what matters for
Etsy.**

On Add item and Edit item, ticking Etsy now:

- **Hides the website's own pictures and ticks:** the Photo box (the
  AI-tidied website photo, never used for Etsy), More photos for the website,
  Show this photo on the shop list, the front-page photo tick, and the
  website's status line. Nothing in them is deleted; untick Etsy and they
  are back.
- **Moves Description and Postage size into the Etsy section**, beside the
  Etsy photos, title and tags, since Etsy uses both. The boxes are moved, not
  copied, so what is typed stays and saves as before. Unticking Etsy (or
  ticking the website) puts them back in the Website section.
- **Marks what Etsy needs:** price and the stock count (Starting quantity on
  Add, Counted so far on Edit) and at least one Etsy photo say *needed for
  Etsy*; description and postage say *recommended for Etsy*.
- **Still shown**, by choice: Label needed and Sold as a set, as well as the
  code, name, folder and the Website tick, so Kay can switch it back.

---

## v1.57.0 - 13 October 2026, 18:00

**An Etsy title and Etsy tags for each Etsy item.**

Two new boxes in the Etsy section, on Add item and Edit item. Nothing is
sent to Etsy yet: they are ready for the Etsy link.

- **Etsy title (optional).** Up to 140 characters, Etsy's limit, with a live
  count. Etsy titles are usually longer than the till's name and lead with
  search words ("Hand-crocheted spider toy, Halloween gift for kids"). Left
  empty, the listing will use the item's name, and the line under the box
  says which name.
- **Tags for Etsy (optional).** Typed with commas between them. Most of how
  Etsy search finds a listing. The line under the box counts them against
  Etsy's 13, and the till tidies them as Etsy needs:
  - the same tag twice, in any mix of capitals, is kept once
  - anything but letters, numbers, spaces, hyphens and apostrophes is
    dropped, because Etsy refuses a listing over one bad tag
  - a tag over Etsy's 20 characters is shown in red and **Save refuses**
    until it is shortened. It is never cut short by the till, because a cut
    tag says something else
  - more than 13: only the first 13 are kept, and the line says so
- Neither is needed for an item to count as ready for Etsy.
- Kept if Etsy is unticked, like the Etsy photos, for when it is ticked
  again. A website item added on Add item never gets them.

`tests/etsy.js` has 15 new checks (50 in all) and `tests/add-item.js` 4 (43
in all), verified against five broken copies: long tags cut instead of
reported, no limit of 13, duplicates kept, characters Etsy refuses kept, and
the title not capped at 140.

---

## v1.56.1 - 13 October 2026, 17:35

**Etsy items show their photo in the stock list and the till.**

Both lists only ever drew the website photo, and an Etsy item has none, so
an Etsy item with real photos still showed 📦.

- An item with **no website photo but with Etsy photos** now shows its first
  Etsy photo (the main one on Etsy) as its picture, on the Stock tab and on
  the Till tab.
- **Read once a session at most.** The photo is fetched from the workspace
  the first time the item is on screen (or taken from the edit form's copy
  if it is already loaded), shrunk to a small list picture and kept in
  memory, so the list never carries a 2000px photo per row.
- Changing which photo comes first updates it.
- **Needs Team sync connected.** Without it the 📦 stays, as before.
- An item that has a website photo keeps showing that one.

---

## v1.56.0 - 13 October 2026, 17:27

**The stock list can be narrowed to where items sell.**

A row of buttons under the search box: **All · Online · Website · Etsy ·
Not online**, each with how many items it would show.

- **Online** is everything on the website or kept for Etsy. An item is never
  on both (the till keeps them apart), so there is no "website and Etsy"
  group: Online is the two together.
- **Not online** is everything sold only at stalls.
- One button at a time. The list keeps its folders, and the search box and
  the 🏷 offers button work inside whichever is chosen.
- The counts follow the folder being worked through, if there is one.
- An empty choice says so, with "Tap All to see everything", rather than
  "No matches".
- Not remembered between visits: the till always opens on **All**, so a
  narrowed list is never mistaken for missing stock.

`tests/channel-filter.js` is new: 19 checks, verified against four broken
copies (Etsy left out of Online, the website flag beating Etsy, an unknown
choice hiding everything, the counts not starting from zero). The till suite
is now 31 files.

---

## v1.55.3 - 13 October 2026, 17:24

**Etsy photos can be taken on the Add item screen.**

- Ticking **Keep this one for Etsy** on Add item now shows the Etsy photo
  strip and **📷 Add an Etsy photo**, with ◀ ▶ to order them and ✕ to remove
  one (no confirm: nothing is saved yet).
- **The photos are held until Add item**, because they are stored under the
  item's code and the item does not exist before then. On Add item they go
  to the workspace and onto the new item in the order shown, and the till
  says how many were added. Like the form's own photo, closing the page
  before Add item loses them.
- **Team sync off:** the button still shows; tapping it explains and offers
  **Open Team sync**. The form stays as filled in on the Add tab. If photos
  are already held and sync has dropped, Add item refuses with a message
  rather than adding the item without them.
- **No photos taken on the form:** Add item opens the new item at its Etsy
  photos, as in v1.55.1.
- The held list uses the same tested rules as an item's (no duplicates,
  Etsy's 10, order kept). If the workspace refuses a photo after Add item,
  it comes back off the item with a message, as on Edit item.

---

## v1.55.2 - 13 October 2026, 17:16

**The Etsy photo button no longer disappears when Team sync is off.**

Etsy photos are kept online, so they can only be taken while Team sync is
connected. Until now the **📷 Add an Etsy photo** button was simply hidden
on a device that was not connected, which looked like the feature was
missing.

- **The button always shows** (until the item has Etsy's 10). With sync not
  connected, the line under it says so, and tapping it explains why and
  offers **Save and open Team sync**: the item is saved through the normal
  Save, everything on the form included, then the till goes to Settings and
  opens Team sync. If Save refuses (a bad set price, say), it stays on the
  item so that can be put right.
- **An item left open catches up with sync.** When Team sync connects, or is
  turned off, while an item is open, its Etsy box is drawn again: the photos
  load and the line under the button changes, with no need to close and
  reopen it.

---

## v1.55.1 - 13 October 2026, 16:56

**Add item can keep a new item for Etsy, and Etsy items get a description
and postage size.**

- **Add item → Etsy → Keep this one for Etsy**, below the Website box. As on
  Edit item, ticking it unticks the website and the other way round.
- **After Add item, an Etsy item opens straight away** at its Etsy photos,
  because they can only be taken once the item exists. A website or
  shop-only item goes back to the stock list as before.
- **Fixed: Etsy items had no description or postage size boxes.** Both sat
  inside the Website section and only showed while "sells on the website"
  was ticked, which an Etsy item never is. They now show while either
  Website or Etsy is ticked, on Add and on Edit, and are labelled
  "Description for the website or Etsy". A new Etsy item keeps them.
- Under the Website tick, an Etsy item now reads "Not on the website: it is
  kept for Etsy" rather than "Shop only".

`tests/add-item.js` has 9 new checks (39 in all), verified against three
broken copies: the website flag set alongside Etsy, the description dropped
for an Etsy item, and the Etsy flag never set.

---

## v1.55.0 - 13 October 2026, 15:50

**Items can be kept for Etsy, each with its own real photographs.**

The till half of selling on Etsy. Nothing is sent to Etsy yet: that link
comes next, once Kay has an Etsy developer key. Until then this is where the
Etsy items and their photos are got ready.

- **Edit item → Etsy → Keep this one for Etsy.** Kept for Etsy means NOT on
  the website as well, so one handmade piece can never sell in two places.
  Ticking Etsy unticks the website and the other way round, with a note
  saying so.
- **Etsy photos of its own.** Etsy will not take AI-made pictures, and every
  website photo has been tidied up with AI, so an Etsy item has a separate
  strip of real photos (up to 10, Etsy's limit), with ◀ ▶ to order them and
  ✕ to remove. The first is the main one. The website photo is **never** sent
  to Etsy and never counts as an Etsy photo.
- **Saved the moment they are taken**, like the extra website photos, so a
  mis-tapped Cancel loses nothing.
- **Bigger than website photos:** up to 2000px on the long side, which is
  what Etsy suggests, stepping down to 1600 or 1200 only if a picture would
  not otherwise fit. A picture under 1000px is kept but Kay is told it is
  small.
- **Ready or not.** The line under the tick says what is still missing, in
  order: a real photo, a price, stock. A stock list row shows an **Etsy**
  mark, solid while something is still missing.
- **Settings → 🧡 Etsy** lists everything kept for Etsy, the ones still to do
  first, each saying what it needs. Tap one to open it.
- **Deleting an item** deletes its Etsy photos too.

**Where the photos go, which is the design.** Several 2000px photos on the
item record would ride along on every sync of every till, which is exactly
what the extras notes (v1.35.0) warn against. So each one is its own document
in a new collection beside items and sales, `etsyPhotos`, keyed by barcode and
fingerprint, and a till reads them only when that item is opened. The record
carries only `etsy: 1` and `etsyPics`, the fingerprints in order. The
workspace rule already covers the new collection, so the Firestore rules do
not change. See SHARED.md.

**Needs Team sync on** to add or see Etsy photos, because the Etsy link will
read them from the workspace. With sync off the box says so and hides the
button.

`tests/etsy.js` is new: 35 checks, verified against six broken copies. The
till suite is now 30 files.

---

## v1.54.0 - 11 October 2026, 02:16

**An orders password hides customers' names and addresses on the Sales tab.**

- **Settings → Website orders → Orders password.** Set one (at least 6
  characters) and each website order on the Sales tab shows
  "🔒 Name and address hidden" with an **Unlock** button instead of the
  customer's name and address. The items, postage and the **Mark posted** /
  **Refunded** buttons still show.
- **Unlock** asks for the password. Names and addresses then show for
  5 minutes, and hide again by themselves, when **Lock now** is pressed, or
  as soon as the till is put away (another app, or the screen goes off).
- **Five wrong tries** and the till waits a minute before trying again.
- **Changing or removing it** needs the current password.
- **Forgot it?** Enter the till's sign-in password (the team sync one)
  instead, and the orders password is removed so a new one can be set.
- Only a scrambled (salted, hashed) form is kept, never the password. It
  travels with the shop's settings in a backup, so a restored till keeps it.
  Each till has its own; set it on every device that collects website orders.
- **What it is not:** a screen lock for the stall, so nobody can read an
  address over Kay's shoulder. The till still downloads the addresses, and
  whoever has the till's sign-in could read them another way.
- No password set means nothing changes: everything shows as before.

---

## v1.53.0 - 10 October 2026, 16:26

**Supplier features are hidden: everything sold is Kay's own work.**

- **Gone from view:**
  - the **Supplier payouts** box in Settings (card fee, website fee and shop
    commission)
  - the **Made by** box on Add item, Edit item, Bulk edit and the new-item
    screen
  - "Made by" on the stock list
  - the **Supplier payouts** part of the sales report, on screen and in the
    exported report
  - the report's **Maker** filter
- **Kept:** **Makers & codes** in Settings, because that is what issues Kay's
  KA- barcodes.
- **New items** are still saved as Kay's when there is only one maker, so
  nothing is missing if suppliers are ever switched back on.
- **Nothing is deleted.** The fields are still stored and the sums still work.
  Switching it back is one line in the till (`SUPPLIERS`).

## v1.52.1 - 10 October 2026, 16:24

**The sales report now shows each website order's goods and postage side by side.**

- **New Website orders sheet** in the report's spreadsheet, and a matching
  section in the CSV: one row per order with the date, order number, receipt,
  **Goods**, **Postage** and **Total**, and a total row. The Total is what SumUp
  took, so each row matches a payment in the SumUp app.
- **The Summary sheet gains Goods (without postage)** next to Postage, so the
  takings for goods are there without working them out.
- The on-screen report shows the same: goods without postage, postage, and
  each website order with its goods, postage and total.

## v1.52.0 - 10 October 2026, 16:01

**Orders paid on the website now arrive on the till by themselves, with
postage recorded separately.**

- **New Settings → Website orders box.** Fill in the website checkout's
  address, and this till starts collecting website orders. It asks once a
  minute while it is open, and straight away when it is opened.
- **Each new order is rung through as a web sale on its own.** Every item is
  its own line at the price the customer paid after any offer, and stock
  comes off. There is no "take it off the shop floor" banner for these, on
  this till or any other, because there is no shop floor: the Website orders
  list is what to post.
- **Postage is its own line**, *Postage (large letter)* or *Postage (small
  parcel)*. It has no stock and no maker, so it stays out of supplier payouts,
  and the report shows it as its own **Postage** total. On screen that's next
  to the takings, in the spreadsheet in the summary, and each postage line is
  in the sales log with the order number.
- **Sales tab → Website orders to post** lists each order with what to send,
  the size, and the name and address to post it to.
  - **Mark posted** once it's sent.
  - **Refunded, not sending** is for after a refund in the SumUp app, for
    example when an item had already sold at a stall. If the till no longer
    had an item, the order says so in red.
- **Only one till ever records an order**, even with two tills open.
- **The old Record a website order button is gone** from the Sales tab. It
  was for a SumUp online store, which this shop doesn't have.
- **Customers' names and addresses are never stored in the till.** They are
  read from the checkout when the panel is shown. Sales and backups carry
  only the order number, and the checkout deletes the details 4 months after
  posting.

## v1.51.0 - 10 October 2026, 14:12

**Each item can now say what size it posts as, ready for the website's basket.**

- **A new Postage size box** under the website description, on Add item and Edit
  item: *Large letter* (fits through a letterbox, up to 2.5cm thick and 750g)
  or *Small parcel*. It starts as *Not chosen yet*.
- **Bulk edit can set it for many items at once.** Tick a whole folder, press
  Edit, and choose the size. *Not chosen yet* there clears it.
- **An item with no size is charged as a small parcel** on the website, so a
  forgotten one never undercharges postage.
- The size goes to the website with the rest of the item (needs the updated
  `kay-shop`). Nothing changes at the till or on receipts.

## v1.50.2 - 10 October 2026, 12:40

**Settings → Card reader now keeps itself up to date.** While Settings is on
screen, the till checks the reader every 15 seconds, and once whenever Settings
is opened, so a reader losing its wifi or signal shows as offline without
pressing Check reader. SumUp can take a minute or so to notice that a reader
has gone, so it is not instant. Nothing is checked while Settings is not on screen.

## v1.50.1 - 10 October 2026, 11:46

**A card reader with no wifi or signal is now spotted, instead of the till
waiting for three minutes.**

SumUp accepts a payment for a reader that is offline and holds it until the
reader comes back, so the till only ever saw "Waiting for the customer to tap".

- **Before sending, the payment service asks whether the reader is online.**
  If it is offline, the till says so straight away and nothing is started.
- **While waiting, the till checks the reader** after 15 seconds and then every
  8 seconds. If it has gone offline, the payment is stopped and the usual
  choices appear: try again, take cash, or Took it on the card machine.
- Readers with software too old to report whether they are online carry on as
  before, with the three-minute give-up.
- Needs the updated payment service (`kay-pay`).

## v1.50.0 - 10 October 2026, 11:14

**The card reader can be paired from the till, so it can go back and forth
between the till and the SumUp app without any help.**

Every time the reader is paired, SumUp gives it a new id. The payment service
used to have that id written into its settings, so pairing the reader again
(for example after using it with the SumUp app at a stall) stopped card
payments working until the settings were changed and the service redeployed.

- **The payment service now asks SumUp which reader is paired** and uses the
  newest one. Nothing has to be changed after a re-pair.
- **Settings → Card reader has a new Pair the card reader box.** On the reader,
  open the menu and go to Connections → API → Connect. Type the code it shows
  and press Pair. The till waits until the reader confirms, then says so.
- **Check reader** shows which reader is in use, and, on newer reader software,
  whether it is online and how much battery it has.
- **If no reader is paired, a card payment says so** and points to Settings,
  instead of failing with a general error.
- Needs the updated payment service (`kay-pay`). Against the old one the new
  buttons only answer "Not found", and payments carry on as before.

## v1.49.0 - 9 October 2026, 19:58

**A card payment taken on the card machine by hand can now be recorded on the till.**

At a stall with no signal, the till cannot reach the card reader, but the card
machine may still take the payment with the amount typed into it. Before this,
the only choices were to try again or take cash, so the sale went unrecorded.

- **When a card payment fails, there is a new button: Took it on the card
  machine.** It asks once more, showing the amount, and records the sale only
  after *Approved - record card sale* is pressed. Press it only once the card
  machine itself shows the payment approved.
- **The sale is saved as an ordinary card sale**, with stock taken off and a
  receipt as usual, but with no SumUp reference, because the till never saw
  the payment. A refund is done in the SumUp app, the same as any card refund.
- **A payment the till started is still watched.** If the till's own attempt
  went through after all, the next time the till opens it says so, which is how
  a customer charged twice would be spotted.

---

## v1.48.0 - 6 September 2026, 18:34

**You can now read an offer in the stock list, and search for one by name.**

The DEAL badge carried the offer's name and terms in a hover tooltip. On the
shop's iPad there is no hover and iOS does not show tooltips at all, so on the
one device that matters the badge said DEAL and nothing on screen said which
deal or what it cost.

- **The offer is written on the row now**, in words: *Kids Earrings - any 2 for
  £5.00*, or *Paired Ring + Paired Bangle - £45.00* for a set. It appears in
  the flat lists - a search, or the tag button - where you are looking for a
  particular thing, and the ordinary folder view stays clean.
- **A deal with a problem explains itself everywhere**, folder view included:
  *Spring Table - any 2 for £25.00 - NOT APPLYING, its items disagree about the
  terms*, in red. Somebody may never press the tag button, and a red badge on
  its own does not say which offer is broken.
- **Searching finds a deal by its name.** Typing *Spring Table* finds its
  members even though no item is called that. Before, searching an offer's name
  found only the items that happened to be named after it, which is a
  coincidence rather than an answer.

14 more checks in `tests/deals.js`, three of which hold the shipped source
against the copies the test reasons about.

---

## v1.47.1 - 6 September 2026, 18:02

**Setting a deal refused the commonest deal there is.**

The **Buy how many** box showed a grey <b>2</b>, which read exactly like a
filled-in 2 - and it was a placeholder. The box itself opened empty, so
ticking some items, typing a name and a price and pressing Apply was answered
with *"A deal has to be at least 2 items"* about a box that looked already
filled. Reported from the counter on the first real attempt at using it.

Three things were wrong and all three are fixed:

- **The box now opens with a real 2 in it.** Nearly every offer is "any 2 for",
  so the common case works without touching it. No placeholder that can be
  mistaken for a value.
- **The hint underneath said "Any 2 of the ticked items for £20" whatever you
  typed.** It read as confirmation of numbers nobody had entered. It now says
  the real ones back - *Any 2 of the 3 ticked items for £5.00* - and while
  something is missing it says which box, or that too few items are ticked for
  the number asked for.
- **The messages name the box** rather than the rule: "Fill in Buy how many -
  2 or more".

---

## v1.47.0 - 6 September 2026, 17:29

**A button in Stock that shows everything on an offer.**

Sets and deals are rules that live on the items rather than anywhere you can
list, so the only way to audit one was to scroll the whole shop looking for
badges. The tag button beside the search box now gathers them: every item in a
set or a deal, in one flat list, each showing the folder it actually lives in.

The members of one offer land **together** rather than in alphabetical order
across the whole list, which is what makes it answerable - *these three are the
autumn offer* - instead of five names with no sign of which belongs to what.

It works with everything around it: search narrows inside it, select mode still
ticks rows, so the normal job of "find the deal, tick its members, Edit them
together" is one screen. A deal that is **broken or expired still appears** -
finding its members is the main reason to reach for this.

**The button only exists when there is an offer on**, and if the last one goes
while the filter is on it turns itself off rather than leaving somebody staring
at an empty shop with no control on screen to explain it.

15 more checks in `tests/deals.js`, including four that hold the shipped
`renderList` against the copies the test reasons about, so the two cannot drift
apart quietly.

---

## v1.46.1 - 6 September 2026, 17:21

**A DEAL badge in the stock list, beside the SET one.**

Until now the only place a deal showed itself was the basket, which meant the
one person who needs to check a deal is set up correctly — whoever set it up —
had no way to see it. Every item in a deal now carries a **DEAL** badge in the
stock list and in the tap-to-add list, and holding a finger on it names the
offer, its terms and how many items are in it.

It has three states on purpose, because a badge that only ever means "fine"
would hide the two cases somebody actually has to find:

- **Blue** — a working deal.
- **Grey** — a deal whose end date has gone by. Still badged, so the items can
  be found and cleared rather than quietly carrying a dead tag.
- **Red, with a warning sign** — the members disagree about the terms, so the
  till will not apply it at the counter. The tooltip says so and says what to
  do: tick them all and set the deal again.

That last one closes a loop. The operator's guide tells staff that if a deal
does not come off they should charge the ordinary prices and tell the owner,
"who can put the deal right in Stock" — and until now the stock list gave the
owner nothing to go on.

16 more checks in `tests/deals.js`, including that a deal tag cannot break out
of the tooltip attribute.

---

## v1.46.0 - 6 September 2026, 17:05

**Any 2 of these 12 for £20 — mix-and-match deals.**

A set price names its members and applies when all of them are in the basket.
A deal names a GROUP and applies to any two of them, so the till has to choose
which two of the basket the saving lands on — and that choice decides which
maker's item is discounted.

The rule is **dearest first**. It gives the customer the larger saving, it is
the reading easiest to defend across the counter, and it is fixed and tested
rather than left to whatever order the stock list happened to be in.

### Nothing is keyed in

Staff scan as normal. The basket re-matches itself on every change, the way set
prices already do, so the deal applies however the items got there and comes
straight back off the moment one is removed. Each line says what came off it,
and the totals name the offer.

### It says when a customer is one item short

Twelve things scattered round the shop is more than anyone can hold in their
head, so a line in a deal is marked as being in one even before it fires, and a
note above **Charge** says how many more are needed. Without that the offer only
ever applies by accident. It names the terms rather than promising a figure,
because what one more is worth depends on which one they bring.

### Setting one up

Stock → tick the items → **Edit**, and fill in the deal box: a name, how many,
and for how much. All the members are written in one action, which is what keeps
them agreeing with each other. The name is picked from a list rather than
re-typed — a tag typed a second way would split one offer into two, silently,
the way "Crafted Gifts" once split the website's category menu.

Setting a deal asks for confirmation and names the makers it will come off.

### Where the money goes

Nowhere new. The saving is folded into each line the same way a set price is,
split across the members in proportion to price, so a maker's payout carries
their own share of it. The shop takes its usual percentage of what was actually
rung up. **No payout arithmetic changed at all**, and old payout reports read
exactly as they did.

The saving does come off the makers, so tell them before a deal goes on the
shelf.

### A deal whose items disagree refuses to apply

The terms are repeated on every member, so an import or a half-finished sync can
leave them out of step. Rather than charge a price half the items have never
heard of, the deal stands aside — and says so on the basket, because a discount
that quietly stops working is the one nobody ever finds out about.

### On the website

Every item in a deal wears the offer on its card, there is a chip and a
`?deal=` link that shows just the things in it, and the product page says what
to do next. An offer is only ever drawn from a live index: one that has expired,
or has fewer members left on the shelf than it asks for, disappears rather than
advertising a price the counter would not honour.

### Under the hood

- 80 new checks in `tests/deals.js`, run against eight deliberately broken
  copies — cheapest-first, the saving not split, the availability pool not
  shared with set prices, a conflict ignored, the tag not folded, no nudge,
  stacking on a hand discount, and a deal that would charge more. All eight
  produce failures.
- `setMatches()` is now a view onto one matcher that does sets and deals against
  a single availability pool, so an item can never be claimed by both.
- Four flat fields on the item — `dealTag`, `dealPick`, `dealPrice`,
  `dealExpires` — deliberately not a map, so the Worker needs no hand-written
  decoder and has no second chance to drop one of them.

---

## v1.45.0 - 3 September 2026, 12:40

**Pressing "Try the card again" can no longer take the money twice.**

A double tap was never the danger - the till refuses to start a second payment
while one is open. The danger is narrower and worse: the request goes out, the
reader is loaded, and the answer never comes back. The iPad sleeps, the wifi
drops, the browser is killed. All the till knows is that it could not reach the
reader, so it offers "Try the card again" - and that press used to start a
second payment for a basket the customer may already have paid for.

### The till now writes down which attempt it is making

A key is written down before the request goes out and sent with it. The payment
service remembers which payment that key produced, so a retry carrying the same
key gets the first payment back rather than starting another - and the waiting
screen says so, because that customer may have tapped already.

The key is dropped the moment the service answers, however it answers: from then
on the payment has an id and the id is the handle on it. It is dropped again if
the operator gives up and takes cash. And it only ever applies to the same
total, for a few minutes - the same total half an hour later is a different
customer, and answering that one with an old payment would record a sale against
somebody else's money.

A till still running an older build sends no key and behaves exactly as it did.

### The payment service writes the record down first

It used to load the reader and then write its record. Between those two there
was a window - the width of one write - in which SumUp held a live payment the
service had no record of: the till could not ask about it, and the callback was
turned away. That order is now reversed.

Two smaller things follow. If SumUp answers and refuses, the attempt is deleted
and the key is free to be used again for a real payment. If SumUp does not
answer at all, the record deliberately stays, because the reader may be holding
the amount at that moment.

### A payment that could not be named can now be rescued

If the call that starts a payment never comes back, there is no transaction id,
and without one SumUp cannot be asked what happened. The callback carries that
id, so it is now read for that one field - and still not believed: it is used to
ask SumUp with the shop's own key, and the answer is thrown away unless it is
for the amount this payment started.

If nothing ever arrives, the payment stops calling itself pending after ten
minutes and reports that it was never confirmed, which the till already turns
into *look in the SumUp app* rather than into a sale or a decline it cannot
support.

Nothing here changes an ordinary card sale. 80 new checks: 57 against the real
payment service and 23 against the real till code, both suites checked against
deliberately broken copies of the code they test.

---

## v1.44.0 - 3 September 2026, 11:37

**Clearing the browser can no longer take the Settings page with it, and the
till now asks the browser not to clear itself in the first place.**

The worry this answers was put plainly: *clearing the web browser clears all the
till information.* Half of that was already untrue and half of it was worse than
feared, so both halves are dealt with here.

**The stock was never the exposed part.** With team sync on, every item and every
sale is in Firestore, and a wiped device pulls the lot back. What was on the
device and nowhere else was the Settings page - and the file that is supposed to
protect a device carried three of its settings and left the rest behind.

### The Settings page now travels in the backup

The one with teeth is the payout arithmetic. Restoring a backup used to leave
the card fee, the website fee and the shop's commission at their defaults, so
the supplier report came back quietly wrong - and 0% commission reads as a
working number rather than a missing one. Somebody hands out real money on that
report.

A backup now also carries the staff list, the promotion codes, the card reader
address, and the team-sync details. It is version 2; a v1 file restores exactly
as it always did.

Three things are deliberately held back, and the restore says so rather than
doing it quietly:

- **The till id** is never written back. It is the receipt-number prefix, so two
  devices sharing one would issue duplicate receipt numbers, silently.
- **The team-sync details** land only on a device that has none - which is the
  wiped-or-new device this is for. They cannot repoint a working till at another
  workspace.
- **The administrator PIN** is not in the file at all. A shop iPad has already
  been locked out of its own Settings by a PIN nobody could produce; restoring
  one from a file months old invites that again. Without it the roles gate stays
  off until somebody sets a PIN, which is the safe direction.

**This also corrects the printed guide**, which said a backup held "settings".
Now it does.

### Installed, not a tab

The app has a manifest and its own icons, so it installs properly on the shop
computer and keeps the Soulful Angels mark on the Home Screen instead of a
screenshot of the page.

This is about **storage**, not about looking like an app. A browser is free to
throw away the site data of a page it thinks is just another tab: iOS clears the
storage of a site it has not seen for about a week, and desktop browsers evict
under disk pressure. An installed app is the signal that stops that - on iOS a
Home Screen app keeps its own storage, away from Safari's, and on the computer
it is what lets the app ask for its storage to be kept. It asks on every load.

**No service worker, deliberately.** A manifest changes where the data lives; a
service worker would change how the app updates, and the Pages cache plus "only
updates on force-quit" is already enough to think about.

Settings now says which of the three answers this device got, because "back up
weekly" carries a very different weight on a device that clears itself. None of
it is claimed as safety: **a person deliberately clearing site data, or a lost
or replaced device, beats all of this, and the weekly backup is still the only
answer to those.**

### Under the hood

`tests/settings-backup.js`, 43 new checks - the table is checked from both ends,
what must be carried and what must never be. **860 checks across 23 files.**

---

## v1.43.0 - 3 September 2026, 09:23

**The till now asks for its weekly backup, and speaks up for the photographs
that have no second copy anywhere.**

There has been a weekly reminder to export the stock spreadsheet since v1.16.0.
There was never one for **Save backup** - the thing that actually protects the
data - so it happened when somebody remembered. This adds the same banner, in
the same clothes, above the export one, because the two are one weekly rhythm
rather than two things to remember separately.

It also speaks for the **extra photographs**, and that is the half with teeth.
Those pictures never sync, by design, and the backup file does not carry them
either - it carries the item records and a count of the main photographs. The
device that took them is the only copy, and iOS clears the storage of an app it
has not seen for about a week. So an extra that has sat un-exported that long is
the only thing in this app that can genuinely be lost, and it now gets said out
loud instead of sitting as a number on the Settings page.

What it does:

- **Overdue backup** - "Weekly backup is due", and the button saves the file.
- **Photographs older than a week with no export** - the banner says how many
  and that they are only on this device, and the button opens Settings, where
  the export lives.
- **Both** - the backup goes first and the message names the photographs too.
  Doing the backup re-runs the decision, and the photographs then get the banner
  to themselves, which walks through both without ever mislabelling the button.

Deliberately the same as the stock export in three ways it would be easy to get
wrong: the first ever run **starts the clock quietly** rather than nagging
somebody who has just opened the app, the cross **snoozes until tomorrow** rather
than dismissing for a week, and the week is only reset once a file has actually
been written or shared - **cancelling the share sheet does not count as a
backup**.

`tests/backup-reminder.js` is new: 24 checks on the decision, which is pure so a
test can reach it. Checked against six deliberately broken copies - one that nags
on first run, one that ignores the snooze, one where the photographs can never
raise the banner alone, one that nags about a picture taken yesterday, one that
sends the button to the wrong place when both are due, and one that says
"1 extra photographs" - and all six produce FAIL lines. Suite 817 checks across
22 files.

**The operator's guide is rebuilt (20 -> 22 pages)** with the rhythm written in:
where the files go, keeping the last six rather than overwriting one, and how to
check a backup really works. It also **corrects a line that was wrong**: it said
a backup holds "items, sales, settings". It does not hold Settings - not the
fees, the commission, the staff list or the reader address - and that is exactly
the page somebody would be reading when it mattered.

The guide now carries the restore trap as well: **restoring on a till that is
connected to team sync does not just change that device.** It pushes the old list
to every other one, and anything added since that backup was taken is deleted
everywhere. So a backup is checked on a computer, in a browser the shop does not
use for the till, never on a connected till.

---

## v1.42.0 - 3 September 2026, 02:25

**A card payment can no longer be lost when the app closes underneath it, and
"Try the card again" is no longer a dead button.**

Two faults in the card reader, both found before the Solo was switched on, which
is the cheapest moment there will ever be to fix them.

**The dead button.** After three minutes of silence the waiting screen offers
"Try the card again" and "Take cash instead". Pressing the first one did
nothing at all: the modal closed, no payment started, and nothing said why. The
give-up path never released the payment it was holding, so starting a new one
ran into the never-two-at-once guard and returned in silence. It now releases
it, and tells the reader to stop as well - by then the reader has long since
timed out on its own, but "long since" is not good enough when the alternative
is a second payment beginning while the first can still take money.

**The payment nobody could ask about.** The id of a payment in progress lived
only in a variable. A refresh, a crash, or iOS ending a backgrounded Home Screen
app took it away, and with it the only handle on a payment that might be about
to take money - the customer charged, the sale never written down, and nothing
on the device knowing enough to go and ask. Card records are kept by the payment
service for two days, so the answer existed; there was simply no longer a
question to ask it with.

The id is now written down the moment SumUp accepts it, and it is **not** rubbed
out until the outcome is known and dealt with. Every path that ends a payment
without an answer - the timeout, Cancel, Take cash instead - deliberately leaves
it behind. Cancel included: cancelling asks the reader to stop, it cannot un-tap
a card presented in the second before.

On the next load the till asks the service what happened, and then:

- **Paid, and the basket still matches** - it offers to record the sale, with
  the code from the card slip. This is the ordinary crash-during-a-tap case, and
  the basket survives a refresh, so it can be finished properly.
- **Paid, but the basket has moved on** - it says so and stops. Recording it
  would write the wrong lines against real money. It names the code so the sale
  can be rung up by hand or refunded in the SumUp app.
- **Still open** - it says nothing and keeps the record, to ask again next time.
- **No longer askable** - it reports it without deciding either way. Only the
  SumUp app knows, and inventing a sale and hiding one are both wrong.

It is a modal and not a toast on purpose. It is the one message in this app that
can mean a customer was charged for a sale nobody wrote down, and a toast nobody
happens to be looking at is the same as silence.

Nothing changed for cash, and a till with no reader address set never sees any of
this.

`tests/card-recovery.js` is new: 48 checks. The decision itself is pure so a test
can reach it, and the asking round it is sliced out as well and given a scripted
payment service - because what is done with the answer is the whole point, and an
id dropped when it should have been kept is a payment nobody ever asks about
again. Checked against seven deliberately broken copies: one that forgets a
payment still open, one that records against a changed basket, one that quietly
swallows a payment it cannot confirm, one where an empty basket counts as a match,
one that throws the record away when the shop is offline, one that reads being
offline as the payment being gone, and one that forgets every time. All seven
produce FAIL lines and none crashes the run. Suite 793 checks across 21 files.

---

## v1.41.2 - 3 September 2026, 01:22

**A way out of a staff PIN nobody has, and a PIN field you can actually read.**

An iPad was locked out of its own Settings by a PIN that had been set and never
seen. The PIN box was a password field, and on iPad the keychain can offer to fill
one with something generated - so it saved, masked, and was gone. The device was a
Home Screen web app, which has no address bar and its own storage, so none of the
usual ways round it existed either.

Two changes:

- **Forgot the PIN?** on the prompt itself. That prompt is the only screen somebody
  locked out can still reach - Settings is behind the very thing they cannot
  answer. It asks to confirm, then clears the PIN and nothing else: no stock, no
  sales, no photographs, and the staff list and their levels stay exactly as they
  were.
- **The PIN is now typed in the clear when you set it**, in Settings, so you can see
  what you are saving. It is still masked when it is asked for. A masked box is what
  caused this, and it also stopped iOS offering to fill it.

This does mean anybody at the device can switch the levels off. That is the honest
position rather than a weakening: it was never a security boundary - the data is on
the device either way - and a speed bump nobody can get past is not a speed bump,
it is a brick.

`tests/roles.js` gains seven checks: that clearing works, that it is safe to do when
no PIN was ever set, and above all that it leaves the staff list, the levels and who
is on the till alone. Suite 745 checks across 20 files.

---

## v1.41.1 - 3 September 2026, 01:11

**Only an administrator is asked for the staff PIN now.**

v1.41.0 guarded the supplier level too, and that was wrong in a way worth spelling
out. A supplier needed the PIN to pick their **own** name - so every supplier had to
be told it - and the same PIN then let them pick an administrator and open the payout
report. One shared secret cannot separate two groups when both groups have to hold it.

Picking a supplier or a till operator now asks nothing. The PIN belongs to the
administrators and nobody below that level has to be told a secret at all.

The trade, accepted deliberately: anybody can pick a supplier name and look at the
stock list. Stock is not what the PIN was protecting - the payout figures and Settings
are, and those are still behind it.

No change to the levels themselves, to what each one sees, or to the three guards that
stop the shop locking itself out. `tests/roles.js` gains four checks pinning down that
exactly one level is guarded and which one.

---

## v1.41.0 - 3 September 2026, 00:50

**Three levels of access, so payout figures are not on screen in front of customers.**

Staff records now carry a role, and the role decides which tabs are on screen:

| | Stock | Till | Sales | Add | Settings | Report |
|---|---|---|---|---|---|---|
| Administrator | yes | yes | yes | yes | yes | yes |
| Supplier | yes | yes | yes | no | no | no |
| Till operator | no | yes | yes | no | no | no |

The sales report is the only place a payout figure is reachable from a tab a till
operator keeps, so it is hidden on its own rather than by taking Sales away. Receipts
and refunds still work at the counter, which is what somebody on the till actually
needs mid-shift.

**It is off until you turn it on.** Set a **Staff PIN** under Settings -> Staff -> Who
can see what, and it comes on; save a blank one and it goes off again. A shop that
never sets a PIN keeps exactly the app it had. The PIN is asked for when somebody
picks a name above till operator - a till operator never sees a prompt, so the common
case at the counter is unchanged. It is a different thing from the Team PIN further
down Settings, which is about syncing.

**What stops it locking you out of your own till.** Three guards, because every one of
these would otherwise need a cleared browser to undo, on a device that may hold the
only copy of that day's sales:

- Every name already on a till becomes an **administrator**. Roles are new; the people
  are not.
- A PIN cannot be saved while nobody is an administrator.
- The last administrator cannot be demoted or removed while the PIN is set.

Picking nobody at all counts as a till operator, not as an administrator - otherwise
tapping the name away at the top of the screen would be the way round the whole thing.

**This hides screens. It does not hide data, and it is not security.** Every device
syncs the whole workspace, so the sales and stock behind a hidden tab are still on that
device and still come out in a backup. What it buys is that payout figures and Settings
are not on display at the counter, and that somebody on the till cannot wander into
Settings and undo something by accident.

New `tests/roles.js`, 38 checks, most of them on the three lockout guards rather than
on the hiding.

---

## v1.40.0 - 2 September 2026, 22:53

**Choose which photograph fronts a card on the website.**

The browsing list folds variants of one name into a single card, and the picture on
it was whichever member sorted first alphabetically. That is the alphabet choosing
the shop window: the Crochet card is six items and three sets, and it fronted itself
with a black bracelet because "Black" comes before "Tan" and "White".

Two ticks, both reading **Show this photo on the shop list**:

- under the item's own photograph, offered only when the item really shares a card
  with others — on a lone item its picture leads whatever anybody ticks
- inside the "Sold as a set" box, for the photograph of the set itself, which is
  what this was asked for

Ticking either unticks the other on the spot, and saving unticks every other member
of the same card. Only one picture can front a card, and a tick that quietly lost an
argument would look broken rather than contested.

Stored as `lead` on the item — `'item'` or `'set'`, absent on nearly everything. ONE
field with two values rather than two separate ticks, so an item cannot be asked to
lead with two different pictures at once. The group is read with `variantSplit`, the
same function the website splits names with, so a tick can never land on a card the
customer does not see.

A set that is taken apart drops the marker with its photograph; the website falls
back to the first picture there is rather than leaving a blank card.

`tests/card-lead.js` is new — 12 checks. The till suite is now 19 files.

---

## v1.39.0 - 2 September 2026, 18:22

**A set can carry a photograph of its own.**

The picture of the things together is the only picture that shows what a set price
actually buys. There was nowhere to put one, so the website borrowed the first
member's — fine while the shop put one pair shot on both barcodes, wrong the moment
each item gets its own photograph.

The "Sold as a set" box on the edit form now has **📷 Add a photo of the set**, with
the same preview and Remove as the item's own. It appears once a partner is picked,
because until then there is no set to photograph. Taking a set apart deletes its
photograph — there is no rule left for it to belong to.

**Where the picture goes, which is the whole of the design.**

- The bytes go in `setPhoto`, a field of its own, and into a THIRD IndexedDB store,
  `setphotos`, keyed by the barcode that owns the rule. Its own store rather than a
  suffixed key in `photos`: a mistake in here must not be able to reach the item
  photographs, which the backups are now the only index of. Database version 3; an
  upgrade adds the store and touches neither of the other two.
- Only the KEY goes inside the rule, as `set.photoKey` — a URL, or `data:` and a
  fingerprint. `shop-worker` projects `data.set` WHOLE on every catalogue rebuild,
  about ten times a day, so a picture in there would cost exactly what `data.photo`
  used to cost before v1.24.0 and nothing would look wrong. See SHARED.md.
- `hasSetPhoto` and `setPhotoCleared` do the same job for it that `hasPhoto` and
  `photoCleared` do for an item's: an empty field means "the picture has not come
  out of IndexedDB yet", never "there is no picture", except when someone has
  actually pressed Remove.

It syncs like an item photograph, so a set photographed on the iPad reaches the
other tills. Five sets at about 97KB each is roughly half a megabyte added to a
full pull; worth watching if the shop ever runs dozens of sets.

The website half is already published: `shop-worker` serves it at
`/photo/:id?set=1` and `shop-site` v0.6.1 shows it, falling back to borrowing a
member's picture exactly as before when a set has none.

`tests/set-photos.js` is new — 25 checks, verified against six broken copies. The
till suite is now 18 files.

---

## v1.38.0 - 2 September 2026, 17:20

**A set can now hold up to four items, not just two.** Some things on the shelf only make
sense sold together as a three or a four — a bracelet, earrings and a necklace — and until
now **Sold as a set** on the item screen would only take one other item, so those had to be
rung up at full price and discounted by hand.

Pick the first item as before and a second drop-down appears under it; fill that one and a
third appears. Three partners is the limit, so a set is at most four items including the one
you are editing. Each drop-down stops offering whatever the others have already taken, so the
same thing cannot go into a set twice, and clearing one clears the ones under it. The line
underneath adds them all up as you go — *Apart: £100.00 (£20.00 + £30.00 + £50.00)* — and still
refuses a set price that is not actually a saving.

At the till nothing looks different, it just counts further: **every** member has to be in the
basket before the price applies, taking any one of them back out puts the full prices back,
and the saving is shared out across all the members in proportion to what each one costs — so
each maker's payout carries its own share of it rather than one of them absorbing the lot.
An item can still only be in one set at a time, and the till says which set is already using
it if you try.

Everything downstream of the till — the website's set picker, the supplier payouts, the
reports — was already written to count the members rather than assume two, so none of it
needed changing. Sets already set up as pairs carry on exactly as they were.

*Also: `tests/sets.js`, 42 new checks covering three- and four-item sets — the matching, the
all-or-nothing rule, the way the saving is split, and two overlapping sets always resolving
the same way.*

---

## v1.36.0 - 2 September 2026, 02:21

**Undo last sale will no longer delete a card sale.** The money for a card payment is with
SumUp, and this app cannot send it back. Deleting the sale left the customer charged with
nothing on the till to show it, threw away the only copy of the card reference the till
keeps, and raised none of the "card refund due" reminders — those only ever get written on
a refund. So Undo now refuses a card sale and offers to **refund** it instead, opening the
refund screen with the whole sale already filled in. The stock goes back exactly as before,
and the reminder to do the refund on the reader appears the way it does for any other
refund.

**Undoing a refund still works, and that matters.** It is the only way back from a refund
given by mistake, so it was deliberately left alone. A refund already marked as sent on the
reader now says plainly that the money has gone and only the record is being removed.

**Undoing a website sale says where the money actually is** — in the online account, not
the till — and clears that order off the "still on the shop floor" list, which it used to
leave behind pointing at a sale that no longer existed.

Nothing else changed: cash and other sales undo exactly as they always have.

---

## v1.35.0 - 1 September 2026, 14:58

**More than one photograph per item.** Edit item now has *More photos for the website*
underneath the existing photo. Take up to six; they show on the product page as a row of
thumbnails under the main picture, and the shop can reorder or remove them.

**These photographs stay on the device that took them until you export them.** They are
not in Team sync and they are not in a backup, and that is deliberate: a till pulls every
item record whenever it reconnects after a change, so photographs travelling with the
records would turn a 1.7 MB catch-up into something nearer 140 MB on shop wifi.

- **Settings -> Export extra photos** writes one file, shared through the normal iOS sheet,
  so on an iPad it goes straight into Google Drive or Files. The PC picks it up with
  `tools/photo-tidy.py --extras`.
- **Settings says how many are not exported yet**, and says plainly that until they are,
  that device is the only copy. If it has no record of an export it counts every one, which
  over-warns rather than under-warns.
- **EVERY iPad that takes extra photographs has to export.** Exporting on one does not
  cover another, because the pictures never leave the device that took them.
- The main photograph is completely unchanged: still taken here, still synced, still on the
  website by itself within 15-30 minutes.
- Extras are saved the moment they are taken, not on Save, so a mis-tapped Cancel cannot
  lose one. The form says so.
- The photo store moves to version 2. Existing photographs are untouched -- proven by
  loading this build onto a version 1 database and reading the photograph back.

---

## v1.34.0 - 29 August 2026, 22:45

### Added
- **The shop can now take its own percentage of every sale.** Settings -> Supplier payouts,
  **Shop commission on all sales (%)**. It comes off each supplier payout on top of the card
  and website fees, and every part of the sum is shown on the report as usual.
- **A supplier can be on their own terms.** Each maker under **Makers & codes** has a
  commission box. Leave it blank and they are on the shop-wide figure; put **0** in it and
  they pay none, whatever the shop rate later becomes. The figure travels between devices
  with the rest of the maker list.
- The report and the payout sheet name the rate they used, per maker, so a supplier can see
  where their number came from. Two new columns in the CSV and spreadsheet exports:
  **Commission %** and **Shop commission**.

### Worth knowing
- **It starts at 0, so nothing changed until you set a figure.** Payouts up to now are
  exactly as they were.
- **The supplier bears both**, which is what was agreed. On a £100 card sale at 20%:
  card fee −£1.69, commission −£20.00, **supplier is paid £78.31** and the shop keeps a
  clean £20.00 whichever way the customer paid.
- **Commission follows refunds down; the card fee deliberately does not.** A card company
  keeps its fee on a refunded sale, so the shop has really paid it - but there is no reason
  the shop should keep a cut of a sale it handed back. A sale refunded in full leaves no
  payout line at all.
- A misc amount - a reading, a deposit - has no supplier behind it, so it never reaches the
  payout table and no commission is taken on it.
- On the report, the **from cash / from card / from website** figures are the money that came
  in; the commission comes off the total underneath them. The total line also shows what the
  shop kept.
- New tests: `tests/payouts.js`, 33 checks, each shown to fail against a deliberately broken
  copy. The export test's reference was updated on purpose for the two new columns.

---

## v1.33.0 - 29 August 2026, 22:00

### Changed
- **The 🌐 Web button is off the Take payment screen.** A till operator taking a counter
  sale had no reason to ever pick it, and picking it by mistake did three things at once:
  booked the money to the wrong channel, paid the supplier at the website fee rate (2.5%)
  instead of the reader's (1.69%), and put the item on the "still on the shop floor" list
  after the customer had walked out with it. Take payment now offers Cash, Card and Other.
- **A website order is rung through from Sales → 🌐 Record a website order.** Put the items
  in the basket on the Till tab as usual, then record it there. Same basket, same stock
  movement, same receipt - only the way in has changed. It opens as **Website order** with
  no payment methods on it at all, so nothing can be switched halfway through.

### Added
- **The sales report can be narrowed to one maker.** A **Maker** picker under the dates:
  *All makers* as it has always been, or any one supplier. Everything on the panel follows -
  takings, sales, items, average, the cash / card / website split, discounts, refunds, top
  sellers and the payout section - and **Print** prints whatever is on the screen.
- The picker is built from whoever actually sold something in the chosen period, so it never
  offers a name with nothing behind it, and it hides itself when there is only one maker. Move
  the dates to a period a maker had no sales in and it falls back to *All makers* rather than
  leaving you looking at an empty report.

### Worth knowing
- **The CSV and spreadsheet exports are unchanged** and still cover the whole shop. The maker
  view is for reading on the screen; the supplier payout section in the export already breaks
  the figures down per maker. The tests that check those files byte for byte still pass.
- With a maker selected, **Sales** and **Avg sale** count whole sales that included something
  of theirs - a basket can hold more than one maker's things - while takings, items and
  discounts are theirs alone. The panel says so on screen rather than leaving it to be assumed.
- **— no maker** is a real choice in the list. It is where a misc amount lands, since a reading
  or a deposit has no supplier behind it.

---

## v1.32.0 - 29 August 2026, 21:45

### Removed
- **"Clear sales history" is gone from the Sales tab.** It sat one tap away from the till,
  beside Export sales, and a confirm box is no protection against somebody tapping through
  it. Three reasons it had to go rather than just move:
  - **It did not clear one device.** With sync on, emptying the list writes a delete marker
    for every sale, so every other till lost them too. It was a workspace-wide deletion
    wearing the words "clear history".
  - **It destroyed the supplier payout figures**, which are worked out from sales - real
    money owed to real people, recoverable only from a backup.
  - **Nothing needed it.** The report is already date-ranged - day, month, year or a custom
    from/to - so a clean figure never required clearing anything.

### Worth knowing
- **Nothing else changed.** Sales, the report, exports, undo and the payout sheet all behave
  exactly as before. The only difference is that the button is not there.
- Undoing a sale still leaves a **gap in the receipt numbers** - undo `S5-0003` and the next
  sale is `S5-0004`. That is deliberate and is not being changed: a receipt may already be
  printed and in a customer's hand, and giving its number to a different sale later is worse
  than a gap. Receipt numbers are per till, so gaps are per till too.

---

## v1.31.1 - 29 August 2026, 21:35

### Changed
- The "sold on the website" box said **"Paid for already."** It now says **"Sold online."**
  The till never sees the payment for a website sale - it only records that one was rung
  through - so it was stating something it had no way of knowing. It would have been wrong
  in two ordinary cases: ringing an item through to hold it for somebody before the money
  is in, and an order cancelled or refunded after the fact.
- What it says now is what the till actually knows: this was recorded as a website sale and
  the stock has come off, so do not sell it again at the counter.

---

## v1.31.0 - 29 August 2026, 21:20

### Added
- **The reminder now works with only one till open.** Ring a web order through and the item
  goes straight onto the "sold on the website" list on that same device, so the banner is
  there until somebody has been and taken it off the shelf. Before this, the list was only
  raised by a sale arriving from a *second* till, which does nothing on a shop running one
  iPad.

### Worth knowing
- **No sound and no pop-up for a sale rung through here** - only the banner. Interrupting
  the person who pressed the button a second ago tells them nothing, and teaches them to
  dismiss the box without reading it, which is the opposite of what is wanted on the days a
  second till *is* open. The flash is still there for a sale arriving from another device.
- It is the **same list, same Got it - off the floor, same storage**, so an order cannot
  appear twice however it arrives - rung through here and then echoed back over sync is
  still one job.
- Misc amounts are left off, as before. An order that is *only* a misc amount - a reading,
  a deposit - raises nothing at all, because there is nothing on a shelf to fetch.

### Worth knowing about the till already
- Selling the same one-off item twice was **already** prevented: adding an item with
  nothing left gives *"- no stock left to sell"* and refuses it. What this banner adds is
  getting the thing physically off the floor and packed - and the case the stock count
  cannot catch, where you hold more than one and only one of them sold.

---

## v1.30.0 - 29 August 2026, 20:30

### Added
- **The till now tells you when something has sold on the website.** Ring a web order
  through on one device and every **other** till flashes it up straight away: what sold,
  its code, and which folder it lives in, so it can be taken off the shop floor before
  somebody buys it again at the counter. Its own three-note sound, so it is not mistaken
  for a scan.
- A red banner above the tabs - visible on every tab, not just Stock - stays until each
  order is ticked off with **Got it - off the floor**. Tap the banner to see the list
  again at any time.
- A basket of three things is **one** job, not three interruptions. The website order
  number is on it where there is one, so it can be matched back to the store's order list.

### Worth knowing
- **It needs team sync on, and two devices.** It is the arrival of the sale from another
  till that raises it; the device the sale was rung through on is never told, because the
  person using it is holding the thing.
- **Nothing here talks to the website**, exactly like the website list. It rides on the
  sale record the shop already makes, which is why it works today with nothing bought and
  nothing switched on at SumUp. When the shop's own checkout arrives it writes that same
  record, and this fires with no human in the loop at all.
- A sale more than **twelve hours old never flashes up**. Connecting to sync hands the
  till the whole sales history at once, and without that limit opening a till on Monday
  morning would flash up every web sale the shop has ever made.
- Refunds do not raise anything - stock coming back is not a job anyone has to be pulled
  off the counter for - and neither do misc amounts, which were never on a shelf.
- A job left waiting **survives a reload**, and ticking one off is remembered, so a
  reconnect cannot raise the same order twice.
- New tests: `tests/web-sold-alert.js`, 43 checks. See [Tests](tests/README.md).

---

## v1.29.0 - 29 August 2026, 17:35

### Added
- **One description for a whole group of variants.** When an item's name puts it in a group
  - anything with the em dash in it, like `Wind Spinner — Blue` - and the others in that
  group already have a website description, a tick appears above the description box:
  **"Use the same description as the other 5 in Wind Spinner"**. Tick it and the box fills
  with what the group says and greys out; untick it and whatever you had typed comes back.
  It is on the Add form and the Edit item form.
- **Changing one of them offers to change the rest.** Save a description that the others in
  the group still hold the old version of, and the app asks whether to update them too, with
  the number spelled out. Say no and nothing else is touched.

### Worth knowing
- It **copies the words**; it does not link the items. Each variant keeps its own
  description on its own record, exactly as before, so nothing about exports, the website
  feed or sync changes. Nothing is stored to say a description is shared - the offer on
  save is what keeps a group together afterwards.
- Only variants **still saying the old thing** are offered. One you have written separately
  is left alone, and so is one with no description at all - never having had a description
  is not the same as having this one.
- Why it matters: the website shows whichever variant the customer picked out of the
  dropdown, so a group whose descriptions disagree makes the words change under them as
  they click through the colours.
- The offer is always a tap. Nothing is rewritten on its own, for the same reason a hyphen
  is never quietly promoted to an em dash: two products can look like variants of each
  other without being it.

---

## v1.28.0 - 29 August 2026, 15:20

### Changed
- **The website description box opens up when you tap into it.** On both the Add form and
  the Edit item form it sits at three lines while you are looking past it, and grows to
  about nine while the cursor is in it, so you can see what you have written without
  scrolling a two-line window. It shrinks back on its own when you move to the next field.
- In the Edit item form the box is inside a panel that scrolls, so when it grows the app
  nudges it back into view - it will not open out of sight below the bottom of the panel.
- Dragging the bottom-right corner still works and still wins: pull the box taller than it
  opens to and it keeps that size, cursor in it or not.

---

## v1.27.0 - 29 August 2026, 13:55

### Added
- **A misc amount can be charged for now: anything that was never stock.** A reading, a
  workshop deposit, a repair, postage. Tap **📝 Misc amount** on the Till, put in the amount
  and say what it is for, and it goes into the basket like an item. It is then paid for
  exactly the way everything else is - cash, or **sent to the card reader with the rest of
  the sale**, which is the point: there is no more taking the till total on one machine and
  the reading on another.
- **The description is not optional, and it is the whole reason this is safe to use.** It
  goes on the customer's receipt, it is what the sale is called in the sold list, and it is
  written out in full on the sales report and in the spreadsheet export. A sum of money on
  the report that nobody can account for would be worse than not taking it here.
- **Nothing comes off the shelf.** A misc amount was never on one, so the stock count does
  not move, and the item does not have to exist. Refunding one puts nothing back either.
- Two misc amounts in one sale stay two lines. They are different things, and folding them
  together would throw one of the descriptions away.

### Changed
- **The sales report has a Miscellaneous section.** It lists every misc amount taken in the
  period - date, receipt, what it was for, how it was paid - with a total. In the CSV and in
  the spreadsheet it is a section of its own between *Top sellers* and *Supplier payouts*;
  in the workbook it is a fourth sheet.
- **Misc money counts in the takings but not in *Items sold*.** It never came off a shelf,
  so counting it there would put the report at odds with the stock, and it has no business
  in *Top sellers* either. The **Miscellaneous** figure in the summary is what reconciles
  the two, and it only appears when there was any.
- **Misc money is kept out of the supplier payouts.** There is no supplier behind a reading
  or a deposit and there never can be, so leaving it in would inflate *Total to pay out* -
  a figure somebody acts on with real money.
- A shop that never takes a misc amount gets a byte-for-byte identical report file to the
  one it has always had. All three additions are written only when there is something to
  write.

### Tests
- `tests/misc-amount.js`, 67 checks. It slices five separate blocks out of `index.html` -
  the basket line, set pricing and the totals, completing the sale, the report figures and
  the supplier payouts - because the feature has to hold in five places that know nothing
  about each other. `tests/sales-export.js` grew from 76 to 95, including a byte-for-byte
  reference for the new report section and a four-sheet workbook.
- Checked against ten deliberately broken copies, one per guard, and all ten were caught.
  Two of them cover the same thing from either side - a misc line is kept out of a set
  price twice over - so that pair has to be removed together before anything notices.

---

## v1.26.0 - 29 August 2026, 12:08

### Added
- **The label wording can be tapped now, the same way a folder is.** *Label needed* was a
  plain box with a quiet list behind it that only appeared once you had typed the first
  letter of a wording you already use - and there is no guessing the first letter of a
  wording somebody else wrote. It now has the same folded-away **Choose label** button the
  folders got in v1.25.0: tap it and every wording the shop already uses is there to tap,
  each with how many items ask for it. Tap one and it folds back up showing the choice.
- Typing still works and still narrows the list, and a wording nobody has used yet reads
  **new** on the button, so a fresh one is deliberate rather than a slip.
- The button only appears once something has been labelled - on a shop with no labels yet
  there is nothing to offer, and the box is exactly as it was.

---

## v1.25.0 - 29 August 2026, 11:28

### Changed
- **The list of folders is folded away until you ask for it.** On the Add tab, the New item
  box and Edit item, the folder buttons used to sit open under the Folder box - three dozen
  of them, a wall to scroll past on the way to the quantity and the price. There is now a
  single line there instead, saying **which folder the item is in**, with **Choose folder**
  on the right. Tap that and the same list of buttons opens exactly as before; tap one and
  it folds back up showing what you picked.
- Nothing about picking a folder has changed - the maker's own folders are still offered
  first, *Show all* still widens it to the whole shop, and typing still works. It is a
  button rather than tapping into the Folder box on purpose: tapping the box throws the
  on-screen keyboard up over the folders you came to look at.

---

## v1.24.0 - 29 August 2026, 10:33

### Changed
- **Photographs stop costing the website money.** Nothing looks any different in the app.
  The shop's website rebuilds its list of stock out of the same database this till writes
  to, roughly ten times a day, and it was fetching **the whole photograph of every item**
  each time it did. A picture taken on the till is stored on the item as about 97KB of
  data, so fourteen photographed items meant 1.4MB dragged across the internet on every
  rebuild - including for items that are not even on the website.
- With about a hundred more photographs to take that would have been **roughly 2.9GB a
  month against a 10GiB allowance**, and it never comes back down: every new photograph
  joins it and none of them ever leave.
- The till now stores a short **key** beside each photo - a few characters saying *which*
  picture it is rather than the picture itself - and the website reads that. The rebuild
  now carries a few dozen bytes per item instead of a hundred thousand.

### Worth knowing
- **The first time this build connects it will re-send every item once.** That is the key
  being added to each record. It is a normal sync, it costs nothing, and it happens once.
- **Take the ~100 photographs after this build is on the tills, not before.** That was the
  whole reason for doing this first.
- Photographs already on the website keep working while the records catch up, and a device
  still on an older build cannot break them.
- 19 new checks in `tests/photo-keys.js`, and the key is pinned against the two other
  places the same fingerprint is worked out - `shop-worker` and `tools/photo-archive.py` -
  because if those three ever disagree every embedded picture quietly stops being served
  from the website and goes back to being fetched out of the database one at a time.

---

## v1.23.0 - 28 August 2026, 15:20

### Added
- **A way to say "this is the same thing in another colour".** Seven wind spinners in
  seven colours are still seven items in here, each with its own code, count and price —
  but the website can now show them as **one card with a dropdown** instead of seven
  near-identical cards in a row.
- The way you say so is the item's **name**: `Wind Spinner — Blue`, `Wind Spinner — Red`.
  Everything before the long dash is the card; everything after it is what the customer
  picks from the list.
- **You do not have to type that dash.** Under Item name, on all three places an item can
  be created or changed, there is now a row of buttons:
  - **➕ Colour, size or scent** puts the dash in for you and leaves the cursor where the
    colour goes.
  - **Groups you already have** appear as buttons the moment you start typing a name that
    matches one, so the second wind spinner is one tap.
  - If you type an ordinary hyphen where the long dash was meant, and the front of it is
    a group that already exists, it offers to swap it. Tapping is the only way it
    changes — it never rewrites a name on its own.
- The line under the box says what the website will do with the name as you type it, so
  there is no publishing and checking to find out.

### Worth knowing
- **Nothing about the till changes.** Each colour keeps its own barcode, its own count
  and its own price. Stock takes, sales, receipts, the export and supplier payouts all
  see seven separate items exactly as before.
- **Give each colour its own photograph.** Picking a colour on the website swaps the
  picture, so a group where only one has a photo looks broken.
- **Every colour still needs its website tick** — one that is not ticked simply will not
  be offered in the list.
- **Do not reuse the front of a name for something unrelated.** `Wind Spinner — Spare
  Hook` would be offered to customers as if it were a colour.
- If all but one of a group sells out and is deleted, the last one goes back to being an
  ordinary card showing its full name.

---

## v1.22.0 - 28 August 2026, 11:47

### Changed
- **Photos you take are now saved at a decent size for the website.** They used to be
  shrunk to 400 pixels; they are now 640, which is exactly the size of the pictures
  already on the website, so a photo you take sits beside those instead of looking soft
  next to them.
- The old limit was there because photos used to be kept in the browser's small storage,
  where one phone photo would have filled the lot. They have not lived there for a long
  time, and the number was simply left behind.
- A phone photo of 3024x4032 comes out 480x640 and about 97KB; a wide one of 4000x2250
  comes out 640x360 and about 27KB. Nothing else about taking a photo has changed.

### Worth knowing
- **Only photos taken from now on.** Nothing you have already is touched, re-saved or
  re-processed.
- Backups carry your photographs, so a lot of re-taken photos will make the backup file
  bigger — roughly 10MB per hundred, against about 3MB before.

---

## v1.21.0 - 28 August 2026, 10:41

### Added
- **The folder buttons are now on all three places an item can be created or changed** —
  the Add tab, the New item box that appears when you scan something unknown, and Edit
  item. Before this they were only on Edit item.
- **Fill in Made by and the buttons narrow to that person's folders.** Put Kay in and you
  are offered Kay's folders rather than the whole shop's. Change the name and the offer
  changes with it.
- It is only ever a first offer, never a wall: there is a **Show all … folders** button on
  the end, typing overrides it, and the folder an item is already in is never hidden even
  when it belongs to somebody else.
- A person with no folders yet — or no name filled in — simply gets the full list, so a
  new maker is never shut out of the shop's folders.
- **Generate a code and it all lines up at once:** picking Kay fills in the code, the Made
  by, and a `Kay/` folder to finish, with Kay's folders already listed underneath.

### Worth knowing
- Nothing about how folders work has changed, and no folder is ever hidden from you
  permanently — this only changes which ones are offered first.
- The buttons refresh as soon as a new folder exists, so an item added into a brand new
  folder puts it on the list for the next one straight away.

---

## v1.20.0 - 28 August 2026, 10:28

### Added
- **You can now do a stock take one folder at a time.** Tap **New count**, tick one
  folder, and the Stock list shows only that folder until you say otherwise — with a bar
  across the top telling you which one you are on and how far through it you are:
  *"1 of 3 counted · 2 to go · 2 in stock · £40.00"*, with a progress bar.
- Ticking one folder and tapping **Reset ticked folders only** now drops you straight
  into that folder, instead of leaving you to find it again in the whole list.
- There is a second button, **Just work through it — keep the counts**, for carrying on
  with a folder you have already started rather than wiping it and beginning again.
- **Tap Show all stock to come back to the whole shop.** Nothing is stuck: the app
  remembers which folder you are on if you close it and come back, and a full stock take
  clears it.
- While you are working through a folder, **searching searches inside that folder**, and
  scanning something that lives somewhere else still counts it but says so —
  *"Selenite tower → now 5 — not in 📁 Bracelets"* — so a stray tray gets noticed.
- Something unknown scanned while you are in a folder now starts with that folder
  already filled in on the new item form.

### Worth knowing
- **This only changes the Stock list.** The Till still sells the whole shop, sales and
  exports are unaffected, and the counts themselves are the same numbers as ever.
- **It is this device only.** The phone can work through Bracelets while the till shows
  everything — it is not sent to your other devices, in the same way that which folders
  are open is not.
- **"Counted" means the item has a number against it.** The app cannot tell a genuine
  zero from one nobody has reached yet — it never has — so the bar counts an item as
  done once it has been given a count, and the wording says exactly that.
- If every item in the folder you are on is moved out or deleted, the app steps back to
  showing all stock and tells you why.

---

## v1.19.0 - 28 August 2026, 09:53

### Added
- **Edit item now shows you the folders you already have.** Under the Folder box is a
  row of buttons, one for each folder in use, with the number of items in each — tap one
  and the item goes there. No more remembering exactly how a folder was spelt, or which
  ones exist.
- The folder the item is in now is the highlighted one, so you can see where it sits
  before you move it. There is a **No folder** button at the front for taking an item
  out of every folder.
- **Start typing and the buttons narrow down to what matches.** Type "bra" and you get
  the Bracelets ones. Typing still works exactly as before — a folder that does not
  exist yet is made by typing it, and using / still makes a subfolder.

### Worth knowing
- Nothing about how folders work has changed — this is only a quicker way to pick one.
  The Add tab and the bulk Move to folder box are untouched.

---

## v1.18.0 - 28 August 2026, 03:32

### Added
- **Every item can now carry the label it needs.** A new **Label needed** box on each
  item, under Price each — free text, whatever wording suits you: "Small swing tag",
  "Large barcode label", "No label, engraved". It is on all three places an item can be
  created or changed: the Add tab, the New item box that appears when you scan something
  unknown, and Edit item.
- **It comes out in the stock export as a new Label column**, in both CSV and Excel, on
  the end so every column that was already there is where it was.
- The box offers back the wordings you have used before, the same way the Folder box
  does, so the same label does not end up written three different ways.

### Worth knowing
- **This is never sent to the website.** Not in any form: the website's data is built by
  naming the fields it may have, one by one, and this is not one of them. There is now a
  test in the website's own code that fails if anyone ever adds it.
- It **does** travel between your own devices with team sync, and it is kept in backups
  and carried through an item import — it is your record, it just never leaves the shop.
- An item with no label has no label. The box left empty means nothing is stored, and the
  column comes out blank rather than saying anything.

---

## v1.17.0 - 28 August 2026, 03:18

### Added
- **The stock export asks CSV or Excel too.** Settings → Your data → **Export stock take**
  (it used to say Export CSV), and the weekly reminder banner's button with it.

### Changed
- **Money in the Excel files is now formatted as pounds** - £12.50 rather than 12.50.
  Every money column gets it: prices, discounts, takings, counted values, supplier
  payouts and fees. Quantities and item counts are left alone, because a £ in front of
  them would be wrong.
- The cells are still **real numbers**, so they add up exactly as before. The pound sign
  is the cell's format, not text typed into it.

### Worth knowing
- **The CSV files still hold plain numbers** - 12.50, not £12.50. A CSV is plain text and
  has no number formats to set; a pound sign in it would be a character sitting in the
  data, which stops other systems reading the column as a number. Open the Excel version
  for pounds, or format the column in Excel after opening the CSV.
- One small difference in the stock CSV: the item count in the TOTAL row is now quoted
  like every other cell in the file. Nothing that reads CSV can tell the difference.
- The weekly export reminder now only resets when a file is actually saved. Opening the
  chooser and cancelling leaves the reminder where it was.

---

## v1.16.0 - 28 August 2026, 03:04

### Added
- **The sales exports now ask whether you want CSV or Excel.** Both export buttons - the
  **Export sales** button on the Sales tab and **Export** in the sales report - now offer
  a choice. Nothing else about them changed.
- **The Excel file is a real spreadsheet, not a renamed CSV.** Prices and takings arrive
  as numbers, so you can select a column and see it added up, or write your own sum
  against it. The heading row is bold and stays put when you scroll, and the columns come
  out already wide enough to read.
- **The sales report becomes three tabs in one workbook** - Summary, Top sellers and
  Supplier payouts - instead of three lumps stacked in one column.

### Worth knowing
- **The CSV files are exactly what they always were**, down to the byte, so anything you
  or the accountant already do with them is untouched. There is a test that checks this
  against the old code rather than taking anyone's word for it.
- **Barcodes and order numbers stay text** in the Excel file. Written as numbers they
  would lose a leading zero, and then they would no longer match anything in the till.
- Excel opens either format. CSV is still the one to pick if the file is going into
  something else - most other systems read it and not much else.
- Nothing is downloaded from anywhere to do this: the app writes the .xlsx itself, so it
  still works with no internet.

---

## v1.15.0 - 26 August 2026, 09:41

### Changed
- **Opening the app no longer re-reads the whole shop from the database.** With team sync
  on, every load used to fetch every record and every deleted-record marker - around five
  hundred documents - however little had changed since the last time. It now asks one
  cheap question first: what is the most recently changed record? If nothing has moved, the
  same records are read from the copy already on the device instead.
- **A normal load costs one read instead of about five hundred.**

### Why this mattered
- The database's free daily allowance is 50,000 reads and the website's shop page is
  budgeted 40,000 of it, which left the till roughly **twenty app loads a day**. Two people
  on a shop day went through that, and when the allowance ran out **the website's shop page
  went down** - which is exactly what happened on 25 August.
- Nothing about your data changed, and nothing syncs differently. The app reads the same
  records; it just stops paying for them twice.

### Worth knowing
- **It re-reads properly whenever it should.** Anything changed on another device, a
  different team code, a cleared browser, or the database declining to answer all send it
  back to a full read. The rule is that not knowing is never treated as nothing-has-changed.
- If the device cannot keep a local copy at all - some private-browsing modes, or the same
  workspace open in several tabs - the app works exactly as before and now says so in the
  browser console instead of staying silent about it.

---

## v1.14.0 - 26 August 2026, 01:58

### Changed
- **The shop's photographs are now our own, and the app shows those.** Nearly every item's
  picture was never held here at all - the record stored a *link* to an image on SumUp's
  servers, and nothing else. **SumUp deletes that image when its listing is deleted.** Forty
  had already gone that way, and closing the SumUp store - the last step of the website plan
  - would have taken every remaining one down at once, with nothing anywhere to restore.
- All 477 photographs were downloaded, kept as masters, and republished at the shop's own
  address. The app now asks for ours when it draws a thumbnail.
- **They are about a tenth of the size**, so the stock list loads noticeably quicker on shop
  wifi. The originals were 640-pixel pictures saved as PNG, a format meant for flat-colour
  graphics rather than photographs; the same picture as WebP is a fraction of the weight and
  looks identical.

### Worth knowing
- **Nothing in your data changed.** The swap happens when a picture is drawn, not in the
  record. No sync, no migration, nothing to go wrong on the other till.
- **A photograph taken since this went out has no copy of ours yet**, so the app quietly
  falls back to the original. Nothing breaks; it is just the old, slower picture until the
  next publish.
- **The till was the last thing tied to SumUp's servers.** The website was moved earlier the
  same night. Closing the SumUp store is now safe to do, which it was not before.

---

## v1.13.0 - 25 August 2026, 22:31

### Added
- **Settings -> Tidy up old deleted records.** Deleting an item does not remove it from the
  team workspace; it leaves a marker behind so the other till learns the item went. Nothing
  ever cleared those markers, and by today they were **more than half the workspace - 1044
  records for 478 items**. Every till reads the whole lot each time it connects, so the
  markers were costing a database look-up each, per device, per load. That is what used up
  the free daily allowance and took the shop website down.
- The tidy-up asks only for the markers rather than the whole collection, so checking costs
  a look-up per marker instead of one per record.

### Worth knowing
- **It cannot reach a real item.** A record only qualifies if it is flagged deleted *and*
  carries no item data. Both conditions, every time, and a test holds each one.
- **Markers from the last 30 days are kept on purpose.** A till that has not synced since an
  item was deleted still has that item, and the marker is the only thing that will ever tell
  it otherwise. Clear the marker too early and that till puts the item back for everybody on
  its next sync. The confirmation says so, and so does the warning above the button.
- **Save a backup first, and open both tills before running it.** The one on the screen is
  not the one at risk.
- It needs team sync connected, and refuses politely if it is not.

---

## v1.12.0 - 25 August 2026, 18:27

### Added
- **Adding an item now puts it on the website in one go.** The Add form has the same
  **Website** box the edit screen has, and it is **already ticked**. Untick it for anything
  that is shop only. Before this, a new product had to be added, then found again in the
  list, then opened and ticked - which is a step that only ever got forgotten.
- **A description for the website** on the same form, so you can write it while the thing is
  in your hand rather than going back for it later.

### Fixed
- **A new item no longer arrives on the website as sold out.** The starting quantity now
  sets the counted figure as well. It did not before, and the consequence was worse than it
  sounds: the website works out available-or-sold-out from the counted figure, so every
  brand new product appeared online as sold out the moment it was added. An item you are
  adding is one you are holding.

### Worth knowing
- **Give it a two-level folder** - `Kay/Bracelets`, not just `Bracelets`. The website takes
  its category from the second level; the first is the maker's name, which customers never
  see. A one-level folder means the item only turns up under "Everything".
- **The website list will still ask you to add it.** That list is about the SumUp store,
  which is updated by hand. Our own site has it already, within a quarter of an hour.
- Ticking the box records that the item sells online. It does **not** send anything anywhere.

---

## v1.11.0 - 25 August 2026, 12:10

### Added
- **A starting count for stock nobody has counted yet.** Where the website is showing
  something as available, that is evidence at least one exists, and one is a better starting
  figure than a zero that only ever meant "nobody has looked". Comes in through the same
  import, alongside the website wording, in one go.
- **A count you have already taken is never overwritten.** An item with a real figure on it
  keeps it and is reported as left alone. Somebody standing at the shelf beats anything worked
  out from a web page, so the shelf always wins.
- The starting figure moves **counted, starting quantity and the website quantity together**.
  Raising the count on its own would put every one of those items straight back on the website
  list as *0 → 1 in stock* — hundreds of jobs that are not real.

### Worth knowing
- This is not a stock take and does not pretend to be. It gives the uncounted items a sensible
  place to start so the first real count is a correction rather than a blank page.
- Like the website wording, it cannot reach a name, a price, a photo, a maker or a folder, and
  will not create an item the device does not have. Only whole numbers of zero or more.
- `tests/import-items.js` now runs 66 checks. The three that matter most were each confirmed to
  fail against a deliberately broken copy first: one that overwrote real counts, one that let
  the file write any field, and one that left the website quantity behind.

---

## v1.10.0 - 25 August 2026, 12:00

### Added
- **The website's own wording can be brought in for items you already have.** Import a file
  holding website text and the app writes each description onto the matching item, several
  hundred at a time, instead of one at a time by hand. It says how many it will change and
  asks first.
- This is the only thing that can write to an item that already exists, and it is held to the
  website description alone. **A name, a price, a count, a photo, a maker or a folder cannot
  be changed this way**, even if the file tries — worth knowing, because these files are put
  together outside the app.
- Items already carrying the same wording are counted as unchanged rather than rewritten, so
  running the same file twice does nothing the second time.

### Worth knowing
- Importing new items is unchanged and still adds only. The two jobs are told apart by what is
  in the file, so an ordinary items file can never start a wording update by accident.
- `tests/import-items.js` now covers both. As before, every check was confirmed to fail against
  a deliberately broken copy first — one that let the file write any field it liked, and one
  that created items the device did not have.

---

## v1.9.0 - 25 August 2026, 01:19

### Added
- **Import items now says what it is about to do, and asks first.** It shows how many are
  new, how many are already on this device, and how many share a name with something on the
  list, then waits. The numbers in the box are worked out from the same plan that gets
  applied, so what it says is what happens.
- **An import carries the website fields across** — *sells on the website*, and the quantity
  and price the website is showing. Items brought in from the shop window now arrive already
  knowing they are listed, so the website list stays quiet instead of filling with dozens of
  *Put it on the website* jobs for things that have been on it for months.

### Changed
- **Photos in an import file must be a `data:image/...` or `https://` image.** Anything else
  is dropped and the item comes in without a photo, and the confirm box says how many. An
  import file comes from outside the app and every one of those strings ends up in an image
  tag.

### Worth knowing
- Import has always added only, and still does: a barcode already on the device is left
  exactly as it is, never overwritten and never merged into. Running the same file twice does
  nothing the second time. This is the opposite of **Restore**, which replaces everything —
  use Import to add, Restore only to put a whole device back.
- Covered by `tests/import-items.js`, which runs the real code out of `index.html`. Each
  check was confirmed to fail against a deliberately broken copy before being kept.

---

## v1.8.0 - 24 August 2026, 23:05

### Added
- **The till now keeps track of what the website has been told.** Tick **This one sells on
  the website too** on an item, and from then on the app knows the difference between what
  the website is showing and what is actually on the shelf.
- **A website list at the top of the Stock tab**, whenever something needs changing over
  there. Selling the last one at the counter puts it straight on that list as *Sold out —
  take it down*, which until now was the one thing nobody was told about.
- Each line says exactly what to go and do: *2 → 1 in stock*, *£35.00 → £40.00*, *Put it on
  the website — 3 in stock at £25.00*, *Take it off the website*. Sold-out items sort to the
  top, because those are the ones the website can still take an order for.
- **Tick a line off once the change is made there.** That is all ticking does — it records
  that the website now matches. Nothing in the app can reach the website.
- **A 🌐 on items that sell online** in the stock list, filled in when that one is waiting
  for a change.
- **A description for the website** on each item, longer than the shop label. Nothing uses
  it yet; it is there so it can be written up as stock is handled rather than all at once.
- **Sells on the website is in the bulk editor**, so a whole folder can be marked in one go.
  For marking up stock that is *already* listed correctly: mark them, open the website list
  and use **Tick everything off**.
- Deleting an item that is on the website now says so, because once it is deleted the
  website list can no longer remind you it is up there.

### Notes
- **This still does not talk to the website.** It cannot — SumUp's online store has no way
  in for us. What it does is make sure nobody has to remember, and that what is left to do
  is written down rather than carried in someone's head.
- The list is worked out fresh every time from the stock itself, so it cannot drift out of
  step the way a to-do list would. There is nothing to tidy up and nothing to go stale.
- Web sales rung through the **🌐 Web** button take stock off the shelf like any sale, so
  they land on this list too — the website's own count still needs changing by hand.

---

## v1.7.1 - 24 August 2026, 22:47

### Fixed
- **A backup can no longer be saved without the photos in it.** Photos are held separately
  from the rest of the stock list and load a moment later. Tapping **Save backup** in that
  moment produced a file that named every item, looked the right size, and contained not one
  photo. The backup now waits for the photos, and if any genuinely cannot be read it refuses
  to write the file at all rather than hand you something that is not a backup.
- **Restoring a backup no longer deletes photos.** Restoring one of those photo-less files
  wiped every photo on the device for good — the app read "this item has no photo" as
  "delete this item's photo". The same thing could happen when a record arrived from the
  other device without its photo attached. An item turning up with no photo now means
  *nothing was said about a photo*, and the one already here is kept and put back.
- **The only things that delete a photo now** are deleting the item, and pressing
  **Remove photo** and saving. That press is recorded on the item, so it still travels to
  the other device properly.
- **The edit form waits for an item's photo** before it opens the photo box empty. Saving
  an item whose photo had not loaded yet used to read as removing it.

### Added
- **Photo counts wherever backups are mentioned.** Saving one says *Backup saved — 494
  photos*, and restoring says how many photos the file holds beside the item and sale
  counts. A file with no photos in it is now obvious before it is restored, not after.
- If a backup carries fewer photos than the device already has, the restore box says so and
  says the ones already here are kept.

### Notes
- Backups now record the photo count in the file. Older backups are still restorable exactly
  as before, and are now *safe* to restore — with this build, restoring the photo-less backup
  that caused this no longer loses anything.

---

## v1.7.0 - 24 August 2026, 16:40

### Added
- **A Web button at the till, next to Cash and Card.** Something sold on the website gets
  rung through exactly like a sale at the counter — scan or tap the item, tap **🌐 Web**,
  and the stock comes off the shelf, the sale is recorded and a receipt number is issued.
  It is the only way stock stays honest when the same shelf is being sold from twice.
- **A box for the website's order number**, optional, on that same screen. It prints on the
  receipt as "Order no." and lands in the sales CSV in a column of its own, so a sale in
  the app can be matched back to the order in the SumUp store without guessing from times
  and amounts.
- **Website money is counted on its own.** The report shows a 🌐 Website figure beside
  Cash and Card, and the report CSV carries it. It is deliberately not folded in with
  ✨ Other: that money is not notes in the till, and it did not come off the reader either.

### Notes
- **Payouts take the website's own fee, not the reader's.** Settings → Supplier payouts now
  has a second percentage for website sales, starting at 2.5%. **Check what yours actually
  is on the SumUp dashboard** — the online rate is not the in-person one, and paying a
  maker at the reader's rate would hand them money the shop never received.
- Website money settles into the bank, so it appears on the payout sheet under
  **from the bank**, on its own line beside card. Nothing about it comes out of the till.
- Same rule as card: the fee is taken on website **sales**, not sales net of refunds.
- A refund of a website sale stays a website sale, so it comes off that column rather than
  off the till.
- The four payment buttons now sit two by two instead of in one cramped row.
- **The website is not told anything.** Selling the last one at the counter does not reduce
  the website's stock, and the site could still take an order for it. That side is still
  done by hand.

---

## v1.6.0 - 24 August 2026, 16:05

### Added
- **Set prices.** Two items that cost less bought together than bought apart. Scan or tap
  both and the till spots the pair on its own, drops to the set price and shows a
  **🎁 Set price** line so it is obvious it happened. Take one half back out and the
  saving comes off again — nothing is remembered from the scan, the basket is re-checked
  every time it changes.
- **Set up on the item, under "Sold as a set."** Open one of the two items, pick the item
  it is sold with, and give the price for the pair. The box shows what the two cost apart
  and what the customer saves before you save it. Open the other half and it tells you
  which item the set is defined on rather than offering a second box that could disagree
  with the first.
- Items in a set carry a **🎁 SET** badge in the stock list and in Quick Sell, so it is
  visible before you get to the basket.
- Receipts print the set saving as **set price** on its own line, separate from any
  discount keyed in by hand.

### Notes
- **Payouts split the saving.** Where the two halves are by different makers, each one
  carries its own share of the saving, in proportion to its price, instead of one of them
  absorbing the lot. Sold, Z and the payout sheet all read the line net, so they agree to
  the penny.
- **Stock comes off both items**, one each, exactly as if they had been sold separately.
  There is no third "set" product to count.
- Buying two of each is two sets. Two of one and one of the other is one set plus one at
  full price.
- A line you have already discounted by hand sits out of set matching. Stacking a set
  price on top of a keyed-in discount gives a total nobody at the counter can explain.
- The set price applies before a whole-basket discount or a promo code, so a percentage
  comes off the set price rather than off the higher separate prices.
- If one half is refunded on its own, the customer gets back that half's share of the set
  price, not the full shelf price.
- A set price that is not actually a saving is refused when you save it, and ignored at
  the till if prices later change to make it one.
- Deleting an item clears any set it was part of.

---

## v1.5.8 - 24 August 2026, 03:38

### Added
- **A refund receipt now says when the original sale was taken**, on the line under
  "Refund of #VQ-0042". The refund's own date and time were already at the top, but it is
  the *sale's* time that finds the payment again on the card reader, because the reader
  lists payments by when they were taken rather than when they were given back.
- **A refund now names who processed it.** The printed receipt called this "Served by",
  which is the wrong word for handing money back — on a refund it now reads **Refunded
  by**.
- The same detail is on the on-screen note that tells you what to do at the reader, so
  the sale can be found whether or not there is a card reference to search for.

### Fixed
- **The shared receipt never named the staff member at all.** The printed one always has.
  Both now carry it, with the same wording.

### Notes
- Only shows where a name was recorded on the sale. If nobody was signed in at the till,
  the line is left off rather than printed empty.

---

## v1.5.7 - 24 August 2026, 03:12

### Added
- **A refund receipt now names the sale it refunds.** A refund is given its own receipt
  number, so on paper it was a stranger to the sale it reversed — the customer held two
  slips with nothing linking them. It now prints **Refund of #VQ-0042** under its own
  number.
- **A card sale receipt now prints the card reference.** The card slip has always carried
  our receipt number, so the slip could find the sale. This makes it work the other way
  too, which is the direction that matters when a customer arrives holding the till
  receipt and the payment has to be found on the reader.

### Notes
- Both appear on the printed receipt and the shared text one.
- **The card reference only exists for card sales taken through the app** from v1.5.5
  onwards, once the payment service has been redeployed. Sales without one simply omit
  the line rather than printing a blank.
- **The refund cross-reference works on any refund** that recorded which sale it came
  from, so it applies to existing refunds too, not only new ones.

---

## v1.5.6 - 24 August 2026, 02:41

### Added
- **The app now tells you when a card refund still has to be sent back.** Refunding a card
  sale records it and puts the stock back, but the app cannot move money — that part is
  done on the card reader. Until now nothing said so, and a refund done at closing time
  could quietly never reach the customer.
- A **banner at the top of Sales** shows the total still owed and how many refunds it
  covers. Each one is also marked **card refund due** in the list.
- Opening the refund's receipt says what to do: the amount, and where to find it on the
  reader — **Menu → Sales history → Refund**. If the original sale was taken through the
  app it names the card slip code, so it can be searched for rather than scrolled to.
- **✓ Mark card refund as sent** clears it, after a confirmation that says plainly this
  changes nothing at SumUp.

### Notes
- **Cash refunds are not flagged**, because the money leaves the drawer as you hand it
  over. Only card refunds leave something outstanding.
- **Refunds recorded before this build are not flagged either.** They were settled long
  ago, and raising them now would be noise rather than a reminder.
- **Nothing here contacts SumUp.** The flag is the app's own note to itself, so ticking it
  is a statement that you have done the refund on the reader, not an instruction to do it.
- On the reader itself: refunds are possible for **90 days**, can be partial, go back to
  the card that paid, and need enough un-withdrawn takings to cover them.

---

## v1.5.5 - 24 August 2026, 02:05

### Added
- **A card sale now remembers which card payment paid for it.** When the reader takes a
  payment, SumUp's own reference for it is saved onto the sale instead of being shown once
  in a message and then forgotten. Nothing looks any different at the till.

### Notes
- **This is groundwork for refunding a card payment from the app.** At the moment a refund
  in the app records the return and puts the stock back, but the money has to be sent back
  separately in SumUp. Doing that from the till means being able to name the original
  payment, and until now nothing wrote it down.
- **It also helps straight away if a customer ever queries a card sale**, because the sale
  and the card slip can now be matched up without going hunting by amount and time.
- **The payment service only kept that reference for two days**, so waiting until the
  refunding was built would have meant every card sale taken before then could never be
  refunded from the app. That is why this went in on its own and first.
- **It applies from this build onwards.** Card sales taken before today have no reference
  stored and will always need refunding by hand in SumUp.

---

## v1.5.4 - 24 August 2026, 01:23

### Fixed
- **Photos are back.** v1.5.3 tightened what counts as a valid photo and got it wrong: it
  accepted only photos stored on the device and refused hosted ones, which is what almost
  all of the shop's photos are. They vanished from the list on every device that picked up
  that build. Both kinds are accepted again.

### Notes
- **Nothing was ever deleted.** The photos stayed on every record throughout; they were
  only being refused at the point of display. Updating to this build brings them back.
- The v1.5.3 fix it came from is still in place - a photo carrying anything other than a
  real image is still refused, so the hole it closed stays closed.

---

## v1.5.3 - 24 August 2026, 01:02

### Fixed
- **A photo could carry code that ran on every device showing the stock list.** Item
  photos were dropped straight into the page without checking them, so a photo value
  crafted to look like `x" onerror="..."` escaped the tag it was in and ran. Photos are
  now accepted only if they really are a picture stored on a device, and refused
  otherwise. Barcodes are escaped the same way.

### Notes
- **Nothing suggests this was ever used**, and it could not be triggered by a customer.
  It needed someone already signed in to the shop's own workspace, or a hand-edited
  backup file being restored. Fixed because "only the people we trust could do it" is
  not a safeguard, and a restored backup is the sort of thing that arrives by email.
- Ordinary photos taken on the till or the phone are unaffected.

---

## v1.5.2 - 24 August 2026, 00:55

### Changed
- **The build stamp now shows a time as well as a date**, e.g. `v1.5.2 - 24 Aug 2026, 00:55`.
  On a day when more than one build goes out, the date alone could not tell you whether a
  till was on the latest one. 24-hour clock so there is no am/pm to misread across a counter.

### Notes
- Set by hand, like the version and the date — there is no build step to fill it in, so
  publishing means editing `APP_VERSION`, `BUILD_DATE` and `BUILD_TIME` together.
- Change register entries now carry the time too, so this file and the app agree.

---

## v1.5.1 - 24 August 2026

### Added
- **Payouts now say where the money comes from.** Each maker's line shows what to hand
  over **from cash** and what to send **from card**, as well as the total. The bottom
  line splits the same way: how much comes out of the till, and how much needs
  transferring from the bank once SumUp has settled.
- Both figures are in the report CSV as **Pay from cash** and **Pay from card**.

### Notes
- The card fee comes off the card side only, since that is the only side it was ever
  charged on. Cash refunds reduce the cash side, card refunds the card side, because a
  refund is recorded against however the sale was originally paid.
- Payments taken as **Other** get their own figure rather than being counted as cash.
  Whatever it was, it is not notes in the till, and a payout sheet should not say it is.

---

## v1.5.0 - 24 August 2026

### Added
- **Supplier payouts now work themselves out.** At the bottom of **Sales -> Report**,
  for whatever period you pick, each maker gets a line showing what they are owed and
  the workings behind it: items sold, cash, card, refunds and the card fee. Until now
  this could only be done by exporting the CSV and building it in a spreadsheet.
- **Settings -> Supplier payouts** sets the card fee percentage. It starts at SumUp's
  standard **1.69%**; their GBP19/month plan drops it to **0.99%**, so it is a setting
  rather than a fixed number.
- The payout table is included in the report CSV, so it can be handed over as a
  statement or pasted into a spreadsheet.

### Notes
- A supplier is paid the **full sale price on cash**, and the sale price **less the card
  fee on card**. That matches how the three of us work.
- **The fee is taken on card sales, not on card sales after refunds.** If a card sale is
  refunded the card company generally keeps its fee, so the shop has still paid it.
  Netting refunds off first would quietly move that cost onto the shop.
- Refunds reduce what is owed, and the item count is a net figure, so a sold-then-returned
  item does not get paid out.
- Every part is shown separately rather than just a total, so the arithmetic can be
  checked rather than taken on trust.

---

## v1.4.0 — 23 August 2026

### Added
- **Item codes now say whose item it is.** Every maker owns a letter, and their codes run
  from **001 to 999** within it before rolling on to the next block: Kay **KA-001 … KA-999**
  then **KB-001**, Claire **CA-…**, Claire Bear **BA-…**, Marie **MA-…**. Before this, every
  code began with K no matter who made the item.
- **✨ Generate now asks whose item it is** and takes that maker's next free number. It fills
  in **Made by** and starts the folder off for you, so the code, the folder and the maker
  cannot end up disagreeing. Change **Made by** afterwards and it offers to reissue the code.
- **Settings → Item codes** lists the makers, how many items each has and what their next
  code will be. Add or remove a maker there; each one needs a letter of their own.
- **Settings → Renumber codes** puts the whole stock list onto the scheme in one pass. It
  shows every old → new code first and changes nothing until you confirm. Items already
  sitting on the right number keep it, so their labels do not need reprinting. It is safe
  to run again later — it only moves what is actually out of place.
- **Settings → Print labels** prints a sheet of QR labels, four to a row: just the ones a
  renumbering changed, one maker's stock, or everything. Previously labels came one PNG at
  a time.

### Notes
- **Renumbering means relabelling.** A code that changes stops the sticker already on that
  item from scanning. Save a backup first, do it on one device with the other closed, and
  print the new labels before anything goes back on the shelf.
- Whose item it is comes from the **top level of the folder** first (Kay/…, Claire/…), and
  only then from **Made by** — the folder is the more reliable of the two. Anything neither
  field can place is listed and left alone rather than guessed at.
- Renumbering also updates the codes recorded against past sales, so refunding an old sale
  still puts the stock back, and it settles **Made by** on one spelling per person.
- Makers and their counters travel with backups and team sync, so both tills issue codes
  from the same set. A till still on v1.3.0 carries on with Kay's numbering untouched.

---

## v1.3.0 — 23 August 2026

### Added
- **Card payments can now go straight to a SumUp card reader.** Pick **Card** on the
  payment screen and the till sends the amount to the reader; the sale is only recorded
  once the payment is actually confirmed. A declined or cancelled card leaves the basket
  exactly as it was, with nothing sold, no stock taken off and no receipt number used up.
- **A new waiting screen** shows the amount and what the reader is doing, with **Cancel
  payment** while it is running, and **Try the card again** or **Take cash instead** if it
  fails.
- **Settings → Card reader** is where the service address goes. It has a **Test** button.
  The receipt number travels to the reader with the amount, so the printed card slip names
  the same receipt as the itemised one in the app.

### Notes
- **Nothing changes unless you fill that address in.** Left empty, the Card button behaves
  exactly as before — it records a card sale and you work the reader by hand. Cash is
  untouched either way, so neither the reader nor the internet can stop the shop selling.
- Reader payments need this device signed in to team sync, because that is how the payment
  service knows who is asking. If it is not signed in it says so rather than failing oddly.
- The card key is never in this file. It lives in a small service of our own
  (`sumup-worker/`), which is also the only thing that decides whether a payment
  succeeded — it asks SumUp directly rather than trusting anything sent to it.

---

## v1.2.1 — 17 August 2026

### Changed
- **Generated codes are now three digits with a moving letter: `KA-001`.** Published a few
  minutes after v1.2.0, which used four digits, so `KA-0001` becomes `KA-001`. Shorter to
  read off a label and quicker to type in if a camera is playing up.
- **After `KA-999` the letter moves on.** The next code is `KB-001`, then `KB-999` gives
  `KC-001`, and so on. That is 999 items per letter and 25,974 to `KZ-999`; past that it
  carries on `KAA-001`, `KAB-001`, so it cannot run out however far the shop grows.

### Notes
- If a code was generated on the v1.2.0 build in the meantime, the item keeps the `KA-0001`
  it was labelled with, and the app knows not to hand out `KA-001` to anything else. The
  numbering just carries on from there.
- All the duplicate protection from v1.2.0 still applies, now counting a four-digit
  `KA-0001` and a three-digit `KA-001` as the same number.

---

## v1.2.0 — 17 August 2026

### Changed
- **Generated codes now read `KA-0001` instead of `SA00000001`.** Tap **✨ Generate a QR
  code** on the Add tab and you get `KA-0001`, then `KA-0002`, and so on — short enough to
  read off a label and type in by hand if a camera is being difficult. The numbering starts
  fresh at 0001; the three old `SA…` items keep the codes already printed on them, and so
  does everything with a `JW-`, `CR-`, `CG-` style code. Nothing needs relabelling.

### Notes
- The number is shared across tills through the team sync, as before, so two devices cannot
  be handed the same one.
- Belt and braces on top of that: before issuing a code the app now checks the stock list
  and skips any number already in use. So even a till that has been off the internet, or one
  restored from an old backup, cannot produce a code that another item already has.
- Restoring a backup made before this version no longer carries its old code counter across.
  That counter was 1000-based to feed the `SA` format and would have pushed new codes up into
  the KA-1000s.

---

## v1.1.0 — 17 August 2026

### Added
- **Delete all selected, on the Stock tab.** Tick items with ☑ (or tap **All**), then the
  new **🗑 Delete** button removes the whole selection in one go. The confirmation names
  the first few items and how many others there are, so a mis-tap on **All** is obvious
  before anything goes. Sales already recorded are not affected.

### Fixed
- **The "Delete this item?" confirmation appeared behind the edit form.** It was there all
  along but hidden underneath, so the edit box had to be dismissed before the question
  could be answered. Confirmation boxes now always sit in front.

---

## v1.0.1 — 17 August 2026

Two team-sync fixes. Both were written on 3 August but had never been published — they
sat in a working copy that was missing the bulk edit and import features, so that copy
could not be published as-is. The fixes have now been moved across individually.

### Fixed
- **A till sitting idle was writing to the cloud database non-stop.** Every save cycle
  wrote two pointless records — one junk entry into the stock list, and a repeat of the
  session details — and it never stopped, even with nobody touching the app. On a
  measured ten-cycle test the old build made 19 writes where the new one makes none.
  This was burning through the free database allowance for no reason.
- **First connect to a brand-new team workspace uploaded nothing.** The app assumed the
  cloud already held everything on the device, so a device joining an empty workspace
  kept its whole stock list to itself while the header cheerfully read "Synced". Stock
  only started uploading once each item happened to be edited. A first connect now
  uploads properly.

### Notes
- A device that already has the shop's stock will now push anything the cloud is missing
  the moment it connects. That is the point of the fix, but it does mean the first
  connect after updating may take a few seconds longer than usual.
- Pulling data down was never affected — a new phone joining an existing workspace
  always received the stock list correctly, and still does.
- There may be leftover junk `__meta` entries in the cloud stock list from the old
  behaviour. They are harmless and ignored by the app.

---

## v1.0.0 — 17 August 2026

First version to carry a version number. Everything before this was published without
one, which is why older builds show no version line in the header.

### Added
- **Version stamp in the header.** Shows `v1.0.0 · 17 Aug 2026` on every tab, so you
  can confirm which build a device is running without opening anything.
- **"Closes after each scan" toggle in the scanner.** The camera now shuts down after a
  successful scan instead of staying open. The toggle switches it back to staying open
  for working through a pile of stock, and the choice is remembered on that device.

### Fixed
- **CSV exports mangled em dashes and accents.** Names containing `—` came out as `â€”`
  when opened in Excel. All three exports (stock take, sales, end-of-day report) now
  start with a UTF-8 marker so Excel reads them correctly. Re-export any affected file
  to get a clean copy.

### Notes
- A failed scan (unknown code, no stock left, promo code on the wrong tab) deliberately
  leaves the camera open so the code can be presented again.
- Scanning an unknown barcode still closes the camera and opens the add-item form, as before.

---

## Before v1.0.0

Published by hand without version numbers or a change record. The last such build went
live on 17 July 2026. Its history is not recoverable — this register starts here.
