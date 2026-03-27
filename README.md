# MedicalBookingAPI Frontend (React + Vite + JavaScript)

Frontend nay duoc mapping theo backend ASP.NET Core tai `http://localhost:5220`.

## B1 - Cau truc thu muc

```text
src/
  api/
    axiosClient.js
    services/
      baseService.js
      authService.js
      userService.js
      departmentService.js
      doctorService.js
      appointmentService.js
      medicalRecordService.js
  components/
    common/
      AppLayout.jsx
      ProtectedRoute.jsx
      PageState.jsx
    forms/
      LoginForm.jsx
      AppointmentForm.jsx
  context/
    AuthContext.jsx
  hooks/
    useAuth.js
  pages/
    LoginPage.jsx
    DashboardPage.jsx
    DepartmentsPage.jsx
    DoctorsPage.jsx
    AppointmentsPage.jsx
    MedicalRecordsPage.jsx
    NotFoundPage.jsx
  routes/
    AppRoutes.jsx
  types/
    apiTypes.js
  utils/
    storage.js
    mappers.js
    date.js
    validation.js
  App.jsx
  main.jsx
  index.css
```

## B2 - Mapping API (endpoint -> service)

- `POST /api/Auth/login` -> `loginService`
  - request: `LoginRequest` -> form `email`, `password`
  - response: `AuthResponse` -> UI user + token
- `GET /api/Users/me` -> `getCurrentUserService`
  - response: `UserDetailDto` -> dashboard profile
- `GET /api/Departments` -> `getDepartmentsService`
  - response: `DepartmentDto[]` -> department table
- `GET /api/Doctors` -> `getDoctorsService`
  - response: `DoctorDetailDto[]` -> doctor table
- `GET /api/Appointments/patient` hoac `/doctor` -> `getMyAppointmentsService`
  - response: `AppointmentDto[]` -> appointment table
- `POST /api/Appointments` -> `createAppointmentService` (Patient)
  - request: `CreateAppointmentRequest` -> appointment form
  - response: `AppointmentDto`
- `GET /api/MedicalRecords/doctor` -> `getMedicalRecordsService` (Doctor)
  - response: `MedicalRecordDto[]`

### Quy tac mapping du lieu

- Response `PascalCase` duoc map sang `camelCase` qua `mapKeysPascalToCamel`.
- `null/undefined` duoc normalize ve fallback qua `normalizeNullable`.
- Date ISO duoc format `DD/MM/YYYY HH:mm` qua `formatDateTime`.

## B3 - Lenh cai package

```bash
npm install
npm install axios react-router-dom react-hook-form react-toastify jwt-decode dayjs
```

## B4 - Cach chay

1. Tao file `.env` tu `.env.example`
2. Dam bao co:
   - `VITE_API_BASE_URL=http://localhost:5220`
3. Chay:

```bash
npm run dev
```

Frontend chay mac dinh tai `http://localhost:5173`.

## B5 - Checklist test API sau khi mapping

- [ ] Login voi `admin/admin123`, `doctor1/doctor123`, `patient1/patient123`
- [ ] 401 auto logout + redirect `/login`
- [ ] Dashboard hien thi dung user tu `/api/Users/me`
- [ ] Department list tai thanh cong tu `/api/Departments`
- [ ] Doctor list tai thanh cong tu `/api/Doctors`
- [ ] Patient tao appointment thanh cong (POST `/api/Appointments`)
- [ ] Patient/Doctor xem appointment list dung theo role
- [ ] Doctor xem medical records thanh cong
- [ ] Loading/Error/Empty state hien thi dung o tat ca page
- [ ] Toast hien thi success/error khi goi API

## Ghi chu

- Backend hien chua co endpoint list medical records rieng cho `Admin`, nen trang Medical Records se bao ro de tranh map sai API.
