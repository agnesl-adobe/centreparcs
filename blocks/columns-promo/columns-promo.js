import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Promo panel: image | heading | text + link, side by side on a rounded panel.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-promo-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-promo-panel');
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic && col.children.length === 1 && !col.textContent.trim()) {
        col.classList.add('columns-promo-img-col');
        const img = pic.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          pic.replaceWith(optimized);
        }
      } else if (col.querySelector('h1, h2, h3, h4, h5, h6') && !col.querySelector('a')) {
        col.classList.add('columns-promo-heading-col');
      } else {
        col.classList.add('columns-promo-text-col');
      }
    });
  });

  // promo CTA renders as a text link
  block.querySelectorAll('.columns-promo-text-col a.button').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary');
    a.classList.add('columns-promo-link');
    a.closest('.button-container')?.classList.remove('button-container');
  });
}
