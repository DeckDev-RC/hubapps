import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const getAssetUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    let baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

    if (baseUrl === '' || baseUrl.startsWith('/')) {
        baseUrl = window.location.origin;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl.replace(/\/+$/, '')}${cleanPath}`;
};

export { API_BASE_URL };

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    me: () => api.get('/auth/me'),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    getUser: () => JSON.parse(localStorage.getItem('user') || '{}'),
    isAuthenticated: () => !!localStorage.getItem('token'),
    isAdmin: () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.role === 'admin';
    }
};

export const departmentService = {
    list: () => api.get('/departments'),
    get: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.put(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`)
};

export const userService = {
    list: () => api.get('/users'),
    get: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`)
};

export default api;
