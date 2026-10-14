/**
 * Hero: background image with a content card (title, text, CTA).
 * Rows (one per model field group): image | title | text | CTA. Fields may be empty or
 * missing, so rows are classified by content rather than position.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-content';

  [...block.children].forEach((row) => {
    if (row.querySelector('picture')) {
      row.className = 'hero-media';
      return;
    }
    if (!row.textContent.trim()) row.classList.add('hero-empty');
    content.append(row);
  });

  // a CTA authored without a button style renders as the Center Parcs arrow link
  content.querySelectorAll('a[href]:not(.button)').forEach((a) => {
    const p = a.closest('p');
    if (p && p.textContent.trim() === a.textContent.trim()) a.classList.add('hero-link');
  });

  block.append(content);
  if (!block.querySelector('.hero-media')) block.classList.add('hero-no-image');
  if (!content.querySelector(':scope > :not(.hero-empty)')) block.classList.add('hero-no-content');
}
