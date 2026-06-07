import os
import base64
import urllib.request
import json
url = "https://raw.githubusercontent.com/serengil/deepface/master/tests/dataset/img1.jpg"
urllib.request.urlretrieve(url, "zuck.jpg")

with open("zuck.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

req = urllib.request.Request("http://localhost:8000/api/auth/login/face", method="POST", headers={"Content-Type": "application/json"})
try:
    resp = urllib.request.urlopen(req, data=json.dumps({"face_image": "data:image/jpeg;base64," + b64}).encode())
    print("SUCCESS", resp.status, resp.read().decode())
    
    # Let's also check if uvicorn is still alive
    health = urllib.request.urlopen("http://localhost:8000/api/health").read()
    print("HEALTH:", health)
except Exception as e:
    print("CRASH/FAIL", e)
