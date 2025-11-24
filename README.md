# 🎙️  Audio transcription services

A  audio transcription application built with **React**, **Node.js**, **MongoDB**, and **Microsoft Azure Speech Services**. Users can submit audio URLs, get them transcribed automatically, and manage recent transcriptions with search, sorting, and pagination.  

---

## 📘 Project Description

The **Audio transcription services** provides a complete solution for converting audio files into text using Azure Cognitive Services. It includes both a **backend** that handles audio processing and transcription storage, and a **frontend** React interface for submitting audio and viewing results.  

**Key Features:**  
- **Azure Speech-to-Text Integration:** Converts audio to text using Microsoft Azure’s AI-powered speech recognition.  
- **Frontend Validation:** Supports URL validation and allowed audio formats (MP3, WAV, OGG, M4A).  
- **Audio Conversion:** Backend converts audio to WAV (PCM16) using ffmpeg for accurate transcription.  
- **Manual Retry & Blocking System:** Prevents abuse by blocking repeated failed attempts.  
- **MongoDB Storage:** Stores transcription history with metadata (URL, language, timestamp).  
- **Recent Transcriptions:** Search, sort (newest, oldest, A-Z, Z-A), and pagination support.  
- **Expandable Transcription View:** “Read more / Read less” for long transcriptions.  
-  

**Technologies Used:**  
- **Frontend:** React, Tailwind CSS  
- **Backend:** Node.js, Express, Azure Cognitive Services Speech SDK, Axios, ffmpeg  
- **Database:** MongoDB  

---
# Note : using the real Azure Speech Keys
          -> Key
          -> region


 
## Scalability & System Design ##

# Asynchronous Processing with Queues

  Offload transcription tasks to a queue system (e.g., RabbitMQ, Azure Queue Storage).

  Worker nodes process audio in the background, preventing request blocking and enabling horizontal scaling.

# Containerization & Autoscaling

   Package the backend as Docker containers.

   Use Kubernetes or cloud autoscaling to dynamically increase/decrease instances based on load.

# Caching & Temporary Storage Optimization

  Cache frequently transcribed audio in Redis to reduce repeated processing.

  Store temporary audio files in cloud object storage (e.g., Azure Blob Storage) instead of local disk to avoid bottlenecks.

# Outcome: These changes allow the system to scale efficiently, handle high concurrency, reduce latency, and optimize resource usage.
         

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/AkshayDubey27/audio-transcription-services.git
cd audio-transcription-services

cd backend

#backend
#run
npm install
npm run dev



cd frontend
#frotend
#run
npm install
npm start
#production env
npm run build

# Explanation of code structure
backend/
└── src/
    ├── controllers/    # Handles incoming HTTP requests and API endpoints , business logic and Azure Speech SDK integration
    │   └── transcription.ts
    ├── services/ 
        └── azure.ts      # Mock speech transcription if we dont have keys but we           implemented with keys
    │   └── mongo.ts    # Contains mongo cnection
    ├── models/         # MongoDB schemas and models
    │   └── Transcription.ts
    └── routes.ts  # sets up Express server, middleware, and routes
    └── index.ts    # Entry point main file 

# frontend
frontend/
└── src/
    ├── components
         └── TranscriptionForm.tsx    # React components (e.g., TranscriptionForm.tsx) handeled the api and logics
    
    ├── api.ts          # Functions to call backend APIs
    └── App.tsx         # Main React application
    ├── index.css          # Functions to call backend APIs
    └── index.tsx         # Main Root file
    └── postcss.config.js  # used to configure PostCSS, transforming CSS with JavaScript plugin
    ├── index.css          # loading the tailwind css
    └── tailwind.config.js # configure Tailwind CSS


    ## **Assumptions Made**

#1. **Audio Sources**
   - Audio files are accessible via **public URLs** (HTTP/HTTPS).
   - Supported formats: `.mp3`, `.wav`, `.ogg`, `.m4a`.

#2. **Azure Speech Service**
   - Valid **Azure credentials** (`AZURE_KEY` and `AZURE_REGION`) are available.
   - Default language: `en-US`.

#3. **Backend Storage**
   - MongoDB stores transcription records.
   - Only the last 30 days of records are shown in the frontend.

#4. **Frontend Usage**
   - Users input valid URLs; invalid URLs are rejected.
   - Retry mechanism blocks users temporarily after multiple failed attempts.

#5. **Environment**
   - Node.js >= 18 for backend.
   - React 18+ for frontend.

#6. **Security**
   - No authentication implemented; assumes trusted environment.
   - Environment variables used for API keys and DB credentials.

---
## **Production Improvements**

## **Production Improvements**

To make this Node.js + React audio transcription app production-ready, the following improvements can be applied:

### **Backend (Node.js + Express + Azure)**
1. **Asynchronous Processing**
   - Move heavy tasks like Azure transcription to a **job queue** (e.g., RabbitMQ, AWS SQS, BullMQ) so HTTP requests return immediately, while background workers process audio asynchronously.
2. **Caching**
   - Use **Redis** to cache frequently requested transcriptions, reducing repeated Azure calls and improving response times.
3. **Containerization & Scaling**
   - Dockerize the backend for consistent deployment.
   - Deploy with **Kubernetes** or cloud auto-scaling to handle thousands of concurrent requests.
4. **Environment & Secrets Management**
   - Store sensitive keys (Azure API keys, MongoDB URI) in environment variables or a secret manager (AWS Secrets Manager, Azure Key Vault).
5. **Logging & Monitoring**
   - Use centralized logging (**Winston**, **ELK**) and monitoring (**Prometheus + Grafana**) to track errors, performance, and usage.
6. **Security**
   - Enable HTTPS, apply **rate limiting**, and optionally implement authentication (JWT or OAuth).

### **Frontend (React + TypeScript)**
1. **Production Build**
   - Generate optimized static assets using `npm run build` or `yarn build` (minified, tree-shaken, and bundled).
2. **Static Hosting & CDN**
   - Serve static files via **NGINX, Netlify, Vercel, or S3 + CloudFront** to reduce latency and handle high traffic.
3. **Error Handling & User Feedback**
   - Gracefully handle API failures and provide retry messages or fallbacks.
4. **Environment Variables**
   - Store API URLs and keys in `.env.production` to avoid exposing sensitive values.
5. **Monitoring & Analytics**
   - Integrate frontend monitoring (Sentry) and analytics (Google Analytics, LogRocket) to track errors and user behavior.

### **General Improvements**
- **CI/CD Pipeline:** Automate builds, tests, and deployment using GitHub Actions, GitLab CI, or other CI/CD tools.
- **Testing:** Add unit and integration tests for both backend (Jest, Mocha) and frontend (Jest + React Testing Library).
- **Performance Optimization:** Compress audio uploads, limit large payloads, and use pagination for data-heavy endpoints.

**Summary:**  
- Backend: async queues, caching, Docker, autoscaling, logging, security.  
- Frontend: production build, CDN/static hosting, environment variables, monitoring.  
- Overall: CI/CD, testing, and performance optimizations.


## MongoDB indexing notes

To ensure fast and efficient database operations in production, the following MongoDB optimizations are recommended:

### **Why Indexing is Important**
- Transcriptions collection can grow large over time.
- Common queries include:
  - Fetching **recent transcriptions** (`createdAt` descending).
  - Searching by **audio URL** or **transcription text**.
- Indexes significantly improve query speed and reduce database load.

### **Recommended Indexes** # example
#1. **Date Index**
#```ts
#Transcription.createIndex({ createdAt: -1 });

## **Scalability Notes**

To handle high traffic and thousands of concurrent requests, the application can be scaled effectively using the following strategies:

### **Backend (Node.js + Azure + MongoDB)**
1. **Asynchronous Processing**
   - Move heavy tasks like Azure transcription to a **job queue** (e.g., BullMQ, RabbitMQ, or AWS SQS).  
   - Allows HTTP requests to return quickly while background workers process audio.

2. **Caching**
   - Use **Redis** to cache frequently requested transcriptions.  
   - Reduces repeated calls to Azure and improves response times.

3. **Database Optimization**
   - Use **indexes** on frequently queried fields like `createdAt`, `transcription`, and `audioUrl`.  
   - Implement **pagination** and **projection** to limit data load.

4. **Containerization & Auto-Scaling**
   - Dockerize the backend for consistent deployment.  
   - Use **Kubernetes** or cloud services (AWS ECS, Azure AKS) for **auto-scaling** under high load.

5. **Connection Pooling**
   - Configure MongoDB and external service connections for high concurrency.

### **Frontend (React)**
1. **Static Hosting**
   - Serve optimized production build via **CDN** (Netlify, Vercel, S3 + CloudFront) for low latency and high availability.
   
2. **Code Optimization**
   - Minify, bundle, and tree-shake React code to reduce load times.
   
3. **Client-Side Caching**
   - Cache recent transcription data in memory or local storage to reduce repeated API calls.

### **Monitoring & Logging**
- Use centralized logging (**Winston**, ELK) and monitoring (**Prometheus**, **Grafana**, or cloud tools).  
- Track application performance, request bottlenecks, and errors to scale intelligently.

**Summary:**  
- Backend: async queues, caching, database indexing, containerization, auto-scaling.  
- Frontend: production build, CDN, code optimization, client caching.  
- Overall: monitoring, logging, and performance tracking for proactive scaling.


