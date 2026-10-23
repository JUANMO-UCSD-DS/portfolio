import { fetchJSON, renderProjects,fetchGitHubData } from './global.js';
// load data from projects
const projects = await fetchJSON('./lib/projects.json');
// render the latest 3 projects to homepage
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');


// load  GitHub data
const githubData = await fetchGitHubData('juanmo-ucsd-ds');
const profileStats = document.querySelector('#profile-stats');
// populate the git profilestats data
if (profileStats) {
    profileStats.innerHTML = `
        <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}

