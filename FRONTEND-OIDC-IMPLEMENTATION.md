# Frontend OIDC Authentication Implementation

## Overview

The frontend Angular application has been updated to support OIDC (OpenID Connect) authentication, integrating with the backend OIDC implementation. This document describes the changes made to enable secure authentication with JWT tokens stored in httpOnly cookies.

## Architecture

### Authentication Flow

1. **Login Initiation**
   - User clicks "Sign in with OIDC Provider" button
   - Frontend calls `GET /auth/login` to get OIDC authorization URL
   - Browser redirects to OIDC provider (Keycloak/Azure AD)

2. **OIDC Callback**
   - OIDC provider redirects to `GET /auth/callback?code=...`
   - Backend exchanges code for tokens, sets httpOnly cookies
   - Frontend `/auth-callback` route activates
   - AuthCallbackComponent waits for cookies, fetches user details
   - Redirects to original destination or dashboard

3. **Session Management**
   - AuthenticationService checks session every 5 minutes
   - Automatic token refresh on 401 errors via AuthInterceptor
   - Proactive session validation prevents unexpected logouts

4. **Logout**
   - User clicks logout → `POST /auth/logout`
   - Backend revokes tokens, clears cookies
   - Frontend clears state, redirects to login

### Token Strategy

- **Access Token**: 15-minute expiry, httpOnly cookie
- **Refresh Token**: 7-day expiry, httpOnly cookie
- **No local storage**: All tokens managed server-side via cookies
- **Automatic refresh**: AuthInterceptor handles 401 errors transparently

## Components Modified

### 1. AuthenticationService (`global-services/authentication.service.ts`)

**Status**: Completely rewritten (~274 lines)

**Key Methods**:
- `redirectToLogin(returnUrl?)`: Fetches OIDC URL and redirects browser
- `getCurrentUser()`: Retrieves authenticated user from backend
- `checkSession()`: Proactive session validation (called every 5 min)
- `refreshToken()`: Handles token refresh, detects `requiresReauth`
- `logout()`: Revokes tokens and clears session
- `hasRole(role)`: Check if user has specific role
- `isAdmin()`: Check if user has ADMIN role
- `isAuthenticated()`: Check if user is logged in

**State Management**:
- `BehaviorSubject<User | null>` for reactive user state
- localStorage backup for page refresh persistence
- Observable pattern for component subscriptions

**Session Check**:
```typescript
// Runs every 5 minutes automatically
private startSessionCheck() {
    this.sessionCheckInterval = setInterval(() => {
        this.checkSession().subscribe();
    }, 5 * 60 * 1000); // 5 minutes
}
```

### 2. LoginComponent (`shared/login/`)

**Status**: Simplified to single OIDC button

**Changes**:
- Removed environment-specific URLs (internal/external)
- Single login method: `redirectToLogin()`
- Session expiry detection from query params
- Loading state during redirect

**Template**:
```html
<button 
  class="btn btn-primary btn-lg w-100" 
  (click)="login()"
  [disabled]="isLoading">
  <i class="bi bi-shield-lock me-2"></i>
  @if (isLoading) {
    <span class="spinner-border spinner-border-sm me-2"></span>
  }
  Sign in with OIDC Provider
</button>
```

### 3. AuthCallbackComponent (`shared/auth-callback/`)

**Status**: NEW component created

**Purpose**: Handles OIDC callback after provider authentication

**Process**:
1. Wait 500ms for backend to set cookies
2. Call `getCurrentUser()` to fetch user details
3. Extract returnUrl from query params
4. Navigate to returnUrl or dashboard
5. Show loading spinner during process
6. Handle errors with retry button

**Template** (inline):
```typescript
template: `
  <div class="container mt-5">
    <div class="text-center">
      @if (!error) {
        <div class="spinner-border text-primary mb-3"></div>
        <h3>Authenticating...</h3>
      } @else {
        <h3 class="text-danger">Authentication Failed</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="retry()">
          Retry
        </button>
      }
    </div>
  </div>
`
```

### 4. AuthInterceptor (`interceptors/auth-interceptor.ts`)

**Status**: NEW interceptor created

**Purpose**: Automatic token refresh and request queueing

**Features**:
- Adds `withCredentials: true` to all HTTP requests (required for cookies)
- Handles 401 errors by calling `refreshToken()`
- Prevents concurrent refresh attempts with `isRefreshing` flag
- Queues requests during refresh using `BehaviorSubject`
- Detects `requiresReauth` response from backend

**Flow**:
```typescript
intercept(request, next) {
  // Add withCredentials to all requests
  request = request.clone({ withCredentials: true });
  
  return next.handle(request).pipe(
    catchError(error => {
      if (error.status === 401) {
        return handle401Error(request, next);
      }
      return throwError(() => error);
    })
  );
}
```

**Request Queueing**:
```typescript
private handle401Error(request, next) {
  if (!this.isRefreshing) {
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);
    
    return this.authService.refreshToken().pipe(
      switchMap(() => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(true);
        return next.handle(request);
      })
    );
  } else {
    // Queue this request until refresh completes
    return this.refreshTokenSubject.pipe(
      filter(result => result !== null),
      take(1),
      switchMap(() => next.handle(request))
    );
  }
}
```

### 5. Route Guards (`shared/guards/auth.guard.ts`)

**Status**: NEW guards created

**Guards**:
1. **authGuard**: Protects routes requiring authentication
   - Checks `isAuthenticated()`
   - Redirects to login with returnUrl
   
2. **adminGuard**: Protects admin-only routes
   - Checks `isAdmin()`
   - Redirects to login or unauthorized page

**Usage**:
```typescript
// In app-routing.module.ts
{ 
  path: 'dashboard', 
  component: DashboardComponent, 
  canActivate: [authGuard] 
},
{ 
  path: 'admin', 
  component: AdminComponent, 
  canActivate: [adminGuard] 
}
```

**Implementation** (functional guards):
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
};
```

### 6. HeaderComponent (`shared/header/`)

**Status**: Updated with authentication features

**Changes**:
- Subscribe to `currentUser` observable
- Show different menu when authenticated
- User dropdown with profile and logout
- Admin menu item (conditional on `isAdmin()`)
- Display user name/email

**Template Features**:
```html
<!-- Authenticated User Menu -->
@if (currentUser) {
  <li class="nav-item">
    <a class="nav-link" routerLink="/dashboard">
      <i class="bi bi-speedometer2 me-1"></i>Dashboard
    </a>
  </li>
  @if (isAdmin) {
    <li class="nav-item">
      <a class="nav-link" routerLink="/admin">
        <i class="bi bi-gear me-1"></i>Admin
      </a>
    </li>
  }
  <li class="nav-item dropdown">
    <a class="nav-link dropdown-toggle">
      <i class="bi bi-person-circle me-1"></i>
      {{ userDisplayName }}
    </a>
    <ul class="dropdown-menu">
      <li><span class="dropdown-item-text">{{ currentUser.email }}</span></li>
      <li><a class="dropdown-item" routerLink="/profile">Profile</a></li>
      <li><a class="dropdown-item" (click)="logout()">Logout</a></li>
    </ul>
  </li>
}
```

### 7. ErrorInterceptor (`interceptors/error-interceptor.ts`)

**Status**: Updated to work with AuthInterceptor

**Changes**:
- **401 errors**: Pass through (handled by AuthInterceptor)
- **403 errors**: Show unauthorized dialog
- Removed `clearUserDetails()` on 401 (AuthInterceptor handles)

**Flow**:
```
HTTP Request → AuthInterceptor (adds cookies, handles 401)
            → ErrorInterceptor (handles 403, other errors)
            → Application
```

## Module Configuration

### 1. SharedModule (`shared/shared.module.ts`)

**Updated**:
```typescript
imports: [
  CommonModule,
  MatDialogModule,
  HeaderComponent,
  FooterComponent,
  LoginComponent,
  AuthCallbackComponent, // NEW
  MatButtonModule
],
exports: [
  MatDialogModule,
  HeaderComponent,
  FooterComponent,
  LoginComponent,
  AuthCallbackComponent, // NEW
  MatButtonModule
]
```

### 2. AppModule (`app.module.ts`)

**Updated**:
```typescript
providers: [
  // AuthInterceptor must run BEFORE ErrorInterceptor
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
]
```

**Order matters**: AuthInterceptor handles 401 refresh, ErrorInterceptor handles UI errors.

### 3. Routing (`app-routing.module.ts`)

**Added**:
```typescript
import { authGuard } from '@app/shared/guards/auth.guard';
import { AuthCallbackComponent } from '@app/shared/auth-callback/auth-callback.component';

export const routes: Routes = [
  // ... existing routes
  { 
    path: 'auth-callback', 
    title: 'Authenticating...', 
    component: AuthCallbackComponent 
  },
  
  // Protected routes (examples)
  // { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  // { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
];
```

## Data Models

### User Model (`shared/model/admin/user.ts`)

**Updated**:
```typescript
export class User extends BaseModel {
    id?: number | string; // Can be number (legacy) or string (OIDC subject)
    email!: string;
    firstName!: string;
    lastName?: string;
    phone?: string;
    isExternalUser!: boolean;
    
    // Legacy fields (optional for OIDC users)
    orcId?: string;
    loginRole?: string;
    loginRoleDesc?: string;
    loginRoleAssocId?: number;
    loginOfficeId?: number;
    loginOfficeName?: string;
    loginOfficeCd?: string;
    rapAdmin?: boolean;
    
    // OIDC-specific fields
    roles?: string[];      // NEW: Array of role strings
    isActive?: boolean;    // NEW: User active status
    lastLoginAt?: string;  // NEW: Last login timestamp
}
```

**UserAdapter Updated**:
```typescript
restToForm(item: any): User {
    let result = new User();
    // ... existing mappings
    
    // OIDC-specific fields
    result.roles = item.roles;
    result.isActive = item.isActive;
    result.lastLoginAt = item.lastLoginAt;
    
    return result;
}
```

## Testing Checklist

### Local Development

- [ ] Start backend with OIDC configuration
- [ ] Configure Keycloak/Azure AD test realm
- [ ] Set environment variables in `.env`
- [ ] Run `npm start` to start Angular dev server
- [ ] Navigate to `http://localhost:4200`

### Authentication Flow

- [ ] Click "Sign in with OIDC Provider"
- [ ] Redirects to OIDC provider login page
- [ ] Enter test credentials
- [ ] Redirects to `/auth-callback`
- [ ] Shows "Authenticating..." spinner
- [ ] Redirects to dashboard or returnUrl
- [ ] User menu shows name and email

### Session Management

- [ ] User stays logged in after page refresh
- [ ] Session check runs every 5 minutes (check console)
- [ ] Make API call after 14 minutes (should auto-refresh)
- [ ] Wait for access token expiry (15 min) → auto-refresh works
- [ ] Wait for refresh token expiry (7 days) → redirects to login

### Authorization

- [ ] Admin user sees "Admin" menu item
- [ ] Non-admin user does NOT see "Admin" menu item
- [ ] Accessing `/admin` without ADMIN role redirects
- [ ] Protected routes require login

### Error Handling

- [ ] Invalid OIDC callback (bad code) shows error
- [ ] Backend down during callback shows error with retry
- [ ] 403 errors show unauthorized dialog
- [ ] Network errors show appropriate messages

### Logout

- [ ] Click logout in user menu
- [ ] Redirects to login page
- [ ] User state cleared (localStorage + BehaviorSubject)
- [ ] Accessing protected route redirects to login
- [ ] Cookies cleared in backend

## Environment Configuration

### Frontend Runtime Config (`public/runtime-config.json`)

**Development**:
```json
{
  "apiUrl": "http://localhost:8080",
  "enableDebugLogs": true
}
```

**Production** (injected by container):
```json
{
  "apiUrl": "${API_URL}",
  "enableDebugLogs": false
}
```

### Backend Environment Variables

Required for OIDC:
```bash
# Keycloak Example
OIDC_PROVIDER_ISSUER_URI=http://localhost:8090/realms/raptor
OIDC_CLIENT_ID=raptor-client
OIDC_CLIENT_SECRET=<from-keycloak>
FRONTEND_URL=http://localhost:4200

# Azure AD Example
OIDC_PROVIDER_ISSUER_URI=https://login.microsoftonline.com/<tenant-id>/v2.0
OIDC_CLIENT_ID=<app-registration-id>
OIDC_CLIENT_SECRET=<client-secret>
FRONTEND_URL=http://localhost:4200
```

## Deployment Considerations

### Container Configuration

**Dockerfile** (already configured):
```dockerfile
# Runtime config injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
```

**docker-entrypoint.sh** (already exists):
```bash
#!/bin/sh
# Inject runtime configuration
envsubst < /usr/share/nginx/html/runtime-config.template.json \
  > /usr/share/nginx/html/runtime-config.json

exec "$@"
```

### Azure Container Apps

**Environment Variables**:
```bicep
env: [
  {
    name: 'API_URL'
    value: backendFqdn
  }
  {
    name: 'OIDC_PROVIDER_ISSUER_URI'
    secretRef: 'oidc-provider-issuer-uri'
  }
  {
    name: 'OIDC_CLIENT_ID'
    secretRef: 'oidc-client-id'
  }
  {
    name: 'OIDC_CLIENT_SECRET'
    secretRef: 'oidc-client-secret'
  }
]
```

### CORS Configuration

Backend must allow frontend origin:
```yaml
# application.yml
spring:
  web:
    cors:
      allowed-origins:
        - ${FRONTEND_URL}
      allowed-methods:
        - GET
        - POST
        - PUT
        - DELETE
      allowed-headers:
        - "*"
      allow-credentials: true  # Required for cookies
```

## Troubleshooting

### Login Redirect Loop

**Symptom**: Continuous redirect between login and callback
**Cause**: Cookies not being set or read
**Fix**: 
- Check `withCredentials: true` on all requests
- Verify CORS allows credentials
- Check SameSite cookie settings in backend

### 401 Errors Not Refreshing

**Symptom**: 401 errors cause logout instead of refresh
**Cause**: AuthInterceptor not registered or wrong order
**Fix**:
- Verify AuthInterceptor in `app.module.ts` providers
- Ensure AuthInterceptor listed BEFORE ErrorInterceptor

### Session Lost on Page Refresh

**Symptom**: User logged out after F5
**Cause**: localStorage not set or currentUser not restored
**Fix**:
- Check AuthenticationService constructor loads from localStorage
- Verify `getCurrentUser()` called on app init

### Guards Not Working

**Symptom**: Protected routes accessible without login
**Cause**: Guards not applied to routes
**Fix**:
- Add `canActivate: [authGuard]` to route configuration
- Import guards in routing module

### Admin Menu Not Showing

**Symptom**: Admin user doesn't see admin menu
**Cause**: `roles` array not set or `isAdmin()` logic wrong
**Fix**:
- Check `convertToFrontendUser()` maps roles correctly
- Verify backend returns `roles: ['ADMIN']` in user response
- Check `isAdmin()` method: `return this.hasRole('ADMIN')`

## Next Steps

### Missing Components (To Be Created)

1. **DashboardComponent** - User dashboard after login
2. **AdminComponent** - Admin console (protected by adminGuard)
3. **ProfileComponent** - User profile management
4. **UnauthorizedComponent** - 403 error page

### Recommended Enhancements

1. **Remember Me** - Extend refresh token expiry
2. **Multi-Factor Auth** - Integrate OIDC MFA
3. **Role-Based UI** - Conditional features based on roles
4. **Audit Logging** - Track login/logout events
5. **Session Timeout Warning** - Notify before expiry

## Related Documentation

- Backend: `backend/docs/OIDC-IMPLEMENTATION-SUMMARY.md`
- Infrastructure: `infra/docs/AUTHENTICATION-ARCHITECTURE.md`
- Quick Start: `backend/docs/QUICK-START-OIDC.md`
- Configuration: `backend/docs/OIDC-CONFIGURATION.md`

## Summary

The frontend has been fully updated to support OIDC authentication with:

✅ **Complete service rewrite** - AuthenticationService with OIDC integration
✅ **Simplified login** - Single OIDC button, no environment-specific URLs
✅ **Callback handling** - AuthCallbackComponent processes OIDC redirects
✅ **Token refresh** - AuthInterceptor handles 401 errors transparently
✅ **Route protection** - Functional guards (authGuard, adminGuard)
✅ **User state** - Observable pattern with localStorage backup
✅ **Session management** - Proactive 5-minute checks
✅ **Module registration** - All components declared and exported
✅ **Interceptor chain** - Proper ordering (Auth → Error)
✅ **User model** - Extended with OIDC fields (roles, isActive, etc.)

The implementation follows Angular best practices, uses modern patterns (functional guards, standalone components), and integrates seamlessly with the backend OIDC system.
