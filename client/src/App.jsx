import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Home from './pages/Home'
import About from './pages/About'
import Features from './pages/Features'
import DemoGuide from './pages/DemoGuide'
import DashboardEnhanced from './pages/DashboardEnhanced'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import Upload from './pages/Upload'
import { ResumeDetails } from './pages/ResumeDetails'
import Analysis from './pages/Analysis'
import JobMatch from './pages/JobMatch'
import JobMatchHistory from './pages/JobMatchHistory'
import ResumeChat from './pages/ResumeChat'
import CareerAssistant from './pages/CareerAssistant'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes with main layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="features" element={<Features />} />
            <Route path="demo-guide" element={<DemoGuide />} />
          </Route>

          {/* Protected routes with main layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardEnhanced />} />
          </Route>

          {/* Analytics Dashboard - protected route with main layout */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AnalyticsDashboard />} />
          </Route>

          {/* Upload page - protected route with main layout */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Upload />} />
          </Route>

          {/* Resume Details page - protected route with main layout */}
          <Route
            path="/resume/:id"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ResumeDetails />} />
          </Route>

          {/* Analysis page - protected route with main layout */}
          <Route
            path="/analysis/:id"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Analysis />} />
          </Route>

          {/* Job Match page - protected route with main layout */}
          <Route
            path="/job-match"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<JobMatch />} />
          </Route>

          {/* Job Match History page - protected route with main layout */}
          <Route
            path="/job-match-history"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<JobMatchHistory />} />
          </Route>

          {/* Resume Chat page - protected route without main layout (full screen) */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ResumeChat />
              </ProtectedRoute>
            }
          />

          {/* Career Assistant page - protected route with main layout */}
          <Route
            path="/career-assistant"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CareerAssistant />} />
          </Route>

          {/* Auth routes (redirect if already logged in) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
