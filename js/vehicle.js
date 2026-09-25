/* ============================================================
   APEX MOTORS — vehicle detail page
   reads ?id= from the URL and renders the unit + 15 photo slots
   ============================================================ */
(function () {
  "use strict";
  var APEX = window.APEX;
  var STOCK = APEX.STOCK;
  var CAM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v9h-2a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H4Z"/></svg>';
  var COND_LABEL = { "slightly used": "Slightly Used", "used": "Used", "recon": "Recon" };

  var id = Number(new URLSearchParams(location.search).get("id"));
  var v = STOCK.find(function (x) { return x.id === id; });
  var root = document.getElementById("vdRoot");

  if (!v) {
    root.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1">' +
      "We couldn't find that unit — it may have been sold.<br><br>" +
      '<a class="btn solid" href="stocks.html" style="margin-top:.8rem">Browse current stock</a></div>';
    document.title = "Unit not found · Apex Motors";
    return;
  }

  var title = v.year + " " + v.brand + " " + v.model;
  document.title = title + " · RM " + v.price.toLocaleString("en-MY") + " · Apex Motors";

  /* ---------- gallery: 1 main viewer + 15 slots ---------- */
  var main = document.getElementById("vdMain");
  var thumbs = document.getElementById("vdThumbs");
  var SLOTS = 15;

  function mainSlotHTML(n) {
    return '<div class="slot-core">' + CAM +
      "<span>Image " + n + " of " + SLOTS + "</span>" +
      "<em>" + title + " · 1600 × 1200 px (4:3)</em></div>";
  }
  main.innerHTML = mainSlotHTML(1);

  var t = "";
  for (var i = 1; i <= SLOTS; i++) {
    t += '<div class="slot' + (i === 1 ? " on" : "") + '" data-slot="' + i + '" role="button" tabindex="0" aria-label="View image ' + i + '">' +
      '<div class="slot-core"><span>' + String(i).padStart(2, "0") + "</span></div></div>";
  }
  thumbs.innerHTML = t;

  thumbs.addEventListener("click", function (e) {
    var s = e.target.closest("[data-slot]");
    if (!s) return;
    selectSlot(Number(s.getAttribute("data-slot")));
  });
  thumbs.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var s = e.target.closest("[data-slot]");
    if (!s) return;
    e.preventDefault();
    selectSlot(Number(s.getAttribute("data-slot")));
  });
  function selectSlot(n) {
    main.innerHTML = mainSlotHTML(n);
    thumbs.querySelectorAll(".slot").forEach(function (el) {
      el.classList.toggle("on", Number(el.getAttribute("data-slot")) === n);
    });
  }

  /* ---------- info panel ---------- */
  document.getElementById("vdCond").textContent = COND_LABEL[v.condition];
  document.getElementById("vdTitle").textContent = title;
  document.getElementById("vdPrice").textContent = "RM " + v.price.toLocaleString("en-MY");
  document.getElementById("vdUnit").textContent = "Unit #APX-" + String(v.id).padStart(3, "0") + " · " + v.colour;

  var specs = [
    ["Brand", v.brand], ["Model", v.model],
    ["Year", v.year], ["Mileage", v.km.toLocaleString("en-MY") + " km"],
    ["Body Type", v.body], ["Condition", COND_LABEL[v.condition]],
    ["Fuel", v.fuel], ["Transmission", v.trans],
    ["Engine", v.engine], ["Seats", v.seats]
  ];
  document.getElementById("vdSpecs").innerHTML = specs.map(function (s) {
    return '<div><span class="k">' + s[0] + '</span><span class="v">' + s[1] + "</span></div>";
  }).join("");

  /* ---------- description ---------- */
  var condText = v.condition === "slightly used"
    ? "barely broken in — used for under a year and a half"
    : v.condition === "recon"
      ? "a graded reconditioned import, refreshed and detailed to showroom standard"
      : "a well-kept used unit with a full service walkaround completed on arrival";
  document.getElementById("vdDesc").innerHTML =
    "<p>This <strong>" + v.year + " " + v.brand + " " + v.model + "</strong> is " + condText + ". " +
    "Finished in " + v.colour + " with the " + v.engine + " and " + v.trans.toLowerCase() + " transmission, it shows " +
    v.km.toLocaleString("en-MY") + " km on the odometer.</p>" +
    "<p style=\"margin-top:.8rem\">Like every unit on our lot in Tanjong Karang, it passed our 150-point inspection covering engine, gearbox, brakes, suspension, air-con and electricals. Loan assistance, insurance and road tax renewal can be arranged on the spot, and trade-ins are welcome. Come see it before someone else does.</p>";

  /* ---------- WhatsApp CTA with unit context ---------- */
  var waText = "Hi Apex Motors, I'm interested in the " + title + " (#APX-" + String(v.id).padStart(3, "0") +
    ") listed at RM " + v.price.toLocaleString("en-MY") + ". Is it still available?";
  document.getElementById("vdWa").href = "https://wa.me/60171234567?text=" + encodeURIComponent(waText);
})();
