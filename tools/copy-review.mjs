// Builds the copy review page: every Albanian and French line of the shop, grouped by where it appears,
// with the English meaning and our open questions, for a native speaker to approve or correct on a
// phone. The page composes a message (only the lines changed or commented, each with its keys) that
// the reviewer copies back to Luca; corrections are then applied to src/shared/copy.ts by hand.
//
//   node tools/copy-review.mjs [out.html]      (default .impeccable/review/copy-review.html)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { copy } = await import('file:///' + resolve(root, 'src/shared/copy.ts').replace(/\\/g, '/'));
const { LOGO_BOX, LOGO_PATHS } = await import('file:///' + resolve(root, 'src/shared/brand-logo.ts').replace(/\\/g, '/'));
const out = resolve(root, process.argv[2] ?? '.impeccable/review/copy-review.html');

const NBSP = String.fromCharCode(160);
const B = String.fromCharCode(92);

/** Kept out of the review: language codes, test-only pages, decisions taken in English, numbers. */
const SKIP = new Set([
  'lang', 'langName', 'langShort', 'demo', 'pay', 'hero.wordmark', 'shop.tagline', 'nav.lookbook', 'shop.title',
  'visit.address', 'footer.followers', 'search.colors', 'nav.instagram', 'meta.shopTitle',
]);

/** Functions are shown with example values. */
const both = (f) => `${f(1)} · ${f(3)}`;
const DRESS = { sq: 'Fustan i kuq', en: 'Red dress', fr: 'Robe rouge' };
const SAMPLE = {
  'meta.sizeTitle': (f) => f('38'),
  'a11y.photoOf': (f) => f(2, 5),
  'sizes.count': both,
  'sizes.label': (f) => f('38', 'M'),
  'shop.count': both,
  'shop.inSize': (f) => `${f(1, '38')} · ${f(3, '38')}`,
  'shop.empty': (f) => f('38'),
  'product.sizeSoldOut': (f) => f('38'),
  'bag.onlyLeft': both,
  'checkout.soldOut': (f, lang) => f(DRESS[lang], '38'),
  'confirmation.title': (f) => f(12),
  'search.results': both,
};

const GROUPS = [
  ['home', ['hero', 'home', 'visit', 'popup']],
  ['nav', ['nav', 'categories', 'sizes']],
  ['shop', ['shop']],
  ['product', ['product']],
  ['bag', ['bag']],
  ['checkout', ['checkout']],
  ['confirmation', ['confirmation']],
  ['search', ['search']],
  ['footer', ['footer']],
  ['notFound', ['notFound']],
  ['meta', ['meta']],
  ['a11y', ['a11y']],
];

/** Our open questions, in the reviewer's language. */
const NOTES = {
  sq: {
    'nav.bag': 'Shumë dyqane online shkruajnë «Shporta» dhe «Shto në shportë». «Çanta» mund të ngatërrohet me çantat e dorës. Cilën preferon?',
    'product.add': 'Varet nga pyetja te «Çanta», në kokën e faqes.',
    'shop.soldOut': '«Fustan» është mashkullor, prandaj ndoshta «I shitur». Apo «Pa gjendje», si në admin?',
    'product.lastOne': 'Ndoshta «Copa e fundit në këtë masë»? («Fustan» është mashkullor.)',
    'a11y.zoom': '«Shiko foton e plotë»? Këtë e lexojnë vetëm lexuesit e ekranit.',
    'sizes.guide': 'Drejtshkrimi standard është «evropiane». Cilën formë preferon?',
    'meta.homeDescription': '«Porosit online», pa -e në fund? Ky tekst shfaqet në Google.',
  },
  fr: {
    'product.sizeSoldOut': 'Une taille n’est pas « vendue » : « La taille 38 est épuisée » ?',
    'product.lastOne': '« Dernière pièce dans cette taille » ?',
    'bag.onlyLeft': '« Plus qu’une » (ou « Plus qu’un exemplaire ») plutôt que « Plus que 1 » ?',
    'checkout.place': '« Valider la commande » est plus courant sur les sites marchands ?',
    'checkout.phoneHint': 'Au futur : « Nous vous appellerons à ce numéro pour confirmer la commande » ?',
    'product.was': '« Au lieu de » devant l’ancien prix barré ?',
    'footer.privacy': '« conservé » plutôt que « gardé » ?',
    'categories.tv': '« Vu à la télé », la formule figée, plus courte ?',
  },
};

/** French spacing: a non-breaking space before ? ! : ; and inside guillemets. */
const frSpace = (s) => s.replace(/ ([?!:;»])/g, `${NBSP}$1`).replace(/« /g, `«${NBSP}`);

const UI = {
  sq: {
    name: 'Shqip',
    h1: 'Teksti shqip i dyqanit',
    lede: [
      'Këtu janë të gjitha tekstet shqip të dyqanit online, sipas vendit ku shfaqen. Lexoji si klientja: shtyp «Në rregull» kur teksti është i saktë, ose «Ndrysho» dhe shkruaj versionin e saktë. Numrat dhe masat janë shembuj.',
      'Në fund kopjo mesazhin dhe dërgoje te Luca. «Shop» dhe «Elegance that endures» mbeten me qëllim në anglisht.',
    ],
    groups: {
      home: 'Kryefaqja', nav: 'Koka e faqes dhe menuja', shop: 'Dyqani: lista e fustaneve', product: 'Faqja e fustanit',
      bag: 'Çanta', checkout: 'Porosia', confirmation: 'Pas porosisë', search: 'Kërkimi', footer: 'Fundi i faqes',
      notFound: 'Faqe që nuk ekziston', meta: 'Titujt në Google dhe në skedën e shfletuesit', a11y: 'Për lexuesit e ekranit (nuk shihen)',
    },
    ok: 'Në rregull', edit: 'Ndrysho', cancel: 'Anulo', isOk: 'Në rregull', isChanged: 'Ndryshuar',
    question: 'Pyetje', meaning: 'EN', fix: 'Si duhet të jetë', note: 'Shënim (jo i detyrueshëm)',
    places: 'Shfaqet në {n} vende',
    progress: '{n} nga {t} të kontrolluara', changes: { one: '1 ndryshim', many: '{n} ndryshime' },
    toSend: 'Te mesazhi',
    sendTitle: 'Dërgo rishikimin',
    sendBody: 'Mesazhi përmban vetëm tekstet që ndryshove ose komentove. Kopjoje dhe dërgoje te Luca në WhatsApp ose Instagram.',
    copy: 'Kopjo mesazhin', copied: 'U kopjua. Ngjite në WhatsApp ose Instagram.', copyFail: 'Teksti u zgjodh: kopjoje me dorë.',
    whatsapp: 'Hap WhatsApp', tooLong: 'Mesazhi është i gjatë për WhatsApp: përdor «Kopjo mesazhin».',
    reset: 'Fshi gjithçka', resetAgain: 'Shtyp përsëri për të fshirë',
    head: 'Dresses by Greta, teksti shqip', checked: 'Kontrolluar {n} nga {t}.', allOk: 'Të gjitha tekstet e kontrolluara janë në rregull.',
    now: 'Tani', becomes: 'Bëhet', noteLabel: 'Shënim',
  },
  fr: {
    name: 'Français',
    h1: 'Les textes en français',
    lede: [
      'Voici tous les textes français de la boutique en ligne, classés selon l’endroit où ils apparaissent. Lisez-les comme une cliente : touchez « Correct » si le texte est juste, ou « Modifier » pour écrire la bonne version. Les nombres et les tailles sont des exemples.',
      'À la fin, copiez le message et envoyez-le à Luca. « Shop » et « Elegance that endures » restent en anglais, c’est voulu. Les noms et les descriptions des robes sont en anglais sur le site français.',
    ],
    groups: {
      home: 'Page d’accueil', nav: 'En-tête et menu', shop: 'La boutique : liste des robes', product: 'Fiche de la robe',
      bag: 'Panier', checkout: 'Commande', confirmation: 'Après la commande', search: 'Recherche', footer: 'Pied de page',
      notFound: 'Page introuvable', meta: 'Titres dans Google et dans l’onglet du navigateur', a11y: 'Pour les lecteurs d’écran (invisibles)',
    },
    ok: 'Correct', edit: 'Modifier', cancel: 'Annuler', isOk: 'Correct', isChanged: 'Modifié',
    question: 'Question', meaning: 'EN', fix: 'Version correcte', note: 'Remarque (facultatif)',
    places: 'Apparaît à {n} endroits',
    progress: '{n} sur {t} vérifiés', changes: { one: '1 modification', many: '{n} modifications' },
    toSend: 'Au message',
    sendTitle: 'Envoyer la relecture',
    sendBody: 'Le message ne contient que les textes modifiés ou commentés. Copiez-le et envoyez-le à Luca sur WhatsApp ou Instagram.',
    copy: 'Copier le message', copied: 'Copié. Collez-le dans WhatsApp ou Instagram.', copyFail: 'Texte sélectionné : copiez-le à la main.',
    whatsapp: 'Ouvrir WhatsApp', tooLong: 'Message trop long pour WhatsApp : utilisez « Copier le message ».',
    reset: 'Tout effacer', resetAgain: 'Touchez encore pour effacer',
    head: 'Dresses by Greta, textes français', checked: '{n} vérifiés sur {t}.', allOk: 'Tous les textes vérifiés sont corrects.',
    now: 'Actuel', becomes: 'Devient', noteLabel: 'Remarque',
  },
};
for (const [k, v] of Object.entries(UI.fr)) {
  if (typeof v === 'string') UI.fr[k] = frSpace(v);
  else if (Array.isArray(v)) UI.fr[k] = v.map(frSpace);
  else for (const [kk, vv] of Object.entries(v)) v[kk] = frSpace(vv);
}
for (const [k, v] of Object.entries(NOTES.fr)) NOTES.fr[k] = frSpace(v);

function flatten(obj, lang, prefix = '') {
  const rows = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (SKIP.has(key) || SKIP.has(prefix)) continue;
    if (typeof v === 'string') rows.push([key, v]);
    else if (typeof v === 'function') {
      const sample = SAMPLE[key];
      if (!sample) throw new Error(`no example values for ${key}`);
      rows.push([key, sample(v, lang)]);
    } else if (v && typeof v === 'object') rows.push(...flatten(v, lang, key));
  }
  return rows;
}

const en = new Map(flatten(copy.en, 'en'));
const langs = {};
for (const lang of ['sq', 'fr']) {
  const rows = flatten(copy[lang], lang);
  const seen = new Map();
  const groups = GROUPS.map(([id, tops]) => ({ id, title: UI[lang].groups[id], rows: [] }));
  for (const [key, text] of rows) {
    const prior = seen.get(text);
    if (prior) {
      prior.keys.push(key);
      if (!prior.note && NOTES[lang][key]) prior.note = NOTES[lang][key];
      continue;
    }
    const top = key.split('.')[0];
    const group = groups[GROUPS.findIndex(([, tops]) => tops.includes(top))];
    if (!group) throw new Error(`no group for ${key}`);
    const row = { id: key, keys: [key], text, en: en.get(key) ?? '', note: NOTES[lang][key] ?? '' };
    seen.set(text, row);
    group.rows.push(row);
  }
  langs[lang] = groups.filter((g) => g.rows.length);
}

const [x0, y0, x1, y1] = LOGO_BOX.name;
const pad = 0.6;
const nameSvg = `<svg viewBox="${(x0 - pad).toFixed(2)} ${(y0 - pad).toFixed(2)} ${(x1 - x0 + 2 * pad).toFixed(2)} ${(y1 - y0 + 2 * pad).toFixed(2)}" fill="currentColor" role="img" aria-label="Dresses by Greta">${LOGO_PATHS.name.map((d) => `<path d="${d}"/>`).join('')}</svg>`;
const font = (w) => readFileSync(resolve(root, `public/fonts/greta-sans-${w}.v1.woff2`)).toString('base64');

const data = JSON.stringify({ langs, ui: UI }).replace(/</g, `${B}u003c`);
const page = readFileSync(resolve(root, 'tools/copy-review.html'), 'utf8')
  .replace('__FONT_400__', () => font(400))
  .replace('__FONT_700__', () => font(700))
  .replace('__NAME_SVG__', () => nameSvg)
  .replace('__DATA__', () => data);
writeFileSync(out, page);
const count = (l) => langs[l].reduce((n, g) => n + g.rows.length, 0);
console.log(`${out}  ${(page.length / 1024).toFixed(0)} KB  sq ${count('sq')} lines, fr ${count('fr')} lines`);
