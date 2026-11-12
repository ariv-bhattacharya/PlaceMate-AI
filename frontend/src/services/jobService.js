
import { apiGet } from "./api";

// Fetch all active jobs with eligibility and AI resume matching.
export const getJobs = async () => {
  const response = await apiGet("/jobs/");

  return response.jobs || [];
};

// Fetch details of a specific job.
export const getJobById = async (jobId) => {
  if (!jobId || !Number.isInteger(Number(jobId))) {
    throw new Error("A valid job ID is required.");
  }

  const response = await apiGet(`/jobs/${jobId}`);

  return response.job;
};
