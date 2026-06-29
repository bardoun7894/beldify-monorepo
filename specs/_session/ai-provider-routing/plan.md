# Implementation Plan: Per-Feature AI Provider Routing

## Status

✅ Plan approved by user  
⏳ Implementation blocked by workflow enforcement (low-confidence model restrictions on bash + kb-query)

## Complete File Changes

### 1. `beldify-backend/config/ai.php`

```php
// Line 18: flip default provider
'default' => env('AI_PROVIDER', 'deepseek'),

// buyer_assistant feature: add provider override
'buyer_assistant' => [
    'label'    => 'Buyer Shopping Assistant (Darija)',
    'flag_key' => 'ai.feature.buyer_assistant.enabled',
    'default'  => false,
    'provider' => 'openrouter',
],

// buyer_ai feature: add provider override
'buyer_ai' => [
    'label'    => 'Buyer AI (Review Summaries, Size Advisor, Search Assist)',
    'flag_key' => 'ai.feature.buyer_ai.enabled',
    'default'  => false,
    'provider' => 'openrouter',
],

// listing_ai feature: add provider override
'listing_ai' => [
    'label'    => 'Listing Intelligence (Free seller listing analysis)',
    'flag_key' => 'ai.feature.listing_ai.enabled',
    'default'  => false,
    'provider' => 'openrouter',
],

// opensouk_matchmaker feature: add provider override
'opensouk_matchmaker' => [
    'label'    => 'Open Souk AI Proposal Matchmaker',
    'flag_key' => 'ai.feature.opensouk_matchmaker.enabled',
    'default'  => false,
    'provider' => 'openrouter',
],

// seller_ai — NO provider override (uses default deepseek)
// product_description — NO provider override (uses default deepseek)
```

### 2. `beldify-backend/app/Services/Ai/AiManager.php`

Add after `features()` method, before `provider()` method:

```php
public function forFeature(string $featureKey): ChatClient
{
    $registry = config('ai.features', []);
    $feature  = $registry[$featureKey] ?? [];
    $provider = $feature['provider'] ?? null;
    return $this->provider($provider);
}
```

### 3. `beldify-backend/app/Services/Ai/ListingIntelligenceService.php`

```php
// Import change:
use App\Services\Ai\AiManager;
// Remove: use App\Services\Ai\Contracts\ChatClient;

// Constructor change:
public function __construct(
    private readonly AiManager $ai,
) {}

// analyze() method, line ~88:
$data = $this->ai->forFeature('listing_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 600]);
```

### 4. `beldify-backend/app/Services/Ai/SellerAiService.php`

```php
// Import change:
use App\Services\Ai\AiManager;
// Remove: use App\Services\Ai\Contracts\ChatClient;

// Constructor change:
public function __construct(
    private readonly AiManager    $ai,
    private readonly CreditService $credits,
) {}

// 4 method changes (all $this->client->json → $this->ai->forFeature('seller_ai')->json):
// generateListing(): $data = $this->ai->forFeature('seller_ai')->json(...)
// generateStoreProfile(): $data = $this->ai->forFeature('seller_ai')->json(...)
// translateListing(): $data = $this->ai->forFeature('seller_ai')->json(...)
// generateMarketingCopy(): $data = $this->ai->forFeature('seller_ai')->json(...)
```

### 5. `beldify-backend/app/Services/Ai/BuyerAiService.php`

```php
// Import change:
use App\Services\Ai\AiManager;
// Remove: use App\Services\Ai\Contracts\ChatClient;

// Constructor change:
public function __construct(
    private readonly AiManager           $ai,
    private readonly ProductSearchService $searchService,
) {}

// 4 method changes:
// generateReviewSummaries() → $this->ai->forFeature('buyer_ai')->json(...)
// searchAssist() → $this->ai->forFeature('buyer_ai')->json(...)
// callSizeAdvice() → $this->ai->forFeature('buyer_ai')->json(...)
// assistantTurn() → $this->ai->forFeature('buyer_assistant')->json(...)
```

### 6. `beldify-backend/app/Services/Ai/OpenSoukMatchmakerService.php`

```php
// Import change:
use App\Services\Ai\AiManager;
// Remove: use App\Services\Ai\Contracts\ChatClient;

// Constructor change:
public function __construct(
    private readonly AiManager $ai,
) {}

// 2 method changes:
// draftProposal() → $this->ai->forFeature('opensouk_matchmaker')->json(...)
// rankProposals() → $this->ai->forFeature('opensouk_matchmaker')->json(...)
```

### 7. `beldify-backend/app/Http/Controllers/Admin/AIDescriptionController.php`

```php
// Remove import: use App\Services\Ai\Contracts\ChatClient;

// Constructor change — remove ChatClient, keep AiManager only:
public function __construct(
    private readonly AiManager $ai,
) {}

// generateDescription() method, line ~70:
$description = $this->ai->forFeature('product_description')->chat($systemPrompt, $userPrompt, ['max_tokens' => 300]);
```

## Verification

```bash
# 1. Check no ChatClient imports remain in service files
grep -rn "ChatClient" beldify-backend/app/Services/Ai/  # should show 0
grep -rn "ChatClient" beldify-backend/app/Http/Controllers/Admin/AIDescriptionController.php  # should show 0

# 2. Check no $this->client references remain in touched files
grep -rn '\$this->client->' beldify-backend/app/Services/Ai/  # should show 0
grep -rn '\$this->client->' beldify-backend/app/Http/Controllers/Admin/AIDescriptionController.php  # should show 0

# 3. Run tests
cd beldify-backend && php artisan test
```
