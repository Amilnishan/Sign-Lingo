"""
Single-Frame Sign Language Classifier
--------------------------------------
Instead of LSTM (30 frames), this uses a Dense neural network 
that classifies a sign from a SINGLE frame of hand landmarks.
Gives instant feedback — just like ASL Pocket Sign!

Uses the SAME data collected by collect_data.py.
Each .npy file (126 keypoints) becomes one training sample.
"""

import numpy as np
import os
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input
from tensorflow.keras.callbacks import TensorBoard, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam

# ========== CONFIG ==========
DATA_PATH = os.path.join('data')
actions = np.array(['HELLO', 'WELCOME', 'YES', 'NO', 'PLEASE', 'THANK_YOU', 'SORRY', 'FINE', 'OK', 'GOOD_BYE'])
no_sequences = 30
sequence_length = 30

label_map = {label: num for num, label in enumerate(actions)}

# ========== LOAD DATA ==========
print("Loading data...")
samples, labels = [], []
skipped = 0

for action in actions:
    for sequence in range(no_sequences):
        for frame_num in range(sequence_length):
            npy_path = os.path.join(DATA_PATH, action, str(sequence), f"{frame_num}.npy")
            if os.path.exists(npy_path):
                keypoints = np.load(npy_path)
                
                # Skip frames where no hand was detected (all zeros)
                if np.sum(np.abs(keypoints)) < 0.01:
                    skipped += 1
                    continue
                
                samples.append(keypoints)
                labels.append(label_map[action])
            else:
                skipped += 1

X = np.array(samples)
y = to_categorical(labels, num_classes=len(actions)).astype(int)

print(f"Total samples: {len(X)} (skipped {skipped} empty frames)")
print(f"Input shape: {X.shape}")  # Should be (N, 126)
print(f"Classes: {len(actions)}")

# Show samples per class
for action in actions:
    count = np.sum(np.array(labels) == label_map[action])
    print(f"  {action}: {count} samples")

# ========== SPLIT DATA ==========
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)
print(f"\nTrain: {len(X_train)}, Test: {len(X_test)}")

# ========== BUILD MODEL ==========
# Simple but effective Dense model for 126 keypoint features
model = Sequential([
    Input(shape=(126,)),
    
    # Layer 1
    Dense(256, activation='relu'),
    BatchNormalization(),
    Dropout(0.3),
    
    # Layer 2
    Dense(128, activation='relu'),
    BatchNormalization(),
    Dropout(0.3),
    
    # Layer 3
    Dense(64, activation='relu'),
    BatchNormalization(),
    Dropout(0.2),
    
    # Output
    Dense(len(actions), activation='softmax')
])

model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['categorical_accuracy']
)

model.summary()

# ========== CALLBACKS ==========
callbacks = [
    TensorBoard(log_dir='logs/single_frame'),
    EarlyStopping(monitor='val_loss', patience=50, restore_best_weights=True),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=20, min_lr=1e-6)
]

# ========== TRAIN ==========
print("\nTraining single-frame model...")
history = model.fit(
    X_train, y_train,
    validation_data=(X_test, y_test),
    epochs=500,
    batch_size=32,
    callbacks=callbacks,
    verbose=1
)

# ========== EVALUATE ==========
loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
print(f"\nTest Accuracy: {accuracy * 100:.2f}%")
print(f"Test Loss: {loss:.4f}")

# ========== SAVE ==========
model.save('sign_lingo_model_single.h5')
print("\nModel saved as 'sign_lingo_model_single.h5'")
print("Use this model in your backend for instant single-frame predictions!")
