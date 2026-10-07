import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

let carouselId = 0;

function updateControls(track, prev, next, progress) {
  const max = track.scrollWidth - track.clientWidth;
  const ratio = max > 0 ? track.scrollLeft / max : 1;
  const visible = track.scrollWidth > 0 ? track.clientWidth / track.scrollWidth : 1;
  progress.style.setProperty('--carousel-activity-progress', Math.min(1, visible + ((1 - visible) * ratio)));
  prev.disabled = track.scrollLeft <= 1;
  next.disabled = track.scrollLeft >= max - 1;
}

/**
 * Horizontal slider of portrait image tiles, each with an overlay link button,
 * prev / next arrows and a scroll progress bar.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  carouselId += 1;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const track = document.createElement('ul');
  track.className = 'carousel-activity-track';
  track.id = `carousel-activity-${carouselId}-track`;
  track.tabIndex = 0;

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'carousel-activity-tile';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture') && !cell.textContent.trim()) cell.className = 'carousel-activity-tile-image';
      else cell.className = 'carousel-activity-tile-content';
    });
    track.append(li);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '500' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  const controls = document.createElement('div');
  controls.className = 'carousel-activity-controls';

  const progress = document.createElement('div');
  progress.className = 'carousel-activity-progress';
  progress.setAttribute('aria-hidden', 'true');
  const bar = document.createElement('span');
  bar.className = 'carousel-activity-progress-bar';
  progress.append(bar);

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-activity-prev';
  prev.setAttribute('aria-label', 'Previous slides');
  prev.setAttribute('aria-controls', track.id);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-activity-next';
  next.setAttribute('aria-label', 'Next slides');
  next.setAttribute('aria-controls', track.id);

  const buttons = document.createElement('div');
  buttons.className = 'carousel-activity-buttons';
  buttons.append(prev, next);
  controls.append(progress, buttons);

  const step = () => {
    const tile = track.querySelector('.carousel-activity-tile');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return tile ? tile.getBoundingClientRect().width + gap : track.clientWidth;
  };
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

  const sync = () => updateControls(track, prev, next, progress);
  track.addEventListener('scroll', sync, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(sync).observe(track);

  block.replaceChildren(track, controls);
  requestAnimationFrame(sync);
}
