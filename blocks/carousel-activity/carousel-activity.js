import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

let carouselId = 0;

function getStep(track) {
  const tile = track.querySelector('.carousel-activity-tile');
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  return tile ? tile.getBoundingClientRect().width + gap : track.clientWidth;
}

/**
 * Progress fills one segment per snap position (one per slide step, plus the end),
 * matching the source slider's progress bar behaviour.
 */
function getPosition(track, step, max) {
  const positions = max > 1 && step > 0 ? Math.ceil((max - 1) / step) + 1 : 1;
  const index = track.scrollLeft >= max - 1
    ? positions - 1
    : Math.min(positions - 1, Math.round(track.scrollLeft / step));
  return { positions, index };
}

function updateControls(track, prev, next, progress) {
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  const { positions, index } = getPosition(track, getStep(track), max);
  progress.style.setProperty('--carousel-activity-progress', (index + 1) / positions);
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

  const go = (dir) => {
    const step = getStep(track);
    const max = track.scrollWidth - track.clientWidth;
    const { index } = getPosition(track, step, max);
    track.scrollTo({ left: Math.max(0, Math.min(max, (index + dir) * step)), behavior: 'smooth' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  const sync = () => updateControls(track, prev, next, progress);
  track.addEventListener('scroll', sync, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(sync).observe(track);

  block.replaceChildren(track, controls);
  requestAnimationFrame(sync);
}
