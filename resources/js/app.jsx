import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const appName = import.meta.env.VITE_APP_NAME || 'Soroti University Timetable System';
const queryClient = new QueryClient();


createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
        setup({ el, App, props }) {
            const queryClient = new QueryClient();
        
            createRoot(el).render(
              <QueryClientProvider client={queryClient}>
                <App {...props} />
              </QueryClientProvider>
            );
          },
    progress: {
        color: '#0BF222FF',
    },
});
