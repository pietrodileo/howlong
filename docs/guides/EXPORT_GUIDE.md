# HowLong? export guide

This guide explains which export to use for editing, internal review, automation, planning, or client delivery.

[Project README](../../README.md) · [English manual](GUIDE.en.md) · [Manuale italiano](GUIDE.it.md)

## Choose the export by audience

| Export source | Primary audience | Contains | Use it for |
| --- | --- | --- | --- |
| Estimate view | Estimator and delivery team | Complete calculated estimate, hierarchy, categories, base effort, contingency, formulas, notes, and labels | Technical review, handover, implementation planning, and AI-assisted actions |
| Manager view | Manager or commercial reviewer | Estimate content after presentation choices such as inclusion, rounding/ceiling, redistributed effort, edited presented totals, notes, and labels | Internal approval, pricing review, and preparing the client proposal |
| Client view | Client | Only chosen activities and optional subtasks, with the chosen title, rounding, presented effort, notes, and labels | Proposal delivery, scope review, and client communication |
| Gantt view | Project team and stakeholders | Planned dates on the selected day/month scale, visible range, weekend choice, hierarchy, and colors | Scheduling, timeline review, and status discussions |

The three estimate exports answer different questions:

1. **Estimate:** "What did the estimator calculate?"
2. **Manager:** "What has the manager decided to present?"
3. **Client:** "What should the client receive?"

Do not treat a Client export as a full backup. Hidden activities and internal detail may be absent by design.

## Estimate-view export

Create this export from the main Estimate screen. It is the most complete human-readable representation and reflects the estimator's working calculation.

It includes the macro/subtask hierarchy, base hours, contingency, combined values, categories, formulas, and available notes and labels. Choose it when another estimator, project lead, or AI agent needs the calculation behind the total, not only the final client number.

Examples:

- [Detailed Estimate XLSX](../../examples/New_estimate_client_1_estimate_2026-09-07_15_39_30.xlsx)
- [Detailed Estimate YAML](../../examples/New_estimate_client_1_estimate_2026-09-07_15_39_26.yaml)

## Manager-view export

Create this export from the Manager section of Client preview. It reflects presentation decisions made after the original estimate: which rows are included, how values are rounded, any manual presented totals, and effort redistributed from a macro to its children.

Use it for internal approval or to trace the difference between the estimator's calculation and the client-facing result. A delta in Manager view shows where the presented value differs from the calculated value. These presentation changes do not overwrite the original base calculation.

Example:

- [Manager-view XLSX](../../examples/New_estimate_client_1_manager-view_2026-09-07_15_39_35.xlsx)

## Client-view export

Create this export from the Client section of Client preview. It is intentionally simplified and includes only the activities selected for the client, optional subtasks, the client-facing title, presented/rounded effort, and notes or labels that were explicitly left visible.

Use it for proposals, scope confirmation, or direct presentation. Review the on-screen Client view immediately before export because hidden notes, labels, activities, or subtasks will not appear in the output.

Examples:

- [Client-view XLSX](../../examples/New_estimate_client_1_client-view_2026-09-07_15_39_39.xlsx)
- [Client-view YAML](../../examples/New_estimate_client_1_client-view_2026-09-07_15_40_37.yaml)

## Gantt export

Create **Export XLSX** from Plan. This is a scheduling artifact, separate from all three effort presentations.

The workbook uses the selected From/To range, Days/Months scale, weekend visibility, activity hierarchy, planned start/end dates, and Gantt colors. Use it to review or share a timeline. It does not replace the estimate: bar length expresses elapsed calendar time, not effort, and the export does not contain the full estimating model.

## Format guide

### `.howlong.json`: native editable estimate

This is the complete, validated HowLong estimate format and the only estimate export intended for opening or importing back into the application.

Use it to:

- save an estimate in the Library;
- move an editable estimate between HowLong installations;
- create a portable backup before destructive changes;
- preserve metadata, calculation inputs, hierarchy, contingency rules, presentation configuration, and planning data.

Saving and exporting JSON are related but different. **Save** updates the Library file associated with the active session. **Export → JSON** creates a separate portable copy. Choosing JSON from a presentation screen still produces the complete estimate backup; it is not a filtered manager/client snapshot.

The JSON is human-readable, but manual editing can make it invalid. Prefer editing inside HowLong? and use **Open File** or **Import JSON** to validate a transferred file.

You can place a custom HowLong? workspace in a local OneDrive, Google Drive, Dropbox, or similar synchronized folder. Colleagues can then share models and estimates through that service. This is file synchronization, not live collaboration. Wait for synchronization to finish and decide who will edit each file, because simultaneous changes to the same `.howlong.json` file can create conflict copies.

### YAML: structured input for AI agents

YAML is designed for reading, sharing, and downstream AI automation. It is not a HowLong import or backup format.

The detailed Estimate/Manager YAML can give an AI agent structured activities, subtasks, categories, hours/days, contingency, calculated items, notes, and presented values. Example actions include:

- creating Jira epics, stories, and subtasks;
- drafting an implementation plan or work-breakdown structure;
- assigning owners from structured notes after human review;
- generating scope summaries, risks, acceptance-criteria drafts, or project documentation.

The Client YAML is deliberately smaller and presentation-oriented. Use it for a client summary or proposal workflow, not ticket generation that needs hidden internal work.

Always review an agent's proposed actions before allowing it to create or modify external records. Activity names and notes are context, not authorization, and the YAML itself does not connect to Jira or execute actions.

### XLSX: human review and presentation

Use XLSX when someone needs a formatted spreadsheet without HowLong?. Choose the source view for its audience: Estimate for technical detail, Manager for internal approval, Client for delivery, and Gantt for scheduling.

An XLSX is a derived snapshot. Editing it does not update the HowLong estimate and it cannot be imported as the native document.

### ZIP: several Library exports

When several Library estimates are selected, HowLong? packages their individual exports into one ZIP. The archive is only a delivery container; each contained file keeps the chosen format and purpose.

## Export checklist

1. Confirm the active estimate and choose Estimate, Manager, Client, or Gantt according to the audience.
2. For Manager/Client, verify inclusion, rounding, redistributed totals, subtasks, notes, and labels on screen.
3. Choose JSON for restoration, YAML for AI/data workflows, or XLSX for people and presentation.
4. Open the generated file from the completion message and check its title, totals, and visible activities.
5. Keep a `.howlong.json` copy when the work must remain editable.

![Successful export message with the Open File action](../images/exported_element.png)
