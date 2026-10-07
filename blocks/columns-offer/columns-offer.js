const DATE_PATTERN = /(\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?)/;
const UNITS = [
  { key: 'days', label: 'Days', ms: 86400000 },
  { key: 'hours', label: 'Hours', ms: 3600000 },
  { key: 'minutes', label: 'Minutes', ms: 60000 },
  { key: 'seconds', label: 'Seconds', ms: 1000 },
];

/**
 * Builds the live countdown timer that replaces an authored end-date paragraph.
 * @param {Element} p paragraph holding "Offer ends <ISO date>"
 * @param {Date} end countdown end date
 */
function buildCountdown(p, end) {
  const label = p.textContent.replace(DATE_PATTERN, '').trim();
  const timer = document.createElement('div');
  timer.className = 'columns-offer-countdown';

  const title = document.createElement('p');
  title.className = 'columns-offer-countdown-label';
  title.textContent = label || 'Offer ends in';

  const units = document.createElement('div');
  units.className = 'columns-offer-countdown-units';
  units.setAttribute('role', 'timer');
  units.setAttribute('aria-live', 'off');

  const values = {};
  UNITS.forEach(({ key, label: unitLabel }) => {
    const unit = document.createElement('span');
    unit.className = `columns-offer-countdown-unit columns-offer-countdown-${key}`;
    const value = document.createElement('span');
    value.className = 'columns-offer-countdown-value';
    value.textContent = '0';
    const name = document.createElement('span');
    name.className = 'columns-offer-countdown-name';
    name.textContent = unitLabel;
    unit.append(value, name);
    units.append(unit);
    values[key] = value;
  });

  timer.append(title, units);
  timer.dataset.end = end.toISOString();

  let interval;
  const tick = () => {
    let remaining = Math.max(0, end.getTime() - Date.now());
    UNITS.forEach(({ key, ms }) => {
      const amount = Math.floor(remaining / ms);
      remaining -= amount * ms;
      values[key].textContent = key === 'days' ? String(amount) : String(amount).padStart(2, '0');
    });
    if (end.getTime() <= Date.now()) {
      timer.classList.add('columns-offer-countdown-expired');
      clearInterval(interval);
    }
  };
  tick();
  interval = setInterval(tick, 1000);

  p.replaceWith(timer);
}

/**
 * Two-column offer layout: headline column + offer card with countdown and CTAs.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-offer-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-offer-row');
    [...row.children].forEach((col, idx) => {
      col.classList.add(idx === 0 ? 'columns-offer-headline' : 'columns-offer-card');

      const pic = col.querySelector('picture');
      if (pic && col.children.length === 1) col.classList.add('columns-offer-img-col');

      // decorate an authored end date into a live countdown timer
      col.querySelectorAll('p').forEach((p) => {
        if (p.querySelector('a, picture')) return;
        const match = p.textContent.match(DATE_PATTERN);
        if (!match) return;
        const end = new Date(match[1].replace(' ', 'T'));
        if (Number.isNaN(end.getTime())) return;
        buildCountdown(p, end);
      });

      // a trailing short link (e.g. "*T&Cs") is rendered as a plain text link, not a button
      [...col.querySelectorAll('a')].forEach((a) => {
        if (a.textContent.trim().startsWith('*')) {
          a.classList.add('columns-offer-terms');
          a.classList.remove('button', 'primary', 'secondary');
          a.closest('.button-container')?.classList.remove('button-container');
        }
      });
    });
  });
}
