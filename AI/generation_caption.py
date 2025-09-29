import requests
import cv2
import numpy as np


def generate_caption(image):
    """
    Generate a caption for the provided image using the API Ninjas Image to Text API.
    The function converts the input image (a numpy array) to JPEG format, then sends it to the API.
    Note: Replace 'YOUR_API_KEY_HERE' with your actual API key.
    """
    # If the image is normalized, convert back to 8-bit
    if image.max() <= 1.0:
        image = (image * 255).astype(np.uint8)

    success, encoded_image = cv2.imencode(".jpg", image)
    if not success:
        return "Error encoding image"

    files = {"image": ("image.jpg", encoded_image.tobytes(), "image/jpeg")}
    headers = {
        "X-Api-Key": "aeJ22gw8hVDI74qYSyVoog==UlRS4HWbbk0qVxjd"
    }  # Replace with your API key
    url = "https://api.api-ninjas.com/v1/imagetotext"
    response = requests.post(url, headers=headers, files=files)

    if response.status_code == 200:
        json_response = response.json()
        # Check if the response is a list (as observed) and get text from the first item.
        if isinstance(json_response, list) and len(json_response) > 0:
            caption = json_response[0].get("text")
        elif isinstance(json_response, dict):
            caption = json_response.get("text")
        else:
            caption = None
        return caption if caption else "No caption found."
    else:
        return f"Error: {response.status_code} {response.text}"
