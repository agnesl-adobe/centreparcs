/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-intro. Base: columns.
 * Source: https://www.centerparcs.co.uk/
 *   (.teaser.teaser-text:not(.cmp-teaser--extras-enabled):has(.cmp-teaser__description)) - 3 instances
 * Output: 2 columns, 1 row (columns block -> no field hints):
 *   Col 1: section heading (h2, inline emphasis preserved)
 *   Col 2: description paragraph(s) + link paragraph (multiple links in one <p> are
 *          rendered as an inline link list by blocks/columns-intro/columns-intro.js)
 * Handles instances with/without strapline, single or multiple links; blank &nbsp; paragraphs dropped.
 */
function isBlank(el) {
  return !el.querySelector('img, a[href]') && el.textContent.replace(/[\s ]+/g, '') === '';
}

export default function parse(element, { document }) {
  const teaser = element.querySelector('.cmp-teaser') || element;

  const heading = teaser.querySelector('.cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title h4')
    || teaser.querySelector('h1, h2, h3');
  const col1 = [];
  if (heading) col1.push(heading);
  const strapline = teaser.querySelector('.cmp-teaser__strapline');
  if (strapline && !isBlank(strapline)) {
    const p = document.createElement('p');
    p.innerHTML = strapline.innerHTML;
    col1.push(p);
  }

  const desc = teaser.querySelector('.cmp-teaser__description');
  const col2 = [];
  if (desc) {
    const kids = Array.from(desc.children).filter((c) => !isBlank(c));
    if (kids.length) {
      col2.push(...kids);
    } else if (!isBlank(desc)) {
      const p = document.createElement('p');
      p.innerHTML = desc.innerHTML;
      col2.push(p);
    }
  }
  // Optional separate CTA container
  teaser.querySelectorAll('.cmp-teaser__action-container a[href]').forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    col2.push(p);
  });

  if (!col1.length && !col2.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[col1, col2]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-intro', cells });
  element.replaceWith(block);
}
