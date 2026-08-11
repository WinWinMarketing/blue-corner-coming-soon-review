(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  root.dataset.reducedMotion = reducedMotion.matches ? "true" : "false";

  document.querySelectorAll("[data-fallback-image]").forEach((image) => {
    const frame = image.closest("[data-image-frame]");
    if (!frame) return;
    const markMissing = () => {
      frame.classList.add("is-image-missing");
      image.hidden = true;
    };
    image.addEventListener("error", markMissing, { once: true });
    if (image.complete && image.naturalWidth === 0) markMissing();
  });

  document.querySelectorAll("[data-scroll-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#") || href.length === 1) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      window.setTimeout(() => {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }, reducedMotion.matches ? 0 : 360);
    });
  });

  const revealTargets = [...document.querySelectorAll("[data-reveal]")];
  let revealObserver = null;
  let revealActivationFrame = 0;
  const revealPrepController = window.blueCornerRevealPrep;
  const releaseRevealPrep = () => {
    revealPrepController?.release?.();
    root.classList.remove("reveal-prep");
  };

  const disableReveals = () => {
    root.classList.remove("reveal-ready");
    revealObserver?.disconnect();
    revealObserver = null;
    if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(revealActivationFrame);
    revealActivationFrame = 0;
    releaseRevealPrep();
  };

  const enableReveals = () => {
    if (reducedMotion.matches
      || !("IntersectionObserver" in window)
      || !("requestAnimationFrame" in window)
      || !root.classList.contains("reveal-prep")) {
      disableReveals();
      return;
    }

    try {
      const observer = new IntersectionObserver((entries) => {
        try {
          if (!root.classList.contains("reveal-ready")) return;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        } catch {
          disableReveals();
        }
      }, { rootMargin: "0px 0px -8%", threshold: 0.12 });

      revealObserver = observer;
      revealTargets.forEach((target) => observer.observe(target));
      revealActivationFrame = window.requestAnimationFrame(() => {
        revealActivationFrame = window.requestAnimationFrame(() => {
          try {
            if (reducedMotion.matches || !root.classList.contains("reveal-prep")) {
              disableReveals();
              return;
            }

            const initialRevealTargets = revealTargets.filter((target) => {
              const bounds = target.getBoundingClientRect();
              return bounds.bottom > 0 && bounds.top < window.innerHeight * 0.92;
            });
            revealPrepController?.cancelFallback?.();
            root.classList.add("reveal-ready");
            root.classList.remove("reveal-prep");
            revealActivationFrame = window.requestAnimationFrame(() => {
              try {
                if (reducedMotion.matches || !root.classList.contains("reveal-ready")) {
                  disableReveals();
                  return;
                }
                initialRevealTargets.forEach((target) => {
                  target.classList.add("is-visible");
                  observer.unobserve(target);
                });
                revealActivationFrame = 0;
              } catch {
                disableReveals();
              }
            });
          } catch {
            disableReveals();
          }
        });
      });
    } catch {
      disableReveals();
    }
  };

  enableReveals();
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", (event) => {
      root.dataset.reducedMotion = event.matches ? "true" : "false";
      if (event.matches) {
        disableReveals();
      } else {
        enableReveals();
      }
    });
  }

  let scrollbarTimer = 0;
  const hideActiveScrollbar = () => root.classList.remove("is-scrollbar-active");
  const showActiveScrollbar = () => {
    root.classList.add("is-scrollbar-active");
    window.clearTimeout(scrollbarTimer);
    scrollbarTimer = window.setTimeout(hideActiveScrollbar, 700);
  };
  const trackScrollbarEdge = (event) => {
    root.classList.toggle("is-scrollbar-edge", window.innerWidth - event.clientX <= 12);
  };
  const clearScrollbarEdge = () => root.classList.remove("is-scrollbar-edge");
  const cleanupScrollbar = () => {
    window.clearTimeout(scrollbarTimer);
    window.removeEventListener("scroll", showActiveScrollbar);
    window.removeEventListener("pointermove", trackScrollbarEdge);
    document.removeEventListener("pointerleave", clearScrollbarEdge);
    window.removeEventListener("pagehide", handleScrollbarPageHide);
    root.classList.remove("is-scrollbar-active", "is-scrollbar-edge");
  };
  const handleScrollbarPageHide = (event) => {
    if (!event.persisted) cleanupScrollbar();
  };

  window.addEventListener("scroll", showActiveScrollbar, { passive: true });
  window.addEventListener("pointermove", trackScrollbarEdge, { passive: true });
  document.addEventListener("pointerleave", clearScrollbarEdge, { passive: true });
  window.addEventListener("pagehide", handleScrollbarPageHide);

  const validationMessages = {
    name: { required: "Please enter your name." },
    email: { required: "Please enter your email address.", invalid: "Email needs a complete address, like name@example.com." },
    phone: { required: "Please enter your phone number.", invalid: "Phone number needs at least 10 digits." },
    role: { required: "Choose whether you're joining as a patient or therapist." },
    consent: { required: "Tick the box so we know we can email you." },
  };

  const findErrorNode = (form, field) => {
    if (field.name === "role") return form.querySelector("[data-role-error]");
    return [...form.querySelectorAll("[data-field-error]")].find((node) => node.dataset.fieldError === field.name) ?? null;
  };

  const errorFor = (field) => {
    if (field.name === "role") return field.form?.querySelector("input[name='role']:checked") ? "" : validationMessages.role.required;
    if (field.type === "checkbox") return field.checked ? "" : validationMessages[field.name].required;
    const value = field.value.trim();
    const messages = validationMessages[field.name];
    if (!value) return field.required ? messages.required : "";
    if (field.name === "email" && (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) return messages.invalid;
    if (field.name === "phone" && value.replace(/\D/g, "").length < 10) return messages.invalid;
    return field.validity.valid ? "" : messages.invalid;
  };

  const renderFieldState = (form, field) => {
    const message = errorFor(field);
    field.setAttribute("aria-invalid", String(Boolean(message)));
    field.closest(".field, .prototype-role, .prototype-consent")?.classList.toggle("has-error", Boolean(message));
    const errorNode = findErrorNode(form, field);
    if (errorNode) errorNode.textContent = message;
    return !message;
  };

  /* A request that never settles would leave the fieldset disabled and the
     button spinning forever, with no way back. Ten seconds, then treat it as a
     failure the user can retry. */
  const SEND_TIMEOUT_MS = 10000;

  document.querySelectorAll("form[data-prototype-form]").forEach((form) => {
    /* The honeypot is excluded here, not filtered later: it must never be
       validated, never focused, and never counted as invalid. */
    const fields = [...form.querySelectorAll("input[name]:not([data-honeypot])")];
    const honeypot = form.querySelector("[data-honeypot]");
    const submitButton = form.querySelector("[data-submit]");
    const status = form.querySelector("[data-form-status]");
    const fieldGroup = form.querySelector("[data-form-fields]");
    const disclosureId = form.getAttribute("aria-describedby")?.split(/\s+/).find(Boolean);
    const disclosure = disclosureId ? document.getElementById(disclosureId) : null;
    const originalDisclosure = disclosure?.textContent ?? "";
    const submitLabel = submitButton?.textContent ?? "";
    /* Bots submit in milliseconds. Sent with the request so the server can bin
       anything impossibly fast without the browser deciding on its own. */
    const startedAt = Date.now();
    let validationAttempted = false;

    if (disclosure) disclosure.dataset.originalText = originalDisclosure;

    const syncValidationSummary = () => {
      if (!disclosure) return;
      const firstInvalid = fields.find((field) => {
        const hasExistingError = field.getAttribute("aria-invalid") === "true";
        return Boolean(errorFor(field)) && (validationAttempted || hasExistingError);
      });
      const message = firstInvalid ? errorFor(firstInvalid) : "";
      disclosure.textContent = message || originalDisclosure;
      disclosure.classList.toggle("has-validation-error", Boolean(message));
      if (message) {
        disclosure.dataset.validationState = "error";
      } else {
        delete disclosure.dataset.validationState;
      }
    };

    fields.forEach((field) => {
      field.addEventListener("blur", () => {
        renderFieldState(form, field);
        syncValidationSummary();
      });
      field.addEventListener(field.type === "radio" ? "change" : "input", () => {
        if (field.name === "role") {
          fields.filter((candidate) => candidate.name === "role").forEach((candidate) => renderFieldState(form, candidate));
        } else if (validationAttempted || field.getAttribute("aria-invalid") === "true") {
          renderFieldState(form, field);
        }
        syncValidationSummary();
      });
    });

    /* A failed send is recoverable, so it restores the form rather than
       replacing it: values stay, the fieldset re-enables, the button goes back
       to its label, and the message lands in the disclosure — the same surface
       validation errors use, so the card's height never changes. `state` is
       left as "error" and not "success", which is what lets the guard at the
       top of the handler allow a retry. */
    const restoreForRetry = () => {
      form.dataset.state = "error";
      if (fieldGroup instanceof HTMLFieldSetElement) fieldGroup.disabled = false;
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.textContent = submitLabel;
        submitButton.focus();
      }
      if (disclosure) {
        disclosure.textContent = form.dataset.errorMessage || "We couldn't send that just now. Please try again in a moment.";
        disclosure.classList.add("has-validation-error");
        disclosure.dataset.validationState = "error";
      }
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (form.dataset.state === "loading" || form.dataset.state === "success") return;
      validationAttempted = true;
      const validity = fields.map((field) => renderFieldState(form, field));
      const firstInvalid = fields.find((field, index) => !validity[index]);
      syncValidationSummary();
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      if (!(submitButton instanceof HTMLButtonElement) || !status || !fieldGroup) return;

      const valueOf = (name) => fields.find((field) => field.name === name)?.value.trim() ?? "";
      const selectedRole = fields.find((field) => field.name === "role" && field.checked)?.value;
      /* Read every value BEFORE the fieldset is disabled, so the payload can
         never be built from a half-torn-down form. */
      const payload = {
        role: selectedRole ?? "",
        name: valueOf("name"),
        email: valueOf("email"),
        phone: valueOf("phone"),
        consent: Boolean(fields.find((field) => field.name === "consent")?.checked),
        website: honeypot instanceof HTMLInputElement ? honeypot.value : "",
        elapsedMs: Date.now() - startedAt,
      };

      form.dataset.state = "loading";
      submitButton.textContent = form.dataset.loadingLabel || "Sending…";
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      if (fieldGroup instanceof HTMLFieldSetElement) fieldGroup.disabled = true;

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
      let delivered = false;
      try {
        const response = await fetch(form.dataset.endpoint || "/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
          signal: controller.signal,
        });
        delivered = response.ok;
      } catch {
        /* Offline, aborted, DNS, TLS, CSP — all the same to the person at the
           keyboard: it didn't send and they should try again. Nothing about the
           failure is surfaced to them or logged. */
        delivered = false;
      }
      window.clearTimeout(timeout);

      if (!delivered) {
        restoreForRetry();
        return;
      }

      form.reset();
      validationAttempted = false;
      fields.forEach((field) => field.removeAttribute("aria-invalid"));
      form.querySelector("[data-role-group]")?.classList.remove("has-error");
      form.querySelector("[data-consent-group]")?.classList.remove("has-error");
      form.querySelectorAll("[data-field-error], [data-role-error]").forEach((node) => { node.textContent = ""; });
      syncValidationSummary();
      fieldGroup.hidden = true;
      submitButton.removeAttribute("aria-busy");
      const title = status.querySelector("[data-status-title]");
      const body = status.querySelector("[data-status-body]");
      if (title) title.textContent = form.dataset.successTitle || "You're in.";
      if (body) {
        const base = form.dataset.successBody || "We've got your details. We'll email you the day The Blue Corner opens.";
        body.textContent = selectedRole ? `${base} You joined as ${selectedRole}.` : base;
      }
      status.hidden = false;
      form.dataset.state = "success";
      status.focus();
    });
  });
})();
