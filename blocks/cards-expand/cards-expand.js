import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Expandable image panels: portrait image with a white overlay card (title, text, CTA).
 * Desktop: the hovered / focused panel expands and reveals its card (pure CSS).
 * Mobile: panels stack as sticky cards with the image above the text.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-expand-card';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-expand-card-image';
      } else {
        div.className = 'cards-expand-card-body';
        // a paragraph holding only a link is the panel CTA
        div.querySelectorAll(':scope > p').forEach((p) => {
          const a = p.querySelector('a');
          if (a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim()) {
            p.className = 'cards-expand-card-cta';
            a.classList.remove('button', 'primary', 'secondary', 'accent');
          }
        });
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.replaceChildren(ul);
}
