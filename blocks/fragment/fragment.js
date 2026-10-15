/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
  getFragmentPath,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    // eslint-disable-next-line no-param-reassign
    path = path.replace(/(\.plain)?\.html/, '');
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const href = link ? link.getAttribute('href') : block.textContent.trim();
  // full aem.page / aem.live URLs (e.g. from the DA Fragment Picker) resolve to this site
  const path = getFragmentPath(href) || href;
  const fragment = await loadFragment(path);
  if (!fragment) return;

  // a fragment in the first two sections of the page is likely to hold the LCP image:
  // load its first image eagerly instead of waiting for lazy loading to kick in
  const section = block.closest('main > .section');
  const sections = section ? [...section.parentElement.querySelectorAll(':scope > .section')] : [];
  const firstImg = fragment.querySelector('img');
  if (firstImg && sections.indexOf(section) > -1 && sections.indexOf(section) < 2) {
    firstImg.loading = 'eager';
    firstImg.fetchPriority = 'high';
  }

  block.replaceChildren(...fragment.childNodes);
}
