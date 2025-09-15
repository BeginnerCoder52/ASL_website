import tensorflow as tf
import tensorflowjs as tfjs

# Load trained model
model = tf.keras.models.load_model("asl_model.keras")

# Convert to TensorFlow.js format
tfjs.converters.save_keras_model(model, "backend/models/asl_model")
