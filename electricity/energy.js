const ACCESS_COLUMN =
  "average_value_Access to electricity (% of population)";

const slider = document.querySelector("#year-slider");
const yearLabel = document.querySelector("#year-label");
const status = document.querySelector("#status");

// Exclude World Bank regional and income-group aggregates.
const aggregateCodes = new Set(`
  AFE AFW ARB CEB CSS EAP EAR EAS ECA ECS EMU EUU FCS
  HIC HPC IBD IBT IDA IDB IDX INX LAC LCN LDC LIC LMC
  LMY LTE MEA MIC MNA NAC OED OSS PRE PSS PST SAS SSA
  SSF SST TEA TEC TLA TMN TSA TSS UMC WLD
`.trim().split(/\s+/));

function parseNumber(value) {
  const text = String(value ?? "").trim();

  // Missing values are not zero.
  if (text === "" || text === "..") return NaN;

  return Number(text);
}

async function initialize() {
  const rows = await d3.csv("./energy-and-mining.csv");

  for (const column of [
    "Country Name",
    "Country Code",
    "Year",
    ACCESS_COLUMN
  ]) {
    if (!rows.columns.includes(column)) {
      throw new Error(`Missing column: ${column}`);
    }
  }

  const data = rows
    .map(row => ({
      country: row["Country Name"].trim(),
      code: row["Country Code"].trim().toUpperCase(),
      year: parseNumber(row["Year"]),
      access: parseNumber(row[ACCESS_COLUMN])
    }))
    .filter(d =>
      d.country &&
      /^[A-Z]{3}$/.test(d.code) &&
      !aggregateCodes.has(d.code) &&
      Number.isInteger(d.year) &&
      Number.isFinite(d.access) &&
      d.access >= 0 &&
      d.access <= 100
    );

  if (data.length === 0) {
    throw new Error("No valid electricity-access observations found.");
  }

  const byYear = d3.group(data, d => d.year);

  const years = [...byYear.keys()]
    .sort((a, b) => a - b);

  slider.min = years[0];
  slider.max = years.at(-1);
  slider.step = 1;
  slider.value = years.at(-1);
  slider.disabled = false;

  async function drawMap() {
    const year = Number(slider.value);
    const yearData = byYear.get(year) ?? [];

    yearLabel.textContent = year;
    slider.setAttribute("aria-valuetext", String(year));

    await Plotly.react("map", [{
      type: "choropleth",

      locations: yearData.map(d => d.code),
      locationmode: "ISO-3",

      z: yearData.map(d => d.access),
      text: yearData.map(d => d.country),

      // Fixed scale allows comparisons between years.
      zmin: 0,
      zmax: 100,

      colorscale: [
        [0, "#c2410c"],
        [0.25, "#fb923c"],
        [0.5, "#fff7ed"],
        [0.75, "#93c5fd"],
        [1, "#1d4ed8"]
      ],

      marker: {
        line: {
          color: "white",
          width: 0.4
        }
      },

      colorbar: {
        title: "Electricity<br>access",
        ticksuffix: "%",
        tickvals: [0, 25, 50, 75, 100]
      },

      hovertemplate:
        "<b>%{text}</b><br>" +
        `Year: ${year}<br>` +
        "Access to electricity: %{z:.1f}%" +
        "<extra></extra>"
    }], {
      geo: {
        projection: {
          type: "natural earth"
        },

        showland: true,
        landcolor: "#d1d5db",

        showcountries: true,
        countrycolor: "white",

        showcoastlines: false,
        showframe: false,

        bgcolor: "white"
      },

      // Preserve the map position while changing years.
      uirevision: "electricity-access",

      margin: {
        t: 20,
        l: 0,
        r: 0,
        b: 20
      }
    }, {
      responsive: true,
      displaylogo: false
    });

    status.textContent =
      `${yearData.length} countries and economies have data in ${year}.`;
  }

  slider.addEventListener("input", () => {
    drawMap().catch(showError);
  });

  await drawMap();
}

function showError(error) {
  console.error(error);
  status.textContent = `Error: ${error.message}`;
}

initialize().catch(showError);