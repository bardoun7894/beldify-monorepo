<?php
// Patch AIDescriptionController.php — remove ChatClient dep, switch to forFeature
$path = __DIR__ . '/../../beldify-backend/app/Http/Controllers/Admin/AIDescriptionController.php';
$content = file_get_contents($path);

// 1. Remove ChatClient import
$content = str_replace(
    "use App\Services\Ai\AiManager;
use App\Services\Ai\Contracts\ChatClient;",
    "use App\Services\Ai\AiManager;",
    $content
);

// 2. Remove ChatClient from constructor
$content = str_replace(
    '    public function __construct(
        private readonly ChatClient $client,
        private readonly AiManager $ai,
    ) {}',
    '    public function __construct(
        private readonly AiManager $ai,
    ) {}',
    $content
);

// 3. Switch chat call to forFeature
$content = str_replace(
    '$this->client->chat($systemPrompt, $userPrompt, [\'max_tokens\' => 300]);',
    '$this->ai->forFeature(\'product_description\')->chat($systemPrompt, $userPrompt, [\'max_tokens\' => 300]);',
    $content
);

file_put_contents($path, $content);
echo "AIDescriptionController.php patched.\n";
