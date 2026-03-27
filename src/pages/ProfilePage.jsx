import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getCurrentUserService, updateCurrentUserService, changePasswordService } from "../api/services/userService";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/common/Modal";
import PageState from "../components/common/PageState";

export default function ProfilePage() {
  const { user, login } = useAuth();
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
      login({ ...user, ...updated }, localStorage.getItem("token") || "");
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
                <label className="field-label">Họ tên</label>
                <input
                  {...register("fullName", { required: "Họ tên không được để trống", minLength: { value: 2, message: "Tối thiểu 2 ký tự" } })}
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
                    pattern: { value: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" }
                  })}
                  placeholder="Nhập số điện thoại"
                  className={errors.phone ? "input-error" : ""}
                />
                {errors.phone && <span className="error-text">{errors.phone.message}</span>}
              </div>

              {profile?.role === "Patient" && (
                <>
                  <div className="field">
                    <label className="field-label">Ngày sinh</label>
                    <input type="date" {...register("dateOfBirth", { valueAsDate: false })} />
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
      />
    </>
  );
}

function PasswordModal({ isOpen, onClose }) {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
  const [serverError, setServerError] = useState("");

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await changePasswordService(data);
      toast.success("Đổi mật khẩu thành công");
      reset();
      onClose();
    } catch (e) {
      setServerError(e?.message || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi mật khẩu" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="password-form">
        {serverError && <div className="server-error">{serverError}</div>}

        <div className="field">
          <label className="field-label">Mật khẩu hiện tại</label>
          <input
            type="password"
            {...register("currentPassword", { required: "Không được để trống" })}
            className={errors.currentPassword ? "input-error" : ""}
          />
          {errors.currentPassword && <span className="error-text">{errors.currentPassword.message}</span>}
        </div>

        <div className="field">
          <label className="field-label">Mật khẩu mới</label>
          <input
            type="password"
            {...register("newPassword", {
              required: "Không được để trống",
              minLength: { value: 6, message: "Tối thiểu 6 ký tự" }
            })}
            className={errors.newPassword ? "input-error" : ""}
          />
          {errors.newPassword && <span className="error-text">{errors.newPassword.message}</span>}
        </div>

        <div className="field">
          <label className="field-label">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Không được để trống",
              validate: (val) => val === newPassword || "Mật khẩu không khớp"
            })}
            className={errors.confirmPassword ? "input-error" : ""}
          />
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
