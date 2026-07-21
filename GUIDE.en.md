# User guide — HowLong?

**Effort, made obvious.**

Practical guide to estimating projects with HowLong? (version 0.1).  
Author: **Pietro Di Leo**.

---

## 1. What is HowLong?

HowLong? is a **desktop** app (Windows) for building **project estimates** as tables:

- line items with hours (or days),
- **contingency** (CTG, risk margin) visible at a glance,
- reusable **models**,
- an on-disk **library** of estimates,
- a **client view** and **export** in several formats.

It is not Excel: it is built so you always see *base*, *CTG*, and *total with CTG* side by side.

---

## 2. Getting started

1. Launch HowLong? (Windows installer, or `npm run tauri:dev` in development).
2. Open **Settings** and pick **language** (IT/EN) and **theme** (light/dark). Click **Save**.
3. (Optional) Set a custom **estimates folder**; otherwise HowLong uses the app data folder.
4. Go to **Models** and create (or edit) a macro-activity model.
5. Go to **Estimate** and create a new estimate from that model.

---

## 3. Navigation

Sidebar:

| Item | Purpose |
|------|---------|
| **Estimate** | Editor for the current estimate |
| **Library** | Estimates saved on your PC |
| **Models** | Reusable templates |
| **Settings** | Language, theme, folder, workspace import/export |
| **About** | Version, aim, credit |

---

## 4. Models

A **model** is the skeleton of an estimate: macro activities, categories, default contingency, icon.

### What to do

1. **New model** → name it and pick an **icon**.
2. Add **macro activities** (name, category, default hours).
3. For each line: tick **Apply CTG** if it should receive global contingency.
4. Add any **derived lines** (formulas, e.g. Project Management = % of other lines).
5. Set default CTG % and mode (project / categories / custom).
6. **Save** the model.
7. Use **“use for new estimate”** (or New in Estimate) to spawn an estimate.

New estimates **inherit the model’s icon**.

---

## 5. Estimate (Working)

This is the day-to-day workspace.

### Header

- Editable **icon** + **title**.
- Actions: **New** (from model), **Open**, **Save** (to library), **Export**, **Client view**.

### Live contingency

At the top you can change:

- session **CTG %**,
- **mode** (whole project, selected categories, custom),
- **placement** (inline columns, separate row, or both).

Totals and columns update immediately.

### Line table

Typical columns:

| Column | Meaning |
|--------|---------|
| Name | Macro or sub-task |
| Category | Grouping |
| Hours / Days | Base effort |
| **Apply CTG** | Whether the line enters CTG calculation |
| CTG | Contingency hours |
| With CTG | Base + CTG |
| Custom CTG % | Per-line % override |
| Notes | Free text |
| Client | Visible in client view |
| Actions | Add task, duplicate, delete, edit formula |

Tips:

- **Add sub-task** under a macro: the macro hours become the sum of children.
- **Duplicate**: clones the row (and children if it is a macro). Names like `(copy)`, `(copy 2)`, …
- **Notes**: edit in-cell; **double-click** opens a larger editor (Ctrl+Enter to save).
- **Columns**: resize; double-click a header to collapse.
- **Apply CTG** on a macro: the flag cascades to sub-tasks.

### Derived lines (formulas)

A **formula** line computes:

`aggregation(selected lines) × percent`

Aggregations: sum, average, min, max.

By default formulas **do not** get global CTG; tick **Apply CTG** if needed.

Typical uses: separate Contingency line, Project Management, overhead.

### Compare CTG

From the summary, **Compare CTG** opens three A/B/C scenarios (defaults in ascending order, e.g. 10 / 20 / 30).  
Edit them and press **Use** to apply a % to the estimate (session only until you save).

### Units

Hours or person-days. You can set how many **hours = 1 day** for this estimate. Totals often show both **h** and **D**.

---

## 6. Client view

From Estimate, open **Client view**.

Use it to present a cleaner version:

- only lines marked client-visible,
- selectable **rounding**,
- hours/days unit,
- presented totals (h and D).

### Notes in client view

- Notes are **hidden by default** (`Hide notes` on).
- If you uncheck it: you see a truncated preview; **click** opens the editor so you can edit notes (handy in a client meeting).
- The same flag also affects client-view export.

Dedicated export: **YAML** and **Excel**.

---

## 7. Library

Holds saved `.howlong.json` files on your PC.

### Managing the list

- **Search** by title or client.
- **Rename** in the name field (Enter / blur → saves).
- Change the **icon** with the picker.
- **Open** loads the estimate into Working.
- **Delete** removes the file from the folder.

### Selection, export, import

1. Select one or more estimates (checkboxes, or Select all).
2. **Export** → JSON (HowLong), YAML, or Excel:
   - **1 estimate** → a single file,
   - **2+ estimates** → one **ZIP** with one file per estimate.
3. **Import JSON** → pick one or more HowLong files; they are copied into the library. If an id already exists, a new id is assigned.

---

## 8. Settings

| Setting | Effect |
|---------|--------|
| Language | UI IT or EN |
| Appearance | Light / dark theme |
| Username | Label for this settings profile |
| Estimates folder | Where the Library lives |
| Import / Export | Workspace: settings + all models |

Remember to **Save** changes you want permanent (language and theme preview immediately).

---

## 9. File formats (when to use which)

| Format | When |
|--------|------|
| **HowLong JSON** | Backup / restore in the app; Library import |
| **YAML** | Human or AI reading — **not** re-imported as a HowLong estimate |
| **Excel (XLSX)** | Sharing with spreadsheet users |
| **CSV** | Tabular exchange where needed |
| **ZIP** | Library only: export several estimates together |

---

## 10. Recommended flow (checklist)

1. Prepare a **model** with your usual macros.
2. Create an **estimate** from it; set title and icon.
3. Fill hours / sub-tasks / notes.
4. Tune **CTG** and, if useful, **Compare CTG**.
5. Check **Apply CTG** and **Client** flags on lines.
6. Open **Client view**, round, hide or show notes.
7. **Save** to the Library.
8. **Export** JSON (backup), YAML/Excel (sharing), or from Library as ZIP for many estimates.

---

## 11. FAQ

**Where is my estimate saved?**  
In the Library (configured folder or app data), file `{id}.howlong.json`.

**Why don’t I see notes in client view?**  
They are hidden by default: turn off **Hide notes**.

**CTG is not applied to a line?**  
Check **Apply CTG** and the mode (project / categories / override).

**Can I undo Compare CTG → Use?**  
“Use” changes the session %; if you have not saved, restore the % manually or reopen the last saved version.

**Does the app work without the desktop shell?**  
The UI can run in a browser during development, but Save / dialogs / Library need the Tauri app.

---

## 12. Help and references

- **README.md** — setup, build, technical decisions  
- **SPEC.md** — detailed requirements and behaviour  
- **About** in the app — version and credit  

---

*HowLong? — Pietro Di Leo*
