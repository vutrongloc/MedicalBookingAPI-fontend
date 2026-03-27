import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/common/AppLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import DepartmentsPage from "../pages/DepartmentsPage";
import DepartmentDetailPage from "../pages/DepartmentDetailPage";
import DoctorsPage from "../pages/DoctorsPage";
import DoctorDetailPage from "../pages/DoctorDetailPage";
import AppointmentsPage from "../pages/AppointmentsPage";
import MedicalRecordsPage from "../pages/MedicalRecordsPage";
import ProfilePage from "../pages/ProfilePage";
import AdminPage from "../pages/AdminPage";
import NotFoundPage from "../pages/NotFoundPage";
import { useAuth } from "../hooks/useAuth";

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="departments/:id" element={<DepartmentDetailPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="doctors/:id" element={<DoctorDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route
          path="medical-records"
          element={
            <ProtectedRoute roles={["Admin", "Doctor"]}>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
