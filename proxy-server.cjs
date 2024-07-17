/* const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api', createProxyMiddleware({
  target: 'https://maps.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/maps/api', // rewrite path
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Access-Control-Allow-Origin', '*');
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

const GOOGLE_PLACES_API_KEY = 'AIzaSyADCxV3t9rLih5de7GhP7R8OlZ5RA1Y_tk';
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

app.get('/proxy', async (req, res) => {
  const { location, radius, keyword } = req.query;
  
  try {
    const response = await axios.get(GOOGLE_PLACES_API_URL, {
      params: {
        location,
        radius,
        keyword,
        type: 'restaurant',
        key: GOOGLE_PLACES_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from Google Places:', error);
    res.status(500).send('Error fetching data from Google Places');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
