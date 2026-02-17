# Quiz Application

A full-stack quiz application built with React frontend and FastAPI backend, featuring user authentication, quiz creation, AI-powered quiz generation, and progress tracking.

## Features

### 🎯 Core Features

- **User Authentication**: Simple username-based login system
- **Quiz Taking**: Interactive quiz interface with real-time feedback
- **Quiz Creation**: Manual quiz creation with customizable questions and options
- **AI Generation**: Generate quizzes using AI based on topic descriptions
- **Progress Tracking**: Track quiz attempts, scores, and performance over time
- **User Profile**: View created quizzes and quiz history

### 🎨 User Interface

- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Real-time Feedback**: Instant validation during quiz attempts
- **Progress Indicators**: Visual progress bars and score displays

## Tech Stack

### Frontend

- **React**: User interface framework
- **React Router**: Client-side routing
- **CSS3**: Custom styling with modern design patterns
- **Fetch API**: HTTP client for API communication

### Backend

- **FastAPI**: Python web framework
- **MongoDB**: NoSQL database for data storage
- **Google Gemini AI**: AI-powered quiz generation
- **Pydantic**: Data validation and serialization

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Python 3.8+
- MongoDB database
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv backend
   source backend/bin/activate  # On Windows: backend\\Scripts\\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your configuration:

   ```env
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=quizapp
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Application Structure

### Frontend Pages

1. **Login** (`/login`)

   - Username input and authentication
   - App description and features

2. **Home** (`/home`)

   - Browse available quizzes
   - Search and filter functionality
   - Sidebar navigation

3. **Quiz Detail** (`/quiz/:id`)

   - View quiz information and sample questions
   - Start quiz option

4. **Quiz Question** (`/quiz/:id/:q_id`)

   - Answer questions with real-time feedback
   - Progress tracking

5. **Quiz Results** (`/quiz/:id/leaderboard`)

   - View results and correct answers
   - Retake option

6. **Create Quiz** (`/plus`)

   - Manual quiz creation
   - AI-powered quiz generation

7. **History** (`/history`)

   - View past quiz attempts
   - Performance statistics

8. **Profile** (`/profile`)
   - User statistics
   - Created quizzes
   - Recent activity

### API Endpoints

- `POST /api/login` - User authentication
- `GET /api/getquizzes` - Fetch all quizzes
- `POST /api/plus` - Create new quiz
- `POST /api/generate` - Generate quiz using AI
- `POST /api/updateHistory` - Update user's quiz history
- `POST /api/history` - Get user's quiz history
- `GET /api/profile` - Get user profile data

## State Management

The application uses React Context for state management:

- **AuthContext**: Manages user authentication and login state
- **QuizContext**: Handles quiz data, quiz attempts, and quiz creation

## Usage Instructions

### Taking a Quiz

1. Log in with your username
2. Browse available quizzes on the home page
3. Click on a quiz card to view details
4. Click "Start Quiz" to begin
5. Answer questions and receive immediate feedback
6. View your results and performance summary

### Creating a Quiz

1. Click the "Create Quiz" button in the sidebar
2. Choose between manual creation or AI generation
3. For AI generation: Enter a topic description
4. For manual creation: Fill in quiz details, questions, and options
5. Submit to create the quiz

### Viewing Progress

1. Visit the "History" page to see past quiz attempts
2. Check the "Profile" page for comprehensive statistics
3. Track your improvement over time

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.
