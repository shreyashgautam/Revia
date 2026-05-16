<div align="center">

<br/>

```
██████╗ ███████╗██╗   ██╗██╗ █████╗ 
██╔══██╗██╔════╝██║   ██║██║██╔══██╗
██████╔╝█████╗  ██║   ██║██║███████║
██╔══██╗██╔══╝  ╚██╗ ██╔╝██║██╔══██║
██║  ██║███████╗ ╚████╔╝ ██║██║  ██║
╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚═╝  ╚═╝
```

### *someone texting back.*

<br/>

[![Status](https://img.shields.io/badge/status-active%20development-blueviolet?style=for-the-badge&labelColor=0d0d0d)](.)
[![LLM](https://img.shields.io/badge/LLM-Groq%20%7C%20Llama%203.3%2070B-ff6b6b?style=for-the-badge&labelColor=0d0d0d)](.)
[![Cloud](https://img.shields.io/badge/Cloud-AWS%20Serverless-FF9900?style=for-the-badge&labelColor=0d0d0d&logo=amazonaws)](.)
[![RT](https://img.shields.io/badge/Realtime-Socket.IO-010101?style=for-the-badge&labelColor=0d0d0d&logo=socket.io)](.)

<br/>

> **Revia** is not an AI assistant. It's an emotionally intelligent conversational platform that simulates real texting behavior — complete with delayed replies, message bursts, personality-driven tones, and contextual memory.

<br/>

</div>

---

## 🌌 What is Revia?

Most AI chats feel like talking to a robot. Revia feels like talking to *someone*.

It's a next-generation messaging platform that simulates **emotionally immersive, human-like conversations** through AI-powered personas — each with their own personality, texting style, emotional pacing, and memory of past interactions.

Instead of:

```
AI: "Hello! How are you doing today? I'm here to help you."
```

Revia feels like:

```
zara:  "heyy"

       ...typing

zara:  "kaha ho"

       ...typing

zara:  "replyyyy 😭"
```

---

## ✨ Core Features

### 🎭 Persona Engine

Every AI persona in Revia is a fully-realized conversational identity:

| Attribute | Description |
|---|---|
| `personality` | Traits, quirks, and emotional tendencies |
| `tone` | Emotional energy — warm, cold, playful, intense |
| `speaking style` | Formal, casual, poetic, Gen-Z, minimal |
| `texting behavior` | Message burst patterns, emoji frequency, reply speed |
| `relationship energy` | How they engage — as a friend, stranger, confidant |
| `gender identity` | Persona-aware contextual framing |
| `language preference` | English, Hinglish, mixed, regional |

---

### 💬 Human-Like Messaging

Revia simulates **real texting behavior**, not AI responses:

- ✦ Multiple short message bursts
- ✦ Realistic typing delays and indicators
- ✦ Emotional pauses mid-conversation
- ✦ Follow-up texts after silence
- ✦ Contextual mood shifts
- ✦ Imperfect, organic reply patterns

---

### 🧠 Contextual Memory System

Revia **remembers**. Not just the current session — but past ones too.

- Previous conversations and emotional discussions
- Recurring topics and important moments
- Contextual recall that feels natural, not mechanical
- Lightweight RAG architecture for memory retrieval

---

### ⚡ Real-Time Chat System

Built on live streaming architecture for zero-lag immersion:

- Socket.IO powered real-time messaging
- Progressive AI response streaming
- Live typing events and indicators
- Message chunk rendering as they arrive

---

### 🎨 Immersive UI/UX

A custom-designed messaging experience built to feel cinematic:

- Glassmorphism UI with layered depth
- Dynamic persona themes per conversation
- Framer Motion powered animated interactions
- Smooth transitions and modern messaging aesthetics
- Fully responsive across devices

---

## 🏗️ Architecture

### Message Flow

```
User Input
    │
    ▼
Frontend (React + Socket.IO Client)
    │
    ▼
Socket.IO Server
    │
    ▼
AWS API Gateway
    │
    ▼
AWS Lambda
    │
    ├──▶ Contextual Memory (DynamoDB)
    │
    ├──▶ Persona Engine
    │
    ▼
Groq API (Llama 3.3 70B / Mixtral 8x7B)
    │
    ▼
Streamed Response Chunks
    │
    ▼
DynamoDB Persistence
    │
    ▼
Frontend Rendering
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Role |
|---|---|
| React.js + TypeScript | Core UI framework |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Animations & transitions |
| Socket.IO Client | Real-time messaging |
| Redux Toolkit | State management |
| React Router | Navigation |
| Axios | HTTP requests |

### Backend

| Technology | Role |
|---|---|
| Node.js + Express.js | Server runtime |
| Socket.IO Server | WebSocket handling |
| AWS Lambda | Serverless compute |
| AWS API Gateway | API routing |
| DynamoDB | Primary database |
| AWS Cognito | Authentication |
| AWS S3 | File/media storage |
| AWS CloudWatch | Monitoring & logging |

### AI & LLM

| Technology | Role |
|---|---|
| Groq API | Ultra-fast LLM inference |
| Llama 3.3 70B Versatile | Primary conversational model |
| Mixtral 8x7B | Secondary model |
| Persona Prompt Engineering | Behavioral shaping |
| Lightweight RAG Architecture | Memory retrieval |

---

## 💾 Database Schema

### `Users`
Stores profile data and authentication references.

### `Personas`
Stores personality traits, emotional styles, speaking behavior, and avatar metadata.

### `Messages`
Stores full conversation history, streamed message chunks, timestamps, and persona references.

### `Memories`
Stores contextual summaries and lightweight memory retrieval data for long-term recall.

---

## 🔐 Authentication

Powered by **AWS Cognito** with:

- JWT token validation on all protected routes
- Secure session persistence
- Signup, login, and session management
- Protected conversation namespaces

---

## 🌌 ReKindle — *Experimental*

> Revia includes an experimental feature for those who've lost touch with someone.

**ReKindle** reconstructs the communication style and conversational patterns of someone from your past using:

- Old chat histories
- Texting patterns and vocabulary
- Communication style and emotional context
- Interaction rhythms and pacing

The goal is to simulate **emotionally familiar conversations** — not deceptive ones — while maintaining clear ethical boundaries.

---

## ✅ Currently Implemented

- [x] Authentication system (Cognito + JWT)
- [x] Real-time AI chat with streaming
- [x] Persona engine with behavioral profiles
- [x] Groq LLM integration
- [x] Human-like message chunking
- [x] Socket-based streaming architecture
- [x] Typing indicators
- [x] Conversation persistence (DynamoDB)
- [x] Dynamic persona themes
- [x] Responsive chat UI
- [x] AWS serverless backend
- [x] Multi-message burst streaming
- [x] Delayed conversational flow

---

## 🚀 Upcoming Features

- [ ] Advanced RAG memory system
- [ ] OCR-based memory ingestion from screenshots
- [ ] Voice interaction system
- [ ] AI voice cloning per persona
- [ ] Group AI conversations
- [ ] Relationship evolution engine
- [ ] Spontaneous AI-initiated messages
- [ ] Emotional state engine (moods that shift over time)
- [ ] AI-generated media memories

---

## ⚠️ Disclaimer

Revia is an **experimental emotional AI platform** built for:

- Conversational realism research
- AI interaction design exploration
- Emotional intelligence systems
- Memory-aware communication experiments

It is **not** designed to replace real human relationships, and should not be used as a substitute for genuine human connection or mental health support.

---

## 👨‍💻 Developer

**Shreyash Gautam**

Building emotionally immersive AI systems and next-generation conversational experiences.

---

<div align="center">

<br/>

*"Make AI conversations feel remembered, emotional, imperfect, and human."*

<br/>

**Revia is not designed to feel like an assistant.**
**It is designed to feel like someone texting back.**

<br/>

</div>