/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-activity. Base: carousel.
 * Source: https://www.centerparcs.co.uk/ (.cp-carousel-v2) - 6 activity tiles
 * UE model (blocks/carousel-activity/_carousel-activity.json) item "carousel-activity-item":
 *   image (+imageAlt collapsed) | link (+linkText collapsed)
 * Output: 2 columns, one row per tile:
 *   [ <!-- field:image --> img , <!-- field:link --> <a href>label</a> ]
 * Tile label comes from the CTA link text (title div is optional and duplicates it).
 * Iteration keyed on .cmp-carousel__item; prev/next buttons and indicators are chrome.
 */
function clean(t) {
  return (t || '').replace(/[\s ]+/g, ' ').trim();
}

export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('.cmp-carousel__item:not(.swiper-slide-duplicate)'));
  if (!items.length) items = Array.from(element.querySelectorAll('.cmp-teaser'));

  const cells = [];
  items.forEach((item) => {
    const img = item.querySelector('.cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img, img');
    const cta = item.querySelector('.cmp-teaser__action-container a[href], a.cmp-teaser__action-link[href], a[href]');
    const title = clean(item.querySelector('.cmp-teaser__title')?.textContent);
    if (!img && !cta) return;

    const imageCell = document.createDocumentFragment();
    if (img) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    const linkCell = document.createDocumentFragment();
    if (cta) {
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = clean(cta.textContent) || title;
      linkCell.appendChild(document.createComment(' field:link '));
      linkCell.appendChild(a);
    }

    cells.push([imageCell, linkCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-activity', cells });
  element.replaceWith(block);
}
