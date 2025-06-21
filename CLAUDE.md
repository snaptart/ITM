# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ice Time Management System - A Single-Page Application (SPA) for streamlining ice time allocation, booking, and management for arenas and skating programs. Built with HTML/CSS/JavaScript frontend and PHP/MySQL backend following MVC pattern.

## Architecture

**Frontend (SPA):**
- HTML/CSS/JavaScript with Tailwind CSS
- Libraries: datatables.net, fullcalendar.io
- 4-section layout: Header, Sidebar, Main Content, Footer (all toggleable)
- Frontend CRUD Factory for dynamic forms/tables
- SSE for real-time updates

**Backend:**
- PHP (MVC pattern) with MySQL
- RESTful API endpoints
- Authentication & role-based permissions
- SSE endpoint for real-time notifications

## Project Structure

Key files and directories are referenced in `.documents/` folder:
- `ITM System Requirements.MVP.md` - Core requirements and user roles
- `ITM Architecture and Phased Dev Plan.md` - Detailed MVC architecture
- `ITM Step by Step Dev Plan.md` - Phased development approach
- `exampleLayout.html` - UI layout prototype

## Development Phases

**Phase 1: Foundation**
- Database setup, User/Auth APIs, basic ice time management
- SPA structure, login/registration, basic calendar views

**Phase 2: Core Functionality** 
- Program allocation, full CRUD operations, email notifications
- Enhanced calendar features, import functionality

**Phase 3: Advanced Features**
- Business rules, payment tracking, reporting, document management

**Phase 4: Optimization & Deployment**
- Security hardening, performance tuning, final polish

## Key Design Patterns

**Frontend CRUD Factory:**
- Configuration-driven approach for entity management
- Dynamically generates forms and tables based on JSON config
- Uses datatables.net for interactive data display
- Reduces boilerplate code for admin interfaces

**Modular Calendar System:**
- FullCalendar.io for consistent visualization
- Role-based content filtering
- Real-time updates via SSE
- Supports different user views (Admin vs Program User)

**Real-time Communication:**
- Server-Sent Events (SSE) for live updates
- Database change notifications trigger client updates
- Lightweight uni-directional communication

## Important Constraints

- **No SVG/Mermaid JS:** Use HTML/CSS for diagrams and graphics
- **Security First:** Role-based permissions, input validation, prepared statements
- **Responsive Design:** All interfaces must work on desktop, tablet, and mobile

## User Roles & Permissions

- **System Administrator:** Manages global system configuration and user types
- **Facility Administrator:** Manages facility details, ice surfaces, and time allocation
- **Program User:** Views allocated ice time, confirms selections
- **Public/Guest:** Limited access for registration

## Database Schema (Core Tables)

- `users` - User authentication and role management
- `roles` - User role definitions
- `facilities` - Arena/facility information
- `ice_surfaces` - Individual ice rinks within facilities  
- `ice_time_slots` - Available time slots for booking
- `programs` - Skating programs/teams
- `allocations` - Ice time assignments to programs
- `notifications_log` - Events for SSE broadcasting

## API Structure

**Authentication Endpoints:**
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `POST /api/password-reset` - Password reset

**Facility Management:**
- `GET/POST/PUT/DELETE /api/facilities` - Facility CRUD operations
- `GET/POST/PUT/DELETE /api/ice-surfaces` - Ice surface management

**Ice Time Management:**
- `GET /api/ice-time-slots` - Fetch available slots (filtered by user role)
- `POST /api/ice-time-slots` - Create new time slots
- `POST /api/allocate-ice-time` - Allocate slots to programs
- `POST /api/confirm-allocation` - Program user confirms allocation

**Real-time Updates:**
- `GET /api/events` - SSE endpoint for live notifications