import cv2
import numpy as np
import os
import time

# --- CONFIGURATION ---
DATA_PATH = os.path.join('data') 
actions = np.array(['HELLO', 'WELCOME', 'YES', 'NO', 'PLEASE', 'THANK_YOU', 'SORRY', 'FINE', 'OK', 'GOOD_BYE'])

# Helper function to draw from landmarks
def draw_landmarks_from_npy(image, keypoints):
    # Keypoints are concatenated: Left Hand (63 values) + Right Hand (63 values)
    # 21 points * 3 coords (x,y,z) = 63
    
    lh = keypoints[0:63]
    rh = keypoints[63:126]
    
    def plot_hand(data, color):
        for i in range(0, len(data), 3):
            x = data[i]
            y = data[i+1]
            # z = data[i+2] # We ignore Z for 2D drawing
            
            # If x and y are 0, it means no hand was detected in that frame
            if x == 0 and y == 0:
                continue
                
            # Convert normalized coords (0-1) to pixel coords
            cv2.circle(image, (int(x * 640), int(y * 480)), 4, color, -1)

    # Draw Left Hand (Green)
    plot_hand(lh, (0, 255, 0))
    # Draw Right Hand (Red)
    plot_hand(rh, (0, 0, 255))

# --- MAIN LOOP ---
print("Press 'q' to quit, 'n' for next action")

for action in actions:
    print(f"--- REVIEWING ACTION: {action} ---")
    
    # Check if folder exists
    action_path = os.path.join(DATA_PATH, action)
    if not os.path.exists(action_path):
        print(f"No data found for {action}")
        continue

    # Get list of recorded sequences (0, 1, 2...)
    sequences = os.listdir(action_path)
    
    for sequence in sequences:
        sequence_path = os.path.join(action_path, sequence)
        
        # Loop through the 30 frames of this video
        for frame_num in range(30):
            npy_path = os.path.join(sequence_path, f"{frame_num}.npy")
            
            if not os.path.exists(npy_path):
                continue

            # Load the data
            res = np.load(npy_path)

            # Create a black background
            image = np.zeros((480, 640, 3), dtype='uint8')
            
            # Put text
            cv2.putText(image, f'{action} | Video: {sequence} | Frame: {frame_num}', (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1, cv2.LINE_AA)

            # Draw the hands
            draw_landmarks_from_npy(image, res)

            # Show the animation
            cv2.imshow('Data Review', image)
            
            # Control speed (0.05s = 20fps)
            key = cv2.waitKey(50)
            if key & 0xFF == ord('q'):
                exit()
        
        # Pause slightly between videos
        time.sleep(0.5)

cv2.destroyAllWindows()