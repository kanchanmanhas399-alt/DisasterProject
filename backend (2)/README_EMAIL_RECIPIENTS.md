# Disaster email recipients

Admin-only recipient CRUD is available at `/admin/disaster-email-recipients` in the frontend and under `/admin/disaster-email-recipients` in the backend API. All four endpoints inherit the existing `auth` and `adminAuth` middleware.

The backend uses the existing `EMAIL_USER` / `EMAIL_APP_PASS` Nodemailer configuration. To include a direct link to an admin report detail page in notification emails, optionally set:

```env
ADMIN_REPORT_BASE_URL=http://localhost:5173
```

The application appends `/admin/report-details/<report-id>`. Leave this unset if the admin portal is hosted at a different base path or you do not want a link included.

Emails are dispatched asynchronously after the report and existing in-app notification have been saved. SMTP errors are logged and do not affect the report response. No recipient documents means no email is sent.
