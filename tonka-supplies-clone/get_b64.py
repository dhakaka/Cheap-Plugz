import base64
with open('assets/logo.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')
with open('base64_logo.txt', 'w') as f:
    f.write(b64)
