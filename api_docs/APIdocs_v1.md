# MedicalBookingAI — Hướng Dẫn Kiểm Thử API

> Bộ tài liệu test đầy đủ cho hệ thống API đặt lịch khám bệnh viện
> ASP.NET Core 8.0 + Entity Framework Core + SQL Server
> Base URL: `http://localhost:5220`
> Cập nhật: 2026-03-26

---

## Mục lục

1. [Cấu trúc Response & Mã lỗi](#1-cấu-trúc-response--mã-lỗi)
2. [Tài khoản mặc định](#2-tài-khoản-mặc-định)
3. [Cách lấy JWT Token](#3-cách-lấy-jwt-token)
4. [API Xác thực — Auth](#4-api-xác-thực--auth)
5. [API Khoa — Departments](#5-api-khoa--departments)
6. [API Bác sĩ — Doctors](#6-api-bác-sĩ--doctors)
7. [API Người dùng — Users](#7-api-người-dùng--users)
8. [API Lịch hẹn — Appointments](#8-api-lịch-hẹn--appointments)
9. [API Hồ sơ bệnh án — Medical Records](#9-api-hồ-sơ-bệnh-án--medical-records)
10. [Danh sách HTTP Status Codes](#10-danh-sách-http-status-codes)

---

## 1. Cấu trúc Response & Mã lỗi

Tất cả API trả về response theo định dạng `ApiResponse<T>`:

### Thành công

```json
{
  "success": true,
  "message": "Mô tả thao tác",
  "data": { ... }
}
```

### Thất bại

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "data": null
}
```

---

## 2. Tài khoản mặc định

| Vai trò | Username / Email | Password | Quyền |
|---------|-----------------|----------|-------|
| **Admin** | `admin` | `admin123` | Toàn quyền |
| **Doctor** | `doctor1` | `doctor123` | Quản lý lịch hẹn, hồ sơ bệnh án |
| **Patient** | `patient1` | `patient123` | Đặt lịch khám, xem lịch sử |

> **Lưu ý**: Token JWT có thời hạn theo cấu hình `ExpireDays` trong `appsettings.json` (mặc định 7 ngày).

---

## 3. Cách lấy JWT Token

Gọi `POST /api/Auth/login` với email và password. Token nằm trong `data.token` của response.

### Cấu hình Authorization Header

Sau khi có token, thêm header cho các request cần xác thực:

```
Authorization: Bearer <token>
```

### Quyền theo vai trò

| Vai trò | Ký hiệu |
|---------|----------|
| Admin | `[Authorize(Roles = "Admin")]` |
| Doctor | `[Authorize(Roles = "Doctor")]` |
| Patient | `[Authorize(Roles = "Patient")]` |
| Tất cả đã đăng nhập | `[Authorize]` |
| Không cần đăng nhập | `[AllowAnonymous]` |

---

## 4. API Xác thực — Auth

> **Base**: `/api/Auth`
> **Auth**: Không yêu cầu

---

### 4.1 Đăng ký tài khoản

**POST** `/api/Auth/register`

#### Request Body

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "password": "password123",
  "phone": "0901234567",
  "role": "Patient",
  "dateOfBirth": "1990-01-15",
  "gender": "Male",
  "departmentId": 1,
  "qualification": "Thạc sĩ"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|---------|-------|
| `fullName` | string | ✅ | Họ tên (2-100 ký tự) |
| `email` | string | ✅ | Email hợp lệ, duy nhất |
| `password` | string | ✅ | Tối thiểu 6 ký tự |
| `phone` | string | ❌ | Số điện thoại |
| `role` | string | ✅ | `Patient`, `Doctor`, `Admin` |
| `dateOfBirth` | datetime | ❌ | Ngày sinh (format: `YYYY-MM-DD`) |
| `gender` | string | ❌ | Giới tính |
| `departmentId` | int | ❌ | ID khoa (dành cho Doctor) |
| `qualification` | string | ❌ | Bằng cấp chuyên môn (dành cho Doctor) |

#### Response 200

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "nguyenvana@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "Patient",
    "userId": 4
  }
}
```

#### Response 400

```json
{
  "success": false,
  "message": "Đăng ký thất bại, email có thể đã tồn tại hoặc vai trò không hợp lệ",
  "data": null
}
```

---

### 4.2 Đăng nhập

**POST** `/api/Auth/login`

#### Request Body

```json
{
  "email": "admin",
  "password": "admin123"
}
```

#### Response 200

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "admin",
    "fullName": "Admin User",
    "role": "Admin",
    "userId": 1
  }
}
```

#### Response 401

```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng",
  "data": null
}
```

---

## 5. API Khoa — Departments

> **Base**: `/api/Departments`
> **Auth**: Đọc công khai, Ghi yêu cầu Admin

---

### 5.1 Lấy danh sách tất cả khoa

**GET** `/api/Departments`

#### Auth

`[AllowAnonymous]`

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": [
    {
      "departmentId": 1,
      "departmentName": "Khoa Nội tổng hợp",
      "description": "Khám và điều trị các bệnh nội khoa"
    },
    {
      "departmentId": 2,
      "departmentName": "Khoa Ngoại tổng hợp",
      "description": "Phẫu thuật và điều trị ngoại khoa"
    }
  ]
}
```

---

### 5.2 Lấy thông tin khoa theo ID

**GET** `/api/Departments/{id}`

#### Auth

`[AllowAnonymous]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID khoa |

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    "departmentId": 1,
    "departmentName": "Khoa Nội tổng hợp",
    "description": "Khám và điều trị các bệnh nội khoa"
  }
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Khoa không tồn tại",
  "data": null
}
```

---

### 5.3 Tạo khoa mới

**POST** `/api/Departments`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Request Body

```json
{
  "departmentName": "Khoa Tim mạch",
  "description": "Khám và điều trị các bệnh về tim mạch"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|---------|-------|
| `departmentName` | string | ✅ | Tên khoa (2-100 ký tự) |
| `description` | string | ❌ | Mô tả (tối đa 500 ký tự) |

#### Response 200

```json
{
  "success": true,
  "message": "Tạo khoa thành công",
  "data": {
    "departmentId": 5,
    "departmentName": "Khoa Tim mạch",
    "description": "Khám và điều trị các bệnh về tim mạch"
  }
}
```

---

### 5.4 Cập nhật khoa

**PUT** `/api/Departments/{id}`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID khoa |

#### Request Body

```json
{
  "departmentName": "Khoa Tim mạch (Cập nhật)",
  "description": "Mô tả mới"
}
```

#### Response 200

```json
{
  "success": true,
  "message": "Cập nhật khoa thành công",
  "data": {
    "departmentId": 5,
    "departmentName": "Khoa Tim mạch (Cập nhật)",
    "description": "Mô tả mới"
  }
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Khoa không tồn tại",
  "data": null
}
```

---

### 5.5 Xóa khoa

**DELETE** `/api/Departments/{id}`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID khoa |

#### Response 200

```json
{
  "success": true,
  "message": "Xóa khoa thành công"
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Khoa không tồn tại",
  "data": null
}
```

---

## 6. API Bác sĩ — Doctors

> **Base**: `/api/Doctors`
> **Auth**: Đọc công khai, Ghi yêu cầu Admin

---

### 6.1 Lấy danh sách tất cả bác sĩ

**GET** `/api/Doctors`

#### Auth

`[AllowAnonymous]`

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": [
    {
      "doctorId": 1,
      "userId": 2,
      "fullName": "Dr. John Smith",
      "email": "doctor1",
      "phone": "0901234567",
      "departmentId": 1,
      "departmentName": "Khoa Nội tổng hợp",
      "qualification": "Thạc sĩ"
    }
  ]
}
```

---

### 6.2 Lấy thông tin bác sĩ theo ID

**GET** `/api/Doctors/{id}`

#### Auth

`[AllowAnonymous]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID bác sĩ |

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    "doctorId": 1,
    "userId": 2,
    "fullName": "Dr. John Smith",
    "email": "doctor1",
    "phone": "0901234567",
    "departmentId": 1,
    "departmentName": "Khoa Nội tổng hợp",
    "qualification": "Thạc sĩ"
  }
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Bác sĩ không tồn tại",
  "data": null
}
```

---

### 6.3 Lấy danh sách bác sĩ theo khoa

**GET** `/api/Doctors/department/{departmentId}`

#### Auth

`[AllowAnonymous]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `departmentId` | int | ID khoa |

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": [
    {
      "doctorId": 1,
      "userId": 2,
      "fullName": "Dr. John Smith",
      "email": "doctor1",
      "phone": "0901234567",
      "departmentId": 1,
      "departmentName": "Khoa Nội tổng hợp",
      "qualification": "Thạc sĩ"
    }
  ]
}
```

---

### 6.4 Tạo bác sĩ mới

**POST** `/api/Doctors`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Request Body

```json
{
  "fullName": "Dr. Jane Doe",
  "email": "doctor2",
  "password": "doctor123",
  "phone": "0909876543",
  "departmentId": 2,
  "qualification": "Tiến sĩ"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|---------|-------|
| `fullName` | string | ✅ | Họ tên (2-100 ký tự) |
| `email` | string | ✅ | Email hợp lệ, duy nhất |
| `password` | string | ✅ | Tối thiểu 6 ký tự |
| `phone` | string | ❌ | Số điện thoại |
| `departmentId` | int | ✅ | ID khoa |
| `qualification` | string | ❌ | Bằng cấp chuyên môn |

#### Response 200

```json
{
  "success": true,
  "message": "Tạo bác sĩ thành công",
  "data": {
    "doctorId": 3,
    "userId": 5,
    "fullName": "Dr. Jane Doe",
    "email": "doctor2",
    "phone": "0909876543",
    "departmentId": 2,
    "departmentName": "Khoa Ngoại tổng hợp",
    "qualification": "Tiến sĩ"
  }
}
```

#### Response 400

```json
{
  "success": false,
  "message": "Email đã tồn tại hoặc khoa không hợp lệ",
  "data": null
}
```

---

### 6.5 Cập nhật thông tin bác sĩ

**PUT** `/api/Doctors/{id}`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID bác sĩ |

#### Request Body

```json
{
  "qualification": "Giáo sư",
  "phone": "0912345678"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|---------|-------|
| `qualification` | string | ❌ | Bằng cấp chuyên môn mới |
| `phone` | string | ❌ | Số điện thoại mới |

#### Response 200

```json
{
  "success": true,
  "message": "Cập nhật thông tin bác sĩ thành công",
  "data": {
    "doctorId": 1,
    "userId": 2,
    "fullName": "Dr. John Smith",
    "email": "doctor1",
    "phone": "0912345678",
    "departmentId": 1,
    "departmentName": "Khoa Nội tổng hợp",
    "qualification": "Giáo sư"
  }
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Bác sĩ không tồn tại",
  "data": null
}
```

---

### 6.6 Phân công bác sĩ vào khoa

**PUT** `/api/Doctors/{id}/department`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID bác sĩ |

#### Request Body

```json
{
  "departmentId": 3
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|---------|-------|
| `departmentId` | int | ✅ | ID khoa muốn phân công |

#### Response 200

```json
{
  "success": true,
  "message": "Phân công khoa thành công"
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Bác sĩ hoặc khoa không tồn tại",
  "data": null
}
```

---

## 7. API Người dùng — Users

> **Base**: `/api/Users`
> **Auth**: Yêu cầu đăng nhập

---

### 7.1 Lấy thông tin người dùng hiện tại

**GET** `/api/Users/me`

#### Auth

`[Authorize]` — Tất cả vai trò đã đăng nhập

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    "userId": 3,
    "fullName": "Patient One",
    "email": "patient1",
    "phone": "0901234567",
    "role": "Patient",
    "createdAt": "2026-03-25T13:38:01",
    "patient": {
      "patientId": 1,
      "dateOfBirth": "1985-05-20T00:00:00",
      "gender": "Male"
    },
    "doctor": null
  }
}
```

#### Response 401

```json
{
  "success": false,
  "message": "Thông tin người dùng không hợp lệ",
  "data": null
}
```

---

### 7.2 Lấy danh sách tất cả người dùng

**GET** `/api/Users`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": [
    {
      "userId": 1,
      "fullName": "Admin User",
      "email": "admin",
      "phone": null,
      "role": "Admin",
      "createdAt": "2026-03-25T13:38:01"
    },
    {
      "userId": 2,
      "fullName": "Dr. John Smith",
      "email": "doctor1",
      "phone": "0901234567",
      "role": "Doctor",
      "createdAt": "2026-03-25T13:38:01"
    }
  ]
}
```

---

### 7.3 Lấy thông tin người dùng theo ID

**GET** `/api/Users/{id}`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID người dùng |

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    "userId": 3,
    "fullName": "Patient One",
    "email": "patient1",
    "phone": "0901234567",
    "role": "Patient",
    "createdAt": "2026-03-25T13:38:01",
    "patient": {
      "patientId": 1,
      "dateOfBirth": "1985-05-20T00:00:00",
      "gender": "Male"
    },
    "doctor": null
  }
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Người dùng không tồn tại",
  "data": null
}
```

---

### 7.4 Xóa người dùng

**DELETE** `/api/Users/{id}`

#### Auth

`[Authorize(Roles = "Admin")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID người dùng |

#### Response 200

```json
{
  "success": true,
  "message": "Xóa người dùng thành công"
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Người dùng không tồn tại",
  "data": null
}
```

---

## 8. API Lịch hẹn — Appointments

> **Base**: `/api/Appointments`
> **Auth**: Yêu cầu đăng nhập (Patient, Doctor)

---

### Trạng thái lịch hẹn

| Giá trị | Mô tả |
|---------|-------|
| `Pending` | Chờ xác nhận |
| `Confirmed` | Đã xác nhận |
| `Completed` | Đã hoàn thành |
| `Cancelled` | Đã hủy |

---

### 8.1 Lấy lịch hẹn của bệnh nhân hiện tại

**GET** `/api/Appointments/patient`

#### Auth

`[Authorize(Roles = "Patient")]`

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
      "doctorId": 1,
      "doctorName": "Dr. John Smith",
      "departmentName": "Khoa Nội tổng hợp",
      "appointmentTime": "2026-03-26T09:00:00",
      "status": "Pending",
      "createdAt": "2026-03-25T14:00:00"
    }
  ]
}
```

---

### 8.2 Lấy lịch hẹn của bác sĩ hiện tại

**GET** `/api/Appointments/doctor`

#### Auth

`[Authorize(Roles = "Doctor")]`

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
      "doctorId": 1,
      "doctorName": "Dr. John Smith",
      "departmentName": "Khoa Nội tổng hợp",
      "appointmentTime": "2026-03-26T09:00:00",
      "status": "Pending",
      "createdAt": "2026-03-25T14:00:00"
    }
  ]
}
```

---

### 8.3 Lấy lịch hẹn của bác sĩ theo ngày

**GET** `/api/Appointments/doctor/schedule?date={date}`

#### Auth

`[Authorize(Roles = "Doctor")]`

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|---------|-------|
| `date` | datetime | ✅ | Ngày cần xem (format: `YYYY-MM-DD`) |

#### Ví dụ

```
GET /api/Appointments/doctor/schedule?date=2026-03-26
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
      "doctorId": 1,
      "doctorName": "Dr. John Smith",
      "departmentName": "Khoa Nội tổng hợp",
      "appointmentTime": "2026-03-26T09:00:00",
      "status": "Pending",
      "createdAt": "2026-03-25T14:00:00"
    }
  ]
}
```

---

### 8.4 Lấy thông tin lịch hẹn theo ID

**GET** `/api/Appointments/{id}`

#### Auth

`[Authorize]` — Tất cả vai trò đã đăng nhập

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID lịch hẹn |

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    "appointmentId": 1,
    "patientId": 1,
    "patientName": "Patient One",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "departmentName": "Khoa Nội tổng hợp",
    "appointmentTime": "2026-03-26T09:00:00",
    "status": "Pending",
    "createdAt": "2026-03-25T14:00:00"
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

### 8.5 Tạo lịch hẹn mới

**POST** `/api/Appointments`

#### Auth

`[Authorize(Roles = "Patient")]`

#### Request Body

```json
{
  "doctorId": 1,
  "appointmentTime": "2026-03-26T09:00:00"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|---------|-------|
| `doctorId` | int | ✅ | ID bác sĩ |
| `appointmentTime` | datetime | ✅ | Thời gian hẹn (phải là thời gian tương lai) |

#### Response 200

```json
{
  "success": true,
  "message": "Tạo lịch hẹn thành công",
  "data": {
    "appointmentId": 5,
    "patientId": 1,
    "patientName": "Patient One",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "departmentName": "Khoa Nội tổng hợp",
    "appointmentTime": "2026-03-26T09:00:00",
    "status": "Pending",
    "createdAt": "2026-03-26T08:00:00"
  }
}
```

#### Response 400 — Lịch hẹn trùng hoặc không hợp lệ

```json
{
  "success": false,
  "message": "Bác sĩ đã có lịch hẹn vào thời gian này",
  "data": null
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Thông tin bệnh nhân không tồn tại",
  "data": null
}
```

---

### 8.6 Cập nhật trạng thái lịch hẹn

**PUT** `/api/Appointments/{id}/status`

#### Auth

`[Authorize(Roles = "Doctor")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID lịch hẹn |

#### Request Body

```json
{
  "status": "Confirmed"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|---------|-------|
| `status` | AppointmentStatus | ✅ | `Pending`, `Confirmed`, `Completed`, `Cancelled` |

#### Response 200

```json
{
  "success": true,
  "message": "Cập nhật trạng thái lịch hẹn thành công",
  "data": {
    "appointmentId": 1,
    "patientId": 1,
    "patientName": "Patient One",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "departmentName": "Khoa Nội tổng hợp",
    "appointmentTime": "2026-03-26T09:00:00",
    "status": "Confirmed",
    "createdAt": "2026-03-25T14:00:00"
  }
}
```

#### Response 403 — Bác sĩ không sở hữu lịch hẹn

```json
{
  "success": false,
  "message": "Forbidden",
  "data": null
}
```

---

### 8.7 Hủy lịch hẹn

**DELETE** `/api/Appointments/{id}`

#### Auth

`[Authorize(Roles = "Patient")]`

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID lịch hẹn |

#### Response 200

```json
{
  "success": true,
  "message": "Hủy lịch hẹn thành công"
}
```

#### Response 400 — Lịch hẹn không thể hủy

```json
{
  "success": false,
  "message": "Không thể hủy lịch hẹn đã hoàn thành",
  "data": null
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Lịch hẹn không tồn tại hoặc không có quyền hủy",
  "data": null
}
```

---

## 9. API Hồ sơ bệnh án — Medical Records

> **Base**: `/api/MedicalRecords`
> **Auth**: Yêu cầu đăng nhập (Patient, Doctor)

---

### 9.1 Lấy hồ sơ bệnh án của bệnh nhân hiện tại

**GET** `/api/MedicalRecords/patient`

#### Auth

`[Authorize(Roles = "Patient")]`

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": [
    {
      "medicalRecordId": 1,
      "appointmentId": 1,
      "appointmentTime": "2026-03-26T09:00:00",
      "doctorName": "Dr. John Smith",
      "departmentName": "Khoa Nội tổng hợp",
      "doctorDiagnosis": "Cảm cúm nhẹ",
      "treatment": "Nghỉ ngơi, uống nhiều nước, uống thuốc hạ sốt",
      "createdAt": "2026-03-26T10:00:00"
    }
  ]
}
```

---

### 9.2 Lấy hồ sơ bệnh án của bác sĩ hiện tại

**GET** `/api/MedicalRecords/doctor`

#### Auth

`[Authorize(Roles = "Doctor")]`

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": [
    {
      "medicalRecordId": 1,
      "appointmentId": 1,
      "appointmentTime": "2026-03-26T09:00:00",
      "doctorName": "Dr. John Smith",
      "departmentName": "Khoa Nội tổng hợp",
      "doctorDiagnosis": "Cảm cúm nhẹ",
      "treatment": "Nghỉ ngơi, uống nhiều nước, uống thuốc hạ sốt",
      "createdAt": "2026-03-26T10:00:00"
    }
  ]
}
```

---

### 9.3 Lấy hồ sơ bệnh án theo ID

**GET** `/api/MedicalRecords/{id}`

#### Auth

`[Authorize]` — Tất cả vai trò đã đăng nhập

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | int | ID hồ sơ bệnh án |

#### Response 200

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {
    "medicalRecordId": 1,
    "appointmentId": 1,
    "appointmentTime": "2026-03-26T09:00:00",
    "doctorName": "Dr. John Smith",
    "departmentName": "Khoa Nội tổng hợp",
    "doctorDiagnosis": "Cảm cúm nhẹ",
    "treatment": "Nghỉ ngơi, uống nhiều nước, uống thuốc hạ sốt",
    "createdAt": "2026-03-26T10:00:00"
  }
}
```

#### Response 404

```json
{
  "success": false,
  "message": "Hồ sơ bệnh án không tồn tại",
  "data": null
}
```

---

### 9.4 Tạo hồ sơ bệnh án mới

**POST** `/api/MedicalRecords`

#### Auth

`[Authorize(Roles = "Doctor")]`

#### Request Body

```json
{
  "appointmentId": 1,
  "doctorDiagnosis": "Cảm cúm nhẹ",
  "treatment": "Nghỉ ngơi, uống nhiều nước, uống thuốc hạ sốt trong 3 ngày"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|---------|-------|
| `appointmentId` | int | ✅ | ID lịch hẹn đã hoàn thành |
| `doctorDiagnosis` | string | ❌ | Chẩn đoán của bác sĩ |
| `treatment` | string | ❌ | Phương pháp điều trị |

#### Response 200

```json
{
  "success": true,
  "message": "Tạo hồ sơ bệnh án thành công",
  "data": {
    "medicalRecordId": 3,
    "appointmentId": 1,
    "appointmentTime": "2026-03-26T09:00:00",
    "doctorName": "Dr. John Smith",
    "departmentName": "Khoa Nội tổng hợp",
    "doctorDiagnosis": "Cảm cúm nhẹ",
    "treatment": "Nghỉ ngơi, uống nhiều nước, uống thuốc hạ sốt trong 3 ngày",
    "createdAt": "2026-03-26T10:00:00"
  }
}
```

#### Response 400 — Lịch hẹn không hợp lệ

```json
{
  "success": false,
  "message": "Lịch hẹn không tồn tại hoặc không thuộc về bác sĩ này",
  "data": null
}
```

---

## 10. Danh sách HTTP Status Codes

| Status Code | Mô tả |
|-------------|-------|
| `200 OK` | Thành công |
| `400 Bad Request` | Dữ liệu không hợp lệ |
| `401 Unauthorized` | Chưa đăng nhập hoặc token không hợp lệ |
| `403 Forbidden` | Không có quyền thực hiện thao tác |
| `404 Not Found` | Tài nguyên không tồn tại |

---

## Ví dụ Test với PowerShell

```powershell
# 1. Đăng nhập để lấy token
$login = Invoke-RestMethod -Uri "http://localhost:5220/api/Auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"admin","password":"admin123"}'

$token = $login.data.token

# 2. Lấy danh sách khoa (công khai)
Invoke-RestMethod -Uri "http://localhost:5220/api/Departments" `
    -Method GET

# 3. Lấy danh sách bác sĩ (công khai)
Invoke-RestMethod -Uri "http://localhost:5220/api/Doctors" `
    -Method GET

# 4. Lấy thông tin user hiện tại (yêu cầu auth)
Invoke-RestMethod -Uri "http://localhost:5220/api/Users/me" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $token" }

# 5. Tạo lịch hẹn mới (Patient)
Invoke-RestMethod -Uri "http://localhost:5220/api/Appointments" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -Body '{"doctorId":1,"appointmentTime":"2026-03-27T10:00:00"}'
```

---

## Ví dụ Test với curl

```bash
# 1. Đăng nhập
curl -X POST http://localhost:5220/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin123"}'

# 2. Lấy danh sách khoa
curl http://localhost:5220/api/Departments

# 3. Lấy danh sách bác sĩ
curl http://localhost:5220/api/Doctors

# 4. Lấy thông tin user hiện tại
TOKEN="<token>"
curl http://localhost:5220/api/Users/me \
  -H "Authorization: Bearer $TOKEN"

# 5. Tạo lịch hẹn (Patient)
curl -X POST http://localhost:5220/api/Appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"doctorId":1,"appointmentTime":"2026-03-27T10:00:00"}'

# 6. Tạo hồ sơ bệnh án (Doctor)
curl -X POST http://localhost:5220/api/MedicalRecords \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"appointmentId":1,"doctorDiagnosis":"Cảm cúm","treatment":"Nghỉ ngơi"}'
```

---

## Tổng hợp Endpoints

| # | Phương thức | Endpoint | Auth | Vai trò |
|---|-------------|----------|------|---------|
| | | **Auth** | | |
| 1 | POST | `/api/Auth/register` | ❌ | — |
| 2 | POST | `/api/Auth/login` | ❌ | — |
| | | **Departments** | | |
| 3 | GET | `/api/Departments` | ❌ | Công khai |
| 4 | GET | `/api/Departments/{id}` | ❌ | Công khai |
| 5 | POST | `/api/Departments` | ✅ | Admin |
| 6 | PUT | `/api/Departments/{id}` | ✅ | Admin |
| 7 | DELETE | `/api/Departments/{id}` | ✅ | Admin |
| | | **Doctors** | | |
| 8 | GET | `/api/Doctors` | ❌ | Công khai |
| 9 | GET | `/api/Doctors/{id}` | ❌ | Công khai |
| 10 | GET | `/api/Doctors/department/{departmentId}` | ❌ | Công khai |
| 11 | POST | `/api/Doctors` | ✅ | Admin |
| 12 | PUT | `/api/Doctors/{id}` | ✅ | Admin |
| 13 | PUT | `/api/Doctors/{id}/department` | ✅ | Admin |
| | | **Users** | | |
| 14 | GET | `/api/Users/me` | ✅ | Tất cả |
| 15 | GET | `/api/Users` | ✅ | Admin |
| 16 | GET | `/api/Users/{id}` | ✅ | Admin |
| 17 | DELETE | `/api/Users/{id}` | ✅ | Admin |
| | | **Appointments** | | |
| 18 | GET | `/api/Appointments/patient` | ✅ | Patient |
| 19 | GET | `/api/Appointments/doctor` | ✅ | Doctor |
| 20 | GET | `/api/Appointments/doctor/schedule?date=` | ✅ | Doctor |
| 21 | GET | `/api/Appointments/{id}` | ✅ | Tất cả |
| 22 | POST | `/api/Appointments` | ✅ | Patient |
| 23 | PUT | `/api/Appointments/{id}/status` | ✅ | Doctor |
| 24 | DELETE | `/api/Appointments/{id}` | ✅ | Patient |
| | | **MedicalRecords** | | |
| 25 | GET | `/api/MedicalRecords/patient` | ✅ | Patient |
| 26 | GET | `/api/MedicalRecords/doctor` | ✅ | Doctor |
| 27 | GET | `/api/MedicalRecords/{id}` | ✅ | Tất cả |
| 28 | POST | `/api/MedicalRecords` | ✅ | Doctor |

---

*Document này được tạo tự động dựa trên mã nguồn API. Cập nhật khi có thay đổi về endpoints.*
