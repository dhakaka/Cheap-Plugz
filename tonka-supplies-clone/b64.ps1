$bytes = [System.IO.File]::ReadAllBytes("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\assets\logo.png")
$b64 = [System.Convert]::ToBase64String($bytes)
[System.IO.File]::WriteAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\base64_logo.txt", $b64)
