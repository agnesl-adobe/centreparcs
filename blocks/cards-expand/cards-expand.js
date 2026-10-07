import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Expandable image panels: portrait image with overlay title, text and CTA.
 * The hovered / focused / tapped panel expands; the first panel is expanded by default.
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
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-expand-card-image';
      else div.className = 'cards-expand-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  const cards = [...ul.children];
  const expand = (card) => {
    cards.forEach((c) => c.classList.toggle('is-expanded', c === card));
  };
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => expand(card));
    card.addEventListener('focusin', () => expand(card));
    card.addEventListener('click', () => expand(card));
  });
  if (cards.length) expand(cards[0]);

  block.replaceChildren(ul);
}
