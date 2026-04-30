## 12. API Thông báo — Notifications

> **Base**: `/api/notifications`
> **Auth**: Yêu cầu đăng nhập (tất cả vai trò)

---

### Loại thông báo

| Giá trị                    | Mô tả                   | Người nhận |
| -------------------------- | ----------------------- | ---------- |
| `AppointmentCreated`       | Có lịch hẹn mới         | Bác sĩ     |
| `AppointmentConfirmed`     | Lịch hẹn được xác nhận  | Bệnh nhân  |
| `AppointmentCancelled`     | Lịch hẹn bị hủy         | Cả hai     |
| `AppointmentAutoCancelled` | Lịch hẹn tự động bị hủy | Bệnh nhân  |
| `AppointmentCompleted`     | Lịch khám hoàn thành    | Bệnh nhân  |

---

### 12.1 Lấy danh sách thông báo của user hiện tại

**GET** `/api/notifications`

#### Auth

`[Authorize]` — Tất cả vai trò đã đăng nhập

#### Response 200

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "notificationId": 1,
      "title": "Lịch hẹn mới",
      "message": "Bệnh nhân Đỗ Minh Quân vừa đặt lịch khám vào 14:00 01/05/2026.",
      "type": "AppointmentCreated",
      "relatedId": 5,
      "isRead": false,
      "createdAt": "2026-04-30T14:00:00"
    }
  ]
}
```

| Trường           | Kiểu     | Mô tả                   |
| ---------------- | -------- | ----------------------- |
| `notificationId` | int      | ID thông báo            |
| `title`          | string   | Tiêu đề thông báo       |
| `message`        | string   | Nội dung chi tiết       |
| `type`           | string   | Loại thông báo          |
| `relatedId`      | int?     | AppointmentId liên quan |
| `isRead`         | bool     | Đã đọc hay chưa         |
| `createdAt`      | datetime | Thời gian tạo           |

---

### 12.2 Lấy số thông báo chưa đọc

**GET** `/api/notifications/unread-count`

#### Auth

`[Authorize]` — Tất cả vai trò đã đăng nhập

#### Response 200

```json
{
  "success": true,
  "message": null,
  "data": {
    "count": 3
  }
}
```

---

### 12.3 Đánh dấu một thông báo là đã đọc

**PUT** `/api/notifications/{id}/read`

#### Auth

`[Authorize]` — Tất cả vai trò đã đăng nhập

#### Path Parameters

| Tham số | Kiểu | Mô tả        |
| ------- | ---- | ------------ |
| `id`    | int  | ID thông báo |

#### Response 200

```json
{
  "success": true,
  "message": "Đã đánh dấu là đã đọc",
  "data": null
}
```

---

### 12.4 Đánh dấu tất cả thông báo là đã đọc

**PUT** `/api/notifications/read-all`

#### Auth

`[Authorize]` — Tất cả vai trò đã đăng nhập

#### Response 200

```json
{
  "success": true,
  "message": "Đã đánh dấu tất cả là đã đọc",
  "data": null
}
```

---

### SignalR Hub — Real-time Notifications

**Endpoint:** `/hubs/notifications`
**Auth:** Truyền JWT token qua query string: `/hubs/notifications?access_token=<token>`

#### Cách sử dụng

```javascript
// 1. Kết nối đến hub với token
const hubConnection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/notifications", { accessTokenFactory: () => jwtToken })
  .build();

// 2. Join group theo userId
await hubConnection.invoke("JoinUserGroup", userId);

// 3. Lắng nghe thông báo mới
hubConnection.on("ReceiveNotification", (notification) => {
  console.log("Thông báo mới:", notification);
  // Hiển thị toast / cập nhật badge
});
```

---
