import os
import cv2
import numpy as np


def text_to_asl_images(text, asl_data_dir):
    """
    Convert the input text (letter by letter) to a sequence of ASL images.
    For each character in the text, search for the corresponding ASL image in the dataset.
    If an image is not found for a character, print a warning and move on.
    """
    asl_images = []
    for char in text.upper():
        if char.isalnum():
            # Build path to the folder corresponding to the character
            char_dir = os.path.join(asl_data_dir, char)
            if os.path.exists(char_dir):
                img_names = os.listdir(char_dir)
                if img_names:
                    img_path = os.path.join(char_dir, img_names[0])
                    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                    if img is not None:
                        img = cv2.resize(img, (64, 64)) / 255.0
                        asl_images.append(img)
                    else:
                        print(f"Warning: Unable to read image from {img_path}")
                else:
                    print(f"Warning: No images found in directory {char_dir}")
            else:
                print(f"Warning: Directory {char_dir} does not exist.")
    if asl_images:
        return np.stack(asl_images, axis=0)
    else:
        return None
