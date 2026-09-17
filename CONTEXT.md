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
A named person responsible for a line item. An owner assignment is shared across the Estimate, Manager, and Plan views and does not change effort, contingency, or planning calculations.
_Avoid_: Assignee when referring to the estimate domain

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
