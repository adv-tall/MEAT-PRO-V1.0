# System Context & Requirement
คุณคือ Senior Full-Stack Developer ที่เชี่ยวชาญ React (Vite), Tailwind CSS, Framer Motion และการเชื่อมต่อกับ Google Apps Script (Backend)
โปรเจคนี้คือระบบ B2B Internal Web Application (Single Tenant: 1 โปรเจค ต่อ 1 ลูกค้า)

## Tech Stack
- Frontend: React 18+ (Vite), TypeScript, Tailwind CSS
- UI/Animation: Framer Motion, lucide-react, react-draggable
- Backend/Database: Google Sheets + Google Apps Script (แยก 1 ชุดต่อ 1 ลูกค้า)
- Deployment: GitHub -> Vercel

## Core Architecture & API Standard
- ระบบไม่มี Database กลาง (No Master Registry) โค้ด Frontend จะฝัง URL ของ Google Apps Script ของลูกค้ารายนั้นๆ ไว้ใน `.env` (เช่น `VITE_APPS_SCRIPT_URL`)
- การสื่อสารกับ Backend (Apps Script) ต้องใช้ HTTP POST โดยส่ง Body เป็น JSON Stringify และตั้งค่า Header `Content-Type: text/plain;charset=utf-8` เพื่อเลี่ยงปัญหา CORS Preflight
- Request Format: `{ "action": "read|write", "sheet": "SheetName", "data": [...] }`
- Response Format: `{ "status": "success|error", "message": "...", "data": [...] }`

## 1. UI & Navigation (Sidebar)
- หน้า Home: เมื่อเข้าเว็บครั้งแรก ทุกคนจะเห็นหน้า Home และ Sidebar ที่มีเมนูทั้งหมด (แต่ยังกดเข้าไปดูข้อมูลไม่ได้ถ้าไม่ Login)
- Sidebar Toggle: มีปุ่มวงกลมสีทองพร้อมไอคอนลูกศรที่ขอบ Sidebar สำหรับพับเก็บ (Collapse) เป็น Mini Sidebar (เห็นแค่ไอคอน) และกางออก (Expand) ได้

## 2. Authentication Flow
- เมื่อคลิกเมนูใดๆ ใน Sidebar ระบบจะเด้งหน้า Login
- Credentials: 
  - Username = STAFF CODE
  - Password = ID CARD NUMBER (13 หลัก)
  - Demo Account = demo / demo

## 3. Authorization & RBAC (Role-Based Access Control)
- Default Permissions (เมนูทั่วไป): เช่น Dashboard, Production Tracking, Warehouse ค่าเริ่มต้นคือ "ทุกคนที่ Login ผ่าน จะเป็นแค่ Viewer (Read-only)" ไม่สามารถ Create/Edit/Verify/Approve ได้จนกว่า Admin จะให้สิทธิ์
- Confidential Modules (เมนูความลับ): เช่น Financial, Cost Control, Quotation, Credit Analysis 
  - ต้องมี "ไอคอนแม่กุญแจสีแดง (🔒)" กำกับที่เมนูและหน้าจัดการสิทธิ์
  - ค่าเริ่มต้นคือ "No Access" (มองไม่เห็นข้อมูลใดๆ)
  - Admin ต้องเป็นผู้ระบุตัวบุคคลและให้สิทธิ์ (Explicit Grant) เท่านั้น
- User Permissions Page: หน้าสำหรับ Admin ใช้กำหนดสิทธิ์ให้พนักงานแต่ละคน (Email/Staff Code) ว่าใครทำ Action อะไรได้บ้าง

## 4. UI Components & Security Features
- Draggable Modal: สร้าง Modal ชื่อ "Environmental Aspect Details" โดยใช้ `react-draggable` + `motion` มีแถบ Header สีดำสำหรับคลิกค้างเพื่อลากย้ายตำแหน่งบนหน้าจอได้
- Watermark: เมื่อ Login สำเร็จ ต้องมีลายน้ำ (ชื่อและรหัสพนักงาน) แสดงจางๆ ทั่วหน้าจอ เพื่อป้องกันการนำข้อมูลไปเผยแพร่
- Anti-Screen Capture: เมื่อหน้าต่างเว็บเสียโฟกัส (window.onblur) หรือมีการกดปุ่ม PrintScreen ให้ใส่ CSS `filter: blur(10px)` ครอบทั้งหน้าจอทันทีเพื่อกันการแคปภาพ

## Task
จงเริ่มต้นสร้างโครงสร้างโปรเจค (Project Structure), Layout หลัก, Sidebar (พับเก็บได้), และหน้า Login ตาม Requirement ด้านบน โดยใช้ Tailwind CSS และ Framer Motion
