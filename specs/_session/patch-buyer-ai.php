<?php
// Patch BuyerAiService.php — switch ChatClient -> AiManager
$path = __DIR__ . '/../../beldify-backend/app/Services/Ai/BuyerAiService.php';
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
        private readonly ChatClient           $client,
        private readonly ProductSearchService $searchService,
    ) {}',
    '    public function __construct(
        private readonly AiManager            $ai,
        private readonly ProductSearchService $searchService,
    ) {}',
    $content
);

// 3. Fix generateReviewSummaries() call (line ~121) — buyer_ai
$content = str_replace(
    'USR;

        $data = $this->client->json($systemPrompt, $userPrompt, [\'max_tokens\' => 1500]);

        if (! $this->isValidSummaryResult($data)) {',
    'USR;

        $data = $this->ai->forFeature(\'buyer_ai\')->json($systemPrompt, $userPrompt, [\'max_tokens\' => 1500]);

        if (! $this->isValidSummaryResult($data)) {',
    $content
);

// 4. Fix searchAssist() call (line ~215) — buyer_ai
$content = str_replace(
    'USR;

        $data = $this->client->json($systemPrompt, $userPrompt, [\'max_tokens\' => 400]);

        if (! is_array($data) || ! isset($data[\'filters\']) || ! is_array($data[\'filters\'])) {',
    'USR;

        $data = $this->ai->forFeature(\'buyer_ai\')->json($systemPrompt, $userPrompt, [\'max_tokens\' => 400]);

        if (! is_array($data) || ! isset($data[\'filters\']) || ! is_array($data[\'filters\'])) {',
    $content
);

// 5. Fix callSizeAdvice() call (line ~398) — buyer_ai
$content = str_replace(
    'USR;

        $data = $this->client->json($systemPrompt, $userPrompt, [\'max_tokens\' => 300]);

        if (
            ! is_array($data)
            || ! isset($data[\'recommended_size\'], $data[\'confidence\'], $data[\'note\'])
            || ! is_string($data[\'recommended_size\'])
            || ! is_string($data[\'note\'])',
    'USR;

        $data = $this->ai->forFeature(\'buyer_ai\')->json($systemPrompt, $userPrompt, [\'max_tokens\' => 300]);

        if (
            ! is_array($data)
            || ! isset($data[\'recommended_size\'], $data[\'confidence\'], $data[\'note\'])
            || ! is_string($data[\'recommended_size\'])
            || ! is_string($data[\'note\'])',
    $content
);

// 6. Fix assistantTurn() call (line ~484) — buyer_assistant (wrapped in try block)
$content = str_replace(
    'try {
            $data = $this->client->json($systemPrompt, $userPrompt, [\'max_tokens\' => 600]);
        } catch (\Throwable $e) {
            Log::warning(\'BuyerAiService::assistantTurn provider error',
    'try {
            $data = $this->ai->forFeature(\'buyer_assistant\')->json($systemPrompt, $userPrompt, [\'max_tokens\' => 600]);
        } catch (\Throwable $e) {
            Log::warning(\'BuyerAiService::assistantTurn provider error',
    $content
);

file_put_contents($path, $content);
echo "BuyerAiService.php patched.\n";
