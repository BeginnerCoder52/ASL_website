import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split
import argparse

from generation_caption import generate_caption
from text_to_asl_images import text_to_asl_images


def load_data(data_dir):
    images, labels = [], []
    classes = os.listdir(data_dir)
    for i, cls in enumerate(classes):
        cls_path = os.path.join(data_dir, cls)
        if os.path.isdir(cls_path):
            for img_name in os.listdir(cls_path):
                img_path = os.path.join(cls_path, img_name)
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                if img is not None:
                    img = cv2.resize(img, (64, 64)) / 255.0
                    images.append(img)
                    labels.append(i)
    return np.array(images), tf.keras.utils.to_categorical(labels, len(classes))


def train_model():
    data_dir = r"D:\Hoc_coding\ASL_website\AI\data\DATASET"
    X, y = load_data(data_dir)
    # Expand dims to add the single channel
    X = np.expand_dims(X, -1)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Define CNN model for ASL recognition
    model = models.Sequential(
        [
            layers.Input(shape=(64, 64, 1)),
            layers.Conv2D(32, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            layers.Conv2D(64, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            layers.Conv2D(128, (3, 3), activation="relu"),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            layers.Flatten(),
            layers.Dense(512, activation="relu"),
            layers.Dropout(0.5),
            layers.Dense(36, activation="softmax"),
        ]
    )

    model.compile(
        optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"]
    )
    model.fit(
        X_train, y_train, epochs=20, batch_size=32, validation_data=(X_test, y_test)
    )
    model.save("asl_model.keras")
    print("Model training completed and saved as asl_model.keras")


def generate_asl_from_image(image_path):
    # Read the input image in color (for captioning)
    image = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if image is None:
        print("Error: Unable to read image from", image_path)
        return
    print("Processing image:", image_path)
    # Resize image for caption generation (adjust size if needed by your caption model)
    image_resized = cv2.resize(image, (224, 224)) / 255.0

    # Generate caption using the API
    caption = generate_caption(image_resized)
    print("Generated Caption:", caption)

    # Convert caption text to a sequence of ASL images (letter-by-letter conversion)
    asl_images = text_to_asl_images(caption, r"data\DATASET")

    if asl_images is not None and len(asl_images) > 0:
        print(f"Generated {asl_images.shape[0]} ASL images from the caption.")
        # For demonstration, display each ASL image sequentially
        for idx, asl_img in enumerate(asl_images):
            cv2.imshow(f"ASL Image {idx + 1}", asl_img)
            cv2.waitKey(500)  # Display each image for 500ms
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    else:
        print("No ASL images generated; please check your dataset and caption.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mode",
        type=str,
        default="train",
        help="'train' to train the model or 'generate' to run the caption-to-ASL pipeline",
    )
    parser.add_argument(
        "--image",
        type=str,
        help="Path to an input image for generation mode",
        default="",
    )
    args = parser.parse_args()

    if args.mode == "train":
        train_model()
    elif args.mode == "generate":
        # If no image path is provided, assume image.jpg in the current AI folder.
        if args.image:
            image_path = args.image
        else:
            base = os.path.dirname(__file__)
            image_path = os.path.join(base, "image.jpg")
        generate_asl_from_image(image_path)
    else:
        print("Invalid mode selected. Use 'train' or 'generate'.")
