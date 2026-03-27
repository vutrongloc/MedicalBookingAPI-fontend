import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import RegisterForm from "../components/forms/RegisterForm";
import { registerService } from "../api/services/authService";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      await registerService(values);
      toast.success("Đăng ký thành công, vui lòng đăng nhập");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card login-card register-card">
        <div className="hospital-logo" aria-hidden="true">
          <span className="hospital-logo-bar horizontal" />
          <span className="hospital-logo-bar vertical" />
        </div>
        <p className="login-brand">Medical Booking Hospital</p>
        <h2 className="register-title">Đăng kí</h2>
        <RegisterForm onSubmit={onSubmit} loading={loading} />
      </div>
    </div>
  );
}
