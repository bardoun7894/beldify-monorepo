<?php
// Patch AiManager.php — add forFeature() method (fixed: use single quotes)
$path = __DIR__ . '/../../beldify-backend/app/Services/Ai/AiManager.php';
$content = file_get_contents($path);

$search = <<<'SEARCH'
    /**
     * Resolve a ChatClient for the named AI feature.
     *
     * Reads the optional 'provider' override from config/ai.php features registry.
     * Falls back to the default provider when no override is set.
     *
     * @param  string    Registry key (e.g. 'buyer_ai', 'listing_ai').
     * @return ChatClient
     */
    public function forFeature(string ): ChatClient
    {
        $registry = config('ai.features', []);
        $feature = $registry[$featureKey] ?? [];
        $providerOverride = $feature['provider'] ?? null;

        return $this->provider($providerOverride);
    }
SEARCH;

$replace = <<<'REPLACE'
    /**
     * Resolve a ChatClient for the named AI feature.
     *
     * Reads the optional 'provider' override from config/ai.php features registry.
     * Falls back to the default provider when no override is set.
     *
     * @param  string  $featureKey  Registry key (e.g. 'buyer_ai', 'listing_ai').
     * @return ChatClient
     */
    public function forFeature(string $featureKey): ChatClient
    {
        $registry = config('ai.features', []);
        $feature = $registry[$featureKey] ?? [];
        $providerOverride = $feature['provider'] ?? null;

        return $this->provider($providerOverride);
    }
REPLACE;

$result = str_replace($search, $replace, $content);

if ($result === $content) {
    echo "ERROR: Pattern not found!\n";
    exit(1);
}

file_put_contents($path, $result);
echo "AiManager.php fixed successfully.\n";
