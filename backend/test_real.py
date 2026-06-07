import base64
import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# 1. Download valid face from a reliable URL
url = "https://raw.githubusercontent.com/davisking/dlib/master/examples/faces/tom_cruise.jpg"
try:
    urllib.request.urlretrieve(url, "real.jpg")
except Exception as e:
    print("Could not download:", e)
    import sys; sys.exit(1)

with open("real.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login/face", method="POST", headers={"Content-Type": "application/json", "Origin": "http://localhost:3000"})
try:
    resp = urllib.request.urlopen(req, data=json.dumps({"face_image": "data:image/jpeg;base64," + b64}).encode())
    print("SUCCESS", resp.status, resp.read().decode())
except Exception as e:
    try:
        body = e.read().decode()
    except:
        body = "Could not read body"
    print("CRASH/FAIL", e, body)
