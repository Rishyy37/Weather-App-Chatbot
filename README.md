# 🌤️ Weather-App-Chatbot

> A lightweight React + Node weather chatbot that fetches realtime weather data and delivers context-aware conversational responses ⚡

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16.0+-339933?logo=node.js)](https://nodejs.org/)
[![AWS](https://img.shields.io/badge/AWS-Deployed-FF9900?logo=amazon-aws)](https://aws.amazon.com/)

## 🎯 Why This Project?

✨ **Natural chat interface** for quick weather queries  
🌍 **Real-time API-backed** weather data  
🎨 **Minimal, composable** frontend with TypeScript + React  
🚀 **Small Node backend** acting as API/agent layer  

## 🛠️ Tech Stack

| Frontend | Backend | Deployment |
|----------|---------|------------|
| React + TypeScript | Node.js + Express | AWS Static + API |
| Vite | Weather API Integration | S3 + CloudFront |
| Tailwind CSS | Environment Config | Elastic Beanstalk |

## 🚀 Quick Start

### 1️⃣ Clone the Repository
```bash
git clone <repo>
cd weather-app-chatbot
```

### 2️⃣ Install Dependencies
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3️⃣ Environment Setup
Create your environment files:

**server/.env**
```env
WEATHER_API_KEY=your_api_key_here
PORT=5000
```

**client/.env**
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 4️⃣ Run Development Servers

**Backend Server:**
```bash
cd server
npm run dev
```

**Frontend Client:**
```bash
cd client
npm run dev
```

### 5️⃣ Open Your Browser
Navigate to `http://localhost:5173` 🎉

## 🏗️ Project Structure

```
weather-app-chatbot/
├── 📁 client/           # React frontend
│   ├── src/
│   │   └── components/  # UI components
│   ├── public/
│   └── index.html
├── 📁 server/           # Node backend
│   ├── index.js
│   └── agent*.js
└── 📄 .env             # Environment stubs
```

## ✨ Main Features

🗨️ **Conversational UI** - Message bubbles, input, voice/locale helpers  
🌡️ **Weather Lookups** - Current conditions, location-aware forecasts  
🧩 **Modular Components** - ChatInput, ChatMessage, WeatherChat  
🔗 **API Orchestration** - Simple Node server proxying weather APIs  

## 🚀 Production Deployment

### Build for Production
```bash
# Build frontend
cd client
npm run build

# The built assets will be in client/dist/
```

### Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `WEATHER_API_KEY` | server/.env | Weather data provider key 🔑 |
| `PORT` | server/.env | Server port number |
| `VITE_API_BASE_URL` | client/.env | Backend base URL 🌐 |

## 🤝 Contributing

- ✅ Keep changes **small and focused**
- 🧪 Add/update **unit tests** for new logic
- 📋 Open a **PR** with description and screenshots for UI changes

## 📄 License

MIT License - feel free to use this project! 📜

## 💬 Contact & Support

For deployment questions, consult:
- 📚 [AWS S3/CloudFront Documentation](https://docs.aws.amazon.com/)
- 🐳 [AWS Elastic Beanstalk/ECS Guides](https://docs.aws.amazon.com/)

---

Made with ❤️ and ☕ | Happy coding! 🎉