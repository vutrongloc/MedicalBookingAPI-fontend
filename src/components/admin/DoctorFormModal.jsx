import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../common/Modal";
import { getDepartmentsService } from "../../api/services/departmentService";
import { useCooldown } from "../../hooks/useCooldown";

export default function DoctorFormModal({ isOpen, onClose, onSuccess, onSuccessClose, doctor, departments: initialDepts }) {
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const { isLocked, run: runSubmit } = useCooldown(3000);
  const loading = submitting || isLocked;
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (!initialDepts || initialDepts.length === 0) {
        getDepartmentsService({ page: 1, pageSize: 100 }).then(d => {
          setDepartments(d.items || d);
        });
      } else {
        setDepartments(initialDepts);
      }

      reset({
        fullName: doctor?.fullName || "",
        email: doctor?.email || "",
        phone: doctor?.phone || "",
        qualification: doctor?.qualification || "",
        departmentId: doctor?.departmentId?.toString() || "",
      });
    }
  }, [isOpen, doctor, initialDepts]);

  const onSubmit = async (formData) => {
    if (loading) return;
    
    runSubmit(async () => {
      setSubmitting(true);
      try {
        await onSuccess(formData);
        if (onSuccessClose) onSuccessClose();
      } catch (e) {
        throw e;
      } finally {
        setSubmitting(false);
      }
    });
  };

  const isEditMode = !!doctor;
  const title = isEditMode ? "Sửa thông tin bác sĩ" : "Thêm bác sĩ mới";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
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
            })}
            className={errors.fullName ? "input-error" : ""}
            placeholder="Nhập họ tên bác sĩ"
          />
          {errors.fullName && <span className="error-text">{errors.fullName.message}</span>}
        </div>

        {!isEditMode && (
          <>
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
                  required: !isEditMode,
                  minLength: { value: 6, message: "Tối thiểu 6 ký tự" },
                })}
                className={errors.password ? "input-error" : ""}
                placeholder="Nhập mật khẩu"
              />
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>
          </>
        )}

        <div className="field">
          <label className="field-label">Số điện thoại</label>
          <input
            type="text"
            {...register("phone")}
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div className="field">
          <label className="field-label">Chuyên môn</label>
          <input
            type="text"
            {...register("qualification")}
            placeholder="VD: Thạc sĩ, Tiến sĩ..."
          />
        </div>

        <div className="field">
          <label className="field-label">
            Khoa {!isEditMode && <span className="required">*</span>}
          </label>
          <select
            {...register("departmentId", {
              required: !isEditMode ? "Vui lòng chọn khoa" : false,
            })}
            className={errors.departmentId ? "input-error" : ""}
          >
            <option value="">-- Chọn khoa --</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
          {errors.departmentId && <span className="error-text">{errors.departmentId.message}</span>}
        </div>

        <div className="modal-form-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button type="submit" className="btn" disabled={loading}>
            {submitting ? "Đang lưu..." : (isEditMode ? "Lưu thay đổi" : "Thêm bác sĩ")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
