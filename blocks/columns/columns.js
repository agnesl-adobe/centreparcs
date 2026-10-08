import { loadCSS } from '../../scripts/aem.js';

// style options (block classes) with their own decoration, e.g. "Columns (offer)"
const STYLES = ['offer', 'intro', 'promo'];

export default async function decorate(block) {
  const style = STYLES.find((s) => block.classList.contains(s));
  if (style) {
    const [{ default: decorateStyle }] = await Promise.all([
      import(`./columns-${style}.js`),
      loadCSS(`${window.hlx.codeBasePath}/blocks/columns/columns-${style}.css`),
    ]);
    await decorateStyle(block);
    return;
  }

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
