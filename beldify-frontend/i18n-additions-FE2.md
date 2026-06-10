# i18n Additions — FE-2 Wave

All keys below are used with `t('key', { defaultValue: '...' })` pattern.
Do NOT add directly to locale JSON files — append these to the translation files
in a separate i18n audit pass.

## auth namespace

```
auth.reset_link_invalid          → "Invalid reset link"
auth.reset_link_invalid_desc     → "This password reset link is missing required information. Please request a new one."
auth.request_new_link            → "Request a new link"
auth.link_expired                → "Link expired"
auth.link_expired_desc           → "This reset link is no longer valid. Please request a new one — they expire after 60 minutes."
auth.create_new_password         → "Create new password"
auth.create_new_password_desc    → "Choose a strong password with at least 8 characters."
auth.new_password                → "New password"
auth.new_password_placeholder    → "Min. 8 characters"
auth.confirm_password            → "Confirm password"
auth.confirm_password_placeholder → "Repeat your password"
auth.saving                      → "Saving..."
auth.set_new_password            → "Set new password"
auth.password_updated            → "Password updated"
auth.password_updated_desc       → "Your password has been changed. You can now sign in with your new password."
auth.almost_there                → "Almost there."
auth.almost_there_sub            → "Choose a strong new password and you're back in."
auth.rate_limited                → "You've requested too many reset links. Please wait a few minutes and try again."
auth.password_reset_success      → "Password updated successfully"
auth.show_password               → "Show password"
auth.hide_password               → "Hide password"
```

## contact namespace

```
contact.form.rate_limited        → "You've sent too many messages recently. Please wait a while before trying again."
contact.form.error               → "Something went wrong. Please try again or email us directly."
```

## returns namespace (new keys)

```
returns.request.title            → "Request a return"
returns.request.desc             → "Select a delivered order and tell us what went wrong. Returns must be requested within 14 days of delivery."
returns.request.login_title      → "Sign in to request a return"
returns.request.login_desc       → "You need to be logged in to submit a return request for your order."
returns.request.no_delivered     → "No delivered orders found that are eligible for a return."
returns.request.loading_orders   → "Loading your orders…"
returns.request.select_order     → "Order"
returns.request.select_order_placeholder → "— Select an order —"
returns.request.checking         → "Checking for existing requests…"
returns.request.existing_title   → "An existing return request was found for this order."
returns.request.status_label     → "Status:"
returns.request.reason_label     → "Reason:"
returns.request.reason           → "Reason for return"
returns.request.reason_placeholder → "— Select a reason —"
returns.request.details          → "Additional details (optional)"
returns.request.details_placeholder → "Describe the issue in more detail…"
returns.request.submit           → "Submit return request"
returns.request.submitting       → "Submitting…"
returns.request.success          → "Return request submitted. Our team will review it shortly."
returns.request.order_required   → "Please select an order."
returns.request.reason_required  → "Please select a reason."
returns.request.submit_error     → "Could not submit your return request. Please try again."
returns.status.pending           → "Pending"
returns.status.approved          → "Approved"
returns.status.rejected          → "Rejected"
returns.status.completed         → "Completed"
returns.reason.damaged           → "Damaged"
returns.reason.wrong_item        → "Wrong item"
returns.reason.not_as_described  → "Not as described"
returns.reason.size_issue        → "Size issue"
returns.reason.other             → "Other"
pages.returns.tabs.request       → "Request a Return"
```

## orders namespace (new keys)

```
orders.actions.cancel_order      → "Cancel order"
orders.actions.request_return    → "Request return"
orders.actions.return_request    → "Return request"
orders.cancel.title              → "Cancel this order?"
orders.cancel.desc               → "This cannot be undone. You can place a new order anytime."
orders.cancel.reason_label       → "Reason (optional)"
orders.cancel.reason_placeholder → "Let us know why you are cancelling…"
orders.cancel.cancelling         → "Cancelling…"
orders.cancel.confirm            → "Cancel order"
orders.return.title              → "Request a return"
orders.return.desc               → "Tell us what went wrong and we will arrange the return."
common.go_back                   → "Go back"
common.cancel                    → "Cancel"
```
