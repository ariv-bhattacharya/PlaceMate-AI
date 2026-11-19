
import { apiPost } from "./api";

export const askCareerMentor = async (question) => {
  if (!question || !question.trim()) {
    throw new Error("Please enter your question.");
  }

  return apiPost("/ai/career-mentor", {
    question: question.trim(),
  });
};
