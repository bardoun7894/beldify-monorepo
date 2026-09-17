<?php
// Patch SellerAiService.php — switch ChatClient -> AiManager
$path = __DIR__ . '/../../beldify-backend/app/Services/Ai/SellerAiService.php';
$content = file_get_contents($path);

// 1. Fix imports: remove ChatClient, add AiManager
$content = str_replace(
    "use App\Models\Store;
use App\Services\Ai\Contracts\ChatClient;",
    "use App\Models\Store;
use App\Services\Ai\AiManager;",
    $content
);

// 2. Fix constructor + property
$content = str_replace(
    '    public function __construct(
        private readonly ChatClient    $client,
        private readonly CreditService $credits,
    ) {}',
    '    public function __construct(
        private readonly AiManager     $ai,
        private readonly CreditService $credits,
    ) {}',
    $content
);

// 3. Fix all $this->client->json() calls
$count = 0;
$patterns = [
    'generateListing' => 'seller_ai',
    'generateStoreProfile' => 'seller_ai',
    'translateListing' => 'seller_ai',
    'generateMarketingCopy' => 'seller_ai',
];

foreach ($patterns as $method => $feature) {
    $search = "\$this->client->json(\$systemPrompt, \$userPrompt, ['max_tokens' =>";
    $replace = "\$this->ai->forFeature('{$feature}')->json(\$systemPrompt, \$userPrompt, ['max_tokens' =>";
    
    // Only replace within the method's scope using context clues
    $content = str_replace($search, $replace, $content, $count);
}

// Handle any remaining $this->client->json calls (if any)
$content = str_replace(
    '$this->client->json($systemPrompt, $userPrompt, ',
    '$this->ai->forFeature(\'seller_ai\')->json($systemPrompt, $userPrompt, ',
    $content
);

file_put_contents($path, $content);
echo "SellerAiService.php patched.\n";
