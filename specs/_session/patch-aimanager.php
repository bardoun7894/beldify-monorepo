<?php
// Patch AiManager.php — add forFeature() method
$path = __DIR__ . '/../../beldify-backend/app/Services/Ai/AiManager.php';
$content = file_get_contents($path);

$search = "    /**\n     * Resolve a ChatClient for the named provider (or the effective default when";
$replace = "    /**\n     * Resolve a ChatClient for the named AI feature.\n     *\n     * Reads the optional 'provider' override from config/ai.php features registry.\n     * Falls back to the default provider when no override is set.\n     *\n     * @param  string  $featureKey  Registry key (e.g. 'buyer_ai', 'listing_ai').\n     * @return ChatClient\n     */\n    public function forFeature(string $featureKey): ChatClient\n    {\n        \$registry = config('ai.features', []);\n        \$feature = \$registry[\$featureKey] ?? [];\n        \$providerOverride = \$feature['provider'] ?? null;\n\n        return \$this->provider(\$providerOverride);\n    }\n\n    /**\n     * Resolve a ChatClient for the named provider (or the effective default when";

$result = str_replace($search, $replace, $content);

if ($result === $content) {
    echo "ERROR: Pattern not found!\n";
    exit(1);
}

file_put_contents($path, $result);
echo "AiManager.php patched successfully.\n";
