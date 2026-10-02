/** Checkout, order confirmation, the simulated bank page, not found. */
import { formatLek, type Product, type Zone } from '../../shared/catalog';
import { copy, href, type Lang } from '../../shared/copy';
import { html, raw, type Raw } from '../../shared/html';
import type { OrderItemRow, OrderRow } from '../orders';
import { flipId, plate } from './parts';

function field(o: { name: string; label: string; type?: string; autocomplete?: string; inputmode?: string; hint?: string; required?: boolean; max?: number }): Raw {
  const id = `co-${o.name}`;
  return html`<div class="field" data-field="${o.name}">
    <label class="field__label" for="${id}">${o.label}</label>
    <input class="field__input" id="${id}" name="${o.name}" type="${o.type ?? 'text'}"${o.autocomplete ? html` autocomplete="${o.autocomplete}"` : ''}${
      o.inputmode ? html` inputmode="${o.inputmode}"` : ''
    }${o.required ? raw(' required aria-required="true"') : ''} maxlength="${o.max ?? 120}"${o.hint ? html` aria-describedby="${id}-hint"` : ''} />
    ${o.hint ? html`<p class="field__hint" id="${id}-hint">${o.hint}</p>` : ''}
    <p class="field__error" id="${id}-error" hidden></p>
  </div>`;
}

export function checkoutView(lang: Lang, zones: Zone[], card: boolean): Raw {
  const t = copy[lang];
  const tc = t.checkout;
  const enabled = zones.filter((z) => z.enabled);
  const zoneData = JSON.stringify(enabled.map((z) => ({ id: z.id, fee: z.fee })));
  return html`<div class="checkout container" data-checkout data-zones="${zoneData}">
    <div class="co-head">
      <h1 class="co-title">${tc.title}</h1>
      <button class="tlink" type="button" data-open="bag">${tc.edit}</button>
    </div>

    <div class="co-empty" data-co-empty hidden>
      <p class="body-lg">${tc.emptyTitle}</p>
      <a class="btn" href="${href('/dyqani', lang)}">${t.bag.browse}</a>
    </div>

    <div class="co-grid" data-co-grid>
      <form class="co-form" data-co-form novalidate>
        <fieldset class="co-set">
          <legend class="co-legend">${tc.contact}</legend>
          ${field({ name: 'name', label: tc.name, autocomplete: 'name', required: true, max: 80 })}
          ${field({ name: 'phone', label: tc.phone, type: 'tel', autocomplete: 'tel', inputmode: 'tel', hint: tc.phoneHint, required: true, max: 30 })}
          ${field({ name: 'email', label: tc.email, type: 'email', autocomplete: 'email', max: 120 })}
        </fieldset>

        <fieldset class="co-set">
          <legend class="co-legend">${tc.delivery}</legend>
          <div class="field" data-field="zone">
            <p class="field__label" id="co-zone-label">${tc.zone}</p>
            <div class="choices" role="radiogroup" aria-labelledby="co-zone-label">
              ${enabled.map(
                (z, i) => html`<label class="choice">
                  <input type="radio" name="zone" value="${z.id}"${i === 0 ? raw(' checked') : ''} />
                  <span class="choice__box">
                    <span class="choice__name">${tc.zones[z.id]}</span>
                    <span class="choice__meta">${z.fee === null ? tc.shippingTbc : z.fee === 0 ? tc.shippingFree : formatLek(z.fee, lang)}</span>
                  </span>
                </label>`,
              )}
            </div>
            <p class="field__error" id="co-zone-error" hidden></p>
          </div>
          ${field({ name: 'city', label: tc.city, autocomplete: 'address-level2', required: true, max: 60 })}
          ${field({ name: 'address', label: tc.address, autocomplete: 'street-address', hint: tc.addressHint, required: true, max: 200 })}
          <div class="field" data-field="notes">
            <label class="field__label" for="co-notes">${tc.notes}</label>
            <textarea class="field__input field__input--area" id="co-notes" name="notes" rows="3" maxlength="500"></textarea>
          </div>
        </fieldset>

        <fieldset class="co-set">
          <legend class="co-legend">${tc.payment}</legend>
          <div class="choices" role="radiogroup" aria-label="${tc.payment}">
            <label class="choice">
              <input type="radio" name="payment" value="cod" checked />
              <span class="choice__box"><span class="choice__name">${tc.cod}</span><span class="choice__meta">${tc.codBody}</span></span>
            </label>
            ${card
              ? html`<label class="choice">
                  <input type="radio" name="payment" value="card" />
                  <span class="choice__box"><span class="choice__name">${tc.card}</span><span class="choice__meta">${tc.cardBody}</span></span>
                </label>`
              : ''}
          </div>
        </fieldset>

        <div class="hp" aria-hidden="true">
          <label>Website <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
        </div>

        <p class="small co-consent">${tc.consent} <a href="${href('/kushtet', lang)}" target="_blank" rel="noopener">${t.legal.terms}</a> · <a href="${href('/privatesia', lang)}" target="_blank" rel="noopener">${t.legal.privacy}</a></p>
        <button class="btn btn--wide co-submit" type="submit" data-co-submit>${tc.place}</button>
        <p class="co-error" role="alert" data-co-error hidden></p>
      </form>

      <aside class="co-summary" aria-labelledby="co-summary-title">
        <div class="co-summary__hold">
          <h2 class="heading" id="co-summary-title">${tc.summary}</h2>
          <ul class="co-items" data-co-items></ul>
          <dl class="co-totals">
            <div><dt>${tc.subtotal}</dt><dd data-co-subtotal></dd></div>
            <div><dt>${tc.shipping}</dt><dd data-co-shipping></dd></div>
            <div class="co-totals__total"><dt>${tc.total}</dt><dd data-co-total></dd></div>
          </dl>
        </div>
      </aside>
    </div>
  </div>`;
}

export function confirmationView(lang: Lang, order: OrderRow, items: OrderItemRow[], payUrl?: string): Raw {
  const t = copy[lang];
  const tc = t.confirmation;
  const status =
    order.status === 'cancelled'
      ? tc.cancelled
      : order.payment_method === 'card'
        ? order.payment_status === 'paid'
          ? tc.paid
          : tc.awaiting
        : tc.unpaid;
  const fee = order.delivery_fee === null ? t.checkout.shippingTbc : order.delivery_fee === 0 ? t.checkout.shippingFree : formatLek(order.delivery_fee, lang);
  return html`<div class="confirm container" data-confirm data-order-status="${order.status}">
    <h1 class="confirm__title">
      <span class="confirm__label">${tc.label}</span>
      <span class="confirm__num">${order.number}</span>
    </h1>
    <div class="confirm__lead">
      ${order.status === 'cancelled' ? '' : html`<p class="body-lg">${tc.thanks}</p><p class="body">${tc.next}</p>`}
      <p class="ui-strong confirm__status">${status}</p>
      ${payUrl ? html`<a class="btn" href="${payUrl}" data-no-router>${tc.retry}</a>` : ''}
    </div>
    <div class="confirm__grid">
      <section aria-labelledby="confirm-items">
        <h2 class="heading" id="confirm-items">${tc.items}</h2>
        <ul class="confirm__items">
          ${items.map(
            (it) => html`<li class="confirm__item">
              ${it.image_key ? html`<img src="/img/${it.image_key}" alt="" width="72" height="96" loading="lazy" decoding="async" />` : html`<span class="confirm__noimg"></span>`}
              <span class="confirm__meta">
                <span class="ui">${it.name}</span>
                <span class="small">${t.bag.size} ${it.size} · ${t.bag.qty} ${it.qty}</span>
              </span>
              <span class="ui confirm__line">${formatLek(it.price * it.qty, lang)}</span>
            </li>`,
          )}
        </ul>
        <dl class="co-totals">
          <div><dt>${t.checkout.subtotal}</dt><dd>${formatLek(order.subtotal, lang)}</dd></div>
          <div><dt>${t.checkout.shipping}</dt><dd>${fee}</dd></div>
          <div class="co-totals__total"><dt>${t.checkout.total}</dt><dd>${formatLek(order.total, lang)}</dd></div>
        </dl>
      </section>
      <section aria-labelledby="confirm-to">
        <h2 class="heading" id="confirm-to">${tc.deliverTo}</h2>
        <p class="body confirm__address">${order.customer_name}<br />${order.address}<br />${order.city}, ${t.checkout.zones[order.zone]}<br />${order.phone}</p>
        <a class="btn btn--line" href="${href('/dyqani', lang)}">${tc.continue}</a>
      </section>
    </div>
  </div>`;
}

export function payTestView(lang: Lang, order: OrderRow): Raw {
  const t = copy[lang].pay;
  return html`<div class="pay container" data-pay data-order="${order.id}" data-back="${href(`/porosia/${order.id}`, lang)}">
    <h1 class="co-title">${t.title}</h1>
    <p class="body">${t.body}</p>
    <p class="pay__amount">${formatLek(order.total, lang)}</p>
    <div class="pay__actions">
      <button class="btn" type="button" data-pay-result="paid">${t.pay}</button>
      <button class="btn btn--line" type="button" data-pay-result="failed">${t.fail}</button>
    </div>
  </div>`;
}

/**
 * Not found: say so, then help. A search field (it opens the shop's search with the words already
 * typed) and four dresses, the ones closest to the address that was asked for first.
 */
export function notFoundView(lang: Lang, dresses: Product[] = []): Raw {
  const t = copy[lang];
  return html`<div class="missing container">
    <h1 class="co-title" data-lines>${t.notFound.title}</h1>
    <p class="body">${t.notFound.body}</p>
    <form class="missing__search" role="search" action="${href('/dyqani', lang)}" data-missing-search>
      <label class="sr-only" for="missing-q">${t.search.title}</label>
      <input class="missing__input" id="missing-q" type="search" name="q" placeholder="${t.search.placeholder}" autocomplete="off" />
      <button class="btn" type="submit">${t.search.title}</button>
    </form>
    ${dresses.length
      ? html`<ul class="missing__dresses">
          ${dresses.map(
            (p, i) => html`<li>
              <a class="missing__dress" href="${href(`/fustan/${p.slug}`, lang)}" data-fly-link>
                ${plate(p.photos[0], { alt: '', sizes: '(min-width: 768px) 22vw, 46vw', eager: i === 0, target: 480, flip: flipId(p), cls: 'missing__plate', tag: 'span' })}
                <span class="missing__name">${p.name}</span>
                ${p.price !== null ? html`<span class="missing__price">${formatLek(p.price, lang)}</span>` : ''}
              </a>
            </li>`,
          )}
        </ul>`
      : ''}
    <a class="btn btn--line" href="${href('/dyqani', lang)}">${t.notFound.cta}</a>
  </div>`;
}
