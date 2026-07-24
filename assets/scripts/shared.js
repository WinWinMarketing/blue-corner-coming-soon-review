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

  const moduleStates = new Set(["idle", "active", "ready", "success", "error"]);

  const setModuleState = (module, state, status, message) => {
    if (!moduleStates.has(state)) return;
    module.dataset.state = state;
    if (status && message) status.textContent = message;
  };

  const selectCopyFallback = (module, text, preferredField) => {
    const fallback = preferredField || module.querySelector("[data-copy-fallback] textarea");
    const wrapper = fallback?.closest("[data-copy-fallback]");
    if (wrapper) wrapper.hidden = false;
    if (!(fallback instanceof HTMLTextAreaElement)) return;
    fallback.value = text;
    fallback.focus();
    fallback.select();
  };

  const copyModuleText = async (module, text, status, successMessage, preferredField) => {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(text);
      setModuleState(module, "success", status, successMessage);
    } catch {
      selectCopyFallback(module, text, preferredField);
      setModuleState(module, "error", status, "Automatic copy was unavailable. The text is selected so you can copy it manually.");
    }
  };

  const selectedValue = (form, name) => {
    const selected = form.querySelector(`input[name="${name}"]:checked`);
    return selected instanceof HTMLInputElement ? selected.value : "";
  };

  const checkedValues = (form, name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)]
    .map((input) => input.value);

  const enableModuleControls = (module) => {
    module.querySelectorAll("[data-js-controls]").forEach((controls) => {
      controls.hidden = false;
    });
  };

  const initializeSentenceStarter = (module) => {
    const form = module.querySelector("[data-sentence-form]");
    const editor = form?.querySelector("[data-sentence-editor]");
    const copyButton = form?.querySelector("[data-action='copy']");
    const status = module.querySelector("[data-module-status]");
    if (!(form instanceof HTMLFormElement) || !(editor instanceof HTMLTextAreaElement) || !(copyButton instanceof HTMLButtonElement)) return;

    enableModuleControls(module);
    const resetSentence = () => {
      editor.value = "";
      copyButton.disabled = true;
      setModuleState(module, "idle", status, "Choose a starter or write your own line.");
    };
    form.querySelectorAll("input[name='sentence-starter']").forEach((choice) => {
      choice.addEventListener("change", () => {
        editor.value = choice.value;
        copyButton.disabled = false;
        setModuleState(module, "ready", status, "Starter added. Edit it if you want, then copy the line.");
      });
    });
    editor.addEventListener("input", () => {
      const hasText = Boolean(editor.value.trim());
      copyButton.disabled = !hasText;
      setModuleState(module, hasText ? "ready" : "idle", status, hasText ? "Your line is ready to copy." : "Choose a starter or write your own line.");
    });
    copyButton.addEventListener("click", () => {
      const text = editor.value.trim();
      if (text) copyModuleText(module, text, status, "Line copied to your clipboard.", editor);
    });
    form.addEventListener("reset", () => {
      window.setTimeout(resetSentence, 0);
    });
    return () => {
      form.reset();
      resetSentence();
    };
  };

  const initializeTimeline = (module) => {
    const workspace = module.querySelector("[data-timeline]");
    const steps = [...(workspace?.querySelectorAll("[data-step]") || [])];
    const nextButton = workspace?.querySelector("[data-action='next']");
    const showAllButton = workspace?.querySelector("[data-action='show-all']");
    const copyButton = workspace?.querySelector("[data-action='copy']");
    const resetButton = workspace?.querySelector("[data-action='reset']");
    const status = module.querySelector("[data-module-status]");
    if (!workspace || !steps.length || !(nextButton instanceof HTMLButtonElement) || !(showAllButton instanceof HTMLButtonElement) || !(copyButton instanceof HTMLButtonElement) || !(resetButton instanceof HTMLButtonElement)) return;

    enableModuleControls(module);
    let visibleSteps = 1;
    const outline = steps.map((step) => {
      const minute = step.dataset.minute || "";
      const heading = step.querySelector("h3")?.textContent.trim() || "";
      const body = step.querySelector("p")?.textContent.trim() || "";
      return `Minute ${minute}: ${heading}\n${body}`;
    }).join("\n\n");
    const renderSteps = (state, message) => {
      steps.forEach((step, index) => {
        step.hidden = index >= visibleSteps;
      });
      const complete = visibleSteps >= steps.length;
      nextButton.disabled = complete;
      showAllButton.disabled = complete;
      resetButton.disabled = visibleSteps === 1;
      setModuleState(module, state, status, message);
    };
    const resetTimeline = () => {
      visibleSteps = 1;
      const fallback = module.querySelector("[data-copy-fallback]");
      const fallbackField = fallback?.querySelector("textarea");
      if (fallback) fallback.hidden = true;
      if (fallbackField instanceof HTMLTextAreaElement) fallbackField.value = "";
      renderSteps("idle", "Start at minute 0, or show the complete outline.");
    };
    resetTimeline();
    nextButton.addEventListener("click", () => {
      visibleSteps = Math.min(visibleSteps + 1, steps.length);
      renderSteps(visibleSteps === steps.length ? "ready" : "active", visibleSteps === steps.length ? "The complete ten-minute outline is visible." : `${visibleSteps} of ${steps.length} steps are visible.`);
    });
    showAllButton.addEventListener("click", () => {
      visibleSteps = steps.length;
      renderSteps("ready", "The complete ten-minute outline is visible.");
    });
    resetButton.addEventListener("click", resetTimeline);
    copyButton.addEventListener("click", () => {
      copyModuleText(module, outline, status, "Complete outline copied to your clipboard.");
    });
    return resetTimeline;
  };

  const initializeCornerStandard = (module) => {
    const workspace = module.querySelector("[data-corner-standard]");
    const checks = [...(workspace?.querySelectorAll("[data-review-check]") || [])];
    const clearButton = workspace?.querySelector("[data-action='clear-review']");
    const status = module.querySelector("[data-module-status]");
    if (!workspace || !checks.length || !(clearButton instanceof HTMLButtonElement)) return;

    enableModuleControls(module);
    const updateReviewCount = () => {
      const reviewed = checks.filter((check) => check.checked).length;
      clearButton.disabled = reviewed === 0;
      setModuleState(module, reviewed === 0 ? "idle" : reviewed === checks.length ? "ready" : "active", status, `${reviewed} of ${checks.length} standards reviewed here.`);
    };
    checks.forEach((check) => check.addEventListener("change", updateReviewCount));
    clearButton.addEventListener("click", () => {
      checks.forEach((check) => {
        check.checked = false;
      });
      updateReviewCount();
    });
    return () => {
      checks.forEach((check) => {
        check.checked = false;
      });
      module.querySelectorAll("details").forEach((details) => {
        details.open = false;
      });
      updateReviewCount();
    };
  };

  const initializePlan = (module) => {
    const form = module.querySelector("[data-plan-form]");
    const fields = [...(form?.querySelectorAll("textarea[name]") || [])];
    const generateButton = form?.querySelector("[data-action='generate']");
    const copyButton = form?.querySelector("[data-action='copy']");
    const printButton = form?.querySelector("[data-action='print']");
    const preview = form?.querySelector("[data-plan-preview]");
    const status = module.querySelector("[data-module-status]");
    if (!(form instanceof HTMLFormElement) || !fields.length || !(generateButton instanceof HTMLButtonElement) || !(copyButton instanceof HTMLButtonElement) || !(printButton instanceof HTMLButtonElement) || !preview) return;

    enableModuleControls(module);
    let planText = "";
    const values = () => fields.map((field) => ({ key: field.name, label: field.labels?.[0]?.textContent.trim() || field.name, value: field.value.trim() }));
    const invalidatePreview = () => {
      planText = "";
      preview.hidden = true;
      copyButton.disabled = true;
      printButton.disabled = true;
      preview.querySelectorAll("[data-preview-value]").forEach((value) => {
        value.textContent = "";
      });
      preview.querySelectorAll("[data-preview-row]").forEach((row) => {
        row.hidden = true;
      });
      const fallback = form.querySelector("[data-copy-fallback]");
      const fallbackField = fallback?.querySelector("textarea");
      if (fallback) fallback.hidden = true;
      if (fallbackField instanceof HTMLTextAreaElement) fallbackField.value = "";
      const hasText = fields.some((field) => field.value.trim());
      setModuleState(module, hasText ? "active" : "idle", status, hasText ? "Build a preview when you are ready." : "Complete any prompt to build a partial or complete preview.");
    };
    fields.forEach((field) => field.addEventListener("input", invalidatePreview));
    generateButton.addEventListener("click", () => {
      const entries = values();
      const completed = entries.filter((entry) => entry.value);
      if (!completed.length) {
        setModuleState(module, "error", status, "Complete at least one prompt before building a preview.");
        fields[0].focus();
        return;
      }
      entries.forEach((entry) => {
        const row = preview.querySelector(`[data-preview-row="${entry.key}"]`);
        const value = row?.querySelector("[data-preview-value]");
        if (value) value.textContent = entry.value;
        if (row) row.hidden = !entry.value;
      });
      planText = completed.map((entry) => `${entry.label}\n${entry.value}`).join("\n\n");
      preview.hidden = false;
      copyButton.disabled = false;
      printButton.disabled = false;
      setModuleState(module, "ready", status, completed.length === fields.length ? "Your complete plan is ready." : `A partial plan with ${completed.length} of ${fields.length} prompts is ready.`);
    });
    copyButton.addEventListener("click", () => {
      if (planText) copyModuleText(module, planText, status, "Plan copied to your clipboard.");
    });
    printButton.addEventListener("click", () => {
      if (!planText) return;
      document.body.dataset.printPlan = "true";
      window.addEventListener("afterprint", () => {
        delete document.body.dataset.printPlan;
      }, { once: true });
      setModuleState(module, "ready", status, "Print dialog opening. Printing may create a PDF, an operating-system print-spool file, or a physical copy.");
      window.print();
    });
    form.addEventListener("reset", () => {
      window.setTimeout(invalidatePreview, 0);
    });
    return () => {
      form.reset();
      fields.forEach((field) => {
        field.value = "";
      });
      delete document.body.dataset.printPlan;
      invalidatePreview();
    };
  };

  const initializeConsentInvite = (module) => {
    const form = module.querySelector("[data-consent-form]");
    const generateButton = form?.querySelector("[data-action='generate']");
    const copyButton = form?.querySelector("[data-action='copy']");
    const preview = form?.querySelector("[data-invite-preview]");
    const editor = form?.querySelector("[data-invite-editor]");
    const status = module.querySelector("[data-module-status]");
    if (!(form instanceof HTMLFormElement) || !(generateButton instanceof HTMLButtonElement) || !(copyButton instanceof HTMLButtonElement) || !preview || !(editor instanceof HTMLTextAreaElement)) return;

    enableModuleControls(module);
    const selections = () => ({
      role: selectedValue(form, "consent-role"),
      boundary: selectedValue(form, "consent-boundary"),
      help: selectedValue(form, "consent-help"),
    });
    const updateChoices = () => {
      const current = selections();
      const count = Object.values(current).filter(Boolean).length;
      generateButton.disabled = count < 3;
      preview.hidden = true;
      editor.value = "";
      copyButton.disabled = true;
      setModuleState(module, count ? "active" : "idle", status, count === 3 ? "All choices are set. Draft your invitation when ready." : `${count} of 3 choices set.`);
    };
    form.querySelectorAll("input[type='radio']").forEach((choice) => choice.addEventListener("change", updateChoices));
    generateButton.addEventListener("click", () => {
      const current = selections();
      if (!current.role || !current.boundary || !current.help) return;
      editor.value = `Hey — I'm taking a step to get some support. I'd like you in my corner as ${current.role}. I'm comfortable sharing ${current.boundary}. What would help most is if you could ${current.help}. Please ask before sharing this with anyone else.`;
      preview.hidden = false;
      copyButton.disabled = false;
      setModuleState(module, "ready", status, "Invitation drafted. Edit it before sharing it yourself.");
      editor.focus();
    });
    editor.addEventListener("input", () => {
      const hasText = Boolean(editor.value.trim());
      copyButton.disabled = !hasText;
      setModuleState(module, hasText ? "ready" : "active", status, hasText ? "Invitation is ready to copy." : "Edit the invitation or reset your choices.");
    });
    copyButton.addEventListener("click", () => {
      const text = editor.value.trim();
      if (text) copyModuleText(module, text, status, "Invitation copied to your clipboard.", editor);
    });
    form.addEventListener("reset", () => {
      window.setTimeout(updateChoices, 0);
    });
    return () => {
      form.reset();
      editor.value = "";
      updateChoices();
    };
  };

  const initializeReadinessCheck = (module) => {
    const form = module.querySelector("[data-readiness-form]");
    const reviewButton = form?.querySelector("[data-action='review']");
    const preview = form?.querySelector("[data-readiness-preview]");
    const summary = form?.querySelector("[data-readiness-summary]");
    const status = module.querySelector("[data-module-status]");
    if (!(form instanceof HTMLFormElement) || !(reviewButton instanceof HTMLButtonElement) || !preview || !summary) return;

    enableModuleControls(module);
    const update = () => {
      const choices = [...form.querySelectorAll("input[type='radio']:checked")];
      reviewButton.disabled = choices.length === 0;
      preview.hidden = true;
      summary.replaceChildren();
      setModuleState(module, choices.length ? "active" : "idle", status, choices.length ? `${choices.length} of 3 prompts answered. Review whenever you want.` : "Choose any answer to begin. There is no preferred result.");
    };
    form.querySelectorAll("input[type='radio']").forEach((input) => input.addEventListener("change", update));
    reviewButton.addEventListener("click", () => {
      const choices = [...form.querySelectorAll("input[type='radio']:checked")];
      if (!choices.length) {
        setModuleState(module, "error", status, "Choose at least one answer before reviewing.");
        return;
      }
      choices.forEach((choice) => {
        const item = document.createElement("li");
        const legend = choice.closest("fieldset")?.querySelector("legend")?.textContent.trim() || "Prompt";
        item.textContent = `${legend}: ${choice.value}`;
        summary.append(item);
      });
      preview.hidden = false;
      setModuleState(module, "ready", status, "Your private reflection is ready. It has no score or diagnosis.");
    });
    form.addEventListener("reset", () => window.setTimeout(update, 0));
    return () => {
      form.reset();
      update();
    };
  };

  const initializeResetCard = (module) => {
    const workspace = module.querySelector("[data-reset-card]");
    const steps = [...(workspace?.querySelectorAll("[data-reset-step]") || [])];
    const nextButton = workspace?.querySelector("[data-action='next']");
    const showAllButton = workspace?.querySelector("[data-action='show-all']");
    const resetButton = workspace?.querySelector("[data-action='reset']");
    const status = module.querySelector("[data-module-status]");
    if (!workspace || !steps.length || !(nextButton instanceof HTMLButtonElement) || !(showAllButton instanceof HTMLButtonElement) || !(resetButton instanceof HTMLButtonElement)) return;

    enableModuleControls(module);
    let visibleSteps = 0;
    const render = () => {
      steps.forEach((step, index) => {
        step.hidden = index >= visibleSteps;
      });
      const complete = visibleSteps === steps.length;
      nextButton.disabled = complete;
      nextButton.textContent = visibleSteps === 0 ? "Start the reset" : complete ? "Reset complete" : "Show next step";
      showAllButton.disabled = complete;
      resetButton.disabled = visibleSteps === 0;
      setModuleState(module, complete ? "ready" : visibleSteps ? "active" : "idle", status, complete ? "All three steps are visible. Take the time you need." : visibleSteps ? `${visibleSteps} of ${steps.length} steps visible.` : "All three steps are available. Start when you want.");
    };
    nextButton.addEventListener("click", () => {
      visibleSteps = Math.min(visibleSteps + 1, steps.length);
      render();
    });
    showAllButton.addEventListener("click", () => {
      visibleSteps = steps.length;
      render();
    });
    resetButton.addEventListener("click", () => {
      visibleSteps = 0;
      render();
    });
    render();
    return () => {
      visibleSteps = 0;
      render();
    };
  };

  const initializeScriptBuilder = (module, options) => {
    const form = module.querySelector(options.formSelector);
    const generateButton = form?.querySelector("[data-action='generate']");
    const copyButton = form?.querySelector("[data-action='copy']");
    const preview = form?.querySelector(options.previewSelector);
    const editor = form?.querySelector(options.editorSelector);
    const detail = form?.querySelector(options.detailSelector);
    const status = module.querySelector("[data-module-status]");
    if (!(form instanceof HTMLFormElement) || !(generateButton instanceof HTMLButtonElement) || !(copyButton instanceof HTMLButtonElement) || !preview || !(editor instanceof HTMLTextAreaElement) || !(detail instanceof HTMLTextAreaElement)) return;

    enableModuleControls(module);
    const selections = () => options.names.map((name) => selectedValue(form, name));
    const update = () => {
      const values = selections();
      const ready = values.every(Boolean);
      generateButton.disabled = !ready;
      preview.hidden = true;
      editor.value = "";
      copyButton.disabled = true;
      setModuleState(module, ready ? "active" : values.some(Boolean) || detail.value.trim() ? "active" : "idle", status, ready ? options.readyMessage : options.idleMessage);
    };
    form.querySelectorAll("input[type='radio']").forEach((input) => input.addEventListener("change", update));
    detail.addEventListener("input", update);
    generateButton.addEventListener("click", () => {
      const values = selections();
      if (!values.every(Boolean)) {
        setModuleState(module, "error", status, options.errorMessage);
        return;
      }
      editor.value = options.build(values, detail.value.trim());
      preview.hidden = false;
      copyButton.disabled = false;
      setModuleState(module, "ready", status, options.generatedMessage);
      editor.focus();
    });
    editor.addEventListener("input", () => {
      const hasText = Boolean(editor.value.trim());
      copyButton.disabled = !hasText;
      setModuleState(module, hasText ? "ready" : "active", status, hasText ? options.editMessage : options.readyMessage);
    });
    copyButton.addEventListener("click", () => {
      const text = editor.value.trim();
      if (text) copyModuleText(module, text, status, options.copiedMessage, editor);
    });
    form.addEventListener("reset", () => window.setTimeout(update, 0));
    return () => {
      form.reset();
      detail.value = "";
      editor.value = "";
      update();
    };
  };

  const initializeBodySignal = (module) => {
    const form = module.querySelector("[data-body-form]");
    const reviewButton = form?.querySelector("[data-action='review']");
    const preview = form?.querySelector("[data-body-preview]");
    const output = form?.querySelector("[data-body-output]");
    const status = module.querySelector("[data-module-status]");
    if (!(form instanceof HTMLFormElement) || !(reviewButton instanceof HTMLButtonElement) || !preview || !output) return;

    enableModuleControls(module);
    const update = () => {
      const signals = checkedValues(form, "body-signal");
      const responses = checkedValues(form, "body-response");
      const ready = signals.length > 0 && responses.length > 0;
      reviewButton.disabled = !ready;
      preview.hidden = true;
      output.textContent = "";
      setModuleState(module, ready ? "active" : signals.length || responses.length ? "active" : "idle", status, ready ? "A signal and possible response are selected." : "Choose a signal and a possible response to review the check-in.");
    };
    form.querySelectorAll("input[type='checkbox']").forEach((input) => input.addEventListener("change", update));
    reviewButton.addEventListener("click", () => {
      const signals = checkedValues(form, "body-signal");
      const responses = checkedValues(form, "body-response");
      if (!signals.length || !responses.length) {
        setModuleState(module, "error", status, "Choose at least one signal and one possible response.");
        return;
      }
      output.textContent = `I notice: ${signals.join(" ")} A response I could choose: ${responses.join("; ")}.`;
      preview.hidden = false;
      setModuleState(module, "ready", status, "Your check-in is ready. It does not identify a condition.");
    });
    form.addEventListener("reset", () => window.setTimeout(update, 0));
    return () => {
      form.reset();
      update();
    };
  };

  const initializeBookingQuestions = (module) => {
    const form = module.querySelector("[data-booking-form]");
    const copyButton = form?.querySelector("[data-action='copy']");
    const selectAllButton = form?.querySelector("[data-action='select-all']");
    const questions = [...(form?.querySelectorAll("[data-booking-question]") || [])];
    const status = module.querySelector("[data-module-status]");
    if (!(form instanceof HTMLFormElement) || !(copyButton instanceof HTMLButtonElement) || !(selectAllButton instanceof HTMLButtonElement) || !questions.length) return;

    enableModuleControls(module);
    const update = () => {
      const selected = questions.filter((question) => question.checked);
      copyButton.disabled = selected.length === 0;
      selectAllButton.disabled = selected.length === questions.length;
      const fallback = form.querySelector("[data-copy-fallback]");
      const fallbackField = fallback?.querySelector("textarea");
      if (fallback) fallback.hidden = true;
      if (fallbackField instanceof HTMLTextAreaElement) fallbackField.value = "";
      setModuleState(module, selected.length ? "active" : "idle", status, selected.length ? `${selected.length} of ${questions.length} questions selected.` : "Select one or more questions to copy.");
    };
    questions.forEach((question) => question.addEventListener("change", update));
    selectAllButton.addEventListener("click", () => {
      questions.forEach((question) => {
        question.checked = true;
      });
      update();
    });
    copyButton.addEventListener("click", () => {
      const text = questions.filter((question) => question.checked).map((question) => `• ${question.value}`).join("\n");
      if (text) copyModuleText(module, text, status, "Selected questions copied to your clipboard.");
    });
    form.addEventListener("reset", () => window.setTimeout(update, 0));
    return () => {
      form.reset();
      update();
    };
  };

  const moduleResetters = [];
  document.querySelectorAll(".concept-addition[data-module]").forEach((module) => {
    let resetModule;
    if (module.dataset.module === "sentence-starter") resetModule = initializeSentenceStarter(module);
    if (module.dataset.module === "first-ten-minutes") resetModule = initializeTimeline(module);
    if (module.dataset.module === "corner-standard") resetModule = initializeCornerStandard(module);
    if (module.dataset.module === "between-round-plan") resetModule = initializePlan(module);
    if (module.dataset.module === "consent-invite") resetModule = initializeConsentInvite(module);
    if (module.dataset.module === "readiness-check") resetModule = initializeReadinessCheck(module);
    if (module.dataset.module === "reset-card") resetModule = initializeResetCard(module);
    if (module.dataset.module === "support-request") resetModule = initializeScriptBuilder(module, {
      formSelector: "[data-support-form]",
      previewSelector: "[data-support-preview]",
      editorSelector: "[data-support-editor]",
      detailSelector: "[data-support-detail]",
      names: ["support-person", "support-ask"],
      idleMessage: "Choose a person and a specific ask to draft a request.",
      readyMessage: "Both choices are set. Draft the request when ready.",
      errorMessage: "Choose a person and a specific ask first.",
      generatedMessage: "Request drafted. Edit it before sharing it yourself.",
      editMessage: "Request is ready to copy.",
      copiedMessage: "Request copied to your clipboard.",
      build: ([person, ask], detail) => `Hey — I'm reaching out to ${person}. Could you ${ask}?${detail ? ` ${detail}` : ""}`,
    });
    if (module.dataset.module === "workday-boundary") resetModule = initializeScriptBuilder(module, {
      formSelector: "[data-workday-form]",
      previewSelector: "[data-workday-preview]",
      editorSelector: "[data-workday-editor]",
      detailSelector: "[data-workday-detail]",
      names: ["workday-context", "workday-boundary"],
      idleMessage: "Choose a context and starting line to draft a boundary.",
      readyMessage: "Both choices are set. Draft the boundary when ready.",
      errorMessage: "Choose a context and starting line first.",
      generatedMessage: "Boundary drafted. Edit it to fit your workplace.",
      editMessage: "Boundary is ready to copy.",
      copiedMessage: "Boundary copied to your clipboard.",
      build: ([context, boundary], detail) => `About ${context}: ${boundary}${detail ? ` ${detail}` : ""}`,
    });
    if (module.dataset.module === "body-signal") resetModule = initializeBodySignal(module);
    if (module.dataset.module === "booking-questions") resetModule = initializeBookingQuestions(module);
    if (typeof resetModule === "function") moduleResetters.push(resetModule);
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    moduleResetters.forEach((resetModule) => resetModule());
  });

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
