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

      const missing = Array.from(form.querySelectorAll<HTMLInputElement>('[required]')).find(
        (field) => !field.value.trim(),
      );
      if (missing) {
        show('Please fill in every field marked with a star.', 'error');
        missing.focus();
        return;
      }

      button.disabled = true;
      const label = button.textContent;
      button.textContent = 'Sending…';
      show('Sending your request…', 'busy');

      try {
        const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
        const result = await response.json().catch(() => ({}));

        if (response.ok && result.ok) {
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
      } catch {
        show('That did not send — please check your connection, or call us instead.', 'error');
      }

      button.disabled = false;
      button.textContent = label;
    });
  });
}
