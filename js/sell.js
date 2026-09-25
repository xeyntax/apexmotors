/* ============================================================
   APEX MOTORS — sell vehicle form (client-side validation)
   ============================================================ */
(function () {
  "use strict";
  var form = document.getElementById("sellForm");
  var done = document.getElementById("formDone");
  if (!form) return;

  var F = {
    name:   { input: "inName",   wrap: "wName",   test: function (v) { return v.trim().length >= 3; } },
    age:    { input: "inAge",    wrap: "wAge",    test: function (v) { var n = Number(v); return v !== "" && n >= 18 && n <= 99; } },
    phone:  { input: "inPhone",  wrap: "wPhone",  test: function (v) { return /^[+\d][\d\s\-]{8,17}$/.test(v.trim()) && (v.match(/\d/g) || []).length >= 9; } },
    job:    { input: "inJob",    wrap: "wJob",    test: function (v) { return v.trim().length >= 2; } },
    salary: { input: "inSalary", wrap: "wSalary", test: function (v) { var n = Number(v.replace(/[,\s]/g, "")); return v.trim() !== "" && n > 0 && n < 10000000; } },
    enq:    { input: "inEnq",    wrap: "wEnq",    test: function (v) { return v.trim().length >= 10; } }
  };

  /* live-format the salary field with thousand separators */
  var salaryInput = document.getElementById("inSalary");
  salaryInput.addEventListener("input", function () {
    var digits = salaryInput.value.replace(/[^\d]/g, "").slice(0, 9);
    salaryInput.value = digits ? Number(digits).toLocaleString("en-MY") : "";
  });

  function validateField(key) {
    var f = F[key];
    var ok = f.test(document.getElementById(f.input).value);
    document.getElementById(f.wrap).classList.toggle("err", !ok);
    return ok;
  }

  Object.keys(F).forEach(function (key) {
    var input = document.getElementById(F[key].input);
    input.addEventListener("blur", function () { validateField(key); });
    input.addEventListener("input", function () {
      if (document.getElementById(F[key].wrap).classList.contains("err")) validateField(key);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var allOk = true;
    var firstBad = null;
    Object.keys(F).forEach(function (key) {
      if (!validateField(key)) {
        allOk = false;
        if (!firstBad) firstBad = document.getElementById(F[key].input);
      }
    });
    if (!allOk) { if (firstBad) firstBad.focus(); return; }

    var name = document.getElementById("inName").value.trim().split(" ")[0];
    document.getElementById("doneMsg").textContent =
      "Terima kasih, " + name + "! Our buying desk will call you back within the working day with a valuation for your vehicle.";
    form.style.display = "none";
    done.classList.add("show");
  });

  document.getElementById("doneReset").addEventListener("click", function () {
    form.reset();
    done.classList.remove("show");
    form.style.display = "";
  });
})();
