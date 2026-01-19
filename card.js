let transportCO2 = 0;
let foodCO2 = 0;
let houseCO2 = 0;
let tempCO2 = 0;

/* ------------------------------
   UNIT CONVERSION
   ------------------------------ */
// Convert grams → tons
function gramsToTons(grams) {
  return grams / 1_000_000; // 1 ton = 1,000,000 grams
}

/* ------------------------------
   STEP 1 — INITIAL TRANSPORT
   ------------------------------ */
document.getElementById("step1").innerHTML = `
  <label>Which type of transport do you use?</label>
  <select id="subType">
    <option value="">Select</option>
    <option value="car">Car</option>
    <option value="bicycle">Bicycle</option>
    <option value="feet">Feet</option>
    <option value="other">Other</option>
  </select>
  <button onclick="nextTransport()">Next</button>
`;

function nextTransport() {
  const subType = document.getElementById("subType").value;
  if (!subType) return alert("Please select a transport type.");

  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");

  step1.classList.add("hidden");
  step2.classList.remove("hidden");

  if (subType === "car") {
    step2.innerHTML = `
      <label>Fuel type:</label>
      <select id="energyType">
        <option value="">Select</option>
        <option value="electric">Electric</option>
        <option value="fossil">Fossil Fuel</option>
      </select>
      <label>Amount used (litres or kWh):</label>
      <input type="number" id="amount" min="0" />
      <label>Time driven (hours):</label>
      <input type="number" id="time" min="0" />
      <button onclick="calculateTransport('${subType}')">Next</button>
    `;
  } else if (subType === "bicycle") {
    step2.innerHTML = `
      <label>Type:</label>
      <select id="energyType">
        <option value="">Select</option>
        <option value="man">Man-powered</option>
        <option value="electric">Electric</option>
      </select>
      <label>Duration (hours):</label>
      <input type="number" id="time" min="0" />
      <button onclick="calculateTransport('${subType}')">Next</button>
    `;
  } else if (subType === "feet") {
    step2.innerHTML = `
      <label>Distance walked (km):</label>
      <input type="number" id="distance" min="0" />
      <button onclick="calculateTransport('${subType}')">Next</button>
    `;
  } else {
    step2.innerHTML = `
      <label>Energy type:</label>
      <select id="energyType">
        <option value="">Select</option>
        <option value="electric">Electric</option>
        <option value="fossil">Fossil Fuel</option>
        <option value="man">Man-powered</option>
      </select>
      <label>Usage amount:</label>
      <input type="number" id="amount" min="0" />
      <button onclick="calculateTransport('${subType}')">Next</button>
    `;
  }
}

function calculateTransport(type) {
  const e = id => parseFloat(document.getElementById(id)?.value || 0);
  const energyType = document.getElementById("energyType")?.value || "";
  let carbon = 0;  // grams/day

  if (type === "car") {
    const f = { electric: 0.2, fossil: 2.3 }; // grams per litre/kWh
    if (!f[energyType]) return alert("Please select a fuel type.");
    carbon = f[energyType] * e("amount") * e("time");
  } else if (type === "bicycle") {
    const f = { man: 0.02, electric: 1.0 }; // grams/hour
    if (!f[energyType]) return alert("Please select energy type.");
    carbon = f[energyType] * e("time");
  } else if (type === "feet") {
    carbon = 1 * e("distance"); // grams/km
  } else {
    carbon = 5 * e("amount"); // generic grams
  }

  transportCO2 = gramsToTons(carbon * 365); // grams/year → tons/year
  document.getElementById("step2").classList.add("hidden");
  nextFood();
}

/* ------------------------------
   FOOD STEP
   ------------------------------ */
function nextFood() {
  const step3 = document.getElementById("step3");
  step3.classList.remove("hidden");
  step3.innerHTML = `
    <label>Which food?</label>
    <select id="foodType">
      <option value="">Select</option>
      <option value="packed">Packed</option>
      <option value="fresh">Fresh</option>
      <option value="cooked">Cooked</option>
    </select>
    <button onclick="foodDetails()">Next</button>
  `;
}

function foodDetails() {
  const type = document.getElementById("foodType").value;
  if (!type) return alert("Select a food type.");

  const step3 = document.getElementById("step3");
  step3.innerHTML = "";

  if (type === "packed") {
    step3.innerHTML = `
      <label>Packing material:</label>
      <select id="subType">
        <option value="metallic">Metallic</option>
        <option value="plastic">Plastic</option>
        <option value="rubber">Rubber</option>
        <option value="paper">Paper</option>
      </select>
      <label>Amount (kg):</label>
      <input id="amount" type="number" min="0">
      <button onclick="calculateFood('${type}')">Next</button>`;
  }

  if (type === "fresh") {
    step3.innerHTML = `
      <label>Source:</label>
      <select id="subType">
        <option value="garden">Garden</option>
        <option value="supermarket">Supermarket</option>
        <option value="market">Market</option>
      </select>
      <label>Amount (kg):</label>
      <input id="amount" type="number" min="0">
      <button onclick="calculateFood('${type}')">Next</button>`;
  }

  if (type === "cooked") {
    step3.innerHTML = `
      <label>Fuel used:</label>
      <select id="subType">
        <option value="biogas">Biogas</option>
        <option value="electric">Electric</option>
        <option value="charcoal">Charcoal</option>
        <option value="firewood">Firewood</option>
        <option value="solar">Solar</option>
      </select>
      <label>Amount (kg):</label>
      <input id="amount" type="number">
      <label>Time (hrs):</label>
      <input id="time" type="number">
      <button onclick="calculateFood('${type}')">Next</button>`;
  }
}

function calculateFood(type) {
  const sub = document.getElementById("subType").value;
  const amount = parseFloat(document.getElementById("amount")?.value || 0);
  const time = parseFloat(document.getElementById("time")?.value || 0);
  let f = 0;  // grams/day

  if (type === "packed") {
    const a = { metallic: 2.5, plastic: 25, rubber: 15, paper: 10 };
    f = a[sub] * amount;
  }

  if (type === "fresh") {
    const a = { garden: 0.2, supermarket: 0.12, market: 0.8};
    f = a[sub] * amount;
  }

  if (type === "cooked") {
    const a = { biogas: 0.2, electric: 5, charcoal: 0.18, firewood: 0.22, solar: 0.1};
    f = a[sub] * amount * time;
  }

  foodCO2 = gramsToTons(f * 365); // grams/year → tons/year
  document.getElementById("step3").classList.add("hidden");
  nextHouse();
}

/* ------------------------------
   HOUSE STEP (unchanged)
   ------------------------------ */
function nextHouse() {
  const step4 = document.getElementById("step4");
  step4.classList.remove("hidden");
  step4.innerHTML = `
    <label>Which house?</label>
    <select id="houseType">
      <option value="">Select</option>
      <option value="brick">Brick/Concrete</option>
      <option value="metal">Metal/Glass</option>
      <option value="timber">Timber</option>
      <option value="grass">Grass/Mud</option>
    </select>
    <button onclick="houseSize()">Next</button>
  `;
}

function houseSize() {
  const type = document.getElementById("houseType").value;
  if (!type) return alert("Select a house type.");

  const step4 = document.getElementById("step4");
  step4.innerHTML = `
    <label>House size:</label>
    <select id="size">
      <option value="huge">Huge</option>
      <option value="big">Big</option>
      <option value="medium">Medium</option>
      <option value="small">Small</option>
    </select>
    <button onclick="calculateHouse('${type}')">Next</button>
  `;
}

function calculateHouse(type) {
  const size = document.getElementById("size").value;
  const factor = {
    brick: { huge: 2, big: 1.2, medium: 0.7, small: 4 },
    metal: { huge: 2.5, big: 15, medium: 0.8, small: 5 },
    timber: { huge: 10, big: 6, medium: 0.3, small: 1.5 },
    grass: { huge: 4, big: 2.5, medium: 1.2, small: 0.6 }
  };

  houseCO2 = factor[type][size]; // already in tons/year
  document.getElementById("step4").classList.add("hidden");
  tempRegulation();
}

/* ------------------------------
   TEMPERATURE REGULATION
   ------------------------------ */
function tempRegulation() {
  const step5 = document.getElementById("step5");
  step5.classList.remove("hidden");
  step5.innerHTML = `
    <label>Temperature regulation:</label>
    <select id="tempType">
      <option value="">Select</option>
      <option value="ac">A.C</option>
      <option value="chimney">Chimney</option>
      <option value="window">Window/Ventilation</option>
      <option value="other">Other</option>
    </select>
    <button onclick="tempDetails()">Next</button>
  `;
}

function tempDetails() {
  const t = document.getElementById("tempType").value;
  const step5 = document.getElementById("step5");

  if (!t) return alert("Select a temperature regulation type");

  if (t === "ac") {
    step5.innerHTML = `
      <label>AC Power (watts):</label>
      <input id="power" type="number" min="0">
      <button onclick="calculateTemp('${t}')">Finish</button>
    `;
  }

  if (t === "chimney" || t === "other") {
    step5.innerHTML = `
      <label>Fuel type:</label>
      <select id="fuel">
        <option value="">Select</option>
        <option value="coal">Coal</option>
        <option value="firewood">Firewood</option>
        <option value="charcoal">Charcoal</option>
        <option value="biogas">Biogas</option>
      </select>

      <label>Amount (kg or watts):</label>
      <input id="amount" type="number" min="0">

      <button onclick="calculateTemp('${t}')">Finish</button>
    `;
  }

  if (t === "window") {
    tempCO2 = 0;
    step5.classList.add("hidden");
    showResults();
  }
}

function calculateTemp(type) {
  let carbon = 0; // grams/day

  if (type === "ac") {
    const p = parseFloat(document.getElementById("power").value || 0);
    carbon = p * 0.4; // watts → grams/day estimate
  }

  if (type === "chimney" || type === "other") {
    const fuel = document.getElementById("fuel").value;
    const amount = parseFloat(document.getElementById("amount").value || 0);

    const f = {
      coal: 2.5,
      firewood: 4,
      charcoal: 1.8,
      biogas: 0.2
    };

    carbon = f[fuel] * amount;
  }

  tempCO2 = gramsToTons(carbon * 365);
  document.getElementById("step5").classList.add("hidden");
  showResults();
}

/* ------------------------------
   RESULTS
   ------------------------------ */
function showResults() {
  const safeTransportCO2 = isFinite(transportCO2) ? transportCO2 : 0;
  const safeFoodCO2 = isFinite(foodCO2) ? foodCO2 : 0;
  const safeHouseCO2 = isFinite(houseCO2) ? houseCO2 : 0;
  const safeTempCO2 = isFinite(tempCO2) ? tempCO2 : 0;

  const total = safeTransportCO2 + safeFoodCO2 + safeHouseCO2 + safeTempCO2;

  result.innerHTML = `
    <h3>Your Estimated Carbon Footprint</h3>
    <p>Transport: ${safeTransportCO2.toFixed(5)} tons/year</p>
    <p>Food: ${safeFoodCO2.toFixed(5)} tons/year</p>
    <p>House: ${safeHouseCO2.toFixed(5)} tons/year</p>
    <p>Temperature Regulation: ${safeTempCO2.toFixed(5)} tons/year</p>

    <h3>TOTAL: ${total.toFixed(5)} tons/year</h3>

    <h3>Seasonally: ${(total/4).toFixed(5)} tons</h3>
    <h3>Daily: ${(total/365).toFixed(7)} tons</h3>
    <h3>To Each: ${total.toFixed(5)} tons/year per person</h3>

    <p style="margin-top: 15px; font-size: 1.1em;">
      Your total annual carbon dioxide emission is <strong>${total.toFixed(5)} tons/year</strong>
      and the world's total annual carbon dioxide emission is
      <strong>38.52 billion tons</strong>.
    </p>
  `;

  result.classList.remove("hidden");
  drawChart(total);
}

/* ------------------------------
   CHART
   ------------------------------ */
function drawChart(total) {
  const chartEl = document.getElementById("chart");
  chartEl.classList.remove("hidden");

  const worldCO2 = 38_520_000_000; // tons
  const scaledWorldCO2 = worldCO2 / 1_000_000_000;

  new Chart(chartEl, {
    type: "bar",
    data: {
      labels: ["Your Total CO₂", "World Total CO₂ (billion tons)"],
      datasets: [{
        label: "Tons of CO₂ per year",
        data: [total, scaledWorldCO2],
        backgroundColor: ["#2f855a", "#3182ce"]
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });
}
