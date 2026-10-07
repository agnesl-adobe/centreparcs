const STORAGE_KEY = 'hero-notification-dismissed';

/**
 * Builds a stable key for the notice text so a changed message is shown again.
 * @param {string} text
 * @returns {string}
 */
function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash * 31) + text.charCodeAt(i)) % 2147483647;
  }
  return String(hash);
}

function isDismissed(key) {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === key;
  } catch (e) {
    return false;
  }
}

function rememberDismissal(key) {
  try {
    sessionStorage.setItem(STORAGE_KEY, key);
  } catch (e) {
    // storage unavailable - dismissal only lasts for this page view
  }
}

/**
 * Dismissible notification bar: icon + message (bold lead and link) + close control.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // collect all authored content, regardless of how many rows/cells the author used
  const content = document.createElement('div');
  content.className = 'hero-notification-content';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });

  const inEditor = document.documentElement.classList.contains('adobe-ue-edit')
    || window.location.search.includes('aue');

  // do not render an empty bar on the published page (keep it selectable in the editor)
  if (!content.textContent.trim() && !inEditor) {
    block.setAttribute('hidden', '');
    return;
  }

  const key = hashText(content.textContent.trim());

  const icon = document.createElement('span');
  icon.className = 'hero-notification-icon';
  icon.setAttribute('aria-hidden', 'true');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'hero-notification-close';
  close.setAttribute('aria-label', 'Dismiss notification');
  close.addEventListener('click', () => {
    rememberDismissal(key);
    block.setAttribute('hidden', '');
  });

  const inner = document.createElement('div');
  inner.className = 'hero-notification-inner';
  inner.append(icon, content, close);

  block.setAttribute('role', 'status');
  block.replaceChildren(inner);

  if (!inEditor && isDismissed(key)) block.setAttribute('hidden', '');
}
