import cv2
import numpy as np
import os
import urllib.request

# --- CONFIGURATION ---
DATA_PATH = os.path.join('data') 

# These are the words from your Lesson 1 (Greetings)
actions = np.array(['HELLO', 'WELCOME', 'YES', 'NO', 'PLEASE', 'THANK_YOU', 'SORRY', 'FINE', 'OK', 'GOOD_BYE'])

no_sequences = 30   # Record 30 videos per word
sequence_length = 30 # Each video is 30 frames long (1 second)

# --- DOWNLOAD MEDIAPIPE HAND LANDMARK MODEL ---
MODEL_PATH = 'hand_landmarker.task'
if not os.path.exists(MODEL_PATH):
    print("Downloading MediaPipe hand landmark model...")
    url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    urllib.request.urlretrieve(url, MODEL_PATH)
    print("Model downloaded successfully!")

# --- MEDIAPIPE SETUP (New API) ---
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import Image, ImageFormat

# Create HandLandmarker
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=2,  # Detect both hands
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5
)
detector = vision.HandLandmarker.create_from_options(options)

def mediapipe_detection(image):
    """Process image with MediaPipe and return landmarks"""
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = Image(image_format=ImageFormat.SRGB, data=image_rgb)
    results = detector.detect(mp_image)
    return results

def draw_landmarks(image, results):
    """Draw hand landmarks on the image"""
    if not results.hand_landmarks:
        return image
    
    height, width, _ = image.shape
    
    for hand_landmarks in results.hand_landmarks:
        # Draw connections between landmarks
        connections = [
            (0, 1), (1, 2), (2, 3), (3, 4),  # Thumb
            (0, 5), (5, 6), (6, 7), (7, 8),  # Index finger
            (0, 9), (9, 10), (10, 11), (11, 12),  # Middle finger
            (0, 13), (13, 14), (14, 15), (15, 16),  # Ring finger
            (0, 17), (17, 18), (18, 19), (19, 20),  # Pinky
            (5, 9), (9, 13), (13, 17)  # Palm
        ]
        
        # Draw landmarks
        for landmark in hand_landmarks:
            x = int(landmark.x * width)
            y = int(landmark.y * height)
            cv2.circle(image, (x, y), 5, (0, 255, 0), -1)
        
        # Draw connections
        for connection in connections:
            start_idx, end_idx = connection
            start = hand_landmarks[start_idx]
            end = hand_landmarks[end_idx]
            start_point = (int(start.x * width), int(start.y * height))
            end_point = (int(end.x * width), int(end.y * height))
            cv2.line(image, start_point, end_point, (255, 0, 0), 2)
    
    return image

def extract_keypoints(results):
    """Extract and flatten keypoints from both hands"""
    # Initialize arrays for left and right hand
    lh = np.zeros(21*3)
    rh = np.zeros(21*3)
    
    if results.hand_landmarks and results.handedness:
        for idx, hand_landmarks in enumerate(results.hand_landmarks):
            hand_label = results.handedness[idx][0].category_name  # "Left" or "Right"
            
            # Extract x, y, z coordinates
            coords = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks]).flatten()
            
            if hand_label == "Left":
                lh = coords
            else:
                rh = coords
    
    return np.concatenate([lh, rh])

# --- MAIN LOOP ---
# Create folders
for action in actions: 
    for sequence in range(no_sequences):
        try: 
            os.makedirs(os.path.join(DATA_PATH, action, str(sequence)))
        except: pass

# --- MAIN LOOP ---
# Create folders
for action in actions: 
    for sequence in range(no_sequences):
        try: 
            os.makedirs(os.path.join(DATA_PATH, action, str(sequence)))
        except: 
            pass

cap = cv2.VideoCapture(0) # Open Webcam

print("Starting data collection...")
print("Press 'q' to quit at any time")

for action in actions:
    print(f"\n--- STARTING COLLECTION FOR: {action} ---")
    print("Get ready... (2 second pause)")
    
    # Give user a break between words
    for i in range(20):  # Show countdown
        ret, frame = cap.read()
        if ret:
            cv2.putText(frame, f'Get ready for: {action}', (50, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
            cv2.imshow('OpenCV Feed', frame)
            cv2.waitKey(100)
    
    for sequence in range(no_sequences):
        for frame_num in range(sequence_length):

            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame")
                break
                
            # Process frame with MediaPipe
            results = mediapipe_detection(frame)
            
            # Draw landmarks
            image = draw_landmarks(frame.copy(), results)
            
            # Collection Logic
            if frame_num == 0: 
                cv2.putText(image, 'STARTING COLLECTION', (120, 200), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 4, cv2.LINE_AA)
                cv2.putText(image, f'Collecting frames for {action} Video Number {sequence}', (15, 12), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                cv2.imshow('OpenCV Feed', image)
                cv2.waitKey(2000) # 2 sec pause before recording starts
            else: 
                cv2.putText(image, f'Collecting frames for {action} Video Number {sequence}', (15, 12), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
                cv2.imshow('OpenCV Feed', image)
            
            # Export keypoints
            keypoints = extract_keypoints(results)
            npy_path = os.path.join(DATA_PATH, action, str(sequence), str(frame_num))
            np.save(npy_path, keypoints)

            # Break gracefully
            if cv2.waitKey(10) & 0xFF == ord('q'):
                break
                
cap.release()
cv2.destroyAllWindows()
print("\nData collection complete!")