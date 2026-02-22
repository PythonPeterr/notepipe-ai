import { createClient } from "@/lib/supabase/client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  if (DEV_BYPASS) {
    return {
      Authorization: "Bearer dev-bypass",
      "Content-Type": "application/json",
    };
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  };
};

const refreshAndGetHeaders = async (): Promise<Record<string, string>> => {
  if (DEV_BYPASS) {
    return {
      Authorization: "Bearer dev-bypass",
      "Content-Type": "application/json",
    };
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.refreshSession();
  if (!session) {
    window.location.href = "/auth/login";
    throw new Error("Session expired");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

async function fetchWithRetry<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (response.status === 401 && !DEV_BYPASS) {
    const newHeaders = await refreshAndGetHeaders();
    const retryInit = { ...init, headers: { ...init.headers, ...newHeaders } };
    const retryResponse = await fetch(url, retryInit);
    return handleResponse<T>(retryResponse);
  }

  return handleResponse<T>(response);
}

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<T>(`${BASE_URL}${path}`, { headers });
  },

  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<T>(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<T>(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete: async <T>(path: string): Promise<T> => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<T>(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers,
    });
  },

  upload: async <T>(path: string, file: File): Promise<T> => {
    const headers = await getAuthHeaders();
    delete headers["Content-Type"];
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.status === 401 && !DEV_BYPASS) {
      const newHeaders = await refreshAndGetHeaders();
      delete newHeaders["Content-Type"];
      const retryResponse = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: newHeaders,
        body: formData,
      });
      return handleResponse<T>(retryResponse);
    }

    return handleResponse<T>(response);
  },
};
