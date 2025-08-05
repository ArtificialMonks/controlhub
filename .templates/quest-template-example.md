# Quest 5.1: User Profile Management

## Status: Draft

## Quest

* As a user,
* I want to manage my profile information and preferences,
* so that I can customize my experience and keep my account information up to date.

## Acceptance Criteria (ACs)

1. A profile page is accessible from the main navigation menu.
2. Users can view and edit their basic information (name, email, avatar).
3. Users can update their notification preferences.
4. Users can change their password with proper validation.
5. All changes are saved to the database and reflected immediately in the UI.
6. Form validation provides clear error messages for invalid inputs.
7. Users receive confirmation when changes are successfully saved.

## Tasks / Subtasks

* [ ] Create profile page component at `/src/app/(dashboard)/profile/page.tsx`
* [ ] Implement profile form with shadcn/ui components (`<Input>`, `<Button>`, `<Avatar>`)
* [ ] Add form validation using react-hook-form and zod schema validation
* [ ] Create API endpoints for profile updates at `/src/app/api/profile/route.ts`
* [ ] Implement password change functionality with security validation
* [ ] Add notification preferences toggle switches
* [ ] Integrate with Supabase Auth for user data management
* [ ] Add profile link to main navigation component
* [ ] Implement optimistic UI updates for better user experience

## Dev Notes

**Prerequisite:** Quest 1.2 (User Authentication Setup) must be complete as this requires authenticated user context.

**Architecture:** This quest follows the established Next.js App Router pattern with server components for data fetching
and client components for interactive forms. All database operations go through the repository layer pattern.

**TypeScript:** All components must use strict TypeScript with proper type definitions for user profile data structures.

**UI/UX:** Profile form should use shadcn/ui components and follow the established design system with proper form
validation states and loading indicators.

## Testing

This quest requires both Component and End-to-End testing due to the critical nature of user data management.

**Component Tests (Vitest):**

```text
* Test profile form rendering with user data
* Test form validation for all input fields
* Test password change validation rules
* Test notification preferences toggle functionality
* Include accessibility testing with jest-axe
```

**E2E Tests (Playwright):**

```text
* Test complete profile update workflow
* Test password change with various scenarios (weak/strong passwords)
* Test form validation error handling
* Test successful save confirmation messages
* Test navigation to and from profile page
```

## Manual Test Steps

1. Log in to the application with a test user account.
2. Navigate to the profile page from the main navigation.
3. Verify that current user information is displayed correctly.
4. Update the user's name and email, then save changes.
5. Verify that changes are reflected immediately in the UI.
6. Test password change with invalid passwords (too short, no special characters).
7. Verify that appropriate error messages are displayed.
8. Change password with a valid new password and confirm success.
9. Toggle notification preferences and verify they are saved.
10. Refresh the page and confirm all changes persist.

---

<!-- This example demonstrates how to use the quest template for a typical user management feature -->
