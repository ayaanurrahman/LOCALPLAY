import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
    index('routes/home.tsx'),                // / → home or redirect
    route('login', 'routes/login.tsx'),
    route('register', 'routes/register.tsx'),
    route('profile', 'routes/profile.tsx'),
    route('search', 'routes/search.tsx'),
    route('requests', 'routes/requests.tsx'),
    route('admin', 'routes/admin.tsx'),
] satisfies RouteConfig