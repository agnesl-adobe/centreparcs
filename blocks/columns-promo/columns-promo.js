import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

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

  // promo CTA (a link alone in its paragraph) renders as an underlined text link with arrow
  block.querySelectorAll('.columns-promo-text-col p > a').forEach((a) => {
    const p = a.parentElement;
    if (p.textContent.trim() !== a.textContent.trim()) return;
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    a.classList.add('columns-promo-link');
    p.classList.remove('button-container', 'button-wrapper');
    p.classList.add('columns-promo-link-wrapper');
  });
}
