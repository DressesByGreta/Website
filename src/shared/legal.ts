/**
 * The privacy notice and the terms of sale, in the three languages. Every sentence describes what
 * the shop and this site really do (checkout fields, Cloudflare hosting with the database in
 * Western Europe, Telegram alerts, the bag in the browser, the shop's own visit counts). Nothing is
 * promised that the shop has not decided. Two parts come from the admin (Cilësimet): the business
 * details (legal name, NIPT, phone, email) in "who we are" and "the seller", and the returns and
 * exchanges, chosen from a few options and written here in the three languages, plus Greta's
 * own note. Until she sets them, the returns section is not shown. Change UPDATED whenever the
 * text below changes; a save in the admin moves the date too.
 */
import type { Lang } from './copy';

export const UPDATED = '2026-10-02';

export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  /** id marks the sections the admin's details fill in (who, seller) or follow (delivery) */
  sections: { id?: string; h: string; p: string[] }[];
}

/** The business behind the shop, as registered (QKB); every field may still be empty. */
export interface Business {
  legalName: string;
  nipt: string;
  phone: string;
  email: string;
}

/** Greta's returns policy: '' while undecided (the section is left out). */
export interface Returns {
  mode: '' | 'none' | 'exchange' | 'refund';
  days: number;
  unworn: boolean;
  shipping: 'customer' | 'shop';
  noteSq: string;
  noteEn: string;
}

export const EMPTY_BUSINESS: Business = { legalName: '', nipt: '', phone: '', email: '' };
export const EMPTY_RETURNS: Returns = { mode: '', days: 14, unworn: true, shipping: 'customer', noteSq: '', noteEn: '' };

const where = 'Rruga Andon Zako Çajupi, pas LSI';

export const LEGAL: Record<'privacy' | 'terms', Record<Lang, LegalDoc>> = {
  privacy: {
    sq: {
      title: 'Privatësia',
      updated: 'Përditësuar më 2 tetor 2026',
      intro: 'Kjo faqe shpjegon cilat të dhëna mbledh dyqani online i Dresses by Greta, pse, dhe çfarë mund të kërkosh për to.',
      sections: [
        { id: 'who', h: 'Kush jemi', p: [`Dresses by Greta, dyqan fustanesh në ${where}, Tiranë. Për çdo pyetje mbi të dhënat e tua, na shkruaj në Instagram, @dressesbygreta.`] },
        {
          h: 'Çfarë mbledhim kur porosit',
          p: [
            'Emrin dhe mbiemrin, numrin e telefonit, email-in nëse e shkruan, qytetin, adresën dhe shënimet për dërgesën, fustanet që zgjedh dhe mënyrën e pagesës.',
            'I përdorim vetëm për ta konfirmuar porosinë me telefon, për ta dërguar dhe për të mbajtur shënim të shitjeve të dyqanit.',
          ],
        },
        {
          h: 'Kush i sheh',
          p: [
            'Greta dhe kush punon në dyqan. Kush e dërgon porosinë merr emrin, telefonin dhe adresën.',
            'Njoftimi për një porosi të re vjen në telefonin e dyqanit përmes Telegram-it, me emrin, telefonin, qytetin dhe fustanet.',
            'Faqja dhe të dhënat ruhen te Cloudflare, kompania që e mban faqen në internet; porositë ruhen në Europën Perëndimore. Nuk i shesim dhe nuk ia japim askujt tjetër.',
          ],
        },
        { h: 'Sa kohë i mbajmë', p: ['Porositë mbeten si shënim i shitjeve të dyqanit. Nëse do që të dhënat e tua të fshihen, na shkruaj: i fshijmë kur ligji nuk na detyron t’i mbajmë.'] },
        {
          h: 'Cookies dhe kujtesa e pajisjes',
          p: [
            'Faqja nuk përdor cookies për reklama apo për të ndjekur vizitorët.',
            'Çanta ruhet vetëm në pajisjen tënde, në kujtesën e shfletuesit, që ta gjesh kur kthehesh. Po aty ruhet edhe zgjedhja «Ndalo animacionet». Hyrja e stafit në admin përdor një cookie që i shërben vetëm hyrjes.',
          ],
        },
        {
          h: 'Numërimi i vizitave',
          p: ['Dyqani numëron vetë sa herë hapen faqet dhe nga vijnë vizitorët (për shembull nga Instagrami ose nga Google), pa cookies, pa ruajtur adresën IP dhe pa asgjë që të identifikon. Prandaj nuk të kërkojmë leje për cookies.'],
        },
        { h: 'Lidhjet jashtë faqes', p: ['Instagrami, WhatsApp-i dhe Google Maps kanë rregullat e tyre të privatësisë kur i hap.'] },
        { h: 'Të drejtat e tua', p: ['Mund të kërkosh të shohësh, të ndreqësh ose të fshish të dhënat e tua. Na shkruaj në Instagram dhe të përgjigjemi.'] },
      ],
    },
    en: {
      title: 'Privacy',
      updated: 'Last updated 2 October 2026',
      intro: 'This page explains what data the Dresses by Greta online shop collects, why, and what you can ask about it.',
      sections: [
        { id: 'who', h: 'Who we are', p: [`Dresses by Greta, a dress shop at ${where}, Tirana. For any question about your data, message us on Instagram, @dressesbygreta.`] },
        {
          h: 'What we collect when you order',
          p: [
            'Your full name, phone number, email if you give one, city, address and delivery notes, the dresses you choose and how you pay.',
            'We use them only to confirm the order by phone, deliver it and keep the shop’s record of sales.',
          ],
        },
        {
          h: 'Who sees it',
          p: [
            'Greta and the people who work in the shop. Whoever delivers your order receives your name, phone number and address.',
            'The alert for a new order reaches the shop’s phone through Telegram, with your name, phone number, city and the dresses.',
            'The site and the data are hosted by Cloudflare, the company that runs the site; orders are stored in Western Europe. We do not sell your data or give it to anyone else.',
          ],
        },
        { h: 'How long we keep it', p: ['Orders stay in the shop’s record of sales. If you want your data deleted, message us: we delete it wherever the law does not require us to keep it.'] },
        {
          h: 'Cookies and storage on your device',
          p: [
            'The site uses no advertising or tracking cookies.',
            'Your bag is kept only on your device, in the browser’s storage, so it is there when you come back. The Stop animations choice is kept there too. Staff sign-in to the admin uses one cookie that serves only that.',
          ],
        },
        {
          h: 'Counting visits',
          p: ['The shop counts by itself how often pages are opened and where visitors come from (for example Instagram or Google), without cookies, without storing IP addresses and without anything that identifies you. That is why we do not ask you to accept cookies.'],
        },
        { h: 'Links to other sites', p: ['Instagram, WhatsApp and Google Maps have their own privacy rules when you open them.'] },
        { h: 'Your rights', p: ['You can ask to see, correct or delete your data. Message us on Instagram and we will answer.'] },
      ],
    },
    fr: {
      title: 'Confidentialité',
      updated: 'Mis à jour le 2 octobre 2026',
      intro: 'Cette page explique quelles données la boutique en ligne Dresses by Greta recueille, pourquoi, et ce que vous pouvez demander à leur sujet.',
      sections: [
        { id: 'who', h: 'Qui nous sommes', p: [`Dresses by Greta, boutique de robes, ${where}, Tirana. Pour toute question sur vos données, écrivez-nous sur Instagram, @dressesbygreta.`] },
        {
          h: 'Ce que nous recueillons quand vous commandez',
          p: [
            'Vos nom et prénom, votre numéro de téléphone, votre e-mail si vous l’indiquez, la ville, l’adresse et les remarques de livraison, les robes choisies et le mode de paiement.',
            'Nous les utilisons uniquement pour confirmer la commande par téléphone, la livrer et garder une trace des ventes de la boutique.',
          ],
        },
        {
          h: 'Qui les voit',
          p: [
            'Greta et les personnes qui travaillent à la boutique. La personne qui livre reçoit votre nom, votre téléphone et votre adresse.',
            'L’alerte de nouvelle commande arrive sur le téléphone de la boutique par Telegram, avec votre nom, votre téléphone, la ville et les robes.',
            'Le site et les données sont hébergés par Cloudflare, l’entreprise qui fait fonctionner le site ; les commandes sont stockées en Europe de l’Ouest. Nous ne les vendons pas et ne les donnons à personne d’autre.',
          ],
        },
        { h: 'Combien de temps nous les gardons', p: ['Les commandes restent dans le registre des ventes de la boutique. Si vous voulez que vos données soient effacées, écrivez-nous : nous les effaçons lorsque la loi ne nous oblige pas à les garder.'] },
        {
          h: 'Cookies et mémoire de l’appareil',
          p: [
            'Le site n’utilise aucun cookie publicitaire ni de suivi.',
            'Votre panier est conservé uniquement sur votre appareil, dans la mémoire du navigateur, pour le retrouver à votre retour. Le choix « Arrêter les animations » y est conservé aussi. La connexion du personnel à l’administration utilise un cookie qui ne sert qu’à cela.',
          ],
        },
        {
          h: 'Comptage des visites',
          p: ['La boutique compte elle-même les pages ouvertes et d’où viennent les visiteurs (par exemple Instagram ou Google), sans cookies, sans enregistrer d’adresse IP et sans rien qui vous identifie. C’est pourquoi nous ne vous demandons pas d’accepter des cookies.'],
        },
        { h: 'Liens vers d’autres sites', p: ['Instagram, WhatsApp et Google Maps ont leurs propres règles de confidentialité lorsque vous les ouvrez.'] },
        { h: 'Vos droits', p: ['Vous pouvez demander à consulter, corriger ou effacer vos données. Écrivez-nous sur Instagram et nous vous répondrons.'] },
      ],
    },
  },
  terms: {
    sq: {
      title: 'Kushtet e shitjes',
      updated: 'Përditësuar më 2 tetor 2026',
      intro: 'Këto janë kushtet kur blen një fustan në dyqanin online të Dresses by Greta.',
      sections: [
        { id: 'seller', h: 'Shitësi', p: [`Dresses by Greta, ${where}, Tiranë. Instagram: @dressesbygreta.`] },
        { h: 'Çmimet', p: ['Çmimet janë në lekë dhe janë ato që shfaqen te fustani. Tarifa e transportit shfaqet te porosia, ose konfirmohet me telefon kur nuk shfaqet.'] },
        {
          h: 'Porosia',
          p: ['Porosia regjistrohet kur dërgon formularin dhe konfirmohet kur dyqani të telefonon. Çdo fustan ka copë të kufizuara në çdo masë; nëse një masë mbaron para konfirmimit, të njoftojmë dhe nuk paguan asgjë.'],
        },
        { h: 'Pagesa', p: ['Për momentin pagesa bëhet vetëm në dorëzim, me para në dorë.'] },
        { id: 'delivery', h: 'Dërgesa', p: ['Dërgojmë në Tiranë, në qytetet e tjera të Shqipërisë dhe në Kosovë. Kohën e dërgesës e caktojmë bashkë me ty në telefon.'] },
        { h: 'Masat', p: ['Masat janë europiane: 34 është XS, 36 S, 38 M, 40 L, 42 XL. Nëse nuk je e sigurt për masën, na pyet në Instagram para porosisë.'] },
        { h: 'Qiraja', p: ['Marrja me qira e fustaneve rregullohet në Instagram, jo në këtë faqe.'] },
        { h: 'Pyetje', p: ['Për çdo pyetje para ose pas blerjes, na shkruaj në Instagram ose eja në dyqan.'] },
      ],
    },
    en: {
      title: 'Terms of sale',
      updated: 'Last updated 2 October 2026',
      intro: 'These are the terms when you buy a dress in the Dresses by Greta online shop.',
      sections: [
        { id: 'seller', h: 'The seller', p: [`Dresses by Greta, ${where}, Tirana. Instagram: @dressesbygreta.`] },
        { h: 'Prices', p: ['Prices are in Albanian lek (ALL) and are the ones shown on the dress. The delivery fee shows at checkout, or is confirmed by phone when it does not show.'] },
        {
          h: 'Your order',
          p: ['Your order is registered when you send the form and confirmed when the shop calls you. Each dress is available in limited numbers in each size; if a size sells out before confirmation, we tell you and you pay nothing.'],
        },
        { h: 'Payment', p: ['For now you pay only on delivery, in cash.'] },
        { id: 'delivery', h: 'Delivery', p: ['We deliver in Tirana, to other cities in Albania and to Kosovo. We agree the delivery time with you by phone.'] },
        { h: 'Sizes', p: ['Sizes are European: 34 is XS, 36 S, 38 M, 40 L, 42 XL. If you are unsure of your size, ask us on Instagram before ordering.'] },
        { h: 'Rentals', p: ['Renting a dress is arranged on Instagram, not on this site.'] },
        { h: 'Questions', p: ['For any question before or after buying, message us on Instagram or come to the shop.'] },
      ],
    },
    fr: {
      title: 'Conditions de vente',
      updated: 'Mis à jour le 2 octobre 2026',
      intro: 'Voici les conditions lorsque vous achetez une robe sur la boutique en ligne Dresses by Greta.',
      sections: [
        { id: 'seller', h: 'Le vendeur', p: [`Dresses by Greta, ${where}, Tirana. Instagram : @dressesbygreta.`] },
        { h: 'Les prix', p: ['Les prix sont en leks albanais (ALL) et sont ceux affichés sur la robe. Les frais de livraison s’affichent lors de la commande, ou sont confirmés par téléphone lorsqu’ils ne s’affichent pas.'] },
        {
          h: 'La commande',
          p: ['La commande est enregistrée lorsque vous envoyez le formulaire et confirmée lorsque la boutique vous appelle. Chaque robe existe en nombre limité dans chaque taille ; si une taille est épuisée avant la confirmation, nous vous prévenons et vous ne payez rien.'],
        },
        { h: 'Le paiement', p: ['Pour le moment, le paiement se fait uniquement à la livraison, en espèces.'] },
        { id: 'delivery', h: 'La livraison', p: ['Nous livrons à Tirana, dans les autres villes d’Albanie et au Kosovo. Nous convenons avec vous du moment de la livraison par téléphone.'] },
        { h: 'Les tailles', p: ['Tailles européennes : 34 correspond au XS, 36 au S, 38 au M, 40 au L, 42 au XL. En cas de doute sur votre taille, demandez-nous sur Instagram avant de commander.'] },
        { h: 'La location', p: ['La location des robes se règle sur Instagram, pas sur ce site.'] },
        { h: 'Questions', p: ['Pour toute question avant ou après l’achat, écrivez-nous sur Instagram ou passez à la boutique.'] },
      ],
    },
  },
};

/* ---------------------------------------------------- the parts the admin fills in ---------------------------------------------------- */

const MONTHS: Record<Lang, string[]> = {
  sq: ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
};

/** "Përditësuar më 2 tetor 2026", "Last updated 2 October 2026", "Mis à jour le 1er octobre 2026"
 *  (written by hand: the Worker has no Albanian dates). */
export function updatedLine(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number);
  const day = lang === 'fr' && d === 1 ? '1er' : String(d);
  const date = `${day} ${MONTHS[lang][(m ?? 1) - 1]} ${y}`;
  return lang === 'sq' ? `Përditësuar më ${date}` : lang === 'fr' ? `Mis à jour le ${date}` : `Last updated ${date}`;
}

const identity = (b: Business): string => {
  const reg = [b.legalName, b.nipt && `NIPT ${b.nipt}`].filter(Boolean).join(', ');
  return reg ? `Dresses by Greta (${reg})` : 'Dresses by Greta';
};

/** French sets a space before the colon (the page makes it non-breaking). */
const colon = (lang: Lang): string => (lang === 'fr' ? ' :' : ':');

const contact = (lang: Lang, b: Business): string =>
  [b.phone && `${lang === 'sq' ? 'Telefon' : lang === 'fr' ? 'Téléphone' : 'Phone'}${colon(lang)} ${b.phone}.`, b.email && `${lang === 'fr' ? 'E-mail' : 'Email'}${colon(lang)} ${b.email}.`]
    .filter(Boolean)
    .map((s) => ` ${s}`)
    .join('');

/** Privacy, "who we are": the shop, its registration and how to reach it. */
export function whoText(lang: Lang, b: Business): string {
  if (lang === 'sq') return `${identity(b)}, dyqan fustanesh në ${where}, Tiranë.${contact(lang, b)} Për çdo pyetje mbi të dhënat e tua, na shkruaj në Instagram, @dressesbygreta.`;
  if (lang === 'fr') return `${identity(b)}, boutique de robes, ${where}, Tirana.${contact(lang, b)} Pour toute question sur vos données, écrivez-nous sur Instagram, @dressesbygreta.`;
  return `${identity(b)}, a dress shop at ${where}, Tirana.${contact(lang, b)} For any question about your data, message us on Instagram, @dressesbygreta.`;
}

/** Terms, "the seller". */
export function sellerText(lang: Lang, b: Business): string {
  return `${identity(b)}, ${where}, ${lang === 'sq' ? 'Tiranë' : 'Tirana'}.${contact(lang, b)} Instagram${colon(lang)} @dressesbygreta.`;
}

const RETURNS: Record<Lang, { h: string; within: (n: number) => string; none: string; exchange: string; refund: string; unworn: string; customer: string; shop: string; how: string }> = {
  sq: {
    h: 'Kthimet dhe ndërrimet',
    within: (n) => `Brenda ${n === 1 ? '1 dite' : `${n} ditëve`} nga dorëzimi`,
    none: 'Fustanet nuk kthehen dhe nuk ndërrohen pas dorëzimit.',
    exchange: 'mund ta ndërrosh fustanin me një masë tjetër ose me një fustan tjetër.',
    refund: 'mund ta kthesh fustanin dhe të marrësh paratë mbrapsht, ose ta ndërrosh me një masë apo fustan tjetër.',
    unworn: 'Fustani duhet të jetë i paveshur dhe me etiketë.',
    customer: 'Transportin e kthimit e paguan klienti.',
    shop: 'Transportin e kthimit e paguan dyqani.',
    how: 'Për një kthim ose ndërrim, na shkruaj në Instagram.',
  },
  en: {
    h: 'Returns and exchanges',
    within: (n) => `Within ${n} day${n === 1 ? '' : 's'} of delivery,`,
    none: 'Dresses cannot be returned or exchanged after delivery.',
    exchange: 'you can exchange the dress for another size or another dress.',
    refund: 'you can return the dress for a refund, or exchange it for another size or dress.',
    unworn: 'The dress must be unworn and still have its tag.',
    customer: 'The customer pays the delivery for the return.',
    shop: 'The shop pays the delivery for the return.',
    how: 'For a return or an exchange, message us on Instagram.',
  },
  fr: {
    h: 'Retours et échanges',
    within: (n) => `Dans un délai de ${n} jour${n === 1 ? '' : 's'} après la livraison,`,
    none: 'Les robes ne sont ni reprises ni échangées après la livraison.',
    exchange: 'vous pouvez échanger la robe contre une autre taille ou une autre robe.',
    refund: 'vous pouvez retourner la robe et obtenir un remboursement, ou l’échanger contre une autre taille ou une autre robe.',
    unworn: 'La robe doit être non portée et avoir encore son étiquette.',
    customer: 'Les frais de livraison du retour sont à la charge du client.',
    shop: 'Les frais de livraison du retour sont à la charge de la boutique.',
    how: 'Pour un retour ou un échange, écrivez-nous sur Instagram.',
  },
};

/** Terms, "returns and exchanges", written from Greta's choices; null while she has not chosen. */
export function returnsSection(lang: Lang, r: Returns): { h: string; p: string[] } | null {
  if (!r.mode) return null;
  const t = RETURNS[lang];
  const p: string[] = [];
  if (r.mode === 'none') p.push(t.none);
  else {
    p.push(`${t.within(r.days)} ${r.mode === 'refund' ? t.refund : t.exchange}`);
    p.push([r.unworn ? t.unworn : '', r.shipping === 'shop' ? t.shop : t.customer].filter(Boolean).join(' '));
    p.push(t.how);
  }
  // Greta writes her note in Albanian and English; French reads the English, as the dresses do
  const note = (lang === 'sq' ? r.noteSq || r.noteEn : r.noteEn || r.noteSq).trim();
  if (note) p.push(note);
  return { h: t.h, p };
}
