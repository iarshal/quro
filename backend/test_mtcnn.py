import os
import base64
import urllib.request
import json
url = "https://raw.githubusercontent.com/serengil/deepface/master/tests/dataset/img1.jpg"
try:
    urllib.request.urlretrieve(url, "zuck.jpg")
except:
    pass

import sys
if not os.path.exists("zuck.jpg"):
    print("Could not download test image.")
    sys.exit(0)

with open("zuck.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login/face", method="POST", headers={"Content-Type": "application/json", "Origin": "http://localhost:3000"})
try:
    resp = urllib.request.urlopen(req, data=json.dumps({"face_image": "data:image/jpeg;base64," + b64}).encode())
    print("SUCCESS", resp.status, resp.read().decode())
except Exception as e:
    print("CRASH/FAIL", e, getattr(e, 'read', lambda: b'')().decode())
