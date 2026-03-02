$b64 = [System.IO.File]::ReadAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\base64_logo.txt")
$content = [System.IO.File]::ReadAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\login.html")
$content = $content.Replace("B64_PLACEHOLDER", $b64)
[System.IO.File]::WriteAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\login.html", $content, [System.Text.Encoding]::UTF8)
