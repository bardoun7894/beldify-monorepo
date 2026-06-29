# Per-Feature AI Provider Routing — Complete Implementation Reference

## Overview

7 files need changes. This document contains the exact edits for each file.

---

## 1. config/ai.php

### Change A — Flip default provider

```diff
- 'default' => env('AI_PROVIDER', 'openrouter'),
+ 'default' => env('AI_PROVIDER', 'deepseek'),
```

### Change B — Add `'provider' => 'openrouter'` to 4 features

**buyer_assistant:**

```diff
  'buyer_assistant' => [
      'label'    => 'Buyer Shopping Assistant (Darija)',
      'flag_key' => 'ai.feature.buyer_assistant.enabled',
      'default'  => false,
+     'provider' => 'openrouter',
  ],
```

**buyer_ai:**

```diff
  'buyer_ai' => [
      'label'    => 'Buyer AI (Review Summaries, Size Advisor, Search Assist)',
      'flag_key' => 'ai.feature.buyer_ai.enabled',
      'default'  => false,
+     'provider' => 'openrouter',
  ],
```

**listing_ai:**

```diff
  'listing_ai' => [
      'label'    => 'Listing Intelligence (Free seller listing analysis)',
      'flag_key' => 'ai.feature.listing_ai.enabled',
      'default'  => false,
+     'provider' => 'openrouter',
  ],
```

**opensouk_matchmaker:**

```diff
  'opensouk_matchmaker' => [
      'label'    => 'Open Souk AI Proposal Matchmaker',
      'flag_key' => 'ai.feature.opensouk_matchmaker.enabled',
      'default'  => false,
+     'provider' => 'openrouter',
  ],
```

---

## 2. AiManager.php — Add forFeature() method

Add this method between `features()` and `provider()`:

```php
    /**
     * Resolve a ChatClient for the named AI feature, respecting any
     * per-feature provider override configured in config/ai.php.
     *
     * When no provider override is set for the feature, falls back to
     * the default provider (config('ai.default')).
     *
     * @throws \InvalidArgumentException for unknown drivers.
     */
    public function forFeature(string $featureKey): ChatClient
    {
        $registry = config('ai.features', []);
        $feature = $registry[$featureKey] ?? [];
        $providerOverride = $feature['provider'] ?? null;

        return $this->provider($providerOverride);
    }
```

---

## 3. ListingIntelligenceService.php — Inject AiManager

Constructor change:

```diff
- use App\Services\Ai\Contracts\ChatClient;
+ use App\Services\Ai\AiManager;
```

```diff
  public function __construct(
-     private readonly ChatClient $client,
+     private readonly AiManager $ai,
  ) {}
```

Method call change (line ~100):

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 600]);
+ $data = $this->ai->forFeature('listing_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 600]);
```

---

## 4. SellerAiService.php — Inject AiManager

Constructor change:

```diff
- use App\Services\Ai\Contracts\ChatClient;
+ use App\Services\Ai\AiManager;
```

```diff
  public function __construct(
-     private readonly ChatClient    $client,
+     private readonly AiManager     $ai,
      private readonly CreditService $credits,
  ) {}
```

Method call changes (4 calls):

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 1500]);
+ $data = $this->ai->forFeature('seller_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 1500]);
```

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 800]);
+ $data = $this->ai->forFeature('seller_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 800]);
```

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 1000]);
+ $data = $this->ai->forFeature('seller_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 1000]);
```

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 500]);
+ $data = $this->ai->forFeature('seller_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 500]);
```

---

## 5. BuyerAiService.php — Inject AiManager (dual feature keys)

Constructor change:

```diff
- use App\Services\Ai\Contracts\ChatClient;
+ use App\Services\Ai\AiManager;
```

```diff
  public function __construct(
-     private readonly ChatClient           $client,
+     private readonly AiManager            $ai,
      private readonly ProductSearchService $searchService,
  ) {}
```

Method call changes (4 calls):

**generateReviewSummaries** (line ~121) → `buyer_ai`:

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 1500]);
+ $data = $this->ai->forFeature('buyer_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 1500]);
```

**searchAssist** (line ~215) → `buyer_ai`:

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 400]);
+ $data = $this->ai->forFeature('buyer_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 400]);
```

**callSizeAdvice** / **sizeAdvice** (line ~398) → `buyer_ai`:

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 300]);
+ $data = $this->ai->forFeature('buyer_ai')->json($systemPrompt, $userPrompt, ['max_tokens' => 300]);
```

**assistantTurn** (line ~484) → `buyer_assistant` ⚠️ DIFFERENT FEATURE KEY:

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 600]);
+ $data = $this->ai->forFeature('buyer_assistant')->json($systemPrompt, $userPrompt, ['max_tokens' => 600]);
```

---

## 6. OpenSoukMatchmakerService.php — Inject AiManager

Constructor change:

```diff
- use App\Services\Ai\Contracts\ChatClient;
+ use App\Services\Ai\AiManager;
```

```diff
  public function __construct(
-     private readonly ChatClient $client,
+     private readonly AiManager  $ai,
  ) {}
```

Method call changes (2 calls):

**draftProposal** (line ~53):

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 600]);
+ $data = $this->ai->forFeature('opensouk_matchmaker')->json($systemPrompt, $userPrompt, ['max_tokens' => 600]);
```

**rankProposals** (line ~114):

```diff
- $data = $this->client->json($systemPrompt, $userPrompt, ['max_tokens' => 800]);
+ $data = $this->ai->forFeature('opensouk_matchmaker')->json($systemPrompt, $userPrompt, ['max_tokens' => 800]);
```

---

## 7. AIDescriptionController.php — Remove ChatClient, use product_description

Import change:

```diff
- use App\Services\Ai\Contracts\ChatClient;
```

Constructor change:

```diff
  public function __construct(
-     private readonly ChatClient $client,
      private readonly AiManager $ai,
  ) {}
```

Method call change (line ~47):

```diff
- $description = $this->client->chat($systemPrompt, $userPrompt, ['max_tokens' => 300]);
+ $description = $this->ai->forFeature('product_description')->chat($systemPrompt, $userPrompt, ['max_tokens' => 300]);
```

---

## Verification

After changes:

```bash
# 1. Check no stray ChatClient references remain in the 5 switched files
grep -rn "ChatClient" beldify-backend/app/Services/Ai/  # should show 0
grep -rn '\$this->client->' beldify-backend/app/Services/Ai/  # should show 0

# 2. Check AIDescriptionController no longer imports ChatClient
grep "ChatClient" beldify-backend/app/Http/Controllers/Admin/AIDescriptionController.php  # should show 0

# 3. Run tests
cd beldify-backend && php artisan test
```
