(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.documentElement.dataset.reducedMotion = reducedMotion.matches ? "true" : "false";

  const updateMotionPreference = (event) => {
    document.documentElement.dataset.reducedMotion = event.matches ? "true" : "false";
  };

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", updateMotionPreference);
  }

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

  document.querySelectorAll("[data-nav-toggle]").forEach((toggle) => {
    const panelId = toggle.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    toggle.addEventListener("click", () => {
      const willOpen = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(willOpen));
      panel.hidden = !willOpen;
    });

    panel.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = true;
    });
  });

  const currentPath = window.location.pathname.replace(/\/+$/, "");
  document.querySelectorAll("[data-concept-nav] a[href]").forEach((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/+$/, "");
    if (linkPath === currentPath) link.setAttribute("aria-current", "page");
  });

  const revealTargets = [...document.querySelectorAll("[data-reveal]")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );
    revealTargets.forEach((target) => observer.observe(target));
  }

  const validationMessages = {
    name: {
      required: "Please enter your name.",
    },
    email: {
      required: "Please enter your email address.",
      invalid: "Email needs a complete address, like name@example.com.",
    },
    phone: {
      required: "Please enter your phone number.",
      invalid: "Phone number needs at least 10 digits.",
    },
  };

  const findErrorNode = (form, field) => {
    const namedError = [...form.querySelectorAll("[data-field-error]")].find(
      (node) => node.dataset.fieldError === field.name,
    );
    if (namedError) return namedError;
    const describedBy = field.getAttribute("aria-describedby")?.split(/\s+/).filter(Boolean) ?? [];
    return describedBy.map((id) => document.getElementById(id)).find(Boolean) ?? null;
  };

  const errorFor = (field) => {
    const value = field.value.trim();
    const messages = validationMessages[field.name];
    if (!messages) return field.required && !value ? field.validationMessage : "";
    if (!value) return field.required ? messages.required : "";
    if (field.name === "email") {
      const completeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (field.validity.typeMismatch || !completeEmail.test(value)) return messages.invalid;
    }
    if (field.name === "phone" && value.replace(/\D/g, "").length < 10) return messages.invalid;
    if (!field.validity.valid) return messages.invalid ?? field.validationMessage;
    return "";
  };

  const renderFieldState = (form, field) => {
    const message = errorFor(field);
    const errorNode = findErrorNode(form, field);
    field.setAttribute("aria-invalid", String(Boolean(message)));
    field.closest(".field")?.classList.toggle("has-error", Boolean(message));
    if (errorNode) errorNode.textContent = message;
    return !message;
  };

  document.querySelectorAll("form[data-prototype-form]").forEach((form) => {
    const fields = [...form.querySelectorAll("input[name]")];
    const submitButton = form.querySelector("[data-submit], button[type='submit'], input[type='submit']");
    const status = form.querySelector("[data-form-status]");
    const fieldGroup = form.querySelector("[data-form-fields], fieldset");

    fields.forEach((field) => {
      field.addEventListener("blur", () => renderFieldState(form, field));
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") renderFieldState(form, field);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (form.dataset.state === "loading" || form.dataset.state === "success") return;

      const validity = fields.map((field) => renderFieldState(form, field));
      const firstInvalid = fields.find((field, index) => !validity[index]);
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      if (!submitButton || !status) return;
      form.dataset.state = "loading";
      submitButton.dataset.idleLabel = submitButton.textContent.trim();
      submitButton.textContent = form.dataset.loadingLabel || "Checking…";
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      if (fieldGroup instanceof HTMLFieldSetElement) fieldGroup.disabled = true;

      window.setTimeout(() => {
        form.reset();
        fields.forEach((field) => field.removeAttribute("aria-invalid"));
        form.querySelectorAll("[data-field-error]").forEach((node) => {
          node.textContent = "";
        });
        if (fieldGroup) fieldGroup.hidden = true;
        submitButton.removeAttribute("aria-busy");
        const title = status.querySelector("[data-status-title]");
        const body = status.querySelector("[data-status-body]");
        if (title) title.textContent = form.dataset.successTitle || "Prototype complete.";
        if (body) body.textContent = form.dataset.successBody || "Your details were checked on this device only. Nothing was sent, stored, or added to a waitlist.";
        status.hidden = false;
        form.dataset.state = "success";
        status.focus();
      }, 450);
    });
  });
})();
