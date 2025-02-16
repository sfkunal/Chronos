# Chronos Frontend

A modern, intuitive calendar interface built with Next.js, featuring AI-powered scheduling assistance and preference-based event management.

## 🎯 Features

### 1. Interactive Calendar Views
- **Monthly Calendar**
  - Compact month view for quick date selection
  - Visual date highlighting and selection
  - Integrated with main calendar view

- **Weekly Calendar**
  - Detailed week view with hourly slots
  - Real-time event display and management
  - Color-coded events for better visibility

### 2. AI Chat Interface
- Natural language event scheduling
- Context-aware responses
- Real-time event creation feedback
- Intelligent scheduling suggestions
- Welcome message with daily schedule overview

Reference implementation:
```javascript:chronos-frontend/src/components/ChatInterface.jsx
startLine: 10
endLine: 43
```

### 3. Preference Management
- User-defined scheduling preferences
- Time-block restrictions
- Working hours configuration
- Meeting duration defaults
- Recurring schedule patterns

### 4. Layout Structure
- Three-column responsive design:
  - Left: Monthly calendar + Preferences
  - Center: Main calendar view
  - Right: AI chat interface

Reference implementation:
```javascript:chronos-frontend/src/app/page.js
startLine: 247
endLine: 289
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn
- Google Calendar API credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chronos-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 🎨 UI Components

### Core Components
- Calendar (Monthly/Weekly views)
- Chat Interface
- Preferences Panel
- Event Creation Dialog
- Loading States

### Styling
- Tailwind CSS for responsive design
- Custom color schemes
- Google Fonts (Manrope) integration
- Responsive grid layout

## 🔄 Data Flow

1. **Event Creation**
   - User inputs natural language request
   - Backend processes request via Groq
   - Real-time calendar updates
   - Success/error feedback

2. **Event Management**
   - Direct calendar interaction
   - Chat-based modifications
   - Preference-aware scheduling
   - Google Calendar sync

## 💻 Development

### Project Structure
```
chronos-frontend/
├── src/
│   ├── app/
│   │   ├── page.js         # Main application page
│   │   └── layout.js       # Root layout
│   ├── components/
│   │   ├── ChatInterface/  # AI chat components
│   │   ├── Calendar/       # Calendar views
│   │   └── Preferences/    # User preferences
│   └── styles/
│       └── globals.css     # Global styles
├── public/
└── package.json
```

### Key Technologies
- Next.js 13+
- React
- Tailwind CSS
- shadcn/ui components
- React-Markdown
- Lucide Icons

## 📱 User Experience

### Primary Use Cases
1. **Quick Scheduling**
   - Natural language input
   - AI-powered event creation
   - Preference-based timing

2. **Calendar Management**
   - Visual event organization
   - Drag-and-drop functionality
   - Multi-view calendar access

3. **Preference Setting**
   - Custom scheduling rules
   - Working hours definition
   - Meeting preferences

## 🔧 Configuration

### Customization Options
- Theme colors
- Calendar view preferences
- Default meeting durations
- Time zone settings
- API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.