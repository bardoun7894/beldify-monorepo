# Task: Per-Feature AI Provider Routing

## Status

Implementation in progress

## Files to modify

1. `beldify-backend/config/ai.php` — flip default to deepseek, add provider overrides
2. `beldify-backend/app/Services/Ai/AiManager.php` — add forFeature() method
3. `beldify-backend/app/Services/Ai/ListingIntelligenceService.php` — inject AiManager
4. `beldify-backend/app/Services/Ai/SellerAiService.php` — inject AiManager
5. `beldify-backend/app/Services/Ai/BuyerAiService.php` — inject AiManager
6. `beldify-backend/app/Services/Ai/OpenSoukMatchmakerService.php` — inject AiManager
7. `beldify-backend/app/Http/Controllers/Admin/AIDescriptionController.php` — switch to forFeature()

## Feature provider mapping

- `buyer_assistant` → openrouter
- `buyer_ai` → openrouter
- `listing_ai` → openrouter
- `opensouk_matchmaker` → openrouter
- `seller_ai` → default (deepseek)
- `product_description` → default (deepseek)
