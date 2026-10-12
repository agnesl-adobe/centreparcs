/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-spotlight. Base: carousel.
 * Source: https://www.centerparcs.co.uk/discover-center-parcs/activities/outdoor-activities.html
 *   (.multi-text-image-carousel) - feature card, text panel left + image gallery right
 * UE model (blocks/carousel-spotlight/_carousel-spotlight.json) item "carousel-spotlight-item":
 *   media_image (+media_imageAlt collapsed) | content_text
 * Output: 2 columns, one row per slide (carousel convention):
 *   [ <!-- field:media_image --> img , <!-- field:content_text --> h2, pretitle p, description p(s), CTA link ]
 * Iteration keyed on .cmp-carousel__item of the main gallery (each slide carries its own
 * teaser text); swiper duplicates, the thumbnail strip and the static text panel (a copy of
 * the active slide's text) are excluded. Blank &nbsp; paragraphs are dropped.
 */
function clean(t) {
  return (t || '').replace(/[\s ]+/g, ' ').trim();
}

function isBlank(el) {
  return !el.querySelector('img, a[href]') && el.textContent.replace(/[\s ]+/g, '') === '';
}

export default function parse(element, { document }) {
  let slides = Array.from(element.querySelectorAll('.multi-text-image-carousel-main-visual .cmp-carousel__item:not(.swiper-slide-duplicate)'));
  if (!slides.length) slides = Array.from(element.querySelectorAll('.cmp-carousel__item:not(.swiper-slide-duplicate)'));
  if (!slides.length) slides = [element.querySelector('.multi-text-image-carousel-layout') || element];

  // Static text panel (fallback text source when a slide has no teaser content of its own)
  const panel = element.querySelector('.multi-text-image-carousel-text__inner');

  const cells = [];
  slides.forEach((slide) => {
    const teaser = slide.querySelector('.cmp-teaser') || slide;
    const img = teaser.querySelector('.cmp-teaser__image img.cmp-image__image, .cmp-teaser__image img')
      || slide.querySelector('img');
    const textSrc = teaser.querySelector('.cmp-teaser__title, .cmp-teaser__description') ? teaser : (panel || teaser);

    const heading = textSrc.querySelector('.cmp-teaser__title h1, .cmp-teaser__title h2, .cmp-teaser__title h3, .cmp-teaser__title');
    const pretitle = textSrc.querySelector('.cmp-teaser__pretitle');
    const desc = textSrc.querySelector('.cmp-teaser__description');
    const links = Array.from(textSrc.querySelectorAll('.cmp-teaser__action-container a[href]'));

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

    // Cell 2: rich text (heading, pretitle, description, CTA)
    const content = [];
    if (heading && clean(heading.textContent)) {
      const h2 = document.createElement('h2');
      h2.textContent = clean(heading.textContent);
      content.push(h2);
    }
    if (pretitle && clean(pretitle.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(pretitle.textContent);
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-spotlight', cells });
  element.replaceWith(block);
}
