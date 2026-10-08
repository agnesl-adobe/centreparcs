/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-lodges. Base: carousel.
 * Source: https://www.centerparcs.co.uk/ (.accommodation-gallery-carousel)
 * UE model (blocks/carousel-lodges/_carousel-lodges.json) item "carousel-lodges-item":
 *   media_image (+media_imageAlt collapsed) | content_text
 * Output: 2 columns, one row per slide (7 lodge types on the homepage):
 *   [ <!-- field:media_image --> img , <!-- field:content_text --> h2, pretitle, amenities ul, description, CTA links ]
 * Iteration keyed on .cmp-carousel__item (block wrapper); swiper duplicates and the
 * thumbnail strip are excluded. Each amenity becomes an <li> carrying its 20x20 icon
 * (<img>, real Scene7 src, alt = amenity label) followed by the label, inside the
 * content_text richtext.
 */
function clean(t) {
  return (t || '').replace(/[\s ]+/g, ' ').trim();
}

export default function parse(element, { document }) {
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item:not(.swiper-slide-duplicate)'));
  if (!slides.length) slides = Array.from(element.querySelectorAll('.cmp-teaser'));

  const cells = [];
  slides.forEach((slide) => {
    const teaser = slide.querySelector('.cmp-teaser') || slide;
    const img = teaser.querySelector('.cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img');
    const heading = teaser.querySelector('.cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title');
    const pretitle = teaser.querySelector('.cmp-teaser__pretitle');
    const tags = Array.from(teaser.querySelectorAll('.cmp-teaser__tags-item, .cp-feature-icons__item'));
    const descEls = Array.from(teaser.querySelectorAll('.cmp-teaser__description > p, .cmp-teaser__description > ul'));
    const desc = teaser.querySelector('.cmp-teaser__description');
    const links = Array.from(teaser.querySelectorAll('.cmp-teaser__action-container a[href]'));

    if (!img && !heading) return;

    // Cell 1: image
    const mediaCell = document.createDocumentFragment();
    if (img) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || '';
      mediaCell.appendChild(document.createComment(' field:media_image '));
      mediaCell.appendChild(image);
    }

    // Cell 2: rich text content
    const content = [];
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = clean(heading.textContent);
      content.push(h2);
    }
    if (pretitle && clean(pretitle.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(pretitle.textContent);
      content.push(p);
    }
    if (tags.length) {
      const ul = document.createElement('ul');
      tags.forEach((t) => {
        const label = clean((t.querySelector('.cmp-teaser__tags-title, .cp-feature-icons__title') || t).textContent);
        if (!label) return;
        const li = document.createElement('li');
        // 20x20 amenity icon (Scene7 /is/content/centerparcs/...), kept inline before the label
        const icon = t.querySelector('img.cmp-teaser__tags-icon, img.cp-feature-icons__img, img');
        const iconSrc = icon && (icon.getAttribute('src') || icon.getAttribute('data-src'));
        if (iconSrc) {
          const iconImg = document.createElement('img');
          iconImg.src = iconSrc;
          iconImg.alt = label;
          li.append(iconImg, ' ');
        }
        li.append(label);
        ul.append(li);
      });
      if (ul.children.length) content.push(ul);
    }
    if (descEls.length) {
      descEls.filter((e) => clean(e.textContent)).forEach((e) => content.push(e));
    } else if (desc && clean(desc.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      content.push(p);
    }
    links.forEach((a) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = clean(a.textContent);
      const p = document.createElement('p');
      p.append(link);
      content.push(p);
    });

    const contentCell = document.createDocumentFragment();
    if (content.length) {
      contentCell.appendChild(document.createComment(' field:content_text '));
      content.forEach((c) => contentCell.appendChild(c));
    }

    cells.push([mediaCell, contentCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-lodges', cells });
  element.replaceWith(block);
}
