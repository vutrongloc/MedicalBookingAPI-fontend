import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoginForm from "../components/forms/LoginForm";
import { loginService } from "../api/services/authService";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await loginService(values);
      login(result.user, result.token);
      toast.success(result.message || "Đăng nhập thành công");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card login-card">
        <div className="hospital-logo" aria-hidden="true">
          <span className="hospital-logo-bar horizontal" />
          <span className="hospital-logo-bar vertical" />
        </div>
        <p className="login-brand">Medical Booking Hospital</p>
        <h2 className="login-title">Đăng nhập</h2>
        <LoginForm onSubmit={onSubmit} loading={loading} />
        <div className="login-hint">
          Tài khoản mẫu: admin/admin123 - doctor1/doctor123 - patient1/patient123
        </div>
      </div>
    </div>
  );
}
