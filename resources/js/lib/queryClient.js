import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return null;
}

export async function apiRequest(method, url, data = null) {
    try {
        const response = await axios({
            method,
            url,
            data,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            withCredentials: true
        });
        return {
            ok: true,
            data: response.data,
            status: response.status
        };
    } catch (error) {
        if (error.response) {
            return {
                ok: false,
                error: error.response.data.message || 'An error occurred',
                status: error.response.status
            };
        }
        throw error;
    }
}

export const getQueryFn = ({ on401: unauthorizedBehavior }) => {
    return async ({ queryKey }) => {
        try {
            const response = await axios.get(queryKey[0], {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            if (unauthorizedBehavior === "returnNull" && error.response?.status === 401) {
                return null;
            }
            throw error;
        }
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