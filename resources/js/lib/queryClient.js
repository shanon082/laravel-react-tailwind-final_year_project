import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method, path, body = null) {
  if (method !== "GET") {
    await fetch("http://127.0.0.1:8000/sanctum/csrf-cookie", {
      credentials: "include",
    });
  }

  const cleanPath = path.startsWith("/api") ? path.replace("/api", "") : path;
  const url = `/api${cleanPath}`;
  console.log("Request URL:", url);

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-XSRF-TOKEN": document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || "",
      ...(localStorage.getItem("token") && path !== "/courses"
        ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
        : {}),
    },
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    await throwIfResNotOk(response);
  }

  return response.json();
}

export const getQueryFn = ({ on401: unauthorizedBehavior }) => {
  return async ({ queryKey }) => {
    const res = await fetch(queryKey[0], {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});