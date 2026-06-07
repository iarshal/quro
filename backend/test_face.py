import os
import urllib.request
from deepface import DeepFace

urllib.request.urlretrieve("https://upload.wikimedia.org/wikipedia/commons/3/33/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg", "zuck.jpg")

print("Testing DeepFace load...")
try:
    result = DeepFace.represent(
        img_path="zuck.jpg",
        model_name="Facenet",
        enforce_detection=True,
        detector_backend="opencv",
    )
    print("SUCCESS")
except Exception as e:
    print("ERROR", str(e))
