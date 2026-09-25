/* ============================================================
   APEX MOTORS — stocks page
   filter drawer · chips · sorting · featured strip · 200-card grid
   ============================================================ */
(function () {
  "use strict";
  var APEX = window.APEX;
  var STOCK = APEX.STOCK;

  /* ---------------- helpers ---------------- */
  function fmtRM(n) { return "RM " + n.toLocaleString("en-MY"); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function $(id) { return document.getElementById(id); }

  /* ---------------- option lists (per spec) ---------------- */
  function range(a, b, step) { var o = []; for (var i = a; i <= b; i += step) o.push(i); return o; }

  var PRICE_MIN = [""].concat(range(10000, 100000, 10000), range(200000, 1000000, 100000));
  var PRICE_MAX = [""].concat(range(10000, 100000, 10000), range(200000, 1000000, 100000), range(2000000, 20000000, 1000000));
  var MILEAGE = [""].concat(range(1000, 10000, 1000), range(15000, 100000, 5000), range(150000, 1000000, 50000));
  var YEARS = ["pre"].concat(range(1996, 2026, 1));

  function priceLabel(v) { return v === "" ? null : "RM " + Number(v).toLocaleString("en-MY"); }
  function milLabel(v, isMax) {
    if (v === "") return null;
    if (Number(v) === 1000000) return "1,000,000+";
    return Number(v).toLocaleString("en-MY");
  }
  function yearLabel(v) { return v === "pre" ? "Before 1995" : v; }

  var COND_LABEL = { "slightly used": "Slightly Used", "used": "Used", "recon": "Recon" };

  /* ---------------- state ---------------- */
  var state = {
    priceMin: null, priceMax: null,
    bodies: [],
    milMin: null, milMax: null,
    conds: [],
    yearMin: null, yearMax: null,
    fuels: [], trans: [],
    brands: [], models: []
  };

  /* ---------------- elements ---------------- */
  var el = {
    priceMin: $("fPriceMin"), priceMax: $("fPriceMax"),
    milMin: $("fMilMin"), milMax: $("fMilMax"),
    yearMin: $("fYearMin"), yearMax: $("fYearMax"),
    body: $("fBody"), cond: $("fCond"), fuel: $("fFuel"), trans: $("fTrans"),
    brand: $("fBrand"), brandSearch: $("fBrandSearch"), model: $("fModel"), modelWrap: $("fModelWrap"),
    chipBar: $("chipBar"), sortSel: $("sortSel"),
    grid: $("vgrid"), count: $("resultCount"), empty: $("emptyState"),
    feat: $("featTrack"),
    drawer: $("filterDrawer"), veil: $("drawerVeil")
  };

  /* ---------------- small icons for cards ---------------- */
  var CAM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v9h-2a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H4Z"/></svg>';
  var I = {
    cal: '<svg viewBox="0 0 24 24"><path d="M7 2h2v2h6V2h2v2h2a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2Zm-1 7v9h12V9Z"/></svg>',
    gauge: '<svg viewBox="0 0 24 24"><path d="M12 4a9 9 0 0 1 9 9h-2.1A6.9 6.9 0 1 0 5.1 13H3a9 9 0 0 1 9-9Zm5.6 3.6 1.5 1.5-5.8 5.8a2.1 2.1 0 1 1-1.5-1.5Z"/></svg>',
    fuel: '<svg viewBox="0 0 24 24"><path d="M5 3h9a1 1 0 0 1 1 1v17H4V4a1 1 0 0 1 1-1Zm1 3v5h7V6Zm10.3 1.2 2.2 2.2a1 1 0 0 1 .3.7V18a1.6 1.6 0 0 1-3.2 0v-4.2H15v-2h1.6v-2.2Z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill-rule="evenodd"><path d="M12 2.4 13 5a7.3 7.3 0 0 1 2.2.9L17.8 5l2.1 2.1-.9 2.6c.4.7.7 1.4.9 2.2l2.6 1-0 2.2-2.6.6a7.3 7.3 0 0 1-.9 2.2l.9 2.6-2.1 2.1-2.6-.9c-.7.4-1.4.7-2.2.9l-.6 2.4h-2.2l-.6-2.4a7.3 7.3 0 0 1-2.2-.9l-2.6.9L4.1 18l.9-2.6a7.3 7.3 0 0 1-.9-2.2L1.7 12.6l0-2.2 2.4-.6c.2-.8.5-1.5.9-2.2L4.1 5 6.2 2.9l2.6.9a7.3 7.3 0 0 1 2.2-.9ZM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z"/></svg>'
  };

  /* ============================================================
     SELECT BUILDING with min/max cross-guarding
     (a minimum hides any maximum option that is not higher,
      and vice versa — for price, mileage and year)
     ============================================================ */
  function fillSelect(sel, values, labelFn, current, noneLabel) {
    var html = "";
    values.forEach(function (v) {
      html += '<option value="' + v + '"' + (String(current) === String(v) && current !== null ? " selected" : "") + ">" +
        (v === "" ? noneLabel : labelFn(v)) + "</option>";
    });
    sel.innerHTML = html;
    if (current === null) sel.value = "";
  }

  function rebuildSelects() {
    var s = state;

    /* price */
    var pminOpts = PRICE_MIN.filter(function (v) { return v === "" || s.priceMax === null || Number(v) < s.priceMax; });
    var pmaxOpts = PRICE_MAX.filter(function (v) { return v === "" || s.priceMin === null || Number(v) > s.priceMin; });
    fillSelect(el.priceMin, pminOpts, priceLabel, s.priceMin, "No minimum");
    fillSelect(el.priceMax, pmaxOpts, priceLabel, s.priceMax, "No maximum");

    /* mileage — max value 1,000,000+ counts as unlimited */
    var mminOpts = MILEAGE.filter(function (v) { return v === "" || s.milMax === null || Number(v) < s.milMax; });
    var mmaxOpts = MILEAGE.filter(function (v) { return v === "" || s.milMin === null || (Number(v) === 1000000 ? true : Number(v) > s.milMin); });
    fillSelect(el.milMin, mminOpts, milLabel, s.milMin, "No minimum");
    fillSelect(el.milMax, mmaxOpts, milLabel, s.milMax, "No maximum");

    /* year */
    var ynumMax = s.yearMax === null ? null : (s.yearMax === "pre" ? 1994 : Number(s.yearMax));
    var ynumMin = s.yearMin === null ? null : (s.yearMin === "pre" ? 1900 : Number(s.yearMin));
    var yminOpts = YEARS.filter(function (v) { var n = v === "pre" ? 1900 : Number(v); return ynumMax === null || n < ynumMax; });
    var ymaxOpts = YEARS.filter(function (v) { var n = v === "pre" ? 1994 : Number(v); return ynumMin === null || n > ynumMin; });
    fillSelect(el.yearMin, yminOpts, yearLabel, s.yearMin, "Before 1995 (any)");
    fillSelect(el.yearMax, ymaxOpts, yearLabel, s.yearMax, "No maximum");
  }

  /* ============================================================
     STATIC CHIPSETS — body / condition / fuel / transmission / brand / model
     ============================================================ */
  function chipOpt(name, value, label, desc) {
    return '<label class="fchip-opt' + (desc ? " wide" : "") + '"><input type="checkbox" name="' + name + '" value="' + esc(value) + '">' +
      "<span>" + esc(label) + (desc ? "<small>" + esc(desc) + "</small>" : "") + "</span></label>";
  }

  el.body.innerHTML = APEX.BODY_TYPES.map(function (b) {
    return chipOpt("body", b, b === "MPV" ? "MPV (6 seater +)" : b);
  }).join("");

  el.cond.innerHTML = APEX.CONDITIONS.map(function (c) {
    return chipOpt("cond", c, COND_LABEL[c], APEX.CONDITION_HINT[c] || null);
  }).join("");

  el.fuel.innerHTML = APEX.FUELS.map(function (f) { return chipOpt("fuel", f, f); }).join("");
  el.trans.innerHTML = APEX.TRANS.map(function (t) { return chipOpt("trans", t, t); }).join("");

  /* Brand filter = searchable multi-select checkboxes.
     Typing matches brand names AND the models they carry. */
  function brandChipHTML(b, checked) {
    return '<label class="fchip-opt"><input type="checkbox" name="brand" value="' + esc(b) + '"' +
      (checked ? " checked" : "") + "><span>" + esc(b) + "</span></label>";
  }
  function renderBrandChips(q) {
    q = (q || "").trim().toLowerCase();
    var list = APEX.BRAND_NAMES.filter(function (b) {
      if (!q) return true;
      if (b.toLowerCase().indexOf(q) > -1) return true;
      return (APEX.MODELS[b] || []).some(function (m) { return m.toLowerCase().indexOf(q) > -1; });
    });
    el.brand.innerHTML = list.length
      ? list.map(function (b) { return brandChipHTML(b, state.brands.indexOf(b) > -1); }).join("")
      : '<span class="chips-empty">No brand or model matches "' + esc(q) + '"</span>';
  }
  renderBrandChips("");
  el.brandSearch.addEventListener("input", function () { renderBrandChips(el.brandSearch.value); });

  /* Models of ALL selected brands; prefix with the brand when several are picked */
  function buildModelChips() {
    if (!state.brands.length) { el.modelWrap.hidden = true; el.model.innerHTML = ""; return; }
    el.modelWrap.hidden = false;
    var multi = state.brands.length > 1, html = "";
    state.brands.forEach(function (b) {
      (APEX.MODELS[b] || []).forEach(function (m) {
        var checked = state.models.indexOf(m) > -1 ? " checked" : "";
        html += '<label class="fchip-opt"><input type="checkbox" name="model" value="' + esc(m) + '"' + checked + "><span>" +
          (multi ? esc(b) + " &middot; " : "") + esc(m) + "</span></label>";
      });
    });
    el.model.innerHTML = html;
  }

  function syncCheckboxes(container, arr) {
    container.querySelectorAll("input[type=checkbox]").forEach(function (cb) {
      cb.checked = arr.indexOf(cb.value) > -1;
    });
  }

  function syncControls() {
    rebuildSelects();
    syncCheckboxes(el.body, state.bodies);
    syncCheckboxes(el.cond, state.conds);
    syncCheckboxes(el.fuel, state.fuels);
    syncCheckboxes(el.trans, state.trans);
    renderBrandChips(el.brandSearch.value);
    buildModelChips();
  }

  /* ============================================================
     MATCHING + SORTING
     ============================================================ */
  function matches(v) {
    var s = state;
    if (s.priceMin !== null && v.price < s.priceMin) return false;
    if (s.priceMax !== null && v.price > s.priceMax) return false;
    if (s.bodies.length && s.bodies.indexOf(v.body) < 0) return false;
    if (s.milMin !== null && v.km < s.milMin) return false;
    if (s.milMax !== null && s.milMax < 1000000 && v.km > s.milMax) return false;
    if (s.conds.length && s.conds.indexOf(v.condition) < 0) return false;
    if (s.yearMin !== null && s.yearMin !== "pre" && v.year < Number(s.yearMin)) return false;
    if (s.yearMax !== null) {
      if (s.yearMax === "pre") { if (v.year > 1994) return false; }
      else if (v.year > Number(s.yearMax)) return false;
    }
    if (s.fuels.length && s.fuels.indexOf(v.fuel) < 0) return false;
    if (s.trans.length && s.trans.indexOf(v.trans) < 0) return false;
    if (s.brands.length && s.brands.indexOf(v.brand) < 0) return false;
    if (s.models.length && s.models.indexOf(v.model) < 0) return false;
    return true;
  }

  var SORTS = {
    "price-desc": function (a, b) { return b.price - a.price; },
    "price-asc": function (a, b) { return a.price - b.price; },
    "km-asc": function (a, b) { return a.km - b.km; },
    "km-desc": function (a, b) { return b.km - a.km; },
    "year-asc": function (a, b) { return a.year - b.year; },
    "year-desc": function (a, b) { return b.year - a.year; }
  };

  var INVENTORY_IMAGES = [
    "2007peroduaaxia.jpg",
    "2011mercedesbenzGLC.jpg",
    "2012hondacity.jpg",
    "2013bmw7series.jpeg",
    "2014hondacivic.jpg",
    "2014jaguarftype.jpg",
    "2015havaljolion.webp",
    "2015peroduamyvi.jpg",
    "2015suzukicarry.jpg",
    "2019bmw4series.jpg",
    "2019kiacarnival.jpg",
    "2019mazdamazda2.jpg",
    "2019protonx50.jpg",
    "2020hyundaisantafe.jpg",
    "2020hyundaitucson.jpg",
    "2020protonx90.jpg",
    "2021teslamodel3.jpg",
    "2022bmw3series.jpg",
    "2023bmwz4.jpeg",
    "2023protonsaga.jpg",
    "2024audia6.webp",
    "2024BMWX5.jpg",
    "2024protonx50.jpeg",
    "2024suzukivitara.jpg",
    "2024toyotafortuner.jpg",
    "2025bydatto3.jpg",
    "2025hyundaistaria.webp",
    "2025mercedesbenzslc.webp",
    "2025toyotacamry.jpg",
    "2025volvoxc60.webp",
    "2026kiasorento.jpg",
    "2026lexuses.jpg",
    "2026mercedesbenzaclass.jpg",
    "2026Mitsubishifusocanter.jpg",
    "2026nissannavara.jpg",
    "2026peroduaalza.jpg",
    "2026porscheboxster.avif",
    "2026protonsaga.webp",
    "2026serena s hybrid.webp",
    "2026toyotahiace.jpg",
    "2026volkswagenarteon.jpg",
    "mg4.webp",
    "nissan gtr.jpg",
    "subarucar.jpg",
    "teslay.jpg"
  ];

  function assetKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
  }

  function getVehicleImage(v) {
    var candidates = [
      assetKey(v.year + " " + v.brand + " " + v.model),
      assetKey(v.brand + " " + v.model),
      assetKey(v.model),
      assetKey(v.brand)
    ];

    var exact = INVENTORY_IMAGES.find(function (file) {
      return candidates.indexOf(assetKey(file)) > -1;
    });
    if (exact) return "images/inventory/" + exact;

    var brandKey = candidates[candidates.length - 1];
    var brandMatch = INVENTORY_IMAGES.find(function (file) {
      return assetKey(file).indexOf(brandKey) > -1;
    });
    if (brandMatch) return "images/inventory/" + brandMatch;

    var modelMatch = INVENTORY_IMAGES.find(function (file) {
      return assetKey(file).indexOf(assetKey(v.model)) > -1;
    });
    if (modelMatch) return "images/inventory/" + modelMatch;

    return "images/inventory/" + INVENTORY_IMAGES[(v.id * 11) % INVENTORY_IMAGES.length];
  }

  /* ============================================================
     CHIP BAR — "Filter selected : Option selected" with × buttons
     ============================================================ */
  function chipHTML(key, val, html) {
    return '<span class="fchip" data-key="' + key + '"' + (val ? ' data-val="' + esc(val) + '"' : "") + ">" +
      html + '<button type="button" aria-label="Remove filter">&times;</button></span>';
  }

  function renderChips() {
    var s = state, out = [];
    if (s.priceMin !== null || s.priceMax !== null) {
      var lo = s.priceMin !== null ? fmtRM(s.priceMin) : "No minimum";
      var hi = s.priceMax !== null ? fmtRM(s.priceMax) : "No maximum";
      out.push(chipHTML("price", null, "<b>Price Range</b>&nbsp;: " + lo + " – " + hi));
    }
    s.bodies.forEach(function (b) { out.push(chipHTML("body", b, "<b>Body Type</b>&nbsp;: " + esc(b))); });
    if (s.milMin !== null || s.milMax !== null) {
      var mlo = s.milMin !== null ? Number(s.milMin).toLocaleString("en-MY") : "No minimum";
      var mhi = s.milMax !== null ? (s.milMax >= 1000000 ? "No maximum" : Number(s.milMax).toLocaleString("en-MY")) : "No maximum";
      out.push(chipHTML("mileage", null, "<b>Mileage</b>&nbsp;: " + mlo + " – " + mhi + " km"));
    }
    s.conds.forEach(function (c) { out.push(chipHTML("cond", c, "<b>Condition</b>&nbsp;: " + COND_LABEL[c])); });
    if (s.yearMin !== null || s.yearMax !== null) {
      var ylo = s.yearMin !== null ? yearLabel(s.yearMin) : "Any";
      var yhi = s.yearMax !== null ? yearLabel(s.yearMax) : "Any";
      out.push(chipHTML("year", null, "<b>Year</b>&nbsp;: " + ylo + " – " + yhi));
    }
    s.fuels.forEach(function (f) { out.push(chipHTML("fuel", f, "<b>Fuel Type</b>&nbsp;: " + esc(f))); });
    s.trans.forEach(function (t) { out.push(chipHTML("trans", t, "<b>Transmission</b>&nbsp;: " + esc(t))); });
    if (s.brands.length) out.push(chipHTML("brand", null, "<b>Brand</b>&nbsp;: " + s.brands.map(esc).join(", ")));
    if (s.models.length) out.push(chipHTML("model", null, "<b>Model</b>&nbsp;: " + s.models.map(esc).join(", ")));

    el.chipBar.innerHTML = out.length
      ? out.join("")
      : '<span class="chips-empty">Selected filters will be shown here</span>';
  }

  el.chipBar.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    var chip = e.target.closest(".fchip");
    var key = chip.getAttribute("data-key");
    var val = chip.getAttribute("data-val");
    removeFilter(key, val);
  });

  function removeFilter(key, val) {
    var s = state;
    if (key === "price") { s.priceMin = null; s.priceMax = null; }
    else if (key === "mileage") { s.milMin = null; s.milMax = null; }
    else if (key === "year") { s.yearMin = null; s.yearMax = null; }
    else if (key === "brand") { s.brands = []; s.models = []; }
    else if (key === "body") s.bodies.splice(s.bodies.indexOf(val), 1);
    else if (key === "cond") s.conds.splice(s.conds.indexOf(val), 1);
    else if (key === "fuel") s.fuels.splice(s.fuels.indexOf(val), 1);
    else if (key === "trans") s.trans.splice(s.trans.indexOf(val), 1);
    else if (key === "model") s.models = [];
    syncControls();
    apply();
  }

  /* ============================================================
     CARD RENDERING
     ============================================================ */
  function cardHTML(v, featured) {
    var condClass = v.condition === "recon" ? "neon" : "";
    var imgSrc = getVehicleImage(v);
    return '<a class="vcard" href="vehicle.html?id=' + v.id + '" data-reveal>' +
      '<div class="slot vcard-img">' + (featured ? '<span class="badge-feat">Featured</span>' : "") +
      '<img src="' + imgSrc + '" alt="' + esc(v.brand) + ' ' + esc(v.model) + '" loading="lazy" decoding="async">' +
      '</div>' +
      '<div class="vcard-body">' +
      '<div class="vcard-top"><span class="vcard-price">' + fmtRM(v.price) + '</span><span class="vcard-unit">#APX-' + String(v.id).padStart(3, "0") + "</span></div>" +
      "<h3>" + v.year + " " + esc(v.brand) + " " + esc(v.model) + "</h3>" +
      '<ul class="specs">' +
      "<li>" + I.cal + v.year + "</li>" +
      "<li>" + I.gauge + v.km.toLocaleString("en-MY") + " km</li>" +
      "<li>" + I.fuel + esc(v.fuel) + "</li>" +
      "<li>" + I.gear + esc(v.trans) + "</li>" +
      "</ul>" +
      '<div class="vtags"><span class="' + condClass + '">' + COND_LABEL[v.condition] + "</span><span>" + esc(v.body) + "</span></div>" +
      "</div></a>";
  }

  function renderGrid(list) {
    el.count.innerHTML = "Showing <b>" + list.length + "</b> of " + STOCK.length + " vehicles";
    if (!list.length) {
      el.grid.innerHTML = "";
      el.empty.hidden = false;
      return;
    }
    el.empty.hidden = true;
    el.grid.innerHTML = list.map(function (v) { return cardHTML(v, false); }).join("");
    Array.prototype.forEach.call(el.grid.children, function (card, i) {
      card.style.transitionDelay = (i % 12) * 45 + "ms";
    });
    if (window.observeReveals) window.observeReveals(el.grid);
  }

  function apply() {
    renderChips();
    var list = STOCK.filter(matches);
    var fn = SORTS[el.sortSel.value];
    if (fn) list.sort(fn); else list.sort(function (a, b) { return a.id - b.id; });
    renderGrid(list);
  }

  /* ============================================================
     FEATURED STRIP — 5 units from inside the 200, draggable
     ============================================================ */
  var featVehicles = APEX.FEATURED.map(function (id) {
    return STOCK.find(function (v) { return v.id === id; });
  }).filter(Boolean);
  el.feat.innerHTML = featVehicles.map(function (v) { return cardHTML(v, true); }).join("");
  if (window.observeReveals) window.observeReveals(el.feat);

  (function enableDrag() {
    /* Mouse-only drag: touch devices use native swipe scrolling, so a
       tap on a featured card always opens the vehicle detail page. */
    var track = el.feat, down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
      track.classList.add("dragging");
      try { track.setPointerCapture(e.pointerId); } catch (_) { }
    });
    track.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 8) moved = true;
      track.scrollLeft = startLeft - dx;
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
      track.addEventListener(ev, function () { down = false; track.classList.remove("dragging"); });
    });
    track.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  })();

  /* ============================================================
     DRAWER open / close
     ============================================================ */
  function openDrawer() {
    el.veil.hidden = false;
    requestAnimationFrame(function () {
      el.veil.classList.add("show");
      el.drawer.classList.add("open");
    });
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    el.veil.classList.remove("show");
    el.drawer.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { el.veil.hidden = true; }, 300);
  }
  $("filterBtn").addEventListener("click", openDrawer);
  $("drawerClose").addEventListener("click", closeDrawer);
  $("fApply").addEventListener("click", closeDrawer);
  el.veil.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  /* ============================================================
     CONTROL EVENTS
     ============================================================ */
  function valOrNull(sel) { return sel.value === "" ? null : sel.value; }

  el.priceMin.addEventListener("change", function () { state.priceMin = valOrNull(el.priceMin) === null ? null : Number(el.priceMin.value); rebuildSelects(); apply(); });
  el.priceMax.addEventListener("change", function () { state.priceMax = valOrNull(el.priceMax) === null ? null : Number(el.priceMax.value); rebuildSelects(); apply(); });
  el.milMin.addEventListener("change", function () { state.milMin = valOrNull(el.milMin) === null ? null : Number(el.milMin.value); rebuildSelects(); apply(); });
  el.milMax.addEventListener("change", function () { state.milMax = valOrNull(el.milMax) === null ? null : Number(el.milMax.value); rebuildSelects(); apply(); });
  el.yearMin.addEventListener("change", function () { state.yearMin = valOrNull(el.yearMin); rebuildSelects(); apply(); });
  el.yearMax.addEventListener("change", function () { state.yearMax = valOrNull(el.yearMax); rebuildSelects(); apply(); });

  function wireChipset(container, arrRef) {
    container.addEventListener("change", function (e) {
      var cb = e.target;
      if (cb.type !== "checkbox") return;
      var i = arrRef().indexOf(cb.value);
      if (cb.checked && i < 0) arrRef().push(cb.value);
      if (!cb.checked && i > -1) arrRef().splice(i, 1);
      apply();
    });
  }
  wireChipset(el.body, function () { return state.bodies; });
  wireChipset(el.cond, function () { return state.conds; });
  wireChipset(el.fuel, function () { return state.fuels; });
  wireChipset(el.trans, function () { return state.trans; });
  wireChipset(el.model, function () { return state.models; });

  /* brand checkboxes — multi-select */
  el.brand.addEventListener("change", function (e) {
    var cb = e.target;
    if (!cb || cb.type !== "checkbox") return;
    var i = state.brands.indexOf(cb.value);
    if (cb.checked && i < 0) state.brands.push(cb.value);
    if (!cb.checked && i > -1) state.brands.splice(i, 1);
    /* drop any selected model that no longer belongs to a chosen brand */
    var allowed = {};
    state.brands.forEach(function (b) { (APEX.MODELS[b] || []).forEach(function (m) { allowed[m] = 1; }); });
    state.models = state.models.filter(function (m) { return allowed[m]; });
    buildModelChips();
    apply();
  });

  el.sortSel.addEventListener("change", apply);

  function resetAll() {
    state.priceMin = state.priceMax = null;
    state.milMin = state.milMax = null;
    state.yearMin = state.yearMax = null;
    state.bodies = state.conds = state.fuels = state.trans = state.models = [];
    state.brands = [];
    el.brandSearch.value = "";
    el.sortSel.value = "";
    syncControls();
    apply();
  }
  $("fReset").addEventListener("click", resetAll);
  $("emptyReset").addEventListener("click", resetAll);

  /* ============================================================
     PRE-SELECTED FILTERS FROM THE HOMEPAGE (query string)
     e.g. stocks.html?pmax=40000 · ?body=SUV · ?pmin=60000&pmax=200000
     ============================================================ */
  (function fromURL() {
    var q = new URLSearchParams(location.search);
    if (q.get("pmin")) state.priceMin = Number(q.get("pmin")) || null;
    if (q.get("pmax")) state.priceMax = Number(q.get("pmax")) || null;
    if (q.get("body") && APEX.BODY_TYPES.indexOf(q.get("body")) > -1) state.bodies = [q.get("body")];
    if (q.get("mmin")) state.milMin = Number(q.get("mmin"));
    if (q.get("mmax")) state.milMax = Number(q.get("mmax"));
    if (q.get("cond") && APEX.CONDITIONS.indexOf(q.get("cond")) > -1) state.conds = [q.get("cond")];
    if (q.get("fuel") && APEX.FUELS.indexOf(q.get("fuel")) > -1) state.fuels = [q.get("fuel")];
    if (q.get("trans") && APEX.TRANS.indexOf(q.get("trans")) > -1) state.trans = [q.get("trans")];
    if (q.get("brand") && APEX.BRAND_NAMES.indexOf(q.get("brand")) > -1) state.brands = [q.get("brand")];
  })();

  syncControls();
  apply();
})();
