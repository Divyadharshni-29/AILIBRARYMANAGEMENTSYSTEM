import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import BookCatalog from './pages/student/BookCatalog';
import BookDetails from './pages/student/BookDetails';
import PersonalizedRecommendations from './pages/student/PersonalizedRecommendations';
import BorrowedBooks from './pages/student/BorrowedBooks';
import BorrowHistory from './pages/student/BorrowHistory';
import StudentProfile from './pages/student/StudentProfile';

// Librarian Pages
import LibrarianDashboard from './pages/librarian/LibrarianDashboard';
import BookManagement from './pages/librarian/BookManagement';
import BookBorrowers from './pages/librarian/BookBorrowers';
import Transactions from './pages/librarian/Transactions';
import OverdueManagement from './pages/librarian/OverdueManagement';
import LibraryAnalytics from './pages/librarian/LibraryAnalytics';
import AIDemandInsights from './pages/librarian/AIDemandInsights';
import QRScannerPage from './pages/librarian/QRScannerPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import LibrarianManagement from './pages/admin/LibrarianManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import AIModelEvaluation from './pages/admin/AIModelEvaluation';

import AppLayout from './components/AppLayout';
import NotificationsPage from './pages/student/NotificationsPage';
import FinePaymentPage from './pages/student/FinePaymentPage';
import FineHistoryPage from './pages/student/FineHistoryPage';
import AdminFineManagement from './pages/librarian/AdminFineManagement';
import LocationManagement from './pages/librarian/LocationManagement';

// Role Guard Component
const ProtectedLayout = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Validating security session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'librarian') return <Navigate to="/librarian/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        {/* Common Scanner & Notifications Routes */}
        <Route path="/scanner" element={<QRScannerPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/fines" element={<FinePaymentPage />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/books" element={<BookCatalog />} />
        <Route path="/student/books/:id" element={<BookDetails />} />
        <Route path="/student/scanner" element={<QRScannerPage />} />
        <Route path="/student/recommendations" element={<PersonalizedRecommendations />} />
        <Route path="/student/borrowed" element={<BorrowedBooks />} />
        <Route path="/student/history" element={<BorrowHistory />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/student/fines" element={<FinePaymentPage />} />
        <Route path="/student/fines/pay/:transactionId" element={<FinePaymentPage />} />
        <Route path="/student/fines/history" element={<FineHistoryPage />} />

        {/* Librarian Routes */}
        <Route path="/librarian/dashboard" element={<LibrarianDashboard />} />
        <Route path="/librarian/scanner" element={<QRScannerPage />} />
        <Route path="/librarian/books" element={<BookManagement />} />
        <Route path="/librarian/books/:id/borrowers" element={<BookBorrowers />} />
        <Route path="/librarian/locations" element={<LocationManagement />} />
        <Route path="/librarian/transactions" element={<Transactions />} />
        <Route path="/librarian/overdue" element={<OverdueManagement />} />
        <Route path="/librarian/fines" element={<AdminFineManagement />} />
        <Route path="/librarian/analytics" element={<LibraryAnalytics />} />
        <Route path="/librarian/ai-insights" element={<AIDemandInsights />} />
        <Route path="/librarian/notifications" element={<NotificationsPage />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/scanner" element={<QRScannerPage />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/librarians" element={<LibrarianManagement />} />
        <Route path="/admin/locations" element={<LocationManagement />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/admin/fines" element={<AdminFineManagement />} />
        <Route path="/admin/ai-evaluation" element={<AIModelEvaluation />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />

        {/* Root / Catch-all Fallback */}
        <Route
          path="*"
          element={
            user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user?.role === 'librarian' ? (
              <Navigate to="/librarian/dashboard" replace />
            ) : (
              <Navigate to="/student/dashboard" replace />
            )
          }
        />
      </Routes>
    </AppLayout>
  );
};

// Root Redirect Component
const RootRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'librarian') return <Navigate to="/librarian/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Role-Guarded App Shell */}
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
