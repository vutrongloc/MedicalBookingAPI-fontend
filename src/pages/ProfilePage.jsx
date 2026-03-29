import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getCurrentUserService, updateCurrentUserService, changePasswordService } from "../api/services/userService";
import { useAuth } from "../hooks/useAuth";
import { tokenStorage } from "../utils/storage";
import Modal from "../components/common/Modal";
import PageState from "../components/common/PageState";

export default function ProfilePage() {
  const { user, login, logout, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCurrentUserService();
      setProfile(data);
      reset({
        fullName: data.fullName || "",
        phone: data.phone || "",
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
        gender: data.gender || "",
        qualification: data.qualification || "",
      });
    } catch (e) {
      setError(e?.message || "Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const updated = await updateCurrentUserService(formData);
      login({ ...user, ...updated }, token || tokenStorage.get() || "");
      toast.success("Cập nhật hồ sơ thành công");
      setProfile((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      toast.error(e?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageState loading={loading} error={error} empty={!profile} emptyText="">
        <div className="card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile?.fullName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="profile-name">{profile?.fullName}</h2>
              <span className="profile-role">{profile?.role}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
            <div className="profile-form-grid">
              <div className="field">
                <label className="field-label">Họ tên <span className="required">*</span></label>
                <input
                  {...register("fullName", {
                    required: "Họ tên không được để trống",
                    minLength: { value: 2, message: "Tối thiểu 2 ký tự" },
                    maxLength: { value: 100, message: "Tối đa 100 ký tự" }
                  })}
                  className={errors.fullName ? "input-error" : ""}
                />
                {errors.fullName && <span className="error-text">{errors.fullName.message}</span>}
              </div>

              <div className="field">
                <label className="field-label">Email</label>
                <input value={profile?.email || ""} disabled />
              </div>

              <div className="field">
                <label className="field-label">Số điện thoại</label>
                <input
                  {...register("phone", {
                    pattern: {
                      value: /^(0[0-9]{9,10})$/,
                      message: "Số điện thoại không hợp lệ (VD: 0901234567)"
                    }
                  })}
                  placeholder="VD: 0901234567"
                  className={errors.phone ? "input-error" : ""}
                />
                {errors.phone && <span className="error-text">{errors.phone.message}</span>}
              </div>

              {profile?.role === "Patient" && (
                <>
                  <div className="field">
                    <label className="field-label">Ngày sinh</label>
                    <input
                      type="date"
                      {...register("dateOfBirth", {
                        validate: (val) => {
                          if (!val) return true;
                          if (new Date(val) >= new Date()) return "Ngày sinh không hợp lệ";
                          return true;
                        }
                      })}
                      max={new Date().toISOString().split("T")[0]}
                      className={errors.dateOfBirth ? "input-error" : ""}
                    />
                    {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth.message}</span>}
                  </div>

                  <div className="field">
                    <label className="field-label">Giới tính</label>
                    <select {...register("gender")}>
                      <option value="">-- Chọn giới tính --</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                </>
              )}

              {profile?.role === "Doctor" && (
                <>
                  <div className="field">
                    <label className="field-label">Khoa</label>
                    <input value={profile?.departmentName || "-"} disabled />
                  </div>

                  <div className="field">
                    <label className="field-label">Chuyên môn</label>
                    <input
                      {...register("qualification")}
                      placeholder="VD: Thạc sĩ, Tiến sĩ..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowPasswordModal(true)}
              >
                Đổi mật khẩu
              </button>
            </div>
          </form>
        </div>
      </PageState>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
          logout();
          window.location.href = "/login";
        }}
      />
    </>
  );
}

function PasswordToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      className="password-field-toggle"
      onClick={onToggle}
      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {show ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );
}

function PasswordModal({ isOpen, onClose, onSuccess }) {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    try {
      await changePasswordService({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      toast.success("Đổi mật khẩu thành công");
      reset();
      onSuccess();
    } catch (e) {
      toast.error(e?.message || "Đổi mật khẩu thất bại");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      setShowOld(false);
      setShowNew(false);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi mật khẩu" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="password-form">
        <div className="field">
          <label className="field-label">Mật khẩu hiện tại <span className="required">*</span></label>
          <div className="password-field-wrapper">
            <input
              type={showOld ? "text" : "password"}
              {...register("oldPassword", { required: "Mật khẩu hiện tại không được để trống" })}
              className={`password-field-input ${errors.oldPassword ? "input-error" : ""}`}
              autoComplete="current-password"
            />
            <PasswordToggle show={showOld} onToggle={() => setShowOld(!showOld)} />
          </div>
          {errors.oldPassword && <span className="error-text">{errors.oldPassword.message}</span>}
        </div>

        <div className="field">
          <label className="field-label">Mật khẩu mới <span className="required">*</span></label>
          <div className="password-field-wrapper">
            <input
              type={showNew ? "text" : "password"}
              {...register("newPassword", {
                required: "Mật khẩu mới không được để trống",
                minLength: { value: 6, message: "Mật khẩu mới phải có ít nhất 6 ký tự" }
              })}
              className={`password-field-input ${errors.newPassword ? "input-error" : ""}`}
              autoComplete="new-password"
            />
            <PasswordToggle show={showNew} onToggle={() => setShowNew(!showNew)} />
          </div>
          {errors.newPassword && <span className="error-text">{errors.newPassword.message}</span>}
        </div>

        <div className="field">
          <label className="field-label">Xác nhận mật khẩu mới</label>
          <div className="password-field-wrapper">
            <input
              type={showNew ? "text" : "password"}
              {...register("confirmPassword", {
                validate: (val) => val === newPassword || "Mật khẩu xác nhận không khớp"
              })}
              className={`password-field-input ${errors.confirmPassword ? "input-error" : ""}`}
              autoComplete="new-password"
            />
          </div>
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
