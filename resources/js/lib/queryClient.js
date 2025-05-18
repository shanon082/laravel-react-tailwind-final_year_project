import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

// Add base URL configuration
const api = axios.create({
    baseURL: '', // Removed /api prefix since routes are in web.php
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true
});

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
        const response = await api({
            method,
            url,
            data
        });
        return response.data;  // Return the data directly instead of the axios response
    } catch (error) {
        console.error('API Request Error:', error);
        if (error.response) {
            throw new Error(error.response.data.message || 'An error occurred');
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