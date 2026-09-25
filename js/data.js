/* ============================================================
   APEX MOTORS — inventory data engine
   Generates a deterministic catalogue of 200 vehicles.
   (Drop real photos into /images and wire them up later.)
   ============================================================ */
(function (global) {
  "use strict";

  var CURRENT_YEAR = 2026;

  /* ---------- tiny seeded RNG so stock never changes ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20260911);
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function ri(min, max) { return Math.floor(rnd() * (max - min + 1)) + min; }

  /* ---------- brand → [model, body type, new-price RM k] ---------- */
  var BRANDS = {
    "Perodua": [["Axia", "Hatchback", 30], ["Myvi", "Hatchback", 46], ["Bezza", "Sedan", 38], ["Alza", "MPV", 62], ["Ativa", "SUV", 66], ["Aruz", "SUV", 72]],
    "Proton": [["Saga", "Sedan", 34], ["Persona", "Sedan", 46], ["Iriz", "Hatchback", 43], ["X50", "SUV", 86], ["X70", "SUV", 102], ["X90", "SUV", 142]],
    "Honda": [["City", "Sedan", 82], ["Civic", "Sedan", 132], ["Jazz", "Hatchback", 76], ["HR-V", "SUV", 112], ["CR-V", "SUV", 152], ["Accord", "Sedan", 182]],
    "Toyota": [["Vios", "Sedan", 86], ["Yaris", "Hatchback", 82], ["Corolla Cross", "SUV", 132], ["Camry", "Sedan", 192], ["Fortuner", "SUV", 172], ["Hilux", "Pickup", 122], ["Innova", "MPV", 102], ["Alphard", "MPV", 352], ["Hiace", "Van", 112], ["GR86", "Coupe", 282], ["Coaster", "Bus", 252]],
    "Nissan": [["Almera", "Sedan", 82], ["Serena S-Hybrid", "MPV", 142], ["X-Trail", "SUV", 152], ["Navara", "Pickup", 122], ["GT-R", "Sports car", 705]],
    "Mazda": [["Mazda2", "Hatchback", 86], ["Mazda3", "Sedan", 122], ["CX-5", "SUV", 142], ["CX-8", "SUV", 172], ["MX-5", "Convertible", 252]],
    "Mitsubishi": [["Attrage", "Sedan", 64], ["Xpander", "MPV", 96], ["Triton", "Pickup", 116], ["Pajero Sport", "SUV", 162], ["Fuso Canter", "Lorry", 132], ["Fuso Fighter", "Box lorry", 182]],
    "Suzuki": [["Swift", "Hatchback", 72], ["Jimny", "Off-road", 152], ["Vitara", "SUV", 102], ["Carry", "Van", 56]],
    "Subaru": [["XV", "SUV", 122], ["Forester", "SUV", 142], ["Outback", "SUV", 172], ["BRZ", "Coupe", 232]],
    "Isuzu": [["D-Max", "Pickup", 112], ["MU-X", "SUV", 152], ["NLR", "Lorry", 96], ["NPR", "Box lorry", 132]],
    "BMW": [["3 Series", "Sedan", 232], ["5 Series", "Sedan", 322], ["7 Series", "Sedan", 505], ["X1", "SUV", 222], ["X3", "SUV", 302], ["X5", "SUV", 422], ["4 Series", "Coupe", 352], ["Z4", "Convertible", 402], ["M4", "Sports car", 652]],
    "Mercedes-Benz": [["A-Class", "Sedan", 202], ["C-Class", "Sedan", 252], ["E-Class", "Sedan", 352], ["S-Class", "Sedan", 605], ["GLA", "SUV", 222], ["GLC", "SUV", 322], ["GLE", "SUV", 452], ["SLC", "Convertible", 382], ["AMG GT", "Sports car", 905]],
    "Audi": [["A3", "Sedan", 192], ["A4", "Sedan", 242], ["A6", "Sedan", 332], ["Q3", "SUV", 232], ["Q5", "SUV", 302], ["Q7", "SUV", 402], ["TT", "Coupe", 282], ["R8", "Sports car", 1005]],
    "Volkswagen": [["Golf", "Hatchback", 132], ["Passat", "Sedan", 162], ["Tiguan", "SUV", 172], ["Arteon", "Sedan", 222]],
    "Volvo": [["XC40", "SUV", 232], ["XC60", "SUV", 302], ["XC90", "SUV", 382], ["S60", "Sedan", 242]],
    "Porsche": [["Macan", "SUV", 422], ["Cayenne", "SUV", 552], ["Panamera", "Sedan", 702], ["911 Carrera", "Sports car", 852], ["718 Boxster", "Convertible", 602], ["718 Cayman", "Coupe", 582]],
    "Lexus": [["NX", "SUV", 262], ["RX", "SUV", 352], ["ES", "Sedan", 302], ["LX", "SUV", 602], ["LC 500", "Coupe", 702]],
    "Kia": [["Cerato", "Sedan", 102], ["Sportage", "SUV", 142], ["Sorento", "SUV", 182], ["Carnival", "MPV", 202], ["Stinger", "Sedan", 252]],
    "Hyundai": [["Elantra", "Sedan", 112], ["Kona", "SUV", 102], ["Tucson", "SUV", 152], ["Santa Fe", "SUV", 192], ["Staria", "MPV", 222]],
    "Ford": [["Fiesta", "Hatchback", 62], ["Focus", "Hatchback", 82], ["Ranger", "Pickup", 142], ["Everest", "SUV", 202], ["Mustang", "Sports car", 382]],
    "Jeep": [["Compass", "SUV", 162], ["Wrangler", "Off-road", 302], ["Gladiator", "Pickup", 322]],
    "Tesla": [["Model 3", "Sedan", 202], ["Model Y", "SUV", 252], ["Model S", "Sedan", 452]],
    "MG": [["MG4", "Hatchback", 102], ["ZS", "SUV", 92], ["HS", "SUV", 112]],
    "Peugeot": [["208", "Hatchback", 102], ["3008", "SUV", 142], ["5008", "SUV", 162]],
    "Citroen": [["C3", "Hatchback", 86], ["C3 Aircross", "SUV", 102]],
    "Jaguar": [["XE", "Sedan", 232], ["F-Pace", "SUV", 352], ["F-Type", "Sports car", 552]],
    "Land Rover": [["Defender", "Off-road", 502], ["Discovery Sport", "SUV", 302], ["Range Rover Sport", "SUV", 602], ["Range Rover", "SUV", 902]],
    "BYD": [["Dolphin", "Hatchback", 102], ["Atto 3", "SUV", 122], ["Seal", "Sedan", 172]],
    "Chery": [["Omoda 5", "SUV", 112], ["Tiggo 8 Pro", "SUV", 152]],
    "Haval": [["Jolion", "SUV", 112], ["H6", "SUV", 142]]
  };

  var BODY_TYPES = ["Sedan", "Hatchback", "SUV", "MPV", "Off-road", "Coupe", "Sports car", "Convertible", "Pickup", "Van", "Lorry", "Box lorry", "Bus"];
  var CONDITIONS = ["slightly used", "used", "recon"];
  var CONDITION_HINT = { "slightly used": "Cars used under 1.5 years", "used": "", "recon": "" };
  var FUELS = ["Petrol", "Hybrid", "Diesel", "EV"];
  var TRANS = ["Automatic", "Manual"];

  var SEATS = { "Sedan": 5, "Hatchback": 5, "SUV": 5, "MPV": 7, "Off-road": 5, "Coupe": 4, "Sports car": 2, "Convertible": 2, "Pickup": 5, "Van": 12, "Lorry": 3, "Box lorry": 3, "Bus": 24 };

  var COLOURS = ["Alpine White", "Jet Black", "Silver Frost", "Gunmetal Grey", "Racing Red", "Ocean Blue", "Titanium Silver", "Midnight Blue", "Cement Grey", "British Green", "Quartz Brown", "Sunset Orange"];

  var ENG_PETROL = ["1.0L I3", "1.2L I3", "1.3L I4", "1.5L I4", "1.5T I4", "1.8L I4", "2.0L I4", "2.0T I4", "2.4L I4", "2.5L I4", "3.0T V6", "3.5L V6", "4.0L V8"];
  var ENG_HYBRID = ["1.8L Hybrid", "2.0L Hybrid", "2.5L Hybrid"];
  var ENG_DIESEL = ["2.2L Turbodiesel", "2.4L Turbodiesel", "2.8L Turbodiesel", "3.0L Turbodiesel"];
  var ENG_EV = ["Single Motor EV", "Dual Motor AWD EV", "Performance Dual Motor EV"];

  var DIESEL_HINT = /Hilux|D-Max|Triton|Ranger|Navara|Canter|Fighter|NLR|NPR|Coaster|Hiace|Carry|MU-X|Pajero Sport|Fortuner|Everest|Defender|Discovery|Range Rover|Carnival/i;
  var HYBRID_HINT = /Camry|Accord|S-Class|E-Class|Serena|Corolla Cross|XV|Forester/i;

  /* Malaysian-market weighting so the mix feels real */
  var WEIGHT = { "Perodua": 9, "Proton": 9, "Honda": 9, "Toyota": 9, "Nissan": 5, "Mazda": 5, "Mitsubishi": 4, "Suzuki": 3, "Subaru": 2, "Isuzu": 4, "BMW": 6, "Mercedes-Benz": 6, "Audi": 4, "Volkswagen": 3, "Volvo": 3, "Porsche": 3, "Lexus": 3, "Kia": 3, "Hyundai": 4, "Ford": 3, "Jeep": 2, "Tesla": 2, "MG": 3, "Peugeot": 2, "Citroen": 1, "Jaguar": 1, "Land Rover": 2, "BYD": 4, "Chery": 3, "Haval": 3 };

  var pool = [];
  Object.keys(BRANDS).forEach(function (b) {
    var w = WEIGHT[b] || 2;
    for (var i = 0; i < w; i++) BRANDS[b].forEach(function (m) { pool.push([b, m[0], m[1], m[2]]); });
  });

  function rollYear() {
    var r = rnd();
    if (r < 0.50) return ri(2019, 2024);
    if (r < 0.72) return ri(2025, 2026);
    if (r < 0.90) return ri(2013, 2018);
    return ri(2004, 2012);
  }

  function fuelFor(model, brand) {
    if (brand === "Tesla" || brand === "BYD" || model === "MG4") return "EV";
    if (DIESEL_HINT.test(model)) return "Diesel";
    if (HYBRID_HINT.test(model) && rnd() < 0.4) return "Hybrid";
    if (rnd() < 0.06) return "Hybrid";
    return "Petrol";
  }

  function transFor(body, model) {
    if ((body === "Lorry" || body === "Box lorry" || body === "Bus") && rnd() < 0.7) return "Manual";
    if (body === "Van" && rnd() < 0.35) return "Manual";
    if (/Jimny|GR86|BRZ|MX-5|Swift/i.test(model) && rnd() < 0.3) return "Manual";
    return "Automatic";
  }

  function buildUnit(id, brand, model, body, baseK, year) {
    var age = Math.max(0, CURRENT_YEAR - year);
    var fuel = fuelFor(model, brand);
    var trans = transFor(body, model);
    var condition;
    if (age === 0) condition = "slightly used";
    else if (age === 1) condition = rnd() < 0.7 ? "slightly used" : "used";
    else condition = (rnd() < 0.14 && year <= 2022) ? "recon" : "used";

    var km;
    if (condition === "slightly used") km = ri(1500, 24000);
    else if (condition === "recon") km = ri(18000, 85000);
    else km = Math.min(ri(age * 11000, age * 19000 + 9000), 412000);

    var decay = fuel === "EV" ? 0.93 : 0.875;
    var price = baseK * 1000 * Math.pow(decay, age) * (0.94 + rnd() * 0.12);
    if (condition === "recon") price *= 1.07;
    price = Math.max(price, 9800);
    price = Math.round(price / 100) * 100;

    var engine = fuel === "Petrol" ? pick(ENG_PETROL) : fuel === "Hybrid" ? pick(ENG_HYBRID) : fuel === "Diesel" ? pick(ENG_DIESEL) : pick(ENG_EV);

    return {
      id: id,
      brand: brand,
      model: model,
      body: body,
      year: year,
      price: price,
      km: km,
      condition: condition,
      fuel: fuel,
      trans: trans,
      engine: engine,
      colour: pick(COLOURS),
      seats: SEATS[body] || 5
    };
  }

  /* ---------- generate 197 rolling units + 3 classics = 200 ---------- */
  var STOCK = [];
  for (var i = 1; i <= 197; i++) {
    var e = pick(pool);
    STOCK.push(buildUnit(i, e[0], e[1], e[2], e[3], rollYear()));
  }
  /* a few pre-1995 classics so the "Before 1995" filter has hits */
  STOCK.push(buildUnit(198, "Proton", "Saga 1.3 GL", "Sedan", 24, 1988));
  STOCK.push(buildUnit(199, "Toyota", "Corolla DX KE70", "Coupe", 26, 1984));
  STOCK.push(buildUnit(200, "Nissan", "Skyline GT-R R32", "Sports car", 300, 1993));

  /* ---------- pick 5 featured units from within the 200 ---------- */
  function featuredPick() {
    var ids = [];
    function take(fn) {
      var c = STOCK.slice().sort(fn)[0];
      if (c && ids.indexOf(c.id) === -1) ids.push(c.id);
    }
    take(function (a, b) { return b.price - a.price; });
    take(function (a, b) { return a.price - b.price; });
    take(function (a, b) { return (b.body === "SUV" ? b.price : -1) - (a.body === "SUV" ? a.price : -1); });
    take(function (a, b) { return (b.body === "Pickup" ? b.price : -1) - (a.body === "Pickup" ? a.price : -1); });
    take(function (a, b) { return (b.fuel === "EV" ? b.price : -1) - (a.fuel === "EV" ? a.price : -1); });
    return ids.slice(0, 5);
  }

  global.APEX = {
    BRAND_NAMES: Object.keys(BRANDS),
    MODELS: (function () { var o = {}; Object.keys(BRANDS).forEach(function (b) { o[b] = BRANDS[b].map(function (m) { return m[0]; }); }); return o; })(),
    BODY_TYPES: BODY_TYPES,
    CONDITIONS: CONDITIONS,
    CONDITION_HINT: CONDITION_HINT,
    FUELS: FUELS,
    TRANS: TRANS,
    STOCK: STOCK,
    FEATURED: featuredPick(),
    CURRENT_YEAR: CURRENT_YEAR
  };
})(typeof window !== "undefined" ? window : globalThis);
