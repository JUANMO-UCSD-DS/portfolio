//  get all the links in the navigation menu
console.log("IT'S ALIVE!")
function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}
const navlinks = $$('nav ul li a');

// const currentLink = navlinks.find(a => a.host===location.host&&a.pathname===location.pathname);
// if (currentLink) {currentLink.classList.add('current');}

// set links for each page (absolute and relative URLs )
let pages=[
    { title: "Home", url: "" },
    { title: "Projects", url: "projects/" },
    { title: "Resume", url: "resume/" },
    { title: "Contact", url: "contact/" },
    { title: "GitHub", url: "https://github.com/juanmo-ucsd-ds" },
];
let nav = document.createElement('nav');
document.body.prepend(nav);
const BASE_PATH = 
location.hostname === "localhost" || location.hostname==='127.0.0.1'
 ? "/" : "/portfolio/";
for (let p of pages) {
    let url=p.url;
    let title=p.title;
    if (!url.startsWith("http")) {url = BASE_PATH + url;}
    // nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);
    if (a.host === location.host && a.pathname===location.pathname) 
        a.classList.add('current');
    if (a.host !== location.host)
        a.target = "_blank";
}

// set color theme option in the top right corner
document.body.insertAdjacentHTML(
  'beforeend',
  `
  <label class="color-theme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`
);
let select=document.querySelector('.color-theme select');
select.addEventListener('input',
    function (event) {
        console.log('color scheme changed to',event.target.value);
    }
);
if ('colorScheme' in localStorage) {
  document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
  select.value = localStorage.colorScheme;
}
select.addEventListener('input',
    function (event) {
        document.documentElement.style.setProperty('color-scheme', event.target.value);
        localStorage.colorScheme = event.target.value;
    }
);



