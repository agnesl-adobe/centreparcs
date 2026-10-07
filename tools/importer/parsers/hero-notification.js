/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-notification. Base: hero.
 * Source: https://www.centerparcs.co.uk/ (div.notification inside .notifications)
 * UE model (blocks/hero-notification/_hero-notification.json): single richtext field "text".
 * Output: 1 column, 1 content row -> <!-- field:text --> message paragraph(s) incl. link.
 * Icon span and dismiss <button> are UI chrome, not content.
 */
export default function parse(element, { document }) {
  // Validated: <div class="notification__copy"><p>Breaks now available ... <a href=...>...</a></p></div>
  const copy = element.querySelector('.notification__copy') || element;

  let paragraphs = Array.from(copy.querySelectorAll(':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > ul, :scope > ol'));
  if (!paragraphs.length) {
    const text = copy.textContent.replace(/\s+/g, ' ').trim();
    if (text) {
      const p = document.createElement('p');
      p.append(...Array.from(copy.childNodes).filter((n) => !(n.nodeType === 1 && n.matches('button, .notification__icon, .notification__dismiss'))));
      paragraphs = [p];
    }
  }

  if (!paragraphs.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  paragraphs.forEach((p) => textCell.appendChild(p));

  const cells = [[textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-notification', cells });
  element.replaceWith(block);
}
