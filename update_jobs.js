const fs = require('fs');
const path = require('path');

const jobsPath = path.join(__dirname, 'jobs.json');

const writeJobs = (jobsArray, outputPath = jobsPath) => {
  if (!Array.isArray(jobsArray)) {
    throw new Error('writeJobs expects an array of job objects');
  }

  const payload = JSON.stringify(jobsArray, null, 2);
  fs.writeFileSync(outputPath, payload, 'utf8');
  return outputPath;
};

module.exports = { writeJobs };
