(function () {
  "use strict";

  const cfg = window.FORM_CONFIG || {};
  const SESSION_KEY = "lasalle_form_unlocked";
  const PASSWORD_KEY = "lasalle_form_password";

  const els = {
    gate: document.getElementById("gate"),
    app: document.getElementById("app"),
    thanks: document.getElementById("thanks"),
    thanksDraft: document.getElementById("thanks-draft"),
    unlockForm: document.getElementById("unlock-form"),
    resumeForm: document.getElementById("resume-form"),
    resumePanel: document.getElementById("resume-panel"),
    showResume: document.getElementById("show-resume"),
    gateStatus: document.getElementById("gate-status"),
    accessPassword: document.getElementById("access-password"),
    form: document.getElementById("wedding-form"),
    saveStatus: document.getElementById("save-status"),
    saveBtn: document.getElementById("save-btn"),
    submitBtn: document.getElementById("submit-btn"),
    saveBtnFooter: document.getElementById("save-btn-footer"),
    submitBtnFooter: document.getElementById("submit-btn-footer"),
    vendorRows: document.getElementById("vendor-rows"),
    addVendor: document.getElementById("add-vendor"),
    vendorTemplate: document.getElementById("vendor-row-template"),
    draftId: document.getElementById("draft_id"),
    completeBy: document.getElementById("complete_by"),
    formTitle: document.getElementById("form-title"),
    introBefore: document.getElementById("intro-before"),
    introAfter: document.getElementById("intro-after"),
  };

  let dirty = false;
  let saving = false;
  let sessionPassword = sessionStorage.getItem(PASSWORD_KEY) || "";

  function apiConfigured() {
    return (
      cfg.API_URL &&
      !cfg.API_URL.includes("PASTE_POWER_AUTOMATE") &&
      !cfg.API_URL.includes("PASTE_APPS_SCRIPT")
    );
  }

  function mockMode() {
    return cfg.MOCK_MODE === true;
  }

  function mockStoreKey() {
    return "lasalle_form_mock_drafts";
  }

  function readMockStore() {
    try {
      return JSON.parse(localStorage.getItem(mockStoreKey()) || "{}");
    } catch {
      return {};
    }
  }

  function writeMockStore(store) {
    localStorage.setItem(mockStoreKey(), JSON.stringify(store));
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "draft-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  async function mockApi(action, body) {
    const mockPassword = cfg.MOCK_PASSWORD || "preview";

    if (action === "unlock") {
      if (String(body.password) !== String(mockPassword)) {
        throw new Error("Invalid access code. (Mock mode password is in config.js)");
      }
      return { ok: true };
    }

    if (String(body.password) !== String(mockPassword)) {
      throw new Error("Invalid access code.");
    }

    const store = readMockStore();

    if (action === "saveDraft" || action === "submitFinal") {
      const payload = body.payload || {};
      const draftId = body.draft_id || uuid();
      store[draftId] = {
        draft_id: draftId,
        status: action === "submitFinal" ? "submitted" : "draft",
        payload: payload,
        email: payload.email,
        wedding_date: payload.wedding_date,
      };
      writeMockStore(store);
      return { ok: true, draft_id: draftId };
    }

    if (action === "loadDraft") {
      let record = null;
      if (body.draft_id && store[body.draft_id]) {
        record = store[body.draft_id];
      } else if (body.email && body.wedding_date) {
        const email = String(body.email).trim().toLowerCase();
        const wedding = String(body.wedding_date).trim();
        Object.keys(store).forEach((id) => {
          const row = store[id];
          if (
            String(row.email || "").toLowerCase() === email &&
            String(row.wedding_date || "") === wedding
          ) {
            record = row;
          }
        });
      }
      if (!record) throw new Error("No saved progress found. (Mock mode uses this browser only.)");
      return { ok: true, draft_id: record.draft_id, payload: record.payload, status: record.status };
    }

    throw new Error("Unknown action.");
  }

  function setStatus(message, kind) {
    els.saveStatus.textContent = message;
    els.saveStatus.classList.remove("is-error", "is-ok");
    if (kind) els.saveStatus.classList.add(kind);
  }

  function setGateStatus(message, kind) {
    els.gateStatus.textContent = message || "";
    els.gateStatus.classList.remove("is-error", "is-ok");
    if (kind) els.gateStatus.classList.add(kind);
  }

  function clearFieldErrors() {
    document.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
    });
    document.querySelectorAll(".field.is-invalid").forEach((el) => {
      el.classList.remove("is-invalid");
    });
    els.completeBy.classList.remove("is-invalid");
  }

  function showFieldError(name, message) {
    const errorEl = document.querySelector(`[data-error-for="${name}"]`);
    const field = document.querySelector(`[data-field="${name}"]`);
    if (errorEl) errorEl.textContent = message;
    if (field) field.classList.add("is-invalid");
    if (name === "complete_by") els.completeBy.classList.add("is-invalid");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function isValidPhone(value) {
    const digits = String(value).replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return false;
    return /^[+]?[\d\s().-]{10,20}$/.test(String(value).trim());
  }

  function isValidDate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + "T00:00:00");
    return !Number.isNaN(d.getTime());
  }

  function validateIdentity() {
    clearFieldErrors();
    const data = {
      couple_name: valueOf("couple_name"),
      wedding_date: valueOf("wedding_date"),
      complete_by: els.completeBy.value.trim(),
      email: valueOf("email"),
      phone: valueOf("phone"),
    };
    const errors = {};

    if (!data.couple_name) errors.couple_name = "Enter the couple or party name.";
    if (!isValidDate(data.wedding_date)) errors.wedding_date = "Enter a valid wedding date.";
    if (!isValidDate(data.complete_by)) errors.complete_by = "Enter a valid complete-by date in the intro.";
    if (!isValidEmail(data.email)) errors.email = "Enter a valid email address.";
    if (!isValidPhone(data.phone)) errors.phone = "Enter a valid phone number (at least 10 digits).";

    Object.keys(errors).forEach((key) => showFieldError(key, errors[key]));
    return { ok: Object.keys(errors).length === 0, data, errors };
  }

  function valueOf(name) {
    const el = els.form.elements.namedItem(name);
    if (!el) return "";
    if (el instanceof RadioNodeList || (el.length && el[0] && el[0].type === "radio")) {
      const checked = els.form.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : "";
    }
    return String(el.value || "").trim();
  }

  function setValue(name, value) {
    if (value == null) value = "";
    const radios = els.form.querySelectorAll(`input[type="radio"][name="${name}"]`);
    if (radios.length) {
      radios.forEach((r) => {
        r.checked = r.value === value;
      });
      radios[0].dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const el = els.form.elements.namedItem(name);
    if (el) el.value = value;
  }

  function collectVendors() {
    return Array.from(els.vendorRows.querySelectorAll("[data-vendor-row]")).map((row) => ({
      company: row.querySelector('[data-vendor="company"]').value.trim(),
      service: row.querySelector('[data-vendor="service"]').value.trim(),
      access: row.querySelector('[data-vendor="access"]').value.trim(),
    }));
  }

  function addVendorRow(data) {
    const node = els.vendorTemplate.content.cloneNode(true);
    const row = node.querySelector("[data-vendor-row]");
    if (data) {
      row.querySelector('[data-vendor="company"]').value = data.company || "";
      row.querySelector('[data-vendor="service"]').value = data.service || "";
      row.querySelector('[data-vendor="access"]').value = data.access || "";
    }
    row.querySelector("[data-remove-vendor]").addEventListener("click", () => {
      row.remove();
      markDirty();
    });
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", markDirty);
    });
    els.vendorRows.appendChild(row);
  }

  function collectPayload() {
    const fields = [
      "couple_name",
      "wedding_date",
      "email",
      "phone",
      "wedding_venue",
      "ceremony_time",
      "reception_venue",
      "reception_time",
      "group_arrival",
      "group_departure",
      "weekend_contact_name",
      "weekend_contact_phone",
      "anticipated_rooms",
      "couple_accommodations",
      "getting_ready_needed",
      "getting_ready_date",
      "getting_ready_guests",
      "getting_ready_access",
      "vip_names",
      "accessibility",
      "transport_company",
      "transport_contact",
      "transport_vehicles",
      "transport_first_pickup",
      "transport_additional",
      "transport_return",
      "transport_venue",
      "valet_needed",
      "valet_payment",
      "valet_other",
      "valet_vehicles",
      "valet_billing_contact",
      "valet_billing_instructions",
      "bags_providing",
      "bags_quantity",
      "bags_delivery_date",
      "bags_delivery_time",
      "bags_deliverer",
      "bags_distribution",
      "brunch_hosting",
      "brunch_datetime",
      "brunch_attendance",
      "brunch_menu_submitted",
      "brunch_requests",
      "date_room_cutoff",
      "date_menu_due",
      "date_vendor_list",
      "date_gift_bag",
      "date_getting_ready",
      "date_shuttle",
      "date_brunch",
    ];

    const payload = { complete_by: els.completeBy.value.trim() };
    fields.forEach((name) => {
      payload[name] = valueOf(name);
    });
    payload.vendors = collectVendors();
    return payload;
  }

  function applyPayload(payload) {
    if (!payload || typeof payload !== "object") return;
    Object.keys(payload).forEach((key) => {
      if (key === "vendors") return;
      if (key === "complete_by") {
        els.completeBy.value = payload.complete_by || "";
        return;
      }
      setValue(key, payload[key]);
    });
    els.vendorRows.innerHTML = "";
    const vendors = Array.isArray(payload.vendors) ? payload.vendors : [];
    if (vendors.length === 0) addVendorRow();
    else vendors.forEach((v) => addVendorRow(v));
    syncConditionals();
    dirty = false;
  }

  function syncConditionals() {
    toggle("getting-ready-details", valueOf("getting_ready_needed") === "yes");
    toggle("valet-details", valueOf("valet_needed") === "yes");
    toggle("bags-details", valueOf("bags_providing") === "yes");
    toggle("brunch-details", valueOf("brunch_hosting") === "yes");
  }

  function toggle(id, show) {
    const el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  function markDirty() {
    dirty = true;
    if (els.saveStatus.textContent === "All changes saved" || els.saveStatus.classList.contains("is-ok")) {
      setStatus("Unsaved changes", null);
    }
  }

  async function api(action, body) {
    if (mockMode()) {
      return mockApi(action, body);
    }

    if (!apiConfigured()) {
      throw new Error(
        "API_URL is not configured yet. Paste your Power Automate HTTP URL into config.js (or turn on MOCK_MODE)."
      );
    }

    const res = await fetch(cfg.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...body }),
      redirect: "follow",
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Unexpected response from server. Check Power Automate deployment and Response action.");
    }
    if (!data.ok) {
      throw new Error(formatApiError(data, res.status));
    }
    return data;
  }

  function formatApiError(data, status) {
    const err = data && data.error;
    if (typeof err === "string" && err.trim()) return err;
    if (err && typeof err === "object") {
      if (typeof err.message === "string" && err.message.trim()) return err.message;
      if (typeof err.code === "string" && err.code.trim()) {
        return err.message ? `${err.code}: ${err.message}` : err.code;
      }
      try {
        return JSON.stringify(err);
      } catch {
        /* fall through */
      }
    }
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (status && status >= 400) return `Request failed (HTTP ${status}). Check Power Automate run history.`;
    return "Request failed. Check Power Automate run history.";
  }

  function unlockUi() {
    sessionStorage.setItem(SESSION_KEY, "1");
    els.gate.hidden = true;
    els.app.hidden = false;
    els.app.classList.remove("is-locked");
  }

  function showThanks(draftId) {
    els.app.hidden = true;
    els.gate.hidden = true;
    els.thanks.hidden = false;
    els.thanksDraft.textContent = draftId ? `Reference: ${draftId}` : "";
  }

  async function handleUnlock(event) {
    event.preventDefault();
    setGateStatus("");
    const password = els.accessPassword.value;
    if (!password) {
      showFieldError("password", "Enter the access code.");
      return;
    }
    els.unlockForm.querySelector('[data-error-for="password"]').textContent = "";
    try {
      await api("unlock", { password });
      sessionPassword = password;
      sessionStorage.setItem(PASSWORD_KEY, password);
      unlockUi();
      const params = new URLSearchParams(window.location.search);
      const draft = params.get("draft");
      if (draft) await loadDraftById(draft);
    } catch (err) {
      setGateStatus(err.message, "is-error");
    }
  }

  async function loadDraftById(draftId) {
    try {
      setStatus("Loading saved progress…");
      const data = await api("loadDraft", {
        password: sessionPassword,
        draft_id: draftId,
      });
      els.draftId.value = data.draft_id || draftId;
      applyPayload(data.payload);
      setStatus("Loaded saved progress", "is-ok");
      dirty = false;
    } catch (err) {
      setStatus(err.message, "is-error");
    }
  }

  async function handleResume(event) {
    event.preventDefault();
    setGateStatus("");
    const password = els.accessPassword.value;
    const email = document.getElementById("resume-email").value.trim();
    const wedding_date = document.getElementById("resume-wedding-date").value;

    let ok = true;
    if (!password) {
      showFieldError("password", "Enter the access code.");
      ok = false;
    }
    if (!isValidEmail(email)) {
      showFieldError("resume_email", "Enter a valid email.");
      ok = false;
    }
    if (!isValidDate(wedding_date)) {
      showFieldError("resume_wedding_date", "Enter a valid wedding date.");
      ok = false;
    }
    if (!ok) return;

    try {
      const data = await api("loadDraft", { password, email, wedding_date });
      sessionPassword = password;
      sessionStorage.setItem(PASSWORD_KEY, password);
      unlockUi();
      els.draftId.value = data.draft_id || "";
      applyPayload(data.payload);
      if (data.draft_id) {
        const url = new URL(window.location.href);
        url.searchParams.set("draft", data.draft_id);
        window.history.replaceState({}, "", url.toString());
      }
      setStatus("Loaded saved progress", "is-ok");
    } catch (err) {
      setGateStatus(err.message, "is-error");
    }
  }

  async function saveDraft() {
    if (saving) return null;
    const validation = validateIdentity();
    if (!validation.ok) {
      setStatus("Fix the highlighted fields before saving.", "is-error");
      const first = document.querySelector(".field.is-invalid, .intro-date.is-invalid");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }

    saving = true;
    setStatus("Saving…");
    try {
      const payload = collectPayload();
      const data = await api("saveDraft", {
        password: sessionPassword,
        draft_id: els.draftId.value || undefined,
        payload,
        form_url: window.location.origin + window.location.pathname,
      });
      els.draftId.value = data.draft_id;
      dirty = false;
      const url = new URL(window.location.href);
      url.searchParams.set("draft", data.draft_id);
      window.history.replaceState({}, "", url.toString());
      const when = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setStatus(
        mockMode()
          ? `Saved ${when} (mock mode — this browser only).`
          : `Saved ${when}. Check your email for a resume link.`,
        "is-ok"
      );
      return data;
    } catch (err) {
      setStatus(err.message, "is-error");
      return null;
    } finally {
      saving = false;
    }
  }

  async function submitFinal() {
    const validation = validateIdentity();
    if (!validation.ok) {
      setStatus("Fix the highlighted fields before submitting.", "is-error");
      const first = document.querySelector(".field.is-invalid, .intro-date.is-invalid");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!window.confirm("Submit your final room block details? You can still contact your coordinator with updates afterward.")) {
      return;
    }

    saving = true;
    setStatus("Submitting…");
    try {
      const payload = collectPayload();
      const data = await api("submitFinal", {
        password: sessionPassword,
        draft_id: els.draftId.value || undefined,
        payload,
        form_url: window.location.origin + window.location.pathname,
      });
      dirty = false;
      showThanks(data.draft_id);
    } catch (err) {
      setStatus(err.message, "is-error");
    } finally {
      saving = false;
    }
  }

  function wireConditionals() {
    ["getting_ready_needed", "valet_needed", "bags_providing", "brunch_hosting"].forEach((name) => {
      els.form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
        input.addEventListener("change", () => {
          syncConditionals();
          markDirty();
        });
      });
    });
  }

  function wireDirtyTracking() {
    els.form.addEventListener("input", markDirty);
    els.form.addEventListener("change", markDirty);
    els.completeBy.addEventListener("input", markDirty);
    els.completeBy.addEventListener("change", markDirty);
  }

  function applyConfigCopy() {
    if (cfg.TITLE) {
      els.formTitle.textContent = cfg.TITLE;
      document.title = cfg.TITLE + " | The LaSalle Chicago";
    }
    if (cfg.INTRO_BEFORE) els.introBefore.textContent = cfg.INTRO_BEFORE;
    if (cfg.INTRO_AFTER) els.introAfter.textContent = cfg.INTRO_AFTER;
  }

  function init() {
    applyConfigCopy();
    addVendorRow();
    wireConditionals();
    wireDirtyTracking();

    if (mockMode()) {
      setGateStatus(
        'Preview mode on — unlock with password "' + (cfg.MOCK_PASSWORD || "preview") + '".',
        "is-ok"
      );
    }

    els.unlockForm.addEventListener("submit", handleUnlock);
    els.resumeForm.addEventListener("submit", handleResume);
    els.showResume.addEventListener("click", () => {
      els.resumePanel.hidden = !els.resumePanel.hidden;
    });
    els.addVendor.addEventListener("click", () => {
      addVendorRow();
      markDirty();
    });
    els.saveBtn.addEventListener("click", () => saveDraft());
    els.saveBtnFooter.addEventListener("click", () => saveDraft());
    els.submitBtn.addEventListener("click", submitFinal);
    els.submitBtnFooter.addEventListener("click", submitFinal);

    window.addEventListener("beforeunload", (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    });

    const already = sessionStorage.getItem(SESSION_KEY) === "1" && sessionPassword;
    if (already) {
      unlockUi();
      const draft = new URLSearchParams(window.location.search).get("draft");
      if (draft) loadDraftById(draft);
    } else {
      els.app.hidden = true;
      els.gate.hidden = false;
    }
  }

  init();
})();
