
import { apiGet, apiPost } from "./api";

// Fetch all career paths supported by PlaceMate AI.
export const getAvailableCareers = async () => {
  const response = await apiGet("/analytics/careers");

  return response.careers || [];
};

// Analyze student skills for a selected career.
export const getSkillGapAnalysis = async (career) => {
  if (!career || typeof career !== "string") {
    throw new Error("Please select a valid career.");
  }

  const response = await apiPost("/analytics/skill-gap", {
    career: career,
  });

  return response.analysis;
};
