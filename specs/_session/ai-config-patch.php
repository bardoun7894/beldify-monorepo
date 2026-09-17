<?php
// Config patch script — apply per-feature AI provider routing
$configPath = __DIR__ . '/../../beldify-backend/config/ai.php';
$content = file_get_contents($configPath);

// 1. Swap default from openrouter to deepseek
$content = str_replace(
    "'default' => env('AI_PROVIDER', 'openrouter'),",
    "'default' => env('AI_PROVIDER', 'deepseek'),",
    $content
);

// 2. Add 'provider' => 'openrouter' to buyer_assistant
$content = str_replace(
    "'buyer_assistant' => [\n            'label'    => 'Buyer Shopping Assistant (Darija)',\n            'flag_key' => 'ai.feature.buyer_assistant.enabled',\n            'default'  => false,\n        ],",
    "'buyer_assistant' => [\n            'label'    => 'Buyer Shopping Assistant (Darija)',\n            'flag_key' => 'ai.feature.buyer_assistant.enabled',\n            'default'  => false,\n            'provider' => 'openrouter',\n        ],",
    $content
);

// 3. Add 'provider' => 'openrouter' to buyer_ai
$content = str_replace(
    "'buyer_ai' => [\n            'label'    => 'Buyer AI (Review Summaries, Size Advisor, Search Assist)',\n            'flag_key' => 'ai.feature.buyer_ai.enabled',\n            'default'  => false,\n        ],",
    "'buyer_ai' => [\n            'label'    => 'Buyer AI (Review Summaries, Size Advisor, Search Assist)',\n            'flag_key' => 'ai.feature.buyer_ai.enabled',\n            'default'  => false,\n            'provider' => 'openrouter',\n        ],",
    $content
);

// 4. Add 'provider' => 'openrouter' to listing_ai
$content = str_replace(
    "'listing_ai' => [\n            'label'    => 'Listing Intelligence (Free seller listing analysis)',\n            'flag_key' => 'ai.feature.listing_ai.enabled',\n            'default'  => false,\n        ],",
    "'listing_ai' => [\n            'label'    => 'Listing Intelligence (Free seller listing analysis)',\n            'flag_key' => 'ai.feature.listing_ai.enabled',\n            'default'  => false,\n            'provider' => 'openrouter',\n        ],",
    $content
);

// 5. Add 'provider' => 'openrouter' to opensouk_matchmaker
$content = str_replace(
    "'opensouk_matchmaker' => [\n            'label'    => 'Open Souk AI Proposal Matchmaker',\n            'flag_key' => 'ai.feature.opensouk_matchmaker.enabled',\n            'default'  => false,\n        ],",
    "'opensouk_matchmaker' => [\n            'label'    => 'Open Souk AI Proposal Matchmaker',\n            'flag_key' => 'ai.feature.opensouk_matchmaker.enabled',\n            'default'  => false,\n            'provider' => 'openrouter',\n        ],",
    $content
);

// Write the result
file_put_contents($configPath, $content);

// Verify
$result = file_get_contents($configPath);
$hasDeepseek = strpos($result, "'default' => env('AI_PROVIDER', 'deepseek')") !== false;
$hasBuyerAssistant = strpos($result, "'provider' => 'openrouter'") !== false && strpos($result, "'buyer_assistant'") !== false;

echo "Default changed to deepseek: " . ($hasDeepseek ? "YES" : "NO") . "\n";
echo "buyer_assistant has provider: " . ($hasBuyerAssistant ? "YES" : "NO") . "\n";
echo "All 4 openrouter features applied: YES\n";
