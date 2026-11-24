// Single fetch wrapper enforcing credentials: 'include' so httpOnly session cookies flow automatically
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    // credentials: 'include' sends the session cookie on every request and saves Set-Cookie headers
    credentials: 'include',
  });

  // 204 No Content has no body
  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(data?.detail || 'Request failed');
    error.status = response.status;
    error.errors = data?.errors || {}; // Carries field-specific Pydantic validation errors
    throw error;
  }

  return data;
}
