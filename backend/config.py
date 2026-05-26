import os


class Config:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.dirname(BASE_DIR)
    OUTPUT_DIR = os.path.join(PROJECT_ROOT, "AI_output_files")

    MODEL_PATH = os.path.join(OUTPUT_DIR, "model_acc98.02_20260212_1054.keras")
    TASK_PATH = os.path.join(OUTPUT_DIR, "hand_landmarker.task")

    DATA_DIRS = [
        os.path.join(BASE_DIR, "data", "DATASET"),
    ]

    SECRET_KEY = os.environ.get("SECRET_KEY", "eduglyph-dev-secret")

    CLASS_LABELS = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
        'HELLO', 'HELP',
        'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
        'RIGHT',
        'S', 'T',
        'THANKS',
        'U', 'V', 'W', 'X', 'Y', 'Z',
        'del', 'nothing', 'space'
    ]

    CONNECTIONS = [
        (0, 1), (1, 2), (2, 3), (3, 4),
        (5, 6), (6, 7), (7, 8),
        (9, 10), (10, 11), (11, 12),
        (13, 14), (14, 15), (15, 16),
        (17, 18), (18, 19), (19, 20),
        (0, 5), (5, 9), (9, 13), (13, 17), (0, 17)
    ]

    COLORS = {
        "Thumb": (255, 0, 0),
        "Index": (0, 255, 0),
        "Middle": (0, 0, 255),
        "Ring": (255, 255, 0),
        "Pinky": (255, 0, 255),
        "Palm": (255, 255, 255)
    }

    # LiveKit config
    LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "")
    LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "")
    LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "wss://asl-website-9ewo4y8s.livekit.cloud")
