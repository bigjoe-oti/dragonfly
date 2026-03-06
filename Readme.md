# J. Servo AI Stack Architect

The J. Servo AI Stack Architect is a dynamic application designed to replace legacy static tools. It translates a natural language business problem into a comprehensive, executable AI transformation roadmap:

1. **Strategic Validation:** Dynamic ROI forecasts and Enterprise Compliance Audits (Data Residency, GDPR, SOC2).
2. **Visual Architecture:** Interactive React Flow blueprints mapping the optimal AI tech stack.
3. **Zero-Day Deployment:** Downloadable n8n workflows and custom developer prompts ready for immediate execution.

## Prerequisites

- Node.js (v18+ recommended)
- npm (Node Package Manager)
  - OpenRouter API Key

## Project Structure

This is a monorepo setup:

- `/client`: The Vite + React 18 frontend implementation (Single-File Build).
- `/server`: The Express + Node.js backend handling AI orchestration, mathematical ROI calculations, and compliance/prompt generation routes.

## Installation

1. Navigate to the root directory and run the global install script:

   ```bash
   npm run install:all
   ```

   *(This will install dependencies for the root, `/server`, and `/client` directories.)*

2. Create a `.env` file inside the `/server` directory:

   ```env
   OPENROUTER_API_KEY=your_openrouter_key_here
   PORT=3001
   ALLOWED_ORIGINS=https://jservo.com,https://www.jservo.com
   NODE_ENV=development
   ```

## Running the Application Locally

To start the development environment concurrently (both frontend and backend), simply run:

```bash
npm run dev
```

- The UI will be available at `http://localhost:5173`.
- The backend API will be running on `http://localhost:3001`.

## Building for Production (Divi Code Module)

The frontend is specifically configured to build into a **single, standalone HTML file** containing all JS logic and CSS styles for drop-in compatibility with WordPress Divi Code Modules.

To compile this build:

```bash
npm run build
```

Navigate to `/client/dist/index.html` to find the generated standalone module.
