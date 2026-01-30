# Loan Reporting – User Guide

## General Setup
The loan reporting platform uses this Admin page to create loans, add loan events (prepayment, deferrals, defaults), manage the fees paid by the users, and (future) manage the users on the platform.
The user of this platform can select the user whose portfolio they want to see and visit the ROI, Earnings, and Amort Schedule pages.
The main Reporting Portal page allows user selection, also.
The ROI, Earnings, and Amort pages are primarily UI pages, and logic is controled by shared .js files.

---

## What the Admin page controls
The Loan Admin page drives all data used by the ROI, Earnings,
and Amortization views.

Changes here affect all downstream calculations.

---

## Saving changes
Edits are local until **Save Changes** is clicked.
Leaving the page without saving will discard edits.

---

## Editing loans
- Loan name, rate, term, and grace period affect amortization
- Start date determines the earnings timeline
- Changes take effect immediately after saving

---

## Ownership
Ownership determines how earnings are split across users.

Click the ownership pill to:
- Add owners
- Adjust percentages
- View historical changes

Ownership must total **100%**.

---

## Fee waivers
Fee overrides apply per loan and supersede platform defaults.

Options include:
- Setup only
- Setup + grace
- All fees
