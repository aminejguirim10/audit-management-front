# 🛡️ Audit Management Frontend

Audit Management Frontend is a modern Angular 20 application for the Audit Management platform. It provides dedicated experiences for administrators, auditors, audite users, and students, with role-based navigation, audit dashboards, real-time chat, AI-assisted analysis, notifications, and secure profile management.

## ✨ Highlights

- 🔐 Secure authentication with login, forgot-password, and reset-password flows.
- 👥 Role-based portals for `ADMIN`, `AUDITEUR`, `AUDITE`, and `ETUDIANT`.
- 📊 Audit dashboards and reporting views with Chart.js.
- 💬 Real-time audit chat and unread notification updates over WebSocket/STOMP.
- 🤖 AI assistant for corrective-action analysis and quality improvement support.
- 🖼️ Profile photo and image upload support through Supabase Storage.
- 🎨 Modern UI built with Angular 20, Tailwind CSS 4, FontAwesome, and ngx-toastr.
- ⚡ Lazy-loaded standalone components for better maintainability and faster navigation.

## 🧰 Tech Stack

- Angular 20.2.0
- TypeScript 5.9
- RxJS 7.8
- Tailwind CSS 4 + PostCSS 8
- Chart.js 4
- FontAwesome 7
- ngx-toastr 19
- `@stomp/stompjs` + SockJS for real-time messaging
- `@supabase/supabase-js` for storage integration
- `@ai-sdk/angular` for the AI assistant UI
- Karma / Jasmine for unit tests
- Playwright available for browser automation workflows

## 🏗️ Architecture

The application is organized around standalone Angular building blocks:

- `src/app/components/layout/` for the application shell and shared layout.
- `src/app/components/pages/` for the role-based screens.
- `src/app/components/shared/` for reusable UI pieces such as the audit report.
- `src/app/services/` for API calls, WebSocket clients, AI integration, and storage logic.
- `src/app/guards/` for authentication and role protection.
- `src/app/models/` for typed frontend contracts.
- `src/app/config/` for shared configuration values.
- `src/environments/` for development and production endpoints.

The router uses lazy-loaded standalone components and role-aware route protection to keep the bundle focused and the navigation clear.

## 🔐 Security Model

- `auth.guard.ts` protects authenticated routes.
- `role.guard.ts` restricts each portal to the expected role.
- `auth.interceptor.ts` attaches the JWT bearer token to API requests.
- Access tokens and refresh tokens are stored locally by the authentication service.
- The app hydrates the current user profile after login to keep the UI in sync with the backend.

## 📱 Role-Based Portals

### Admin portal

- Dashboard
- Audit types management
- Audits management
- Departments management
- Auditors management
- Students management
- Profile page

### Auditor portal

- Dashboard
- Audit history
- Student ideas review
- Shared audit chat
- Profile page

### Audite portal

- Dashboard
- Corrective actions
- AI quality assistant
- Shared audit chat
- Profile page

### Student portal

- Dashboard
- Submit idea
- My ideas
- Profile page

### Shared screens

- Login
- Forgot password
- Reset password
- Audit report view
- User profile management

## 🔄 Real-Time & AI Integrations

- The `RealtimeMessagingService` connects to the backend WebSocket endpoint and subscribes to audit chat messages.
- Notification counters are updated in real time when new events arrive.
- The `AiService` sends failed audit questions to the external AI assistant API and returns prioritized corrective actions.
- The `AiConversationService` manages persistent AI conversations, including image attachments and conversation history.

## 🖼️ Storage & Media

- Supabase Storage is used for profile photos and chat images.
- Profile uploads are stored in the `audit-images` bucket.
- The storage service includes fallback handling for bucket configuration issues.

## ⚙️ Configuration

The application is configured through `src/environments/environment.ts` and `src/environments/environment.prod.ts`.

Example development configuration:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081',
  aiAssistantApiUrl: 'https://audit-ai-gold.vercel.app/api',
  supabase: {
    url: '<supabase-url>',
    anonKey: '<supabase-anon-key>',
    profileBucket: 'audit-images',
  },
};
```

Notes:

- Update `apiUrl` if your backend runs on a different host or port.
- Update the AI assistant URL if you deploy that service elsewhere.
- Update the Supabase values when using another project or bucket name.

## 🚀 Run Locally

### Clone the repository

```bash
git clone https://github.com/aminejguirim10/audit-management-front.git
cd audit-management-front
```

### Prerequisites

- Node.js 20 or newer
- npm
- The Audit Management backend running and reachable on the configured API URL

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm start
```

Open the application at:

```text
http://localhost:4200/
```

### Test the application

```bash
npm test
```

### Build the application

```bash
npm run build -- --configuration=production
```

For a reliable local compile check, use the development configuration:

```bash
npx ng build --configuration development
```

Note: the current project uses strict production budgets, so the development build is the safest way to validate the frontend quickly when you are not adjusting bundle size.

## 🐳 Docker

The repository includes a multi-stage Dockerfile that builds the Angular app with Node 20 and serves it with Nginx.

```bash
docker build -t audit-management-front .
docker run --rm -p 8080:80 audit-management-front
```

The Nginx configuration includes SPA fallback routing and long-term asset caching.

## 🧩 Main Services

- `AuthService` manages login, token persistence, role resolution, and profile hydration.
- `AuditService` fetches and updates audit data for the different portals.
- `NotificationService` caches and synchronizes unread notifications.
- `MessageService` handles audit chat history over HTTP.
- `RealtimeMessagingService` bridges WebSocket events into the UI.
- `SupabaseStorageService` uploads profile photos and audit chat images.
- `AiService` sends failed questions to the AI assistant endpoint.
- `StudentIdeaService`, `CommentService`, `VoteService`, `ReponseService`, and `CorrectiveActionService` support the audit collaboration flows.

## 📦 Project Structure

```text
src/app/
	components/
		layout/
		pages/
		shared/
	config/
	guards/
	models/
	services/
	environments/
```

## 👥 Collaborators

- Mohamed Amine Jguirim
- Fares Tekaya
- Firas Hizem

## 📌 Operational Notes

- The frontend expects the backend API to be available before login and dashboard navigation work correctly.
- WebSocket-based features require the backend chat endpoint to be reachable.
- Some screens depend on profile data returned by the authenticated user endpoint.
- The application uses toasts for feedback, so successful and failed actions are visible without page reloads.

## 🤝 Contributing

1. Create a feature branch.
2. Implement your changes following the existing component and service structure.
3. Run the tests and a development build.
4. Open a pull request with a clear summary of the change.
