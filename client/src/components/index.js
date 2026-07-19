/**
 * Components Index
 * Central export point for all reusable components
 */

// UI Components
export * from './ui';

// Layout Components
export { default as Navbar } from './Navbar';
export { default as Footer } from './Footer';

// Feature Components
export { BackendStatus } from './BackendStatus';
export { FeatureSection } from './FeatureSection';
export { ResumeUpload } from './ResumeUpload';
export { ResumeList } from './ResumeList';
export { ResumeCard } from './ResumeCard';

// Utility Components
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as EmptyState } from './EmptyState';
export { default as LoadingSpinner } from './LoadingSpinner';
export { NotificationBanner } from './NotificationBanner';
export { default as ErrorBoundary } from './ErrorBoundary';

// Route Components
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as PublicRoute } from './PublicRoute';

// Parsed Section Components
export * from './ParsedSection';

// Analysis Components
export { default as ATSScoreCard } from './ATSScoreCard';
export { default as AnalysisSection } from './AnalysisSection';

// Job Match Components
export { default as MatchScoreCard } from './MatchScoreCard';
export { default as MatchSection } from './MatchSection';
