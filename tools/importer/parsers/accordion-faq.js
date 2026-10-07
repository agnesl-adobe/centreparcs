/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://www.centerparcs.co.uk/ (.tabs-container) - 2 instances:
 *   FAQ (9 items) and Terms & Conditions (1 item).
 * UE model (blocks/accordion-faq/_accordion-faq.json) item "accordion-faq-item": summary | text
 * Output: 2 columns, one row per item:
 *   [ <!-- field:summary --> question text , <!-- field:text --> answer rich text ]
 * Iteration is keyed on the .tabs-container__accordion-control <div> wrappers (not on the
 * href="#" anchors) and each is paired with its following .tabs-container__content.
 * Fallback: pair the .tabs-container__tab-control list items with contents by index.
 * Section headings ("Frequently asked questions", "Terms & Conditions") are outside the
 * matched element and stay default content.
 */
function clean(t) {
  return (t || '').replace(/[\s ]+/g, ' ').trim();
}

function isBlank(el) {
  return !el.querySelector('img, a[href]:not([href="#"]), table') && clean(el.textContent) === '';
}

const CONTENT_SEL = 'p, ul, ol, h2, h3, h4, h5, h6, table, blockquote';

function answerNodes(content, document) {
  if (!content) return [];
  const containers = Array.from(content.querySelectorAll('.cmp-text'));
  const roots = containers.length ? containers : [content];
  const nodes = [];
  roots.forEach((root) => {
    Array.from(root.querySelectorAll(CONTENT_SEL))
      // top-level content only (skip p inside li, li content, nested lists, etc.)
      .filter((el) => {
        const ancestor = el.parentElement.closest(CONTENT_SEL);
        return !ancestor || !root.contains(ancestor);
      })
      .filter((el) => !isBlank(el))
      .forEach((el) => nodes.push(el));
  });
  if (!nodes.length && clean(content.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(content.textContent);
    nodes.push(p);
  }
  return nodes;
}

export default function parse(element, { document }) {
  const pairs = [];
  const controls = Array.from(element.querySelectorAll('.tabs-container__accordion-control'));
  controls.forEach((ctrl) => {
    let content = ctrl.nextElementSibling;
    while (content && !content.matches('.tabs-container__content') && !content.matches('.tabs-container__accordion-control')) {
      content = content.nextElementSibling;
    }
    if (content && !content.matches('.tabs-container__content')) content = null;
    const question = clean((ctrl.querySelector('.tabs-container__tab-title') || ctrl).textContent);
    pairs.push({ question, content });
  });

  if (!pairs.length) {
    const tabs = Array.from(element.querySelectorAll('.tabs-container__tab-control'));
    const contents = Array.from(element.querySelectorAll('.tabs-container__content'));
    tabs.forEach((tab, i) => pairs.push({ question: clean(tab.textContent), content: contents[i] || null }));
  }

  const cells = [];
  pairs.forEach(({ question, content }) => {
    const answers = answerNodes(content, document);
    if (!question && !answers.length) return;

    const summaryCell = document.createDocumentFragment();
    if (question) {
      summaryCell.appendChild(document.createComment(' field:summary '));
      summaryCell.appendChild(document.createTextNode(question));
    }

    const textCell = document.createDocumentFragment();
    if (answers.length) {
      textCell.appendChild(document.createComment(' field:text '));
      answers.forEach((n) => textCell.appendChild(n));
    }

    cells.push([summaryCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
