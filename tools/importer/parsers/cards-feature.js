/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base: cards.
 * Source: https://www.centerparcs.co.uk/ (.layout-container.cmp-centralized) - 2 instances, 3 cards each
 * UE model (blocks/cards-feature/_cards-feature.json) item "cards-feature-card":
 *   image (+imageAlt collapsed) | text
 * Output: 2 columns, one row per card:
 *   [ <!-- field:image --> img , <!-- field:text --> h3, description, CTA link ]
 * Instances differ in grid wrappers (structure.json warning), so iteration is keyed on
 * the stable .cmp-teaser wrapper (with .cmp-signpost fallback), not on grid columns.
 */
function isBlank(el) {
  return !el.querySelector('img, a[href]') && el.textContent.replace(/[\s ]+/g, '') === '';
}

export default function parse(element, { document }) {
  let teasers = Array.from(element.querySelectorAll('.cmp-teaser'));
  if (!teasers.length) teasers = Array.from(element.querySelectorAll('.cmp-signpost, .teaser'));

  const cells = [];
  teasers.forEach((teaser) => {
    const img = teaser.querySelector('.cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img, img');
    const heading = teaser.querySelector('.cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title h4')
      || teaser.querySelector('h2, h3, h4');
    const desc = teaser.querySelector('.cmp-teaser__description');
    const links = Array.from(teaser.querySelectorAll('.cmp-teaser__action-container a[href]'));
    if (!img && !heading && !desc) return;

    const imageCell = document.createDocumentFragment();
    if (img) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    const content = [];
    if (heading) content.push(heading);
    if (desc) {
      const kids = Array.from(desc.children).filter((c) => !isBlank(c));
      if (kids.length) content.push(...kids);
      else if (!isBlank(desc)) {
        const p = document.createElement('p');
        p.innerHTML = desc.innerHTML;
        content.push(p);
      }
    }
    links.forEach((a) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      const p = document.createElement('p');
      p.append(link);
      content.push(p);
    });

    const textCell = document.createDocumentFragment();
    if (content.length) {
      textCell.appendChild(document.createComment(' field:text '));
      content.forEach((c) => textCell.appendChild(c));
    }

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
