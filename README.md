🚀 Revv — AI Visibility & GitHub Auth Platform
Revv is a full-stack web application that allows users to securely log in using GitHub and acts as a foundation for tracking and managing how developers and products interact with AI-powered systems. It demonstrates a real-world authentication flow, backend API handling, and seamless frontend-backend integration in a production-ready environment.
Built for scalability, Revv can be extended into an AI visibility platform where users can monitor, analyze, and improve how their content or products are represented across AI systems like ChatGPT, Gemini, and others.🌐 Live Demo
🔗 Frontend: https://project-aawll-rdufjc9cp-aryan-x677s-projects.vercel.app
🔗 Backend API: https://revv-vchr.onrender.com
📄 API Docs (Swagger): https://revv-vchr.onrender.com/docs
✨ Features
🔐 GitHub OAuth Authentication
⚡ FastAPI backend with REST APIs
🌍 Fully deployed (Frontend + Backend)
🔄 Real-time API communication
🧠 Scalable architecture for future AI integrations
📦 Clean project structure (monorepo: frontend + backend)
🛠️ Tech Stack
Frontend
React (Vite)
JavaScript
Tailwind CSS (if used)
Backend
FastAPI (Python)
Uvicorn
OAuth (GitHub Authentication)
Deployment
Vercel (Frontend)
Render (Backend)
📁 Project Structure
GitSense/
├── frontend/        # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/         # FastAPI backend
│   ├── main.py
│   ├── requirements.txt
│   └── routes/
⚙️ Environment Variables
🔐 Backend (Render)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
FRONTEND_URL=https://project-aawll-rdufjc9cp-aryan-x677s-projects.vercel.app
🌐 Frontend (Vercel)
VITE_API_URL=https://revv-vchr.onrender.com
🚀 Getting Started (Local Setup)
1️⃣ Clone the repo
git clone https://github.com/your-username/your-repo.git
cd your-repo
2️⃣ Setup Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
3️⃣ Setup Frontend
cd frontend
npm install
npm run dev
🔐 OAuth Flow
User clicks "Login with GitHub"
Redirects to GitHub OAuth
GitHub redirects to backend callback
Backend processes user data
User redirected to frontend dashboard
📌 Use Case
Revv is designed as a foundation for:
AI visibility tracking tools
Developer platforms
SaaS authentication systems
API-first products
🧪 Future Improvements
🧠 AI integration (LLM visibility tracking)
📊 Analytics dashboard
🔒 JWT-based session management
💳 SaaS monetization layer
