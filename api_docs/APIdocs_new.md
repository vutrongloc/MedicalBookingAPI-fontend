### 7.5 Tạo tài khoản Admin

**POST** `/api/Users`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Request Body

```json
{
  "email": "admin2",
  "password": "admin123",
  "fullName": "Admin Two",
  "phone": "0901234567"
}
```

| Trường     | Kiểu   | Bắt buộc | Mô tả                  |
| ---------- | ------ | -------- | ---------------------- |
| `email`    | string | ✅       | Email hợp lệ, duy nhất |
| `password` | string | ✅       | Tối thiểu 6 ký tự      |
| `fullName` | string | ✅       | Họ tên (2-100 ký tự)   |
| `phone`    | string | ❌       | Số điện thoại          |

#### Response 200

```json
{
  "success": true,
  "message": "Tạo tài khoản Admin thành công",
  "data": {
    "userId": 10,
    "fullName": "Admin Two",
    "email": "admin2",
    "phone": "0901234567",
    "role": "Admin",
    "createdAt": "2026-04-30T10:00:00"
  }
}
```

#### Response 400

```json
{
  "success": false,
  "message": "Email đã tồn tại",
  "data": null
}
```

---

### 8.8 Lấy tất cả lịch hẹn (Admin)

**GET** `/api/Appointments/admin/all`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Query Parameters (tất cả optional)

| Tham số     | Kiểu     | Mô tả                                                                  |
| ----------- | -------- | ---------------------------------------------------------------------- |
| `fromDate`  | datetime | Lọc từ ngày (format: `YYYY-MM-DD`)                                     |
| `toDate`    | datetime | Lọc đến ngày (format: `YYYY-MM-DD`)                                    |
| `status`    | string   | Lọc theo trạng thái (`Pending`, `Confirmed`, `Completed`, `Cancelled`) |
| `doctorId`  | int      | Lọc theo ID bác sĩ                                                     |
| `patientId` | int      | Lọc theo ID bệnh nhân                                                  |

#### Ví dụ

```
GET /api/Appointments/admin/all?status=Pending&fromDate=2026-04-01
```

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": [
    {
      "appointmentId": 1,
      "patientId": 1,
      "patientName": "Patient One",
      "patientEmail": "patient1",
      "doctorId": 1,
      "doctorName": "Dr. John Smith",
      "departmentName": "Khoa Nội tổng hợp",
      "appointmentTime": "2026-04-15T09:00:00",
      "status": "Pending",
      "createdAt": "2026-04-10T14:00:00",
      "hasMedicalRecord": false
    }
  ]
}
```

---

### 8.9 Lấy chi tiết lịch hẹn (Admin)

**GET** `/api/Appointments/admin/{id}`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả       |
| ------- | ---- | ----------- |
| `id`    | int  | ID lịch hẹn |

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    "appointmentId": 1,
    "patientId": 1,
    "patientName": "Patient One",
    "patientEmail": "patient1",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "departmentName": "Khoa Nội tổng hợp",
    "appointmentTime": "2026-04-15T09:00:00",
    "status": "Confirmed",
    "createdAt": "2026-04-10T14:00:00",
    "hasMedicalRecord": true
  }
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Lịch hẹn không tồn tại",
  "data": null
}
```

---

### 8.10 Cập nhật trạng thái lịch hẹn (Admin)

**PUT** `/api/Appointments/admin/{id}/status`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả       |
| ------- | ---- | ----------- |
| `id`    | int  | ID lịch hẹn |

#### Request Body

```json
{
  "status": "Completed"
}
```

| Trường   | Kiểu              | Bắt buộc | Mô tả                                            |
| -------- | ----------------- | -------- | ------------------------------------------------ |
| `status` | AppointmentStatus | ✅       | `Pending`, `Confirmed`, `Completed`, `Cancelled` |

#### Response 200

```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công",
  "data": {
    "appointmentId": 1,
    "patientId": 1,
    "patientName": "Patient One",
    "patientEmail": "patient1",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "departmentName": "Khoa Nội tổng hợp",
    "appointmentTime": "2026-04-15T09:00:00",
    "status": "Completed",
    "createdAt": "2026-04-10T14:00:00",
    "hasMedicalRecord": true
  }
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Lịch hẹn không tồn tại",
  "data": null
}
```

---

### 8.11 Hủy lịch hẹn (Admin)

**DELETE** `/api/Appointments/admin/{id}`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả       |
| ------- | ---- | ----------- |
| `id`    | int  | ID lịch hẹn |

#### Response 200

```json
{
  "success": true,
  "message": "Hủy lịch hẹn thành công",
  "data": null
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Lịch hẹn không tồn tại",
  "data": null
}
```

---
