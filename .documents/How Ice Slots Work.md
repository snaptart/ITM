● Based on the database schema, here's how ice slots work and what the effective date means:

  How Ice Slots Work

  Ice slots are recurring time templates that define when ice time is available. They work as
  patterns rather than individual bookings - for example, "every Monday 7:00-8:00 PM starting
  January 1st."

  What effective_date Means

  The effective_date is the start date for when a recurring ice time slot pattern becomes
  active. Key points:

  1. Start of Recurring Pattern: Determines when the slot schedule begins (e.g., start of
  hockey season)
  2. Date Range Filtering: System uses it to show only relevant slots for calendar views
  3. Seasonal Scheduling: Allows different ice schedules for different time periods
  4. Future Planning: Administrators can create slot patterns that activate on future dates

  Complete Date Range System

  - effective_date: When the pattern starts (required)
  - expiry_date: When the pattern ends (optional - NULL means indefinite)
  - day_of_week: Which day (0=Sunday, 1=Monday, etc.)
  - start_time/end_time: Time of day

  Example

  A slot with:
  - effective_date: 2024-09-01
  - expiry_date: 2024-04-30
  - day_of_week: 1 (Monday)
  - start_time: 19:00

  Creates "every Monday 7:00 PM from Sept 1, 2024 to April 30, 2025" - perfect for a hockey
  season schedule.

  The actual bookings/allocations reference these slot templates to create specific dated
  reservations.


  The default behavior should be that when an ice slot is created, allocation records should    │
│   also be created assigned to a program_id of 0 (indicating not assigned yet). An allocation    │
│   would be any start and end times within the effective and expiry dates