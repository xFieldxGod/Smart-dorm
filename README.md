# 🏠 Smart Dorm - ระบบบริหารจัดการหอพัก

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-smart--dorm--app.netlify.app-brightgreen?style=for-the-badge&logo=netlify)](https://smart-dorm-app.netlify.app/)

### Admin Dashboard
![Admin Dashboard](./assets/hero.png)

### Tenant Dashboard
![Tenant Dashboard](./assets/tenant-dashboard.png)

ระบบบริหารจัดการหอพักอัจฉริยะ (Smart Dorm) ที่ออกแบบมาเพื่อยกระดับการจัดการหอพักให้มีความเป็นมืออาชีพ สะดวก และรวดเร็ว ทั้งสำหรับผู้เช่าและผู้ดูแลระบบ

---

## ✨ Features | ความสามารถของระบบ

### 👤 For Tenants (ผู้เช่า)
- **Personal Dashboard:** ตรวจสอบสถานะห้องพักและข่าวสารล่าสุด
- **Billing System:** ดูบิลค่าน้ำ-ค่าไฟ และอัปโหลดหลักฐานการโอนเงินได้ทันที
- **Maintenance Request:** แจ้งซ่อมพร้อมแนบรูปภาพ และติดตามสถานะการดำเนินการ
- **Profile Management:** จัดการข้อมูลส่วนตัวและรหัสผ่าน

### 🛠️ For Admin (ผู้ดูแลระบบ/นิติบุคคล)
- **Room Management:** จัดการข้อมูลห้องพัก สถานะการว่าง และข้อมูลผู้เช่า
- **Billing Management:** ออกบิลค่าน้ำ-ค่าไฟ และตรวจสอบหลักฐานการชำระเงิน
- **Maintenance Tracking:** รับเรื่องแจ้งซ่อม อัปเดตสถานะ และมอบหมายงาน
- **Announcements:** ประกาศข่าวสารสำคัญให้กับผู้เช่าทุกคนทราบ

---

## 🚀 Tech Stack | เทคโนโลยีที่เลือกใช้

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 + Lucide React (Icons)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (with `pg` driver)
- **Authentication:** JSON Web Token (JWT) + BcryptJS
- **Infrastructure:** Docker & Docker Compose
- **Deployment:** Ready for Netlify (Functions supported)

---

## 🛠️ Getting Started | วิธีการติดตั้งและใช้งาน

### Prerequisites
- Node.js (v18 หรือใหม่กว่า)
- Docker Desktop (สำหรับฐานข้อมูล)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/xFieldxGod/Smart-dorm.git
cd Smart-dorm
npm install
```

### 2. Environment Setup
สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:
```env
DATABASE_URL=postgresql://smartdorm:smartdorm123@localhost:5433/smartdorm
JWT_SECRET=mysecretkey123
PORT=3001
```

### 3. Database Setup (Docker)
```bash
# เริ่มทำงาน Docker สำหรับ PostgreSQL
npm run docker:up

# ติดตั้ง Schema และ Seed ข้อมูลเบื้องต้น
npm run setup:db
```

### 4. Start Development Server
```bash
# รัน Frontend (Vite)
npm run dev

# รัน Backend (API)
npm run dev:api
```

เปิด Browser ไปที่ [http://localhost:5173](http://localhost:5173)

---

## 🔐 Demo Accounts | บัญชีสำหรับทดลองใช้งาน

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Tenant** | `6605094` | `tenant123` |

---

## 📂 Project Structure | โครงสร้างโปรเจกต์

```text
├── backend/            # Backend logic & Database schemas
│   ├── routes/         # Express routes
│   ├── middleware/     # Auth & Error middlewares
│   └── setup-db.ts     # DB initialization script
├── src/                # Frontend application
│   ├── app/            # Core logic, types & views
│   │   ├── components/ # Reusable UI components
│   │   └── views/      # Page-level components
│   └── main.tsx        # Entry point
├── assets/             # Images & static assets
├── docker-compose.yml  # Docker infrastructure
└── package.json        # Project dependencies
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:3001/api`

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | เข้าสู่ระบบ | — |
| `POST` | `/auth/register` | สมัครสมาชิก | — |
| `GET` | `/auth/me` | ดูข้อมูลตัวเอง | ✓ |
| `POST` | `/auth/change-password` | เปลี่ยนรหัสผ่าน | ✓ |

### Rooms
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/rooms` | ดูห้องพักทั้งหมด | ✓ |
| `GET` | `/rooms/:id` | ดูห้องพักรายห้อง | ✓ |
| `POST` | `/rooms` | สร้างห้องพัก | Admin |
| `PUT` | `/rooms/:id` | แก้ไขห้องพัก | Admin |
| `DELETE` | `/rooms/:id` | ลบห้องพัก | Admin |

### Bills
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/bills` | ดูบิล (Admin: ทั้งหมด, Tenant: ของตัวเอง) | ✓ |
| `GET` | `/bills/:id` | ดูบิลรายการ | ✓ |
| `POST` | `/bills` | ออกบิล | Admin |
| `PUT` | `/bills/:id` | อัปเดตสถานะ/อัปโหลดสลิป | ✓ |
| `DELETE` | `/bills/:id` | ลบบิล | Admin |

### Maintenance
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/maintenance` | ดูรายการแจ้งซ่อม | ✓ |
| `GET` | `/maintenance/:id` | ดูรายการแจ้งซ่อมรายการ | ✓ |
| `POST` | `/maintenance` | แจ้งซ่อม | ✓ |
| `PUT` | `/maintenance/:id` | อัปเดตสถานะ | ✓ |
| `DELETE` | `/maintenance/:id` | ลบรายการ | Admin |

### Announcements
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/announcements` | ดูประกาศทั้งหมด | ✓ |
| `POST` | `/announcements` | สร้างประกาศ | Admin |
| `PUT` | `/announcements/:id` | แก้ไขประกาศ | Admin |
| `DELETE` | `/announcements/:id` | ลบประกาศ | Admin |

> ✓ = ต้องล็อกอิน (Bearer Token) | Admin = เฉพาะผู้ดูแลระบบ

---

## 📝 License
โปรเจกต์นี้เป็นส่วนหนึ่งของรายงานโครงงาน (Smart Dorm - ระบบบริหารจัดการหอพัก) พัฒนาเพื่อการศึกษาและเป็นตัวอย่าง MVP

---
Developed with ❤️ by [Tinnapob Paelsanom](https://github.com/xFieldxGod)
