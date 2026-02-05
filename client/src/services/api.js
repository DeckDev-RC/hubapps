import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

/**
 * Retorna a URL completa para um arquivo (logo ou instalador)
 */
export const getAssetUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Remove o sufixo /api da URL base se existir
    let baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

    // Se a URL for relativa (/api), usamos o origin do navegador
    if (baseUrl === '' || baseUrl.startsWith('/')) {
        baseUrl = window.location.origin;
    }

    // Garante que o path comece com /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Concatena tratando possíveis barras duplas (caso o baseUrl termine em /)
    return `${baseUrl.replace(/\/+$/, '')}${cleanPath}`;
};

export { API_BASE_URL };

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
