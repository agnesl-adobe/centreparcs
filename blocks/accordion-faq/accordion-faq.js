import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * FAQ accordion: one row per question. Cell 1 = question, cell 2 = answer.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const body = row.children[1] || document.createElement('div');

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    if (label) {
      moveInstrumentation(label, summary);
      summary.append(...label.childNodes);
    }

    body.className = 'accordion-faq-item-body';

    const details = document.createElement('details');
    moveInstrumentation(row, details);
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
