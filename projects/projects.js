import { fetchJSON,renderProjects } from '../global.js';
//  load the JSON data
const projects = await fetchJSON('../lib/projects.json');
// initialize the projects container element
const projectsContainer = document.querySelector('.projects');
// render the projects into the container element
renderProjects(projects, projectsContainer,'h2');
// count the projects in the h1 tittle
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// // create a pie plot of the projects using D3 path
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
// // let arc = arcGenerator({startAngle: 0, endAngle: 2 * Math.PI});
// // d3.select("svg").append("path").attr("d", arc).attr("fill", "red");

// // get projects year-count data
// let rolledData = d3.rollups(projects, (v) => v.length, (d) => d.year);
// let data = rolledData.map(([year, count]) => {return {value: count, label: year};});
// // create a pie chart using d3.pie
// // let data=[{value: 1, label: "apples"},
// //     {value: 2, label: "oranges"},
// //     {value: 3, label: "mangos"},
// //     {value: 4, label: "pears"},
// //     {value: 5, label: "limes"},
// //     {value: 5, label: "cherries"},
// // ];
// let sliceGenerator = d3.pie().value(d => d.value);
// let arcData = sliceGenerator(data);
// let arcs = arcData.map(d => arcGenerator(d));
// let colors = d3.scaleOrdinal(d3.schemeTableau10);
// arcs.forEach((arc,index) => {
//     d3.select("svg").append("path").attr("d", arc).attr("fill", colors(index));
// })

// // set legend to the pie plot
// let legend = d3.select(".legend");
// data.forEach((d, index) => {
//     legend
//     .append("li")
//     .attr("style", `--color: ${colors(index)}`)
//     .attr("class", "legend-item")
//     .html(`<span class="swatch"></span>${d.label} <em>(${d.value})</em>`);
// });


// // // add search query
// let query = '';
// let searchInput = document.querySelector('.searchBar');
// searchInput.addEventListener('input', (event) => {
//     // update query value based on the input event
//     query = event.target.value;
//     // filter the projects based on the search query
//     let filteredProjects = projects.filter((project) => 
//         {let values=Object.values(project).join('\n').toLowerCase();
//             return values.includes(query.toLowerCase());
//         }
//     );
//     // render the filtered projects into the container element
//     // renderProjects(filteredProjects, projectsContainer, 'h2');
//     renderPieChart(filteredProjects);
// });



// Refactor all plotting into one function

function renderPieChart(projectsGiven) {
    // re-calculate rolled data
    let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
    );
    // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value(d => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map(d => arcGenerator(d));
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    // TODO: clear up paths and legends
    d3.select("svg").selectAll("path").remove();
    d3.select(".legend").selectAll("li").remove();
    // update paths and legends, refer to steps 1.4 and 2.2
    // selectedIndex = -1;
    newArcs.forEach((arc, index) => {
        svg
            .append("path")
            .attr("d", arc)
            .attr("fill", colors(index))
            .on("click", () => {
            selectedIndex = selectedIndex === index ? -1 : index;

            svg
                .selectAll("path")
                .classed("selected", (_, idx) => idx === selectedIndex);

            legend
                .selectAll("li")
                .classed("selected", (_, idx) => idx === selectedIndex);

            // Filter projects when a slice is clicked
            if (selectedIndex === -1) {
                renderProjects(projectsGiven, projectsContainer, "h2");
            } else {
                const selectedYear = newData[selectedIndex].label;

                const yearProjects = projectsGiven.filter(
                project => project.year === selectedYear
                );

                renderProjects(yearProjects, projectsContainer, "h2");
            }
            }); // Click handler ends here
        }); // Loop ends here
    let legend = d3.select(".legend");
    newData.forEach((d, index) => {
        legend
        .append("li")
        .attr("style", `--color: ${colors(index)}`)
        .attr("class", "legend-item")
        .html(`<span class="swatch"></span>${d.label} <em>(${d.value})</em>`);
    });
}
// Call this function on page load
let selectedIndex = -1;
const svg = d3.select("svg");
renderPieChart(projects);
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();

    // Find projects containing the search text
    const filteredProjects = projects.filter((project) => {
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });

    // re-render legends and pie chart when event triggers
    renderProjects(filteredProjects, projectsContainer,'h2');
    renderPieChart(filteredProjects);
});












    