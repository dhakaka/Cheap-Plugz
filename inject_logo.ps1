$b64 = [System.IO.File]::ReadAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\base64_logo.txt")
$content = [System.IO.File]::ReadAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\admin.js")

$target = '                    <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">Cheap<br>Plugz</h1>'
$replacement = '                    <img src="data:image/png;base64,' + $b64 + '" style="height:50px;" alt="Cheap Plugz Logo">'

$newContent = $content.Replace($target, $replacement)
[System.IO.File]::WriteAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\admin.js", $newContent, [System.Text.Encoding]::UTF8)
