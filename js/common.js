/* ============================================================
   APEX MOTORS — shared behaviour
   topbar scroll logic · slideshows · marquees · reveals · modals
   ============================================================ */
(function () {
  "use strict";

  function normalizeAssetKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
  }

  function hydrateImageSlot(el, src, alt) {
    if (!el || !src) return;
    var target = el.querySelector(".slot-core") || el;
    var img = document.createElement("img");
    img.src = src;
    img.alt = alt || "Apex Motors image";
    img.loading = "lazy";
    img.decoding = "async";
    img.style.objectFit = "cover";
    img.style.objectPosition = "center";
    target.innerHTML = "";
    target.appendChild(img);
  }

  function hydrateBrandTiles() {
    var brandMap = {
      "Perodua": "images/Brandswesellhome/perodua.png",
      "Proton": "images/Brandswesellhome/Proton.jpg",
      "Honda": "images/Brandswesellhome/honda.webp",
      "Toyota": "images/Brandswesellhome/Toyota.png",
      "Nissan": "images/Brandswesellhome/nissan.jpg",
      "Mazda": "images/Brandswesellhome/mazda.webp",
      "Mitsubishi": "images/Brandswesellhome/mitsubishi.png",
      "Suzuki": "images/Brandswesellhome/suzuki.png",
      "Subaru": "images/Brandswesellhome/subaru.png",
      "Isuzu": "images/Brandswesellhome/isuzu.png",
      "BMW": "images/Brandswesellhome/bmw.jpg",
      "Mercedes-Benz": "images/Brandswesellhome/mercedes.png",
      "Audi": "images/Brandswesellhome/audi.jpg",
      "Volkswagen": "images/Brandswesellhome/Volkswagen.png",
      "Volvo": "images/Brandswesellhome/volvo.jpg",
      "Porsche": "images/Brandswesellhome/porsche.jpg",
      "Lexus": "images/Brandswesellhome/lexus.jpg",
      "Kia": "images/Brandswesellhome/kia.avif",
      "Hyundai": "images/Brandswesellhome/hyundai.jpg",
      "Ford": "images/Brandswesellhome/ford.jpg",
      "Jeep": "images/Brandswesellhome/jeep.jpg",
      "Tesla": "images/Brandswesellhome/tesla.png",
      "MG": "images/Brandswesellhome/mg.webp",
      "Peugeot": "images/Brandswesellhome/peugeot.png",
      "Citroën": "images/Brandswesellhome/citroen.jpg",
      "Jaguar": "images/Brandswesellhome/jaguar.jpg",
      "Land Rover": "images/Brandswesellhome/landrover.jpg",
      "BYD": "images/Brandswesellhome/byd.jpg",
      "Chery": "images/Brandswesellhome/chery.png",
      "Haval": "images/Brandswesellhome/haval.jpg"
    };

    document.querySelectorAll(".btile").forEach(function (tile) {
      var raw = (tile.getAttribute("data-brand") || tile.textContent || "").replace(/^\d+\s*/, "").trim();
      var brand = raw || "Apex Motors";
      var src = brandMap[brand] || brandMap[Object.keys(brandMap).find(function (key) {
        return normalizeAssetKey(key) === normalizeAssetKey(brand);
      })] || "";
      if (!src) return;
      tile.innerHTML = "";
      var img = document.createElement("img");
      img.src = src;
      img.alt = brand + " brand logo";
      img.loading = "lazy";
      img.decoding = "async";
      tile.appendChild(img);
      var label = document.createElement("span");
      label.className = "btile-label";
      label.textContent = brand;
      tile.appendChild(label);
    });
  }

  document.querySelectorAll("[data-image]").forEach(function (el) {
    var src = el.getAttribute("data-image");
    var alt = el.getAttribute("data-alt") || "Apex Motors";
    hydrateImageSlot(el, src, alt);
  });

  hydrateBrandTiles();

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ============================================================
     BANNER BAR — visible when scrolling UP, hidden scrolling DOWN.
     Nav bar stays pinned the whole time.
     The header is FIXED and the page gets a constant top offset, so
     collapsing/expanding the banner never changes document height →
     no scroll-anchoring feedback loop → no shaking, no lag.
     ============================================================ */
  var head = document.getElementById("siteHead");
  var topbar = document.getElementById("topbar");
  if (head && topbar) {
    var nav = head.querySelector(".mainnav");
    var lastY = window.scrollY;
    var ticking = false;

    function setPad() {
      document.body.style.paddingTop = (topbar.scrollHeight + (nav ? nav.offsetHeight : 0)) + "px";
    }
    function sizeTopbar() {
      topbar.style.maxHeight = "none";
      var h = topbar.scrollHeight;
      topbar.style.maxHeight = h + "px";
      setPad();
    }
    sizeTopbar();
    window.addEventListener("resize", sizeTopbar);
    window.addEventListener("load", sizeTopbar);

    function onScroll() {
      var y = window.scrollY;
      /* dead-band: tiny jitter (< 3px) is ignored, so the banner
         can't flicker between states at the toggle boundary */
      if (y > lastY + 3 && y > 140) head.classList.add("crumpled");
      else if (y < lastY - 8) head.classList.remove("crumpled");
      lastY = y;
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  }

  /* ============================================================
     SLIDESHOWS  —  [data-slideshow] wrapper, [data-track] track,
     optional [data-prev]/[data-next] arrows + [data-cur] counter
     ============================================================ */
  document.querySelectorAll("[data-slideshow]").forEach(function (root) {
    var track = root.querySelector("[data-track]");
    if (!track) return;
    var slides = track.children.length;
    var delay = parseInt(root.getAttribute("data-autoplay"), 10) || 0;
    var i = 0, timer = null;
    var cur = root.querySelector("[data-cur]");

    function go(k) {
      i = ((k % slides) + slides) % slides;
      track.style.transform = "translateX(-" + (i * 100) + "%)";
      if (cur) cur.textContent = String(i + 1).padStart(2, "0");
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (delay) timer = setInterval(function () { go(i + 1); }, delay);
    }
    var prev = root.querySelector("[data-prev]");
    var next = root.querySelector("[data-next]");
    if (prev) prev.addEventListener("click", function () { go(i - 1); restart(); });
    if (next) next.addEventListener("click", function () { go(i + 1); restart(); });
    go(0);
    restart();
  });

  /* ============================================================
     MARQUEES — duplicate track content once for a seamless loop
     ============================================================ */
  document.querySelectorAll("[data-mq]").forEach(function (track) {
    if (track.dataset.mqDone) return;
    track.dataset.mqDone = "1";
    track.innerHTML += track.innerHTML;
  });

  /* ============================================================
     SCROLL-REVEAL SYSTEM
     [data-reveal="..."] on blocks, [data-stagger] on parents
     ============================================================ */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("revealed");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }) : null;

  function observe(scope) {
    (scope || document).querySelectorAll("[data-reveal], [data-stagger]").forEach(function (el) {
      if (el.dataset.obsDone) return;
      el.dataset.obsDone = "1";
      if (el.hasAttribute("data-stagger")) {
        Array.prototype.forEach.call(el.children, function (child, idx) {
          child.style.transitionDelay = (idx * 95) + "ms";
        });
      }
      if (io) io.observe(el); else el.classList.add("revealed");
    });
  }
  observe();
  window.observeReveals = observe;

  /* failsafe: anything already on screen must never stay hidden */
  setTimeout(function () {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll("[data-reveal], [data-stagger]").forEach(function (el) {
      if (el.classList.contains("revealed")) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add("revealed");
    });
  }, 1200);

  /* ============================================================
     FOOTER MODALS — Terms & Conditions / Privacy Policy
     ============================================================ */
  var TERMS =
    '<h4>1. Agreement</h4><p>By browsing this website, requesting a valuation, or purchasing a vehicle from Apex Motors ("the Company"), you agree to be bound by these Terms &amp; Conditions. If you do not agree, please discontinue use of the site.</p>' +
    '<h4>2. Listings &amp; Pricing</h4><p>All vehicles are listed in good faith. Prices shown are indicative of the vehicle\'s condition, mileage and market value at time of listing and are subject to final confirmation upon physical inspection. Errors and omissions excepted.</p>' +
    '<h4>3. Inspections &amp; Condition</h4><p>Every unit undergoes our 150-point inspection before display. Descriptions of condition ("slightly used", "used", "recon") reflect our honest assessment; buyers are encouraged to inspect and test-drive any vehicle before purchase.</p>' +
    '<h4>4. Deposits &amp; Payment</h4><p>A booking deposit secures a unit for up to seven (7) days pending loan approval or full settlement. Deposits are refundable only where the vehicle fails our stated description. Full payment is required before handover of keys and ownership transfer.</p>' +
    '<h4>5. Trade-Ins</h4><p>Trade-in valuations are valid for three (3) days and subject to physical inspection of your vehicle. Final value may be adjusted for undisclosed damage, outstanding summonses or loan balances.</p>' +
    '<h4>6. Warranties</h4><p>Where a warranty is offered, its scope and duration are stated on the sales agreement. Warranties do not cover wear-and-tear items, misuse, or modifications made after handover.</p>' +
    '<h4>7. Limitation of Liability</h4><p>To the maximum extent permitted by law, the Company shall not be liable for indirect or consequential losses arising from the use of this website or any vehicle purchased.</p>' +
    '<h4>8. Changes</h4><p>We may update these terms from time to time. Continued use of the site after changes constitutes acceptance of the updated terms.</p>';

  var PRIVACY =
    '<h4>1. What We Collect</h4><p>When you submit a form (e.g. Sell Vehicle, Contact Us) we collect the details you provide: name, age, phone number, occupation, salary information and your enquiry. We also retain basic records of vehicles you enquire about.</p>' +
    '<h4>2. How We Use It</h4><ul><li>To respond to your enquiry and arrange viewings or valuations.</li><li>To prepare trade-in or purchase quotations.</li><li>To improve our stock and services.</li></ul><p>We do not sell your personal data to third parties.</p>' +
    '<h4>3. Sharing</h4><p>Your details may be shared only where necessary to complete a transaction — for example with banks for financing approval, insurance providers, or JPJ/Puspakom for registration processes — and always limited to what is needed.</p>' +
    '<h4>4. Retention</h4><p>Enquiry records are kept no longer than necessary (typically 24 months) unless a transaction requires a longer statutory retention period.</p>' +
    '<h4>5. Security</h4><p>Access to personal data is restricted to authorised staff. Messages sent via WhatsApp or phone are handled confidentially.</p>' +
    '<h4>6. Your Rights</h4><p>You may request a copy, correction, or deletion of your personal data at any time by contacting us at privacy@apexmotors.my or via WhatsApp.</p>' +
    '<h4>7. Contact</h4><p>Questions about this policy can be directed to the Data Protection Officer, Apex Motors, Lot 2184 Jalan Bagan, Tanjong Karang, 45800 Selangor.</p>';

  var MODALS = {
    terms: { title: "Terms & Conditions", html: TERMS },
    privacy: { title: "Privacy Policy", html: PRIVACY }
  };

  var veil = null;
  function buildVeil() {
    if (veil) return veil;
    veil = document.createElement("div");
    veil.className = "modal-veil";
    veil.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<div class="modal-head"><h3 id="modalTitle"></h3>' +
      '<button class="modal-x" aria-label="Close popup">&#10005;</button></div>' +
      '<div class="modal-body"></div></div>';
    document.body.appendChild(veil);
    veil.addEventListener("click", function (e) { if (e.target === veil) closeModal(); });
    veil.querySelector(".modal-x").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
    return veil;
  }
  function closeModal() {
    if (!veil) return;
    veil.classList.remove("open");
    document.body.style.overflow = "";
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-modal]");
    if (!btn) return;
    e.preventDefault();
    var m = MODALS[btn.getAttribute("data-modal")];
    if (!m) return;
    var v = buildVeil();
    v.querySelector("#modalTitle").textContent = m.title;
    v.querySelector(".modal-body").innerHTML = m.html;
    v.classList.add("open");
    document.body.style.overflow = "hidden";
  });
})();
