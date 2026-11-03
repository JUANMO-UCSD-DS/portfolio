import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Column to plot
const column =
  "average_value_Population ages 65 and above (% of total population)";

// Load and clean the data.
// Check for blanks before converting to numbers:
// Number("") would incorrectly become 0.
const rawData = await d3.csv("health.csv");

const data = rawData
  .filter(d => d[column]?.trim() && d.Year?.trim())
  .map(d => ({
    country: d["Country Name"],
    year: Number(d.Year),
    value: Number(d[column])
  }))
  .filter(d => Number.isFinite(d.year) && Number.isFinite(d.value));

// Fill the dropdown
const countries = [...new Set(data.map(d => d.country))].sort();

const dropdown = d3.select("#country-select");

dropdown
  .selectAll("option")
  .data(countries)
  .join("option")
  .attr("value", d => d)
  .text(d => d);

// Show World first, if available
dropdown.property(
  "value",
  countries.includes("World") ? "World" : countries[0]
);

// Chart dimensions
const width = 800;
const height = 450;

const margin = {
  top: 40,
  right: 30,
  bottom: 60,
  left: 70
};

const svg = d3.select("#aging-chart")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .style("width", "100%")
  .style("max-width", "800px");

// Use fixed axes so switching countries gives a fair comparison
const x = d3.scaleLinear()
  .domain(d3.extent(data, d => d.year))
  .range([margin.left, width - margin.right]);

const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .nice()
  .range([height - margin.bottom, margin.top]);

// X-axis
svg.append("g")
  .attr("transform", `translate(0, ${height - margin.bottom})`)
  .call(d3.axisBottom(x).tickFormat(d3.format("d")));

// Y-axis
svg.append("g")
  .attr("transform", `translate(${margin.left}, 0)`)
  .call(d3.axisLeft(y).tickFormat(d => `${d}%`));

// Axis labels
svg.append("text")
  .attr("x", (margin.left + width - margin.right) / 2)
  .attr("y", height - 15)
  .attr("text-anchor", "middle")
  .text("Year");

svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -(margin.top + height - margin.bottom) / 2)
  .attr("y", 18)
  .attr("text-anchor", "middle")
  .text("Population aged 65+ (%)");

// Chart title
const title = svg.append("text")
  .attr("x", margin.left)
  .attr("y", 24)
  .attr("font-weight", "bold");

// Line generator
const line = d3.line()
  .x(d => x(d.year))
  .y(d => y(d.value));

// Add one path; update its data when the selection changes
const path = svg.append("path")
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 3);

function updateChart(country) {
  const countryData = data
    .filter(d => d.country === country)
    .sort((a, b) => a.year - b.year);

  title.text(`Population aging: ${country}`);

  path
    .datum(countryData)
    .attr("d", line);
}

// Update when the user chooses a country
dropdown.on("change", function () {
  updateChart(this.value);
});

// Draw the initial chart
updateChart(dropdown.property("value"));