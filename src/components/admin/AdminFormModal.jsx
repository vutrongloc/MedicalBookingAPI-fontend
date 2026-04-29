import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { axiosClient } from "../../api/axiosClient";
import Modal from "../common/Modal";
import { useCooldown } from "../../hooks/useCooldown";

export default function AdminFormModal({ isOpen, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [createdAdmin, setCreatedAdmin] = useState(null);
  const { isLocked, run: runSubmit } = useCooldown(3000);
  const loading = submitting || isLocked;
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      setServerError("");
      setCreatedAdmin(null);
      reset({ email: "", password: "", fullName: "", phone: "" });
    }
  }, [isOpen, reset]);

  const onSubmit = async (formData) => {
    if (loading) return;

    setServerError("");
    runSubmit(async () => {
      setSubmitting(true);
      try {
        const payload = {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone || null,
        };
        const res = await axiosClient.post("/api/Users", payload);
        const body = res.data;

        if (body.success) {
          setCreatedAdmin(body.data);
          toast.success("Tạo tài khoản Admin thành công");
          if (onSuccess) await onSuccess(body.data);
        } else {
          setServerError(body.message || "Tạo tài khoản thất bại");
        }
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.errors
            ? Object.values(e.response.data.errors)[0][0]
            : e?.message || "Đã xảy ra lỗi";
        setServerError(msg);
        throw e;
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleClose = () => {
    setServerError("");
    setCreatedAdmin(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo tài khoản Admin mới" size="md">
      {createdAdmin ? (
        <div className="admin-form-success">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p className="success-title">Tạo tài khoản thành công!</p>
          <div className="success-info">
            <div className="success-row">
              <span className="success-label">ID:</span>
              <span className="success-value">{createdAdmin.userId}</span>
            </div>
            <div className="success-row">
              <span className="success-label">Họ tên:</span>
              <span className="success-value">{createdAdmin.fullName}</span>
            </div>
            <div className="success-row">
              <span className="success-label">Email:</span>
              <span className="success-value">{createdAdmin.email}</span>
            </div>
            <div className="success-row">
              <span className="success-label">Vai trò:</span>
              <span className="success-value role-badge role-badge--admin">{createdAdmin.role}</span>
            </div>
            {createdAdmin.phone && (
              <div className="success-row">
                <span className="success-label">Điện thoại:</span>
                <span className="success-value">{createdAdmin.phone}</span>
              </div>
            )}
          </div>
          <button className="btn" onClick={handleClose} style={{ marginTop: 16, width: "100%" }}>
            Đóng
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="admin-form">
          <div className="field">
            <label className="field-label">
              Họ tên <span className="required">*</span>
            </label>
            <input
              type="text"
              {...register("fullName", {
                required: "Họ tên là bắt buộc",
                minLength: { value: 2, message: "Tối thiểu 2 ký tự" },
                maxLength: { value: 100, message: "Tối đa 100 ký tự" },
              })}
              className={errors.fullName ? "input-error" : ""}
              placeholder="Nhập họ tên Admin"
            />
            {errors.fullName && <span className="error-text">{errors.fullName.message}</span>}
          </div>

          <div className="field">
            <label className="field-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              {...register("email", {
                required: "Email là bắt buộc",
              })}
              className={errors.email ? "input-error" : ""}
              placeholder="Nhập email"
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="field">
            <label className="field-label">
              Mật khẩu <span className="required">*</span>
            </label>
            <input
              type="password"
              {...register("password", {
                required: "Mật khẩu là bắt buộc",
                minLength: { value: 6, message: "Tối thiểu 6 ký tự" },
              })}
              className={errors.password ? "input-error" : ""}
              placeholder="Nhập mật khẩu"
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <div className="field">
            <label className="field-label">Số điện thoại</label>
            <input
              type="text"
              {...register("phone")}
              placeholder="Nhập số điện thoại (tùy chọn)"
            />
          </div>

          {serverError && (
            <div className="server-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {serverError}
            </div>
          )}

          <div className="modal-form-actions">
            <button type="button" className="btn secondary" onClick={handleClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {submitting ? "Đang tạo..." : "Tạo Admin"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
