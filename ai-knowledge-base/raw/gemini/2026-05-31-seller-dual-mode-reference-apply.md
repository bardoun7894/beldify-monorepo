---
source: gemini
model: gemini-2.5 (cli 0.40.1)
date: 2026-05-31
target: seller dashboard/orders/products + seller_shell mode switch + profile settings
scope: plan (design-application of reference UI)
---

## Prior art consulted
- design/dual-mode-dashboard.md + design/visual-reference.md (authored this session)
- Atlas design system + seller_shell + V3 components

## Gemini output

### Implementation Steps
1. **Remove Existing Toggle:** Locate and remove the `<div class="dash-density-toggle">...</div>` block.
2. **Insert Dropdown Component:** Add an Alpine.js dropdown right before the messages/notifications icon.
   - Use `tw-ms-auto` to push it to the end (RTL-aware).
   - Use `dash-mode-label-simple` and `dash-mode-label-complex` classes, managed by the existing JS, to toggle the visible label.

**Markup Pattern:**
```blade
<div x-data="{ open: false }" class="tw-relative tw-ms-auto tw-me-3">
    <button @click="open = !open" 
            class="tw-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-rounded-lg hover:tw-bg-slate-100 tw-text-sm tw-font-medium tw-text-slate-700 tw-transition tw-border tw-border-slate-200">
        <i class="la la-layer-group tw-text-indigo-600"></i>
        <span class="dash-mode-label-simple">{{ __('messages.simple_mode', 'Simple mode') }}</span>
        <span class="dash-mode-label-complex tw-hidden">{{ __('messages.advanced_mode', 'Advanced mode') }}</span>
        <i class="la la-angle-down tw-text-xs tw-text-slate-400 tw-ms-1"></i>
    </button>
    <div x-show="open" @click.away="open = false" x-transition x-cloak
         class="tw-absolute tw-end-0 tw-top-full tw-mt-1 tw-w-56 tw-bg-white tw-rounded-xl tw-shadow-lg tw-ring-1 tw-ring-black/5 tw-py-1 tw-z-50">
        
        <button type="button" data-dash-toggle="simple" @click="open = false" 
                class="tw-w-full tw-text-start tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium hover:tw-bg-indigo-50 hover:tw-text-indigo-700 tw-flex tw-items-center tw-gap-2">
            <i class="la la-th-large tw-text-lg tw-text-indigo-400"></i>
            {{ __('messages.simple_mode', 'Simple mode') }}
        </button>
        
        <button type="button" data-dash-toggle="complex" @click="open = false" 
                class="tw-w-full tw-text-start tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium hover:tw-bg-indigo-50 hover:tw-text-indigo-700 tw-flex tw-items-center tw-gap-2">
            <i class="la la-sliders-h tw-text-lg tw-text-indigo-400"></i>
            {{ __('messages.advanced_mode', 'Advanced mode') }}
        </button>
        
        <div class="tw-h-px tw-bg-slate-100 tw-my-1"></div>
        
        <a href="{{ route('seller.profile.edit') }}#dashboard-view" 
           class="tw-block tw-px-4 tw-py-2 tw-text-xs tw-text-slate-500 hover:tw-bg-slate-50 hover:tw-text-slate-700 tw-text-start">
            <i class="la la-question-circle tw-me-1"></i>{{ __('messages.whats_the_difference', "What's the difference?") }}
        </a>
    </div>
</div>
```

**New i18n Keys Needed:** `simple_mode`, `advanced_mode`, `whats_the_difference`.

---

## 2. Dashboard View Preferences Settings
**File:** `resources/views/seller/profile/edit.blade.php`

### Objective
Host the explanation and configuration of the Dashboard modes in the seller's profile settings.

### Implementation Steps
1. **Append Section:** Before the final closing `</div>` tag, append a new `x-v3.section-card`.
2. **Explain Modes:** Provide a brief explanation of Simple vs Advanced modes.
3. **Interactive Selectors:** Use styled buttons that tie into the `data-dash-toggle` functionality so clicking them updates the `localStorage` and toggles the mode live.

**Markup Pattern:**
```blade
<x-v3.section-card id="dashboard-view" title="{{ __('messages.dashboard_preferences', 'Dashboard Preferences') }}" class="tw-mt-6">
    <p class="tw-text-sm tw-text-slate-500 tw-mb-4">
        {{ __('messages.dashboard_mode_explanation', 'Choose how you want to manage your store. Simple mode shows only the essentials for daily tasks. Advanced mode reveals in-depth analytics, bulk actions, and advanced filters.') }}
    </p>
    <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        <!-- Simple Mode Option -->
        <button type="button" data-dash-toggle="simple" class="tw-text-start tw-p-4 tw-rounded-2xl tw-border-2 tw-border-slate-200 hover:tw-border-indigo-600 focus:tw-outline-none tw-transition tw-bg-white group">
            <div class="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                <span class="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-rounded-full tw-bg-indigo-50 tw-text-indigo-600 group-hover:tw-bg-indigo-600 group-hover:tw-text-white tw-transition">
                    <i class="la la-th-large tw-text-xl"></i>
                </span>
                <span class="tw-font-semibold tw-text-slate-900 tw-text-base">{{ __('messages.simple_mode', 'Simple mode') }}</span>
            </div>
            <p class="tw-text-sm tw-text-slate-500 tw-m-0">{{ __('messages.simple_mode_desc', 'Clean, beginner-friendly view focused on orders and products.') }}</p>
        </button>
        
        <!-- Advanced Mode Option -->
        <button type="button" data-dash-toggle="complex" class="tw-text-start tw-p-4 tw-rounded-2xl tw-border-2 tw-border-slate-200 hover:tw-border-indigo-600 focus:tw-outline-none tw-transition tw-bg-white group">
            <div class="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                <span class="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-rounded-full tw-bg-amber-50 tw-text-amber-600 group-hover:tw-bg-amber-500 group-hover:tw-text-white tw-transition">
                    <i class="la la-sliders-h tw-text-xl"></i>
                </span>
                <span class="tw-font-semibold tw-text-slate-900 tw-text-base">{{ __('messages.advanced_mode', 'Advanced mode') }}</span>
            </div>
            <p class="tw-text-sm tw-text-slate-500 tw-m-0">{{ __('messages.advanced_mode_desc', 'Full suite of power tools, inventory insights, and detailed reporting.') }}</p>
        </button>
    </div>
</x-v3.section-card>
```

**New i18n Keys Needed:** `dashboard_preferences`, `dashboard_mode_explanation`, `simple_mode_desc`, `advanced_mode_desc`.

---

## 3. Light Seller Home (Dashboard)
**File:** `resources/views/seller/dashboard.blade.php`

### Objective
Elevate the premium feel by utilizing soft white cards, fixing spacing, and matching the reference order rows (avatar chips, end-aligned timestamps).

### Implementation Steps
1. **Orders Row Refinement:** Update the `@forelse` loop in the "Orders to Handle" section.
2. **Structure:** Wrap the order row in a clean, modern layout utilizing Flexbox with `tw-gap`, `tw-truncate`, and RTL-friendly margins.
3. **Typography:** Use `tw-font-mono` for order numbers and `tw-text-xs` for timestamps.

**Markup Pattern:**
```blade
<div class="tw-flex tw-items-center tw-gap-3 tw-py-3.5 tw-border-b tw-border-slate-100 last:tw-border-0 group tw-transition-colors hover:tw-bg-slate-50/50 tw-rounded-xl tw-px-2 tw--mx-2">
    <!-- Icon Chip -->
    <div class="tw-flex-shrink-0 tw-w-10 tw-h-10 tw-rounded-xl tw-bg-indigo-50 tw-text-indigo-600 tw-flex tw-items-center tw-justify-center">
        <i class="la la-box tw-text-xl"></i>
    </div>
    
    <!-- Content -->
    <div class="tw-flex-1 tw-min-w-0">
        <div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
            <div class="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
                <span class="tw-text-sm tw-font-semibold tw-text-slate-900 tw-truncate">{{ $order->customer_name ?? __('messages.guest') }}</span>
                <span class="tw-text-xs tw-font-mono tw-text-slate-400">#{{ $order->order_number ?? $order->id }}</span>
            </div>
            <!-- End-aligned timestamp -->
            <span class="tw-text-xs tw-text-slate-400 tw-whitespace-nowrap tw-ms-2">{{ optional($order->created_at)->diffForHumans() }}</span>
        </div>
        <div class="tw-flex tw-items-center tw-justify-between">
            <x-v3.badge tint="amber" size="sm" icon="la la-clock">{{ __('messages.pending') }}</x-v3.badge>
            <div class="tw-flex tw-items-center tw-gap-2 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity">
                <x-v3.btn href="{{ $orderShowUrl }}" variant="soft" size="sm" class="tw-px-2 tw-py-1">
                    {{ __('messages.view') }} <i class="la la-angle-right tw-ms-1 tw-text-xs"></i>
                </x-v3.btn>
            </div>
        </div>
    </div>
</div>
```

---

## 4. Orders Index Reference Tabs & Toolbars
**File:** `resources/views/seller/orders/index.blade.php`

### Objective
Implement reference segmented count-tabs, a clean search/filter toolbar, and mobile key->value rows.

### Implementation Steps
1. **Segmented Tabs:** Wrap the light tabs in a pill-shaped container `tw-bg-slate-100 tw-p-1 tw-rounded-xl tw-inline-flex`.
2. **Tab Styling:**
   - Active: `tw-bg-white tw-shadow-sm tw-text-indigo-700`
   - Inactive: `tw-text-slate-500 hover:tw-text-slate-700`
   - Count Badge: Incorporate directly into the tab.
3. **Advanced Filters (`data-dash-section="complex"`):** Ensure status sub-tabs, export buttons, and complex filters are completely hidden in Simple mode.

**Markup Pattern (Segmented Tabs):**
```blade
<div class="tw-mb-5 tw-overflow-x-auto tw-pb-1">
    <div class="tw-inline-flex tw-items-center tw-p-1 tw-bg-slate-100 tw-rounded-xl" role="tablist">
        @foreach($lightTabs as $tab)
            @php $isActive = $activeTab === $tab['key']; @endphp
            <a href="..." 
               class="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-rounded-lg tw-whitespace-nowrap tw-transition-all {{ $isActive ? 'tw-bg-white tw-text-indigo-700 tw-shadow-sm' : 'tw-text-slate-500 hover:tw-text-slate-700 hover:tw-bg-slate-200/50' }}">
                {{ $tab['label'] }}
                <span class="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-text-[10px] tw-font-bold tw-px-1.5 tw-py-0.5 {{ $isActive ? 'tw-bg-indigo-100 tw-text-indigo-700' : 'tw-bg-slate-200 tw-text-slate-500' }}">
                    {{ $tab['count'] }}
                </span>
            </a>
        @endforeach
    </div>
</div>
```

**Order Card Mobile Enhancements:** Apply the same avatar/user chip and end-aligned timestamps design as detailed in the Dashboard Home section, ensuring the `statusTint` logic applies gracefully to the badges.

---

## 5. Products Index Card Grid & Tabs
**File:** `resources/views/seller/products/index.blade.php`

### Objective
Align with the reference count-tabs and utilize `data-dash-section="complex"` for power tools.

### Implementation Steps
1. **Status Chips -> Count Tabs:** Convert the current generic status chips to the pill-shaped segmented tabs design utilized in Orders.
2. **Advanced Toolbar (`data-dash-section="complex"`):**
   - Wrap advanced filters like bulk actions and export CSV in a section restricted to complex mode.
   - Example: `<div data-dash-section="complex" class="tw-flex tw-justify-end tw-mb-4">...</div>`
3. **Product Card Grid:** Maintain the existing `bdv3-card` logic but ensure the status badges use the same visual language (RTL logical props: `tw-end-2 tw-top-2 tw-absolute`).

**Markup Pattern (Advanced Toolbar):**
```blade
<div data-dash-section="complex" class="tw-flex tw-items-center tw-justify-between tw-mb-5 tw-p-3 tw-bg-amber-50 tw-rounded-xl tw-border tw-border-amber-100">
    <div class="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-amber-800">
        <i class="la la-chart-bar"></i>
        <span class="tw-font-medium">{{ __('messages.inventory_insights', 'Inventory Insights') }}</span>
    </div>
    <div class="tw-flex tw-gap-2">
        <x-v3.btn href="?export=true" variant="ghost" size="sm" icon="la la-file-csv">{{ __('messages.export', 'Export') }}</x-v3.btn>
        <x-v3.btn href="#bulk" variant="soft" size="sm" icon="la la-layer-group">{{ __('messages.bulk_actions', 'Bulk Actions') }}</x-v3.btn>
    </div>
</div>
```

**New i18n Keys Needed:** `inventory_insights`, `bulk_actions`.
