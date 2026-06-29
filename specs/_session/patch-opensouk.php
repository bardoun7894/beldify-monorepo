<?php
// Patch OpenSoukMatchmakerService.php — switch ChatClient -> AiManager
$path = __DIR__ . '/../../beldify-backend/app/Services/Ai/OpenSoukMatchmakerService.php';
$content = file_get_contents($path);

// 1. Fix imports: remove ChatClient, add AiManager
$content = str_replace(
    "use App\Services\Ai\Contracts\ChatClient;",
    "use App\Services\Ai\AiManager;",
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

// 3. Fix all $this->client->json() calls
$content = str_replace(
    '$this->client->json($systemPrompt, $userPrompt, [\'max_tokens\' => 600]);',
    '$this->ai->forFeature(\'opensouk_matchmaker\')->json($systemPrompt, $userPrompt, [\'max_tokens\' => 600]);',
    $content
);

$content = str_replace(
    '$this->client->json($systemPrompt, $userPrompt, [\'max_tokens\' => 800]);',
    '$this->ai->forFeature(\'opensouk_matchmaker\')->json($systemPrompt, $userPrompt, [\'max_tokens\' => 800]);',
    $content
);

file_put_contents($path, $content);
echo "OpenSoukMatchmakerService.php patched.\n";
