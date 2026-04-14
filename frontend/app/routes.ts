import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
    index('routes/landing.tsx'),
    route('home', 'routes/home.tsx'),
    route('login', 'routes/login.tsx'),
    route('register', 'routes/register.tsx'),
    route('profile', 'routes/profile.tsx'),
    route('search', 'routes/search.tsx'),
    route('requests', 'routes/requests.tsx'),
    route('admin', 'routes/admin.tsx'),
    route('verify-email', 'routes/verify-email.tsx'),
] satisfies RouteConfig