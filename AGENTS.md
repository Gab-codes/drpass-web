# DrPass Frontend Engineering Rules

These rules apply to **all frontend work in DrPass**. Always read and follow them before implementing or modifying features.

The goal is to keep the codebase simple, maintainable, accessible, consistent, and easy for a solo developer to understand and evolve.

---

# 1. Core Engineering Principles

## KISS — Keep It Simple

Prefer the simplest solution that correctly solves the problem.

- Do not over-engineer.
- Do not introduce abstractions before they are needed.
- Do not create generic utilities for a single use case unless there is a clear readability or architectural reason.
- Do not introduce additional libraries when the existing stack can solve the problem.
- Avoid unnecessary state, effects, providers, hooks, wrappers, and context.
- Prefer straightforward code that another developer can understand quickly.

If two approaches solve the problem equally well, choose the simpler one.

## SOLID

Follow SOLID principles where they improve the codebase, particularly:

- Keep components focused on one responsibility.
- Avoid components that manage unrelated concerns.
- Separate API/data access from UI.
- Prefer composition over large conditional components.
- Keep dependencies explicit.
- Avoid tightly coupling UI components to implementation details of unrelated features.

Do not apply SOLID mechanically if doing so creates unnecessary abstraction.

---

# 2. Architecture Before Implementation

Before writing code:

1. Inspect the existing implementation.
2. Follow existing project patterns where they are sound.
3. Reuse existing components, utilities, hooks, API clients, and design-system primitives.
4. Do not create a new pattern when an established project pattern already exists.
5. If the existing pattern is clearly problematic, improve the pattern rather than duplicating it.

When implementing a feature that spans multiple concerns, keep those concerns separated.

For example:

```text
UI component
    ↓
feature hook / TanStack Query
    ↓
feature API function
    ↓
shared API client / interceptor
```

Do not put API request logic directly inside presentation components unless there is a compelling reason.

---

# 3. API Organization

API requests must have a **dedicated API file based on the domain/resource they belong to**.

Examples:

```text
app/api/user.ts
app/api/questions.ts
app/api/examinations.ts
app/api/syllabus.ts
app/api/auth.ts
```

For example, user-related requests belong in:

```text
app/api/user.ts
```

A component should not contain raw request logic such as:

```ts
axios.get("/users/me");
```

Instead, expose a dedicated function:

```ts
getCurrentUser();
```

and consume that through the appropriate data-fetching layer.

Keep API functions focused on communication with the backend.

Do not mix UI concerns, navigation, notifications, or component state into API files.

---

# 4. HTTP Client / Interceptors

The application already has a configured HTTP client with an interceptor that handles authentication credentials/cookies.

**Do not manually attach authentication cookies, tokens, or authorization headers inside individual API functions or components.**

Use the existing configured API client.

Do not bypass the interceptor by using:

```ts
fetch(...)
```

or a raw/unconfigured Axios instance when an existing project API client should be used.

The application's authentication/session mechanism should remain centralized.

---

# 5. TanStack Query

Use **TanStack Query for server state and server actions**.

This application is being designed with future offline compatibility in mind, so server state must have a consistent data-fetching and mutation layer.

Prefer:

- `useQuery`
- `useMutation`
- query invalidation
- query keys
- query caching
- appropriate loading/error/success states

Avoid using `useEffect` for normal API data fetching.

### BAD

```tsx
useEffect(() => {
  fetchUser();
}, []);
```

### GOOD

```tsx
const { data, isPending, isError } = useQuery({
  queryKey: ["user"],
  queryFn: getCurrentUser,
});
```

Likewise, use `useMutation` for server-side actions rather than manually managing request lifecycle with component state.

Do not use `useActionState` or similar patterns for normal API communication when TanStack Query is the established application pattern.

---

# 6. Server State vs Client State

Keep server state and client state separate.

### Server state

Examples:

- current user data
- questions
- examinations
- syllabus
- progress retrieved from the backend
- server-generated explanations
- API-backed settings

Use **TanStack Query**.

### Client/UI state

Examples:

- modal open/closed
- selected tab
- current onboarding step
- temporary form state
- UI preferences
- temporary interaction state

Use appropriate local React state or Zustand when the state genuinely needs to be shared.

Do not put server data into Zustand simply because it is convenient.

Do not use Zustand for state that TanStack Query already owns.

---

# 7. Error, Loading, Empty, and Success States

Every asynchronous feature must properly handle its lifecycle.

Do not leave users guessing what is happening or what they should do next.

Where applicable, explicitly design for:

- Loading state
- Error state
- Empty state
- Success state
- Disabled/pending state
- Retry/recovery state

### Loading

The user should understand that something is happening.

Use appropriate loading indicators, skeletons, or disabled controls depending on the context.

### Error

Never silently swallow an error.

The UI should explain what happened in clear language and provide an appropriate CTA where recovery is possible.

Examples:

- Retry
- Try again
- Go back
- Refresh
- Choose another option

Avoid exposing raw API errors or technical messages to students.

### Empty

An empty state should explain:

1. What is empty.
2. Why it might be empty when useful.
3. What the user can do next.

### Success

After a successful action, provide clear feedback when the result is not visually obvious.

Do not overuse toast notifications when the UI itself can communicate the result more naturally.

---

# 8. Type Ownership

Avoid hard-coding types inside unrelated folders.

Types should live close to the domain that owns them, especially when they are likely to be reused.

For example:

```text
app/types/user.ts
app/types/question.ts
app/types/examination.ts
```

However, **small types that are permanently local to a component or feature may remain local** when doing so improves readability.

Do not create a global type for every tiny interface.

Do not duplicate the same domain type across multiple files.

If a type represents backend/domain data and is reused across the application, give it an appropriate shared/domain location.

---

# 9. Component Design

Components should have clear responsibilities.

Prefer:

```text
Page
  ↓
Feature component
  ↓
UI component
```

Avoid giant components containing:

- API communication
- complex business logic
- navigation
- state management
- data transformation
- presentation
- validation

all in one file.

Extract logic when it improves readability or separation of concerns.

However, do not split every small piece into a separate file purely for the sake of abstraction.

---

# 10. Reuse Existing UI Components

Before creating a new UI primitive, inspect the existing component library.

The application uses **shadcn/ui**.

Prefer existing components such as:

- Button
- Input
- Dialog
- Select
- Combobox
- Alert
- Badge
- Card
- Progress
- Tooltip
- Dropdown Menu

When an existing component provides the required behavior, use it rather than creating a custom replacement.

Do not modify shadcn components unnecessarily.

If a visual requirement can be achieved through the existing theme tokens or component variants, prefer that approach.

---

# 11. Theme and Color Usage — STRICT RULE

**Always use the application's themed color system. Never hard-code colors in application code.**

All colors must come from the global theme variables defined in `app.css`.

## Rules

### 11.1 Never hard-code colors

No:

- Hex values
- RGB/RGBA values
- HSL/HSLA values
- Tailwind color utilities such as `bg-green-600`, `text-gray-900`, `border-red-500` when a themed semantic token is appropriate
- Inline styles containing manually defined colors

BAD:

```tsx
<div className="bg-[#1F6F54] text-[#14231C]" />
```

BAD:

```tsx
<div className="bg-green-600 text-white" />
```

BAD:

```tsx
<div style={{ backgroundColor: "#1F6F54" }} />
```

### 11.2 Use semantic theme tokens

Prefer:

```tsx
<div className="bg-background text-foreground" />

<Button>Continue</Button>

<Card className="border-border" />

<Badge variant="secondary">Practice</Badge>
```

Use semantic tokens such as:

```text
bg-background
text-foreground
bg-primary
text-primary-foreground
bg-secondary
text-secondary-foreground
bg-muted
text-muted-foreground
bg-accent
text-accent-foreground
bg-destructive
border-border
ring-ring
```

### 11.3 Do not bypass the theme

Before introducing a new color:

1. Check whether an existing semantic token already represents the required purpose.
2. If it does, use that token.
3. If it does not, add the appropriate token to the global theme.
4. Then consume the token from application code.

Never introduce a one-off color inside a component simply because it looks better.

### 11.4 Brand vs semantic tokens

Keep brand tokens and semantic tokens separate.

Brand tokens represent DrPass's identity.

Examples:

```text
--brand-primary
--brand-gold
--brand-paper
```

Semantic tokens represent UI meaning.

Examples:

```text
--primary
--destructive
--muted
--background
--foreground
```

Components should generally consume semantic tokens rather than directly consuming brand tokens.

### 11.5 Do not modify shadcn components unnecessarily

Shadcn components should continue using semantic variables.

If DrPass's primary color changes, update the theme mapping rather than replacing every:

```text
bg-primary
text-primary-foreground
```

with brand-specific classes.

**Theme first, implementation second.**

This rule applies to all:

- Pages
- Components
- Dialogs
- Forms
- Dashboards
- Exam interfaces
- Charts
- Loading states
- Empty states
- Error states
- Future features

---

# 12. Accessibility

The application follows modern web accessibility guidelines.

Accessibility is not an optional polish step.

All UI must consider:

- Keyboard navigation
- Visible focus states
- Appropriate semantic HTML
- Screen-reader accessibility
- Sufficient color contrast
- Accessible labels
- Accessible form validation
- Appropriate ARIA usage when native semantics are insufficient
- Logical heading hierarchy
- Touch target sizes
- Reduced-motion preferences

Do not use ARIA to compensate for incorrect HTML when native semantic HTML can solve the problem.

Interactive elements must be keyboard accessible.

Do not use a `<div>` as a button.

Forms must have meaningful labels.

Icon-only buttons must have accessible names.

Dialogs, dropdowns, comboboxes, and other interactive primitives must preserve keyboard and screen-reader behavior.

---

# 13. Responsive Design

DrPass is built for **both desktop and mobile devices**.

Do not treat mobile as an afterthought.

Every feature must work at:

- Desktop widths
- Tablet widths where applicable
- Mobile widths

Responsive layouts should recompose when necessary rather than simply shrinking desktop UI.

For student-facing experiences in particular:

- Keep interactions easy to tap.
- Avoid unnecessary horizontal scrolling.
- Avoid dense layouts on small screens.
- Preserve clear hierarchy.
- Ensure important actions remain discoverable.

---

# 14. Animation and Motion

Animation should support comprehension, continuity, and feedback.

**Do not add animation merely because animation is possible.**

DrPass is intentionally calm and focused. Avoid distracting students during study and exam-related experiences.

Good uses of animation:

- Page/step transitions
- Revealing newly available content
- Showing state changes
- Communicating hierarchy
- Smoothly opening/closing UI
- Progress transitions
- Subtle interaction feedback

Avoid:

- Excessive bouncing
- Decorative continuous animations
- Confetti
- Unnecessary floating elements
- Excessive scaling
- Long transitions
- Animations that delay the user's ability to interact

The application uses the **`motion` package**.

Use:

```tsx
import { motion, AnimatePresence } from "motion/react";
```

Do **not** use `framer-motion`.

Respect reduced-motion preferences using the appropriate `motion` APIs.

---

# 15. Student Experience

DrPass is a serious study companion, not a game.

The UI should feel:

- Calm
- Clear
- Personal
- Trustworthy
- Focused
- Premium
- Accessible

The interface should speak to students naturally without becoming childish or overly conversational.

Avoid unnecessary:

- Gamification
- Confetti
- XP systems
- Excessive badges
- Bouncy UI
- Decorative animations
- Visual noise

Every interaction should help the student understand:

**Where am I?
What is happening?
What do I need to do next?**

---

# 16. Copy and UX

Student-facing copy should be concise and human.

Avoid unnecessarily technical language.

Prefer clear guidance over vague messaging.

For example:

GOOD:

> We couldn't find that programme. You can choose your UTME subjects yourself.

BAD:

> No results found due to an invalid programme mapping.

When an action has consequences, explain them clearly before the user commits.

Do not unnecessarily overwhelm students with long explanations.

---

# 17. Forms

Forms should:

- Have clear labels.
- Provide useful validation.
- Show errors near the relevant field when appropriate.
- Preserve entered values when possible.
- Clearly indicate required fields.
- Disable or otherwise protect against duplicate submissions during pending states.
- Provide a clear next action.

Do not make users guess why a button is disabled.

Do not silently reject invalid input.

---

# 18. Navigation

Navigation should follow the application's established routing architecture.

Do not introduce alternative routing patterns.

Before adding routes:

1. Inspect `routes.ts`.
2. Follow the existing React Router structure.
3. Keep route-level components focused on composing the page/feature.

Navigation should always leave the user with an obvious destination and recovery path.

---

# 19. Data Transformation

Keep backend data transformation close to the API/domain layer when practical.

Do not repeatedly transform the same backend structure independently inside multiple components.

For example, if the backend returns:

```ts
UserResponse;
```

and the application needs a specific presentation model, centralize that transformation where it makes sense.

Do not put unnecessary mapping logic inside JSX.

---

# 20. Avoid Premature Optimization

Do not optimize based on speculation.

First identify the actual bottleneck.

However, do avoid obvious performance mistakes such as:

- Rebuilding large arrays on every render unnecessarily.
- Rendering hundreds of DOM nodes when only a small subset is visible.
- Unnecessary effects.
- Unnecessary re-fetching.
- Unstable values passed into expensive components.
- Rendering expensive UI repeatedly without reason.

When performance becomes a concern, measure before introducing complex solutions such as virtualization, workers, or additional caching layers.

---

# 21. Do Not Change Design Unnecessarily

When modifying existing code, preserve the existing design unless the task explicitly asks for a design change.

Do not "improve" unrelated:

- Colors
- Spacing
- Typography
- Layout
- Component styling
- Copy
- Animation
- Interaction patterns

during an unrelated feature implementation.

If a design issue is discovered, mention it separately rather than silently changing it.

---

# 22. Scope and Coupled Changes

This project is maintained by a solo developer.

Do not artificially restrict implementation scope merely because a change touches multiple files.

If two or more changes are naturally coupled and implementing them together produces a cleaner, safer, or more maintainable result, make the coupled changes together.

For example:

```text
API endpoint
+
API function
+
TanStack Query hook
+
UI state
```

may legitimately belong to the same implementation.

The important constraint is **cohesion**, not an arbitrary file or PR count.

Keep unrelated work out of the implementation.

---

# 23. Before Creating New Code

Before creating a new file, hook, utility, component, type, API function, or abstraction, ask:

1. Does this already exist?
2. Can an existing component or utility solve this?
3. Does this belong to an existing domain?
4. Is this abstraction actually reusable?
5. Does creating this make the code easier or harder to understand?

If the answer is unclear, inspect the existing codebase before proceeding.

---

# 24. Dependencies and Packages

- **Inspect before introducing:** Before adding a new package, inspect the existing `package.json` and codebase to determine whether an installed dependency already provides the required functionality.
- **Prefer existing dependencies:** Reuse packages already installed in the project when they are appropriate. Do not introduce a new dependency when the existing stack can reasonably solve the problem.
- **Avoid unnecessary dependencies:** Keep the dependency footprint small. Do not add libraries for trivial functionality that can be implemented cleanly with the existing stack or native browser APIs.
- **Verify compatibility:** Before adding a package, consider its compatibility with the current framework, React version, TypeScript configuration, build tooling, and existing dependencies.
- **Follow existing conventions:** When a package is already used for a particular concern, follow the established implementation pattern instead of introducing an alternative library for the same concern.
- **Inspect the project first:** Treat `package.json`, source imports, configuration files, and existing components as the source of truth for the current technology stack. Do not assume a package is available based only on documentation or prior knowledge.
- **Do not maintain a manual package inventory in this file.** The actual installed dependencies should always be determined from the project itself.

---

# 25. Implementation Quality Checklist

Before considering a feature complete, verify:

- [ ] Existing project patterns were followed.
- [ ] No unnecessary abstractions were introduced.
- [ ] API communication is separated from UI.
- [ ] API functions live in the appropriate `app/api/*` domain file.
- [ ] Existing authenticated API client/interceptors are used.
- [ ] TanStack Query is used for server state/actions.
- [ ] Server state is not unnecessarily duplicated in Zustand.
- [ ] Loading state is handled.
- [ ] Error state is handled.
- [ ] Empty state is handled where applicable.
- [ ] Success state is handled where applicable.
- [ ] Users always have a clear next action.
- [ ] Types are owned by the appropriate domain.
- [ ] No unnecessary duplicated types exist.
- [ ] Existing shadcn components are reused where appropriate.
- [ ] No colors are hard-coded.
- [ ] Existing semantic theme tokens are used.
- [ ] New colors are added to the global theme before use.
- [ ] No unnecessary shadcn component modifications were made.
- [ ] Keyboard accessibility works.
- [ ] Focus states are visible.
- [ ] Forms have accessible labels and validation.
- [ ] Mobile and desktop layouts are considered.
- [ ] Animations use `motion`, not `framer-motion`.
- [ ] Animations are purposeful and restrained.
- [ ] Reduced-motion behavior is respected.
- [ ] Existing design was not changed unnecessarily.
- [ ] Unrelated scope was not introduced.
- [ ] Coupled changes were implemented together when appropriate.
- [ ] Type checking passes.
- [ ] Relevant tests pass.

**When these rules conflict with a specific task requirement, follow the explicit task requirement, but preserve the underlying principles wherever possible.**
