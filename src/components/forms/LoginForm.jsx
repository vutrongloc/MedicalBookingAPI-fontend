import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { validateEmail } from "../../utils/validation";

export default function LoginForm({ onSubmit, loading }) {
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
        <input
          type="password"
          {...register("password", {
            required: "Mật khẩu là bắt buộc",
          })}
        />
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
