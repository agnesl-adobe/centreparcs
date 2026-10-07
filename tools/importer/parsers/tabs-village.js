/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-village. Base: tabs.
 * Source: https://www.centerparcs.co.uk/ (.village-location .cmp-village-location)
 * UE model (blocks/tabs-village/_tabs-village.json) item "tabs-village-item":
 *   title | content_image (+Alt collapsed), content_heading (+Type collapsed), content_richtext
 * Output: 2 columns, one row per village:
 *   [ <!-- field:title --> name + location ,
 *     <!-- field:content_image --> img <!-- field:content_heading --> h3 <!-- field:content_richtext --> location, description, CTA ]
 *
 * Section default content (.village-location__content: H2, paragraph, "Explore all villages"
 * link) and the map hint (.village-location__notification) live INSIDE the block element;
 * they are moved out and inserted as default content immediately before the block table.
 * Fallback for the intro: data-block-* attributes on the .village-component wrapper.
 * The map image + pins are UI chrome (same villages as the teaser items) and are not emitted.
 * Iteration is keyed on .village-location-teaser__item (block wrapper, not buttons/anchors).
 */
function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function isBlank(el) {
  return !el.querySelector('img, a[href]') && clean(el.textContent.replace(/ /g, ' ')) === '';
}

function htmlToNodes(document, html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return Array.from(div.childNodes).filter((n) => n.nodeType === 1 || clean(n.textContent));
}

function buildIntro(element, document) {
  const nodes = [];
  const intro = element.querySelector('.village-location__content');
  const wrapper = element.closest('[data-block-title]');

  // Heading: source has <h2 class="village-location__title"><span><h2>...</h2></span></h2>
  let headingSrc = null;
  if (intro) {
    const hs = Array.from(intro.querySelectorAll('h1, h2, h3')).filter((h) => clean(h.textContent));
    headingSrc = hs.find((h) => !h.querySelector('h1, h2, h3')) || hs[0] || null;
  }
  if (headingSrc) {
    const h2 = document.createElement('h2');
    h2.innerHTML = headingSrc.innerHTML;
    nodes.push(h2);
  } else if (wrapper && wrapper.getAttribute('data-block-title')) {
    const parsed = htmlToNodes(document, wrapper.getAttribute('data-block-title'));
    const h = parsed.find((n) => n.nodeType === 1 && /^H\d$/.test(n.tagName));
    if (h) {
      const h2 = document.createElement('h2');
      h2.innerHTML = h.innerHTML;
      nodes.push(h2);
    }
  }

  // Description paragraphs
  let paras = intro
    ? Array.from(intro.querySelectorAll('p')).filter((p) => !p.querySelector('p') && !isBlank(p))
    : [];
  if (!paras.length && wrapper && wrapper.getAttribute('data-block-description')) {
    paras = htmlToNodes(document, wrapper.getAttribute('data-block-description'))
      .filter((n) => n.nodeType === 1 && !isBlank(n));
  }
  nodes.push(...paras);

  // CTA "Explore all villages"
  let cta = intro ? intro.querySelector('a.village-location__button[href], a[href]') : null;
  if (!cta && wrapper && wrapper.getAttribute('data-block-cta-link')) {
    cta = document.createElement('a');
    cta.href = wrapper.getAttribute('data-block-cta-link');
    cta.textContent = wrapper.getAttribute('data-block-cta-label') || 'Explore all villages';
  }
  if (cta) {
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = clean(cta.textContent);
    const p = document.createElement('p');
    p.append(a);
    nodes.push(p);
  }

  // Map hint ("Not sure where you want to go?" + text)
  const note = element.querySelector('.village-location__notification');
  if (note) {
    const title = note.querySelector('.village-location__notification-title, h3, h4, h5');
    if (title && clean(title.textContent)) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = clean(title.textContent);
      p.append(strong);
      nodes.push(p);
    }
    Array.from(note.querySelectorAll('p')).filter((p) => !isBlank(p) && !p.matches('.village-location__notification-title')).forEach((p) => nodes.push(p));
  } else if (wrapper && wrapper.getAttribute('data-block-notification-label')) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = clean(wrapper.getAttribute('data-block-notification-label'));
    p.append(strong);
    nodes.push(p);
    const desc = wrapper.getAttribute('data-block-notification-description');
    if (desc) nodes.push(...htmlToNodes(document, desc).filter((n) => n.nodeType === 1 && !isBlank(n)));
  }

  return nodes;
}

export default function parse(element, { document }) {
  const introNodes = buildIntro(element, document);

  // One item per village teaser
  let items = Array.from(element.querySelectorAll('.village-location-teaser__item'));
  if (!items.length) items = Array.from(element.querySelectorAll('.cmp-signpost, .village-location-teaser .cmp-teaser'));

  const cells = [];
  items.forEach((item) => {
    const name = clean(item.querySelector('.cmp-teaser__title, h3, h4')?.textContent);
    const location = clean(item.querySelector('.cmp-teaser__location-text, .cmp-teaser__location')?.textContent);
    const descEl = item.querySelector('.cmp-teaser__description');
    const img = item.querySelector('.cmp-teaser__image img, img');
    const cta = item.querySelector('a.cmp-teaser__action-link[href]')
      || Array.from(item.querySelectorAll('a[href]')).find((a) => !a.classList.contains('village-location__button'));
    if (!name && !descEl && !img) return;

    // Cell 1: tab label (village name + location as separate lines)
    const labelCell = document.createDocumentFragment();
    labelCell.appendChild(document.createComment(' field:title '));
    const pName = document.createElement('p');
    pName.textContent = name;
    labelCell.appendChild(pName);
    if (location) {
      const pLoc = document.createElement('p');
      pLoc.textContent = location;
      labelCell.appendChild(pLoc);
    }

    // Cell 2: panel (image, heading, richtext)
    const panelCell = document.createDocumentFragment();
    if (img) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || name;
      panelCell.appendChild(document.createComment(' field:content_image '));
      panelCell.appendChild(image);
    }
    if (name) {
      const h3 = document.createElement('h3');
      h3.textContent = name;
      panelCell.appendChild(document.createComment(' field:content_heading '));
      panelCell.appendChild(h3);
    }
    const rich = [];
    if (location) {
      const p = document.createElement('p');
      p.textContent = location;
      rich.push(p);
    }
    if (descEl && clean(descEl.textContent)) {
      const p = document.createElement('p');
      p.innerHTML = descEl.innerHTML.trim();
      rich.push(p);
    }
    if (cta) {
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = clean(cta.textContent);
      const p = document.createElement('p');
      p.append(a);
      rich.push(p);
    }
    if (rich.length) {
      panelCell.appendChild(document.createComment(' field:content_richtext '));
      rich.forEach((r) => panelCell.appendChild(r));
    }

    cells.push([labelCell, panelCell]);
  });

  if (!cells.length) {
    if (introNodes.length) element.replaceWith(...introNodes);
    else element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-village', cells });
  // Section intro stays default content, placed directly before the block table
  if (introNodes.length) element.before(...introNodes);
  element.replaceWith(block);
}
