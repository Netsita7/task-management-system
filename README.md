<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## TaskFlow API

A robust and scalable backend API for a modern Task Management System, built with **NestJS** and **PostgreSQL**. This system is designed to help teams organize work, track progress, and improve productivity.

## ✨ Core Features

This API powers a full-featured task management system:

*   **Project & Task Management**: Create projects and break them down into tasks.
*   **Team Collaboration**: Delegate work by assigning tasks to team members.
*   **Progress Tracking**: Monitor the status of tasks and projects in real-time.
*   **Deadlines & Scheduling**: Set due dates and adjust work schedules.
*   **Issue Tracking**: Log and track issues during project execution.
*   **Notifications**: Instant alerts for users when assigned a new task.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm
*   PostgreSQL

### Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Set up environment variables in a `.env` file:
    ```
    DATABASE_URL="postgresql://username:password@localhost:5432/taskflow_db"
    JWT_SECRET="your-super-secret-jwt-key"
    ```

3.  Run the application:
    ```bash
    # development mode
    npm run start:dev
    ```

The API will be running on `http://localhost:3000`.

## 📚 API Documentation

Comprehensive API documentation is available via Swagger at: `http://localhost:3000/api`