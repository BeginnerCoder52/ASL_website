import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split

def load_data(data_dirs):
    if isinstance(data_dirs, str): data_dirs = [data_dirs]
    images, labels = [], []
    
    # 1. Quét tất cả class trước để đảm bảo tính nhất quán
    classes_set = set()
    for d in data_dirs:
        if os.path.isdir(d):
            for name in os.listdir(d):
                if os.path.isdir(os.path.join(d, name)) and name.isalnum():
                    classes_set.add(name.upper())
    
    classes = sorted(list(classes_set))
    print(f"Detected classes: {classes}")

    # 2. Load ảnh
    for i, cls in enumerate(classes):
        print(f"Loading class {cls}...")
        count = 0
        for d in data_dirs:
            # Check các biến thể tên thư mục
            candidates = [cls, cls.lower(), cls.upper()]
            for folder_name in candidates:
                cls_path = os.path.join(d, folder_name)
                if os.path.isdir(cls_path):
                    for img_name in os.listdir(cls_path):
                        try:
                            img_path = os.path.join(cls_path, img_name)
                            # Đọc grayscale
                            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                            if img is not None:
                                img = cv2.resize(img, (64, 64))
                                images.append(img)
                                labels.append(i)
                                count += 1
                        except Exception as e:
                            pass
        print(f"  - Loaded {count} images.")

    if not images:
        return np.array([]), np.array([]), classes
        
    X = np.array(images).astype('float32') / 255.0
    X = np.expand_dims(X, axis=-1) # (N, 64, 64, 1)
    y = tf.keras.utils.to_categorical(labels, len(classes))
    return X, y, classes

def train_model():
    base = os.path.dirname(os.path.abspath(__file__))
    dataset_a = os.path.join(base, "data", "DATASET")
    dataset_b = os.path.join(base, "data", "asl_dataset")
    
    X, y, classes = load_data([dataset_a, dataset_b])
    if X.size == 0:
        print("No data found!")
        return

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Data Augmentation: Giúp model nhận diện tốt hơn khi tay rung lắc, nghiêng
    datagen = ImageDataGenerator(
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        zoom_range=0.1,
        shear_range=0.1
    )
    datagen.fit(X_train)

    num_classes = y.shape[1]
    
    model = models.Sequential([
        layers.Input(shape=(64, 64, 1)),
        
        layers.Conv2D(32, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(128, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        
        layers.Flatten(),
        layers.Dropout(0.5), # Tăng dropout để tránh overfit
        layers.Dense(512, activation="relu"),
        layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    
    print("Start training...")
    # Train với augmentation
    model.fit(datagen.flow(X_train, y_train, batch_size=32),
              epochs=25, 
              validation_data=(X_test, y_test))
              
    save_path = os.path.join(base, "asl_model.keras")
    model.save(save_path)
    print(f"Model saved to {save_path}")

if __name__ == "__main__":
    train_model()