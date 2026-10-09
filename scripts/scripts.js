import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  createOptimizedPicture as createOptimizedPictureBase,
} from './aem.js';

// --- Adobe Target via at.js ---
// https://www.aem.live/developer/target-integration (legacy at.js approach)
// Only pages with "Target: on" metadata load at.js (it adds ~0.5-1.3s to the LCP).
const TARGET_CONFIG = {
  clientCode: 'adobedemoemea143', // Target client code (Target > Administration > Implementation)
  imsOrgId: '3310BEDB5AC489F20A495D2A@AdobeOrg', // Adobe IMS Organization ID
};

function isTargetEnabled() {
  return Boolean(TARGET_CONFIG.clientCode && TARGET_CONFIG.imsOrgId
    && getMetadata('target').toLowerCase() === 'on');
}

function initATJS(path, config) {
  window.targetGlobalSettings = config;
  return import(path);
}

function onDecoratedElement(fn) {
  // Apply offers to all already decorated blocks/sections
  if (document.querySelector('[data-block-status="loaded"],[data-section-status="loaded"]')) {
    fn();
  }

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.target.tagName === 'BODY'
      || m.target.dataset.sectionStatus === 'loaded'
      || m.target.dataset.blockStatus === 'loaded')) {
      fn();
    }
  });
  // Watch sections and blocks being decorated async
  observer.observe(document.querySelector('main'), {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-block-status', 'data-section-status'],
  });
  // Watch anything else added to the body
  observer.observe(document.querySelector('body'), { childList: true });
}

function toCssSelector(selector) {
  return selector.replace(/(\.\S+)?:eq\((\d+)\)/g, (_, clss, i) => `:nth-child(${Number(i) + 1}${clss ? ` of ${clss})` : ''}`);
}

function getElementForOffer(offer) {
  const selector = offer.cssSelector || toCssSelector(offer.selector);
  return document.querySelector(selector);
}

function getElementForMetric(metric) {
  const selector = toCssSelector(metric.selector);
  return document.querySelector(selector);
}

async function getAndApplyOffers() {
  const response = await window.adobe.target.getOffers({ request: { execute: { pageLoad: {} } } });
  const { options = [], metrics = [] } = response.execute.pageLoad;
  onDecoratedElement(() => {
    window.adobe.target.applyOffers({ response });
    // keep track of offers that were already applied (their target element exists)
    options.forEach((o) => { o.content = o.content.filter((c) => !getElementForOffer(c)); });
    // keep track of metrics that were already applied
    metrics.map((m, i) => (getElementForMetric(m) ? i : -1))
      .filter((i) => i >= 0)
      .reverse()
      .forEach((i) => metrics.splice(i, 1));
  });
}

let atjsPromise = Promise.resolve();
if (isTargetEnabled()) {
  document.addEventListener('at-library-loaded', () => getAndApplyOffers().catch(() => {}));
  atjsPromise = initATJS(`${window.hlx.codeBasePath}/scripts/at.min.js`, {
    clientCode: TARGET_CONFIG.clientCode,
    serverDomain: `${TARGET_CONFIG.clientCode}.tt.omtrdc.net`,
    imsOrgId: TARGET_CONFIG.imsOrgId,
    bodyHidingEnabled: false,
    cookieDomain: window.location.hostname,
    pageLoadEnabled: false,
    secureOnly: true,
    viewsEnabled: false,
    withWebGLRenderer: false,
  }).catch(() => {});
}
// --- END Adobe Target ---

// --- BEGIN DM/Scene7 auto-block (excat-generated) ---

const DM_BREAKPOINTS = [
  { media: '(min-width: 600px)', width: 2000 }, // desktop
  { width: 750 }, // mobile / fallback (no media)
];

// ---- Canonical helpers (keep in sync with dm-scene7-helpers.js) ----
function detectDynamicMediaUrl(urlStr) {
  // Reject relative URLs up front — without this guard, the auto-block
  // scans every anchor in <main> and a normal site link like
  // `<a href="/is/image/foo">` would be classified as DM and replaced by
  // a <picture>. Keep byte-identical with dm-scene7-helpers.js.
  if (!/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
  let u;
  try { u = new URL(urlStr, 'https://x/'); } catch { return false; }
  // Scene7 detected by path alone — hostname is irrelevant because
  // customer sites routinely CNAME a vanity domain to Scene7 (e.g.
  // media-assets.brand.example).
  if (u.pathname.startsWith('/is/image/')) {
    return 'scene7';
  }
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
      && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

function buildScene7Rendition(src, { width, format }) {
  // Manipulate the query string verbatim — URL.searchParams percent-
  // encodes `$`, but Scene7's IS/Image template-parameter syntax
  // (`$image=`, `$badge=`, etc.) requires the literal `$`. Encoded
  // form is silently dropped by Scene7's parser, returning the bare
  // template image instead of the personalized composite.
  const normalized = src.startsWith('//') ? `https:${src}` : src;
  const qIdx = normalized.indexOf('?');
  const base = qIdx >= 0 ? normalized.slice(0, qIdx) : normalized;
  const query = qIdx >= 0 ? normalized.slice(qIdx + 1) : '';
  const pairs = query.split('&').filter((p) => p);
  const filtered = pairs.filter((p) => {
    const k = p.split('=')[0];
    return k !== 'wid' && k !== 'fmt';
  });
  filtered.push(`wid=${width}`);
  filtered.push(`fmt=${format}`);
  return `${base}?${filtered.join('&')}`;
}

function buildDmOpenApiRendition(src, { width }) {
  // Synthetic base — see buildScene7Rendition above.
  const url = new URL(src, 'https://x/');
  url.searchParams.set('width', String(width));
  return url.toString();
}

function findDmOnAnchor(a) {
  if (!a || typeof a.getAttribute !== 'function') return null;
  const href = a.getAttribute('href') || '';
  if (detectDynamicMediaUrl(href)) return { mode: 'unlinked', dmUrl: href };
  const title = a.getAttribute('title') || '';
  if (detectDynamicMediaUrl(title)) return { mode: 'linked', dmUrl: title };
  return null;
}

// True when the given anchor is the sole child of a markdown-generated
// <p> wrapper that should be unwrapped so the picture becomes a top-
// level grid cell. P only — NEVER DIV: EDS block content uses <div>
// cells (cards/carousel/columns decorators detect image cells via
// `div.querySelector('picture')`); unwrapping a <div> collapses the
// block's row structure and stops images rendering inside blocks.
// Text-node guard: <p>caption <a href="DM">alt</a></p> must NOT be
// treated as unwrappable — replacing the parent would delete "caption".
// Comparing trimmed textContent of <p> against the anchor's catches this.
function isUnwrappableMarkdownParagraph(anchor) {
  const parent = anchor && anchor.parentElement;
  if (!parent || parent.tagName !== 'P') return false;
  if (parent.children.length !== 1 || parent.firstElementChild !== anchor) return false;
  return parent.textContent.trim() === anchor.textContent.trim();
}

// Sentinel used by the transformer when source <img> alt is empty. Document
// view shows the visible cue; we translate it back to alt="" here so screen
// readers correctly skip decorative images. If an author edits the link
// text away from the sentinel, their edit becomes the real alt — a11y
// improves. Must stay byte-identical to dm-scene7-helpers.js EMPTY_ALT_SENTINEL.
const EMPTY_ALT_SENTINEL = 'Image without alt text';

function linkTextToAlt(linkText) {
  return linkText === EMPTY_ALT_SENTINEL ? '' : linkText;
}

// ---- Rendering ----
function appendSource(picture, { type, srcset, media }) {
  const source = document.createElement('source');
  if (type) source.type = type;
  source.srcset = srcset;
  if (media) source.setAttribute('media', media);
  picture.append(source);
}

function renderScene7Picture(src, alt) {
  const picture = document.createElement('picture');
  DM_BREAKPOINTS.forEach((bp) => appendSource(picture, {
    type: 'image/webp',
    srcset: buildScene7Rendition(src, { width: bp.width, format: 'webp' }),
    media: bp.media,
  }));
  DM_BREAKPOINTS.forEach((bp) => appendSource(picture, {
    type: 'image/jpeg',
    srcset: buildScene7Rendition(src, { width: bp.width, format: 'jpg' }),
    media: bp.media,
  }));
  const img = document.createElement('img');
  img.src = buildScene7Rendition(src, { width: 750, format: 'jpg' });
  img.alt = alt;
  img.loading = 'lazy';
  picture.append(img);
  return picture;
}

function renderDmOpenApiPicture(src, alt) {
  const picture = document.createElement('picture');
  DM_BREAKPOINTS.forEach((bp) => appendSource(picture, {
    srcset: buildDmOpenApiRendition(src, { width: bp.width }),
    media: bp.media,
  }));
  const img = document.createElement('img');
  img.src = buildDmOpenApiRendition(src, { width: 750 });
  img.alt = alt;
  img.loading = 'lazy';
  picture.append(img);
  return picture;
}

function buildDynamicMediaImages(main) {
  // Anchors carrying DM URLs from the markdown round-trip. The transformer
  // turns <img DM> into <a href=DM-URL> (or <a href=/page title=DM-URL>
  // for the linked case); CommonMark's [text](url "title") syntax
  // survives docx and the title attribute round-trips back to a real
  // HTML attribute at render time.
  main.querySelectorAll('a').forEach((a) => {
    const match = findDmOnAnchor(a);
    if (!match) return;

    const { mode, dmUrl } = match;
    // Translate link text back to alt: sentinel ('Image without alt text')
    // means the source had alt="" — render with alt="" for a11y. Any other
    // text (including the author's edit of the placeholder) is real alt.
    const alt = linkTextToAlt(a.textContent.trim());
    const picture = detectDynamicMediaUrl(dmUrl) === 'scene7'
      ? renderScene7Picture(dmUrl, alt)
      : renderDmOpenApiPicture(dmUrl, alt);

    // decorateMain() calls decorateButtons() BEFORE buildAutoBlocks(). At
    // that point every DM anchor (linked or unlinked) looks like a plain
    // text link — no <img> yet — so decorateButtons promotes it to a button
    // and adds `button-container` to its sole-child <p>/<div> parent. The
    // unwanted border around the rebuilt <picture> is the visible symptom;
    // for unlinked-in-<div> the leftover `button-container` on a block-cell
    // <div> can also confuse block decorators that filter on classList.
    // Strip both classes BEFORE rebuilding so the cleanup covers every
    // branch below (replaceChildren / replaceWith / parent-replaceWith).
    // Idempotent — no-op when the classes aren't present.
    a.classList.remove('button', 'primary', 'secondary');
    if (a.classList.length === 0) a.removeAttribute('class');
    const buttonContainer = a.parentElement;
    if (
      buttonContainer
      && buttonContainer.classList.contains('button-container')
      && buttonContainer.children.length === 1
    ) {
      buttonContainer.classList.remove('button-container');
      if (buttonContainer.classList.length === 0) buttonContainer.removeAttribute('class');
    }

    if (mode === 'linked') {
      // Keep the outer <a> and its navigation href. Drop the DM URL from title
      // (it's been consumed) and replace the anchor's content with the picture.
      a.removeAttribute('title');
      a.replaceChildren(picture);
      return;
    }

    // Unlinked: the whole anchor is just a carrier for the DM URL.
    // If it's the markdown-generated <p> wrapper around a standalone
    // image, unwrap so the picture becomes a top-level grid cell.
    // NEVER unwrap <div> — those are block-content cells (cards,
    // carousel, columns); unwrapping them collapses the block's row
    // structure and decorators can't find their image cells.
    if (isUnwrappableMarkdownParagraph(a)) {
      a.parentElement.replaceWith(picture);
    } else {
      a.replaceWith(picture);
    }
  });
}

// Register the DM dispatcher for createOptimizedPicture interop.
// The aem.js patch (applied per skills/excat-site-migration/SKILL.md
// Step 5b) checks for this hook and delegates DM URLs to our renderer,
// so block decorators that call createOptimizedPicture(img.src, ...) on
// Scene7 IS/Image template URLs or DM Open API URLs preserve their
// query parameters instead of having them stripped by the path-only
// optimizer in aem.js. No-op when the auto-block is not installed
// (hook unregistered → aem.js falls through to standard logic).
//
// Returning null for non-DM URLs lets the caller (createOptimizedPicture)
// fall through to its standard path-only optimization. This is the
// regression guard for non-DM images on the same page.
// eslint-disable-next-line no-underscore-dangle
window.__dmRender__ = (src, alt) => {
  const family = detectDynamicMediaUrl(src);
  if (!family) return null;
  return family === 'scene7'
    ? renderScene7Picture(src, alt)
    : renderDmOpenApiPicture(src, alt);
};

// --- END DM/Scene7 auto-block ---

/**
 * Dynamic Media aware replacement for aem.js createOptimizedPicture.
 * Scene7 / DM Open API URLs keep their query parameters; all other
 * images fall through to the standard aem.js implementation.
 * Blocks should import createOptimizedPicture from scripts.js.
 */
export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = undefined) {
  // eslint-disable-next-line no-underscore-dangle
  const dmPicture = window.__dmRender__(src, alt);
  if (dmPicture) {
    if (eager) dmPicture.querySelector('img').loading = 'eager';
    return dmPicture;
  }
  return createOptimizedPictureBase(src, alt, eager, breakpoints);
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildDynamicMediaImages(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  // brand fonts: start loading right away on every viewport (non-blocking); the
  // size-adjusted fallbacks in styles.css keep the later swap from shifting the layout
  loadFonts().catch(() => {});

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    // Adobe Target pages: wait for at.js, then yield to break up long tasks
    if (isTargetEnabled()) {
      await atjsPromise;
      await new Promise((resolve) => { window.setTimeout(resolve, 0); });
    }
    // load eagerly up to the section holding the page heading (max. 2 sections), so a
    // short first section (e.g. a notification bar) doesn't push the LCP into lazy loading
    const sections = [...main.querySelectorAll(':scope > .section')];
    const headingIndex = sections.findIndex((section) => section.querySelector('h1'));
    const eagerCount = Math.min(Math.max(headingIndex + 1, 1), 2);
    for (let i = 0; i < eagerCount; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await loadSection(sections[i], waitForFirstImage);
    }
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
