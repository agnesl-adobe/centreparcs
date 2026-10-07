import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

let carouselId = 0;

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;

  block.querySelectorAll('.carousel-lodges-slide').forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a').forEach((link) => {
      if (active) link.removeAttribute('tabindex');
      else link.setAttribute('tabindex', '-1');
    });
  });

  block.querySelectorAll('.carousel-lodges-thumb button').forEach((button, idx) => {
    button.setAttribute('aria-current', idx === slideIndex ? 'true' : 'false');
  });
}

function showSlide(block, slideIndex = 0, behavior = 'smooth') {
  const slides = block.querySelectorAll('.carousel-lodges-slide');
  if (!slides.length) return;
  let index = slideIndex;
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;
  const target = slides[index];
  block.querySelector('.carousel-lodges-slides').scrollTo({
    top: 0,
    left: target.offsetLeft,
    behavior,
  });
  updateActiveSlide(block, index);
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-lodges-thumb button').forEach((button, idx) => {
    button.addEventListener('click', () => showSlide(block, idx));
  });

  block.querySelector('.carousel-lodges-prev')?.addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
  });
  block.querySelector('.carousel-lodges-next')?.addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { root: block.querySelector('.carousel-lodges-slides'), threshold: 0.6 });
  block.querySelectorAll('.carousel-lodges-slide').forEach((slide) => observer.observe(slide));
}

function createSlide(row, slideIndex, id) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-lodges-${id}-slide-${slideIndex}`;
  slide.className = 'carousel-lodges-slide';

  const cells = [...row.querySelectorAll(':scope > div')];
  cells.forEach((cell, idx) => {
    // first cell is the background image; a lone text-only cell is treated as content
    const isImage = idx === 0 && (cells.length > 1 || cell.querySelector('picture'));
    cell.classList.add(isImage ? 'carousel-lodges-slide-image' : 'carousel-lodges-slide-content');
    slide.append(cell);
  });

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    if (!heading.id) heading.id = `${slide.id}-title`;
    slide.setAttribute('aria-labelledby', heading.id);
  }

  // last link in the content is a secondary action
  const content = slide.querySelector('.carousel-lodges-slide-content');
  if (content) {
    const buttons = [...content.querySelectorAll('a.button')];
    if (buttons.length > 1) {
      buttons.slice(1).forEach((a) => {
        a.classList.remove('primary');
        a.classList.add('secondary');
      });
    }
    const links = [...content.querySelectorAll('p.button-container')];
    if (links.length > 1) {
      const actions = document.createElement('div');
      actions.className = 'carousel-lodges-actions';
      links[0].before(actions);
      actions.append(...links);
    }
  }
  return slide;
}

function createThumb(slide, idx, total) {
  const li = document.createElement('li');
  li.className = 'carousel-lodges-thumb';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-controls', slide.id);
  const title = slide.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() || `Slide ${idx + 1}`;
  button.setAttribute('aria-label', `Show ${title} (${idx + 1} of ${total})`);

  const img = slide.querySelector('.carousel-lodges-slide-image img');
  if (img) {
    const thumb = createOptimizedPicture(img.src, '', false, [{ width: '200' }]);
    button.append(thumb);
  }
  const label = document.createElement('span');
  label.className = 'carousel-lodges-thumb-label';
  label.textContent = title;
  button.append(label);
  li.append(button);
  return li;
}

/**
 * Accommodation carousel: full-bleed image slides with an overlay content card
 * and thumbnail navigation.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  carouselId += 1;
  block.id = `carousel-lodges-${carouselId}`;
  const rows = [...block.querySelectorAll(':scope > div')];
  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.className = 'carousel-lodges-slides-container';

  const slidesWrapper = document.createElement('ul');
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

  if (isSingleSlide) return;

  const nav = document.createElement('div');
  nav.className = 'carousel-lodges-navigation-buttons';
  nav.innerHTML = `
    <button type="button" class="carousel-lodges-prev" aria-label="Previous slide"></button>
    <button type="button" class="carousel-lodges-next" aria-label="Next slide"></button>
  `;
  container.append(nav);

  const thumbsNav = document.createElement('nav');
  thumbsNav.className = 'carousel-lodges-thumbs-nav';
  thumbsNav.setAttribute('aria-label', 'Carousel slide controls');
  const thumbs = document.createElement('ol');
  thumbs.className = 'carousel-lodges-thumbs';
  const slides = [...slidesWrapper.children];
  slides.forEach((slide, idx) => thumbs.append(createThumb(slide, idx, slides.length)));
  thumbsNav.append(thumbs);
  block.append(thumbsNav);

  updateActiveSlide(block, 0);
  bindEvents(block);
}
