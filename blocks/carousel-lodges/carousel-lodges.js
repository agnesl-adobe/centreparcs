import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

let carouselId = 0;

function getIndex(block) {
  return parseInt(block.dataset.activeSlide || '0', 10);
}

function scrollThumbIntoView(block, index) {
  const list = block.querySelector('.carousel-lodges-thumbs');
  const thumb = list?.children[index];
  if (!thumb) return;
  if (getComputedStyle(list).flexDirection === 'column') {
    // desktop rail: list overflows the slide, shift it so the active thumb stays visible
    const visible = list.parentElement.clientHeight - 100;
    let shift = parseFloat(list.dataset.shift || '0');
    const top = thumb.offsetTop;
    const bottom = top + thumb.offsetHeight;
    if (bottom - shift > visible) shift = bottom - visible;
    if (top - shift < 0) shift = Math.max(0, top - 20);
    list.dataset.shift = shift;
    list.style.transform = shift ? `translateY(-${shift}px)` : '';
  } else {
    list.dataset.shift = 0;
    list.style.transform = '';
    const left = thumb.offsetLeft;
    if (left < list.scrollLeft || left + thumb.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, left - 10), behavior: 'smooth' });
    }
  }
}

function showSlide(block, slideIndex = 0, scrollThumb = true) {
  const slides = [...block.querySelectorAll('.carousel-lodges-slide')];
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

  const thumbs = [...block.querySelectorAll('.carousel-lodges-thumb')];
  thumbs.forEach((thumb, idx) => {
    thumb.querySelector('button').setAttribute('aria-current', idx === index ? 'true' : 'false');
  });

  // "Click to explore" hint sits on the thumbnail after the active one
  const hint = block.querySelector('.carousel-lodges-explore');
  if (hint) {
    const target = thumbs[index + 1];
    hint.hidden = !target;
    if (target) target.querySelector('button').append(hint);
  }

  const prev = block.querySelector('.carousel-lodges-prev');
  const next = block.querySelector('.carousel-lodges-next');
  if (prev) prev.disabled = index === 0;
  if (next) next.disabled = index === slides.length - 1;

  const fill = block.querySelector('.carousel-lodges-progress-fill');
  if (fill) fill.style.transform = `scaleX(${(index + 1) / slides.length})`;

  // reads layout: skipped for the initial slide, whose thumbnail is already in view
  if (scrollThumb) scrollThumbIntoView(block, index);
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-lodges-thumb button').forEach((button, idx) => {
    button.addEventListener('click', () => showSlide(block, idx));
  });

  block.querySelector('.carousel-lodges-prev')?.addEventListener('click', () => {
    showSlide(block, getIndex(block) - 1);
  });
  block.querySelector('.carousel-lodges-next')?.addEventListener('click', () => {
    showSlide(block, getIndex(block) + 1);
  });

  // swipe support for touch devices
  const slides = block.querySelector('.carousel-lodges-slides');
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

function decorateContent(slide, id) {
  const content = slide.querySelector('.carousel-lodges-slide-content');
  if (!content) return;

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    if (!heading.id) heading.id = `${slide.id}-title`;
    slide.setAttribute('aria-labelledby', heading.id);
  }

  // amenity icons are authored as <li><a href="ICON-URL">label</a></li> (richtext can't
  // hold inline images): rebuild them as a decorative icon followed by the plain label
  content.querySelectorAll('li > a[href*="/is/content/"]:only-child').forEach((a) => {
    const li = a.parentElement;
    const label = a.textContent.trim();
    if (li.textContent.trim() !== label) return;
    const img = document.createElement('img');
    img.src = a.href;
    img.alt = '';
    img.width = 20;
    img.height = 20;
    li.replaceChildren(img, ` ${label}`);
  });

  // amenity icons sit next to a text label: mark redundant alt text as decorative
  content.querySelectorAll('li img').forEach((img) => {
    const label = img.closest('li').textContent.trim().toLowerCase();
    if (!img.alt || label.includes(img.alt.trim().toLowerCase())) img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
  });

  // strapline: the first plain paragraph directly after the heading
  const strap = heading?.nextElementSibling;
  if (strap?.tagName === 'P' && !strap.classList.contains('button-container')) {
    strap.classList.add('carousel-lodges-strapline');
  }

  // paragraphs holding a single link are CTAs: first is primary, the rest secondary
  const links = [...content.querySelectorAll(':scope > p')].filter((p) => {
    const a = p.querySelector(':scope > a[href], :scope > strong > a[href], :scope > em > a[href]');
    return a && !a.querySelector('picture, img') && p.textContent.trim() === a.textContent.trim();
  });
  links.forEach((p, idx) => {
    const a = p.querySelector('a');
    p.classList.add('button-container');
    a.classList.remove('primary', 'secondary', 'accent');
    a.classList.add('button', idx === 0 ? 'primary' : 'secondary');
  });
  if (links.length) {
    const actions = document.createElement('div');
    actions.className = 'carousel-lodges-actions';
    links[0].before(actions);
    actions.append(...links);
  }

  // everything after the heading is collapsible on small screens
  const details = document.createElement('div');
  details.className = 'carousel-lodges-slide-details';
  details.id = `${slide.id}-details`;
  [...content.children].filter((el) => el !== heading).forEach((el) => details.append(el));
  content.append(details);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'carousel-lodges-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', details.id);
  toggle.setAttribute('aria-label', `Show details: ${heading?.textContent.trim() || `slide ${id}`}`);
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    content.classList.toggle('expanded', !expanded);
  });
  content.prepend(toggle);
}

function createSlide(row, slideIndex, id) {
  const slide = document.createElement('div');
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-lodges-${id}-slide-${slideIndex}`;
  slide.className = 'carousel-lodges-slide';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const cells = [...row.querySelectorAll(':scope > div')];
  cells.forEach((cell, idx) => {
    // first cell is the background image; a lone text-only cell is treated as content
    const isImage = idx === 0 && (cells.length > 1 || cell.querySelector('picture'));
    cell.classList.add(isImage ? 'carousel-lodges-slide-image' : 'carousel-lodges-slide-content');
    slide.append(cell);
  });

  decorateContent(slide, slideIndex + 1);
  return slide;
}

function createThumb(slide, idx, total) {
  const li = document.createElement('li');
  li.className = 'carousel-lodges-thumb';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-controls', slide.id);
  const title = slide.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() || `Slide ${idx + 1}`;
  // accessible name from (visually hidden) content, so it contains the visible label
  const name = document.createElement('span');
  name.className = 'carousel-lodges-sr';
  name.textContent = `Show ${title} (${idx + 1} of ${total})`;

  const img = slide.querySelector('.carousel-lodges-slide-image img');
  if (img) {
    const src = img.getAttribute('src');
    if (/[?&]wid=\d+/.test(src)) {
      // Dynamic Media rendition: request a small width instead of the slide size
      const picture = document.createElement('picture');
      const thumbImg = document.createElement('img');
      thumbImg.src = src.replace(/([?&])wid=\d+/, '$1wid=400');
      thumbImg.alt = '';
      thumbImg.loading = 'lazy';
      thumbImg.decoding = 'async';
      picture.append(thumbImg);
      button.append(picture);
    } else {
      button.append(createOptimizedPicture(img.src, '', false, [{ width: '400' }]));
    }
  }
  const label = document.createElement('span');
  label.className = 'carousel-lodges-thumb-label';
  label.setAttribute('aria-hidden', 'true');
  label.textContent = title;
  button.append(label, name);
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
 * Accommodation carousel: full-bleed fading image slides with an overlay
 * content card and thumbnail navigation.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  carouselId += 1;
  block.id = `carousel-lodges-${carouselId}`;
  const rows = [...block.querySelectorAll(':scope > div')];
  const isSingleSlide = rows.length < 2;

  labelCarousel(block);

  const container = document.createElement('div');
  container.className = 'carousel-lodges-slides-container';

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'carousel-lodges-slides';

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  slidesWrapper.querySelectorAll('.carousel-lodges-slide-image picture > img').forEach((img, idx) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, idx === 0, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  container.append(slidesWrapper);
  block.replaceChildren(container);

  if (isSingleSlide) {
    showSlide(block, 0, false);
    return;
  }

  const thumbsNav = document.createElement('nav');
  thumbsNav.className = 'carousel-lodges-thumbs-nav';
  thumbsNav.setAttribute('aria-label', 'Carousel slide controls');
  const thumbs = document.createElement('ol');
  thumbs.className = 'carousel-lodges-thumbs';
  const slides = [...slidesWrapper.children];
  slides.forEach((slide, idx) => thumbs.append(createThumb(slide, idx, slides.length)));
  thumbsNav.append(thumbs);

  const hint = document.createElement('span');
  hint.className = 'carousel-lodges-explore';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = 'Click to explore';

  const controls = document.createElement('div');
  controls.className = 'carousel-lodges-controls';
  controls.innerHTML = `
    <div class="carousel-lodges-progress" aria-hidden="true"><span class="carousel-lodges-progress-fill"></span></div>
    <button type="button" class="carousel-lodges-arrow carousel-lodges-prev" aria-label="Previous slide"></button>
    <button type="button" class="carousel-lodges-arrow carousel-lodges-next" aria-label="Next slide"></button>
  `;
  thumbsNav.append(controls);
  container.append(thumbsNav);
  thumbs.children[1].querySelector('button').append(hint);

  showSlide(block, 0, false);
  bindEvents(block);
}
