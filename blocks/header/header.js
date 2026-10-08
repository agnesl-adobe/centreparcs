// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

let panelCounter = 0;

/**
 * Fetches the nav fragment. Metadata-independent dual fetch: pages served from the
 * local content tree (/content/..., aem up) try /content/nav.plain.html first; published
 * pages (aem.page / aem.live) try /nav.plain.html first. Each falls back to the other.
 * @returns {Promise<{doc: Element, baseUrl: string}|null>}
 */
async function fetchNavFragment() {
  const local = window.location.pathname.startsWith('/content/');
  let resp = local ? await fetch('/content/nav.plain.html') : await fetch('/nav.plain.html');
  if (!resp.ok) resp = local ? await fetch('/nav.plain.html') : await fetch('/content/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = document.createElement('div');
  doc.innerHTML = html;
  // resolve relative image paths against the fragment location, not the page
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|data:|\/)/.test(src)) {
      img.src = new URL(src, resp.url).pathname;
    }
    img.loading = 'lazy';
  });
  return { doc, baseUrl: resp.url };
}

/**
 * Creates an element with optional class and children.
 */
function el(tag, className, ...children) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  children.filter(Boolean).forEach((c) => e.append(c));
  return e;
}

/**
 * Wraps loose text nodes of an element in a visually hidden span (keeps an
 * accessible name next to an image without showing the text).
 */
function hideTextNodes(container) {
  [...container.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const span = el('span', 'nav-visually-hidden');
      span.textContent = node.textContent.trim();
      node.replaceWith(span);
    }
  });
}

/**
 * Builds the brand (logo) area from a nav section.
 */
function buildBrand(section) {
  const brand = el('div', 'nav-brand');
  const link = section.querySelector('a');
  if (link) {
    link.classList.add('nav-brand-link');
    hideTextNodes(link);
    brand.append(link);
  } else {
    brand.append(...section.childNodes);
  }
  return brand;
}

/**
 * Builds the tools (CTA) area from a nav section.
 */
function buildTools(section) {
  const tools = el('div', 'nav-tools');
  section.querySelectorAll('a').forEach((a) => {
    a.classList.add('nav-tools-cta');
    tools.append(a);
  });
  return tools;
}

/**
 * Builds a single megamenu column from an authored list item.
 * A column containing an image becomes a promotional card.
 */
function buildMegamenuColumn(li) {
  const img = li.querySelector('img');
  if (img) {
    const promo = el('div', 'nav-megamenu-promo');
    const media = el('div', 'nav-megamenu-promo-media', img);
    const content = el('div', 'nav-megamenu-promo-content');
    li.querySelectorAll(':scope > p').forEach((p) => {
      if (p.querySelector('img') || !p.textContent.trim()) return;
      const a = p.querySelector('a');
      if (a) {
        a.classList.add('nav-megamenu-promo-cta');
        content.append(el('p', 'nav-megamenu-promo-action', a));
      } else {
        p.className = 'nav-megamenu-promo-title';
        content.append(p);
      }
    });
    promo.append(media, content);
    return promo;
  }
  const col = el('div', 'nav-megamenu-column');
  [...li.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) child.classList.add('nav-megamenu-heading');
    if (child.tagName === 'UL') child.classList.add('nav-megamenu-links');
    col.append(child);
  });
  return col;
}

/**
 * Builds the megamenu panel for a top-level nav item.
 */
function buildMegamenu(subList, id) {
  const panel = el('div', 'nav-megamenu');
  panel.id = id;
  const inner = el('div', 'nav-megamenu-inner');
  [...subList.children].forEach((li) => inner.append(buildMegamenuColumn(li)));
  panel.append(inner);
  return panel;
}

/**
 * Closes every open megamenu in the nav (optionally except one item).
 */
function closeAllDrops(nav, except = null) {
  nav.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((item) => {
    if (item === except) return;
    item.setAttribute('aria-expanded', 'false');
    const trigger = item.querySelector(':scope > .nav-trigger, :scope > .nav-item-row > .nav-sub-toggle');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Toggles a nav item (megamenu on desktop, accordion on mobile).
 */
function toggleItem(nav, item, trigger, force = null) {
  const expanded = item.getAttribute('aria-expanded') === 'true';
  const next = force !== null ? force : !expanded;
  closeAllDrops(nav, item);
  item.setAttribute('aria-expanded', next ? 'true' : 'false');
  trigger.setAttribute('aria-expanded', next ? 'true' : 'false');
}

/**
 * Builds the primary navigation list.
 * Authoring contract: each top-level <li> starts with a label <p>.
 *  - plain-text label + nested <ul> -> megamenu trigger (click to toggle;
 *    full-width panel on desktop, in-place accordion on mobile)
 *  - link label + nested <ul> -> navigation link with a separate mobile submenu toggle
 *  - link label without nested <ul> -> plain navigation link
 */
function buildSections(section, nav) {
  const list = section.querySelector('ul');
  const navList = el('ul', 'nav-list');
  if (!list) return navList;
  [...list.children].forEach((li) => {
    const label = li.querySelector(':scope > p') || li.firstChild;
    const subList = li.querySelector(':scope > ul');
    const labelLink = label && label.querySelector ? label.querySelector('a') : null;
    const item = el('li', 'nav-item');
    panelCounter += 1;
    const panelId = `nav-panel-${panelCounter}`;

    if (subList && !labelLink) {
      // megamenu trigger
      item.classList.add('nav-drop');
      item.setAttribute('aria-expanded', 'false');
      const trigger = el('a', 'nav-trigger');
      trigger.href = '#';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', panelId);
      trigger.textContent = label.textContent.trim();
      trigger.append(el('span', 'nav-chevron'));
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleItem(nav, item, trigger);
      });
      trigger.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          toggleItem(nav, item, trigger);
        }
      });
      item.append(trigger, buildMegamenu(subList, panelId));
    } else if (labelLink) {
      labelLink.classList.add('nav-link');
      if (subList) {
        item.classList.add('nav-drop', 'nav-drop-mobile');
        item.setAttribute('aria-expanded', 'false');
        const toggle = el('button', 'nav-sub-toggle');
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', panelId);
        toggle.setAttribute('aria-label', labelLink.textContent.trim());
        toggle.append(el('span', 'nav-chevron'));
        toggle.addEventListener('click', () => toggleItem(nav, item, toggle));
        const row = el('div', 'nav-item-row', labelLink, toggle);
        item.append(row, buildMegamenu(subList, panelId));
      } else {
        labelLink.append(el('span', 'nav-chevron'));
        item.append(labelLink);
      }
    } else if (label) {
      item.append(label);
    }
    navList.append(item);
  });
  return navList;
}

/**
 * Builds the locale/site switcher (current site button + choose-site dialog).
 * Content (labels, flags, site URLs, button labels) comes from the nav section.
 */
function buildLocale(section) {
  const wrap = el('div', 'nav-locale');
  const paragraphs = [...section.querySelectorAll(':scope > p')];
  const current = paragraphs.find((p) => p.querySelector('img')) || paragraphs[0];
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  const options = [...section.querySelectorAll(':scope > ul > li')];
  const textPs = paragraphs.filter((p) => p !== current);
  const [infoP, closeP, continueP] = textPs;
  const currentLabel = current ? current.textContent.trim() : '';

  const button = el('button', 'nav-locale-button');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  if (current) {
    const flag = current.querySelector('img');
    if (flag) button.append(el('span', 'nav-locale-flag', flag));
    button.append(el('span', 'nav-locale-text', document.createTextNode(currentLabel)));
  }
  wrap.append(button);

  if (!options.length) return wrap;

  const modal = el('div', 'nav-locale-modal');
  modal.hidden = true;
  const backdrop = el('div', 'nav-locale-backdrop');
  const dialog = el('div', 'nav-locale-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  const titleId = 'nav-locale-title';
  dialog.setAttribute('aria-labelledby', titleId);

  const dialogHeader = el('div', 'nav-locale-dialog-header');
  if (heading) {
    heading.id = titleId;
    heading.className = 'nav-locale-title';
    dialogHeader.append(heading);
  }
  const dismiss = el('button', 'nav-locale-dismiss');
  dismiss.type = 'button';
  dismiss.setAttribute('aria-label', closeP ? closeP.textContent.trim() : 'Close');
  dialogHeader.append(dismiss);

  const body = el('div', 'nav-locale-dialog-body');
  if (infoP) {
    infoP.className = 'nav-locale-info';
    body.append(infoP);
  }

  const fieldset = el('div', 'nav-locale-options');
  fieldset.setAttribute('role', 'radiogroup');
  if (heading) fieldset.setAttribute('aria-labelledby', titleId);
  options.forEach((li, i) => {
    const a = li.querySelector('a');
    const text = li.textContent.trim();
    const id = `nav-locale-option-${i}`;
    const option = el('label', 'nav-locale-option');
    option.setAttribute('for', id);
    const flag = li.querySelector('img');
    if (flag) {
      flag.alt = '';
      option.append(el('span', 'nav-locale-flag', flag));
    }
    option.append(el('span', 'nav-locale-option-text', document.createTextNode(text)));
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'nav-locale-site';
    input.id = id;
    input.value = a ? a.href : '';
    input.checked = text === currentLabel;
    option.append(input);
    fieldset.append(option);
  });
  body.append(fieldset);

  const footer = el('div', 'nav-locale-dialog-footer');
  const closeBtn = el('button', 'nav-locale-close');
  closeBtn.type = 'button';
  closeBtn.textContent = closeP ? closeP.textContent.trim() : 'Close';
  const continueBtn = el('button', 'nav-locale-continue');
  continueBtn.type = 'button';
  continueBtn.textContent = continueP ? continueP.textContent.trim() : 'Continue';
  footer.append(closeBtn, continueBtn);

  dialog.append(dialogHeader, body, footer);
  modal.append(backdrop, dialog);
  wrap.append(modal);

  const close = () => {
    modal.hidden = true;
    button.focus();
  };
  button.addEventListener('click', () => {
    modal.hidden = false;
    dismiss.focus();
  });
  dismiss.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  continueBtn.addEventListener('click', () => {
    const selected = fieldset.querySelector('input:checked');
    const selectedText = selected ? selected.closest('label').textContent.trim() : currentLabel;
    if (selected && selected.value && selectedText !== currentLabel) {
      window.location.href = selected.value;
    } else {
      close();
    }
  });
  return wrap;
}

/**
 * Opens / closes the mobile menu.
 */
function toggleMenu(header, hamburger, force = null) {
  const expanded = header.getAttribute('aria-expanded') === 'true';
  const next = force !== null ? force : !expanded;
  header.setAttribute('aria-expanded', next ? 'true' : 'false');
  hamburger.setAttribute('aria-expanded', next ? 'true' : 'false');
  hamburger.setAttribute('aria-label', next ? 'Close navigation' : 'Open navigation');
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.doc.children].filter((c) => c.tagName === 'DIV');
  const [brandSection, toolsSection, navSection, localeSection] = sections;

  const wrapper = el('div', 'nav-wrapper');
  wrapper.setAttribute('aria-expanded', 'false');

  const nav = el('nav', 'nav-main');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const hamburger = el('button', 'nav-hamburger');
  hamburger.type = 'button';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.append(el('span', 'nav-hamburger-icon'));
  hamburger.addEventListener('click', () => toggleMenu(wrapper, hamburger));

  if (brandSection) wrapper.append(buildBrand(brandSection));
  if (toolsSection) wrapper.append(buildTools(toolsSection));
  wrapper.append(hamburger);
  const navList = navSection ? buildSections(navSection, nav) : el('ul', 'nav-list');
  if (localeSection) navList.append(el('li', 'nav-item nav-item-locale', buildLocale(localeSection)));
  nav.append(navList);
  wrapper.append(nav);
  block.append(wrapper);

  // Escape closes open megamenu / locale dialog
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const open = nav.querySelector('.nav-item[aria-expanded="true"]');
    if (open && isDesktop.matches) {
      closeAllDrops(nav);
      const trigger = open.querySelector('.nav-trigger');
      if (trigger) trigger.focus();
    }
  });

  // viewport resize handling: reset state when crossing the breakpoint
  isDesktop.addEventListener('change', () => {
    closeAllDrops(nav);
    toggleMenu(wrapper, hamburger, false);
  });
}
