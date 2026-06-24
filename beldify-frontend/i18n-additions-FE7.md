# i18n Additions — FE-7 (Open Souk Buyer Secondary Routes)

All keys below are used via `t(key, { defaultValue })` — JSON locale files are NOT
touched. These keys are candidates for the next locale-JSON pass.

## New keys added in FE-7

### myPosts namespace

| Key | Default (EN) | Notes |
|-----|-------------|-------|
| `myPosts.pageTitle` | My Requests | Page h1 + nav breadcrumb |
| `myPosts.navLink` | My requests | Link inside community hero |
| `myPosts.cardTitle` | Your Open Souk Requests | Card heading |
| `myPosts.emptyTitle` | You haven't posted any requests yet | Empty-state heading |
| `myPosts.emptyBody` | Post a tailoring brief and Tetouani ateliers will respond with proposals. | Empty-state body |
| `myPosts.loginBody` | Your Open Souk requests are waiting — sign in to manage them. | Login-CTA body |
| `myPosts.newRequest` | New request | Hero CTA button |
| `myPosts.editNotAllowed` | Cannot edit at this stage | Disabled edit button title |
| `myPosts.closeRequest` | Close request | Close/delete row button label |
| `myPosts.confirmCloseTitle` | Close this request? | Modal title |
| `myPosts.confirmCloseBody` | Closing this request will stop new proposals from arriving. You can still view existing proposals. | Modal body |
| `myPosts.confirmCloseAction` | Yes, close it | Modal confirm button |
| `myPosts.confirmDeleteTitle` | Delete this request? | Modal title |
| `myPosts.confirmDeleteBody` | This will permanently delete the request and all attached proposals. This cannot be undone. | Modal body |
| `myPosts.confirmDeleteAction` | Yes, delete it | Modal confirm button |
| `myPosts.loadError` | Could not load your requests. Please try again. | Error state body |
| `myPosts.actionError` | Could not perform this action. Please try again. | Generic action error |
| `myPosts.actionForbidden` | You are not allowed to perform this action on this post. | 403 from close/delete |
| `myPosts.actionValidationError` | This action cannot be completed. The post may have active proposals. | 422 from close/delete |
| `myPosts.editNote` | Requests can only be edited while they are open or pending. Once a proposal is accepted, editing is disabled. | Footer helper note |

### editPost namespace

| Key | Default (EN) | Notes |
|-----|-------------|-------|
| `editPost.pageTitle` | Edit your request | Page h1 |
| `editPost.formTitle` | Update your bespoke request | Form card heading |
| `editPost.formSubtitle` | Changes will be visible to all artisans immediately | Form card subtitle |
| `editPost.photosSubtitle` | Add new photos (existing photos are retained) | Photo section subtitle |
| `editPost.existingPhotos` | Existing photos | Label above existing photo grid |
| `editPost.newPhotos` | new photo(s) to add | Label above new photo grid |
| `editPost.saveChanges` | Save changes | Submit button |
| `editPost.submitNote` | Changes will be visible to artisans immediately after saving. | Footer hint |
| `editPost.validationErrors` | Please fix the highlighted errors above. | 422 w/ field errors |
| `editPost.blockedTitle` | Editing not available | Gate heading |
| `editPost.blocked403` | You are not authorised to edit this request. It may belong to another account, or editing has been locked because a proposal was already accepted. | 403 gate message |
| `editPost.blocked422` | This request cannot be edited — it has already received responses and the edit cap has been reached. | 422/edit-cap gate message |
| `editPost.blockedStatus` | This request can only be edited while it is open or pending. | status gate message |
| `editPost.blockedUnknown` | This request cannot be edited right now. | Unknown gate fallback |

### community status labels (added to existing namespace)

| Key | Default (EN) | Notes |
|-----|-------------|-------|
| `community.statusInProgress` | In Progress | Row status chip |
| `community.statusPending` | Pending | Row status chip |
| `community.statusClosed` | Closed | Row status chip |
| `community.statusCompleted` | Completed | Row status chip |
| `community.statusRejected` | Rejected | Row status chip |
| `community.request` | request | Used in edit page breadcrumb |

## Existing keys reused (no change)

- `openSouk.eyebrow`, `openSouk.brand`, `openSouk.postCta`, `openSouk.statusOpen`
- `community.proposals`, `community.title_label`, `community.description_label`
- `community.category_label`, `community.pick_category`, `community.select_category`
- `community.skills_label`, `community.skills_help`, `community.skills_selected`
- `community.budget_section`, `community.budget_guidance`, `community.from_price`, `community.to_price`, `community.currency`
- `community.timeline_section`, `community.timeline_estimate`, `community.timeline_days`, `community.timeline_weeks`, `community.timeline_months`
- `community.section_photos`, `community.photos_help`, `community.drag_drop_images`, `community.drag_photos_here`
- `community.or_click_to_select`, `community.drop_zone_label`, `community.image_preview_alt`, `community.images_attached`
- `community.error_title_min_length`, `community.error_description_min_length`, `community.error_category_required`, `community.error_invalid_budget`
- `community.error_image_size`, `community.error_image_type`, `community.error_creating_post`
- `community.view_request`, `community.create_post`
- `common.loading`, `common.cancel`, `common.edit`, `common.view`, `common.delete`, `common.remove`, `common.dismiss`, `common.saving`, `common.back_to`, `common.retry`
- `common.errorTitle`, `auth.sign_in`, `auth.signInRequired`
