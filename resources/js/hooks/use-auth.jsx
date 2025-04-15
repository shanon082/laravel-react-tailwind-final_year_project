import { usePage } from '@inertiajs/react';

export const useAuth = () => {
  const { props } = usePage();
  return { user: props.auth.user };
};
