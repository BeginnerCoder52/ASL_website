import os
import json
import pickle
import sys
import types

# ==========================================
# MACRO: CẤU HÌNH ĐƯỜNG DẪN VÀ TÊN FILE
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Tên các file đầu vào (từ quá trình train)
MODEL_FILENAME = "model_acc98.02_20260212_1054.keras"
PICKLE_FILENAME = "label_encoder.pickle"

# Tên các file/thư mục đầu ra (dành cho Web)
OUTPUT_JSON_FILENAME = "labels.json"
OUTPUT_TFJS_DIR = "tfjs_model"

# Danh sách 43 classes chuẩn khớp với model output
FULL_CLASS_LABELS = [
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

def convert_labels():
    """Tạo labels.json từ danh sách 43 classes chuẩn (khớp model output)"""
    json_path = os.path.join(BASE_DIR, OUTPUT_JSON_FILENAME)
    
    labels_dict = {str(i): cls for i, cls in enumerate(FULL_CLASS_LABELS)}
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(labels_dict, f, ensure_ascii=False, indent=4)
    
    print(f"[+] Thành công! Đã tạo từ điển nhãn ({len(labels_dict)} classes): {json_path}")

def convert_model():
    """Chuyển đổi model Keras sang TensorFlow.js bằng Python API"""
    keras_path = os.path.join(BASE_DIR, MODEL_FILENAME)
    tfjs_path = os.path.join(BASE_DIR, OUTPUT_TFJS_DIR)
    
    print(f"\n[*] Đang chuyển đổi model Keras sang TensorFlow.js...")
    print(f"    Input: {keras_path}")
    print(f"    Output Dir: {tfjs_path}")
    
    if not os.path.exists(keras_path):
        print(f"[-] LỖI: Không tìm thấy file model {keras_path}")
        return
    
    try:
        from tensorflow.keras.models import load_model
        
        # Monkey-patch để tránh lỗi protobuf từ yggdrasil_decision_forests
        for mod_name in ['tensorflow_decision_forests', 'yggdrasil_decision_forests']:
            if mod_name not in sys.modules:
                sys.modules[mod_name] = types.ModuleType(mod_name)
        
        import tensorflowjs as tfjs
        
        model = load_model(keras_path)
        tfjs.converters.save_keras_model(model, tfjs_path)
        print(f"[+] Thành công! Model web đã được tạo tại: {tfjs_path}")
        
    except Exception as e:
        print(f"[-] LỖI: Quá trình chuyển đổi thất bại: {e}")

if __name__ == "__main__":
    print("=== BẮT ĐẦU QUÁ TRÌNH CHUYỂN ĐỔI MODEL CHO WEB ===\n")
    
    # Đảm bảo thư mục tồn tại
    os.makedirs(BASE_DIR, exist_ok=True)
    
    convert_labels()
    convert_model()
    
    print("\n=== HOÀN TẤT ===")
    print(f"👉 Hãy copy file '{OUTPUT_JSON_FILENAME}' và toàn bộ thư mục '{OUTPUT_TFJS_DIR}' vào thư mục 'public' của dự án React!")