# 🎨 AI Brainstorm Canvas (HackNU)

A limitless, real-time collaborative whiteboard supercharged by a native, multimodal AI assistant. Built for seamless team brainstorming, structuring complex ideation, and visual mapping.

The AI doesn't just chat with you—it actually lives inside the canvas. It can physically place sticky notes, draw logical arrows, and actively organize your visual workspace. 

## ✨ Key Features

- **Infinite Canvas Workspace**: A fully robust, smooth, and infinite grid powered by [Tldraw](https://tldraw.dev).
- **Real-time Multiplayer Collaboration**: Cursor tracking, live edits, and room synchronization powered by [Liveblocks](https://liveblocks.io).
- **Spatial AI Agent**: Integrated with Google Gemini 2.5, our AI operates natively on the canvas. Call upon the AI to "Summarize Canvas" or "Analyze Screen" to have it intelligently cluster thoughts and map relationships using visual sticky notes and arrows using clean `sans` fonts.
- **Multimodal Inputs**: 
  - **🎙️ Voice Prompts**: Talk directly to the canvas using your microphone.
  - **🖼️ Image Attachments**: Upload screenshots or diagrams and ask the AI to ingest and organize the context.
- **Minimalist Aesthetic**: Engineered to fade into the background. Your ideas are the focus.

## 🛠️ Technology Stack

- **Frontend**: Next.js 16+, TypeScript, TailwindCSS
- **Canvas Engine**: Tldraw
- **Multiplayer**: Liveblocks
- **Backend API**: Python 3.9+, FastAPI, Uvicorn
- **AI Core**: Google GenAI SDK (Gemini 2.5 Flash Preview)
- **Auth & Database**: Supabase

---

## 🚀 Getting Started

To run this application locally, you will need to start both the Python backend and the Next.js frontend.

### 1. Backend Setup (FastAPI + AI Agent)

Navigate to the `backend` directory and set up your Python environment:

```bash
cd backend

# Create a virtual environment and activate it
python3.9 -m venv .venv
source .venv/bin/activate

# Install the required dependencies
pip install -r requirements.txt
```

**Environment Variables (`backend/.env`)**
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-preview-04-17
PORT=8000
DEBUG=True
CORS_ORIGINS=["http://localhost:3000"]
```

**Run the Server**
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup (Next.js)

Open a new terminal window and navigate to the `frontend` directory:

```bash
cd frontend

# Install dependencies
npm install
```

**Environment Variables (`frontend/.env.local`)**
Create an `.env.local` file and add your Liveblocks and Supabase keys:
```env
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=your_liveblocks_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Run the Client**
```bash
npm run dev
```

The application will now be running at `http://localhost:3000`. Navigate there to create a new board, invite your friends, and start brainstorming with AI!