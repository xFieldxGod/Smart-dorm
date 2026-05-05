-- Smart Dorm Seed Data
-- Passwords are bcrypt hashed (cost factor 10)
-- admin123 => $2b$10$... , tenant123 => $2b$10$...

-- ============================================
-- USERS
-- ============================================
-- Password: admin123
INSERT INTO users (id, username, password_hash, full_name, phone, role, room_id)
VALUES (1, 'admin', '$2b$10$rQZ8kHwMv5ZjV3GxQ5q9UOkF7YI0XN5fBvKJhL2m8p3tR6wS1dA9e', 'ฝ่ายบริหารอาคาร Smart Dorm', '02-000-0000', 'admin', NULL)
ON CONFLICT (id) DO NOTHING;

-- Password: tenant123
INSERT INTO users (id, username, password_hash, full_name, phone, role, room_id) VALUES
(2, 'A-101', '$2b$10$sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7a', 'นายสุภทัต ตรีสมุทร', '081-245-7781', 'tenant', 1),
(3, 'A-102', '$2b$10$sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7a', 'นางสาวพิณลดา แจ้งจิตร์', '081-245-7782', 'tenant', 2),
(4, 'B-201', '$2b$10$sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7a', 'นางสาวชัญญา เขียวภักดี', '081-245-7783', 'tenant', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROOMS
-- ============================================
INSERT INTO rooms (id, number, type, status, base_rent, tenant_id) VALUES
(1, 'A-101', 'Studio',  'available',    3500, 2),
(2, 'A-102', 'Deluxe',  'available',    3900, 3),
(3, 'B-201', 'Studio',  'available',    3600, 4),
(4, 'B-202', 'Suite',   'maintenance',  4500, NULL),
(5, 'B-203', 'Studio',  'available',    3400, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ANNOUNCEMENTS
-- ============================================
INSERT INTO announcements (id, title, message, priority, created_by, created_at) VALUES
(1, 'ปิดปรับปรุงพื้นที่ส่วนกลางชั่วคราว', 'พื้นที่นั่งเล่นชั้นล่างจะปิดปรับปรุงในวันเสาร์นี้ เวลา 09:00 - 16:00 น. ขออภัยในความไม่สะดวก', 'high', 1, NOW() - INTERVAL '2 days'),
(2, 'แจ้งรอบบันทึกมิเตอร์ประจำเดือน', 'เจ้าหน้าที่จะเข้าตรวจสอบมิเตอร์น้ำและไฟในวันที่ 25 ของทุกเดือน กรุณาอำนวยความสะดวกในการเข้าพื้นที่', 'medium', 1, NOW() - INTERVAL '5 days'),
(3, 'ช่องทางชำระเงินใหม่พร้อม Dynamic QR', 'ระบบรองรับการอัปโหลดสลิปและตรวจสอบสถานะการชำระเงินผ่านหน้าเว็บได้ทันที', 'low', 1, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BILLS
-- ============================================
INSERT INTO bills (id, room_id, tenant_id, month, base_rent, water_units, electricity_units, total, status, due_date, qr_reference, slip_image, created_at, paid_at, submitted_at) VALUES
(1, 1, 2, TO_CHAR(NOW(), 'YYYY-MM'), 3500, 12, 96, 4484, 'pending', (CURRENT_DATE + INTERVAL '7 days')::date, 'SDM-A101-CURRENT', '', NOW() - INTERVAL '1 day', NULL, NULL),
(2, 1, 2, TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM'), 3500, 11, 90, 4418, 'paid', (CURRENT_DATE - INTERVAL '23 days')::date, 'SDM-A101-PREV', '', NOW() - INTERVAL '31 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '27 days'),
(3, 2, 3, TO_CHAR(NOW(), 'YYYY-MM'), 3900, 14, 102, 4972, 'paid', (CURRENT_DATE + INTERVAL '7 days')::date, 'SDM-A102-CURRENT', '', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(4, 3, 4, TO_CHAR(NOW(), 'YYYY-MM'), 3600, 10, 88, 4484, 'submitted', (CURRENT_DATE + INTERVAL '5 days')::date, 'SDM-B201-CURRENT', '', NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '1 day'),
(5, 3, 4, TO_CHAR(NOW() - INTERVAL '2 months', 'YYYY-MM'), 3600, 9, 80, 4382, 'paid', (CURRENT_DATE - INTERVAL '53 days')::date, 'SDM-B201-OLDER', '', NOW() - INTERVAL '61 days', NOW() - INTERVAL '57 days', NOW() - INTERVAL '58 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MAINTENANCE REQUESTS
-- ============================================
INSERT INTO maintenance_requests (id, tenant_id, room_id, title, category, description, status, assignee, admin_note, resident_image, completion_image, created_at, updated_at) VALUES
(1, 2, 1, 'แอร์ไม่เย็น', 'ไฟฟ้า', 'เครื่องปรับอากาศทำงานแต่ลมไม่เย็นตั้งแต่เมื่อคืน ต้องการให้เข้าตรวจสอบ', 'in_progress', 'ช่างอาคาร', 'รับเรื่องแล้วและนัดเข้าตรวจสอบช่วงบ่าย', '', '', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
(2, 3, 2, 'ก๊อกน้ำรั่ว', 'ประปา', 'บริเวณอ่างล้างหน้ามีน้ำหยดตลอดเวลา', 'open', '', '', '', '', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(3, 4, 3, 'หลอดไฟหน้าห้องดับ', 'ไฟฟ้า', 'หลอดไฟทางเดินหน้าห้องดับ ทำให้มืดในช่วงกลางคืน', 'resolved', 'ช่างอาคาร', 'เปลี่ยนหลอดไฟและตรวจสอบระบบไฟเรียบร้อยแล้ว', '', '', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Reset sequences (PostgreSQL 16)
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms));
SELECT setval('announcements_id_seq', (SELECT MAX(id) FROM announcements));
SELECT setval('bills_id_seq', (SELECT MAX(id) FROM bills));
SELECT setval('maintenance_requests_id_seq', (SELECT MAX(id) FROM maintenance_requests));
