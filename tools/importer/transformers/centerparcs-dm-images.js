/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Center Parcs UK Dynamic Media / Scene7 images.
 * Source images are served from https://centerparcs.scene7.com/is/image/centerparcs/...
 * Rewrites DM <img> tags to anchors (afterTransform only, so block parsers
 * still see <img> in beforeTransform/parse). The client-side auto-block in
 * scripts/scripts.js rebuilds them as responsive <picture> elements.
 */

// ---- Begin canonical helpers (copied from dm-scene7-helpers.js) ----
function detectDynamicMediaUrl(urlStr) {
  if (typeof urlStr !== 'string') return false;
  // Reject relative URLs. The Scene7 rule is path-only (`/is/image/`) and
  // collides with same-named local paths on customer sites — without this
  // guard, a relative `/is/image/foo` would be classified as scene7 and
  // rewritten by the transformer/auto-block, breaking local rendering.
  // Absolute (`https://…`) and protocol-relative (`//host/…`) inputs are
  // accepted; the synthetic base below only resolves the protocol-relative
  // case to a parseable URL.
  if (!/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
  let u;
  try {
    u = new URL(urlStr, 'https://x/');
  } catch {
    return false;
  }
  if (u.pathname.startsWith('/is/image/')) {
    return 'scene7';
  }
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
      && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

const LINKED_DM_INLINE_WRAPPER_TAGS = new Set(['PICTURE']);
// Element children allowed alongside the DM img inside an inline wrapper.
// Currently only <source> — the standard responsive-picture sibling that
// `<picture>` accepts. Anything else means the wrapper carries unrelated
// content and we should not treat it as transparent.
const LINKED_DM_WRAPPER_SIBLING_TAGS = new Set(['SOURCE']);

function findLinkedDmCarrier(img) {
  if (!img || !img.parentElement) return null;

  // Walk up through allow-listed inline wrappers, tracking the topmost
  // wrapped node. Each wrapper must contain `node` and may contain only
  // allow-listed siblings (e.g. `<source>` for `<picture>`). The anchor
  // we end up at must then have that wrapper (or the bare img) as its
  // sole element child with no other meaningful text.
  let node = img;
  let parent = img.parentElement;
  while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
    let foundNode = false;
    for (const child of parent.children) {
      if (child === node) {
        foundNode = true;
      } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
        return null;
      }
    }
    if (!foundNode) return null;
    node = parent;
    parent = parent.parentElement;
  }

  if (!parent || parent.tagName !== 'A') return null;
  if (parent.children.length !== 1 || parent.children[0] !== node) return null;
  if (parent.textContent.trim() !== '') return null;

  return parent;
}

const EMPTY_ALT_SENTINEL = 'Image without alt text';

function altToLinkText(alt) {
  return alt || EMPTY_ALT_SENTINEL;
}
// ---- End canonical helpers ----

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const doc = element.ownerDocument;

  element.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!detectDynamicMediaUrl(src)) return;

    // Preserve alt verbatim; empty alt becomes the sentinel link text.
    const alt = img.getAttribute('alt') || '';

    // Linked image (incl. parser-wrapped <a><picture><img></picture></a>):
    // keep navigation href, stash DM URL in title.
    const linkedAnchor = findLinkedDmCarrier(img);
    if (linkedAnchor) {
      linkedAnchor.setAttribute('title', src);
      linkedAnchor.textContent = altToLinkText(alt);
      return;
    }

    // Mixed-content anchor: no clean single-anchor markdown representation; skip.
    const parent = img.parentElement;
    if (parent && parent.tagName === 'A') {
      // eslint-disable-next-line no-console
      console.warn('DM image inside mixed-content anchor, skipped:', src);
      return;
    }

    // Unlinked image: anchor whose href is the DM URL.
    const a = doc.createElement('a');
    a.href = src;
    a.textContent = altToLinkText(alt);
    img.replaceWith(a);
  });
}
