# UX Design Guide — Avishag Purchase Manager App

## Tools Overview

### Dribbble (dribbble.com)
**What it is:** A design inspiration platform where designers showcase UI/UX work.

**How to use it for this project:**
1. Search for keywords relevant to each screen you're designing:
   - "mobile task manager", "todo app mobile", "task list UI"
   - "issue tracker mobile", "CRM mobile", "report dashboard mobile"
   - "supplier management", "inventory tracking app"
2. Filter by "Mobile" to stay focused on phone-sized designs
3. Save shots you like into a collection (create a "Avishag CRM" collection)
4. Pay attention to: navigation patterns, card layouts, how urgency/priority is shown, form design on mobile
5. Look for Hebrew/RTL design examples — search "RTL app design" or "Arabic mobile UI" for layout reference

**Tips:**
- Don't just copy — identify *patterns* that repeat across good designs (e.g., swipe-to-complete, FAB for "add new", color-coded urgency)
- Screenshot the 3-5 shots that feel closest to what you want and annotate what you like about each

### Google Stitch (stitch.google.com)
**What it is:** Google's AI-powered design tool that generates UI mockups from text prompts and reference images.

**How to use it for this project:**
1. **Start with text prompts** — describe each screen:
   - "Mobile task management app with priority badges, due dates, and checkboxes. Clean minimal design."
   - "Mobile issue tracking form with supplier dropdown, product details, and photo upload area."
   - "Mobile dashboard showing open tasks count, pending supplier issues, and recent activity."
2. **Feed in Dribbble references** — upload your favorite Dribbble screenshots as style references
3. **Iterate screen by screen** — don't try to design the whole app at once:
   - Screen 1: Tasks list view
   - Screen 2: Add/edit task form
   - Screen 3: Supplier issues list
   - Screen 4: Create issue report form
   - Screen 5: Issue detail view with action items
4. **Export as images** — use these as reference when we implement the frontend

**Tips:**
- Be specific about mobile constraints: "bottom navigation bar", "thumb-reachable action buttons", "single column layout"
- Mention RTL support if the UI will be in Hebrew
- Generate multiple variations and pick elements from different ones

## Recommended Workflow

```
1. Dribbble research (30 min)
   └─ Collect 5-10 inspiring designs per screen type

2. Define your screens list
   └─ Tasks list → Task detail → Add task
   └─ Issues list → Issue detail → Create report
   └─ (Future: Telegram settings, Supplier directory)

3. Google Stitch per screen (15-20 min each)
   └─ Prompt + Dribbble references → generate → iterate

4. Review all screens together
   └─ Check for consistency (colors, fonts, spacing, nav patterns)
   └─ Verify the flow makes sense screen-to-screen

5. Export final mockups
   └─ Save to docs/ux-mockups/ in this project
   └─ These become the reference for frontend implementation
```

## Key Mobile UX Considerations for This App

- **One-handed use:** Primary actions within thumb reach (bottom of screen)
- **Minimal typing:** Use dropdowns, date pickers, quick-select for urgency levels
- **Offline-friendly feel:** Fast loading, optimistic UI updates
- **RTL support:** If Hebrew UI is needed, ensure layouts mirror correctly
- **Quick capture:** Adding a task or reporting an issue should take < 30 seconds
