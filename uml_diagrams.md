# 5.2.3 การสร้างแบบจำลองด้วย UML

เอกสารส่วนนี้รวบรวมแบบจำลอง UML ทั้ง 3 ประเภท (Use Case, Class, และ Sequence Diagram) ของระบบการจัดการหอพัก Smart Dormitory Management System ตามที่คุณต้องการครับ คุณสามารถกดย่อขยายหรือจับภาพหน้าจอ (Screenshot) เพื่อนำไปใส่ในเอกสารรายงานได้เลยครับ

## 5.2.3.1 Use Case Diagram
แสดงภาพรวมการใช้งานของระบบ โดยแยกเป็น 2 ผู้ใช้งานหลัก (Actor) คือ **ผู้ดูแลอาคาร (Admin)** และ **ผู้เช่า (Tenant)**

```mermaid
flowchart LR
    %% รูปแบบของ Actors
    Admin(["<br>ผู้ดูแลอาคาร (Admin)<br> "])
    Tenant(["<br>ผู้เช่า (Tenant)<br> "])

    %% กลุ่มของระบบหลัก
    subgraph "Smart Dormitory System (ระบบจัดการหอพัก)"
        UC1("จัดการข้อมูลห้องพัก")
        UC2("จัดการข้อมูลผู้เช่า")
        UC3("ออกบิลค่าเช่า/ค่าน้ำ/ค่าไฟ")
        UC4("จัดการสถานะการแจ้งซ่อม")
        UC5("แจ้งข่าวสารและประกาศ")

        UC6("เข้าสู่ระบบ (Authentication)")

        UC7("เรียกดูบิลและส่งสลิปชำระเงิน")
        UC8("แจ้งซ่อมแซมและบำรุงรักษา")
        UC9("เรียกดูประกาศข่าวสาร")
    end

    %% ความสัมพันธ์ของ Admin
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6

    %% ความสัมพันธ์ของ Tenant
    Tenant --> UC6
    Tenant --> UC7
    Tenant --> UC8
    Tenant --> UC9

    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef actor fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#1e1b4b,font-weight:bold;
    class Admin,Tenant actor;
```

---

## 5.2.3.1 Class Diagram
แสดงโครงสร้างของฐานข้อมูลและความสัมพันธ์ระหว่าง Entity ต่างๆ เช่น User, Room, Bill, Maintenance, และ Announcement

```mermaid
classDiagram
    %% ตารางผู้ใช้งาน
    class User {
        +Integer id
        +String username
        +String password
        +String fullName
        +String phone
        +String role
        +Integer roomId
    }

    %% ตารางห้องพัก
    class Room {
        +Integer id
        +String number
        +String type
        +String status
        +Integer baseRent
        +Integer tenantId
    }

    %% ตารางบิลค่าเช่า
    class Bill {
        +Integer id
        +Integer roomId
        +Integer tenantId
        +String month
        +Integer baseRent
        +Integer waterUnits
        +Integer electricityUnits
        +Integer total
        +String status
        +String slipImage
        +DateTime createdAt
    }

    %% ตารางการแจ้งซ่อม
    class MaintenanceRequest {
        +Integer id
        +Integer tenantId
        +Integer roomId
        +String title
        +String category
        +String description
        +String status
        +String residentImage
        +DateTime createdAt
    }

    %% ตารางข่าวสาร
    class Announcement {
        +Integer id
        +String title
        +String message
        +String priority
        +Integer createdBy
        +DateTime createdAt
    }

    %% ความสัมพันธ์
    User "1" -- "0..1" Room : Occupies
    Room "1" -- "0..*" Bill : Generates
    User "1" -- "0..*" Bill : Pays
    User "1" -- "0..*" MaintenanceRequest : Requests
    Room "1" -- "0..*" MaintenanceRequest : Needs
    User "1" -- "0..*" Announcement : Creates
```

---

## 5.2.3.1 Sequence Diagram
แสดงลำดับขั้นตอนการทำงาน (Workflow) ตัวอย่างของ **กระบวนการออกบิลและการชำระเงิน** ซึ่งครอบคลุมการพูดคุยตั้งแต่ส่วนแสดงผลไปยังส่วนฐานข้อมูล

```mermaid
sequenceDiagram
    actor Admin as ผู้ดูแลอาคาร (Admin)
    participant Client as Frontend (Web App)
    participant API as Backend (REST API)
    participant DB as Database (PostgreSQL)
    actor Tenant as ผู้เช่า (Tenant)

    %% 1. Admin generates the bill
    rect rgb(240, 248, 255)
    Note right of Admin: 1. สร้างบิลประจำเดือน
    Admin->>Client: กรอกหมายเลขหน่วยมิเตอร์น้ำ-ไฟ
    Client->>API: POST /api/bills (ข้อมูลบิล)
    API->>DB: INSERT INTO bills (...)
    DB-->>API: คืนค่า Bill ID ที่ถูกสร้าง
    API-->>Client: สถานะ 201 Created (Success)
    Client-->>Admin: แสดง Pop-up ออกบิลสำเร็จ
    end

    %% 2. Tenant views and pays the bill
    rect rgb(255, 245, 238)
    Note left of Tenant: 2. ผู้เช่าดูบิลและชำระเงิน
    Tenant->>Client: ล็อกอินเข้ามาเช็คหน้าแดชบอร์ด
    Client->>API: GET /api/bills?tenantId=...
    API->>DB: SELECT * FROM bills WHERE tenant_id=...
    DB-->>API: ส่งข้อมูลบิลที่ยังไม่ชำระ
    API-->>Client: รายการบิลเดือนปัจจุบัน
    Client-->>Tenant: แสดงยอดเงินและ QR Code

    Tenant->>Client: อัปโหลดสลิป & กดยืนยันชำระเงิน
    Client->>API: PUT /api/bills/:id (สถานะ: submitted)
    API->>DB: UPDATE bills SET status='submitted', slipImage=...
    DB-->>API: ยืนยันการอัปเดตข้อมูล
    API-->>Client: สถานะ 200 OK
    Client-->>Tenant: แจ้งเตือนส่งหลักฐานสำเร็จ รอแอดมินอนุมัติ
    end
```
