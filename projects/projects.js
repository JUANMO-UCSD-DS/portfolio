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