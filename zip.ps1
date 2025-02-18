$compress = @{
  Path = "cs.js", "bg.js", "style.css", "manifest.json";
  CompressionLevel = "Optimal";
  DestinationPath = "ACIE.zip";
}
Compress-Archive @compress -Force
