# Messenger Backend

A real-time messaging backend built with Express, Socket.io, and CometChat integration.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RafeSafari/messenger-backend.git
   cd messenger-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory with the following variables:
   ```env
   JWT_SECRET=your_jwt_secret_key_here
   COMETCHAT_APP_ID=your_cometchat_app_id
   COMETCHAT_REGION=your_cometchat_region
   COMETCHAT_API_KEY=your_cometchat_api_key
   PORT=50005
   ```

   > **Note:** `PORT` is optional and defaults to `50005` if not provided.

## Running the Application

### Development Mode
Run the server with hot-reload:
```bash
npm run dev
```

For debugging with Node.js inspector:
```bash
npm run debug
```

### Production Mode
1. Build the TypeScript code:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

The server will start on `http://localhost:50005` (or the port specified in your `.env` file).

> **Note:** Make sure to stop the development server (`npm run dev`) before running `npm start` to avoid port conflicts.

## API Endpoints

- **Public Routes:**
  - `/auth` - Authentication endpoints

- **Protected Routes** (require authentication):
  - `/contacts` - Contact management
  - `/chat` - Chat functionality

## Technologies Used

- Express.js - Web framework
- Socket.io - Real-time communication
- CometChat - Chat service integration
- TypeScript - Type-safe JavaScript
- JWT - Authentication
- bcrypt - Password hashing

