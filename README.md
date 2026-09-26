# Placement Management System

React + Vite frontend and Express + MongoDB backend.

## Run locally

1. Install Node.js (LTS recommended).
2. In `backend`, copy `.env.example` to `.env` and set `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
3. Backend terminal:
   ```powershell
   cd backend
   npm install
   npm start
   ```
4. Separate frontend terminal:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
5. Open the Vite URL printed in the frontend terminal. In development the frontend uses `http://localhost:5000` for the API. Set `VITE_API_URL` if your backend is elsewhere.

## Features in this source

- Student and recruiter registration/login, JWT authentication, profile editing, job browsing/application, application status, interview scheduling, and resume upload/download.
- Recruiter job creation, applicant review, status decisions, resume downloads, interview scheduling, quick edit of job title/description, and close/reopen jobs.
- Admin dashboard, student/recruiter/job/application lists and deletion, company summary, interview list/deletion, announcements create/list/delete, and CSV placement report download.
- Password reset endpoints exist in the project; configure and test the full reset flow before relying on it.

## Notes

- MongoDB Atlas network access must allow your machine/server, and `MONGO_URI` must contain valid credentials. Never commit `.env` or share secrets.
- Companies are currently summarized from recruiter/job records; there is no separate company collection or company CRUD workflow.
- Notifications are not a persistent in-app notification system yet.
- Recruiter quick edit currently updates title and description; broader job editing UI is not included.
- Run `npm install` in both folders and test the workflows in your environment. The frontend production build was not verified in this packaging environment.
