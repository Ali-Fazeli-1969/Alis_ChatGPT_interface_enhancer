$compress = @{
  Path = "cs.js", "bg.js", "main.css",
		 "manifest.json";
  CompressionLevel = "Optimal";
  DestinationPath = "ACIE.zip";
}
Compress-Archive @compress -Force
