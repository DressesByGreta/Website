/**
 * The admin: Greta's back office, in Albanian. Dresses (add, edit, publish, delete, order),
 * their photographs (upload, order, delete), stock per size, orders, delivery fees.
 * Operate mode: plain, dense, fast; the storefront's type and colour, none of its choreography.
 */
import { nameSvg } from '../shared/brand';
import { CATEGORIES, PHOTO_SHARP_WIDTH, SIZES, SIZE_LETTER, formatLek, photoAt, type Zone } from '../shared/catalog';
import { copy } from '../shared/copy';
import { html, raw, type Raw } from '../shared/html';
import { api, ApiError, uploadPhoto, type AdminProduct, type OrderDetail, type OrderStatus, type OrderSummary } from './api';
import { prepare, toForm } from './images';

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
  };
  return map[e.body.error ?? ''] ?? 'Diçka nuk funksionoi. Provo përsëri.';
};

function frame(active: 'products' | 'orders' | 'settings', body: Raw, badge = 0): Raw {
  const tab = (key: typeof active, href: string, label: string, extra: Raw | string = '') =>
    html`<a class="adm-tab${active === key ? ' is-on' : ''}" href="${href}" data-link${active === key ? raw(' aria-current="page"') : ''}>${label}${extra}</a>`;
  return html`<header class="adm-top">
      <a class="adm-brand" href="/admin" data-link aria-label="Dresses by Greta, Admin">${raw(nameSvg('adm-brand__name'))}<span class="adm-brand__sub">Admin</span></a>
      <nav class="adm-tabs" aria-label="Admin">
        ${tab('products', '/admin', 'Fustanet')}
        ${tab('orders', '/admin/porosi', 'Porositë', badge ? html`<span class="adm-badge">${badge}</span>` : '')}
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
}

async function go(path: string, push = true): Promise<void> {
  if (dirty && !window.confirm('Ke ndryshime të paruajtura. Të largohem pa i ruajtur?')) return;
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
          <label class="adm-field"><span>Fjalëkalimi</span><input class="adm-input" type="password" name="password" autocomplete="current-password" required /></label>
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

  const row = (p: AdminProduct, i: number, n: number) => {
    const cover = p.photos[0];
    const sold = totalStock(p) === 0;
    return html`<li class="adm-row" data-id="${p.id}" draggable="true">
      <span class="adm-row__grip" aria-hidden="true">${icon.grip}</span>
      <a class="adm-row__thumb" href="/admin/produkt/${p.id}" data-link tabindex="-1" aria-hidden="true">${cover ? html`<img src="${photoAt(cover, 480)}" alt="" loading="lazy" width="48" height="64" />` : ''}</a>
      <span class="adm-row__main">
        <a class="adm-row__name" href="/admin/produkt/${p.id}" data-link>${p.nameSq}</a>
        <span class="adm-row__meta">
          <span class="adm-pill${p.status === 'published' ? ' is-live' : ''}">${p.status === 'published' ? 'Publikuar' : 'Draft'}</span>
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
      if (!window.confirm('Ta fshij këtë foto?')) return;
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
      if (!window.confirm(`Ta fshij "${p.nameSq}"? Fotot fshihen gjithashtu. Porositë e vjetra mbeten.`)) return;
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
  const date = (s: string) => new Date(s).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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
            <p class="adm-address">${o.customer_name}<br />${o.address}<br />${o.city}, ${ZONE[o.zone] ?? o.zone}${o.email ? html`<br />${o.email}` : ''}</p>
            ${o.notes ? html`<p class="adm-notes">${o.notes}</p>` : ''}
            <div class="adm-actions">
              <a class="btn btn--line" href="tel:${o.phone.replace(/[^\d+]/g, '')}">Telefono ${o.phone}</a>
              <a class="btn btn--line" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>
            </div>
            <h2 class="adm-h2">Pagesa</h2>
            <p>${METHOD[o.payment_method]}, ${PAYMENT[o.payment_status]}</p>
            <h2 class="adm-h2">Hapi tjetër</h2>
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
    const nx = t.closest<HTMLButtonElement>('[data-next]');
    if (nx) {
      const s = nx.dataset.next as OrderStatus;
      if (s === 'cancelled' && !window.confirm('Ta anuloj këtë porosi? Fustanet kthehen në gjendje.')) return;
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

async function settingsView(): Promise<void> {
  mount(frame('settings', html`<p class="adm-empty">Po ngarkohen cilësimet</p>`, newOrders));
  let s: { zones: Zone[]; card: boolean };
  try {
    s = await api.settings();
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
      <section class="adm-card">
        <h2 class="adm-h2">Pagesa me kartë</h2>
        <p>${s.card ? 'Aktive në këtë kompjuter me bankën e simuluar (test).' : 'Jo aktive.'} Për pagesa të vërteta duhet një kontratë me një bankë shqiptare; pastaj lidhet në kod.</p>
      </section>`,
      newOrders,
    ),
  );
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

void route();
