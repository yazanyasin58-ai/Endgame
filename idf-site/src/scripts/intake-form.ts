/**
 * Submit handler shared by the estimate form and the listing form.
 *
 * Both post the same multipart body to the same endpoint, so they share one
 * copy of this rather than drifting apart. The only thing that differs is the
 * sentence shown on success, which each form supplies as `data-ef-success`
 * with `{reference}` standing in for the reference number.
 *
 * Submits over fetch so the customer stays on the page and photographs go up
 * in the same request. A failure says what failed and leaves every field
 * filled in — re-typing an intake form is how a lead is lost.
 */
import { track, withSource } from './track';

export function initIntakeForms(): void {
  document.querySelectorAll<HTMLFormElement>('form.ef').forEach((form) => {
    if (form.dataset.efReady) return;
    form.dataset.efReady = 'true';

    const status = form.querySelector<HTMLElement>('[data-ef-status]');
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const fileList = form.querySelector<HTMLElement>('[data-ef-filelist]');
    const button = form.querySelector<HTMLButtonElement>('.ef-submit');
    if (!status || !button) return;

    const show = (message: string, kind: 'ok' | 'error' | 'busy') => {
      status.textContent = message;
      status.dataset.kind = kind;
      status.hidden = false;
    };

    /**
     * A Turnstile token is single-use, and the endpoint verifies it *before* it
     * validates the fields. So a submission rejected for a missing field spends
     * the token on the way out, and the corrected resubmission is then refused
     * for reusing it — reported as "could not verify that request came from a
     * browser", which describes neither problem. Worse, it sticks: every retry
     * fails the same way until the page is reloaded.
     *
     * Issue a fresh token after any failed round-trip so the retry is judged on
     * its own merits.
     */
    const resetTurnstile = () => {
      const widget = form.querySelector('.cf-turnstile');
      const api = (window as unknown as { turnstile?: { reset(el: Element): void } }).turnstile;
      if (!widget || !api) return;
      try {
        api.reset(widget);
      } catch {
        /* Widget not rendered yet — nothing was spent, so nothing to reset. */
      }
    };

    /**
     * Field validation.
     *
     * The form is `novalidate` on purpose: the browser's own bubbles are
     * unstyleable, appear one at a time, and vanish on the next click. What
     * replaced them was a single emptiness test, which meant `phone: "abc"`,
     * an email with no `@` and a one-character address all submitted happily.
     * The entire value of this form is a number somebody can call back, so a
     * typo'd one is a lead that was paid for, counted, and is dead.
     *
     * The phone rule COUNTS DIGITS rather than matching a format, because
     * customers type (571) 233-5133, 571.233.5133 and +1 571 233 5133 and all
     * three are the same reachable number. Ten digits, or eleven starting
     * with a 1, is the North American range.
     *
     * The email rule stays deliberately loose: something, an @, and a dot in
     * the domain. Anything stricter starts rejecting addresses that deliver.
     */
    const digitsOf = (value: string) => value.replace(/\D/g, '');

    type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    /* Everything the customer fills in. The file input validates itself, and
       the honeypot inside .ef-hp must never be looked at: it is meant to stay
       empty, and a bot filling it is the signal, not an error to report. */
    const fields = Array.from(form.querySelectorAll<Field>('input, select, textarea')).filter(
      (field) => field.type !== 'file' && field.type !== 'hidden' && !field.closest('.ef-hp'),
    );

    const errorFor = (field: Field): string | null => {
      const value = field.value.trim();
      if (field.hasAttribute('required') && !value) return 'This one is needed.';
      if (!value) return null;
      if (field.type === 'tel') {
        const digits = digitsOf(value);
        const national = digits.length === 10;
        const withCountry = digits.length === 11 && digits.startsWith('1');
        if (!national && !withCountry) {
          return 'That does not look like a number we can reach you on. Ten digits, area code included.';
        }
      }
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'That address is missing something. Check it for a typo.';
      }
      return null;
    };

    const errorId = (field: Field) => `${field.id}-err`;

    const clearError = (field: Field) => {
      field.removeAttribute('aria-invalid');
      const el = document.getElementById(errorId(field));
      if (el) {
        el.hidden = true;
        el.textContent = '';
      }
    };

    const markError = (field: Field, message: string) => {
      field.setAttribute('aria-invalid', 'true');
      let el = document.getElementById(errorId(field));
      if (!el) {
        el = document.createElement('p');
        el.className = 'ef-err';
        el.id = errorId(field);
        field.insertAdjacentElement('afterend', el);
      }
      el.textContent = message;
      el.hidden = false;
      /* Append rather than replace: several fields already carry a hint. */
      const described = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      if (!described.includes(el.id)) {
        field.setAttribute('aria-describedby', [...described, el.id].join(' '));
      }
    };

    /* Clear as soon as they start fixing it. An error that outlives the
       mistake trains people to ignore errors. */
    for (const field of fields) {
      field.addEventListener('input', () => clearError(field));
      field.addEventListener('change', () => clearError(field));
    }

    fileInput?.addEventListener('change', () => {
      if (!fileList) return;
      const files = Array.from(fileInput.files ?? []);
      if (files.length === 0) {
        fileList.hidden = true;
        return;
      }
      const mb = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
      fileList.textContent = `${files.length} file${files.length === 1 ? '' : 's'} selected — ${mb.toFixed(1)} MB total`;
      fileList.hidden = false;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      for (const field of fields) clearError(field);

      const bad: Array<{ field: Field; message: string }> = [];
      for (const field of fields) {
        const message = errorFor(field);
        if (message) bad.push({ field, message });
      }

      if (bad.length) {
        for (const { field, message } of bad) markError(field, message);
        /* The summary names the count; each field carries its own reason.
           One generic sentence for the whole form leaves the customer
           hunting for which control it meant. */
        show(
          bad.length === 1
            ? 'One field needs a look before this can send.'
            : `${bad.length} fields need a look before this can send.`,
          'error',
        );
        bad[0].field.focus();
        bad[0].field.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      button.disabled = true;
      const label = button.textContent;
      button.textContent = 'Sending…';
      show('Sending your request…', 'busy');

      try {
        const response = await fetch(form.action, { method: 'POST', body: withSource(new FormData(form)) });
        const result = await response.json().catch(() => ({}));

        if (response.ok && result.ok) {
          track('form', String(new FormData(form).get('enquiry') || 'estimate'));
          form.reset();
          if (fileList) fileList.hidden = true;
          const template =
            form.dataset.efSuccess ||
            'Thank you — your request is in. Reference {reference}. We will be in touch.';
          show(template.replace('{reference}', result.reference), 'ok');
          button.remove();
          return;
        }
        show(result.error || 'Something went wrong sending that. Please call us instead.', 'error');
        resetTurnstile();
      } catch {
        show('That did not send — please check your connection, or call us instead.', 'error');
        resetTurnstile();
      }

      button.disabled = false;
      button.textContent = label;
    });
  });
}
