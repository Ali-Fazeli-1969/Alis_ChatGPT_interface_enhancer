$compress = @{
  Path = "cs.js", "bg.js", "main.css"
  		 "mirror.css", "manifest.json";
  CompressionLevel = "Optimal";
  DestinationPath = "ACIE.zip";
}
Compress-Archive @compress -Force
