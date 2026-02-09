# Rife Frequency App

A modern, professional **Rife Frequency Therapy Application** built with React, TypeScript, and Tailwind CSS.

## 🎯 Features

### Core Functionality
- **Frequency Player** - Play individual frequencies or sequences with real-time waveform visualization
- **Frequency Management** - Create, edit, and manage custom frequencies (1-20,000 Hz)
- **Conditions Library** - Organize health conditions and link them to frequencies
- **Person Profiles** - Track individuals and assign them frequencies/sequences
- **Sequence Builder** - Create custom frequency sequences with different durations
- **Web Audio API** - Pure sine, square, triangle, and sawtooth wave generation

### Technical Highlights
- 🎨 **Stunning UI** - Dark theme with glassmorphism, based on medical/wellness aesthetic
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 💾 **Local Database** - IndexedDB for persistent data storage
- 🔐 **Authentication** - User registration and login system
- 🎵 **Audio Visualization** - Real-time waveform display using Canvas API
- ⚡ **Predefined Frequencies** - Comes with common Rife frequencies

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:5173`

### First Use

1. **Register an account** - Create a new user account
2. **Explore predefined frequencies** - The app comes with 6 common Rife frequencies
3. **Play a frequency** - Go to Player → Select a frequency → Hit Play
4. **Create sequences** - Combine multiple frequencies with custom durations
5. **Manage conditions** - Add health conditions and link them to frequencies

## 📁 Project Structure

```
rife-frequency-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── FrequencyPlayer.tsx
│   │   ├── WaveformVisualizer.tsx
│   │   └── Sidebar.tsx
│   ├── pages/              # Application pages
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PlayerPage.tsx
│   │   ├── FrequenciesPage.tsx
│   │   ├── ConditionsPage.tsx
│   │   ├── PersonsPage.tsx
│   │   └── SequencesPage.tsx
│   ├── lib/                # Core services
│   │   ├── db.ts          # IndexedDB wrapper
│   │   ├── audio.ts       # Web Audio API service
│   │   └── auth.tsx       # Authentication context
│   ├── types/             # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎨 Design System

### Typography
- **Headings**: Outfit (geometric, modern)
- **Body**: Figtree (excellent readability)
- **Monospace**: JetBrains Mono (for Hz values)

### Colors
- **Primary**: `#6366f1` (Indigo)
- **Accent**: `#06b6d4` (Cyan)
- **Background**: `#050505` (Deep black)
- **Glassmorphism**: Semi-transparent cards with backdrop blur

### Key Components
- **Frequency Player**: Centerpiece with large waveform visualizer
- **Sidebar Navigation**: Fixed left sidebar with icon navigation
- **Modal Dialogs**: Glassmorphic overlays for forms
- **Cards**: Subtle borders, hover effects, and transitions

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 6
- **Database**: IndexedDB (via idb library)
- **Audio**: Web Audio API
- **Visualization**: Canvas API
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📊 Data Models

### User
- email, password_hash, name

### Frequency
- hz (number), name, description
- conditions[] (linked condition IDs)
- is_predefined (bool)

### Condition
- name, description, category

### Person
- name, email, notes
- conditions[], assigned_frequencies[]

### Sequence
- name, frequencies[] (array of {hz, duration})

### PersonSequence
- person_id, sequence_id (junction table)

## 🎵 Audio Features

### Waveform Types
- **Sine** - Pure tone (default)
- **Square** - Sharp, harsh tone
- **Triangle** - Softer than square
- **Sawtooth** - Bright, buzzy tone

### Frequency Range
- **Minimum**: 1 Hz
- **Maximum**: 20,000 Hz
- **Default Duration**: 180 seconds (3 minutes)

### Player Controls
- Play/Pause
- Stop
- Volume control (0-100%)
- Waveform selector
- Real-time progress tracking
- Visual waveform display

## 🔒 Security Notes

⚠️ **IMPORTANT**: The current authentication system uses **plain text passwords** for demonstration purposes. 

**For production use, you MUST:**
1. Implement proper password hashing (bcrypt, Argon2)
2. Add server-side authentication
3. Use secure session management
4. Implement HTTPS
5. Add input validation and sanitization

## 🚧 Future Enhancements

- [ ] Export/Import frequency libraries
- [ ] Session history tracking
- [ ] Advanced sequence scheduling
- [ ] Multi-user collaboration
- [ ] Cloud sync (Firebase/Supabase)
- [ ] PDF report generation
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

## 📝 Development

### Build for Production
```bash
npm run build
```

Output will be in `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

## 🐛 Troubleshooting

**Audio not playing?**
- Check browser audio permissions
- Ensure volume is not muted
- Try a different browser (Chrome recommended)

**Data not persisting?**
- Check IndexedDB is enabled
- Clear browser cache
- Try incognito mode to test

**UI not rendering correctly?**
- Clear browser cache
- Check console for errors
- Ensure all dependencies installed

## 📄 License

This is a demonstration project. Use at your own risk.

## 🙏 Credits

- **Design System**: Based on medical/wellness aesthetic guidelines
- **Predefined Frequencies**: Common Rife frequencies from research
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Outfit, Figtree, JetBrains Mono)

---

**Note**: This application is for educational and research purposes only. Always consult healthcare professionals for medical advice.
