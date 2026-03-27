import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { validateEmail, validatePhone } from "../../utils/validation";

const genders = ["Nam", "Nữ", "Khác"];

export default function RegisterForm({ onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      gender: "",
    },
  });

  const passwordValue = watch("password");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="field">
        <input
          type="text"
          placeholder="Họ và tên"
          {...register("fullName", {
            required: "Họ và tên là bắt buộc",
            minLength: { value: 2, message: "Họ và tên tối thiểu 2 ký tự" },
            maxLength: { value: 100, message: "Họ và tên tối đa 100 ký tự" },
          })}
        />
        {errors.fullName && <span className="error-text">{errors.fullName.message}</span>}
      </div>

      <div className="field">
        <input
          type="text"
          placeholder="Số điện thoại"
          {...register("phone", { validate: validatePhone })}
        />
        {errors.phone && <span className="error-text">{errors.phone.message}</span>}
      </div>

      <div className="field">
        <input
          type="date"
          placeholder="Ngày sinh"
          {...register("dateOfBirth", {
            validate: (value) => {
              if (!value) return true;
              return new Date(value) <= new Date() || "Ngày sinh không hợp lệ";
            },
          })}
        />
        {errors.dateOfBirth && (
          <span className="error-text">{errors.dateOfBirth.message}</span>
        )}
      </div>

      <div className="field">
        <select {...register("gender")}>
          <option value="">-- Giới tính --</option>
          {genders.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <input
          type="email"
          placeholder="Email"
          {...register("email", { validate: validateEmail })}
        />
        {errors.email && <span className="error-text">{errors.email.message}</span>}
      </div>

      <div className="field">
        <input
          type="password"
          placeholder="Mật khẩu"
          {...register("password", {
            required: "Mật khẩu là bắt buộc",
            minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            maxLength: { value: 100, message: "Mật khẩu tối đa 100 ký tự" },
          })}
        />
        {errors.password && <span className="error-text">{errors.password.message}</span>}
      </div>

      <div className="field">
        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          {...register("confirmPassword", {
            required: "Vui lòng xác nhận mật khẩu",
            validate: (v) => v === passwordValue || "Mật khẩu xác nhận không khớp",
          })}
        />
        {errors.confirmPassword && (
          <span className="error-text">{errors.confirmPassword.message}</span>
        )}
      </div>

      <button className="btn auth-submit register-btn" type="submit" disabled={loading}>
        {loading ? "Đang đăng ký..." : "Đăng kí"}
      </button>

      <p className="auth-switch">
        Bạn đã có tài khoản ? <Link to="/login">Đăng nhập</Link>
      </p>
    </form>
  );
}
