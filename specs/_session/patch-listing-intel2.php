<?php
// Fix: add AiManager import to ListingIntelligenceService
$path = __DIR__ . '/../../beldify-backend/app/Services/Ai/ListingIntelligenceService.php';
$content = file_get_contents($path);

$content = str_replace(
    "use App\Models\Store;
use App\Support\Verticals;",
    "use App\Models\Store;
use App\Services\Ai\AiManager;
use App\Support\Verticals;",
    $content
);

file_put_contents($path, $content);
echo "AiManager import added to ListingIntelligenceService.php\n";
