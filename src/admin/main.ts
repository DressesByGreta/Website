/**
 * The admin: Greta's back office, in Albanian. Dresses (add, edit, publish, delete, order),
 * their photographs (upload, order, delete), stock per size, orders, delivery fees.
 * Operate mode: plain, dense, fast; the storefront's type and colour, none of its choreography.
 */
import { nameSvg } from '../shared/brand';
import { CATEGORIES, NEW_DAYS, PHOTO_SHARP_WIDTH, SIZES, SIZE_LETTER, formatLek, pad2, photoAt, type Zone } from '../shared/catalog';
import { copy } from '../shared/copy';
import { html, raw, type Raw } from '../shared/html';
import { returnsSection, sellerText, type Business, type Returns } from '../shared/legal';
import { addDays, isDay, monthStart, tiranaDay, weekStart } from '../shared/time';
import {
  api,
  ApiError,
  uploadPhoto,
  type AdminProduct,
  type InstagramState,
  type LinkedChat,
  type OrderDetail,
  type OrderStatus,
  type OrderSummary,
  type SalesReport,
  type StatsReport,
} from './api';
import { prepare, toForm } from './images';
import { byDay, byDress, bySize, counted, salesFile, summarize, tally } from './sales';
import { XLSX_TYPE } from './xlsx';

const root = document.getElementById('admin')!;
const cats = copy.sq.categories;
const lek = (n: number) => formatLek(n, 'sq');

const STATUS: Record<OrderStatus, string> = {
  awaiting_payment: 'Pret pagesën',
  new: 'E re',
  confirmed: 'Konfirmuar',
  shipped: 'Dërguar',
  delivered: 'Dorëzuar',
  cancelled: 'Anuluar',
};
const PAYMENT: Record<string, string> = { unpaid: 'Pa paguar', pending: 'Në pritje', paid: 'Paguar', failed: 'Dështoi', refunded: 'Rimbursuar' };
const METHOD: Record<string, string> = { cod: 'Në dorëzim', card: 'Kartë' };
const ACTION: Record<OrderStatus, string> = {
  awaiting_payment: '',
  new: 'Shëno si të paguar me kartë',
  confirmed: 'Konfirmo porosinë',
  shipped: 'Shëno si të dërguar',
  delivered: 'Shëno si të dorëzuar',
  cancelled: 'Anulo porosinë',
};
const ZONE: Record<string, string> = copy.sq.checkout.zones;

const icon = {
  left: raw('<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M9 2 4 7l5 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'),
  right: raw('<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m5 2 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'),
  up: raw('<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 9l5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'),
  down: raw('<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m2 5 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'),
  minus: raw('<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10" stroke="currentColor" stroke-width="1.2"/></svg>'),
  plus: raw('<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M6 1v10" stroke="currentColor" stroke-width="1.2"/></svg>'),
  grip: raw('<svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true"><g fill="currentColor"><circle cx="2" cy="3" r="1.2"/><circle cx="8" cy="3" r="1.2"/><circle cx="2" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="2" cy="13" r="1.2"/><circle cx="8" cy="13" r="1.2"/></g></svg>'),
};

/* ------------------------------------------------------------------ shell ------------------------------------------------------------------ */

// Each view listens on the shared root; the controller drops the previous view's listeners.
let ctl = new AbortController();
function on<K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void): void {
  root.addEventListener(type, fn as EventListener, { signal: ctl.signal });
}

let dirty = false;
window.addEventListener('beforeunload', (e) => {
  if (dirty) e.preventDefault();
});

function toast(text: string, kind: 'ok' | 'err' = 'ok'): void {
  const el = document.createElement('p');
  el.className = `adm-toast adm-toast--${kind}`;
  el.setAttribute('role', kind === 'err' ? 'alert' : 'status');
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(() => el.classList.add('is-out'), 2600);
  window.setTimeout(() => el.remove(), 3000);
}

const errText = (e: unknown): string => {
  if (!(e instanceof ApiError)) return 'Diçka nuk funksionoi. Provo përsëri.';
  const map: Record<string, string> = {
    cannot_publish: `Për ta publikuar mungon: ${(e.body.reasons ?? []).map((r) => (r === 'price' ? 'çmimi' : 'të paktën një foto')).join(' dhe ')}.`,
    invalid: `Kontrollo fushat: ${(e.body.fields ?? []).join(', ')}.`,
    last_photo_of_published: 'Një fustan i publikuar duhet të ketë të paktën një foto. Kthe në draft për ta hequr.',
    too_many_photos: 'Maksimumi është 12 foto për fustan.',
    wrong_password: 'Fjalëkalim i gabuar.',
    too_many_attempts: 'Shumë përpjekje. Provo pas 15 minutash.',
    no_password_set: 'Fjalëkalimi i adminit nuk është vendosur ende.',
    unauthorized: 'Sesioni mbaroi. Hyr përsëri.',
    network: 'Pa lidhje interneti.',
    not_allowed: 'Ky ndryshim statusi nuk lejohet.',
    one_zone_required: 'Të paktën një zonë duhet të jetë aktive.',
    telegram_off: 'Boti i Telegramit nuk është vendosur.',
    telegram_down: 'Telegrami nuk u përgjigj. Provo përsëri pas pak.',
    instagram_token: 'Instagrami nuk e pranoi tokenin. Kontrollo që e ke kopjuar të plotë.',
  };
  return map[e.body.error ?? ''] ?? 'Diçka nuk funksionoi. Provo përsëri.';
};

/** A confirmation in the admin's own look (the browser's confirm box looks foreign on a phone).
 *  The safe answer has the focus, and Escape means no. */
function ask(text: string, action: string): Promise<boolean> {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'adm-dialog';
    d.setAttribute('aria-label', text);
    d.innerHTML = html`<p>${text}</p>
      <div class="adm-actions">
        <button class="btn adm-danger-fill" type="button" data-yes>${action}</button>
        <button class="btn btn--line" type="button" data-no>Kthehu</button>
      </div>`.value;
    document.body.appendChild(d);
    const done = (yes: boolean) => {
      d.close();
      d.remove();
      resolve(yes);
    };
    d.querySelector('[data-yes]')!.addEventListener('click', () => done(true));
    d.querySelector('[data-no]')!.addEventListener('click', () => done(false));
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      done(false);
    });
    d.showModal();
    d.querySelector<HTMLElement>('[data-no]')!.focus();
  });
}

/** Where an order or a visit came from, in Albanian. */
const SOURCE: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  direct: 'Direkt',
  other: 'Të tjera',
  share: 'Lidhje e shpërndarë',
};
const sourceLabel = (s: string): string => {
  const [src, campaign] = (s || 'direct').split('/');
  return `${SOURCE[src ?? ''] ?? src}${campaign ? ` · ${campaign}` : ''}`;
};

function frame(active: 'products' | 'orders' | 'sales' | 'stats' | 'settings', body: Raw, badge = 0): Raw {
  const tab = (key: typeof active, href: string, label: string, extra: Raw | string = '') =>
    html`<a class="adm-tab${active === key ? ' is-on' : ''}" href="${href}" data-link${active === key ? raw(' aria-current="page"') : ''}>${label}${extra}</a>`;
  return html`<header class="adm-top">
      <a class="adm-brand" href="/admin" data-link aria-label="Dresses by Greta, Admin">${raw(nameSvg('adm-brand__name'))}<span class="adm-brand__sub">Admin</span></a>
      <nav class="adm-tabs" aria-label="Admin">
        ${tab('products', '/admin', 'Fustanet')}
        ${tab('orders', '/admin/porosi', 'Porositë', badge ? html`<span class="adm-badge">${badge}</span>` : '')}
        ${tab('sales', '/admin/shitjet', 'Shitjet')}
        ${tab('stats', '/admin/statistikat', 'Statistikat')}
        ${tab('settings', '/admin/cilesimet', 'Cilësimet')}
      </nav>
      <div class="adm-top__end">
        <a class="adm-link" href="/" target="_blank" rel="noopener">Shiko dyqanin</a>
        <button class="adm-link" type="button" data-logout>Dil</button>
      </div>
    </header>
    ${demo ? html`<p class="adm-demo" role="note">Të dhëna demo në këtë kompjuter: çmimet dhe gjendja janë shembuj, jo të dyqanit. Në dyqanin e vërtetë fillon nga zero.</p>` : ''}
    <main class="adm-main" id="adm-main" tabindex="-1">${body}</main>`;
}

function mount(markup: Raw): void {
  root.innerHTML = markup.value;
  // on a phone the tabs scroll sideways: show the open one, and fade each edge where more tabs wait
  const tabs = root.querySelector<HTMLElement>('.adm-tabs');
  if (!tabs || tabs.scrollWidth <= tabs.clientWidth) return;
  const on = tabs.querySelector<HTMLElement>('.is-on');
  if (on) tabs.scrollLeft = Math.max(0, on.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - on.offsetWidth) / 2);
  const more = () => {
    tabs.classList.toggle('is-more', tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2);
    tabs.classList.toggle('is-less', tabs.scrollLeft > 2);
  };
  tabs.addEventListener('scroll', more, { passive: true });
  more();
}

async function go(path: string, push = true): Promise<void> {
  if (dirty && !(await ask('Ke ndryshime të paruajtura. Të largohem pa i ruajtur?', 'Largohu pa ruajtur'))) return;
  dirty = false;
  if (push) history.pushState(null, '', path);
  await route();
  document.getElementById('adm-main')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-link]');
  if (a && !e.metaKey && !e.ctrlKey && e.button === 0) {
    e.preventDefault();
    void go(a.getAttribute('href')!);
  }
  if ((e.target as Element).closest('[data-logout]')) {
    void api.logout().then(() => {
      dirty = false;
      void route();
    });
  }
});
window.addEventListener('popstate', () => void route());

let newOrders = 0;
let demo = false;
async function refreshBadge(): Promise<void> {
  try {
    const s = await api.summary();
    newOrders = s.newOrders;
    demo = s.demo;
  } catch {
    /* keep */
  }
}

async function route(): Promise<void> {
  ctl.abort();
  ctl = new AbortController();
  let me;
  try {
    me = await api.me();
  } catch {
    mount(html`<p class="adm-empty">Serveri nuk përgjigjet.</p>`);
    return;
  }
  if (!me.admin) return login(me.devLogin, me.passwordSet);
  await refreshBadge();
  const p = location.pathname.replace(/\/+$/, '') || '/admin';
  let m: RegExpMatchArray | null;
  if ((m = p.match(/^\/admin\/produkt\/([\w-]+)$/))) return editor(m[1]!);
  if ((m = p.match(/^\/admin\/porosi\/([\w-]+)$/))) return orderView(m[1]!);
  if (p === '/admin/porosi') return ordersView();
  if (p === '/admin/shitjet') return salesView();
  if (p === '/admin/statistikat') return statsView();
  if (p === '/admin/cilesimet') return settingsView();
  return productsView();
}

/* ------------------------------------------------------------------ login ------------------------------------------------------------------ */

function login(devLogin: boolean, passwordSet: boolean): void {
  mount(html`<div class="adm-login">
    <p><span class="sr-only">Dresses by Greta</span>${raw(nameSvg('adm-brand__name'))}</p>
    <h1 class="adm-h1">Hyr në admin</h1>
    ${passwordSet
      ? html`<form class="adm-stack" data-login>
          <div class="adm-field">
            <label for="adm-password"><span>Fjalëkalimi</span></label>
            <div class="adm-pw">
              <input class="adm-input" id="adm-password" type="password" name="password" autocomplete="current-password" required />
              <button class="adm-link" type="button" data-pw aria-controls="adm-password" aria-pressed="false" aria-label="Shfaq fjalëkalimin">Shfaq</button>
            </div>
          </div>
          <button class="btn btn--wide" type="submit">Hyr</button>
          <p class="adm-error" data-error hidden></p>
        </form>`
      : html`<p class="adm-note">Fjalëkalimi nuk është vendosur ende. Në kompjuter: <code>npm run admin:password</code>, pastaj rinis serverin.</p>`}
    ${devLogin ? html`<button class="btn btn--line btn--wide" type="button" data-dev>Hyr pa fjalëkalim (vetëm në këtë kompjuter)</button>` : ''}
  </div>`);
  root.querySelector<HTMLFormElement>('[data-login]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget as HTMLFormElement;
    const err = f.querySelector<HTMLElement>('[data-error]')!;
    try {
      await api.login((f.elements.namedItem('password') as HTMLInputElement).value);
      await route();
    } catch (x) {
      err.textContent = errText(x);
      err.hidden = false;
    }
  });
  root.querySelector('[data-dev]')?.addEventListener('click', async () => {
    await api.devLogin();
    await route();
  });
  // show or hide the password while typing it (on a phone a typo is easy and invisible)
  root.querySelector<HTMLButtonElement>('[data-pw]')?.addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    const input = root.querySelector<HTMLInputElement>('#adm-password')!;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.textContent = show ? 'Fshih' : 'Shfaq';
    b.setAttribute('aria-pressed', String(show));
    b.setAttribute('aria-label', show ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin');
  });
  root.querySelector<HTMLInputElement>('input')?.focus();
}

/* ---------------------------------------------------------------- products ---------------------------------------------------------------- */

const totalStock = (p: AdminProduct) => SIZES.reduce((n, s) => n + p.stock[s], 0);

async function productsView(): Promise<void> {
  mount(frame('products', html`<p class="adm-empty">Po ngarkohen fustanet</p>`, newOrders));
  let list: AdminProduct[];
  try {
    list = await api.products();
  } catch (e) {
    toast(errText(e), 'err');
    return;
  }
  let filter = new URLSearchParams(location.search).get('f') ?? 'all';
  let query = '';

  const now = new Date().toISOString();
  const row = (p: AdminProduct, i: number, n: number) => {
    const cover = p.photos[0];
    const sold = totalStock(p) === 0;
    const fresh = p.status === 'published' && p.newUntil !== null && p.newUntil > now;
    return html`<li class="adm-row" data-id="${p.id}" draggable="true">
      <span class="adm-row__grip" aria-hidden="true">${icon.grip}</span>
      <a class="adm-row__thumb" href="/admin/produkt/${p.id}" data-link tabindex="-1" aria-hidden="true">${cover ? html`<img src="${photoAt(cover, 480)}" alt="" loading="lazy" width="48" height="64" />` : ''}</a>
      <span class="adm-row__main">
        <a class="adm-row__name" href="/admin/produkt/${p.id}" data-link>${p.nameSq}</a>
        <span class="adm-row__meta">
          <span class="adm-pill${p.status === 'published' ? ' is-live' : ''}">${p.status === 'published' ? 'Publikuar' : 'Draft'}</span>
          ${fresh ? html`<span class="adm-pill">Te «Të reja»</span>` : ''}
          ${p.featured ? html`<span class="adm-pill">Në kryefaqe</span>` : ''}
          ${sold ? html`<span class="adm-pill is-warn">Pa gjendje</span>` : ''}
          ${p.photos.some((ph) => ph.w < PHOTO_SHARP_WIDTH) ? html`<span class="adm-pill">Foto të vogla</span>` : ''}
          <span>${p.price !== null ? lek(p.price) : 'Pa çmim'}</span>
        </span>
      </span>
      <span class="adm-row__stock" aria-label="Gjendja sipas masës">${SIZES.map((s) => html`<span class="${p.stock[s] ? '' : 'is-zero'}"><b>${s}</b>${p.stock[s]}</span>`)}</span>
      <span class="adm-row__order">
        <button class="adm-icon" type="button" data-move="-1" aria-label="Lëvize lart"${i === 0 ? raw(' disabled') : ''}>${icon.up}</button>
        <button class="adm-icon" type="button" data-move="1" aria-label="Lëvize poshtë"${i === n - 1 ? raw(' disabled') : ''}>${icon.down}</button>
      </span>
    </li>`;
  };

  const counts = () => ({
    all: list.length,
    published: list.filter((p) => p.status === 'published').length,
    draft: list.filter((p) => p.status === 'draft').length,
    empty: list.filter((p) => totalStock(p) === 0).length,
  });

  const visible = () =>
    list.filter((p) => {
      if (filter === 'published' && p.status !== 'published') return false;
      if (filter === 'draft' && p.status !== 'draft') return false;
      if (filter === 'empty' && totalStock(p) !== 0) return false;
      return !query || `${p.nameSq} ${p.nameEn} ${p.color}`.toLowerCase().includes(query);
    });

  const draw = () => {
    const c = counts();
    const shown = visible();
    const canReorder = filter === 'all' && !query;
    const f = (key: string, label: string, n: number) =>
      html`<button type="button" class="adm-filter${filter === key ? ' is-on' : ''}" data-filter="${key}" aria-pressed="${String(filter === key)}">${label} <span>${n}</span></button>`;
    mount(
      frame(
        'products',
        html`<div class="adm-head">
          <h1 class="adm-h1">Fustanet</h1>
          <form class="adm-new" data-new>
            <label class="sr-only" for="adm-new-name">Emri i fustanit të ri</label>
            <input class="adm-input" id="adm-new-name" name="name" placeholder="Emri i fustanit të ri" maxlength="80" required />
            <button class="btn" type="submit">Shto fustan</button>
          </form>
        </div>
        <div class="adm-bar">
          <div class="adm-filters" role="group" aria-label="Filtro">
            ${f('all', 'Të gjitha', c.all)}${f('published', 'Publikuar', c.published)}${f('draft', 'Draft', c.draft)}${f('empty', 'Pa gjendje', c.empty)}
          </div>
          <input class="adm-input adm-search" type="search" placeholder="Kërko" aria-label="Kërko fustane" value="${query}" data-search />
        </div>
        ${shown.length
          ? html`<ol class="adm-list${canReorder ? '' : ' no-order'}" data-list>${shown.map((p, i) => row(p, i, shown.length))}</ol>`
          : html`<p class="adm-empty">${list.length ? 'Asnjë fustan me këtë filtër.' : 'Ende asnjë fustan. Shto të parin më lart.'}</p>`}
        ${canReorder ? '' : html`<p class="adm-note">Renditja ndryshohet te "Të gjitha", pa kërkim.</p>`}`,
        newOrders,
      ),
    );
    const s = root.querySelector<HTMLInputElement>('[data-search]');
    if (s && query) {
      s.focus();
      s.setSelectionRange(query.length, query.length);
    }
  };

  const persistOrder = async () => {
    try {
      await api.reorder(list.map((p) => p.id));
    } catch (e) {
      toast(errText(e), 'err');
    }
  };

  draw();
  on('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-search]')) {
      query = (t as HTMLInputElement).value.trim().toLowerCase();
      draw();
    }
  });
  on('click', (e) => {
    const t = e.target as HTMLElement;
    const fb = t.closest<HTMLElement>('[data-filter]');
    if (fb) {
      filter = fb.dataset.filter!;
      history.replaceState(null, '', filter === 'all' ? '/admin' : `/admin?f=${filter}`);
      draw();
      return;
    }
    const mv = t.closest<HTMLButtonElement>('[data-move]');
    if (mv) {
      const id = mv.closest<HTMLElement>('[data-id]')!.dataset.id!;
      const i = list.findIndex((p) => p.id === id);
      const j = i + Number(mv.dataset.move);
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j]!, list[i]!];
      draw();
      root.querySelector<HTMLElement>(`[data-id="${id}"] [data-move="${mv.dataset.move}"]`)?.focus();
      void persistOrder();
    }
  });
  on('submit', async (e) => {
    const f = (e.target as HTMLElement).closest<HTMLFormElement>('[data-new]');
    if (!f) return;
    e.preventDefault();
    const name = (f.elements.namedItem('name') as HTMLInputElement).value.trim();
    if (!name) return;
    try {
      const p = await api.create(name);
      await go(`/admin/produkt/${p.id}`);
    } catch (x) {
      toast(errText(x), 'err');
    }
  });

  // Desktop drag and drop; the arrow buttons do the same on touch and keyboard.
  let dragId: string | null = null;
  on('dragstart', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.adm-row');
    if (!li || filter !== 'all' || query) return e.preventDefault();
    dragId = li.dataset.id!;
    li.classList.add('is-drag');
    e.dataTransfer?.setData('text/plain', dragId);
  });
  on('dragover', (e) => {
    if (!dragId) return;
    const over = (e.target as HTMLElement).closest<HTMLElement>('.adm-row');
    if (!over || over.dataset.id === dragId) return;
    e.preventDefault();
    const from = list.findIndex((p) => p.id === dragId);
    const to = list.findIndex((p) => p.id === over.dataset.id);
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item!);
    const ol = root.querySelector('[data-list]')!;
    const dragged = ol.querySelector(`[data-id="${dragId}"]`)!;
    if (from < to) over.after(dragged);
    else over.before(dragged);
  });
  on('dragend', () => {
    if (!dragId) return;
    dragId = null;
    draw();
    void persistOrder();
  });
}

/* ----------------------------------------------------------------- editor ----------------------------------------------------------------- */

interface Draft {
  nameSq: string;
  nameEn: string;
  descriptionSq: string;
  descriptionEn: string;
  price: string;
  comparePrice: string;
  color: string;
  categories: string[];
  featured: boolean;
  instagramUrl: string;
  slug: string;
  status: 'draft' | 'published';
  stock: Record<string, string>;
}

const toDraft = (p: AdminProduct): Draft => ({
  nameSq: p.nameSq,
  nameEn: p.nameEn,
  descriptionSq: p.descriptionSq,
  descriptionEn: p.descriptionEn,
  price: p.price?.toString() ?? '',
  comparePrice: p.comparePrice?.toString() ?? '',
  color: p.color,
  categories: [...p.categories],
  featured: p.featured,
  instagramUrl: p.instagramUrl,
  slug: p.slug,
  status: p.status,
  stock: Object.fromEntries(SIZES.map((s) => [s, String(p.stock[s])])),
});

const COLORS = ['black', 'white', 'red', 'blue', 'green', 'pink', 'purple', 'lilac', 'gold', 'silver', 'grey', 'brown', 'yellow', 'teal'];

/** Whether the dress is in the shop's «Të reja» (new for NEW_DAYS from its first publication), and
 *  the one button that changes it: start the days again, or end them now. */
function newState(p: AdminProduct): Raw {
  const until = p.newUntil;
  const on = until !== null && until > new Date().toISOString();
  const text =
    until === null
      ? `Kur ta publikosh, shfaqet te «Të reja» për ${NEW_DAYS} ditë.`
      : on
        ? `Shfaqet te «Të reja» deri më ${dayMonth(tiranaDay(Date.parse(until)))}.`
        : 'Nuk shfaqet te «Të reja».';
  return html`<div class="adm-newstate" role="group" aria-labelledby="adm-new-h">
    <span class="adm-label" id="adm-new-h">Të reja</span>
    <p class="adm-note">${text}</p>
    ${until === null
      ? ''
      : html`<button class="adm-link" type="button" data-new-mark="${on ? 'off' : 'on'}">${on ? 'Hiqe nga «Të reja»' : `Shfaqe te «Të reja» për ${NEW_DAYS} ditë`}</button>`}
  </div>`;
}

async function editor(id: string): Promise<void> {
  mount(frame('products', html`<p class="adm-empty">Po hapet fustani</p>`, newOrders));
  let p: AdminProduct;
  try {
    p = await api.product(id);
  } catch (e) {
    mount(frame('products', html`<p class="adm-empty">${e instanceof ApiError && e.status === 404 ? 'Ky fustan nuk ekziston më.' : errText(e)}</p><a class="adm-link" href="/admin" data-link>Kthehu te fustanet</a>`, newOrders));
    return;
  }
  let saved = JSON.stringify(toDraft(p));
  const uploads: { key: string; name: string; progress: number; preview: string; error?: string }[] = [];

  const photoCard = (ph: AdminProduct['photos'][number], i: number, n: number) => html`<li class="adm-photo" data-photo="${ph.id}">
    <span class="adm-photo__img"><img src="${photoAt(ph, 480)}" alt="" loading="lazy" /></span>
    ${i === 0 ? html`<span class="adm-photo__cover">Kopertina</span>` : ''}
    <span class="adm-photo__acts">
      <button class="adm-icon" type="button" data-photo-move="-1" aria-label="Lëvize majtas"${i === 0 ? raw(' disabled') : ''}>${icon.left}</button>
      <button class="adm-icon" type="button" data-photo-move="1" aria-label="Lëvize djathtas"${i === n - 1 ? raw(' disabled') : ''}>${icon.right}</button>
      <button class="adm-link adm-danger" type="button" data-photo-del>Fshi</button>
    </span>
    <details class="adm-photo__alt">
      <summary>Përshkrimi i fotos</summary>
      <label class="adm-field"><span>Shqip</span><input class="adm-input" data-alt="sq" value="${ph.altSq}" maxlength="160" /></label>
      <label class="adm-field"><span>Anglisht</span><input class="adm-input" data-alt="en" value="${ph.altEn}" maxlength="160" /></label>
      <button class="adm-link" type="button" data-alt-save>Ruaj përshkrimin</button>
    </details>
    ${ph.w < PHOTO_SHARP_WIDTH ? html`<p class="adm-photo__soft">Foto e vogël, del e turbullt në kompjuter. Ngarko origjinalin.</p>` : ''}
  </li>`;

  const draw = () => {
    const d = toDraft(p);
    const live = p.status === 'published';
    mount(
      frame(
        'products',
        html`<div class="adm-head">
          <a class="adm-link adm-back" href="/admin" data-link>${icon.left} Fustanet</a>
          <div class="adm-head__end">
            <a class="adm-link" href="/fustan/${p.slug}" target="_blank" rel="noopener"${live ? '' : raw(' hidden')}>Shiko në dyqan</a>
            <button class="adm-link adm-danger" type="button" data-delete>Fshi fustanin</button>
          </div>
        </div>
        <h1 class="adm-h1">${p.nameSq}</h1>

        <form class="adm-editor" data-form novalidate>
          <section class="adm-card" aria-labelledby="sec-photos">
            <h2 class="adm-h2" id="sec-photos">Fotot <span class="adm-count">${p.photos.length} / 12</span></h2>
            <ol class="adm-photos" data-photos>
              ${p.photos.map((ph, i) => photoCard(ph, i, p.photos.length))}
              ${uploads.map(
                (u) => html`<li class="adm-photo is-uploading" data-upload="${u.key}">
                  <span class="adm-photo__img"><img src="${u.preview}" alt="" /></span>
                  <span class="adm-progress"><span style="transform: scaleX(${u.progress.toFixed(3)})"></span></span>
                  <span class="adm-photo__state">${u.error ?? 'Po ngarkohet'}</span>
                </li>`,
              )}
            </ol>
            <label class="adm-drop" data-drop>
              <input type="file" accept="image/*" multiple data-files class="sr-only" />
              <span class="btn btn--line">Shto foto</span>
              <span class="adm-note">Ose tërhiqi këtu. Fotoja e parë është kopertina në dyqan.</span>
            </label>
          </section>

          <section class="adm-card" aria-labelledby="sec-sell">
            <h2 class="adm-h2" id="sec-sell">Çmimi dhe gjendja</h2>
            <div class="adm-grid2">
              <label class="adm-field"><span>Çmimi (Lekë)</span><input class="adm-input" name="price" inputmode="numeric" value="${d.price}" placeholder="p.sh. 18000" /></label>
              <label class="adm-field"><span>Çmimi i mëparshëm (opsional)</span><input class="adm-input" name="comparePrice" inputmode="numeric" value="${d.comparePrice}" /></label>
            </div>
            <fieldset class="adm-sizes">
              <legend class="adm-label">Copë në gjendje sipas masës</legend>
              ${SIZES.map(
                (s) => html`<label class="adm-size">
                  <span class="adm-size__n">${s} <small>${SIZE_LETTER[s]}</small></span>
                  <span class="adm-stepper">
                    <button type="button" class="adm-icon" data-step="-1" data-size="${s}" aria-label="Një më pak në masën ${s}">${icon.minus}</button>
                    <input class="adm-input" name="stock-${s}" inputmode="numeric" value="${d.stock[s]}" aria-label="Copë në masën ${s}" />
                    <button type="button" class="adm-icon" data-step="1" data-size="${s}" aria-label="Një më shumë në masën ${s}">${icon.plus}</button>
                  </span>
                </label>`,
              )}
            </fieldset>
          </section>

          <section class="adm-card" aria-labelledby="sec-info">
            <h2 class="adm-h2" id="sec-info">Të dhënat</h2>
            <div class="adm-grid2">
              <label class="adm-field"><span>Emri në shqip</span><input class="adm-input" name="nameSq" value="${d.nameSq}" maxlength="80" required /></label>
              <label class="adm-field"><span>Emri në anglisht</span><input class="adm-input" name="nameEn" value="${d.nameEn}" maxlength="80" /></label>
              <label class="adm-field"><span>Përshkrimi në shqip</span><textarea class="adm-input adm-area" name="descriptionSq" rows="5" maxlength="2000">${d.descriptionSq}</textarea></label>
              <label class="adm-field"><span>Përshkrimi në anglisht</span><textarea class="adm-input adm-area" name="descriptionEn" rows="5" maxlength="2000">${d.descriptionEn}</textarea></label>
            </div>
            <fieldset class="adm-checks">
              <legend class="adm-label">Kategoritë</legend>
              ${CATEGORIES.map((c) => html`<label class="adm-check"><input type="checkbox" name="cat" value="${c}"${d.categories.includes(c) ? raw(' checked') : ''} /> ${cats[c]}</label>`)}
            </fieldset>
            ${newState(p)}
            <div class="adm-grid2">
              <label class="adm-field"><span>Ngjyra</span><input class="adm-input" name="color" value="${d.color}" list="adm-colors" maxlength="30" /></label>
              <label class="adm-field"><span>Linku në Instagram</span><input class="adm-input" name="instagramUrl" value="${d.instagramUrl}" inputmode="url" placeholder="https://www.instagram.com/p/..." /></label>
              <label class="adm-field"><span>Adresa në dyqan</span><span class="adm-prefix"><span>/fustan/</span><input class="adm-input" name="slug" value="${d.slug}" maxlength="60" /></span></label>
            </div>
            <datalist id="adm-colors">${COLORS.map((c) => html`<option value="${c}"></option>`)}</datalist>
            <label class="adm-check"><input type="checkbox" name="featured"${d.featured ? raw(' checked') : ''} /> Shfaqe në kryefaqe</label>
          </section>

          <div class="adm-savebar">
            <div class="adm-status" role="group" aria-label="Statusi">
              <label class="adm-radio"><input type="radio" name="status" value="draft"${d.status === 'draft' ? raw(' checked') : ''} /> Draft</label>
              <label class="adm-radio"><input type="radio" name="status" value="published"${d.status === 'published' ? raw(' checked') : ''} /> Publikuar</label>
            </div>
            <span class="adm-note" data-dirty aria-live="polite"></span>
            <button class="btn" type="submit" data-save>Ruaj</button>
          </div>
        </form>`,
        newOrders,
      ),
    );
  };

  const read = (): Draft => {
    const f = root.querySelector<HTMLFormElement>('[data-form]')!;
    const v = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value ?? '';
    return {
      nameSq: v('nameSq').trim(),
      nameEn: v('nameEn').trim(),
      descriptionSq: v('descriptionSq'),
      descriptionEn: v('descriptionEn'),
      price: v('price').replace(/\s|\./g, ''),
      comparePrice: v('comparePrice').replace(/\s|\./g, ''),
      color: v('color').trim(),
      categories: [...f.querySelectorAll<HTMLInputElement>('input[name="cat"]:checked')].map((x) => x.value),
      featured: (f.elements.namedItem('featured') as HTMLInputElement).checked,
      instagramUrl: v('instagramUrl').trim(),
      slug: v('slug').trim(),
      status: (f.querySelector<HTMLInputElement>('input[name="status"]:checked')?.value as Draft['status']) ?? 'draft',
      stock: Object.fromEntries(SIZES.map((s) => [s, v(`stock-${s}`).trim() || '0'])),
    };
  };

  const markDirty = () => {
    dirty = JSON.stringify(read()) !== saved;
    const el = root.querySelector('[data-dirty]');
    if (el) el.textContent = dirty ? 'Ndryshime të paruajtura' : '';
  };

  const replace = (fresh: AdminProduct, keepForm: boolean) => {
    const pending = keepForm ? read() : null;
    p = fresh;
    draw();
    if (pending) {
      const f = root.querySelector<HTMLFormElement>('[data-form]')!;
      for (const [k, v] of Object.entries(pending)) {
        if (k === 'stock') for (const s of SIZES) (f.elements.namedItem(`stock-${s}`) as HTMLInputElement).value = (v as Record<string, string>)[s] ?? '0';
        else if (k === 'categories') f.querySelectorAll<HTMLInputElement>('input[name="cat"]').forEach((x) => (x.checked = (v as string[]).includes(x.value)));
        else if (k === 'featured') (f.elements.namedItem('featured') as HTMLInputElement).checked = v as boolean;
        else if (k === 'status') f.querySelectorAll<HTMLInputElement>('input[name="status"]').forEach((x) => (x.checked = x.value === v));
        else {
          const el = f.elements.namedItem(k) as HTMLInputElement | null;
          if (el) el.value = v as string;
        }
      }
    }
    markDirty();
  };

  const upload = async (files: FileList | File[]) => {
    const room = 12 - p.photos.length - uploads.length;
    const list = [...files].slice(0, Math.max(0, room));
    if (list.length < files.length) toast('Maksimumi është 12 foto për fustan.', 'err');
    for (const file of list) {
      const key = crypto.randomUUID();
      const entry = { key, name: file.name, progress: 0, preview: '' };
      uploads.push(entry);
      try {
        const prepared = await prepare(file);
        entry.preview = prepared.preview;
        replace(p, true);
        const fresh = await uploadPhoto(p.id, toForm(prepared), (f) => {
          entry.progress = f;
          const bar = root.querySelector<HTMLElement>(`[data-upload="${key}"] .adm-progress span`);
          if (bar) bar.style.transform = `scaleX(${f.toFixed(3)})`;
        });
        uploads.splice(uploads.indexOf(entry), 1);
        URL.revokeObjectURL(prepared.preview);
        replace(fresh, true);
      } catch (e) {
        uploads.splice(uploads.indexOf(entry), 1);
        replace(p, true);
        const why: Record<string, string> = { too_small: 'fotoja është shumë e vogël.', too_big: 'fotoja është shumë e rëndë.' };
        toast(`${file.name}: ${(e instanceof Error && why[e.message]) || errText(e)}`, 'err');
      }
    }
  };

  draw();

  on('input', markDirty);
  on('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.matches('[data-files]') && t.files?.length) {
      void upload(t.files);
      t.value = '';
    }
    markDirty();
  });
  on('dragover', (e) => {
    if (!(e.target as Element).closest('[data-drop]')) return;
    e.preventDefault();
    root.querySelector('[data-drop]')?.classList.add('is-over');
  });
  on('dragleave', (e) => {
    if ((e.target as Element).closest('[data-drop]')) root.querySelector('[data-drop]')?.classList.remove('is-over');
  });
  on('drop', (e) => {
    if (!(e.target as Element).closest('[data-drop]')) return;
    e.preventDefault();
    root.querySelector('[data-drop]')?.classList.remove('is-over');
    if (e.dataTransfer?.files.length) void upload(e.dataTransfer.files);
  });

  on('click', async (e) => {
    const t = e.target as HTMLElement;
    const nw = t.closest<HTMLButtonElement>('[data-new-mark]');
    if (nw) {
      const start = nw.dataset.newMark === 'on';
      try {
        replace(await api.markNew(p.id, start), true);
        toast(start ? `Shfaqet te «Të reja» për ${NEW_DAYS} ditë.` : 'U hoq nga «Të reja».');
        root.querySelector<HTMLElement>('[data-new-mark]')?.focus();
      } catch (x) {
        toast(errText(x), 'err');
      }
      return;
    }
    const step = t.closest<HTMLButtonElement>('[data-step]');
    if (step) {
      const input = root.querySelector<HTMLInputElement>(`input[name="stock-${step.dataset.size}"]`)!;
      input.value = String(Math.max(0, Math.min(99, (parseInt(input.value, 10) || 0) + Number(step.dataset.step))));
      markDirty();
      return;
    }
    const card = t.closest<HTMLElement>('[data-photo]');
    if (card && t.closest('[data-photo-move]')) {
      const ids = p.photos.map((x) => x.id);
      const i = ids.indexOf(card.dataset.photo!);
      const j = i + Number(t.closest<HTMLElement>('[data-photo-move]')!.dataset.photoMove);
      if (j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j]!, ids[i]!];
      try {
        replace(await api.photoOrder(p.id, ids), true);
      } catch (x) {
        toast(errText(x), 'err');
      }
      return;
    }
    if (card && t.closest('[data-photo-del]')) {
      if (!(await ask('Ta fshij këtë foto?', 'Fshi foton'))) return;
      try {
        replace(await api.deletePhoto(card.dataset.photo!), true);
        toast('Fotoja u fshi.');
      } catch (x) {
        toast(errText(x), 'err');
      }
      return;
    }
    if (card && t.closest('[data-alt-save]')) {
      const sq = card.querySelector<HTMLInputElement>('[data-alt="sq"]')!.value;
      const en = card.querySelector<HTMLInputElement>('[data-alt="en"]')!.value;
      try {
        replace(await api.photoAlt(card.dataset.photo!, sq, en), true);
        toast('Përshkrimi u ruajt.');
      } catch (x) {
        toast(errText(x), 'err');
      }
      return;
    }
    if (t.closest('[data-delete]')) {
      if (!(await ask(`Ta fshij «${p.nameSq}»? Fotot fshihen gjithashtu. Porositë e vjetra mbeten.`, 'Fshi fustanin'))) return;
      try {
        await api.remove(p.id);
        dirty = false;
        toast('Fustani u fshi.');
        await go('/admin');
      } catch (x) {
        toast(errText(x), 'err');
      }
    }
  });

  on('submit', async (e) => {
    if (!(e.target as HTMLElement).matches('[data-form]')) return;
    e.preventDefault();
    const d = read();
    if (!d.nameSq) return toast('Emri në shqip është i detyrueshëm.', 'err');
    const num = (s: string) => (s === '' ? null : Number(s));
    const price = num(d.price);
    const compare = num(d.comparePrice);
    if ((price !== null && (!Number.isInteger(price) || price <= 0)) || (compare !== null && (!Number.isInteger(compare) || compare <= 0))) {
      return toast('Çmimi duhet të jetë numër i plotë në lekë, p.sh. 18000.', 'err');
    }
    const btn = root.querySelector<HTMLButtonElement>('[data-save]')!;
    btn.disabled = true;
    btn.textContent = 'Po ruhet';
    try {
      const fresh = await api.save(p.id, {
        nameSq: d.nameSq,
        nameEn: d.nameEn,
        descriptionSq: d.descriptionSq,
        descriptionEn: d.descriptionEn,
        price,
        comparePrice: compare,
        color: d.color,
        categories: d.categories as AdminProduct['categories'],
        featured: d.featured,
        instagramUrl: d.instagramUrl,
        slug: d.slug,
        status: d.status,
        stock: Object.fromEntries(SIZES.map((s) => [s, Math.max(0, parseInt(d.stock[s] ?? '0', 10) || 0)])) as AdminProduct['stock'],
      });
      saved = JSON.stringify(toDraft(fresh));
      replace(fresh, false);
      toast(fresh.status === 'published' ? 'U ruajt dhe është në dyqan.' : 'U ruajt si draft.');
    } catch (x) {
      toast(errText(x), 'err');
      btn.disabled = false;
      btn.textContent = 'Ruaj';
    }
  });
}

/* ------------------------------------------------------------------ orders ----------------------------------------------------------------- */

async function ordersView(): Promise<void> {
  const status = new URLSearchParams(location.search).get('s') ?? 'new';
  mount(frame('orders', html`<p class="adm-empty">Po ngarkohen porositë</p>`, newOrders));
  let list: OrderSummary[];
  try {
    list = await api.orders(status === 'all' ? undefined : status);
  } catch (e) {
    toast(errText(e), 'err');
    return;
  }
  const tabs: [string, string][] = [['new', 'Të reja'], ['awaiting_payment', 'Presin pagesën'], ['confirmed', 'Konfirmuar'], ['shipped', 'Dërguar'], ['delivered', 'Dorëzuar'], ['cancelled', 'Anuluar'], ['all', 'Të gjitha']];
  // 02.10, 14:05 by hand: without Albanian data in the browser the locale fell back to 10/02, 2:05 PM
  const date = (s: string) => {
    const d = new Date(s);
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  mount(
    frame(
      'orders',
      html`<div class="adm-head"><h1 class="adm-h1">Porositë</h1></div>
      <div class="adm-filters adm-filters--wrap" role="group" aria-label="Statusi">
        ${tabs.map(([k, l]) => html`<a class="adm-filter${status === k ? ' is-on' : ''}" href="/admin/porosi${k === 'new' ? '' : `?s=${k}`}" data-link${status === k ? raw(' aria-current="page"') : ''}>${l}</a>`)}
      </div>
      ${list.length
        ? html`<div class="adm-table-wrap"><table class="adm-table">
            <thead><tr><th>Nr.</th><th>Data</th><th>Klienti</th><th>Qyteti</th><th class="num">Copë</th><th class="num">Totali</th><th>Pagesa</th><th>Statusi</th></tr></thead>
            <tbody>
              ${list.map(
                (o) => html`<tr>
                  <td><a class="adm-row__name" href="/admin/porosi/${o.id}" data-link>${o.number}</a></td>
                  <td>${date(o.created_at)}</td>
                  <td>${o.customer_name}<br /><a class="adm-muted" href="tel:${o.phone.replace(/[^\d+]/g, '')}">${o.phone}</a></td>
                  <td>${o.city}</td>
                  <td class="num">${o.pieces}</td>
                  <td class="num">${lek(o.total)}</td>
                  <td>${METHOD[o.payment_method]}<br /><span class="adm-muted">${PAYMENT[o.payment_status]}</span></td>
                  <td><span class="adm-pill adm-pill--${o.status}">${STATUS[o.status]}</span></td>
                </tr>`,
              )}
            </tbody>
          </table></div>`
        : html`<p class="adm-empty">Asnjë porosi këtu.</p>`}`,
      newOrders,
    ),
  );
}

async function orderView(id: string): Promise<void> {
  mount(frame('orders', html`<p class="adm-empty">Po hapet porosia</p>`, newOrders));
  let d: OrderDetail;
  try {
    d = await api.order(id);
  } catch (e) {
    mount(frame('orders', html`<p class="adm-empty">${errText(e)}</p>`, newOrders));
    return;
  }
  const draw = () => {
    const o = d.order;
    const digits = o.phone.replace(/[^\d]/g, '');
    const wa = digits.startsWith('0') ? `355${digits.slice(1)}` : digits;
    mount(
      frame(
        'orders',
        html`<div class="adm-head">
          <a class="adm-link adm-back" href="/admin/porosi" data-link>${icon.left} Porositë</a>
          <button class="adm-link" type="button" data-print>Printo fletën e porosisë</button>
        </div>
        <h1 class="adm-h1">Porosia ${o.number} <span class="adm-pill adm-pill--${o.status}">${STATUS[o.status]}</span></h1>
        <div class="adm-order">
          <section class="adm-card">
            <h2 class="adm-h2">Fustanet</h2>
            <ul class="adm-items">
              ${d.items.map(
                (it) => html`<li>
                  ${it.image_key ? html`<img src="/img/${it.image_key}" alt="" width="56" height="75" />` : html`<span class="adm-noimg"></span>`}
                  <span>${it.product_id ? html`<a href="/admin/produkt/${it.product_id}" data-link>${it.name}</a>` : it.name}<br /><span class="adm-muted">Masa ${it.size} · ${it.qty} copë</span></span>
                  <span class="num">${lek(it.price * it.qty)}</span>
                </li>`,
              )}
            </ul>
            <dl class="adm-totals">
              <div><dt>Nëntotali</dt><dd>${lek(o.subtotal)}</dd></div>
              <div><dt>Transporti</dt><dd>${o.delivery_fee === null ? 'Konfirmohet me telefon' : lek(o.delivery_fee)}</dd></div>
              <div class="is-total"><dt>Totali</dt><dd>${lek(o.total)}</dd></div>
            </dl>
          </section>
          <section class="adm-card">
            <h2 class="adm-h2">Klienti</h2>
            <p class="adm-address">${o.customer_name}<br /><span class="adm-print-only">${o.phone}<br /></span>${o.address}<br />${o.city}, ${ZONE[o.zone] ?? o.zone}${o.email ? html`<br />${o.email}` : ''}</p>
            ${o.notes ? html`<p class="adm-notes">${o.notes}</p>` : ''}
            <div class="adm-actions">
              <a class="btn btn--line" href="tel:${o.phone.replace(/[^\d+]/g, '')}">Telefono ${o.phone}</a>
              <a class="btn btn--line" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>
            </div>
            <h2 class="adm-h2">Pagesa</h2>
            <p>${METHOD[o.payment_method]}, ${PAYMENT[o.payment_status]}</p>
            <h2 class="adm-h2">Nga erdhi</h2>
            <p>${sourceLabel(o.source)}</p>
            <h2 class="adm-h2 adm-no-print">Hapi tjetër</h2>
            <div class="adm-actions">
              ${d.next
                .filter((s) => s !== 'new')
                .map((s) => html`<button class="btn${s === 'cancelled' ? ' btn--line adm-danger-btn' : ''}" type="button" data-next="${s}">${ACTION[s]}</button>`)}
              ${o.payment_method === 'cod' && o.payment_status === 'unpaid' && o.status !== 'cancelled'
                ? html`<button class="btn btn--line" type="button" data-paid>Shëno si të paguar</button>`
                : ''}
            </div>
            ${d.next.includes('cancelled') ? html`<p class="adm-note">Anulimi i kthen fustanet në gjendje.</p>` : ''}
          </section>
        </div>`,
        newOrders,
      ),
    );
  };
  draw();
  on('click', async (e) => {
    const t = e.target as HTMLElement;
    // a packing slip: print.css in admin.css keeps the order and the customer, nothing else
    if (t.closest('[data-print]')) return window.print();
    const nx = t.closest<HTMLButtonElement>('[data-next]');
    if (nx) {
      const s = nx.dataset.next as OrderStatus;
      if (s === 'cancelled' && !(await ask('Ta anuloj këtë porosi? Fustanet kthehen në gjendje.', 'Anulo porosinë'))) return;
      try {
        d = await api.updateOrder(id, { status: s });
        await refreshBadge();
        draw();
        toast(`Statusi: ${STATUS[d.order.status]}.`);
      } catch (x) {
        toast(errText(x), 'err');
      }
    }
    if (t.closest('[data-paid]')) {
      try {
        d = await api.updateOrder(id, { paymentStatus: 'paid' });
        draw();
        toast('U shënua si e paguar.');
      } catch (x) {
        toast(errText(x), 'err');
      }
    }
  });
}

/* ----------------------------------------------------------------- settings ---------------------------------------------------------------- */

/* ------------------------------------------------------------------ stats ------------------------------------------------------------------- */

const FIELD: Record<string, string> = { name: 'Emri', phone: 'Telefoni', email: 'Email', zone: 'Zona', city: 'Qyteti', address: 'Adresa', payment: 'Pagesa' };
const share = (a: number, b: number, per = 100): string => (b ? String(Math.round((a / b) * per * 10) / 10).replace('.', ',') : '0');

/** Visits, where they come from, the dresses looked at, how the order form does, and links with a
 *  campaign for Instagram posts. Counted by the shop itself (src/worker/stats.ts). */
async function statsView(): Promise<void> {
  mount(frame('stats', html`<p class="adm-empty">Po ngarkohen statistikat</p>`, newOrders));
  const asked = Number(new URLSearchParams(location.search).get('dite'));
  const days = [7, 30, 90].includes(asked) ? asked : 30;
  let s: StatsReport;
  try {
    s = await api.stats(days);
  } catch (e) {
    toast(errText(e), 'err');
    return;
  }
  const top = Math.max(1, ...s.daily.map((d) => d.n));
  const bar = (n: number, of: number) => html`<span class="adm-bar" aria-hidden="true"><span style="transform: scaleX(${(n / Math.max(1, of)).toFixed(3)})"></span></span>`;
  const dayName = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
  const topSource = Math.max(1, ...s.sources.map((x) => x.visits));
  const topDress = Math.max(1, ...s.dresses.map((x) => x.n));
  mount(
    frame(
      'stats',
      html`<div class="adm-head">
        <h1 class="adm-h1">Statistikat</h1>
        <nav class="adm-seg" aria-label="Periudha">
          ${[7, 30, 90].map((d) => html`<a class="adm-seg__item${d === days ? ' is-on' : ''}" href="/admin/statistikat?dite=${d}" data-link${d === days ? raw(' aria-current="page"') : ''}>${d} ditë</a>`)}
        </nav>
      </div>
      <p class="adm-note adm-stats-note">Numërohen nga vetë dyqani, pa cookies dhe pa të dhëna personale. Robotët nuk numërohen.</p>
      <section class="adm-card" aria-label="Përmbledhja">
        <dl class="adm-kpis">
          <div><dt>Vizita</dt><dd>${count(s.visits)}</dd></div>
          <div><dt>Faqe të hapura</dt><dd>${count(s.views)}</dd></div>
          <div><dt>Porosi</dt><dd>${count(s.sales.orders)}</dd></div>
          <div><dt>Shitjet</dt><dd>${lek(s.sales.total)}</dd></div>
          <div><dt>Porosi për 100 vizita</dt><dd>${share(s.sales.orders, s.visits)}</dd></div>
        </dl>
        <div class="adm-days" role="img" aria-label="Vizitat për ditë, ${days} ditët e fundit">
          ${s.daily.map((d) => html`<span title="${dayName(d.day)}: ${d.n} vizita" style="--h: ${(d.n / top).toFixed(3)}"></span>`)}
        </div>
        <p class="adm-days__ends adm-note"><span>${dayName(s.daily[0]?.day ?? '')}</span><span>${dayName(s.daily[s.daily.length - 1]?.day ?? '')}</span></p>
      </section>
      <div class="adm-grid2 adm-stats">
        <section class="adm-card" aria-labelledby="st-src">
          <h2 class="adm-h2" id="st-src">Nga vijnë vizitorët</h2>
          ${s.sources.length
            ? html`<table class="adm-table"><thead><tr><th>Burimi</th><th><span class="sr-only">Pjesa</span></th><th class="num">Vizita</th><th class="num">Porosi</th></tr></thead>
              <tbody>${s.sources.map((x) => html`<tr><td>${sourceLabel(x.key)}</td><td class="adm-bar-cell">${bar(x.visits, topSource)}</td><td class="num">${x.visits}</td><td class="num">${x.orders}</td></tr>`)}</tbody></table>`
            : html`<p class="adm-note">Ende pa vizita në këto ditë.</p>`}
        </section>
        <section class="adm-card" aria-labelledby="st-dress">
          <h2 class="adm-h2" id="st-dress">Fustanet më të shikuara</h2>
          ${s.dresses.length
            ? html`<table class="adm-table"><thead><tr><th>Fustani</th><th><span class="sr-only">Pjesa</span></th><th class="num">Shikime</th></tr></thead>
              <tbody>${s.dresses.map((x) => html`<tr><td><a href="/fustan/${x.slug}" target="_blank" rel="noopener">${x.name}</a></td><td class="adm-bar-cell">${bar(x.n, topDress)}</td><td class="num">${x.n}</td></tr>`)}</tbody></table>`
            : html`<p class="adm-note">Ende asnjë fustan i shikuar.</p>`}
        </section>
        <section class="adm-card" aria-labelledby="st-form">
          <h2 class="adm-h2" id="st-form">Formulari i porosisë</h2>
          <dl class="adm-totals">
            <div><dt>Hapën formularin</dt><dd>${s.funnel.checkout}</dd></div>
            <div><dt>Shtypën «Dërgo porosinë»</dt><dd>${s.funnel.submit}</dd></div>
            <div><dt>U ndalën nga një gabim</dt><dd>${s.funnel.invalid}</dd></div>
            <div><dt>Porosi të dërguara</dt><dd>${s.funnel.orders}</dd></div>
            <div class="is-total"><dt>Suksesi i formularit</dt><dd>${share(s.funnel.orders, s.funnel.checkout)}%</dd></div>
          </dl>
          ${s.invalidFields.length ? html`<p class="adm-note">Fushat me gabime: ${s.invalidFields.map((f) => `${FIELD[f.key] ?? f.key} ${f.n}`).join(', ')}.</p>` : ''}
        </section>
        <section class="adm-card" aria-labelledby="st-utm">
          <h2 class="adm-h2" id="st-utm">Fushatat (UTM)</h2>
          ${s.campaigns.length
            ? html`<table class="adm-table"><tbody>${s.campaigns.map((x) => html`<tr><td>${sourceLabel(x.key)}</td><td class="num">${x.n} vizita</td></tr>`)}</tbody></table>`
            : html`<p class="adm-note">Ende asnjë fushatë.</p>`}
          <form class="adm-stack" data-utm>
            <p class="adm-note">Krijo një lidhje për një postim: kur dikush hyn prej saj, vizita dhe porosia i shkojnë kësaj fushate.</p>
            <div class="adm-grid2">
              <label class="adm-field"><span>Ku do ta vendosësh</span>
                <select class="adm-input" name="source">
                  <option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="whatsapp">WhatsApp</option>
                </select>
              </label>
              <label class="adm-field"><span>Emri i fushatës</span><input class="adm-input" name="campaign" placeholder="p.sh. story-tetor" maxlength="40" autocomplete="off" /></label>
            </div>
            <div class="adm-inline-form">
              <label class="adm-field"><span>Lidhja</span><input class="adm-input" name="url" readonly /></label>
              <button class="btn" type="button" data-copy>Kopjo</button>
            </div>
          </form>
        </section>
      </div>`,
      newOrders,
    ),
  );
  const f = root.querySelector<HTMLFormElement>('[data-utm]')!;
  const url = f.elements.namedItem('url') as HTMLInputElement;
  const build = () => {
    const src = (f.elements.namedItem('source') as HTMLSelectElement).value;
    const name = (f.elements.namedItem('campaign') as HTMLInputElement).value.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    url.value = `${location.origin}/?utm_source=${src}&utm_medium=social${name ? `&utm_campaign=${name}` : ''}`;
  };
  f.addEventListener('input', build);
  f.addEventListener('change', build);
  build();
  f.querySelector('[data-copy]')!.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url.value);
      toast('Lidhja u kopjua.');
    } catch {
      url.select();
      toast('Zgjidhe lidhjen dhe kopjoje.', 'err');
    }
  });
}

/* ------------------------------------------------------------------ sales ------------------------------------------------------------------ */

const STATUS_MANY: Record<string, string> = { new: 'Të reja', confirmed: 'Konfirmuar', shipped: 'Dërguar', delivered: 'Dorëzuar', cancelled: 'Anuluar' };
const WEEKDAYS = ['hën', 'mar', 'mër', 'enj', 'pre', 'sht', 'die'];

/**
 * Sales for a week (Monday to Sunday) or a month in Tirana time, beside the period before: orders,
 * value, dresses sold and visits, then which dresses and sizes sold and where the buyers came from.
 * The Excel download holds every order of the period for the accountant. ?java=<a day of the week>,
 * ?muaji=<YYYY-MM>; this week without either.
 */
async function salesView(): Promise<void> {
  mount(frame('sales', html`<p class="adm-empty">Po ngarkohen shitjet</p>`, newOrders));
  const q = new URLSearchParams(location.search);
  const today = tiranaDay();
  const m = q.get('muaji') ?? '';
  const month = isDay(`${m}-01`);
  const asked = q.get('java');
  const from = month ? `${m}-01` : weekStart(isDay(asked) ? asked : today);
  const to = month ? monthStart(from, 1) : addDays(from, 7);
  const prev = month ? monthStart(from, -1) : addDays(from, -7);
  const current = today >= from && today < to;
  let r: SalesReport;
  try {
    r = await api.sales(prev, from, to);
  } catch (e) {
    mount(frame('sales', html`<p class="adm-empty">${errText(e)}</p>`, newOrders));
    return;
  }

  const last = addDays(to, -1);
  const year = (d: string) => d.slice(0, 4);
  const title = month
    ? `${MONTHS[Number(from.slice(5, 7)) - 1]!.replace(/^./, (c) => c.toUpperCase())} ${year(from)}`
    : `${from.slice(0, 7) === last.slice(0, 7) ? Number(from.slice(8, 10)) : dayMonth(from)}${year(from) === year(last) ? '' : ` ${year(from)}`} deri më ${dayMonth(last)} ${year(last)}`;
  const link = (day: string) => (month ? `/admin/shitjet?muaji=${day.slice(0, 7)}` : `/admin/shitjet?java=${day}`);
  const weekLink = `/admin/shitjet?java=${current ? today : weekStart(from)}`;
  const monthLink = `/admin/shitjet?muaji=${(current ? today : month ? from : addDays(from, 3)).slice(0, 7)}`;
  const was = month ? 'muaji i mëparshëm' : 'java e mëparshme';

  const now = summarize(r.orders);
  const before = summarize(r.previous);
  const live = r.orders.filter(counted);
  const days = byDay(r.orders, from, to);
  const peak = Math.max(1, ...days.map((d) => d.orders));
  const dresses = byDress(r.orders);
  const sizes = bySize(r.orders);
  const topSize = Math.max(1, ...sizes.map(([, n]) => n));
  const statuses = tally(r.orders, (o) => o.status);
  const methods = tally(live, (o) => o.payment_method);
  const sources = tally(live, (o) => (o.source || 'direct').split('/')[0] || 'direct');
  const kpi = (label: string, value: string, prior: string) =>
    html`<div><dt>${label}</dt><dd>${value}</dd><dd class="adm-kpi__was">${was}: ${prior}</dd></div>`;
  const line = (pairs: [string, number][], name: (k: string) => string) =>
    html`<p class="adm-tally">${pairs.map(([k, n]) => html`<span><span class="adm-tally__k">${name(k)}</span> ${count(n)}</span>`)}</p>`;
  const file = month ? `shitjet-${from.slice(0, 7)}.xlsx` : `shitjet-${from}-${last}.xlsx`;
  const canSend = (() => {
    try {
      return window.matchMedia('(pointer: coarse)').matches && Boolean(navigator.canShare?.({ files: [new File([''], file, { type: XLSX_TYPE })] }));
    } catch {
      return false;
    }
  })();

  mount(
    frame(
      'sales',
      html`<div class="adm-head">
        <h1 class="adm-h1">Shitjet</h1>
        <nav class="adm-seg" aria-label="Periudha">
          <a class="adm-seg__item${month ? '' : ' is-on'}" href="${weekLink}" data-link${month ? '' : raw(' aria-current="page"')}>Javë</a>
          <a class="adm-seg__item${month ? ' is-on' : ''}" href="${monthLink}" data-link${month ? raw(' aria-current="page"') : ''}>Muaj</a>
        </nav>
      </div>
      <div class="adm-period">
        <a class="adm-step" href="${link(prev)}" data-link aria-label="${month ? 'Muaji i mëparshëm' : 'Java e mëparshme'}">${icon.left}</a>
        <h2 class="adm-period__title">${title}${current ? html` <span class="adm-period__now">${month ? 'ky muaj' : 'kjo javë'}</span>` : ''}</h2>
        ${to <= today ? html`<a class="adm-step" href="${link(to)}" data-link aria-label="${month ? 'Muaji tjetër' : 'Java tjetër'}">${icon.right}</a>` : html`<span class="adm-step is-off" aria-hidden="true">${icon.right}</span>`}
        <span class="adm-period__end">
          ${canSend ? html`<button class="btn btn--line" type="button" data-xlsx="share"${r.orders.length ? '' : raw(' disabled')}>Dërgo skedarin</button>` : ''}
          <button class="btn btn--line" type="button" data-xlsx="save"${r.orders.length ? '' : raw(' disabled')}>Shkarko në Excel</button>
        </span>
      </div>
      <section class="adm-card" aria-label="Përmbledhja">
        <dl class="adm-kpis">
          ${kpi('Porosi', count(now.orders), count(before.orders))}
          ${kpi('Shitjet', lek(now.total), lek(before.total))}
          ${kpi('Fustane të shitura', count(now.pieces), count(before.pieces))}
          ${kpi('Mesatarja e porosisë', lek(now.average), lek(before.average))}
          ${kpi('Vizita', count(r.visits), count(r.prevVisits))}
        </dl>
        <div class="adm-days${month ? '' : ' adm-days--week'}" role="img" aria-label="Porositë sipas ditëve: ${days.map((d) => `${dayMonth(d.day)} ${d.orders}`).join(', ')}">
          ${days.map((d) => html`<span title="${dayMonth(d.day)}: ${d.orders} porosi" style="--h: ${(d.orders / peak).toFixed(3)}"></span>`)}
        </div>
        ${month
          ? html`<p class="adm-days__ends adm-note"><span>${dayMonth(from)}</span><span>${dayMonth(last)}</span></p>`
          : html`<p class="adm-week adm-note" aria-hidden="true">${days.map((d, i) => html`<span><b>${d.orders}</b> ${WEEKDAYS[i]}</span>`)}</p>`}
        <p class="adm-note">Porositë e anuluara nuk llogariten. Pagesat me kartë që nuk u kryen nuk shfaqen.</p>
      </section>
      ${r.orders.length
        ? html`<div class="adm-grid2 adm-stats">
            <section class="adm-card" aria-labelledby="sl-dress">
              <h2 class="adm-h2" id="sl-dress">Fustanet e shitura</h2>
              ${dresses.length
                ? html`<table class="adm-table"><thead><tr><th>Fustani</th><th>Masat</th><th class="num">Copë</th><th class="num">Vlera</th></tr></thead>
                    <tbody>${dresses.map((d) => html`<tr><td>${d.name}</td><td>${d.sizes.map(([s, n]) => `${s}${n > 1 ? ` ×${n}` : ''}`).join(', ')}</td><td class="num">${d.qty}</td><td class="num">${lek(d.value)}</td></tr>`)}</tbody></table>`
                : html`<p class="adm-note">Të gjitha porositë e kësaj periudhe u anuluan.</p>`}
            </section>
            <section class="adm-card" aria-labelledby="sl-orders">
              <h2 class="adm-h2" id="sl-orders">Porositë</h2>
              <div>
                <p class="adm-label">Statusi tani</p>
                ${line(statuses, (k) => STATUS_MANY[k] ?? k)}
              </div>
              ${methods.length ? html`<div><p class="adm-label">Pagesa</p>${line(methods, (k) => METHOD[k] ?? k)}</div>` : ''}
              ${sources.length ? html`<div><p class="adm-label">Nga erdhën</p>${line(sources, sourceLabel)}</div>` : ''}
              <div>
                <p class="adm-label">Masat e shitura</p>
                <div class="adm-sizes-sold">
                  ${sizes.map(([s, n]) => html`<span><span class="adm-bar" aria-hidden="true"><span style="transform: scaleX(${(n / topSize).toFixed(3)})"></span></span><b>${s}</b> ${n}</span>`)}
                </div>
              </div>
            </section>
          </div>`
        : html`<p class="adm-empty">${month ? 'Asnjë porosi në këtë muaj.' : 'Asnjë porosi në këtë javë.'}</p>`}`,
      newOrders,
    ),
  );

  on('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-xlsx]');
    if (!b) return;
    const blob = salesFile(r, { status: STATUS, method: METHOD, payment: PAYMENT, zone: ZONE, source: sourceLabel });
    if (b.dataset.xlsx === 'share') {
      try {
        await navigator.share({ files: [new File([blob], file, { type: XLSX_TYPE })], title: `Shitjet, ${title}` });
      } catch {
        /* the sheet was closed */
      }
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  });
}

// by hand: browsers often ship no Albanian date and number formats and fall back to English
const MONTHS = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
/** 2 tetor, from YYYY-MM-DD */
const dayMonth = (day: string): string => `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1]}`;
const when = (iso: string): string => {
  const d = new Date(iso);
  return iso && !Number.isNaN(d.getTime()) ? `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : '';
};
const count = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, String.fromCharCode(160));

/**
 * The legal pages' details, to fill in whenever Greta is ready: the business as registered, and
 * the returns policy chosen from a few options (the site writes it in the three languages), with
 * a preview of the Albanian text as it will show.
 */
function legalCard(l: { business: Business; returns: Returns }): Raw {
  const b = l.business;
  const r = l.returns;
  const mode = (value: Returns['mode'], label: string) =>
    html`<label class="adm-check"><input type="radio" name="mode" value="${value}"${r.mode === value ? raw(' checked') : ''} /> ${label}</label>`;
  return html`<form class="adm-card adm-stack" data-legal novalidate aria-labelledby="sec-legal">
    <h2 class="adm-h2" id="sec-legal">Faqet ligjore</h2>
    <p class="adm-note">Shfaqen te «Kushtet e shitjes» dhe «Privatësia». Mund t’i plotësosh kur të duash; deri atëherë faqet tregojnë vetëm atë që dihet.</p>
    <p class="adm-label">Të dhënat e biznesit</p>
    <div class="adm-grid2">
      <label class="adm-field"><span>Emri ligjor (si në QKB)</span><input class="adm-input" name="legalName" maxlength="120" value="${b.legalName}" autocomplete="organization" /></label>
      <label class="adm-field"><span>NIPT</span><input class="adm-input" name="nipt" maxlength="20" value="${b.nipt}" autocapitalize="characters" spellcheck="false" autocomplete="off" aria-describedby="nipt-hint" /><small class="adm-note adm-hint" id="nipt-hint">Një shkronjë, 8 shifra, një shkronjë.</small></label>
      <label class="adm-field"><span>Telefoni i dyqanit</span><input class="adm-input" name="phone" type="tel" inputmode="tel" maxlength="30" value="${b.phone}" placeholder="p.sh. 069 123 4567" /></label>
      <label class="adm-field"><span>Email (jo i detyrueshëm)</span><input class="adm-input" name="email" type="email" maxlength="120" value="${b.email}" spellcheck="false" /></label>
    </div>
    <fieldset class="adm-checks">
      <legend class="adm-label">Kthimet dhe ndërrimet</legend>
      ${mode('', 'Ende pa vendosur (nuk shfaqet në faqe)')}
      ${mode('none', 'Nuk pranohen kthime')}
      ${mode('exchange', 'Vetëm ndërrim')}
      ${mode('refund', 'Ndërrim ose para mbrapsht')}
    </fieldset>
    <div class="adm-stack" data-returns-detail>
      <div class="adm-grid2">
        <label class="adm-field"><span>Brenda sa ditëve nga dorëzimi</span><input class="adm-input" name="days" inputmode="numeric" maxlength="2" value="${String(r.days)}" /></label>
        <label class="adm-field"><span>Transportin e kthimit e paguan</span>
          <select class="adm-input" name="shipping"><option value="customer"${r.shipping === 'customer' ? raw(' selected') : ''}>Klienti</option><option value="shop"${r.shipping === 'shop' ? raw(' selected') : ''}>Dyqani</option></select>
        </label>
      </div>
      <label class="adm-check"><input type="checkbox" name="unworn"${r.unworn ? raw(' checked') : ''} /> Fustani duhet të jetë i paveshur dhe me etiketë</label>
    </div>
    <div class="adm-grid2">
      <label class="adm-field"><span>Shënim tjetër në shqip (jo i detyrueshëm)</span><textarea class="adm-input adm-area" name="noteSq" rows="3" maxlength="600">${r.noteSq}</textarea></label>
      <label class="adm-field"><span>Shënim tjetër në anglisht (jo i detyrueshëm)</span><textarea class="adm-input adm-area" name="noteEn" rows="3" maxlength="600">${r.noteEn}</textarea></label>
    </div>
    <div class="adm-preview">
      <p class="adm-label">Kështu shfaqet te kushtet e shitjes</p>
      <div data-legal-preview></div>
    </div>
    <button class="btn" type="submit">Ruaj</button>
  </form>`;
}

/** Order alerts: the linked phones, linking a new one with a one-time code, a test message. */
function telegramCard(tg: { ready: boolean; bot: string | null; chats: LinkedChat[] }): Raw {
  if (!tg.ready) {
    return html`<section class="adm-card" aria-labelledby="sec-tg">
      <h2 class="adm-h2" id="sec-tg">Njoftimet e porosive në Telegram</h2>
      <p class="adm-note">Boti i Telegramit nuk është vendosur ende. Në kompjuter: <code>npx wrangler secret put TELEGRAM_BOT_TOKEN</code></p>
    </section>`;
  }
  return html`<section class="adm-card" aria-labelledby="sec-tg">
    <h2 class="adm-h2" id="sec-tg">Njoftimet e porosive në Telegram</h2>
    <p class="adm-note">Çdo porosi e re vjen menjëherë si mesazh në telefonat e lidhur.</p>
    <ul class="adm-chats">
      ${tg.chats.length
        ? tg.chats.map((ch) => html`<li class="adm-chat"><span>${ch.name}</span><button class="adm-link adm-danger" type="button" data-tg-remove="${String(ch.id)}">Hiq</button></li>`)
        : html`<li class="adm-note">Ende asnjë telefon i lidhur.</li>`}
    </ul>
    <div class="adm-pair" data-tg-pair hidden></div>
    <div class="adm-actions">
      <button class="btn" type="button" data-tg-link>Lidh një telefon</button>
      ${tg.chats.length ? html`<button class="btn btn--line" type="button" data-tg-test>Dërgo një mesazh prove</button>` : ''}
    </div>
  </section>`;
}

/** The footer's follower count: read from Instagram once linked, otherwise typed by hand. */
function instagramCard(ig: InstagramState): Raw {
  const source =
    ig.source === 'instagram'
      ? `Përditësohet vetë nga Instagrami${ig.username ? ` (@${ig.username})` : ''}; herën e fundit më ${when(ig.checkedAt)}.`
      : ig.source === 'manual'
        ? `Shkruar me dorë më ${when(ig.checkedAt)}.`
        : 'Numri i lexuar më 16 shtator. Lidhe Instagramin që të përditësohet vetë.';
  return html`<section class="adm-card" aria-labelledby="sec-ig">
    <h2 class="adm-h2" id="sec-ig">Ndjekësit në Instagram</h2>
    <p><span class="adm-big">${count(ig.followers)}</span> ndjekës. Në fund të faqes shfaqet: ${copy.sq.footer.followers(ig.followers)}.</p>
    <p class="adm-note">${source}</p>
    ${ig.error ? html`<p class="adm-error">Instagrami nuk u përgjigj: ${ig.error}</p>` : ''}
    ${ig.linked
      ? html`<div class="adm-actions">
          <button class="btn btn--line" type="button" data-ig-sync>Përditëso tani</button>
          <button class="adm-link adm-danger" type="button" data-ig-unlink>Shkëput Instagramin</button>
        </div>`
      : html`<form class="adm-stack" data-ig-token>
          <label class="adm-field"><span>Token nga Meta (Instagram API me hyrje nga Instagrami)</span><input class="adm-input" name="token" type="password" autocomplete="off" spellcheck="false" required /></label>
          <p class="adm-note">Luca e merr një herë nga developers.facebook.com, pasi Greta jep leje me llogarinë e dyqanit. Pastaj numri përditësohet vetë çdo ditë.</p>
          <button class="btn" type="submit">Lidh Instagramin</button>
        </form>
        <form class="adm-inline-form" data-ig-manual>
          <label class="adm-field"><span>Ose shkruaje numrin me dorë</span><input class="adm-input" name="followers" inputmode="numeric" value="${String(ig.followers)}" /></label>
          <button class="btn btn--line" type="submit">Ruaj numrin</button>
        </form>`}
  </section>`;
}

let pairTimer = 0;

async function settingsView(): Promise<void> {
  mount(frame('settings', html`<p class="adm-empty">Po ngarkohen cilësimet</p>`, newOrders));
  window.clearInterval(pairTimer);
  let s: { zones: Zone[]; card: boolean };
  let tg: { ready: boolean; bot: string | null; chats: LinkedChat[] };
  let ig: InstagramState;
  let legal: { business: Business; returns: Returns };
  try {
    [s, tg, ig, legal] = await Promise.all([api.settings(), api.telegram(), api.instagram(), api.legal()]);
  } catch (e) {
    toast(errText(e), 'err');
    return;
  }
  mount(
    frame(
      'settings',
      html`<div class="adm-head"><h1 class="adm-h1">Cilësimet</h1></div>
      <form class="adm-card adm-stack" data-settings>
        <h2 class="adm-h2">Dërgesa</h2>
        <p class="adm-note">Tarifa shfaqet te porosia. Lëre bosh nëse e konfirmon me telefon; 0 do të thotë falas.</p>
        ${s.zones.map(
          (z) => html`<div class="adm-zone" data-zone="${z.id}">
            <label class="adm-check"><input type="checkbox" data-enabled${z.enabled ? raw(' checked') : ''} /> ${ZONE[z.id]}</label>
            <label class="adm-field adm-field--inline"><span>Tarifa (Lekë)</span><input class="adm-input" data-fee inputmode="numeric" value="${z.fee ?? ''}" /></label>
          </div>`,
        )}
        <button class="btn" type="submit">Ruaj</button>
      </form>
      ${legalCard(legal)}
      ${telegramCard(tg)}
      ${instagramCard(ig)}
      <section class="adm-card">
        <h2 class="adm-h2">Pagesa me kartë</h2>
        <p>${s.card ? 'Aktive në këtë kompjuter me bankën e simuluar (test).' : 'Jo aktive.'} Për pagesa të vërteta duhet një kontratë me një bankë shqiptare; pastaj lidhet në kod.</p>
      </section>`,
      newOrders,
    ),
  );

  // The legal pages: read the form, preview the Albanian text, save
  const lf = root.querySelector<HTMLFormElement>('[data-legal]')!;
  const readLegal = (): { business: Business; returns: Returns } => {
    const v = (n: string) => (lf.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? '';
    return {
      business: { legalName: v('legalName'), nipt: v('nipt').toUpperCase().replace(/\s/g, ''), phone: v('phone'), email: v('email') },
      returns: {
        mode: (lf.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value ?? '') as Returns['mode'],
        days: Number(v('days')),
        unworn: (lf.elements.namedItem('unworn') as HTMLInputElement).checked,
        shipping: v('shipping') === 'shop' ? 'shop' : 'customer',
        noteSq: v('noteSq'),
        noteEn: v('noteEn'),
      },
    };
  };
  const preview = () => {
    const l = readLegal();
    const ok = Number.isInteger(l.returns.days) && l.returns.days >= 1;
    lf.querySelector<HTMLElement>('[data-returns-detail]')!.hidden = l.returns.mode === '' || l.returns.mode === 'none';
    const back = returnsSection('sq', { ...l.returns, days: ok ? l.returns.days : 14 });
    lf.querySelector('[data-legal-preview]')!.innerHTML = html`<p><b>Shitësi.</b> ${sellerText('sq', l.business)}</p>${
      back ? html`<p><b>${back.h}.</b> ${back.p.join(' ')}</p>` : html`<p class="adm-muted">Kthimet dhe ndërrimet nuk shfaqen ende.</p>`
    }`.value;
  };
  lf.addEventListener('input', preview);
  lf.addEventListener('change', preview);
  preview();
  lf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const l = readLegal();
    try {
      await api.saveLegal(l.business, l.returns);
      toast('Faqet ligjore u ruajtën.');
    } catch (x) {
      const names: Record<string, string> = { nipt: 'NIPT', phone: 'Telefoni', email: 'Email', days: 'Ditët' };
      const fields = x instanceof ApiError ? (x.body.fields ?? []) : [];
      toast(fields.length ? `Kontrollo: ${fields.map((f) => names[f] ?? f).join(', ')}.` : errText(x), 'err');
    }
  });

  // Telegram: link a phone (a one-time code, then wait for it to reach the bot), test, remove
  root.querySelector('[data-tg-link]')?.addEventListener('click', async () => {
    const box = root.querySelector<HTMLElement>('[data-tg-pair]')!;
    let pair: { code: string; bot: string; url: string };
    try {
      pair = await api.telegramLink();
    } catch (x) {
      return toast(errText(x), 'err');
    }
    box.hidden = false;
    box.innerHTML = html`<p class="adm-note">Hape këtë lidhje në telefonin që do të marrë njoftimet dhe shtyp <b>Start</b> në Telegram:</p>
      <a class="adm-link" href="${pair.url}" target="_blank" rel="noopener">${pair.url.replace('https://', '')}</a>
      <p class="adm-note">Ose dërgoji botit @${pair.bot} këtë kod: <b class="adm-code">${pair.code}</b></p>
      <p class="adm-note" data-tg-wait aria-live="polite">Në pritje të mesazhit…</p>`.value;
    window.clearInterval(pairTimer);
    const started = Date.now();
    pairTimer = window.setInterval(async () => {
      if (!document.contains(box) || Date.now() - started > 16 * 60_000) return window.clearInterval(pairTimer);
      try {
        const r = await api.telegramCheck();
        if (r.state === 'linked') {
          window.clearInterval(pairTimer);
          toast(`Telefoni u lidh: ${r.chat?.name ?? ''}.`);
          void settingsView();
        } else if (r.state !== 'waiting') {
          window.clearInterval(pairTimer);
          const wait = box.querySelector('[data-tg-wait]');
          if (wait) wait.textContent = 'Kodi skadoi. Shtyp përsëri «Lidh një telefon».';
        }
      } catch {
        /* Telegram busy: the next tick asks again */
      }
    }, 3000);
  });
  root.querySelector('[data-tg-test]')?.addEventListener('click', async () => {
    try {
      const { sent } = await api.telegramTest();
      toast(sent ? 'Mesazhi i provës u dërgua.' : 'Mesazhi nuk arriti. Provo përsëri.', sent ? 'ok' : 'err');
    } catch (x) {
      toast(errText(x), 'err');
    }
  });
  root.querySelectorAll<HTMLButtonElement>('[data-tg-remove]').forEach((b) =>
    b.addEventListener('click', async () => {
      try {
        await api.telegramRemove(Number(b.dataset.tgRemove));
        toast('Telefoni u hoq.');
        void settingsView();
      } catch (x) {
        toast(errText(x), 'err');
      }
    }),
  );

  // Instagram: link with a token, update now, disconnect, or type the number by hand
  const igDone = (msg: string) => {
    toast(msg);
    void settingsView();
  };
  root.querySelector<HTMLFormElement>('[data-ig-token]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = new FormData(e.currentTarget as HTMLFormElement).get('token');
    try {
      await api.instagramToken(String(token ?? ''));
      igDone('Instagrami u lidh.');
    } catch (x) {
      toast(errText(x), 'err');
    }
  });
  root.querySelector('[data-ig-sync]')?.addEventListener('click', async () => {
    try {
      const st = await api.instagramSync();
      if (st.error) return toast(`Instagrami nuk u përgjigj: ${st.error}`, 'err');
      igDone('U përditësua.');
    } catch (x) {
      toast(errText(x), 'err');
    }
  });
  root.querySelector('[data-ig-unlink]')?.addEventListener('click', async () => {
    if (!(await ask('Ta shkëpus Instagramin? Numri i fundit mbetet në faqe.', 'Shkëput'))) return;
    try {
      await api.instagramUnlink();
      igDone('Instagrami u shkëput.');
    } catch (x) {
      toast(errText(x), 'err');
    }
  });
  root.querySelector<HTMLFormElement>('[data-ig-manual]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const n = Number(String(new FormData(e.currentTarget as HTMLFormElement).get('followers') ?? '').replace(/[\s.,]/g, ''));
    if (!Number.isInteger(n) || n < 0) return toast('Shkruaj një numër të plotë.', 'err');
    try {
      await api.instagramFollowers(n);
      igDone('Numri u ruajt.');
    } catch (x) {
      toast(errText(x), 'err');
    }
  });
  root.querySelector('[data-settings]')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const zones = [...root.querySelectorAll<HTMLElement>('[data-zone]')].map((el) => {
      const raw = el.querySelector<HTMLInputElement>('[data-fee]')!.value.replace(/\s|\./g, '');
      return { id: el.dataset.zone as Zone['id'], enabled: el.querySelector<HTMLInputElement>('[data-enabled]')!.checked, fee: raw === '' ? null : Number(raw) };
    });
    if (zones.some((z) => z.fee !== null && (!Number.isInteger(z.fee) || z.fee < 0))) return toast('Tarifa duhet të jetë numër i plotë.', 'err');
    try {
      await api.saveSettings(zones);
      toast('Cilësimet u ruajtën.');
    } catch (x) {
      toast(errText(x), 'err');
    }
  });
}

/* ------------------------------------------------------- the admin as a phone app ------------------------------------------------------ */

// On a phone the admin goes on the home screen (admin.webmanifest) and opens full screen. The worker
// caches nothing: it only answers with an offline page when there is no connection.
if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin' }).catch(() => undefined);

// A home-screen app stays open in the background and has no reload: back on it after a minute or
// more, the orders and the sales load again, so a new order is there without asking.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    return;
  }
  const p = location.pathname.replace(/\/+$/, '');
  const away = hiddenAt > 0 && Date.now() - hiddenAt > 60_000;
  if (away && !dirty && !document.querySelector('dialog[open]') && (p === '/admin/porosi' || p === '/admin/shitjet')) void route();
});

void route();
