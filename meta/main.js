import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// load data from CSV file
async function loadData() {
const data = await d3.csv('loc.csv'
, (row) => ({
...row,
line: Number(row.line), // or just +row.line
depth: Number(row.depth),
length: Number(row.length),
date: new Date(row.date + 'T00:00' + row.timezone),
datetime: new Date(row.datetime),
}));
return data;
}

// process commits from the loaded data
function processCommits(data) {
return d3
.groups(data, (d) => d.commit)
.map(([commit, lines]) => {
let first = lines[0];
let { author, date, time, timezone, datetime } = first;
let ret = {
  id: commit,
  author,
  date,
  time,
  timezone,
  datetime,
  hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
  totalLines: lines.length
};

Object.defineProperty(ret, 'lines', {
  value: lines,
  enumerable: false,
  writable: false,
  configurable: false
});
return ret;
});
}

// render commit information in the DOM
function renderCommitInfo(data, commits) {
// Create the dl element
const dl = d3.select('#stats').append('dl').attr('class','stats');
// Add total LOC
dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
dl.append('dd').text(data.length);
// Add total commits
dl.append('dt').text('Total commits');
dl.append('dd').text(commits.length);
// Add the longest line 
dl.append('dt').text('Longest line');
dl.append('dd').text(d3.max(data, d => d.length));
// add number of files
dl.append('dt').text('Total files');
dl.append('dd').text(d3.group(data,d => d.file).size);
// Average file length
dl.append('dt').text('Average file length');
dl.append('dd').text(Math.round(d3.mean(data, d => d.length)));
// max depth
dl.append('dt').text('Max depth');
dl.append('dd').text(d3.max(data, d => d.depth));
}


// Render the content of the tooltip for a given commit
function renderTooltipContent(commit) {
  if (Object.keys(commit).length === 0) return;
  const link = document.getElementById('commit-link');
  link.href = commit.url;
  link.textContent = commit.id;
  document.getElementById('commit-date').textContent =
    commit.datetime.toLocaleDateString('en', {
      dateStyle: 'full',
    });
  document.getElementById('commit-time').textContent =
    commit.datetime.toLocaleTimeString('en', {
      timeStyle: 'short',
    });
  document.getElementById('commit-author').textContent =
    commit.author;
  document.getElementById('commit-lines').textContent =
    commit.lines.length;
}

let xScale;
let yScale;
// drawing the scatter plot of commits by time of day
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 700;

  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
  };

const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Set the final ranges before drawing anything
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);
  
  // Add gridlines BEFORE the axes
  const gridlines = svg
  .append('g')
  .attr('class','gridlines')
  .attr('transform',`translate(${usableArea.left}, 0)`);
  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Draw the dots
  const dots = svg.append('g').attr('class', 'dots');

  // Determine the range of total lines for the radius scale
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  // adjust these values based on your experimentation
  const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([2, 30]);

  // Sort commits by total lines in descending order
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines); 
  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)       // Add transparency for overlapping dots
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity onhover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Draw the X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  // Draw the Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale));

  const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2,
  '0') + ':00');
}

// Update the visibility of the commit tooltip based on the provided boolean value
function updateTooltipVisibility(isVisible) {
const tooltip = document.getElementById('commit-tooltip');
tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left =`${event.clientX}px`;
  tooltip.style.top =`${event.clientY}px`;
}

// Create a brush selector for the SVG element
function createBrushSelector(svg) {
svg.call(d3.brush().on('start brush end', brushed));
// Raise dots and everything after overlay
svg.selectAll('.dots, .overlay ~ *').raise();
}

// Handle the brush event for selecting commits within the brush selection
function brushed(event) {
const selection = event.selection;
d3.selectAll('circle').classed('selected', (d) =>isCommitSelected(selection, d));
renderSelectionCount(selection);
renderLanguageBreakdown(selection);
  
}
function isCommitSelected(selection, commit) {
if (!selection) {
return false;
}
// TODO: return true if commit is within brushSelection
// and false if not
const [[x0, y0], [x1, y1]] = selection;
const x = xScale(commit.datetime);
const y = yScale(commit.hourFrac);
return x >= x0 && x <= x1 &&
        y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
const selectedCommits = selection
? commits.filter((d) => isCommitSelected(selection, d))
: [];
const countElement = document.querySelector('#selection-count');
countElement.textContent =`${
selectedCommits.length || 'No'
} commits selected`;
return selectedCommits;
}


function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
  return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );
  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const formatted = d3.format('.1%')(count / lines.length);

    container.innerHTML += `
      <div class="language-stat">
        <dt>${language.toUpperCase()}</dt>
        <dd>${count} lines<br>(${formatted})</dd>
      </div>
    `;
  }



  // container.innerHTML = '';
  // for (const [language, count] of breakdown) {
  //   const proportion = count / lines.length;
  //   const formatted = d3.format('.1~%')(proportion);
  //   container.innerHTML +=`
  //       <dt>${language}</dt>
  //       <dd>${count} lines (${formatted})</dd>
  //     `;
  //   } 
  }



let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
createBrushSelector(d3.select('svg'));





