# Bridgelease - Tenant-Landlord Communication Platform

A modern web application for managing tenant-landlord communications, maintenance requests, , and property management.

## Deployment Guide

### Frontend Deployment (Netlify)

1. Push your code to a GitHub repository
2. Sign up or log in to [Netlify](https://www.netlify.com/)
3. Click "New site from Git" and select your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Important**: Add environment variables in the Netlify dashboard:
   - Go to Site settings > Build & deploy > Environment
   - Add `VITE_API_URL` with your deployed backend URL

### Backend Deployment Options

Choose one of these platforms to deploy your backend:

#### Option 1: Render
1. Sign up for [Render](https://render.com/)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set the build command: `npm install`
5. Set the start command: `npm start`
6. Add environment variables for MongoDB connection and JWT secret

#### Option 2: Railway
1. Sign up for [Railway](https://railway.app/)
2. Create a new project and select your GitHub repository
3. Add a MongoDB database to your project
4. Configure environment variables
5. Deploy your application

#### Option 3: Heroku
1. Sign up for [Heroku](https://www.heroku.com/)
2. Install Heroku CLI and login: `heroku login`
3. Create a new app: `heroku create your-app-name`
4. Set environment variables: `heroku config:set MONGODB_URI=your_uri`
5. Push to Heroku: `git push heroku main`

### Configure CORS in Your Backend

Make sure to configure CORS in your backend to allow requests from your Netlify domain:

```javascript
// In your backend server.js or app.js
const cors = require('cors');

// Allow requests from your Netlify domain
app.use(cors({
  origin: [
    'http://localhost:5173', // Local development
    'https://your-netlify-app.netlify.app' // Your Netlify domain
  ],
  credentials: true
}));
```

## Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env.development` file with your local configuration
4. Start the development server: `npm run dev`

## Features

- User authentication (login/signup)
- Dashboard with real-time updates
- Maintenance request system
- Messaging between tenants and landlords
- Payment tracking and management
- Profile management with avatar customization

## Technologies

- Frontend: React, Tailwind CSS, Vite
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT 