# InterviewLens

AI-powered interview replay and analysis tool. Transform interview recordings into actionable insights.

将面试录音转化为可操作的洞察报告。

## Features

- **ASR Transcription** - Automatically transcribe interview recordings with speaker recognition
- **AI Analysis** - Get detailed feedback on each Q&A with scoring and suggestions
- **Replay Reports** - Comprehensive interview debrief with strengths, weaknesses, and recommendations

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Backend
- **Express** - Node.js web framework
- **LangChain** - LLM orchestration
- **OpenAI** - Whisper (ASR) + GPT (Analysis)

### Monorepo
- **Turborepo** - Build system
- **pnpm** - Package manager
- **Zod** - Schema validation

## Project Structure

```
interview-lens/
├── apps/
│   ├── web/                # Next.js frontend
│   └── api/                # Express backend
└── packages/
    ├── shared-types/       # Shared TypeScript types & Zod schemas
    ├── ui/                 # Shared UI components
    ├── eslint-config/      # ESLint config
    └── ts-config/          # TypeScript config
```

## Quick Start

### Prerequisites
- Node.js >= 18
- pnpm >= 8

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/interview-lens.git
cd interview-lens

# Install dependencies
pnpm install

# Configure environment
cp apps/api/.env.example apps/api/.env
# Edit .env and add your OPENAI_API_KEY

cp apps/web/.env.local.example apps/web/.env.local
```

### Development

```bash
# Start all apps (Web + API)
pnpm dev

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Build

```bash
# Build all packages and apps
pnpm build
```

## API Endpoints

### `POST /api/chat`
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "Hello, AI!",
  "conversationId": "optional-conv-id"
}
```

**Response:**
```json
{
  "response": "AI response here",
  "conversationId": "conv_1234567890",
  "messageId": "msg_1234567890",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### `GET /health`
Health check endpoint.

## Roadmap

- [x] Basic chat interface
- [x] LangChain integration
- [ ] Audio file upload
- [ ] Whisper ASR transcription
- [ ] Interview analysis with GPT
- [ ] Replay report generation
- [ ] Speaker diarization
- [ ] Resume/JD context support
- [ ] Interview history tracking

## License

MIT
