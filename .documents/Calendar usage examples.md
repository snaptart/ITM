  Usage Examples:

  Dashboard Calendar (simple embedded):
  const calendarFactory = new CalendarFactory({
      containerId: 'dashboard-calendar',
      layoutType: 'embedded',
      initialView: 'dayGridMonth'
  });

  Full Calendar Management (rich features):
  const calendarFactory = new CalendarFactory({
      containerId: 'calendar-management',
      layoutType: 'fullpage',
      enableFilters: true,
      enableSidebar: true
  });
