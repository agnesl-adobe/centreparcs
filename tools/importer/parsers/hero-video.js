/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-video. Base: hero.
 * Source: https://www.centerparcs.co.uk/ (.cmp-reservation-hero)
 * UE model (blocks/hero-video/_hero-video.json): image (+imageAlt collapsed), video, text.
 * Output: 1 column, 3 rows -> image | video | text.
 *
 * Video: the rendered <video> uses a blob: URL (not portable). The real asset is the
 * Scene7 Adaptive Video Set id in .cmp-teaser__image[data-video-asset]
 * (e.g. "centerparcs/Spring - Web Video - 1920x1080 - PROOF-AVS"). AVS sets are not
 * directly playable, so we link the standard Scene7 adaptive-encoding 720p MP4 rendition
 * (<set name without -AVS>-0x720-4000k), which is served as video/mp4 from /is/content/.
 * Non-AVS assets are linked as /is/content/<asset>. If no asset id exists, only poster + text.
 * Booking search widget (.searchbar) and Scene7 viewer chrome are not content.
 */
const S7_HOST = 'https://centerparcs.scene7.com';

function getVideoUrl(element) {
  // Real <source>/<video> URLs first (non-blob)
  const direct = Array.from(element.querySelectorAll('video[src], video source[src]'))
    .map((v) => v.getAttribute('src'))
    .find((src) => src && !src.startsWith('blob:'));
  if (direct) return direct;

  const holder = element.querySelector('[data-video-asset]');
  const asset = holder ? (holder.getAttribute('data-video-asset') || '').trim() : '';
  if (!asset) return '';
  if (/^https?:\/\//i.test(asset)) return asset;
  const mp4Asset = /-AVS$/i.test(asset) ? asset.replace(/-AVS$/i, '-0x720-4000k') : asset;
  return `${S7_HOST}/is/content/${mp4Asset.split('/').map((s) => encodeURIComponent(s)).join('/')}`;
}

export default function parse(element, { document }) {
  // Poster image: <div class="cmp-image"><a class="cmp-image__link" href="/"><img class="cmp-image__image" ...></a></div>
  const poster = element.querySelector('.cmp-teaser__image img.cmp-image__image')
    || element.querySelector('.cmp-image img, .cmp-teaser__image img:not([src*="s7viewers"])');

  // Heading / text from teaser content (empty on the homepage)
  const content = element.querySelector('.cmp-teaser__content');
  const textEls = content
    ? Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6, p')).filter((e) => e.textContent.trim())
    : [];

  const videoUrl = getVideoUrl(element);

  if (!poster && !videoUrl && !textEls.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 1: image
  if (poster) {
    const img = document.createElement('img');
    img.src = poster.getAttribute('src');
    img.alt = poster.getAttribute('alt') || '';
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:image '));
    frag.appendChild(img);
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  // Row 2: video
  if (videoUrl) {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.textContent = videoUrl;
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:video '));
    frag.appendChild(a);
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  // Row 3: text (visually hidden heading)
  if (textEls.length) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:text '));
    textEls.forEach((e) => frag.appendChild(e));
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
