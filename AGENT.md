## Theme and Color Usage — STRICT RULE

**Always use the application's themed color system. Never hard-code colors in application code.**

All colors must come from the global theme variables defined in the `app.css` file.

### Rules

1. **NEVER hard-code a color in application code.**
   - No hex values: `#1F6F54`, `#FFFFFF`, etc.
   - No RGB/RGBA values.
   - No HSL/HSLA values.
   - No Tailwind color utilities such as `bg-green-600`, `text-gray-900`, `border-red-500`, etc. when a themed semantic token is appropriate.
   - No inline `style={{ color: ... }}` with manually defined colors.

2. **Always use semantic theme tokens through the existing design system.**
   - Prefer `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-destructive`, etc.
   - Use existing shadcn semantic variants/components whenever possible.

3. **Do not bypass the theme system to solve a visual requirement.**
   - If a component needs a color, first determine whether an existing semantic token already represents that purpose.
   - Do not introduce a one-off color simply because it looks better in the current implementation.

4. **If a genuinely new color is required, add it to the global theme first.**
   - Define the color as a CSS variable in the global theme.
   - If the color represents a semantic concept, create a semantic variable.
   - If it represents a DrPass brand color, add it to the brand token layer.
   - Then consume that variable from the application code.
   - Never define the new color directly inside a component.

5. **Keep brand tokens and semantic tokens separate.**
   - Brand tokens define DrPass's visual identity, e.g. `--brand-primary`, `--brand-gold`, `--brand-paper`.
   - Semantic tokens define UI meaning, e.g. `--primary`, `--destructive`, `--muted`, `--background`.
   - Components should generally consume semantic tokens rather than brand tokens directly.

6. **Do not modify shadcn components merely to replace semantic tokens with brand tokens.**
   - Shadcn components should continue using semantic variables such as `primary`, `secondary`, `muted`, `accent`, `destructive`, `background`, `foreground`, etc.
   - Change the global theme mapping instead.

7. **Theme first, implementation second.**
   Before introducing a new visual color, check the global theme for an appropriate existing token. If none exists, add the token to the global theme and use it through the design system.

### Examples

GOOD:

```tsx
<div className="bg-background text-foreground" />
<Button>Continue</Button>
<Card className="border-border" />
<Badge variant="secondary">Practice</Badge>
```

GOOD — when a genuinely new semantic token exists:

```tsx
<div className="bg-success text-success-foreground" />
```

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

If the required color does not exist in the theme, **update the global CSS theme first, then use the new themed token.**

This rule applies to **all new code, modified code, pages, components, dialogs, forms, dashboards, exam interfaces, charts, states, and future features.**
