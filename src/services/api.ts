const HEROKU_BASE = 'https://proxy-server-we-eat-e24e32c11d10.herokuapp.com';
const LOCAL_BASE  = 'http://localhost:3000';

const FORCE_HEROKU = true;

export const API_BASE =
    FORCE_HEROKU
        ? HEROKU_BASE
        : (typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? LOCAL_BASE
            : HEROKU_BASE);
export const apiUrl = (path: string) =>
    `${API_BASE.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;