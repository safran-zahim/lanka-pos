# Software Requirements Specification (SRS)
## Lanka POS System

## 1. Introduction
### 1.1 Purpose
This document defines the software requirements for the Lanka POS system. It describes the system's scope, features, functional requirements, and non-functional requirements for business stakeholders.

### 1.2 Scope
Lanka POS is a point-of-sale system that includes a web client and a backend API. It supports sales transactions, inventory management, customer management, staff roles, and subscription status checks. It can run locally using SQLite for the backend and IndexedDB for offline/demo data, or against a hosted PostgreSQL database in production.

### 1.3 Definitions, Acronyms, and Abbreviations
- POS: Point of Sale
- Admin: Staff role with management permissions
- Manager: Staff role with limited management permissions
- Cashier: Staff role focused on sales
- Super Admin: Highest role, used to manage plans and access admin features

### 1.4 References
- README.md
- DATA_MANAGEMENT.md
- CREDENTIALS.md

### 1.5 Overview
This SRS presents the system overview, requirements, and constraints for Lanka POS.

## 2. Overall Description
### 2.1 Product Perspective
Lanka POS is a client-server application:
- Frontend: Vite + React UI
- Backend: Node.js + Express API
- Database: Prisma ORM
  - Local dev: SQLite
  - Production: PostgreSQL

### 2.2 Product Functions (High Level)
- User login and role-based access
- Sales processing (sale/return/parked)
- Product and inventory management
- Customer management and loyalty points
- Reporting and transaction history
- Staff management
- Subscription plan and status handling
- Local demo/offline capability for basic use

### 2.3 User Classes and Characteristics
- Super Admin: Full access including subscription plan views
- Admin: Full operational access for dashboard and settings
- Manager: Operational access with limited admin controls
- Cashier: POS sales workflows only

### 2.4 Operating Environment
- Windows desktop (local run)
- Node.js runtime
- Modern browser (Chrome/Edge)

### 2.5 Design and Implementation Constraints
- Uses Prisma schemas for DB structure
- Local environment uses SQLite file database
- Frontend uses IndexedDB for local demo data

### 2.6 User Documentation
- LOCAL_SETUP.md
- DESKTOP_APP_GUIDE.md
- DATA_MANAGEMENT.md

### 2.7 Assumptions and Dependencies
- Node.js and npm installed
- Database access available (SQLite local or PostgreSQL in production)
- Network access between frontend and backend when running separately

## 3. Functional Requirements

### 3.1 Authentication
- FR-1: The system shall allow staff to log in using username and password.
- FR-2: The system shall issue a JWT token for valid backend logins.
- FR-3: The system shall restrict access based on staff role.

### 3.2 Sales and POS
- FR-4: The system shall allow cashiers to create sales transactions.
- FR-5: The system shall support returns and voided sales.
- FR-6: The system shall store sale items, quantities, and prices.
- FR-7: The system shall compute tax, discount, and totals.

### 3.3 Product and Inventory
- FR-8: The system shall allow creating and updating products.
- FR-9: The system shall track stock levels and minimum stock alerts.
- FR-10: The system shall allow product categorization and units.

### 3.4 Customer Management
- FR-11: The system shall allow creating and updating customers.
- FR-12: The system shall store customer contact details.
- FR-13: The system shall track customer points and total spend.

### 3.5 Staff Management
- FR-14: The system shall allow admins to create and manage staff accounts.
- FR-15: The system shall store staff roles and credentials.

### 3.6 Reports and History
- FR-16: The system shall provide transaction history views.
- FR-17: The system shall provide sales summaries and performance data.

### 3.7 Subscription Handling
- FR-18: The system shall store the current subscription plan and status.
- FR-19: The system shall expose subscription status to the frontend after login.

### 3.8 Local Demo/Offline Mode
- FR-20: The system shall support local demo credentials stored in IndexedDB.
- FR-21: The system shall allow POS workflows with local demo data.

## 4. Non-Functional Requirements

### 4.1 Performance
- NFR-1: The system shall respond to login requests within 2 seconds under normal load.
- NFR-2: The POS UI shall remain responsive during sales processing.

### 4.2 Security
- NFR-3: Passwords should be stored securely (hashing required in production).
- NFR-4: JWT tokens should be validated for protected endpoints.

### 4.3 Reliability and Availability
- NFR-5: The system shall be able to run offline in local demo mode.
- NFR-6: The system shall handle database connection failures gracefully.

### 4.4 Usability
- NFR-7: The POS interface shall be usable on standard desktop resolutions.
- NFR-8: The login flow shall provide clear error feedback.

### 4.5 Maintainability
- NFR-9: The system shall separate backend and frontend concerns.
- NFR-10: The system shall be configurable via environment variables.

## 5. External Interface Requirements

### 5.1 User Interfaces
- POS UI for sales and checkout
- Admin dashboard for configuration and management
- Login screen

### 5.2 Software Interfaces
- REST API endpoints for auth, products, sales, customers, categories, staff, and subscription

## 6. Future Enhancements (Optional)
- Role-based permission matrix
- Password reset workflow
- Advanced reporting and analytics
- Multi-location inventory

## 7. Approval
- Business owner approval
- Technical lead approval
