(function () {
  "use strict";

  const cfg = window.FORM_CONFIG || {};
  const SESSION_KEY = "lasalle_form_unlocked";
  const PASSWORD_KEY = "lasalle_form_password";
  const STAFF_KEY = "lasalle_form_staff";

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
    staffBadge: document.getElementById("staff-badge"),
    beyond30: document.getElementById("beyond-30-warning"),
    staffDatesSection: document.getElementById("staff-dates-section"),
  };

  let dirty = false;
  let saving = false;
  let sessionPassword = sessionStorage.getItem(PASSWORD_KEY) || "";
  let staffMode = sessionStorage.getItem(STAFF_KEY) === "1";
  let autoCompleteBy = true;

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

  function staffPasswordConfigured() {
    return String(cfg.STAFF_PASSWORD || "").trim();
  }

  function isStaffPassword(password) {
    const live = staffPasswordConfigured();
    if (live && String(password) === live) return true;
    if (mockMode() && String(password) === String(cfg.MOCK_STAFF_PASSWORD || "staff")) return true;
    return false;
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
    const mockStaff = cfg.MOCK_STAFF_PASSWORD || "staff";
    const okPw =
      String(body.password) === String(mockPassword) ||
      String(body.password) === String(mockStaff) ||
      (staffPasswordConfigured() && String(body.password) === staffPasswordConfigured());

    if (action === "unlock") {
      if (!okPw) {
        throw new Error("Invalid access code. (Mock mode password is in config.js)");
      }
      return { ok: true, staff: isStaffPassword(body.password) };
    }

    if (!okPw) {
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
        const wedding = normalizeDateToIso(body.wedding_date) || String(body.wedding_date).trim();
        Object.keys(store).forEach((id) => {
          const row = store[id];
          const rowWedding = normalizeDateToIso(row.wedding_date) || String(row.wedding_date || "");
          if (String(row.email || "").toLowerCase() === email && rowWedding === wedding) {
            record = row;
          }
        });
      }
      if (!record) throw new Error("No saved progress found. (Mock mode uses this browser only.)");
      return { ok: true, draft_id: record.draft_id, payload: record.payload, status: record.status };
    }

    throw new Error("Unknown action.");
  }

  /* —— Date helpers (UI MM/DD/YYYY, payload YYYY-MM-DD) —— */

  function digitsOnly(value, max) {
    const d = String(value || "").replace(/\D/g, "");
    return max ? d.slice(0, max) : d;
  }

  function formatPhoneDisplay(value) {
    const d = digitsOnly(value, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }

  function formatDateDisplay(value) {
    const d = digitsOnly(value, 8);
    if (d.length <= 2) return d;
    if (d.length <= 4) return d.slice(0, 2) + "/" + d.slice(2);
    return d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4);
  }

  function parseUsDateParts(display) {
    const m = String(display || "")
      .trim()
      .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    const year = Number(m[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
    const dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
    return { year, month, day, date: dt };
  }

  function usToIso(display) {
    const p = parseUsDateParts(display);
    if (!p) return "";
    return (
      String(p.year) +
      "-" +
      String(p.month).padStart(2, "0") +
      "-" +
      String(p.day).padStart(2, "0")
    );
  }

  function isoToUs(iso) {
    if (!iso) return "";
    const m = String(iso).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[2] + "/" + m[3] + "/" + m[1];
    if (parseUsDateParts(iso)) return formatDateDisplay(iso);
    return "";
  }

  function normalizeDateToIso(value) {
    if (!value) return "";
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const us = isoToUs(s);
      return usToIso(us) || s.slice(0, 10);
    }
    return usToIso(s);
  }

  function isValidDateValue(value) {
    return Boolean(normalizeDateToIso(value));
  }

  function addDaysIso(iso, days) {
    const p = parseUsDateParts(isoToUs(iso));
    if (!p) return "";
    const d = new Date(p.date.getTime());
    d.setDate(d.getDate() + days);
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function compareIso(a, b) {
    if (!a || !b) return 0;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function isValidPhone(value) {
    return digitsOnly(value, 15).length === 10;
  }

  function isValidNumeric(value, allowEmpty) {
    const s = String(value || "").trim();
    if (!s) return !!allowEmpty;
    return /^\d+$/.test(s);
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

  function dateDisplayOf(name) {
    if (name === "complete_by") return els.completeBy.value.trim();
    const el = els.form.elements.namedItem(name);
    if (!el || el instanceof RadioNodeList) return "";
    return String(el.value || "").trim();
  }

  function dateIsoOf(name) {
    return normalizeDateToIso(dateDisplayOf(name));
  }

  function validateIdentity() {
    clearFieldErrors();
    const data = {
      couple_name: valueOf("couple_name"),
      wedding_date: dateIsoOf("wedding_date"),
      complete_by: dateIsoOf("complete_by"),
      email: valueOf("email"),
      phone: valueOf("phone"),
    };
    const errors = {};

    if (!data.couple_name) errors.couple_name = "Enter the couple or party name.";
    if (!data.wedding_date) errors.wedding_date = "Enter a valid wedding date (MM/DD/YYYY).";
    if (!data.complete_by) errors.complete_by = "Complete-by date is missing. Ask your coordinator for a link with the deadline.";
    if (!isValidEmail(data.email)) errors.email = "Enter a valid email address.";
    if (!isValidPhone(data.phone)) errors.phone = "Enter a 10-digit phone number.";

    const optionalDates = [
      ["group_arrival", "group arrival"],
      ["group_departure", "group departure"],
      ["getting_ready_date", "getting-ready date"],
      ["bags_delivery_date", "gift bag delivery date"],
    ];
    optionalDates.forEach(([name, label]) => {
      const raw = dateDisplayOf(name);
      if (raw && !dateIsoOf(name)) errors[name] = "Enter a valid " + label + " (MM/DD/YYYY).";
    });

    const phoneOpt = valueOf("weekend_contact_phone");
    if (phoneOpt && !isValidPhone(phoneOpt)) {
      errors.weekend_contact_phone = "Enter a 10-digit phone number.";
    }

    ["getting_ready_guests", "valet_vehicles", "bags_quantity", "brunch_attendance"].forEach((name) => {
      const v = valueOf(name);
      if (v && !isValidNumeric(v, true)) errors[name] = "Enter numbers only.";
    });

    const arrival = dateIsoOf("group_arrival");
    const departure = dateIsoOf("group_departure");
    if (arrival && departure && compareIso(departure, arrival) < 0) {
      errors.group_departure = "Departure cannot be before arrival.";
    }
    if (data.wedding_date && arrival && compareIso(arrival, data.wedding_date) > 0) {
      errors.group_arrival = "Arrival is after the wedding date.";
    }
    if (data.wedding_date && departure && compareIso(departure, data.wedding_date) < 0) {
      errors.group_departure = "Departure is before the wedding date.";
    }
    const gr = dateIsoOf("getting_ready_date");
    if (data.wedding_date && gr && compareIso(gr, data.wedding_date) > 0) {
      errors.getting_ready_date = "Getting-ready date is after the wedding.";
    }
    const brunchRaw = valueOf("brunch_datetime");
    if (brunchRaw && data.wedding_date && valueOf("brunch_hosting") === "yes") {
      const brunchIso = normalizeDateToIso(brunchRaw.slice(0, 10)) || (brunchRaw.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1];
      if (brunchIso && compareIso(brunchIso, data.wedding_date) < 0) {
        errors.brunch_datetime = "Brunch date is before the wedding date.";
        const brunchField = document.querySelector('[data-field="brunch_datetime"]') || document.getElementById("brunch_datetime");
        if (brunchField && brunchField.closest) {
          const wrap = brunchField.closest(".field");
          if (wrap) wrap.classList.add("is-invalid");
        }
      }
    }

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
    const el = name === "complete_by" ? els.completeBy : els.form.elements.namedItem(name);
    if (!el || el instanceof RadioNodeList) return;

    if (el.hasAttribute && el.hasAttribute("data-date-mask")) {
      el.value = isoToUs(normalizeDateToIso(value) || value) || (parseUsDateParts(value) ? formatDateDisplay(value) : "");
      return;
    }
    if (el.hasAttribute && el.hasAttribute("data-phone-mask")) {
      el.value = formatPhoneDisplay(value);
      return;
    }
    el.value = value;
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
      "email",
      "phone",
      "wedding_venue",
      "ceremony_time",
      "reception_venue",
      "reception_time",
      "weekend_contact_name",
      "weekend_contact_phone",
      "anticipated_rooms",
      "couple_accommodations",
      "getting_ready_needed",
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
      "bags_delivery_time",
      "bags_deliverer",
      "bags_distribution",
      "brunch_hosting",
      "brunch_datetime",
      "brunch_attendance",
      "brunch_menu_submitted",
      "brunch_requests",
    ];

    const payload = {
      complete_by: dateIsoOf("complete_by"),
      wedding_date: dateIsoOf("wedding_date"),
      group_arrival: dateIsoOf("group_arrival"),
      group_departure: dateIsoOf("group_departure"),
      getting_ready_date: dateIsoOf("getting_ready_date"),
      bags_delivery_date: dateIsoOf("bags_delivery_date"),
      date_room_cutoff: dateIsoOf("date_room_cutoff"),
      date_menu_due: dateIsoOf("date_menu_due"),
      date_vendor_list: dateIsoOf("date_vendor_list"),
      date_gift_bag: dateIsoOf("date_gift_bag"),
      date_getting_ready: dateIsoOf("date_getting_ready"),
    };

    fields.forEach((name) => {
      let v = valueOf(name);
      if (name === "phone" || name === "weekend_contact_phone" || name === "transport_contact") {
        const d = digitsOnly(v, 10);
        v = d.length === 10 ? formatPhoneDisplay(d) : v;
      }
      payload[name] = v;
    });
    payload.vendors = collectVendors();
    return payload;
  }

  function applyPayload(payload) {
    if (!payload || typeof payload !== "object") return;
    autoCompleteBy = false;
    Object.keys(payload).forEach((key) => {
      if (key === "vendors") return;
      setValue(key, payload[key]);
    });
    els.vendorRows.innerHTML = "";
    const vendors = Array.isArray(payload.vendors) ? payload.vendors : [];
    if (vendors.length === 0) addVendorRow();
    else vendors.forEach((v) => addVendorRow(v));
    syncConditionals();
    updateBeyond30Warning();
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

  function updateBeyond30Warning() {
    const wedding = dateIsoOf("wedding_date");
    const complete = dateIsoOf("complete_by");
    if (!wedding || !complete || !els.beyond30) {
      if (els.beyond30) els.beyond30.hidden = true;
      return;
    }
    const cutoff = addDaysIso(wedding, -30);
    els.beyond30.hidden = !(cutoff && compareIso(complete, cutoff) > 0);
  }

  function maybeAutoCompleteBy() {
    if (!autoCompleteBy && els.completeBy.value.trim()) {
      updateBeyond30Warning();
      return;
    }
    const wedding = dateIsoOf("wedding_date");
    if (!wedding) {
      updateBeyond30Warning();
      return;
    }
    if (!els.completeBy.value.trim() || autoCompleteBy) {
      els.completeBy.value = isoToUs(addDaysIso(wedding, -30));
      autoCompleteBy = true;
    }
    updateBeyond30Warning();
  }

  function applyStaffUi() {
    document.querySelectorAll("[data-staff-only]").forEach((el) => {
      el.hidden = !staffMode;
    });
    if (els.staffBadge) els.staffBadge.hidden = !staffMode;
    if (els.completeBy) {
      els.completeBy.readOnly = !staffMode;
      els.completeBy.classList.toggle("is-readonly", !staffMode);
    }
  }

  function setStaffMode(on) {
    staffMode = !!on;
    sessionStorage.setItem(STAFF_KEY, staffMode ? "1" : "0");
    applyStaffUi();
  }

  function applyInviteParams() {
    const params = new URLSearchParams(window.location.search);
    const wedding = params.get("wedding_date");
    const complete = params.get("complete_by");
    if (wedding) {
      const iso = normalizeDateToIso(wedding);
      if (iso) setValue("wedding_date", iso);
    }
    if (complete) {
      const iso = normalizeDateToIso(complete);
      if (iso) {
        setValue("complete_by", iso);
        autoCompleteBy = false;
      }
    } else if (wedding) {
      autoCompleteBy = true;
      maybeAutoCompleteBy();
    }
    updateBeyond30Warning();
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
    applyStaffUi();
    applyInviteParams();
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
      const data = await api("unlock", { password });
      sessionPassword = password;
      sessionStorage.setItem(PASSWORD_KEY, password);
      setStaffMode(data.staff === true || isStaffPassword(password));
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
    const weddingRaw = document.getElementById("resume-wedding-date").value;
    const wedding_date = normalizeDateToIso(weddingRaw);

    let ok = true;
    if (!password) {
      showFieldError("password", "Enter the access code.");
      ok = false;
    }
    if (!isValidEmail(email)) {
      showFieldError("resume_email", "Enter a valid email.");
      ok = false;
    }
    if (!wedding_date) {
      showFieldError("resume_wedding_date", "Enter a valid wedding date (MM/DD/YYYY).");
      ok = false;
    }
    if (!ok) return;

    try {
      const data = await api("loadDraft", { password, email, wedding_date });
      sessionPassword = password;
      sessionStorage.setItem(PASSWORD_KEY, password);
      setStaffMode(isStaffPassword(password));
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
    updateBeyond30Warning();
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
        staff: staffMode,
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
    updateBeyond30Warning();
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
        staff: staffMode,
      });
      dirty = false;
      showThanks(data.draft_id);
    } catch (err) {
      setStatus(err.message, "is-error");
    } finally {
      saving = false;
    }
  }

  function wireMasks() {
    document.querySelectorAll("[data-phone-mask]").forEach((input) => {
      input.addEventListener("input", () => {
        const start = input.selectionStart;
        const before = input.value;
        input.value = formatPhoneDisplay(input.value);
        if (document.activeElement === input && typeof start === "number") {
          const diff = input.value.length - before.length;
          const pos = Math.max(0, start + diff);
          try {
            input.setSelectionRange(pos, pos);
          } catch {
            /* ignore */
          }
        }
        markDirty();
      });
    });

    document.querySelectorAll("[data-date-mask]").forEach((input) => {
      input.addEventListener("input", () => {
        input.value = formatDateDisplay(input.value);
        if (input === els.completeBy) autoCompleteBy = false;
        if (input.id === "wedding_date") maybeAutoCompleteBy();
        else updateBeyond30Warning();
        markDirty();
      });
      input.addEventListener("blur", () => {
        const iso = normalizeDateToIso(input.value);
        if (input.value.trim() && !iso) {
          input.classList.add("is-invalid");
        } else if (iso) {
          input.value = isoToUs(iso);
          input.classList.remove("is-invalid");
        }
        updateBeyond30Warning();
      });
    });

    document.querySelectorAll("[data-numeric]").forEach((input) => {
      input.addEventListener("input", () => {
        input.value = digitsOnly(input.value);
        markDirty();
      });
    });
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
    els.form.addEventListener("input", (e) => {
      if (e.target && (e.target.hasAttribute("data-phone-mask") || e.target.hasAttribute("data-date-mask") || e.target.hasAttribute("data-numeric"))) {
        return;
      }
      markDirty();
    });
    els.form.addEventListener("change", markDirty);
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
    wireMasks();
    applyStaffUi();

    if (mockMode()) {
      setGateStatus(
        'Preview mode — guest "' +
          (cfg.MOCK_PASSWORD || "preview") +
          '", staff "' +
          (cfg.MOCK_STAFF_PASSWORD || "staff") +
          '".',
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
      setStaffMode(sessionStorage.getItem(STAFF_KEY) === "1" || isStaffPassword(sessionPassword));
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
