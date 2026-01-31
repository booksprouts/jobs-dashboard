const keywordFilter = document.getElementById('keywordFilter');
const locationFilter = document.getElementById('locationFilter');
const roleFilter = document.getElementById('roleFilter');
const companyTypeFilter = document.getElementById('companyTypeFilter');
const jobsTable = document.getElementById('jobsTable');
const jobsCards = document.getElementById('jobsCards');
const topPicks = document.getElementById('topPicks');
const filteredCount = document.getElementById('filteredCount');
const filteredCountMobile = document.getElementById('filteredCountMobile');
const totalCount = document.getElementById('totalCount');
const newBadge = document.getElementById('newBadge');
const resetFilters = document.getElementById('resetFilters');

let allJobs = [];

const normalize = (value) => value.toLowerCase().trim();

const parseDate = (value) => {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

const sortByAddedDateDesc = (a, b) => parseDate(b.addedDate) - parseDate(a.addedDate);

const toBulletList = (text) => {
  const items = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^-+\s*/, ''));
  if (!items.length) return '';
  return `<ul class="compact-list">${items
    .map((item) => `<li>${item}</li>`)
    .join('')}</ul>`;
};

const toLineBreaks = (text) =>
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('<br />');

const renderShortDescription = (text) => toBulletList(text);

const renderFitRationale = (text) => {
  const trimmed = text.trim();
  if (trimmed.startsWith('- ')) {
    return toBulletList(text);
  }
  return toLineBreaks(text);
};

const matchesKeyword = (job, keyword) => {
  if (!keyword) return true;
  const haystack = [
    job.company,
    job.title,
    job.location,
    job.fitRationale,
    job.shortDescription,
    job.size,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(keyword);
};

const matchesLocation = (job, location) => {
  if (location === 'any') return true;
  return normalize(job.location).includes(location);
};

const matchesRole = (job, role) => {
  if (role === 'any') return true;
  return normalize(job.roleType).includes(role);
};

const matchesCompanyType = (job, type) => {
  if (type === 'any') return true;
  return normalize(job.companyType) === type;
};

const renderTopPicks = (jobs) => {
  topPicks.innerHTML = '';
  const picks = jobs
    .filter((job) => job.topPick)
    .sort(sortByAddedDateDesc)
    .slice(0, 3);
  picks.forEach((job) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${job.company}</h3>
      <p>${job.title}</p>
      <span class="pill">${job.location}</span>
    `;
    topPicks.appendChild(card);
  });
};

const renderTable = (jobs) => {
  jobsTable.innerHTML = '';
  jobs.forEach((job) => {
    const shortDescription = job.shortDescription
      ? renderShortDescription(job.shortDescription)
      : '';
    const fitRationale = job.fitRationale ? renderFitRationale(job.fitRationale) : '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${job.company}</td>
      <td>${job.title}</td>
      <td>${job.location}</td>
      <td>${job.companyType}</td>
      <td>${job.size}</td>
      <td>${job.revenueConfidence}</td>
      <td><a href="${job.link}" target="_blank" rel="noopener">Open</a></td>
      <td>${shortDescription}</td>
      <td>${fitRationale}</td>
      <td>${job.addedDate}</td>
    `;
    jobsTable.appendChild(row);
  });
};

const renderCards = (jobs) => {
  if (!jobsCards) return;
  jobsCards.innerHTML = '';
  jobs.forEach((job) => {
    const card = document.createElement('article');
    card.className = 'job-card';
    const shortDescription = job.shortDescription
      ? `<dt>Short description</dt><dd>${renderShortDescription(
          job.shortDescription
        )}</dd>`
      : '';
    const fitRationale = job.fitRationale
      ? `<dt>Fit rationale</dt><dd>${renderFitRationale(job.fitRationale)}</dd>`
      : '';
    card.innerHTML = `
      <div class="job-card-head">
        <h3>${job.title}</h3>
        <p class="job-card-company">${job.company}</p>
        <span class="pill">${job.location}</span>
      </div>
      <dl class="job-card-details">
        <dt>Link</dt>
        <dd><a href="${job.link}" target="_blank" rel="noopener">Open</a></dd>
        <dt>Added date</dt>
        <dd>${job.addedDate}</dd>
        ${shortDescription}
        ${fitRationale}
      </dl>
    `;
    jobsCards.appendChild(card);
  });
};

const updateCounts = (shown, total) => {
  filteredCount.textContent = `Showing ${shown} roles`;
  if (filteredCountMobile) {
    filteredCountMobile.textContent = `Showing ${shown} roles`;
  }
  totalCount.textContent = `Total roles: ${total}`;
};

const applyFilters = () => {
  const keyword = normalize(keywordFilter.value);
  const location = normalize(locationFilter.value);
  const role = normalize(roleFilter.value);
  const companyType = normalize(companyTypeFilter.value);

  const filtered = allJobs.filter(
    (job) =>
      matchesKeyword(job, keyword) &&
      matchesLocation(job, location) &&
      matchesRole(job, role) &&
      matchesCompanyType(job, companyType)
  );
  filtered.sort(sortByAddedDateDesc);

  renderTable(filtered);
  renderCards(filtered);
  updateCounts(filtered.length, allJobs.length);
};

const updateNewBadge = (jobs) => {
  const snapshotKey = 'jobs_snapshot_v1';
  const stored = localStorage.getItem(snapshotKey);
  let previousIds = [];
  if (stored) {
    try {
      previousIds = JSON.parse(stored);
    } catch (error) {
      previousIds = [];
    }
  }

  const currentIds = jobs.map((job) => job.id);
  const newCount = currentIds.filter((id) => !previousIds.includes(id)).length;

  newBadge.textContent = `New since yesterday: ${newCount}`;
  localStorage.setItem(snapshotKey, JSON.stringify(currentIds));
};

const setupListeners = () => {
  [keywordFilter, locationFilter, roleFilter, companyTypeFilter].forEach(
    (input) => input.addEventListener('input', applyFilters)
  );

  resetFilters.addEventListener('click', () => {
    keywordFilter.value = '';
    locationFilter.value = 'any';
    roleFilter.value = 'any';
    companyTypeFilter.value = 'any';
    applyFilters();
  });
};

const loadJobs = async () => {
  const response = await fetch('jobs.json');
  const data = await response.json();
  allJobs = data.slice().sort(sortByAddedDateDesc);
  renderTopPicks(allJobs);
  renderTable(allJobs);
  renderCards(allJobs);
  updateCounts(allJobs.length, allJobs.length);
  updateNewBadge(allJobs);
};

setupListeners();
loadJobs().catch((error) => {
  jobsTable.innerHTML = `
    <tr>
      <td colspan="10">Failed to load jobs.json. ${error.message}</td>
    </tr>
  `;
  if (jobsCards) {
    jobsCards.innerHTML = `<p class="muted">Failed to load jobs.json. ${error.message}</p>`;
  }
});
