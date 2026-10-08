import { createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

/**
 * Keeps links of inactive village cards out of the tab order: on mobile the
 * cards sit side by side in a swipe row, so inactive (peeking) cards stay visible.
 * @param {Element} panel The tab panel
 * @param {boolean} active Whether the panel is the selected one
 */
function setPanelFocusable(panel, active) {
  panel.querySelectorAll('a[href]').forEach((a) => {
    if (active) a.removeAttribute('tabindex');
    else a.setAttribute('tabindex', '-1');
  });
}

function selectTab(block, tablist, button, tabpanel, focus = false) {
  block.querySelectorAll(':scope > .tabs-village-panels > [role=tabpanel]').forEach((panel) => {
    panel.setAttribute('aria-hidden', panel !== tabpanel);
    setPanelFocusable(panel, panel === tabpanel);
  });
  tablist.querySelectorAll('button[role=tab]').forEach((btn) => {
    btn.setAttribute('aria-selected', false);
    btn.setAttribute('tabindex', '-1');
  });
  button.setAttribute('aria-selected', true);
  button.removeAttribute('tabindex');
  if (focus) button.focus();
}

/**
 * Village selected on load when no row is marked as default: matches the source
 * site, whose village map opens on Sherwood Forest. Compared case-insensitively
 * against the village name (first line of the tab label).
 */
const DEFAULT_VILLAGE = 'Sherwood Forest';

/**
 * Index of the tab to select on load:
 * 1. a row whose tab label is (entirely or partly) bold - the authored default marker
 * 2. the row whose village name matches DEFAULT_VILLAGE
 * 3. the first row
 * @param {{ name: string, marked: boolean }[]} tabs Tab info, in row order
 * @returns {number} Index of the default tab
 */
function getDefaultIndex(tabs) {
  const marked = tabs.findIndex(({ marked: m }) => m);
  if (marked >= 0) return marked;
  const named = tabs.findIndex(({ name }) => name.toLowerCase() === DEFAULT_VILLAGE.toLowerCase());
  return named >= 0 ? named : 0;
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
 * The section intro's standalone link ("Explore all villages"): a default-content
 * paragraph that holds nothing but one link.
 * @param {Element} block The block element
 * @returns {Element|null} The paragraph, if any
 */
function findIntroLinkParagraph(block) {
  const section = block.closest('.section');
  if (!section) return null;
  return [...section.querySelectorAll('.default-content-wrapper > p')].find((p) => {
    const link = p.querySelector(':scope > a:only-child');
    return link && p.textContent.trim() === link.textContent.trim();
  }) || null;
}

/**
 * Mobile: the source repeats the intro link as a second button in every village
 * card. Clone it into each card (shown on mobile only, see CSS) and flag the intro
 * paragraph so CSS can hide it on mobile.
 * @param {Element} block The block element
 * @param {Element[]} cards The card content cells
 */
function addExploreLinks(block, cards) {
  const intro = findIntroLinkParagraph(block);
  if (!intro) return;
  intro.classList.add('tabs-village-explore');
  const link = intro.querySelector('a');
  cards.forEach((card) => {
    const p = document.createElement('p');
    p.className = 'tabs-village-card-cta tabs-village-card-explore';
    const clone = link.cloneNode(true);
    clone.removeAttribute('id');
    [...clone.attributes].forEach(({ name }) => {
      if (name.startsWith('data-aue-') || name.startsWith('data-richtext-')) clone.removeAttribute(name);
    });
    p.append(clone);
    card.append(p);
  });
}

/**
 * Mobile swipe row: the village cards scroll horizontally (scroll-snap, centred,
 * neighbours peeking). Keeps the selected tab (map pin) in sync with the centred
 * card and scrolls the row when a pin is chosen. Inactive on desktop, where the
 * panels container does not scroll.
 * @param {Element} panels The panels container
 * @param {{ button: Element, tabpanel: Element }[]} entries Tabs and their panels
 * @param {Function} select Selects an entry: (entry) => void
 * @returns {Function} Centres a panel in the row: (tabpanel, smooth) => void
 */
function initSwipeRow(panels, entries, select) {
  const isRow = () => panels.scrollWidth > panels.clientWidth + 1;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const center = (tabpanel, smooth = true) => {
    if (!isRow()) return;
    panels.scrollTo({
      left: tabpanel.offsetLeft - (panels.clientWidth - tabpanel.offsetWidth) / 2,
      behavior: smooth && !reduceMotion.matches ? 'smooth' : 'instant',
    });
  };

  const active = () => entries.find(({ tabpanel }) => tabpanel.getAttribute('aria-hidden') === 'false');

  // once the swipe settles, select the card closest to the centre of the row
  let timer;
  const settle = () => {
    if (!isRow()) return;
    const mid = panels.scrollLeft + panels.clientWidth / 2;
    const dist = ({ tabpanel }) => Math.abs(tabpanel.offsetLeft + tabpanel.offsetWidth / 2 - mid);
    const closest = entries.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    if (closest !== active()) select(closest);
  };
  panels.addEventListener('scroll', () => {
    clearTimeout(timer);
    timer = setTimeout(settle, 100);
  }, { passive: true });

  // tapping a peeking card brings it to the centre instead of following its links
  panels.addEventListener('click', (e) => {
    if (!isRow()) return;
    const entry = entries.find(({ tabpanel }) => tabpanel.contains(e.target));
    if (!entry || entry === active()) return;
    e.preventDefault();
    select(entry);
    center(entry.tabpanel);
  });

  // centre the selected card once laid out, and again whenever the row resizes
  new ResizeObserver(() => {
    const entry = active();
    if (entry) center(entry.tabpanel, false);
  }).observe(panels);

  return center;
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

  // tab to open on load (see getDefaultIndex)
  const defaultIndex = getDefaultIndex(rows.map((row) => {
    const label = row.firstElementChild;
    const first = label.querySelector('p, h1, h2, h3, h4, h5, h6') || label;
    return {
      name: first.textContent.trim(),
      marked: !!label.querySelector('strong, b'),
    };
  }));

  const entries = [];
  rows.forEach((row, i) => {
    const id = `tabs-village-${tabBlockCnt}-panel-${i + 1}`;
    const label = row.firstElementChild;

    // tab panel = the row itself (keeps UE instrumentation), minus the label cell
    const tabpanel = row;
    tabpanel.className = 'tabs-village-panel';
    tabpanel.id = id;
    tabpanel.setAttribute('aria-hidden', i !== defaultIndex);
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
    button.setAttribute('aria-selected', i === defaultIndex);
    if (i !== defaultIndex) button.setAttribute('tabindex', '-1');

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
  });

  addExploreLinks(block, [...panels.querySelectorAll('.tabs-village-panel-content')]);
  entries.forEach(({ tabpanel }, i) => setPanelFocusable(tabpanel, i === defaultIndex));

  const centerPanel = initSwipeRow(panels, entries, ({ button, tabpanel }) => {
    selectTab(block, tablist, button, tabpanel);
  });

  entries.forEach(({ button, tabpanel }) => {
    button.addEventListener('click', () => {
      selectTab(block, tablist, button, tabpanel);
      centerPanel(tabpanel);
    });
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
    centerPanel(entries[next].tabpanel);
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
