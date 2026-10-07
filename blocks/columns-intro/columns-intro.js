/**
 * Intro layout: heading column on the left, supporting text + inline links on the right.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-intro-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col, idx) => {
      col.classList.add(idx === 0 ? 'columns-intro-heading' : 'columns-intro-text');

      // a paragraph made only of links becomes an inline link list
      col.querySelectorAll('p').forEach((p) => {
        const links = [...p.querySelectorAll('a')];
        if (links.length < 2) return;
        const textOnly = [...p.childNodes].every((n) => n.nodeType !== Node.TEXT_NODE
          || !n.textContent.trim() || /^[|•·,\s]+$/.test(n.textContent));
        if (!textOnly) return;
        p.classList.add('columns-intro-links');
        links.forEach((a) => {
          a.classList.remove('button', 'primary', 'secondary');
        });
        p.classList.remove('button-container');
      });
    });
  });
}
