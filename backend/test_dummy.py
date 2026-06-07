import os
import base64
import urllib.request
import json
import numpy as np
from PIL import Image
from io import BytesIO

# Generate a blank grey 64x64 image
img = Image.fromarray(np.uint8(np.full((64, 64, 3), 128)))
buffered = BytesIO()
img.save(buffered, format="JPEG")
b64 = base64.b64encode(buffered.getvalue()).decode()

req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login/face", method="POST", headers={"Content-Type": "application/json", "Origin": "http://localhost:3000"})
try:
    resp = urllib.request.urlopen(req, data=json.dumps({"face_image": "data:image/jpeg;base64," + b64}).encode())
    print("SUCCESS", resp.status, resp.read().decode())
except Exception as e:
    print("CRASH/FAIL", e, getattr(e, 'read', lambda: b'')().decode())

# Check health afterwards
try:
    print("HEALTH", urllib.request.urlopen("http://127.0.0.1:8000/api/health").read().decode())
except Exception as e:
    print("HEALTH FAIL", e)
