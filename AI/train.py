import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import cv2
import os
from sklearn.model_selection import train_test_split


# Data preprocessing
def load_data(data_dir):
    images, labels = [], []
    classes = os.listdir(data_dir)
    for i, cls in enumerate(classes):
        for img_name in os.listdir(os.path.join(data_dir, cls)):
            img = cv2.imread(
                os.path.join(data_dir, cls, img_name), cv2.IMREAD_GRAYSCALE
            )
            img = cv2.resize(img, (64, 64)) / 255.0
            images.append(img)
            labels.append(i)
    return np.array(images), tf.keras.utils.to_categorical(labels, len(classes))


# Load dataset
data_dir = "data\DATASET"
X, y = load_data(data_dir)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Define CNN model
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

# Compile and train
model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
model.fit(X_train, y_train, epochs=20, batch_size=32, validation_data=(X_test, y_test))

# Save model
model.save("asl_model.keras")
