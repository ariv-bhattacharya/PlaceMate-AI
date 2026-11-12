
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import useAuth from "./hooks/useAuth";

// Public pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import JobListings from "./pages/student/JobListings";
import StudentProfile from "./pages/student/StudentProfile";
import ResumeAnalysis from "./pages/student/ResumeAnalysis";
import SkillGapAnalysis from "./pages/student/SkillGapAnalysis";
import MyApplications from "./pages/student/MyApplications";

// Recruiter pages
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import ManageJobs from "./pages/recruiter/ManageJobs";
import CreateJob from "./pages/recruiter/CreateJob";
import Applicants from "./pages/recruiter/Applicants";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageCompanies from "./pages/admin/ManageCompanies";
import AdminManageJobs from "./pages/admin/ManageJobs";
import ManageApplications from "./pages/admin/ManageApplications";


/* ----------------------------------
   ROLE-BASED DASHBOARD REDIRECTION
----------------------------------- */

function getDashboardPath(role) {
  switch (role) {
    case "student":
      return "/student/dashboard";

    case "recruiter":
      return "/recruiter/dashboard";

    case "admin":
      return "/admin/dashboard";

    default:
      return "/";
  }
}


/* ----------------------------------
   ROLE PROTECTION
----------------------------------- */

function RequireRole({ role, children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading PlaceMate AI...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== role) {
    return (
      <Navigate
        to={getDashboardPath(user?.role)}
        replace
      />
    );
  }

  return children;
}


/* ----------------------------------
   PUBLIC ROUTE PROTECTION
----------------------------------- */

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading PlaceMate AI...</div>;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={getDashboardPath(user?.role)}
        replace
      />
    );
  }

  return children;
}


/* ----------------------------------
   APPLICATION ROUTES
----------------------------------- */

function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC ROUTES */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />


      {/* STUDENT ROUTES */}

      <Route
        path="/student/dashboard"
        element={
          <RequireRole role="student">
            <StudentDashboard />
          </RequireRole>
        }
      />

      <Route
        path="/student/profile"
        element={
          <RequireRole role="student">
            <StudentProfile />
          </RequireRole>
        }
      />

      <Route
        path="/student/jobs"
        element={
          <RequireRole role="student">
            <JobListings />
          </RequireRole>
        }
      />

      <Route
        path="/student/resume"
        element={
          <RequireRole role="student">
            <ResumeAnalysis />
          </RequireRole>
        }
      />

      <Route
        path="/student/skill-gap"
        element={
          <RequireRole role="student">
            <SkillGapAnalysis />
          </RequireRole>
        }
      />

      <Route
        path="/student/applications"
        element={
          <RequireRole role="student">
            <MyApplications />
          </RequireRole>
        }
      />


      {/* RECRUITER ROUTES */}

      <Route
        path="/recruiter/dashboard"
        element={
          <RequireRole role="recruiter">
            <RecruiterDashboard />
          </RequireRole>
        }
      />

      {/* Recruiter Manage Jobs */}
      <Route
        path="/recruiter/jobs"
        element={
          <RequireRole role="recruiter">
            <ManageJobs />
          </RequireRole>
        }
      />

      {/* Recruiter Create Job */}
      <Route
        path="/recruiter/create-job"
        element={
          <RequireRole role="recruiter">
            <CreateJob />
          </RequireRole>
        }
      />

      {/* Recruiter Applicants */}
      <Route
        path="/recruiter/applicants"
        element={
          <RequireRole role="recruiter">
            <Applicants />
          </RequireRole>
        }
      />


      {/* ADMIN ROUTES */}

      <Route
        path="/admin/dashboard"
        element={
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        }
      />

      <Route
        path="/admin/students"
        element={
          <RequireRole role="admin">
            <ManageStudents />
          </RequireRole>
        }
      />

      <Route
        path="/admin/companies"
        element={
          <RequireRole role="admin">
            <ManageCompanies />
          </RequireRole>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <RequireRole role="admin">
            <AdminManageJobs />
          </RequireRole>
        }
      />

      <Route
        path="/admin/applications"
        element={
          <RequireRole role="admin">
            <ManageApplications />
          </RequireRole>
        }
      />


      {/* FALLBACK ROUTE */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}


/* ----------------------------------
   MAIN APP COMPONENT
----------------------------------- */

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
