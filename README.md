# Jobs Dashboard (Static)

A small static web app inspired by the riyadh-day-app aesthetic, adapted for a job dashboard.

## Files
- `index.html` – layout (hero, filters, top picks, table).
- `styles.css` – bold editorial styling.
- `app.js` – loads `jobs.json`, filters, and badge logic.
- `jobs.json` – placeholder dataset (update with real jobs).
- `update_jobs.js` – helper to write jobs data to `jobs.json`.

## Usage
Open `index.html` in a local web server (or use any static file server) so `fetch('jobs.json')` works.

## Placeholder links
All links in `jobs.json` are safe placeholders (example.com). Replace with real URLs when ready.

## update_jobs.js example
```js
const { writeJobs } = require('./update_jobs');

const jobs = [
  {
    id: 'job-007',
    company: 'Placeholder Co',
    title: 'CTO',
    location: 'Remote',
    companyType: 'Private',
    size: '50',
    revenueConfidence: 'Low',
    link: 'https://example.com/job/7',
    fitRationale: 'Sample rationale',
    addedDate: '2026-01-31',
    roleType: 'CTO',
    topPick: false
  }
];

writeJobs(jobs);
```
