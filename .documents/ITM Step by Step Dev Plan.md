# **Ice Time Management System: Step-by-Step Development Plan**

This plan outlines a sequence of tasks for building the Ice Time Management System, ensuring a logical flow from foundational elements to more advanced features within the defined MVC and SPA architecture.

## **Phase 1: Foundation (Core Data, User Management & Basic Calendar)**

**Goal:** Establish the core backend infrastructure, user authentication, fundamental SPA structure, and basic data display for facilities and ice time. This phase also includes foundational elements for future real-time synchronization.

### **1.1 Backend Setup & Core Database (PHP & MySQL)**

* **Task 1.1.1: Database Initialization**  
  * Create ice\_time\_db database in MySQL.  
  * Create users table (user\_id, username, email, password\_hash, role\_id, program\_id, created\_at, updated\_at).  
  * Create roles table (role\_id, role\_name).  
  * Create facilities table (facility\_id, name, address, contact\_info, created\_at, updated\_at).  
  * Create ice\_surfaces table (ice\_surface\_id, facility\_id, name, dimensions, type, created\_at, updated\_at).  
  * Create ice\_time\_slots table (slot\_id, ice\_surface\_id, start\_time, end\_time, status, created\_at, updated\_at).  
  * Create programs table (program\_id, name, contact\_info, user\_id, created\_at, updated\_at).  
  * **Create allocations table (allocation\_id, slot\_id, program\_id, status \- 'pending', 'confirmed', created\_at, updated\_at).** \- This table stores confirmed ice time bookings for programs.  
  * **Add notifications\_log table** (notification\_id, event\_type, entity\_id, payload\_json, created\_at) \- This table will store events triggered by backend actions for SSE broadcasting.  
* **Task 1.1.2: PHP Backend Boilerplate**  
  * Set up basic PHP folder structure (e.g., public/, app/, config/, vendor/).  
  * Create config.php for database connection details.  
  * Implement a simple database connection class/function.  
  * Create base Model.php with generic CRUD methods.  
  * Create base Controller.php for handling API requests and responses (JSON).  
* **Task 1.1.3: User Authentication & Authorization APIs**  
  * Implement User Model class with methods for register, login, findByEmail, findById.  
  * Implement Auth class/methods for password hashing (e.g., password\_hash), session management (or JWT token generation for stateless API).  
  * Create AuthController.php with endpoints:  
    * POST /api/register (REQ-UM-001)  
    * POST /api/login (REQ-UM-002)  
  * Implement basic authorization middleware/logic to protect API routes based on role\_id.  
  * **Integrate notification logging for user-related events (e.g., new user registered) into AuthController and relevant User Model methods.**  
* **Task 1.1.4: Facility & Ice Surface Management APIs**  
  * Implement Facility Model class for managing facilities.  
  * Implement IceSurface Model class for managing ice surfaces.  
  * Create FacilityController.php with endpoints:  
    * GET /api/facilities (all facilities)  
    * GET /api/facilities/{id}  
    * POST /api/facilities (REQ-FM-001)  
    * PUT /api/facilities/{id} (REQ-FM-001)  
    * DELETE /api/facilities/{id} (REQ-FM-001)  
  * Create IceSurfaceController.php with endpoints:  
    * GET /api/ice-surfaces?facilityId={id}  
    * POST /api/ice-surfaces (REQ-FM-002)  
    * PUT /api/ice-surfaces/{id} (REQ-FM-002)  
    * DELETE /api/ice-surfaces/{id} (REQ-FM-002)  
  * **Integrate notification logging for facility and ice surface changes into their respective Controllers and Model methods.**  
* **Task 1.1.5: Ice Time Slot API (Admin View)**  
  * Implement IceTimeSlot Model class.  
  * Create IceTimeController.php with GET /api/ice-time-slots?facilityId={id}\&start={date}\&end={date} endpoint to fetch all slots for a given range (REQ-CAL-002).  
  * Implement POST /api/ice-time-slots for adding new slots (REQ-CAL-001).  
  * **Integrate notification logging for new ice time slots into IceTimeController and IceTimeSlot Model methods.**  
* **Task 1.1.6: Initial SSE Backend Endpoint**  
  * Create a basic SSEController.php with a GET /api/events endpoint.  
  * This endpoint will initially perform a long-polling or basic polling mechanism to check the notifications\_log table for new, unsent events.  
  * Implement logic to send events to connected clients and mark them as sent (or delete after sending for simplicity in development).

### **1.2 Frontend Core & User Flows (HTML, CSS, JavaScript)**

* **Task 1.2.1: SPA Entry Point & Basic Styling**  
  * Create public/index.html with a main \<div id="app-container"\>.  
  * Link basic global CSS (public/css/style.css) and JavaScript (public/js/app.js).  
  * Load Tailwind CSS CDN.  
  * Set up "Inter" font via Google Fonts.  
  * Ensure meta viewport tag is present for responsiveness.  
* **Task 1.2.2: Implement 4-Section Layout**  
  * Within public/index.html, define the HTML structure for the four main sections:  
    * \<header id="app-header"\>  
    * \<aside id="app-sidebar"\>  
    * \<main id="app-content"\> (the dynamic content area)  
    * \<footer id="app-footer"\>  
  * Apply initial Tailwind CSS classes to establish the layout (e.g., using grid or flex for the overall page, and appropriate sizing/positioning for each section).  
  * Implement JavaScript functions in app.js to toggle the visibility of \#app-header, \#app-sidebar, and \#app-footer by adding/removing CSS classes (e.g., hidden or w-0).  
  * Add simple UI controls (e.g., a "hamburger" icon for the sidebar, small buttons for header/footer) to trigger these toggles.  
  * Use localStorage to persist the visibility state of these sections across user sessions.  
* **Task 1.2.3: SPA Router & View Management**  
  * Implement a simple JavaScript router in app.js to manage different "views" (e.g., login, dashboard, admin-facilities).  
  * Create functions to load HTML fragments/templates into \#app-content based on route.  
  * Implement client-side history API for navigation (pushState).  
* **Task 1.2.4: Login & Registration Views**  
  * Create HTML templates/fragments for login and registration forms.  
  * Implement JavaScript to handle form submission, send AJAX requests to PHP /api/register and /api/login endpoints.  
  * Handle success/failure responses (e.g., redirect to dashboard, display error message).  
  * Store authentication token/session indicator client-side securely (e.g., sessionStorage).  
* **Task 1.2.5: Core Dashboard Layouts**  
  * Create a basic authenticated dashboard layout for logged-in users, displayed within the \#app-content.  
  * Dynamically render navigation links based on user role within the \#app-sidebar.  
  * Implement logout functionality, typically in the \#app-header.  
* **Task 1.2.6: Frontend CRUD Factory (Initial Implementation & Form Generation Details)**  
  * Create public/js/crudFactory.js.  
  * Define a JavaScript function/class that takes a **configuration object** for each entity (e.g., entityConfig \= { name: 'users', fields: \[...\], apiEndpoint: '/api/users' }).  
  * This factory should be able to:  
    * Generate an HTML table structure.  
    * Initialize a **Datatables.net** instance on that table, configured to fetch data from the specified apiEndpoint.  
    * **Form Generation Details:** The configuration object for each entity will contain an array of fields, each describing an input element for forms:  
      // Example entityConfig for Users  
      const userConfig \= {  
          name: 'users',  
          apiEndpoint: '/api/users',  
          fields: \[  
              { name: 'username', label: 'Username', type: 'text', required: true },  
              { name: 'email', label: 'Email', type: 'email', required: true },  
              { name: 'password', label: 'Password', type: 'password', required: true, excludeInEdit: true }, // Exclude from edit form  
              { name: 'role\_id', label: 'Role', type: 'select', options: \[\], required: true }, // Options populated dynamically  
              // ... other fields for user entity  
          \],  
          // ... other configurations  
      };

      The crudFactory.js will have a method (e.g., generateForm(entityConfig, data \= {})) that iterates through this fields array to:  
      * Create appropriate HTML input elements (\<input\>, \<select\>, \<textarea\>) based on type.  
      * Set name, id, placeholder, required attributes using field.name, field.label, field.required.  
      * Populate select options if type is 'select' and options array is provided (e.g., fetching roles from /api/roles for role\_id).  
      * Pre-fill form fields with data if editing an existing record.  
      * Attach event listeners for form submission (AJAX POST/PUT to apiEndpoint).  
      * Handle basic client-side validation based on required or type.  
      * The forms will typically be rendered within modals or dedicated sections within the \#app-content.  
  * Load Datatables.net CDN in index.html.  
* **Task 1.2.7: Apply CRUD Factory to User & Facility Admin**  
  * Create public/js/views/userAdminView.js and public/js/views/facilityAdminView.js.  
  * Use the crudFactory to render a list of users for System Admins within \#app-content, including buttons to trigger the crudFactory's form generation for adding/editing users.  
  * Use the crudFactory to render a list of facilities for System Admins within \#app-content, similarly with form generation buttons.  
  * Configure app.js router to load these views.  
* **Task 1.2.8: Modular Calendar Component Integration**  
  * Load FullCalendar.io CDN in index.html.  
  * Create public/js/components/calendar.js with a function initCalendar(elementId, config) that initializes FullCalendar.io.  
  * The config should include options for fetching events from an API source.  
  * Initial calendar view will fetch events from /api/ice-time-slots (Task 1.1.5).  
* **Task 1.2.9: Display Admin Calendar View**  
  * Create public/js/views/calendarAdminView.js.  
  * Use initCalendar to display a calendar for Facility Admins (REQ-CAL-002) within \#app-content.  
  * Implement basic date navigation (previous/next month/week).  
* **Task 1.2.10: Basic CSS Styling & Responsiveness**  
  * Apply basic Tailwind CSS classes for consistent styling across components.  
  * Ensure login, registration, and initial dashboard layouts are responsive, especially considering the toggable layout sections.  
* **Task 1.2.11: SSE Frontend Listener (Initial)**  
  * In app.js or a dedicated realtimeService.js, initialize an EventSource connection to the SSE endpoint (/api/events).  
  * Implement a basic event listener to log incoming messages to the console. This establishes the client-side connection early.

## **Phase 2: Core Functionality (Ice Time Management & Program Flows)**

**Goal:** Implement full CRUD for core entities, enable ice time allocation, and allow program users to confirm their slots via the calendar.

### **2.1 Backend Enhancements (PHP & MySQL)**

* **Task 2.1.1: Program & Allocation APIs**  
  * Implement Program Model class.  
  * Implement Allocation Model class.  
  * Create ProgramController.php with CRUD endpoints for managing programs.  
  * Create AllocationController.php with endpoints:  
    * POST /api/allocate-ice-time (REQ-ALL-001: Admin allocates a slot to a program).  
    * POST /api/confirm-allocation (REQ-ALL-002: Program User confirms their allocation).  
    * GET /api/my-allocations (REQ-CAL-003: Program user's specific allocations).  
  * **Integrate notification logging into ProgramController and AllocationController methods for new allocations, confirmations, and program changes.**  
* **Task 2.1.2: Update Ice Time Slot API (Add/Edit Functionality)**  
  * Enhance IceTimeController.php:  
    * PUT /api/ice-time-slots/{id} (to update slot details, status).  
    * DELETE /api/ice-time-slots/{id}.  
  * **Integrate notification logging for ice time slot updates/deletions into IceTimeController and IceTimeSlot Model methods.**  
* **Task 2.1.3: Basic Email Notifications**  
  * Integrate a simple email sending library/function in PHP.  
  * Modify AllocationController to send email notifications (REQ-NOTIF-001) upon:  
    * New allocation to a program.  
    * Program confirmation of a slot.  
* **Task 2.1.4: Import Functionality Backend**  
  * Create ImportController.php with a POST /api/import-ice-time endpoint.  
  * Implement file parsing logic in PHP for JSON, CSV, and ICS/iCal formats.  
  * Implement data validation for imported events (e.g., date formats, duration, maximum 20 events per import).  
  * Implement logic to process and insert/update ice\_time\_slots in the database, handling duplicates or conflicts.  
  * Enforce size limit of 5MB for uploaded files.  
  * **Integrate notification logging for successfully imported ice time slots, triggering an SSE broadcast for calendar updates.**

### **2.2 Frontend Functionality & Refinement (HTML, CSS, JavaScript)**

* **Task 2.2.1: Enhance CRUD Factory (Forms & Actions)**  
  * Update crudFactory.js to dynamically generate HTML forms for creating and updating entities based on the configuration.  
  * Implement form submission logic (AJAX POST/PUT) for the factory.  
  * Add "Edit" and "Delete" buttons to Datatables rows, linking to factory-generated modals/forms.  
* **Task 2.2.2: Apply CRUD Factory to Programs & Ice Time Slots**  
  * Create public/js/views/programAdminView.js.  
  * Use crudFactory to manage programs within \#app-content.  
  * Integrate CRUD for ice time slots within the calendar context (e.g., clicking on a slot in FullCalendar opens a crudFactory-generated modal for editing/allocating).  
* **Task 2.2.3: Implement Program User Calendar View**  
  * Create public/js/views/calendarProgramView.js.  
  * Use the modular calendar component (initCalendar) to display a calendar for Program Users (REQ-CAL-003) within \#app-content.  
  * Configure FullCalendar to fetch events from /api/my-allocations.  
  * Implement "Confirm" button/logic within FullCalendar event rendering, sending AJAX request to /api/confirm-allocation.  
* **Task 2.2.4: Link Calendar to Facility Selection**  
  * Add a facility selector dropdown/list to the calendar views for Admins.  
  * JavaScript logic to update the FullCalendar's event source when a new facility is selected.  
* **Task 2.2.5: Import Functionality Frontend**  
  * Create a UI component for file upload (input type="file").  
  * Implement JavaScript to handle file selection, read file content (using FileReader).  
  * Send the parsed JSON/CSV/ICS data (or raw file for backend parsing) via AJAX to /api/import-ice-time.  
  * Provide feedback to the user on import status (success/failure, number of events imported/skipped).  
* **Task 2.2.6: Initial Responsiveness & UI Polish**  
  * Review and adjust CSS/Tailwind classes to ensure all new views and components are fully responsive.  
  * Implement consistent modal/dialog patterns for CRUD operations.  
* **Task 2.2.7: React to SSE Events on Calendar/Datatables**  
  * Enhance the realtimeService.js to parse incoming SSE messages.  
  * Based on event\_type in the SSE payload, trigger updates to relevant frontend components:  
    * If ice\_slot\_updated or ice\_slot\_created or ice\_slot\_deleted, trigger a FullCalendar refresh for relevant views.  
    * If user\_updated or facility\_updated, trigger a Datatables refresh for relevant admin views.

## **Phase 3: Advanced Features & Refinement**

**Goal:** Introduce business rules, payment tracking, reporting, and further enhance user experience and system robustness.

### **3.1 Backend Advanced Logic (PHP & MySQL)**

* **Task 3.1.1: Business Rules Implementation**  
  * Add price\_per\_hour or price\_per\_slot to ice\_time\_slots or create a pricing\_rules table (REQ-BR-001).  
  * Implement logic in IceTimeSlot and Allocation Models to enforce custom allocation rules (REQ-BR-002).  
  * Implement a cron job or scheduled task in PHP to automatically update ice\_time\_slots status (e.g., from 'allocated' to 'available') if not confirmed within a set time (REQ-BR-003).  
  * **Integrate notification logging for status changes triggered by business rules.**  
* **Task 3.1.2: Payment Tracking & APIs**  
  * Add payment\_status (e.g., 'unpaid', 'paid', 'partially\_paid') and amount\_due fields to allocations table (REQ-PAY-001).  
  * Create PaymentController.php with APIs to update payment status (e.g., PUT /api/allocations/{id}/payment-status).  
  * **Integrate notification logging for payment status updates.**  
* **Task 3.1.3: Audit Trails**  
  * Implement a generic AuditLog Model and table to record significant actions (user login, creation/update/deletion of entities, booking/cancellation) (REQ-SYS-001).  
  * **Ensure audit log entries can be used to trigger SSE broadcasts for admin monitoring views (optional, if detailed real-time audit is needed).**  
* **Task 3.1.4: Document Management APIs**  
  * Create documents table (document\_id, entity\_type, entity\_id, file\_path, original\_name, uploaded\_by, created\_at).  
  * Create DocumentController.php for file uploads (securely storing files) and linking (REQ-DOC-001).  
  * **Integrate notification logging for document changes.**  
* **Task 3.1.5: Reporting Data Endpoints**  
  * Create ReportController.php with API endpoints to generate summarized data for reports (e.g., /api/reports/utilization, /api/reports/revenue) (REQ-REP-001). This will involve complex SQL queries and data aggregation in PHP.  
* **Task 3.1.6: Real-time Sync (SSE) Backend Enhancement**  
  * Refine SSEController.php to efficiently query the notifications\_log table, potentially using LAST\_INSERT\_ID() or a timestamp-based approach to get only new events.  
  * Implement robust error handling and client disconnection management for the SSE endpoint.  
  * Consider adding a last\_event\_id mechanism to allow clients to reconnect and receive missed events.

### **3.2 Frontend Advanced UI & Data Display (HTML, CSS, JavaScript)**

* **Task 3.2.1: Pricing & Rules Configuration UI**  
  * Extend crudFactory configuration or create custom views for Facility Admins to define pricing rules and allocation rules.  
  * Display relevant pricing information on calendar events.  
* **Task 3.2.2: Payment Tracking UI**  
  * Display payment status on allocation lists (e.g., in Datatables for allocations).  
  * Implement UI for Facility Admins to update payment status.  
  * **React to SSE notifications for real-time payment status updates.**  
* **Task 3.2.3: Reporting Dashboards**  
  * Create dedicated views for displaying various reports.  
  * Use Datatables.net for tabular reports (REQ-REP-001).  
  * Consider simple chart libraries (if in scope) for visual reports.  
* **Task 3.2.4: Document Management UI**  
  * Integrate file upload fields and display linked documents within relevant CRUD forms (e.g., attach contract to a program) (REQ-DOC-001).  
  * **React to SSE notifications for real-time updates to document lists.**  
* **Task 3.2.5: Internal Notes UI**  
  * Add a text area for internal notes to relevant CRUD forms (e.g., User, Program, Allocation) (REQ-NOTES-001). Store/retrieve via their respective APIs.  
* **Task 3.2.6: Comprehensive Error Handling & User Feedback**  
  * Implement robust client-side validation for all forms.  
  * Display user-friendly error messages for API failures (e.g., "Booking failed due to conflict").  
  * Add loading indicators for AJAX requests.  
* **Task 3.2.7: Real-time Sync (SSE) Frontend Refinement**  
  * Refine realtimeService.js to handle different event\_type payloads more granularly.  
  * Implement logic to update *specific* elements or rows on the page (e.g., update a single FullCalendar event, refresh a specific Datatables row) rather than a full component refresh where possible.  
* **Task 3.2.8: Accessibility (A11y) Review**  
  * Review all UI components for keyboard navigation, screen reader compatibility, and color contrast.  
  * Adjust HTML semantics and ARIA attributes where necessary.

## **Phase 4: Optimization, Security & Deployment Preparation**

**Goal:** Refine performance, enhance security, prepare for deployment, and conduct comprehensive testing.

### **4.1 Backend Hardening & Optimization (PHP & MySQL)**

* **Task 4.1.1: Input Validation & Sanitization**  
  * Perform rigorous server-side input validation and sanitization for all API endpoints.  
  * Implement prepared statements for all database queries to prevent SQL injection.  
* **Task 4.1.2: Error Logging & Monitoring**  
  * Implement comprehensive server-side error logging (e.g., to file or dedicated service).  
  * Set up basic monitoring for API performance.  
* **Task 4.1.3: Performance Tuning**  
  * Review and optimize all database queries (add indexes, refine joins).  
  * Implement caching mechanisms (e.g., for frequently accessed static data or reports).  
* **Task 4.1.4: Security Headers & HTTPS Configuration**  
  * Configure web server (e.g., Apache/Nginx) to use HTTPS.  
  * Implement security headers (CSP, HSTS, X-Content-Type-Options etc.).  
* **Task 4.1.5: API Rate Limiting**  
  * Implement server-side API rate limiting to prevent abuse.  
* **Task 4.1.6: Database Cleanup for SSE Notifications**  
  * Implement a cron job or scheduled task to periodically prune old or "sent" entries from the notifications\_log table to prevent it from growing indefinitely.

### **4.2 Frontend Performance & Final Polish (HTML, CSS, JavaScript)**

* **Task 4.2.1: Asset Optimization**  
  * Minify/bundle JavaScript and CSS files.  
  * Optimize image assets (if any are introduced).  
  * Leverage browser caching where appropriate.  
* **Task 4.2.2: Cross-Browser Compatibility**  
  * Test the SPA across major browsers (Chrome, Firefox, Safari, Edge).  
* **Task 4.2.3: Final UI/UX Polish**  
  * Refine animations and transitions.  
  * Ensure consistent spacing, typography, and color palette.  
* **Task 4.2.4: Responsive Testing**  
  * Throughly test on various mobile devices, tablets, and desktops in different orientations.

## **5\. Continuous Improvement (Ongoing)**

* **Task 5.1.1: User Feedback Integration:** Set up mechanisms for collecting user feedback and prioritize improvements.  
* **Task 5.1.2: Regular Security Audits:** Conduct periodic security audits and penetration testing.  
* **Task 5.1.3: Performance Monitoring:** Continuously monitor application performance and user experience.  
* **Task 5.1.4: Feature Iteration:** Plan and implement new features based on feedback and business needs in subsequent development cycles.

This detailed plan provides a clear roadmap for building the Ice Time Management System, breaking down the complexity into manageable and logical steps for effective execution.