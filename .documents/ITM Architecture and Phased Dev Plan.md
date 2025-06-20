# **Ice Time Management System: Architecture and Phased Development Plan**

This document describes the architectural design pattern and a phased development approach for the Ice Time Management System, utilizing HTML, CSS, JavaScript for the frontend and PHP with MySQL for the backend.

## **1\. Architectural Design Pattern: Model-View-Controller (MVC)**

The Model-View-Controller (MVC) pattern is an industry-standard architectural pattern that separates an application into three main logical components: the Model, the View, and the Controller. This separation helps in managing complexity, improving code organization, and making the application more maintainable and scalable.

### **1.1. Components of MVC**

* **Model:**  
  * **What it is:** Represents the core business logic and data. It directly manages the data, logic, and rules of the application. The Model receives requests from the Controller, processes them, and updates its state (data). It then notifies the View of any data changes.  
  * **In this system:** This will primarily reside on the **PHP backend** and interact with the **MySQL database**.  
    * **PHP Classes:** Represents entities like User, Facility, IceSurface, IceTimeSlot, Program, Allocation. These classes will handle data validation, business rules (e.g., preventing double bookings), and interactions with the database.  
    * **MySQL Database:** Stores all persistent data related to users, facilities, ice surfaces, ice time availability, allocations, notifications, etc. (as per REQ-FM-001, REQ-CAL-001, etc.).  
    * **API Logic:** The Model will expose methods that the Controller can call to retrieve or manipulate data.  
* **View:**  
  * **What it is:** Responsible for displaying the data to the user. It presents the information from the Model in a user-friendly format. The View does not contain any business logic; it simply renders what the Model provides.  
  * **In this system:** This will be handled by the **HTML and CSS** on the **frontend**.  
    * **HTML Structure:** Defines the layout and elements of the web pages (e.g., login forms, dashboards, calendar grids, facility details). In a Single-Page Application (SPA), there will typically be one main HTML file, and content will be dynamically loaded into it.  
    * **CSS Styling:** Styles the HTML elements to create a visually appealing and responsive user interface (as per REQ-UI-001, REQ-UI-003).  
    * **JavaScript (for dynamic rendering):** JS plays a crucial role in a SPA, dynamically rendering and updating content within the single HTML page based on data fetched from the backend.  
* **Controller:**  
  * **What it is:** Acts as an intermediary between the Model and the View. It receives user input from the View, processes it (often by calling methods on the Model), and then updates the View based on the Model's response. The Controller contains the application flow logic.  
  * **In this system:** This will be split between the **PHP backend** and **JavaScript frontend**.  
    * **PHP Backend Controllers:** These will be the primary entry points for API requests from the frontend.  
      * They receive HTTP requests (GET, POST, PUT, DELETE).  
      * They validate input.  
      * They interact with the appropriate Model classes to perform operations (e.g., UserController handles user login, IceTimeController handles booking requests).  
      * They prepare data and send JSON responses back to the frontend.  
    * **JavaScript Frontend Controllers/Handlers:** These handle user interactions within the browser and manage the SPA's dynamic content updates.  
      * They capture user input (button clicks, form submissions).  
      * They manage client-side routing, deciding which "view" or content section to display.  
      * They make Asynchronous JavaScript and XML (AJAX) calls (using fetch or XMLHttpRequest) to the PHP backend APIs to retrieve or send data.  
      * They receive JSON responses from the backend.  
      * They dynamically update the View (the single HTML page) based on the received data, *without requiring a full page reload* (e.g., re-rendering a calendar after a booking, displaying new content sections).

### **1.2. Flow of a Request in a Single-Page Application (SPA) with MVC**

1. **Initial Page Load:** The browser loads a single HTML file (e.g., index.html) along with its associated CSS and JavaScript.  
2. **User Interaction (View):** A user interacts with an element on the currently displayed content (e.g., clicks a navigation link for "My Facilities," or submits a "Book" button on the calendar).  
3. **Frontend Controller (JavaScript):** The JavaScript code captures this event.  
   * If it's a navigation event, it updates the browser's history API and dynamically loads the relevant content into the main HTML container.  
   * If it's a data-related action (e.g., booking), it makes an AJAX request to a specific endpoint on the PHP backend (e.g., /api/book-ice-time).  
4. **Backend Controller (PHP):** The PHP Controller receives the request, extracts the necessary data (e.g., ice slot ID, user ID).  
5. **Backend Model (PHP & MySQL):** The Controller calls a method on the relevant Model (e.g., IceTimeModel-\>bookSlot()). The Model interacts with the MySQL database to update the record and apply any business rules.  
6. **Backend Controller (PHP):** The Model returns the result (success/failure, updated data) to the Controller. The Controller then formats a JSON response.  
7. **Frontend Controller (JavaScript):** The JavaScript receives the JSON response.  
8. **View Update (JavaScript & HTML/CSS):** Based on the response, the JavaScript dynamically updates only the necessary parts of the HTML and CSS of the *current page* (e.g., changes the color of the booked slot, displays a success message, refreshes a Datatables grid) without a full page refresh.

### **1.3. Frontend Architecture Concepts**

To achieve modularity and efficiency, especially for CRUD operations and the calendar, the frontend will employ specific design patterns:

* **Single-Page Application (SPA) Architecture:**  
  * The entire application will load as a single HTML page. All subsequent content and state changes will be handled dynamically via JavaScript, communicating with the backend APIs. This provides a smoother, more fluid user experience akin to a desktop application.  
  * Client-side routing will manage the perceived "pages" or views within this single HTML document.  
* **User Interface Layout (4-Section Dynamic Layout):**  
  * The SPA will feature a consistent 4-section layout:  
    * **Header:** Located at the top, typically containing the application title, user profile quick links, and global actions.  
    * **Sidebar:** Positioned on the left, providing primary navigation links based on user roles and frequently accessed features.  
    * **Footer:** Located at the bottom, typically displaying copyright information, quick links to legal notices, or versioning.  
    * **Main Content Area:** The central and largest section, where all dynamic content (e.g., calendar views, CRUD tables, forms, reports) will be loaded and displayed.  
  * **Toggable Visibility:** The Header, Sidebar, and Footer sections shall have user-toggleable visibility controls (e.g., a "collapse sidebar" button, or settings to hide/show footer) to maximize screen real estate for the Main Content Area, especially useful on smaller screens or for detailed work. This state should persist (e.g., using local storage).  
* **Frontend CRUD Factory:**  
  * This factory approach will be used to generate standard CRUD (Create, Read, Update, Delete) interfaces for various entities (e.g., Users, Facilities, Ice Surfaces, Programs).  
  * It will leverage a **configuration-driven approach**, where a simple JSON configuration defines the fields, validation rules, and API endpoints for each entity.  
  * The factory will dynamically render forms for creation/editing, and tables for displaying lists of entities, all within the main SPA container. This significantly reduces repetitive code for common administration tasks.  
  * Adding a new CRUD page will primarily involve updating a configuration file, not writing extensive new HTML and JavaScript.  
  * **Datatables.net** will be integrated with this factory to provide powerful, interactive tables for displaying entity lists, including features like searching, sorting, and pagination.  
* **Modular Frontend Calendar Code:**  
  * The core calendar visualization will be handled by **FullCalendar.io**, ensuring a consistent and feature-rich calendar experience across different user roles.  
  * The calendar component will be designed to be modular, meaning its appearance (fullcalendar.io library) will be the same, but its content and interactivity will be dynamically loaded and controlled based on:  
    * **User Role and Permissions:** Only relevant ice time slots and actions will be visible/executable for the logged-in user (e.g., Facility Admins see all slots and can modify; Program Users only see their allocated slots and can confirm).  
    * **Business Rules:** Backend APIs will provide data filtered by business rules (e.g., unconfirmed slots available to other users after a deadline).  
    * **API Data Sources:** The calendar will fetch its events (ice time slots) from specific backend API endpoints, which will deliver the data tailored to the requesting user's context.

## **2\. Phased Development Approach**

This phased approach aligns with the requirements document and emphasizes building a solid foundation before adding more complex features.

### **Phase 1: Foundation (Core Data, User Management & Basic Calendar)**

**Goal:** Establish the fundamental backend services (APIs and database schema) and core frontend UI for user management, facility/ice surface definition, and basic ice time allocation/confirmation, all within a SPA framework.

#### **1\. Backend Development (PHP & MySQL)**

* **Database Schema Design:**  
  * users table (for REQ-UM-001, REQ-UM-003: user\_id, username, email, password\_hash, role\_id, program\_id, etc.)  
  * roles table (for REQ-UM-003: role\_id, role\_name, permissions)  
  * facilities table (for REQ-FM-001: facility\_id, name, address, contact\_info)  
  * ice\_surfaces table (for REQ-FM-002: ice\_surface\_id, facility\_id, name, dimensions, type)  
  * ice\_time\_slots table (for REQ-CAL-001: slot\_id, ice\_surface\_id, start\_time, end\_time, status \- e.g., 'available', 'allocated', 'confirmed')  
  * allocations table (for REQ-ALL-001: allocation\_id, slot\_id, program\_id, status \- 'pending', 'confirmed')  
  * programs table (for REQ-ALL-001: program\_id, name, contact\_info, associated\_user\_id)  
* **API Endpoints & Controllers (PHP):**  
  * **User Management API:**  
    * POST /api/register (REQ-UM-001)  
    * POST /api/login (REQ-UM-002)  
    * POST /api/password-reset (REQ-UM-002)  
    * GET /api/users/{id}, PUT /api/users/{id} (REQ-UM-004)  
    * GET /api/roles, PUT /api/roles/{id} (for System Admin \- REQ-UM-003)  
  * **Facility & Ice Surface Management API:**  
    * POST /api/facilities, GET /api/facilities, PUT /api/facilities/{id}, DELETE /api/facilities/{id} (for System/Facility Admin \- REQ-FM-001)  
    * POST /api/ice-surfaces, GET /api/ice-surfaces, PUT /api/ice-surfaces/{id}, DELETE /api/ice-surfaces/{id} (for Facility Admin \- REQ-FM-002)  
  * **Ice Time Calendar API:**  
    * POST /api/ice-time-slots (for Facility Admin \- REQ-CAL-001)  
    * GET /api/ice-time-slots?facilityId={id}\&date={date} (for Admin & Program Users \- REQ-CAL-002, REQ-CAL-003) \- This endpoint will be designed to filter results based on user permissions and the type of calendar view requested.  
  * **Allocation & Confirmation API:**  
    * POST /api/allocate-ice-time (for Facility Admin \- REQ-ALL-001)  
    * POST /api/confirm-allocation (for Program User \- REQ-ALL-002)  
* **Authentication & Authorization (PHP):** Implement secure session management or token-based authentication. Middleware to check user roles and permissions for each API endpoint (REQ-UM-003, REQ-SEC-001).  
* **Email Notification Service (PHP):** Basic functionality to send emails (REQ-NOTIF-001).

#### **1.2. Frontend Development (HTML, CSS, JavaScript)**

* **Single-Page Application Structure:**  
  * A single index.html file that serves as the entry point.  
  * A main content area (\<div id="app-content"\>) where all dynamic content will be loaded.  
  * A JavaScript-based router to manage views and history within the SPA.  
* **Layout Implementation:**  
  * Create the HTML structure for the Header, Sidebar, Footer, and Main Content Area within index.html.  
  * Apply initial Tailwind CSS for the layout (e.g., using flex or grid for the overall page structure).  
  * Implement JavaScript functions to toggle the visibility of the Header, Sidebar, and Footer.  
  * Add controls (e.g., buttons/icons) to trigger these toggles in the UI.  
  * Use local storage to persist the visibility state across sessions.  
* **Login & Registration Views:**  
  * HTML forms dynamically loaded into the main content area for user registration (REQ-UM-001) and login (REQ-UM-002).  
  * Basic CSS for styling.  
  * JavaScript to handle form submissions and send data to backend APIs, display success/error messages within the SPA.  
* **User Dashboard Views:**  
  * HTML layouts dynamically loaded for various dashboards based on user role.  
  * Navigation will be handled by the SPA router, potentially residing in the Sidebar.  
  * User profile view/edit form (REQ-UM-004) will be a dynamically loaded view.  
* **Admin Dashboards (Facility & System Admins):**  
  * Views will integrate the **Frontend CRUD Factory** for managing Users, Facilities, Ice Surfaces, Programs.  
  * These views will display data using **Datatables.net** for sortable, searchable lists of entities, dynamically updated via AJAX.  
  * Forms for creating/editing records will be dynamically generated by the CRUD factory based on configuration, appearing as modals or inline within the SPA view.  
  * JavaScript will manage the CRUD factory, fetching data from backend APIs and handling form submissions, updating the Datatables instances without full page reloads.  
* **Ice Time Calendar Views:**  
  * **For Facility Admin:** A view integrating **FullCalendar.io**. JavaScript to initialize FullCalendar, fetching all ice time slots for a selected facility and date range from the backend API (REQ-CAL-002). FullCalendar's event rendering will visually distinguish available, allocated, and confirmed slots. Modals/forms to add/edit ice time slots (REQ-CAL-001) will be triggered from calendar interactions, and updates will dynamically refresh the calendar.  
  * **For Program User:** A view integrating **FullCalendar.io**. JavaScript to initialize FullCalendar, fetching *allocated* ice time for the logged-in program from a *permission-aware* backend API endpoint (REQ-CAL-003). "Confirm" button/link for pending allocations (REQ-ALL-002) will be integrated directly into calendar event displays, with updates dynamically refreshing the calendar view.  
* **Basic UI/UX:** Apply responsive design principles using CSS. Ensure clear navigation and intuitive elements (REQ-UI-001, REQ-UI-002), all within the single-page experience.

### **Phase 2: Enhancements & Advanced Features**

**Goal:** Implement more complex business logic, improve user experience, and add additional modules within the SPA framework.

#### **2.1. Backend Development (PHP & MySQL)**

* **Business Rules Implementation:**  
  * Pricing logic for ice time slots (REQ-BR-001).  
  * Advanced allocation rules (REQ-BR-002).  
  * Automated unbooked time management (REQ-BR-003).  
* **Payment Tracking:**  
  * Add payment\_status to allocation table (REQ-PAY-001).  
  * API endpoints for updating payment status.  
* **Audit Trails:** Implement logging for key actions (e.g., booking, modification, cancellation) (REQ-SYS-001).  
* **Enhanced Notifications:** Extend notification service to include SMS (if desired) and customizable templates (REQ-NOTIF-001, REQ-SYS-002).  
* **Reporting Data Aggregation:** Backend logic to aggregate data for reports (REQ-REP-001).  
* **Document Management Backend:** APIs for uploading and linking documents (REQ-DOC-001).

#### **2.2. Frontend Development (HTML, CSS, JavaScript)**

* **Calendar Enhancements:**  
  * Advanced filtering options for calendar views (REQ-CAL-002, REQ-CAL-003) will be integrated with the **FullCalendar.io** component, dynamically updating the events displayed through AJAX calls to the backend.  
  * Color-coding for different statuses (confirmed, pending, unbooked) (REQ-UI-003) will be configured within FullCalendar's event rendering.  
  * Consider drag-and-drop functionality for ice time allocation (REQ-ALL-001) will be implemented using FullCalendar's event interaction capabilities, sending updates via AJAX.  
* **Pricing & Allocation Views:**  
  * Interfaces for Facility Admins to define pricing rules (REQ-BR-001) will utilize the **Frontend CRUD Factory** for configuration, with changes dynamically updated.  
  * UI for setting and applying allocation rules (REQ-BR-002) will similarly benefit from the CRUD factory's dynamic form generation.  
* **Payment Tracking Views:** Display payment status on allocation views (REQ-PAY-001), potentially using **Datatables.net** for lists of allocations, all within the SPA.  
* **Reporting Interface:**  
  * Views to display basic reports on utilization, bookings, revenue (REQ-REP-001).  
  * JavaScript to fetch report data from backend APIs and render charts/tables, extensively using **Datatables.net** for tabular reports, ensuring dynamic updates.  
* **Document Management Views:** Interface for uploading and managing documents (REQ-DOC-001), possibly integrated into entity-specific CRUD forms generated by the factory.  
* **Notes Management Views:** UI for adding and viewing internal notes (REQ-NOTES-001), also potentially integrated with CRUD factory forms, dynamically updated.

### **Phase 3: Optimization & Integrations**

**Goal:** Refine performance, enhance security, and integrate with external systems, while maintaining the SPA experience.

#### **3.1. Backend Development (PHP & MySQL)**

* **Performance Optimization:** Database indexing, query optimization, caching strategies.  
* **Security Hardening:** Advanced input sanitization, output encoding, rate limiting, and protection against common web vulnerabilities.  
* **Payment Gateway Integration:** Implement secure integration with a chosen online payment gateway (e.g., Stripe, PayPal) (REQ-PAY-002), with frontend elements initiating transactions via AJAX.  
* **External Calendar Integration:** API hooks for syncing with external calendar systems (e.g., Google Calendar, Outlook Calendar).

#### **3.2. Frontend Development (HTML, CSS, JavaScript)**

* **Advanced UI/UX Polishing:** Further refinement of the user interface for a seamless experience, including smooth transitions between dynamically loaded views.  
* **Error Handling & User Feedback:** Comprehensive client-side validation and user-friendly error messages, integrated with the CRUD factory and calendar components, presented non-disruptively within the SPA.  
* **Accessibility Improvements:** Ensure the application is usable by individuals with disabilities.

## **3\. Benefits of this Approach**

* **Modularity:** The clear separation of concerns in MVC, combined with the frontend CRUD factory and modular calendar, allows different team members to work on different parts of the application simultaneously, reducing conflicts and improving development speed.  
* **Efficiency:** Reusable Model components and well-defined Controller APIs streamline backend development. The **Frontend CRUD Factory** drastically reduces repetitive code for administrative interfaces, while the **Modular Calendar** provides a consistent, adaptable display. The SPA architecture eliminates full page reloads, improving perceived performance.  
* **Maintainability:** Code is easier to understand, debug, and update due to its organized structure and the use of well-known libraries like datatables.net and fullcalendar.io.  
* **Scalability:** Each component can be scaled independently if needed.  
* **Testability:** The separation allows for easier unit testing of individual components (Model logic, Controller logic, and frontend components).  
* **Phased Delivery:** Allows for iterative development and deployment, providing early value to stakeholders and gathering feedback for subsequent phases.  
* **Enhanced User Experience (SPA):** Provides a more fluid, responsive, and app-like experience by avoiding full page reloads, making interactions feel faster and more seamless.

This structured approach will ensure that the Ice Time Management System is built on a robust foundation, capable of growing and adapting to future needs while maintaining high performance and security standards.