# Order alerts, sales, the admin app, the follower count, Google

Three things that need an account only you or Greta can open. The code is in place; nothing here
needs a code change.

**Where the shop lives (since 2 October 2026):** the code in github.com/DressesByGreta/Webste-
(this folder's `origin`; Luca's first repository stays as `luca`), and the shop in the business
Cloudflare account (dressesbygreta@gmail.com): the Worker `www`, the D1 database `greta` and the
KV namespace `PHOTOS`, all named in wrangler.jsonc with the account id. Deploying needs wrangler
signed in to that account (`npx wrangler login`, or `npx wrangler login --device` to enter a code in
any browser). Everything was copied from Luca's account unchanged: the 45 dresses with their
prices, stock and 96 photographs (281 files), the settings and the admin password.

**Deploying:** `npm run deploy` now applies the database migrations first
(`wrangler d1 migrations apply greta --remote`). Migration 0002 adds the visit counts (`stats`) and
`orders.source`; 0003 adds the date a dress stops being new. The new code needs them, so always
deploy with that script.

**Legal pages:** admin → **Cilësimet** → **Faqet ligjore**.
- **Business details:** the legal name as in QKB, the NIPT, the shop's phone and an email.
- **Returns and exchanges:** chosen from four options. The site writes the sentences in Albanian, English and French, and a preview shows the Albanian text. Greta can add her own note in Albanian and English.
- **Where it shows:** /kushtet and /privatesia, plus the shop's data for Google. Until the returns are set, that section is simply not shown. Saving a change moves the pages' "updated" date.

**Visit counts:** the admin's **Statistikat** tab. The shop counts by itself, with no cookies and no
personal data. To see which post brings visitors and orders, make a link in the same tab ("Krijo
një lidhje për një postim"), copy it, and use it in the post or story.

**New dresses:** a dress is new for 14 days from the first time it is published. It shows "E re"
(New, Nouveauté) after its name, and the shop gets a "Të reja" filter while at least one dress is
new: in the menu, the footer, and the header on wide screens (from 1180px; French from 1536px,
where its longer words fit). In the dress's admin page, under the categories, Greta can start the
14 days again (a dress back in stock) or end them now. The dresses imported from Instagram posts
are not new when they go live; the ones Greta added herself become new when she publishes them.

**Sales:** the admin's **Shitjet** tab, by week (Monday to Sunday) or by month, Tirana time, beside
the period before: orders, their value, dresses sold, the average order and visits, then which
dresses and sizes sold, where the orders stand and where the buyers came from. Cancelled orders are
not counted, and card payments never completed are left out. **Shkarko në Excel** downloads the
period as an .xlsx file for the accountant, with two sheets (the orders, and the dresses in them)
and totals without the cancelled ones. On a phone, **Dërgo skedarin** sends the file straight to
WhatsApp or email.

## The admin on Greta's phone

The admin installs as an app: an icon on the home screen (the gold G on black, so it never looks
like the shop's ivory icon) that opens full screen, without the browser around it.

- **iPhone:** open `/admin` in **Safari** → the Share button → **Add to Home Screen** → Add.
- **Android:** open `/admin` in **Chrome** → the ⋮ menu → **Install app** (or **Add to Home
  screen**). A long press on the icon offers Porositë and Shitjet directly.

Greta signs in once inside the app (on an iPhone it keeps its own sign-in, apart from Safari's).
She stays signed in while she opens it at least once a week. When she comes back to the app after a
minute or more, the orders and the sales load again. With no connection it shows "Pa lidhje
interneti" instead of the browser's error page.

## Telegram: a message for every new order

1. In Telegram, open **@BotFather** and send `/newbot`. Give it a name (for example
   "Dresses by Greta Porosi") and a username that ends in `bot`. BotFather answers with the bot's
   token.
2. On the computer, in this folder:

   ```
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   ```

   and paste the token when it asks. (To try it locally instead, add `TELEGRAM_BOT_TOKEN=...` to
   `.dev.vars` and restart `npm run dev`.)
3. After the deploy: admin → **Cilësimet** → **Njoftimet e porosive në Telegram** → **Lidh një
   telefon**. Open the link it shows on the phone that should get the alerts and press **Start**.
   The admin shows the phone a few seconds later. Repeat for each phone (Greta, you).
4. **Dërgo një mesazh prove** sends a test.

Only phones linked from the signed-in admin receive alerts: each link uses a one-time code that
expires after 15 minutes, so someone who finds the bot cannot subscribe.

An alert carries the order number, each dress with its size and price, delivery, total, how she
pays, the customer's name, phone and city, any note, and a link to the order in the admin. The full
address stays in the admin. Cash orders alert as they are placed; card orders once paid.

## Instagram: the follower count in the footer

The footer shows the count in each language (26,2 mijë ndjekës · 26.2K followers · 26,2 k abonnés).
Until Instagram is linked it shows the number read by hand on 16 September 2026, or one typed in
the admin.

To have it update itself (needs @dressesbygreta to be a business or creator account):

1. On **developers.facebook.com**: My Apps → Create app → choose the Instagram use case (Instagram
   API with Instagram login). Meta's labels change from time to time; the product is called
   "Instagram" and the page "API setup with Instagram login".
2. There, **Generate access tokens** → **Add account**: Greta signs in with @dressesbygreta and
   allows it → **Generate token** → copy it.
3. Admin → **Cilësimet** → **Ndjekësit në Instagram** → paste it into **Token nga Meta** →
   **Lidh Instagramin**.

The shop checks the token with Instagram before keeping it. Then it reads the count every six hours
and renews the token every week, so the 60-day token never runs out. If Instagram stops answering
(a password change, the app removed), the admin shows the error: paste a new token.

## Google

`/robots.txt` and `/sitemap.xml` are served by the Worker. The sitemap lists the home page, the shop
and each category that holds a dress, and every published dress with its photographs, in Albanian,
English and French. Drafts never appear.

After the deploy, in **Google Search Console**:

1. Add a property for `https://www.dressesbygreta.workers.dev/` (URL prefix).
2. Verify it with the **HTML file** method: put the file Google gives into `public/` and deploy.
3. **Sitemaps** → submit `sitemap.xml`.

With a custom domain later, add that domain as a new property.

## Rentals and "tell me when my size is back"

Each dress page has **Merre me qera** (event date, size, name, phone) and, when a size is sold out,
**Njoftomë kur kthehet masa** (size and phone). Both arrive in the admin's **Kërkesat** tab and as a
Telegram alert.

- **Qira:** press **WhatsApp** to open a reply already written in the visitor's language, agree the
  price, then **Konfirmo**: the date shows on the dress page as booked (no name, only the date and
  size). **Refuzo** if it cannot be done; **U kthye, mbylle** once the dress is back.
- **Masa u kthye:** when a size people asked for goes from 0 back into stock in the dress's page,
  Telegram says so. Open the tab, press **WhatsApp** beside each person (the message with the link
  is ready), then **E njoftova, mbylle**.

The WhatsApp button on dress pages uses the shop phone from **Cilësimet** (business details); without
one, the dress page links to Instagram messages instead.

## Google Shopping and the Instagram and Facebook shop (free listings)

The shop publishes its catalogue at `/feed.xml` (Albanian) and `/feed.xml?lang=en` (English): one line
per dress and size, with price, stock, photographs and brand, refreshed every hour.

1. **Google:** merchants.google.com, create the account with the shop's details, add the website and
   verify it (the same way as Search Console). **Products → Add products → Add products from a file
   → Enter a link to your file**: `https://<the shop's address>/feed.xml`, daily. Choose free listings.
2. **Instagram and Facebook:** business.facebook.com → **Commerce Manager → Catalogue → Data sources →
   Data feed → Scheduled feed**, the same address, daily. Then connect the catalogue to the Instagram
   account to tag dresses in posts.

Use the address once the shop has its own domain. Check in the first import that every product
is accepted: Google accepts WebP photographs; if Meta turns any down, tell Luca.

## Video, lookbooks, and what visitors keep on their phone

- **A dress's video:** in the dress's page in the admin, under the photographs, **Shto video**: a
  few seconds without sound, best the Reel's own video saved from Instagram (MP4), up to 15MB and 30
  seconds. It shows as the dress's second photograph and plays while it is on screen. **Hiq videon**
  removes it.
- **Lookbook:** the admin's **Lookbook** tab → a title (e.g. "Matura 2027") → **Krijo**. Add
  photographs; tap a photograph where a dress is and choose the dress (marks save at once); add a
  caption if you like; then **Publikuar** and **Ruaj**. It appears at /lookbook, in the footer and
  the menu. A dress taken off sale disappears from the public lookbook by itself.
- **Find my size, shop by date, saved dresses:** visitors set these themselves; nothing reaches the
  shop. Greta's own part is the measurements in each dress's "Masat dhe si bie" card: with them, the
  size each visitor sees comes from the dress itself instead of the general chart.
