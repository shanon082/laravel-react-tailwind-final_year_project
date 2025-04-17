import { usePage } from "@inertiajs/react";

export const useAuth = () => {
  const { auth } = usePage().props;

  // Debug: Log auth prop
  console.log("useAuth: auth =", auth);

  // Normalize auth to always return a user object
  const user = auth?.user || auth || null;

  // Debug: Log normalized user
  console.log("useAuth: user =", user);

  return {
    user: user && typeof user === "object" ? user : null,
  };
};