
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";


async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  // Attach JWT token when the user is logged in.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const responseText = await response.text();

  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error("The server returned an invalid response.");
    }
  }

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed with status ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}


// GET request
export function apiGet(endpoint) {
  return apiRequest(endpoint, {
    method: "GET",
  });
}


// POST request
export function apiPost(endpoint, body) {
  return apiRequest(endpoint, {
    method: "POST",
    body: body instanceof FormData
      ? body
      : JSON.stringify(body),
  });
}


// PATCH request
export function apiPatch(endpoint, body) {
  return apiRequest(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}


// DELETE request
export function apiDelete(endpoint) {
  return apiRequest(endpoint, {
    method: "DELETE",
  });
}

export default apiRequest;
