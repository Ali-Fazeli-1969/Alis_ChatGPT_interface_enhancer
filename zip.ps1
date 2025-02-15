$compress = @{
  Path = "*.js", "manifest.json";
  CompressionLevel = "Optimal";
  DestinationPath = "CMI.zip";
}
Compress-Archive @compress -Force
