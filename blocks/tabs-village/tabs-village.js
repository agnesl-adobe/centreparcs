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
      if (idx > 0) cell.classList.add('tabs-village-panel-content');
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
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.replaceChildren(panels, tablist);
}
