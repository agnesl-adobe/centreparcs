/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-offer. Base: columns.
 * Source: https://www.centerparcs.co.uk/ (.teaser.cmp-teaser--extras-enabled)
 * Output: 2 columns, 1 row (columns block -> no field hints).
 *   Col 1 (headline): teaser title heading (h1).
 *   Col 2 (offer card): countdown title (h3), description, "Offer ends in YYYY-MM-DDTHH:MM"
 *         paragraph (decorated into a live timer by blocks/columns-offer/columns-offer.js),
 *         primary CTA and "*T&Cs" link.
 * End date comes from .cmp-countdown[data-target-date] (e.g. "2026-10-13 23:59:00+01:00");
 * fallback: derive from the rendered Days/Hours/Minutes/Seconds values.
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

function getEndDate(countdown) {
  if (!countdown) return '';
  const raw = countdown.getAttribute('data-target-date')
    || countdown.getAttribute('data-end-date')
    || countdown.getAttribute('data-date')
    || '';
  const m = raw.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (m) return `${m[1]}T${m[2]}`;
  const d = raw.match(/\d{4}-\d{2}-\d{2}/);
  if (d) return `${d[0]}T23:59`;

  // Fallback: remaining time shown in the units list
  const units = {};
  countdown.querySelectorAll('.cmp-countdown__unit').forEach((u) => {
    const label = (u.querySelector('.cmp-countdown__unit-label')?.textContent || '').trim().toLowerCase();
    const value = parseInt(u.querySelector('.cmp-countdown__value')?.textContent || '', 10);
    if (label && !Number.isNaN(value)) units[label] = value;
  });
  if (!Object.keys(units).length) return '';
  const ms = ((units.days || 0) * 86400 + (units.hours || 0) * 3600
    + (units.minutes || 0) * 60 + (units.seconds || 0)) * 1000;
  const end = new Date(Date.now() + ms);
  return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

function isBlank(el) {
  return !el.querySelector('img, a') && el.textContent.replace(/[\s ]+/g, '') === '';
}

export default function parse(element, { document }) {
  // ---- Column 1: headline ----
  const headline = element.querySelector('.cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title')
    || element.querySelector('h1, h2');
  const col1 = [];
  if (headline) col1.push(headline);
  const strapline = element.querySelector('.cmp-teaser__strapline');
  if (strapline && !isBlank(strapline)) col1.push(...strapline.children);

  // ---- Column 2: offer card ----
  const countdown = element.querySelector('.cmp-countdown');
  const col2 = [];
  if (countdown) {
    const title = countdown.querySelector('.cmp-countdown__title');
    if (title) {
      Array.from(title.children).forEach((c) => { if (!isBlank(c)) col2.push(c); });
    }
    const desc = countdown.querySelector('.cmp-countdown__description');
    if (desc) {
      Array.from(desc.children).forEach((c) => { if (!isBlank(c)) col2.push(c); });
    }

    const endDate = getEndDate(countdown);
    if (endDate) {
      const labelText = (countdown.querySelector('.cmp-countdown__remaining-label')?.textContent || 'Offer ends').trim();
      const p = document.createElement('p');
      p.textContent = `${labelText} ${endDate}`;
      col2.push(p);
    }

    const ctas = Array.from(countdown.querySelectorAll('.cmp-countdown__actions a[href]'));
    ctas.forEach((a) => {
      const p = document.createElement('p');
      p.append(a);
      col2.push(p);
    });
    const terms = Array.from(countdown.querySelectorAll('.cmp-countdown__terms_and_conditions a[href]'));
    terms.forEach((a) => {
      const p = document.createElement('p');
      p.append(a);
      col2.push(p);
    });
  } else {
    // Fallback: any extras content
    const extras = element.querySelector('.cmp-teaser__extras');
    if (extras) col2.push(...Array.from(extras.querySelectorAll('h2, h3, h4, p, a[href]')).filter((e) => !isBlank(e) && !e.closest('p')));
  }

  if (!col1.length && !col2.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[col1, col2]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-offer', cells });
  element.replaceWith(block);
}
