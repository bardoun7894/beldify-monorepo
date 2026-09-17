<?php
// Patch ListingIntelligenceService.php — switch ChatClient -> AiManager
$path = __DIR__ . '/../../beldify-backend/app/Services/Ai/ListingIntelligenceService.php';
$content = file_get_contents($path);

// 1. Fix imports
$content = str_replace(
    "use App\Models\Category;
use App\Models\Stock;
use App\Models\Store;
use App\Services\Ai\Contracts\ChatClient;",
    "use App\Models\Category;
use App\Models\Stock;
use App\Models\Store;",
    $content
);

// 2. Fix constructor + property
$content = str_replace(
    '    public function __construct(
        private readonly ChatClient $client,
    ) {}',
    '    public function __construct(
        private readonly AiManager $ai,
    ) {}',
    $content
);

// 3. Fix all $this->client calls
$content = str_replace(
    '$this->client->json($systemPrompt, $userPrompt, [\'max_tokens\' => 600]);',
    '$this->ai->forFeature(\'listing_ai\')->json($systemPrompt, $userPrompt, [\'max_tokens\' => 600]);',
    $content
);

file_put_contents($path, $content);
echo "ListingIntelligenceService.php patched.\n";
