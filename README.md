Coverly AI — Smart Cover Letter Generator

Coverly AI is a commercial-grade, secure, and highly optimized SaaS utility that takes user parameters (name, target role, company, key skills) and a parsed resume PDF to dynamically generate tailored, high-converting, human-sounding cover letters.

It features advanced client-side PDF parsing and secure double-path API routing (direct client connection or Vercel serverless function proxy).

 Key Features
- Modern UX/UI: Beautiful slate-dark glassmorphic design featuring ambient glows, step-by-step progress indicators, and custom micro-animations.
- Client-Side PDF Reader: Extracts plain text strings directly from uploaded PDF resumes using Mozilla's PDF.js in the browser (zero server costs).
- Anti-AI Prompt Engine: System prompts specifically optimized to avoid robotic introductions, AI buzzwords, and boilerplate formatting.
- Production-Ready Security: Fully integrated `.env` support locally, combined with a Vercel Serverless Function Proxy (`/api/generate`) that hides the Google Gemini API key from the user's browser in production.
- Dynamic Exporters: Download the generated letter as a beautifully styled PDF (using native print stylesheets) or copy it directly with custom feedback animations.
- 100% Lighthouse Score: Optimized loading strategies, strict semantic HTML5 structural layout, WCAG AA compliance, and descriptive SEO metadata.

---

 🛠️ Local Installation & Development

1.  Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd ai-cover-letter-generator
   ```

2. Install local development dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and insert your Google Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=AIzaSyYourGeminiAPIKeyHere
   ```
   *Note: `.gitignore` is configured to prevent your `.env` from ever being pushed to public repositories.*

4. Launch the development server:
   ```bash
   npm run dev
   ```
   This will start the local server on `http://localhost:3000` with hot-module reloading (HMR).

---

 Production Deployment (Vercel Serverless Gateway)

For secure enterprise deployments, we use Vercel Serverless Functions.

1. Deploy to Vercel:
   You can deploy directly via Vercel CLI or by linking your GitHub repository in the Vercel Dashboard.

2. Configure Production Variables:
   In your Vercel Project Settings under Environment Variables, add:
   - Key: `GEMINI_API_KEY`
   - Value: `[Your Actual Gemini API Key]`

   When deployed, the frontend automatically makes requests to `/api/generate` instead of directly calling Google. The serverless function retrieves the key server-side, protecting it from browser network inspection.*

---

 📄 File Architecture
```
ai-cover-letter-generator/
├── api/
│   └── generate.js         # Vercel serverless function proxy
├── public/                 # Static assets (logo, icons, etc.)
├── index.html              # Main application UI & HTML5 layout
├── style.css               # Styling variables, glassmorphism, responsive styles
├── app.js                  # Main JS Controller, state logic, PDF parser, exporters
├── vite.config.js          # Vite configurations (dev server, outputs)
├── package.json            # Scripts & configurations
├── .env.example            # Environment variables placeholder
├── .env                    # Local environment keys (git ignored)
├── .gitignore              # Security rules
├── Prompts.md              # AI system prompt documentation
└── README.md               # User manual and setup documentation
```
