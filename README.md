# 🚀 ClientFlow OS

**ClientFlow OS** is a modern, all-in-one operating system for managing clients, hiring workflows, and service operations — built to eliminate friction and centralize everything in one place.

**Fast. Scalable. Clean.**

---

## ✨ Core Features

- 🔐 **Advanced Authentication**
  - Firebase-powered Apple Sign-In
  - OAuth providers (Google, GitHub, Microsoft, etc.)

- 🧠 **Hybrid Backend System**
  - Supabase for database, storage, and APIs
  - Firebase strictly for authentication

- 📊 **Client & Workflow Management**
  - Manage clients, projects, and service pipelines
  - Real-time updates and status tracking

- 🧭 **Live Tracking System**
  - Leaflet + OpenStreetMap (no Google Maps dependency)
  - Lightweight and customizable

- 🎨 **Custom Brand Integration**
  - Built-in support for brand kit (colors, typography, assets)

- ⚡ **Performance First**
  - Optimized for speed and scalability

---

## 🏗️ Tech Stack

### Frontend
- React + Vite
- Tailwind CSS

### Backend
- Supabase (core backend)
- Firebase (auth layer only)

### Maps
- Leaflet.js + OpenStreetMap

### Dev Tools
- TypeScript
- ESLint
- GitHub CI/CD

---

## 🔧 Setup

```bash
# Clone the repo
git clone https://github.com/Tech-Andrew/ClientFlow-OS.git

# Enter project
cd ClientFlow-OS

# Install dependencies
npm install

# Run dev server
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Firebase (Auth only)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## 📁 Project Structure

```
clientflow-os/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── integrations/
│   └── assets/
├── public/
├── .env
├── package.json
└── README.md
```

---

## 🧠 Architecture

ClientFlow OS uses a **split-responsibility backend**:

### Firebase
- Handles authentication (especially Apple Sign-In)

### Supabase
- Handles database, storage, APIs, and business logic

### Why this approach?
- Cleaner separation of concerns
- Better OAuth compatibility
- Easier scaling and maintenance

---

## 🚀 Deployment

```bash
npm run build
```

Deploy using:
- Vercel
- Netlify
- Firebase Hosting

---

## 🤝 Contributing

Pull requests are welcome.

For major changes:
- Open an issue first
- Keep code clean and modular

---

## 📄 License

MIT License

---

## 💡 Vision

ClientFlow OS is building toward a **complete operating system for service-based businesses**, combining:

- CRM
- Hiring
- Workflow automation
- Real-time operations

All in one unified platform.

---

## 🔗 Quick Links

- [Documentation](https://github.com/Tech-Andrew/ClientFlow-OS/wiki)
- [Issues](https://github.com/Tech-Andrew/ClientFlow-OS/issues)
- [Discussions](https://github.com/Tech-Andrew/ClientFlow-OS/discussions)