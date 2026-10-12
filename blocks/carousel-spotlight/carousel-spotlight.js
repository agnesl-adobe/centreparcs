import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

let carouselId = 0;

function getIndex(block) {
  return parseInt(block.dataset.activeSlide || '0', 10);
}

function showSlide(block, slideIndex = 0) {
  const slides = [...block.querySelectorAll('.carousel-spotlight-slide')];
  if (!slides.length) return;
  const index = Math.min(Math.max(slideIndex, 0), slides.length - 1);
  block.dataset.activeSlide = index;

  slides.forEach((slide, idx) => {
    const active = idx === index;
    slide.classList.toggle('active', active);
    slide.setAttribute('aria-hidden', !active);
    if (active) slide.removeAttribute('inert');
    else slide.setAttribute('inert', '');
  });

  block.querySelectorAll('.carousel-spotlight-thumb button').forEach((button, idx) => {
    button.setAttribute('aria-current', idx === index ? 'true' : 'false');
  });

  const prev = block.querySelector('.carousel-spotlight-prev');
  const next = block.querySelector('.carousel-spotlight-next');
  if (prev) prev.disabled = index === 0;
  if (next) next.disabled = index === slides.length - 1;
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-spotlight-thumb button').forEach((button, idx) => {
    button.addEventListener('click', () => showSlide(block, idx));
  });

  block.querySelector('.carousel-spotlight-prev')?.addEventListener('click', () => {
    showSlide(block, getIndex(block) - 1);
  });
  block.querySelector('.carousel-spotlight-next')?.addEventListener('click', () => {
    showSlide(block, getIndex(block) + 1);
  });

  // swipe support for touch devices
  const slides = block.querySelector('.carousel-spotlight-slides');
  let startX = null;
  let startY = null;
  slides.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    startX = e.clientX;
    startY = e.clientY;
  });
  slides.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      showSlide(block, getIndex(block) + (dx < 0 ? 1 : -1));
    }
  });
  slides.addEventListener('pointercancel', () => { startX = null; });
}

function decorateContent(slide) {
  const content = slide.querySelector('.carousel-spotlight-slide-content');
  if (!content) return;

  // drop spacer paragraphs (&nbsp;) carried over from the source richtext
  content.querySelectorAll(':scope > p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('picture, img, a')) p.remove();
  });

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    if (!heading.id) heading.id = `${slide.id}-title`;
    slide.setAttribute('aria-labelledby', heading.id);
  }

  // pretitle: the first plain paragraph directly after the heading
  const pretitle = heading?.nextElementSibling;
  if (pretitle?.tagName === 'P' && !pretitle.querySelector('a')) {
    pretitle.classList.add('carousel-spotlight-pretitle');
  }

  // paragraphs holding a single link are CTAs: first is primary, the rest secondary
  const links = [...content.querySelectorAll(':scope > p')].filter((p) => {
    const a = p.querySelector(':scope > a[href], :scope > strong > a[href], :scope > em > a[href]');
    return a && !a.querySelector('picture, img') && p.textContent.trim() === a.textContent.trim();
  });
  links.forEach((p, idx) => {
    const a = p.querySelector('a');
    p.className = 'button-wrapper';
    a.classList.remove('primary', 'secondary', 'accent');
    a.classList.add('button', idx === 0 ? 'primary' : 'secondary');
  });
  if (links.length) {
    const actions = document.createElement('div');
    actions.className = 'carousel-spotlight-actions';
    links[0].before(actions);
    actions.append(...links);
  }
}

function createSlide(row, slideIndex, id) {
  const slide = document.createElement('div');
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-spotlight-${id}-slide-${slideIndex}`;
  slide.className = 'carousel-spotlight-slide';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const cells = [...row.querySelectorAll(':scope > div')];
  cells.forEach((cell, idx) => {
    // first of several cells is the image (kept even when empty, so UE fields stay
    // aligned); a lone cell is the image only when it holds nothing but a picture
    const isImage = cells.length > 1
      ? idx === 0
      : !!cell.querySelector('picture') && !cell.textContent.trim();
    cell.className = isImage ? 'carousel-spotlight-slide-image' : 'carousel-spotlight-slide-content';
    slide.append(cell);
  });

  // content always sits first in the DOM (reading order); CSS places the image
  const content = slide.querySelector('.carousel-spotlight-slide-content');
  if (content) slide.prepend(content);

  decorateContent(slide);
  return slide;
}

function createThumb(slide, idx, total) {
  const li = document.createElement('li');
  li.className = 'carousel-spotlight-thumb';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-controls', slide.id);
  const title = slide.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() || `Slide ${idx + 1}`;
  // accessible name from visually hidden text
  const name = document.createElement('span');
  name.className = 'carousel-spotlight-sr';
  name.textContent = `Show ${title} (${idx + 1} of ${total})`;

  const img = slide.querySelector('.carousel-spotlight-slide-image img');
  if (img) {
    const src = img.getAttribute('src');
    if (/[?&]wid=\d+/.test(src)) {
      // Dynamic Media rendition: request a small width instead of the slide size
      const picture = document.createElement('picture');
      const thumbImg = document.createElement('img');
      thumbImg.src = src.replace(/([?&])wid=\d+/, '$1wid=200');
      thumbImg.alt = '';
      thumbImg.loading = 'lazy';
      thumbImg.decoding = 'async';
      picture.append(thumbImg);
      button.append(picture);
    } else {
      button.append(createOptimizedPicture(img.src, '', false, [{ width: '200' }]));
    }
  }
  button.append(name);
  li.append(button);
  return li;
}

/**
 * Finds the nearest heading before the block in its section (labels the carousel).
 */
function findSectionHeading(block) {
  const section = block.closest('.section');
  if (!section) return null;
  const sequence = [...section.querySelectorAll('h1, h2, h3, h4, h5, h6, .block')];
  return sequence.slice(0, sequence.indexOf(block)).reverse()
    .find((el) => /^H[1-6]$/.test(el.tagName)) || null;
}

/**
 * Carousel container: a labelled region when the section has a heading, otherwise an
 * unlabelled group (avoids anonymous duplicate landmarks).
 */
function labelCarousel(block) {
  const heading = findSectionHeading(block);
  block.setAttribute('aria-roledescription', 'carousel');
  if (heading) {
    if (!heading.id) heading.id = `${block.id || 'carousel'}-heading`;
    block.setAttribute('role', 'region');
    block.setAttribute('aria-labelledby', heading.id);
  } else {
    block.setAttribute('role', 'group');
  }
}

/**
 * Spotlight carousel: a card with a text panel on the left and a rounded image on
 * the right; prev / next arrows and a thumbnail strip switch slide (text + image).
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  carouselId += 1;
  block.id = `carousel-spotlight-${carouselId}`;
  const rows = [...block.querySelectorAll(':scope > div')];

  labelCarousel(block);

  const stage = document.createElement('div');
  stage.className = 'carousel-spotlight-stage';

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'carousel-spotlight-slides';
  slidesWrapper.id = `${block.id}-slides`;

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  slidesWrapper.querySelectorAll('.carousel-spotlight-slide-image picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1400' }, { width: '900' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  stage.append(slidesWrapper);
  block.replaceChildren(stage);

  const slides = [...slidesWrapper.children];
  if (!slides.length) return;
  if (!slidesWrapper.querySelector('.carousel-spotlight-slide-image picture')) {
    // text-only slides: no gallery to navigate
    block.classList.add('carousel-spotlight-no-image');
  }
  if (slides.length < 2) block.classList.add('carousel-spotlight-single');

  // gallery controls: arrows + thumbnails (rendered for a single slide too, disabled,
  // matching the source which keeps the arrows and one thumbnail)
  const nav = document.createElement('div');
  nav.className = 'carousel-spotlight-nav';

  const arrows = document.createElement('div');
  arrows.className = 'carousel-spotlight-arrows';
  arrows.innerHTML = `
    <button type="button" class="carousel-spotlight-arrow carousel-spotlight-prev" aria-label="Previous slide"></button>
    <button type="button" class="carousel-spotlight-arrow carousel-spotlight-next" aria-label="Next slide"></button>
  `;
  arrows.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-controls', slidesWrapper.id);
  });

  const thumbsNav = document.createElement('nav');
  thumbsNav.className = 'carousel-spotlight-thumbs-nav';
  thumbsNav.setAttribute('aria-label', 'Image thumbnails');
  const thumbs = document.createElement('ol');
  thumbs.className = 'carousel-spotlight-thumbs';
  slides.forEach((slide, idx) => thumbs.append(createThumb(slide, idx, slides.length)));
  thumbsNav.append(thumbs);

  nav.append(arrows, thumbsNav);
  stage.append(nav);

  showSlide(block, 0);
  bindEvents(block);
}
