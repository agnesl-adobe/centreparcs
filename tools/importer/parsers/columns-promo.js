/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo. Base: columns.
 * Source: https://www.centerparcs.co.uk/ (.teaser.teaser-offer-block)
 * Output: 3 columns, 1 row (columns block -> no field hints), matching the block
 * template (columns: 3) and blocks/columns-promo/columns-promo.js layout:
 *   Col 1: image | Col 2: heading (h2) | Col 3: description + CTA link
 * Empty cells are kept so every row has 3 cells.
 */
function isBlank(el) {
  return !el.querySelector('img, a[href]') && el.textContent.replace(/[\s ]+/g, '') === '';
}

export default function parse(element, { document }) {
  const teaser = element.querySelector('.cmp-teaser') || element;

  const imgSrc = teaser.querySelector('.cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img, img');
  const heading = teaser.querySelector('.cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3')
    || teaser.querySelector('h2, h3');
  const desc = teaser.querySelector('.cmp-teaser__description');

  let imageCol = '';
  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc.getAttribute('src');
    img.alt = imgSrc.getAttribute('alt') || '';
    imageCol = img;
  }

  const headingCol = heading ? [heading] : '';

  const textCol = [];
  if (desc) {
    const kids = Array.from(desc.children).filter((c) => !isBlank(c));
    if (kids.length) textCol.push(...kids);
    else if (!isBlank(desc)) {
      const p = document.createElement('p');
      p.innerHTML = desc.innerHTML;
      textCol.push(p);
    }
  }
  teaser.querySelectorAll('.cmp-teaser__action-container a[href]').forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    textCol.push(p);
  });

  if (!imgSrc && !heading && !textCol.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[imageCol, headingCol, textCol.length ? textCol : '']];
  // Columns block with the "promo" style option -> "Columns (promo)"
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', variants: ['promo'], cells });
  element.replaceWith(block);
}
