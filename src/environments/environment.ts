export const environment = {
  production: false,
  apiUrl:
    window.location.hostname === 'localhost'
      ? 'https://taskmanager-ojep.onrender.com/api'
      : 'https://taskmanager-ojep.onrender.com/api',
  trackingApiUrl: 'https://taskmanager-ojep.onrender.com/api/visit',
};
