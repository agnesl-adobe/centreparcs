import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

const VIDEO_EXT = /\.(mp4|webm|m4v|mov)(\?|#|$)/i;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Finds the authored video link: a link to a video file, else the first non-image link.
 * @param {Element} block
 * @returns {HTMLAnchorElement|null}
 */
function findVideoLink(block) {
  const links = [...block.querySelectorAll('a[href]')];
  return links.find((a) => VIDEO_EXT.test(a.href))
    || links.find((a) => /scene7|video/i.test(a.href))
    || null;
}

function buildToggle(video) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hero-video-toggle';

  const sync = () => {
    const playing = !video.paused;
    button.setAttribute('aria-label', playing ? 'Pause background video' : 'Play background video');
    button.classList.toggle('is-paused', !playing);
  };

  button.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();
  return button;
}

/**
 * Full-width background-video hero with poster image and pause control.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-video-media';

  const content = document.createElement('div');
  content.className = 'hero-video-content';

  // poster image (first picture anywhere in the block)
  const picture = block.querySelector('picture');
  let posterSrc = '';
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      const optimizedImg = optimized.querySelector('img');
      optimizedImg.setAttribute('fetchpriority', 'high');
      posterSrc = optimizedImg.currentSrc || optimizedImg.src;
      media.append(optimized);
    }
    picture.remove();
  }

  // video link (removed from the visible content)
  const link = findVideoLink(block);
  const videoSrc = link ? link.href : '';
  if (link) {
    const holder = link.closest('p, div');
    link.remove();
    if (holder && !holder.textContent.trim() && !holder.querySelector('picture')) holder.remove();
  }

  // remaining authored content (e.g. visually-hidden heading) is kept for semantics
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });
  [...content.querySelectorAll('p')].forEach((p) => {
    if (!p.textContent.trim() && !p.children.length) p.remove();
  });

  block.replaceChildren(media);
  if (content.children.length) block.append(content);

  if (!videoSrc) return;

  const video = document.createElement('video');
  video.className = 'hero-video-video';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.preload = 'none';
  if (posterSrc) video.poster = posterSrc;

  // Scene7 renditions are named <set>-<w>x<h>-<bitrate>: below desktop, try the 540p
  // rendition first (about half the bytes) and fall back to the authored one
  const sources = [videoSrc];
  const smaller = videoSrc.replace(/-0x720-4000k(?=$|[?#])/, '-0x540-2000k');
  if (smaller !== videoSrc && !window.matchMedia('(min-width: 900px)').matches) sources.unshift(smaller);
  sources.forEach((src) => {
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    video.append(source);
  });

  const toggle = buildToggle(video);

  // load the video once the page has settled (the poster is shown until then): the
  // download is several MB, and starting it at "load" competes with the rest of the page
  const VIDEO_DELAY = 3000;
  const start = () => {
    media.append(video);
    block.append(toggle);
    video.addEventListener('canplay', () => block.classList.add('hero-video-playing'), { once: true });
    if (!prefersReducedMotion()) video.play().catch(() => {});
  };

  if (document.readyState === 'complete') setTimeout(start, VIDEO_DELAY);
  else window.addEventListener('load', () => setTimeout(start, VIDEO_DELAY), { once: true });
}
