// Each source uses its exact CSV column name.
const sources = [
  {
    name: "Coal",
    column:
      "average_value_Electricity production from coal sources (% of total)",
    color: "#4b5563"
  },
  {
    name: "Natural gas",
    column:
      "average_value_Electricity production from natural gas sources (% of total)",
    color: "#f59e0b"
  },
  {
    name: "Oil",
    column:
      "average_value_Electricity production from oil sources (% of total)",
    color: "#a16207"
  },
  {
    name: "Nuclear",
    column:
      "average_value_Electricity production from nuclear sources (% of total)",
    color: "#8b5cf6"
  },
  {
    name: "Hydro",
    column:
      "average_value_Electricity production from hydroelectric sources (% of total)",
    color: "#3b82f6"
  },
  {
    name: "Other renewables",
    column:
      "average_value_Electricity production from renewable sources, excluding hydroelectric (% of total)",
    color: "#22c55e"
  }
];

// Exclude regional and income aggregates, but retain World separately.
const aggregateCodes = new Set(`
  AFE AFW ARB CEB CSS EAP EAR EAS ECA ECS EMU EUU FCS
  HIC HPC IBD IBT IDA IDB IDX INX LAC LCN LDC LIC LMC
  LMY LTE MEA MIC MNA NAC OED OSS PRE PSS PST SAS SSA
  SSF SST TEA TEC TLA TMN TSA TSS UMC WLD
`.trim().split(/\s+/));

const countrySelect = document.querySelector("#country-select");
const status = document.querySelector("#status");

function parseNumber(value) {
  const text = String(value ?? "").trim();

  if (text === "" || text === "..") return null;

  const number = Number(text);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

async function initialize() {
  const rawData = await d3.csv("./energy-and-mining.csv");

  // Check that all necessary columns exist.
  const requiredColumns = [
    "Country Name",
    "Country Code",
    "Year",
    ...sources.map(source => source.column)
  ];

  for (const column of requiredColumns) {
    if (!rawData.columns.includes(column)) {
      throw new Error(`Missing column: ${column}`);
    }
  }

  const data = rawData
    .map(row => ({
      country: row["Country Name"].trim(),
      code: row["Country Code"].trim(),
      year: Number(row["Year"]),

      values: sources.map(source =>
        parseNumber(row[source.column])
      )
    }))
    .filter(d =>
      d.country &&
      Number.isInteger(d.year) &&
      (d.code === "WLD" || !aggregateCodes.has(d.code))
    );

  // Countries remain available even if they have no source data.
  const byCountry = d3.group(data, d => d.code);

  const countries = [...byCountry.entries()]
    .map(([code, rows]) => ({
      code,
      name: rows[0].country
    }))
    .sort((a, b) => {
      if (a.code === "WLD") return -1;
      if (b.code === "WLD") return 1;

      return a.name.localeCompare(b.name);
    });

  for (const country of countries) {
    countrySelect.add(
      new Option(country.name, country.code)
    );
  }

  if (countries.length === 0) {
    throw new Error("No country data found.");
  }

  countrySelect.value = byCountry.has("WLD")
    ? "WLD"
    : countries[0].code;

  // Limit the chart to the overall period with source observations.
  const sourceRows = data.filter(d =>
    d.values.some(value => value !== null)
  );

  if (sourceRows.length === 0) {
    throw new Error("No electricity-generation source values found.");
  }

  const firstYear = d3.min(sourceRows, d => d.year);
  const lastYear = d3.max(sourceRows, d => d.year);

  const years = d3.range(firstYear, lastYear + 1);

  async function drawChart() {
    const rows = byCountry.get(countrySelect.value);
    const countryName = rows[0].country;

    const byYear = new Map();

    for (const row of rows) {
      if (byYear.has(row.year)) {
        throw new Error(
          `Duplicate year for ${countryName}: ${row.year}`
        );
      }

      byYear.set(row.year, row);
    }

    // Require all six values for each displayed bar.
    // Missing values are never replaced by zero.
    const completeRows = years
      .map(year => byYear.get(year))
      .filter(row =>
        row && row.values.every(value => value !== null)
      );

    const completeByYear = new Map(
      completeRows.map(row => [row.year, row])
    );

    const traces = sources.map((source, index) => ({
      type: "bar",
      name: source.name,

      x: years,

      y: years.map(year =>
        completeByYear.get(year)?.values[index] ?? null
      ),

      marker: {
        color: source.color
      },

      hovertemplate:
        "Year: %{x}<br>" +
        "Share: %{y:.2f}%" +
        "<extra>" + source.name + "</extra>"
    }));

    // Preserve original shares rather than rescaling them to 100%.
    const maximumTotal = d3.max(
      completeRows,
      row => d3.sum(row.values)
    ) ?? 100;

    await Plotly.react("chart", traces, {
      title: {
        text: countryName
      },

      barmode: "stack",
      bargap: 0.05,

      xaxis: {
        title: "Year",
        tickformat: "d",
        range: [firstYear - 0.5, lastYear + 0.5]
      },

      yaxis: {
        title: "Share of electricity generation (%)",
        range: [0, Math.max(100, maximumTotal)],
        ticksuffix: "%"
      },

      legend: {
        orientation: "h",
        y: -0.2
      },

      annotations: completeRows.length === 0 ? [{
        text: "No years have complete data for all six sources",
        x: 0.5,
        y: 0.5,
        xref: "paper",
        yref: "paper",
        showarrow: false
      }] : [],

      margin: {
        t: 60,
        l: 75,
        r: 20,
        b: 110
      }
    }, {
      responsive: true,
      displaylogo: false
    });

    status.textContent =
      `${countryName}: ${completeRows.length} years with complete ` +
      `source data. Display period: ${firstYear}–${lastYear}. ` +
      "Original shares are shown without rescaling.";
  }

  countrySelect.addEventListener("change", () => {
    drawChart().catch(showError);
  });

  await drawChart();
}

function showError(error) {
  console.error(error);
  status.textContent = error.message;
}

initialize().catch(showError);