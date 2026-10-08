/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Center Parcs UK site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (www.centerparcs.co.uk homepage).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Text that is only whitespace / &nbsp;
function isBlank(el) {
  if (el.querySelector('img, picture, video, iframe, a[href], table')) return false;
  return el.textContent.replace(/[\s ]+/g, '') === '';
}

// Tracking / beacon hosts and paths (runtime-injected pixels, e.g. segment.prod.bidr.io, bat.bing.com).
const TRACKING_PIXEL_PATTERN = /(bidr\.io|bat\.bing\.com|bing\.com\/action|doubleclick\.net|googleadservices\.com|google\.[a-z.]+\/pagead|googlesyndication\.com|google-analytics\.com|googletagmanager\.com|analytics\.google\.com|facebook\.com\/tr|facebook\.net|connect\.facebook|linkedin\.com\/px|px\.ads\.linkedin|ads\.linkedin|t\.co\/i\/adsct|analytics\.twitter\.com|ads-twitter\.com|analytics\.tiktok\.com|pinterest\.com\/v3|ct\.pinterest|adsrvr\.org|criteo\.(com|net)|taboola\.com|outbrain\.com|quantserve\.com|scorecardresearch\.com|demdex\.net|everesttech\.net|omtrdc\.net|2o7\.net|adnxs\.com|rlcdn\.com|clarity\.ms|hotjar\.com|snapchat\.com|sc-static\.net|yahoo\.com\/(p|sync)|\/pixel(\.gif|\.png)?([/?]|$)|\/beacon([/?.]|$))/i;

// 1x1 / hidden beacon images (attribute-based so real content images are untouched).
function isTrackingPixel(img) {
  const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
  if (TRACKING_PIXEL_PATTERN.test(src)) return true;
  const w = (img.getAttribute('width') || '').trim();
  const h = (img.getAttribute('height') || '').trim();
  const isTiny = /^[01](px)?$/.test(w) && /^[01](px)?$/.test(h);
  const style = (img.getAttribute('style') || '').replace(/\s+/g, '').toLowerCase();
  const isHidden = style.includes('display:none') || style.includes('visibility:hidden');
  const styleTiny = /(^|;)width:[01]px/.test(style) && /(^|;)height:[01]px/.test(style);
  return isTiny || styleTiny || (isHidden && /^https?:/i.test(src) && !/scene7\.com|centerparcs\.co\.uk/i.test(src));
}

function removeTrackingPixels(element) {
  element.querySelectorAll('img').forEach((img) => {
    if (!isTrackingPixel(img)) return;
    const parent = img.parentElement;
    img.remove();
    // Drop a now-empty inline wrapper (e.g. <a>/<span>/<p>/<noscript> around the pixel).
    if (parent && parent !== element && /^(A|SPAN|P|NOSCRIPT|PICTURE)$/.test(parent.tagName)
      && !parent.children.length && parent.textContent.trim() === '') {
      parent.remove();
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Tracking pixels (bidr.io, bat.bing.com, doubleclick, facebook.com/tr, etc.) and 1x1 beacons.
    // Injected at runtime, so not present in cleaned.html; matched by host / size / visibility.
    removeTrackingPixels(element);

    // Overlays / widgets that can interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      // OneTrust cookie consent banner + preference centre: <div id="onetrust-consent-sdk">
      '#onetrust-consent-sdk',
      // CXone chat widget: <div id="cxone-guide-container" class="svelte-g3ommg">
      '#cxone-guide-container',
      // Chat widget storage iframe: <iframe src="https://web-modules-de-uk1.niceincontact.com/...">
      'iframe[src*="niceincontact.com"]',
      // Activity itinerary modal iframe (inside header): <iframe id="itineraryIframe">
      '#itineraryIframe',
      // Booking search widget inside the hero (live app): <div class="searchbar parbase">
      '.cmp-reservation-hero .searchbar',
      // Scene7 video viewer chrome inside the hero (sprites, share panel, controls, play/pause)
      '.cmp-reservation-hero .s7socialshare',
      '.cmp-reservation-hero .s7controlbar',
      '.cmp-reservation-hero #discover-button-container',
      // Loading skeleton placeholders: <div class="village-location-skeleton">
      '.village-location-skeleton',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome and tracking (non-authorable).
    WebImporter.DOMUtils.remove(element, [
      // Global header wrapper: <div class="header aem-GridColumn ..."> containing <header class="header">
      '.header.aem-GridColumn',
      'header.header',
      // Basket flyout (Vue template) that follows the header: <div class="header__basket">
      '.header__basket',
      '#v-basket-bundle',
      '#v-basket-expiry',
      // Skip-link anchor: <a id="maincontent">
      'a#maincontent',
      // Global footer experience fragment: <div class="experiencefragment uxp-component cmp-container--footer ...">
      '.experiencefragment.cmp-container--footer',
      // Hidden JSON config blob and login template
      '#important-data',
      'template',
      // DoubleClick Floodlight tracking iframes and Google ActiveView elements
      'iframe[src*="doubleclick.net"]',
      '.GoogleActiveViewElement',
      // Scene7 viewer placeholder spans: <span id="s7classic_0">
      'span[id^="s7classic_"]',
      // OneTrust leftovers (if re-injected)
      '#onetrust-consent-sdk',
      '#cxone-guide-container',
      // Safe generic removals
      'iframe',
      'link',
      'noscript',
      'script',
      'style',
    ]);

    // Safety net: pixels injected after beforeTransform ran.
    removeTrackingPixels(element);

    // Empty text-core components: <div class="text-core text"><div class="cmp-text"><p>&nbsp;</p></div></div>
    element.querySelectorAll('.text-core').forEach((tc) => {
      if (isBlank(tc)) tc.remove();
    });

    // Blank paragraphs / headings (e.g. <p>&nbsp;</p>, <h3>&nbsp;</h3>) inside remaining text components
    element.querySelectorAll('.cmp-text > p, .cmp-text > h1, .cmp-text > h2, .cmp-text > h3, .cmp-text > h4, .cmp-text > h5, .cmp-text > h6').forEach((el) => {
      if (isBlank(el)) el.remove();
    });

    // Tracking / framework attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (n.startsWith('data-cmp-') || n.startsWith('on') || n.startsWith('v-') || n.startsWith(':') || n.startsWith('@')) {
          el.removeAttribute(n);
        }
      });
    });
  }
}
