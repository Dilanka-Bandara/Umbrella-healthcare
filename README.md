# ☂️ Umbrella Healthcare

> **An Enterprise-Grade Telehealth & Digital Pharmacy Platform**

Umbrella Healthcare is a comprehensive, industry-level HealthTech platform that bridges the gap between digital pharmacy e-commerce and secure telemedicine. Designed to modern enterprise standards, this platform handles complex state management, role-based routing, and a highly normalized database architecture.

![Umbrella Healthcare Cover](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80) 
*(Note: Replace this placeholder image URL with an actual screenshot of your beautiful storefront!)*

---

## 🚀 Core Architecture & Features

* **🛒 Unified Smart Cart Engine:** Engineered a global state management system (Context API) that seamlessly merges Doctor-Authorized Prescriptions (Rx) with Over-The-Counter (OTC) storefront items into a single, intelligent checkout flow.
* **💊 Dynamic Storefront & CDN Integration:** Built a product catalog with dynamic category filtering (Prescriptions, Skincare, Vitamins, OTC). Integrated Cloudinary for high-performance, cloud-based image delivery.
* **🔐 Role-Based Access Control (RBAC):** Designed independent, secure portal layouts tailored for **Patients**, **Verified Doctors**, and **Platform Administrators**.
* **📋 Advanced Prescription Staging:** Implemented rigorous logic for Rx items, including max-allowance tracking, dynamic quantity staging, and token expiration warnings for strict medical compliance.
* **🌓 Premium UI/UX:** Developed a fully responsive interface using Tailwind CSS, featuring persistent Dark/Light mode toggles, live cart notification badges, and modern micro-interactions.
* **🗄️ Relational Database Design:** Structured a robust PostgreSQL schema to manage users, inventory, encrypted medical records, consultations, and order fulfillment.

---

## 🛠 Tech Stack

### Frontend
* **Framework:** React.js powered by Vite
* **Styling:** Tailwind CSS
* **State Management:** React Context API
* **Routing:** React Router v6
* **Icons:** Lucide-React

### Backend & Database
* **Server:** Node.js & Express.js
* **Database:** PostgreSQL
* **Image Delivery (CDN):** Cloudinary

---

## 📂 Project Structure

```text
umbrella-healthcare/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI elements (Navbar, Buttons)
│   │   ├── context/         # Global State (CartContext, AuthContext)
│   │   ├── layouts/         # Layout Wrappers (Public, App, Pharmacy)
│   │   ├── pages/           # Core Views (Shop, Cart, Dashboards)
│   │   └── App.jsx          # Main Router & Provider Tree
├── backend/
│   ├── src/
│   │   ├── config/          # DB & Cloudinary Configuration
│   │   ├── controllers/     # Business Logic (Cart, Orders, Auth)
│   │   ├── middlewares/     # Security & Role Verification
│   │   └── routes/          # RESTful API Endpoints
└── database/
    └── backup.sql           # Complete PostgreSQL Schema & Seed Data
