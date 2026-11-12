
import { apiGet, apiPost } from "./api";

// Submit an application for a job.
export const applyForJob = async (jobId) => {
  if (!jobId || !Number.isInteger(Number(jobId)) || Number(jobId) <= 0) {
    throw new Error("Please select a valid job.");
  }

  const response = await apiPost("/applications/", {
    job_id: Number(jobId),
  });

  return response;
};


// Fetch all applications submitted by the logged-in student.
export const getMyApplications = async () => {
  const response = await apiGet("/applications/");

  return response.applications || [];
};


// Fetch details of an individual application.
export const getApplicationById = async (applicationId) => {
  if (
    !applicationId ||
    !Number.isInteger(Number(applicationId)) ||
    Number(applicationId) <= 0
  ) {
    throw new Error("A valid application ID is required.");
  }

  const response = await apiGet(
    `/applications/${Number(applicationId)}`
  );

  return response.application;
};
