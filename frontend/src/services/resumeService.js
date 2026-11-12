
import { apiPost } from "./api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ["pdf", "txt"];

// Validate the selected resume before uploading.
export const validateResumeFile = (file) => {
  if (!file) {
    throw new Error("Please select a resume file.");
  }

  const extension = file.name.split(".").pop().toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error("Only PDF and TXT files are supported.");
  }

  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Resume file must not exceed 5 MB.");
  }

  return true;
};


// Upload resume to Flask backend.
export const uploadResume = async (file) => {
  validateResumeFile(file);

  const formData = new FormData();

  // This field name must match the Flask backend.
  formData.append("resume", file);

  const response = await apiPost(
    "/resumes/upload",
    formData
  );

  return response;
};

export default {
  uploadResume,
  validateResumeFile,
};
