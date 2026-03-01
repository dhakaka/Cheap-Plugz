$b64 = [System.IO.File]::ReadAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\base64_logo.txt")
$content = [System.IO.File]::ReadAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\login.html")

$emailJsScripts = @"
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
    <script type="text/javascript">
        (function () {
            emailjs.init("0QjEAceoyr3ERYIQ0");
        })();
    </script>
</head>
"@

$content = $content.Replace("</head>", $emailJsScripts)

$targetElse = @"
            } else {
                customers.push({ id: Date.now(), email, phone, fullName, joined: new Date().toISOString() });
            }
"@

$replacementElse = @"
            } else {
                customers.push({ id: Date.now(), email, phone, fullName, joined: new Date().toISOString() });
                if (typeof emailjs !== 'undefined') {
                    const welcomeHTML = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: center; border: 1px solid #eee;">
                            <div style="background-color: #000; padding: 40px;">
                                <img src="data:image/png;base64,B64_PLACEHOLDER" style="height: 60px;" alt="Cheap Plugz">
                            </div>
                            <div style="padding: 40px 20px;">
                                <h1 style="font-size: 24px; margin-bottom: 16px; font-weight: normal;">Welcome to CheapPlugz!</h1>
                                <p style="color: #888; font-size: 15px; margin-bottom: 30px; line-height: 1.5; padding: 0 20px;">You've activated your customer account. Next time you shop with us, log in for faster checkout.</p>
                                <a href="http://localhost:8585/" style="display: inline-block; background-color: #111; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: normal;">Visit our store</a>
                            </div>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 0;">
                            <div style="padding: 24px 20px; font-size: 13px; color: #888; text-align: left;">
                                If you have any questions, reply to this email or contact us at <a href="mailto:cheaplugz@gmail.com" style="color: #000; text-decoration: none;">cheaplugz@gmail.com</a>
                            </div>
                        </div>
                    `;
                    emailjs.send("service_nrvlrb7", "template_afw7f64", {
                        to_email: email,
                        reply_to: "cheaplugz@gmail.com",
                        subject: "Welcome to CheapPlugz!",
                        html_message: welcomeHTML
                    }).catch(err => console.error("EmailJS Welcome Error:", err));
                }
            }
"@

$replacementElse = $replacementElse.Replace("B64_PLACEHOLDER", $b64)
$content = $content.Replace($targetElse, $replacementElse)

[System.IO.File]::WriteAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\login.html", $content, [System.Text.Encoding]::UTF8)

$adminJsContent = [System.IO.File]::ReadAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\admin.js")
$adminTarget = @"
            emailjs.send(serviceID, templateID, {
                to_email: email,
                reply_to: "cheaplugz@gmail.com",
                html_message: invoiceHTML
            }).then(() => {
"@

$adminReplacement = @"
            emailjs.send(serviceID, templateID, {
                to_email: email,
                reply_to: "cheaplugz@gmail.com",
                subject: "Your Order Confirmation from Cheap Plugz",
                html_message: invoiceHTML
            }).then(() => {
"@
$adminJsContent = $adminJsContent.Replace($adminTarget, $adminReplacement)
[System.IO.File]::WriteAllText("c:\Users\Kristian Risteter\.gemini\antigravity\scratch\tonka-supplies-clone\admin.js", $adminJsContent, [System.Text.Encoding]::UTF8)
