# HowLong domain context

HowLong helps teams estimate, plan, analyze, compare, and deliver project work. These terms describe the same estimate across its editing, planning, and presentation surfaces.

## Estimate and work structure

**Estimate**:
A complete project-effort document containing work structure, effort, contingency, formulas, notes, labels, metadata, and planning information.
_Avoid_: Session, model

**Session**:
One open working instance of an estimate, with its own unsaved changes and editing history.
_Avoid_: Estimate file, workspace

**Model**:
A reusable template used as the starting point for a new estimate. Later changes to a model do not change estimates already created from it.
_Avoid_: Estimate

**Line item**:
One row of work in an estimate. It is the generic term for a macro, subtask, or formula.
_Avoid_: Activity when referring to the estimate hierarchy

**Macro**:
A top-level work item in an estimate. A macro may contain subtasks or represent a standalone item.
_Avoid_: Parent task when referring to the top-level item

**Subtask**:
A child line item belonging to a macro.
_Avoid_: Child activity, nested task

**Formula**:
A calculated line item whose effort is derived from other line items and a formula rule.
_Avoid_: Calculated item when the line item is specifically formula-driven

**Owner**:
A named person responsible for a line item. A line item may have one or more owners, and the owner assignment is shared across the Estimate, Manager, and Plan views without changing effort, contingency, or planning calculations.
_Avoid_: Assignee when referring to the estimate domain

**Multi-owner line item**:
A line item with multiple owners who share equal responsibility. For owner distribution, the line item's effort is divided equally among its owners so owner totals remain consistent with the estimate total.
_Avoid_: Primary owner, secondary owner, weighted owner

**Owner allocation share**:
The percentage of one line item's effort attributed to a selected owner. It is 100% for a sole owner and is divided equally for a multi-owner line item.
_Avoid_: Owner total incidence, task share

**Owner total incidence**:
The percentage of a selected owner's distributed effort represented by one contributing line item. In the Analytics owner detail, this is the existing `Effort` percentage.
_Avoid_: Owner allocation share, task allocation

**Owner distribution**:
A read-only projection of effort grouped by owner. It uses the most specific contributing work level when a macro contains subtasks, so parent and child effort is not counted twice. An unassigned line item remains part of the unassigned distribution.
_Avoid_: Owner workload duplication

**Multi-owner mode**:
A workspace capability that allows a line item to have multiple owners. It is disabled by default. Existing multi-owner assignments remain visible but cannot be edited while the capability is disabled.
_Avoid_: Per-estimate owner mode

**Base effort**:
The calculated amount of work before contingency is applied.
_Avoid_: Raw effort, net effort

**Contingency (CTG)**:
The risk allowance applied to eligible base effort.
_Avoid_: Buffer when referring to the estimate calculation

**Total**:
The base effort plus its applicable contingency.
_Avoid_: Final effort when the contingency is included

**Planning range**:
The scheduled start and end date interval for a line item. It represents calendar duration, not estimated effort or work hours.
_Avoid_: Effort range, estimate duration

**Planning coverage**:
The share of contributing operational effort whose line items have a planning range. It describes whether estimated work has been placed on the calendar; it does not measure progress, capacity, or schedule quality.
_Avoid_: Completion, utilization, schedule health

**Unassigned effort**:
Contributing operational effort belonging to active line items with no owners. It is independent of planning coverage: an unassigned line item may be planned or unplanned.
_Avoid_: Unplanned effort, uncovered effort

**Estimate order**:
The hierarchy order of macros and their descendants in the estimate. Analytics line-item lists and category groups preserve this order unless the surface is explicitly an owner comparison ranked by effort.
_Avoid_: Effort order, alphabetical order

## Views and presentations

**Estimate view**:
The canonical editing experience for an estimate. It edits the hierarchy, effort, contingency, formulas, notes, labels, metadata, and line-item owners.
_Avoid_: Estimator view when naming the product surface

**Manager view**:
An internal presentation layer for preparing an estimate for sharing. It can control visibility, notes, labels, rounding, redistributed values, presented totals, and line-item owners without changing the estimate's calculation logic.
_Avoid_: Admin view, internal estimate

**Client view**:
A filtered, client-facing presentation derived from the same estimate and Manager settings. It is read-only for the recipient and may omit internal rows, subtasks, notes, labels, owners, or other details.
_Avoid_: Client estimate, customer estimate

**Client preview**:
The entry point that shows the Manager and Client presentation modes.
_Avoid_: Client view when referring to the preview surface

**Presentation status**:
An independent progress marker for the Estimate, Manager, or Client presentation of an estimate. Its values are Draft, In progress, Ready for revision, and Verified; it describes readiness, not line-item scheduling progress.
_Avoid_: Line-item status, Gantt status, approval state

**Plan/Gantt view**:
The scheduling surface for dates, statuses, owners, colors, notes, and planning ranges. It may edit planning data but does not recalculate effort or contingency.
_Avoid_: Timeline view when referring to the product surface

**Analytics view**:
A read-only projection of the active estimate's effort, contingency, and owner distribution. Selecting an owner reveals the contributing line items without changing the estimate.
_Avoid_: Reports view

**Compare view**:
A read-only side-by-side comparison of the last saved versions of multiple estimates, aligned by stable line-item identity. Unsaved session changes are excluded.
_Avoid_: Diff view when comparing estimate versions

## Storage contexts

**Library**:
The local collection of saved estimates and the place where users browse, open, and manage them.
_Avoid_: Workspace

**Workspace**:
The selected storage context for a user's settings, models, and estimates. Switching workspaces changes the active storage context; it does not merge documents.
_Avoid_: Project, account
