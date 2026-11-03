
const rdColumn =
  "average_value_Research and development expenditure (% of GDP)";

// Exclude regional and income-group totals.
const aggregateCodes = new Set(`
  AFE AFW ARB CEB CSS EAP EAR EAS ECA ECS EMU EUU FCS
  HIC HPC IBD IBT IDA IDB IDX INX LAC LCN LDC LIC LMC
  LMY LTE MEA MIC MNA NAC OED OSS PRE PSS PST SAS SSA
  SSF SST TEA TEC TLA TMN TSA TSS UMC WLD
`.trim().split(/\s+/));

async function drawChart() {
  const rows = await d3.csv("./science-and-technology.csv");

  if (!rows.columns.includes(rdColumn)) {
    throw new Error("The R&D column was not found.");
  }

  // Remove missing observations before calculating averages.
  const data = rows
    .filter(d =>
      !aggregateCodes.has(d["Country Code"].trim()) &&
      d[rdColumn].trim() !== ""
    )
    .map(d => ({
      year: Number(d["Year"]),
      value: Number(d[rdColumn])
    }))
    .filter(d =>
      Number.isInteger(d.year) &&
      Number.isFinite(d.value) &&
      d.value >= 0
    );

  if (data.length === 0) {
    throw new Error("No valid R&D values were found.");
  }

  // Calculate the average and number of observations for each year.
  const averages = d3.rollups(
    data,
    values => ({
      mean: d3.mean(values, d => d.value),
      count: values.length
    }),
    d => d.year
  )
    .map(([year, summary]) => ({
      year,
      mean: summary.mean,
      count: summary.count
    }))
    .sort((a, b) => a.year - b.year);

  // Preserve gaps if an entire year has no observations.
  const byYear = new Map(averages.map(d => [d.year, d]));

  const years = d3.range(
    averages[0].year,
    averages.at(-1).year + 1
  );

  await Plotly.newPlot("chart", [{
    type: "scatter",
    mode: "lines",

    x: years,
    y: years.map(year => byYear.get(year)?.mean ?? null),

    customdata: years.map(year =>
      byYear.get(year)?.count ?? 0
    ),

    fill: "tozeroy",
    fillcolor: "rgba(37, 99, 235, 0.2)",

    line: {
      color: "#2563eb",
      width: 2
    },

    connectgaps: false,

    hovertemplate:
      "Year: %{x}<br>" +
      "Average R&D: %{y:.2f}% of GDP<br>" +
      "Countries with data: %{customdata}" +
      "<extra></extra>"
  }], {
    xaxis: {
      title: "Year",
      tickformat: "d"
    },

    yaxis: {
      title: "Mean country R&D expenditure (% of GDP)",
      rangemode: "tozero"
    },

    margin: {
      t: 20,
      l: 85,
      r: 25,
      b: 60
    }
  }, {
    responsive: true,
    displaylogo: false
  });

  document.querySelector("#status").textContent =
    "Hover over the chart to see the average and country count.";
}

drawChart().catch(error => {
  document.querySelector("#status").textContent = error.message;
});