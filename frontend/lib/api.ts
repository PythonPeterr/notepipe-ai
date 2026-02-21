import { createClient } from "@/lib/supabase/client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token}`,
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

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}${path}`, { headers });
    return handleResponse<T>(response);
  },

  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(path: string): Promise<T> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers,
    });
    return handleResponse<T>(response);
  },
};
