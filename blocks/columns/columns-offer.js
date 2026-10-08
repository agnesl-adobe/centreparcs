const DATE_PATTERN = /(\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?)/;
const UNITS = [
  { key: 'days', label: 'Days', ms: 86400000 },
  { key: 'hours', label: 'Hours', ms: 3600000 },
  { key: 'minutes', label: 'Minutes', ms: 60000 },
  { key: 'seconds', label: 'Seconds', ms: 1000 },
];
const CLOCK_ICON = '<svg class="columns-offer-countdown-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
  + '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>'
  + '<path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  + '</svg>';

/**
 * Builds the live countdown panel that replaces an authored end-date paragraph.
 * @param {Element} p paragraph holding "Offer ends in <ISO date>"
 * @param {Date} end countdown end date
 */
let timerCounter = 0;

function buildCountdown(p, end) {
  const labelText = p.textContent.replace(DATE_PATTERN, '').trim() || 'Offer ends in';

  const panel = document.createElement('div');
  panel.className = 'columns-offer-countdown';
  panel.dataset.end = end.toISOString();

  const label = document.createElement('p');
  label.className = 'columns-offer-countdown-label';
  label.innerHTML = CLOCK_ICON;
  const labelSpan = document.createElement('span');
  labelSpan.textContent = labelText;
  label.append(labelSpan);

  // the panel is the timer (silent: not announced every second); the units stay a list
  timerCounter += 1;
  labelSpan.id = `columns-offer-countdown-label-${timerCounter}`;
  panel.setAttribute('role', 'timer');
  panel.setAttribute('aria-live', 'off');
  panel.setAttribute('aria-labelledby', labelSpan.id);

  const units = document.createElement('ul');
  units.className = 'columns-offer-countdown-units';

  const values = {};
  UNITS.forEach(({ key, label: unitLabel }) => {
    const unit = document.createElement('li');
    unit.className = `columns-offer-countdown-unit columns-offer-countdown-${key}`;
    const digits = document.createElement('span');
    digits.className = 'columns-offer-countdown-digits';
    const value = document.createElement('span');
    value.className = 'columns-offer-countdown-value';
    value.textContent = '0';
    const name = document.createElement('span');
    name.className = 'columns-offer-countdown-name';
    name.textContent = unitLabel;
    digits.append(value, name);
    unit.append(digits);
    units.append(unit);
    values[key] = value;
  });

  panel.append(label, units);

  let interval;
  const tick = () => {
    let remaining = Math.max(0, end.getTime() - Date.now());
    UNITS.forEach(({ key, ms }) => {
      const amount = Math.floor(remaining / ms);
      remaining -= amount * ms;
      values[key].textContent = key === 'days' ? String(amount) : String(amount).padStart(2, '0');
    });
    if (end.getTime() <= Date.now()) {
      panel.classList.add('columns-offer-countdown-expired');
      clearInterval(interval);
    }
  };
  tick();
  interval = setInterval(tick, 1000);

  p.replaceWith(panel);
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

      // wrap the card title so its spacing to the copy follows the source title box
      const title = idx > 0 && col.querySelector(':scope > :is(h2, h3, h4, h5, h6)');
      if (title) {
        const wrapper = document.createElement('div');
        wrapper.className = 'columns-offer-title';
        title.replaceWith(wrapper);
        wrapper.append(title);
      }

      // decorate an authored end date into a live countdown timer
      col.querySelectorAll('p').forEach((p) => {
        if (p.querySelector('a, picture')) return;
        const match = p.textContent.match(DATE_PATTERN);
        if (!match) return;
        const end = new Date(match[1].replace(' ', 'T'));
        if (Number.isNaN(end.getTime())) return;
        buildCountdown(p, end);
      });

      [...col.querySelectorAll('p > a[href]')].forEach((a) => {
        const p = a.parentElement;
        const text = a.textContent.trim();
        if (p.textContent.trim() !== text) return;

        // a short link starting with "*" (e.g. "*T&Cs") is a plain text link, not a button
        if (text.startsWith('*')) {
          a.classList.remove('button', 'primary', 'secondary', 'accent');
          p.className = 'columns-offer-terms';
          return;
        }

        // the offer CTA in the card renders as a full-width primary button
        if (idx > 0 && !a.classList.contains('button')) {
          p.className = 'button-wrapper';
          a.className = 'button primary';
        }
      });
    });
  });
}
