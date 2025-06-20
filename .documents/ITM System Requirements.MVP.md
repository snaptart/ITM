# **Ice Time Management System Requirements Document**

## **1\. Introduction & Project Goals**

This document outlines the core requirements for an Ice Time Management System, designed to streamline the allocation, booking, and management of ice time for arenas and skating programs. The primary goal is to transform the current manual, spreadsheet-based processes into an efficient, digital platform, eliminating double-bookings, reducing administrative overhead, and providing a single source of truth for all stakeholders.

**Key Goals (from "Transforming Ice Time Management: From Spreadsheets to Smart Solutions" document):**

* **Efficiency:** Save administrative time (10+ hours/week) and reduce phone/email tag.  
* **Accuracy:** Eliminate double-bookings and scheduling conflicts.  
* **Transparency:** Provide real-time schedule visibility to approved programs.  
* **Control:** Maintain arena control over ice time visibility, pricing, allocation rules, and notifications.  
* **Streamlined Confirmation:** Enable one-click confirmations and automatic notifications.  
* **Revenue Optimization:** Facilitate faster payments and return unbooked time to control immediately.

## **2\. Core Modules & User Roles**

The system will primarily support the following modules and user roles:

* **System Administrator:** Manages overall system configuration, user types, and global settings.  
* **Facility Administrator:** Manages specific facility details, ice surfaces, and ice time availability.  
* **User (Program/Team):** Views allocated ice time, confirms selections, and manages program-specific details.  
* **Public (Guest/Unregistered User):** May have limited view access or registration capabilities.

## **3\. High-Level Requirements & Phased Approach**

### **Phase 1: Foundation (Core Data & Basic Scheduling)**

This phase focuses on establishing the essential data structures and the most critical functionalities for both frontend display and backend data management.

#### **3.1. User & Access Management (Registration & Permissions)**

* **REQ-UM-001: User Registration:**  
  * The system shall allow new users (e.g., program representatives, facility staff) to register.  
  * Registration shall require basic contact information (name, email, phone).  
  * Registration shall support different user types (e.g., Facility Admin, Program User).  
  * The system shall support email verification for new registrations.  
* **REQ-UM-002: User Authentication:**  
  * The system shall allow registered users to log in securely.  
  * The system shall support password reset functionality.  
* **REQ-UM-003: User Roles & Permissions:**  
  * The system shall define distinct user roles (e.g., System Admin, Facility Admin, Program User).  
  * The system shall enforce permissions based on user roles (e.g., only Facility Admins can manage a facility's ice time).  
* **REQ-UM-004: User Profile Management:**  
  * Users shall be able to view and update their profile information.

#### **3.2. Facility & Ice Surface Management (Facility Administration)**

* **REQ-FM-001: Facility Creation/Management:**  
  * The system shall allow System Admins to create and manage facility profiles (name, address, contact).  
* **REQ-FM-002: Ice Surface Definition:**  
  * The system shall allow Facility Admins to define and manage individual ice surfaces within a facility (name, dimensions, type).

#### **3.3. Ice Time Calendar & Availability (Calendar Administration)**

* **REQ-CAL-001: Ice Time Upload/Input:**  
  * The system shall allow Facility Admins to upload or manually input available ice time slots for specific ice surfaces.  
  * Ice time entries shall include date, start time, end time, and associated ice surface.  
  * The system shall support recurring ice time entries (e.g., same time every week).  
* **REQ-CAL-002: Calendar View (Admin):**  
  * Facility Admins shall have a calendar view to see all available and booked ice time for their facilities.  
  * The calendar shall allow filtering by ice surface, date range, and status.  
* **REQ-CAL-003: Calendar View (Program User):**  
  * Program Users shall have a read-only calendar view showing their *allocated* ice time.  
  * The system shall visually distinguish between confirmed and unconfirmed allocations.

#### **3.4. Basic Ice Time Allocation & Confirmation (Sheet1 & Notifications)**

* **REQ-ALL-001: Program Allocation:**  
  * The system shall allow Facility Admins to allocate specific ice time slots to approved programs.  
  * Allocation shall link an ice time slot to a specific program/user.  
* **REQ-ALL-002: Program Confirmation:**  
  * Program Users shall be able to view allocated ice time and confirm their selections with one click.  
  * Upon confirmation, the system shall mark the slot as "confirmed."  
* **REQ-NOTIF-001: Basic Notifications:**  
  * The system shall automatically send notifications to Program Users upon ice time allocation.  
  * The system shall automatically send notifications to Facility Admins upon a Program User's confirmation.  
  * Notifications shall be sent via email (SMS as future enhancement).

### **Phase 2: Enhancements & Advanced Features (Future Iterations)**

These requirements represent features that would be built upon the Phase 1 foundation, enhancing functionality and user experience.

#### **3.5. Business Rules & Pricing**

* **REQ-BR-001: Pricing Rules:** The system shall allow Facility Admins to define pricing per ice time slot, per hour, or based on time of day/week.  
* **REQ-BR-002: Allocation Rules:** The system shall support customizable allocation rules (e.g., priority for certain programs).  
* **REQ-BR-003: Unbooked Time Management:** The system shall automatically return unconfirmed or unbooked ice time to the general pool after a defined period.

#### **3.6. Payments**

* **REQ-PAY-001: Payment Tracking:** The system shall track the payment status of confirmed ice time allocations.  
* **REQ-PAY-002: Payment Integration (Future):** Integration with online payment gateways.

#### **3.7. User Interface (Detailed UI/UX)**

* **REQ-UI-001: Responsive Design:** The web application shall be fully responsive and optimized for desktop, tablet, and mobile devices.  
* **REQ-UI-002: Intuitive Navigation:** The system shall have clear and intuitive navigation for all user roles.  
* **REQ-UI-003: Data Visualization:** Calendar views shall be clear, color-coded, and easy to interpret.

#### **3.8. System Administration (Advanced)**

* **REQ-SYS-001: Audit Trails:** The system shall log significant actions (e.g., ice time modifications, user changes).  
* **REQ-SYS-002: Configuration Management:** System Admins can configure global settings (e.g., notification templates).

#### **3.9. Reporting & Analytics**

* **REQ-REP-001: Basic Reports:** The system shall generate basic reports on ice time utilization, confirmed bookings, and potential revenue.

#### **3.10. Document Management & Notes**

* **REQ-DOC-001: Document Upload/Linking:** Ability to attach relevant documents (e.g., contracts) to programs or allocations.  
* **REQ-NOTES-001: Internal Notes:** Ability for staff to add private notes to facility, program, or specific booking records.

## **4\. Non-Functional Requirements**

* **Performance:** The system shall load calendar views and data quickly, with a target response time of under 2 seconds for typical operations.  
* **Security:** All sensitive data (user information, payment details) shall be encrypted both in transit and at rest. The system shall adhere to industry best practices for web application security (e.g., OWASP Top 10). Role-based access control must be strictly enforced.  
* **Scalability:** The architecture shall support scaling to accommodate multiple facilities, thousands of ice surfaces, and a large number of concurrent users.  
* **Reliability:** The system shall have high availability, with minimal downtime. Data integrity and backup mechanisms are crucial.  
* **Maintainability:** The codebase shall be modular, well-documented, and easy to maintain and extend.  
* **Usability:** The UI/UX shall be clean, intuitive, and minimize the learning curve for new users.  
* **Error Handling:** The system shall provide clear and informative error messages to users and robust logging for developers.

This phased approach will allow for the development of a robust core system, with subsequent iterations adding more advanced features based on user feedback and evolving business needs.