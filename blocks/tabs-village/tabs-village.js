import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

function selectTab(block, tablist, button, tabpanel, focus = false) {
  block.querySelectorAll(':scope > .tabs-village-panels > [role=tabpanel]').forEach((panel) => {
    panel.setAttribute('aria-hidden', true);
  });
  tablist.querySelectorAll('button[role=tab]').forEach((btn) => {
    btn.setAttribute('aria-selected', false);
    btn.setAttribute('tabindex', '-1');
  });
  tabpanel.setAttribute('aria-hidden', false);
  button.setAttribute('aria-selected', true);
  button.removeAttribute('tabindex');
  if (focus) button.focus();
}

const BLOCK_TAGS = ['PICTURE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL'];

/**
 * Village card: image, heading, location line, description and CTA link.
 * aem.js wrapTextNodes() wraps a cell that starts with a <picture> (followed by
 * more content) in a single <p>; unwrap it so the card keeps a flat structure.
 * @param {Element} cell The panel content cell
 */
function decorateCard(cell) {
  cell.classList.add('tabs-village-panel-content');
  const only = cell.children.length === 1 ? cell.firstElementChild : null;
  if (only && only.tagName === 'P' && [...only.children].some((el) => BLOCK_TAGS.includes(el.tagName))) {
    moveInstrumentation(only, cell);
    only.replaceWith(...only.childNodes);
  }

  const heading = cell.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)');
  const paragraphs = [...cell.querySelectorAll(':scope > p')];
  paragraphs.forEach((p) => {
    const link = p.querySelector(':scope > a:only-child');
    if (link && p.textContent.trim() === link.textContent.trim()) p.classList.add('tabs-village-card-cta');
  });
  // first plain paragraph right after the heading is the location line
  const next = heading?.nextElementSibling;
  if (next && next.tagName === 'P' && !next.classList.contains('tabs-village-card-cta')
    && paragraphs.filter((p) => !p.classList.contains('tabs-village-card-cta')).length > 1) {
    next.classList.add('tabs-village-card-location');
  }
}

/**
 * Village selector: one tab ("pin") per village, each revealing a village card.
 * Row = [label cell (village name + location), panel cell (image, heading, text, CTA)].
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  tabBlockCnt += 1;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-village-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tabs-village-list-${tabBlockCnt}`;

  const panels = document.createElement('div');
  panels.className = 'tabs-village-panels';

  // every row with at least one cell becomes a tab (empty labels fall back to "Village n")
  const rows = [...block.children].filter((row) => row.firstElementChild);

  const entries = [];
  rows.forEach((row, i) => {
    const id = `tabs-village-${tabBlockCnt}-panel-${i + 1}`;
    const label = row.firstElementChild;

    // tab panel = the row itself (keeps UE instrumentation), minus the label cell
    const tabpanel = row;
    tabpanel.className = 'tabs-village-panel';
    tabpanel.id = id;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');
    [...tabpanel.children].forEach((cell, idx) => {
      if (idx > 0) decorateCard(cell);
    });

    // tab button: first text line is the village name, the rest is its location
    const button = document.createElement('button');
    button.className = 'tabs-village-tab';
    button.id = `tab-${id}`;
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-selected', !i);
    if (i) button.setAttribute('tabindex', '-1');

    const pin = document.createElement('span');
    pin.className = 'tabs-village-pin';
    pin.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'tabs-village-tab-text';
    const lines = [...label.querySelectorAll('p, h1, h2, h3, h4, h5, h6')]
      .map((el) => el.textContent.trim()).filter(Boolean);
    const parts = lines.length > 1 ? lines : label.textContent.split(/\s+\/\s+|\n/).map((s) => s.trim()).filter(Boolean);
    const name = document.createElement('span');
    name.className = 'tabs-village-tab-name';
    name.textContent = parts[0] || label.textContent.trim() || `Village ${i + 1}`;
    text.append(name);
    if (parts.length > 1) {
      const location = document.createElement('span');
      location.className = 'tabs-village-tab-location';
      location.textContent = parts.slice(1).join(', ');
      text.append(location);
    }
    button.append(pin, text);

    // remove the label cell, which also removes it from the UE tree
    label.remove();

    tablist.append(button);
    panels.append(tabpanel);
    entries.push({ button, tabpanel });

    button.addEventListener('click', () => selectTab(block, tablist, button, tabpanel));
  });

  // roving keyboard navigation between tabs
  tablist.addEventListener('keydown', (e) => {
    const idx = entries.findIndex(({ button }) => button === document.activeElement);
    if (idx < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % entries.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + entries.length) % entries.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = entries.length - 1;
    if (next < 0) return;
    e.preventDefault();
    selectTab(block, tablist, entries[next].button, entries[next].tabpanel, true);
  });

  panels.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    // the card image is at most ~550px wide: keep the 750px rendition only
    // (wider Dynamic Media renditions get letterboxed when the master is smaller)
    optimizedPic.querySelectorAll('source[media]').forEach((source) => source.remove());
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.replaceChildren(panels, tablist);
}
