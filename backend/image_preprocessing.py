import cv2
import numpy as np
import os
import sys

# Directory for processed images
PROCESSED_DIR = "processed_images"
os.makedirs(PROCESSED_DIR, exist_ok=True)

def preprocess_image(image_path, output_size=(512, 512), denoise=True):
    """Preprocess an image: resize, normalize, and optionally denoise."""
    
    if not os.path.exists(image_path):
        print(f"Error: File not found - {image_path}")
        return None
    
    # Load image using OpenCV
    image = cv2.imread(image_path, cv2.IMREAD_COLOR)

    if image is None:
        print(f"Error: Unable to read image - {image_path}")
        return None

    # Convert grayscale to BGR
    if len(image.shape) == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    # Resize image for model input
    image = cv2.resize(image, output_size, interpolation=cv2.INTER_AREA)

    # Optional denoising step
    if denoise and image.shape[-1] == 3:
        image = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)

    # Save processed image
    filename = os.path.basename(image_path)
    output_path = os.path.join(PROCESSED_DIR, filename)
    
    if not cv2.imwrite(output_path, image):
        print(f"Error: Failed to save image - {output_path}")
        return None

    print(f"✅ Processed image saved: {output_path}")
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No image paths provided.")
        sys.exit(1)

    image_paths = sys.argv[1:]
    processed_files = [preprocess_image(img) for img in image_paths if img]

    print("\n".join([f for f in processed_files if f]))
