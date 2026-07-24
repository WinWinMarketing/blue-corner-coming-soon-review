(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.documentElement.dataset.reducedMotion = reducedMotion.matches ? "true" : "false";
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", (event) => {
      document.documentElement.dataset.reducedMotion = event.matches ? "true" : "false";
    });
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

  const revealTargets = [...document.querySelectorAll("[data-reveal]")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.12 });
    revealTargets.forEach((target) => observer.observe(target));
  }

  const validationMessages = {
    name: { required: "Please enter your name." },
    email: { required: "Please enter your email address.", invalid: "Email needs a complete address, like name@example.com." },
    phone: { required: "Please enter your phone number.", invalid: "Phone number needs at least 10 digits." },
    role: { required: "Choose whether you're joining as a patient or therapist." },
  };

  const findErrorNode = (form, field) => {
    if (field.name === "role") return form.querySelector("[data-role-error]");
    return [...form.querySelectorAll("[data-field-error]")].find((node) => node.dataset.fieldError === field.name) ?? null;
  };

  const errorFor = (field) => {
    if (field.name === "role") return field.form?.querySelector("input[name='role']:checked") ? "" : validationMessages.role.required;
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
    field.closest(".field, .prototype-role")?.classList.toggle("has-error", Boolean(message));
    const errorNode = findErrorNode(form, field);
    if (errorNode) errorNode.textContent = message;
    return !message;
  };

  document.querySelectorAll("form[data-prototype-form]").forEach((form) => {
    const fields = [...form.querySelectorAll("input[name]")];
    const submitButton = form.querySelector("[data-submit]");
    const status = form.querySelector("[data-form-status]");
    const fieldGroup = form.querySelector("[data-form-fields]");

    fields.forEach((field) => {
      field.addEventListener("blur", () => renderFieldState(form, field));
      field.addEventListener(field.type === "radio" ? "change" : "input", () => {
        if (field.name === "role") {
          fields.filter((candidate) => candidate.name === "role").forEach((candidate) => renderFieldState(form, candidate));
        } else if (field.getAttribute("aria-invalid") === "true") {
          renderFieldState(form, field);
        }
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
      if (!(submitButton instanceof HTMLButtonElement) || !status || !fieldGroup) return;

      const selectedRole = fields.find((field) => field.name === "role" && field.checked)?.value;
      form.dataset.state = "loading";
      submitButton.textContent = form.dataset.loadingLabel || "Checking…";
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      if (fieldGroup instanceof HTMLFieldSetElement) fieldGroup.disabled = true;

      window.setTimeout(() => {
        form.reset();
        fields.forEach((field) => field.removeAttribute("aria-invalid"));
        form.querySelector("[data-role-group]")?.classList.remove("has-error");
        form.querySelectorAll("[data-field-error], [data-role-error]").forEach((node) => { node.textContent = ""; });
        fieldGroup.hidden = true;
        submitButton.removeAttribute("aria-busy");
        const title = status.querySelector("[data-status-title]");
        const body = status.querySelector("[data-status-body]");
        if (title) title.textContent = form.dataset.successTitle || "Prototype complete.";
        if (body) {
          const base = form.dataset.successBody || "Your details were checked on this device only. Nothing was sent, stored, or added to a waitlist.";
          body.textContent = selectedRole ? `${base} You selected ${selectedRole} for this local check.` : base;
        }
        status.hidden = false;
        form.dataset.state = "success";
        status.focus();
      }, 450);
    });
  });
})();
