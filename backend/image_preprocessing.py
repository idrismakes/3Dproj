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
        print(f"❌ Error: File not found - {image_path}")
        return None
    
    # Load image using OpenCV
    image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)

    # Ensure the image was loaded correctly
    if image is None:
        print(f"❌ Error: Unable to read image - {image_path}")
        return None

    # Convert grayscale images to BGR (3-channel) if necessary
    if len(image.shape) == 2:
        print(f"ℹ️ Converting grayscale image to BGR: {image_path}")
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    # Ensure image has 3 or 4 channels (required for denoising)
    if image.shape[-1] == 1:  # Convert single-channel grayscale to BGR
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    # Resize image
    image = cv2.resize(image, output_size, interpolation=cv2.INTER_AREA)

    # Apply denoising only if the image has 3 or 4 channels
    if denoise and image.shape[-1] in [3, 4]:
        image = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)

    # Extract filename and ensure a valid extension
    filename = os.path.basename(image_path)
    if '.' not in filename:
        filename += ".jpg"  # Default to JPG if no extension found

    output_path = os.path.join(PROCESSED_DIR, filename)

    # Save processed image
    success = cv2.imwrite(output_path, image)

    if not success:
        print(f"❌ Error: Failed to save image - {output_path}")
        return None

    print(f"✅ Processed image saved: {output_path}")  # Return processed image path for server
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: No image paths provided.")
        sys.exit(1)

    image_paths = sys.argv[1:]
    processed_files = [preprocess_image(img) for img in image_paths if img]

    # Print only valid processed images (used by the server)
    print("\n".join([os.path.relpath(f, start=PROCESSED_DIR) for f in processed_files if f]))
