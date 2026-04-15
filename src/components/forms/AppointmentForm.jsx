import { useForm } from "react-hook-form";
import { useCooldown } from "../../hooks/useCooldown";

export default function AppointmentForm({ doctors, onSubmit, loading: externalLoading }) {
  const { isLocked, run: runSubmit } = useCooldown(3000);
  const loading = externalLoading || isLocked;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      doctorId: "",
      appointmentTime: "",
    },
  });

  const submitHandler = (values) => {
    runSubmit(async () => {
      await onSubmit(values);
      reset();
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)}>
      <div className="row">
        <div className="field" style={{ flex: 1, minWidth: 250 }}>
          <label>Bác sĩ</label>
          <select
            {...register("doctorId", { required: "Vui lòng chọn bác sĩ" })}
          >
            <option value="">-- Chọn bác sĩ --</option>
            {doctors.map((d) => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.fullName} - {d.departmentName}
              </option>
            ))}
          </select>
          {errors.doctorId && (
            <span className="error-text">{errors.doctorId.message}</span>
          )}
        </div>

        <div className="field" style={{ flex: 1, minWidth: 250 }}>
          <label>Thời gian hẹn</label>
          <input
            type="datetime-local"
            {...register("appointmentTime", {
              required: "Vui lòng chọn thời gian hẹn",
            })}
          />
          {errors.appointmentTime && (
            <span className="error-text">{errors.appointmentTime.message}</span>
          )}
        </div>
      </div>
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Đang tạo..." : "Tạo lịch hẹn"}
      </button>
    </form>
  );
}
