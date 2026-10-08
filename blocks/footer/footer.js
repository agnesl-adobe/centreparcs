/**
 * Footer block.
 *
 * Content-first: all copy, links and images come from the footer fragment
 * (content/footer.plain.html). This file only reads that DOM and builds the
 * layout shells and form controls around it.
 *
 * Fragment contract (one flat section):
 * - <h2> + <ul> pairs          -> link groups (accordion on small screens)
 * - <ul> of image-only links    -> social icon row
 * - <p><strong>text</strong></p> -> newsletter label
 * - <p>text</p> (no link)       -> email field placeholder
 * - first <p><a></a></p>        -> sign-up action link (href = destination,
 *                                 followed only when an email is entered)
 * - further <p><a></a></p>      -> secondary form links (hidden, logged-in state)
 */

let groupCounter = 0;

/**
 * Fetches the footer fragment (metadata-independent).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchFooterFragment() {
  // metadata-independent: pages in the local content tree (/content/..., aem up) try
  // /content first; published pages (aem.page / aem.live) try the root first
  const local = window.location.pathname.startsWith('/content/');
  let resp = local ? await fetch('/content/footer.plain.html') : await fetch('/footer.plain.html');
  if (!resp.ok) resp = local ? await fetch('/footer.plain.html') : await fetch('/content/footer.plain.html');
  if (!resp.ok) return null;

  const container = document.createElement('div');
  container.innerHTML = await resp.text();

  // resolve relative media against the fragment location, not the current page
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  container.querySelectorAll('source[srcset]').forEach((source) => {
    source.srcset = source.getAttribute('srcset').split(',')
      .map((candidate) => {
        const [url, ...descriptor] = candidate.trim().split(/\s+/);
        return [new URL(url, resp.url).href, ...descriptor].join(' ');
      })
      .join(', ');
  });
  return container;
}

/**
 * Checks whether a list only contains image links (icon row).
 * @param {Element} list ul/ol element
 * @returns {boolean}
 */
function isIconList(list) {
  const items = [...list.children];
  return items.length > 0 && items.every((li) => {
    const link = li.querySelector('a');
    return link && link.querySelector('img') && !link.textContent.trim();
  });
}

/**
 * Builds a collapsible link group from a heading and its list.
 * @param {Element} heading heading element
 * @param {Element} list list of links
 * @returns {HTMLElement}
 */
function buildLinkGroup(heading, list) {
  groupCounter += 1;
  const id = `footer-group-${groupCounter}`;
  const group = document.createElement('div');
  group.className = 'footer-group';

  const title = document.createElement(heading.tagName.toLowerCase());
  title.className = 'footer-group-title';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'footer-group-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', `${id}-panel`);
  toggle.id = `${id}-button`;
  toggle.append(...heading.childNodes);
  title.append(toggle);

  const panel = document.createElement('div');
  panel.className = 'footer-group-panel';
  panel.id = `${id}-panel`;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', toggle.id);
  list.classList.add('footer-links');
  panel.append(list);

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    group.classList.toggle('is-open', !expanded);
  });

  group.append(title, panel);
  return group;
}

/**
 * Turns an image-only link list into an icon row. The authored image is
 * painted as a CSS background (like the source icon font) and its alt text
 * becomes the accessible name of the link.
 * @param {Element} list list element
 * @returns {Element}
 */
function decorateIconList(list) {
  list.classList.add('footer-social');
  list.querySelectorAll('a').forEach((link) => {
    const img = link.querySelector('img');
    if (!img) return;
    if (img.alt) link.setAttribute('aria-label', img.alt);
    const icon = document.createElement('span');
    icon.className = 'footer-social-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.setProperty('--footer-icon', `url("${img.src}")`);
    img.replaceWith(icon);
  });
  return list;
}

/**
 * Builds the inline newsletter form from fragment paragraphs.
 * @param {Element[]} paragraphs paragraphs that follow the icon row
 * @returns {HTMLElement|null}
 */
function buildForm(paragraphs) {
  if (!paragraphs.length) return null;
  const labelP = paragraphs.find((p) => p.querySelector('strong') && !p.querySelector('a'));
  const placeholderP = paragraphs.find((p) => p !== labelP && !p.querySelector('a'));
  const linkPs = paragraphs.filter((p) => p.querySelector('a'));
  const action = linkPs.shift();

  const wrapper = document.createElement('div');
  wrapper.className = 'footer-newsletter';
  const form = document.createElement('form');
  form.className = 'footer-newsletter-form';
  form.noValidate = true;
  groupCounter += 1;
  const inputId = `footer-email-${groupCounter}`;

  if (labelP) {
    const label = document.createElement('label');
    label.className = 'footer-newsletter-label';
    label.htmlFor = inputId;
    label.textContent = labelP.textContent.trim();
    form.append(label);
  }

  const row = document.createElement('div');
  row.className = 'footer-newsletter-row';
  const input = document.createElement('input');
  input.type = 'email';
  input.id = inputId;
  input.name = 'signup';
  input.autocomplete = 'email';
  if (placeholderP) input.placeholder = placeholderP.textContent.trim();
  row.append(input);

  if (action) {
    const submit = action.querySelector('a');
    submit.className = 'footer-newsletter-submit';
    row.append(submit);
    const guardEmpty = (e) => {
      if (!input.value.trim()) {
        e.preventDefault();
        input.focus();
      }
    };
    submit.addEventListener('click', guardEmpty);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input.value.trim()) {
        input.focus();
        return;
      }
      window.location.href = submit.href;
    });
  }
  form.append(row);
  wrapper.append(form);

  linkPs.forEach((p) => {
    p.classList.add('footer-newsletter-secondary');
    wrapper.append(p);
  });
  return wrapper;
}

/**
 * Builds one footer band from a fragment section.
 * @param {Element} section top-level fragment div
 * @returns {HTMLElement}
 */
function buildBand(section) {
  const band = document.createElement('div');
  band.className = 'footer-band';
  const aside = document.createElement('div');
  aside.className = 'footer-aside';
  const formParagraphs = [];

  const children = [...section.children];
  children.forEach((el, i) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      const next = children[i + 1];
      if (next && (next.tagName === 'UL' || next.tagName === 'OL')) {
        band.append(buildLinkGroup(el, next));
      }
    } else if ((el.tagName === 'UL' || el.tagName === 'OL') && isIconList(el)) {
      aside.append(decorateIconList(el));
    } else if (el.tagName === 'P') {
      formParagraphs.push(el);
    }
  });

  const form = buildForm(formParagraphs);
  if (form) aside.append(form);
  if (aside.children.length) band.append(aside);
  return band;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const footer = document.createElement('div');
  footer.className = 'footer-inner';
  [...fragment.children]
    .filter((el) => el.tagName === 'DIV')
    .forEach((section) => footer.append(buildBand(section)));
  block.append(footer);
}
