import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { validateEmail } from "../../utils/validation";
import { useState } from "react";

export default function LoginForm({ onSubmit, loading }) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="field">
        <label>Email</label>
        <input
          type="email"
          {...register("email", {
            validate: validateEmail,
          })}
        />
        {errors.email && <span className="error-text">{errors.email.message}</span>}
      </div>

      <div className="field">
        <label>Password</label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password", {
              required: "Mật khẩu là bắt buộc",
            })}
            className="password-input"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <span className="error-text">{errors.password.message}</span>
        )}
      </div>

      <button className="btn auth-submit" type="submit" disabled={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <p className="auth-switch">
        Bạn chưa có tài khoản ? <Link to="/register">Đăng kí</Link>
      </p>
    </form>
  );
}
