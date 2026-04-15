import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../common/Modal";
import { useCooldown } from "../../hooks/useCooldown";

export default function DepartmentFormModal({ isOpen, onClose, onSuccess, department }) {
  const { isLocked, run: runSubmit } = useCooldown(3000);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      reset({
        departmentName: department?.departmentName || "",
        description: department?.description || "",
      });
    }
  }, [isOpen, department]);

  const onSubmit = async (formData) => {
    runSubmit(async () => {
      try {
        await onSuccess(formData);
      } catch (e) {
        throw e;
      }
    });
  };

  const title = department ? "Sửa khoa" : "Thêm khoa mới";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="admin-form">
        <div className="field">
          <label className="field-label">
            Tên khoa <span className="required">*</span>
          </label>
          <input
            type="text"
            {...register("departmentName", {
              required: "Tên khoa là bắt buộc",
              minLength: { value: 2, message: "Tên khoa tối thiểu 2 ký tự" },
              maxLength: { value: 100, message: "Tên khoa tối đa 100 ký tự" },
            })}
            className={errors.departmentName ? "input-error" : ""}
            placeholder="Nhập tên khoa"
          />
          {errors.departmentName && <span className="error-text">{errors.departmentName.message}</span>}
        </div>

        <div className="field">
          <label className="field-label">Mô tả</label>
          <textarea
            {...register("description")}
            placeholder="Nhập mô tả khoa"
            rows={3}
          />
        </div>

        <div className="modal-form-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={isLocked}>
            Hủy
          </button>
          <button type="submit" className="btn" disabled={isLocked}>
            {isLocked ? "Đang lưu..." : department ? "Lưu thay đổi" : "Thêm khoa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
