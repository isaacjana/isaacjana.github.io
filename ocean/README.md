# Ocean

Live seafood ordering, packing, delivery tracking and invoicing in one mobile-first web app.
This replaces the earlier separate **Ocean** and **Live Catch** apps; their old links redirect here.

| Page | What it is |
|---|---|
| `ocean/` | The app (supplier, customer and driver all sign in here) |
| `ocean/track.html?c=CODE` | Public live tracking page, no account needed |
| `invoice/` | MySarawak Invoice. Ocean invoices are drawn by its engine and can be opened in it |

## The flow

| Step | Who | What happens | Status |
|---|---|---|---|
| 1 | Customer | Picks items and a delivery time, sends the request | Requested |
| 2 | Supplier | Weighs the live items, sets final prices, sends the quote (or confirms straight away) | Quote sent |
| 3 | Customer | Accepts the quote | Confirmed |
| 4 | Supplier | Packs: stock is deducted and the invoice is issued; assigns a driver or posts the job | Packed |
| 5 | Driver | Starts the delivery; the phone shares its GPS position | On the way |
| 6 | Driver | Hands over, records who received it and whether payment was collected | Delivered |

The supplier can also enter a phone or walk-in order directly (it starts at Confirmed).
Cancelling a packed order puts the stock back and voids the invoice.

## Live tracking

- The driver's phone sends its position every 5 seconds while moving (at least every 20 seconds when parked).
- The customer, the supplier's live map and the public tracking link all update as positions arrive, with a road route and arrival estimate.
- A web page can only read GPS while it is open. The driver must keep Ocean open with the screen on; the app asks the phone to stay awake. If the signal drops, the tracking page says "Signal lost" and shows the last position.
- Customers need a map pin (Account, Edit details) for the route and arrival time. Without it the map still shows the driver.

## Invoices

- An invoice is issued automatically when an order is packed, numbered `INV-YEAR-00001` upward.
- PDF and WhatsApp summary are produced by `invoice/invoice-pdf.js`, the same code the Invoice app uses.
- "Open in Invoice app" hands the invoice over for editing. "Blank invoice" opens the Invoice app with the business details filled in.
- Business name, TIN, MSIC, SST number and rate are set under More, Business details.

## More features

| Feature | Where | Notes |
|---|---|---|
| Alerts | Account or More, "Turn on alerts" | Announces new orders, quotes, jobs and deliveries while Ocean is open, including in a background tab. There is no server, so nothing arrives when the app is fully closed. |
| WhatsApp updates | Order screen | One tap opens WhatsApp with a message written for the order's current step, including the tracking link. |
| Delivery photo | Driver, "Delivered" screen | Shrunk on the phone and saved with the order. The supplier and that customer can view it. |
| Repeat orders | Customer, order screen, "Repeat weekly" | Creates the order the day before each chosen weekday. It runs when the customer's or supplier's app is open. |
| Monthly statements | Invoices or More (supplier), Account (customer) | PDF of the month's invoices with the balance due, or a consolidated invoice opened in the Invoice app. |
| Multi-stop runs | Driver, Jobs, "Start all" | Stops are ordered nearest-first. Each customer's tracking page shows how many stops come before theirs. |
| Stock history | Stock, "History", or inside a product | Every receipt, pack, return, correction and write-off, with who and when. |
| Sales report | More, "Sales report" | Revenue per day, top products and customers, wastage, CSV export. |
| Works offline | Automatic | The app opens without signal. Positions and other changes made offline are sent on reconnect. |
| Languages | Globe menu on sign-in, Account and the tracking page | English, Bahasa Malaysia and Chinese for customer, driver and tracking screens. Supplier screens stay mostly English. |
| Cut-off time | More, Business details | After the cut-off, customers can only book from tomorrow. The supplier can still enter same-day orders. |
| Payment QR | More, Business details | Upload your DuitNow QR picture. It appears for customers, on the driver's hand-over screen and on unpaid invoice PDFs. |
| Live Catch import | More (not in demo) | One-time copy of the old stock list and delivery clients. Old Live Catch orders are not imported. |

## Roles

Everyone who signs in starts as a customer. The supplier changes a person's role under More, Customers and team.
The first supplier account must be set by hand: in the Firebase console, open `users/{your uid}` and set `role` to `admin`.

## Demo mode

"Try the demo" runs the whole app from sample data kept in the browser, with no account.
Open three tabs (supplier, customer, driver) to see changes pass between them; the driver screen has a "Simulate" button that drives the truck along the route.

## Set-up needed in Firebase

`firestore.rules` in this folder holds the rules Ocean needs. Four collections are new: `tracking`, `ocean_settings`, `ocean_pod` and `ocean_stock_log`.
Until they are added:

- delivery photos and stock history are not saved,
- the public tracking link asks the visitor to sign in,
- business details are saved on the supplier's device only,
- invoice numbers fall back to a time-based number.

The Firebase project is shared with other apps, so merge these blocks into the existing rules rather than replacing them.

## Code map

| File | Purpose |
|---|---|
| `js/app.js` | Screens and actions for the three roles |
| `js/flow.js` | The business flow (status changes, stock, invoices) and driver GPS sharing |
| `js/model.js` | Statuses, totals, invoice and tracking record shapes |
| `js/store.js` | Data layer: Firebase, or browser storage in demo mode |
| `js/trackview.js` | The live map view shared by the app and the tracking page |
| `js/geo.js` | Leaflet map, OSRM route, address search |
| `js/extras.js` | Alerts, WhatsApp messages, repeat orders, statements, reports, stock history, import |
| `js/i18n.js` | Translations (Bahasa Malaysia, Chinese) |
| `js/ui.js` | Sheets, toasts, form helpers |
| `sw.js` | Offline support |
