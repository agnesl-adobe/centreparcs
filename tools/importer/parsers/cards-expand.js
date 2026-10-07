/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-expand. Base: cards.
 * Source: https://www.centerparcs.co.uk/ (.expandable-cross-sell) - 4 expandable teaser cards
 * UE model (blocks/cards-expand/_cards-expand.json) item "cards-expand-card":
 *   image (+imageAlt collapsed) | text
 * Output: 2 columns, one row per card:
 *   [ <!-- field:image --> img , <!-- field:text --> h3, description, CTA link ]
 * Iteration keyed on .cmp-carousel__item (block wrapper); carousel prev/next/indicator
 * controls are UI chrome and are not emitted.
 */
function isBlank(el) {
  return !el.querySelector('img, a[href]') && el.textContent.replace(/[\s ]+/g, '') === '';
}

export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!items.length) items = Array.from(element.querySelectorAll('.cmp-teaser'));

  const cells = [];
  items.forEach((item) => {
    const teaser = item.querySelector('.cmp-teaser') || item;
    const img = teaser.querySelector('.cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img');
    const heading = teaser.querySelector('.cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title h4');
    const titleBox = teaser.querySelector('.cmp-teaser__title');
    const desc = teaser.querySelector('.cmp-teaser__description');
    const links = Array.from(teaser.querySelectorAll('.cmp-teaser__action-container a[href]'));

    if (!img && !heading && !titleBox) return;

    const imageCell = document.createDocumentFragment();
    if (img) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || '';
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(image);
    }

    const content = [];
    if (heading) {
      content.push(heading);
    } else if (titleBox && !isBlank(titleBox)) {
      const h3 = document.createElement('h3');
      h3.textContent = titleBox.textContent.trim();
      content.push(h3);
    }
    const strap = teaser.querySelector('.cmp-teaser__strapline');
    if (strap && !isBlank(strap)) {
      const p = document.createElement('p');
      p.innerHTML = strap.innerHTML;
      content.push(p);
    }
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-expand', cells });
  element.replaceWith(block);
}
