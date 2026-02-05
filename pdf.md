CHAPTER 1
INTRODUCTION
The AI-Based Sign Language Tutor, titled Sign-Lingo, is a comprehensive educational mobile
software solution designed to modernize the way sign language is taught and practiced. In an
increasingly inclusive society, the ability to communicate via Sign Language is a vital skill, yet
the resources available to learn it effectively are often limited to expensive personal tutors or
passive video content. Traditional self-learning methods, such as textbooks or pre-recorded
video tutorials, fundamentally lack a feedback mechanism. Learners often mimic gestures
they observe on a screen but remain unaware of their accuracy, leading to frustration and
the development of incorrect muscle memory. To address this critical deficiency, this project
leverages recent advancements in Artificial Intelligence and Computer Vision. By utilizing the
MediaPipe framework and advanced sequence learning algorithms, the system functions as a
virtual tutor that tracks the user’s hand movements in real-time. It analyzes not just the static
geometric structure of the fingers, but also the temporal movement and trajectory of the hand to
validate dynamic signs. This ensures that the learner is performing complex gestures, such as
common words and short sentences, correctly.

The platform is delivered via a mobile application featuring a gamified interface that includes
experience points, daily streaks, and leaderboards to maintain high levels of user motivation.
This engaging environment transforms a difficult learning curve into a habit-building activity.
Additionally, the integration of an intelligent chatbot and a personalized weakness tracking
system ensures that the curriculum adapts to the individual needs of the student, focusing on
areas where they struggle most. Thus, this project demonstrates the practical application of AI
in the educational technology sector to solve a significant social and communication challenge,

making sign language education accessible, interactive, and effective for a broader audience
using standard handheld devices.

1.1 GENERAL BACKGROUND
Sign language serves as the primary mode of communication for millions of deaf and hard-
of-hearing individuals worldwide. In the context of American Sign Language (ASL), distinct
hand shapes, orientations, and movements represent alphabets, numbers, and words. For a
beginner, mastering the precise dexterity required for these signs is difficult without constant
guidance. Currently, the landscape of sign language education is polarized between high-quality
but expensive professional courses and widely accessible but passive online resources like video
dictionaries. The latter suffers significantly from a lack of interactivity, as a student watching a
video has no mechanism to verify their own accuracy, often resulting in high dropout rates due
to a lack of engagement and validation.

Sign-Lingo addresses these issues by democratizing access to quality education through a mobile-
first solution. Unlike previous generations of assistive technology that required expensive data
gloves or depth sensors, this system runs on standard smartphones and tablets, making it easily
accessible to the general public. By gamifying the process similar to popular language learning
applications, it transforms a difficult learning curve into an engaging, habit-building activity.
This approach allows users to practice consistently anywhere and anytime, effectively bridging
the gap between manual self-study and professional tutoring through modern technology.

1.2 OBJECTIVE
The main objective of the Sign-Lingo project is to develop a robust and interactive mobile
application that automates the teaching and verification of American Sign Language using
Artificial Intelligence. The project aims to design a user-friendly interface where students can
view visual references of signs and immediately practice them using their device’s camera. The
core technical objective is to implement a robust Action Recognition system using MediaPipe
and LSTM (Long Short-Term Memory) neural networks. This allows the application to detect
not just static hand shapes, but dynamic hand movements and trajectories. The system aims to
validate a vocabulary of over 50 essential ASL words and common conversational phrases (e.g.,

’Hello’, ’Thank You’, ’Help’). Furthermore, the project seeks to enhance learner retention by
introducing ’Daily Quests’ a gamified daily task system that encourages regular practice through
targeted challenges. Furthermore, the project seeks to enhance learner retention by designing
a gamified curriculum that rewards progress with experience points and tracks daily learning
streaks. Another key objective is to create a personalized learning engine that automatically
identifies specific signs a user struggles with and compiles them into a targeted review mode. The
system also aims to integrate an intelligent chatbot to provide text-based descriptive assistance
for difficult signs. Finally, the project includes the development of an administrative dashboard
to monitor user engagement, manage educational content, and generate analytical reports on
platform performance.

1.3 SCOPE
The scope of this project is focused on the software development of an educational mobile
application that utilizes on-device AI processing. The system’s primary function revolves
around a real-time interaction loop: the input involves video streams captured from the user’s
mobile camera along with touch-based interactions, while the processing component utilizes
computer vision libraries to extract twenty-one distinct hand landmarks. These landmarks are
compared against coded vector geometry rules for ASL alphabets. The resulting output consists
of immediate visual feedback indicating success or failure, coupled with updates to the user’s
progress profile and analytical data regarding their performance.
The scope of this project extends to the recognition of both static alphabets and dynamic word-
level gestures. The system utilizes a data-driven approach, training on datasets of 30-frame
video sequences to identify temporal patterns in hand movement. The operational scope covers
a predefined curriculum of 50 common words across categories such as Greetings, Emotions,
and Emergency. The application focuses on the individual learner’s experience through specific
’Daily Quests’ and module-based learning. While the system handles word-level recognition,
continuous sentence translation of undefined vocabulary remains out of scope for this iteration.
Two-handed conversational fluidity, and facial expression recognition are considered out of
scope for this iteration and are reserved for future enhancements as mobile hardware capabilities
advance.

CHAPTER 2
LITERATURE SURVEY
Zhang et al. [1], in their foundational paper on MediaPipe Hands, introduced a real-time on
device hand tracking solution that predicts 21 3D hand keypoints. Their approach utilizes a
single-shot detector model optimized for mobile GPUs, allowing for high-fidelity hand tracking
without the need for dedicated hardware like depth sensors. The study demonstrated that using
a topology of 21 landmarks allows for precise geometric analysis of finger states (curled vs.
straight). This technology forms the core basis for the proposed Sign-Lingo project, enabling
the implementation of a client-side verification engine that runs smoothly in a web browser.

Rastgoo et al. [2], in a comprehensive survey on Sign Language Recognition systems, cat-
egorized various approaches into sensor-based and vision-based methods. They highlighted
that while sensor-based gloves offer high accuracy, they are impractical for daily educational
use due to cost and setup time. Conversely, vision-based systems using Convolutional Neural
Networks (CNNs) provides a more accessible solution. The authors noted that a major challenge
in vision-based SLR is handling complex backgrounds and lighting conditions, a limitation the
proposed system aims to address by using skeletal tracking rather than raw pixel comparison.

Halder and Tayade [3] proposed a real-time hand gesture recognition system specifically for
American Sign Language (ASL) alphabets. Their model employed a pre-trained Inception V
architecture to classify static hand images corresponding to letters A-Z. While their system
achieved an accuracy of over 90introducing latency. The Sign-Lingo project improves upon
this by shifting the processing to the client-side using JavaScript frameworks, ensuring instant
feedback which is crucial for an educational environment.

Loewen et al. [4], in their study on the effectiveness of mobile language learning apps like
Duolingo, examined how gamified elements influence user retention and learning outcomes.
Their research found that features such as ”streaks,” ”leaderboards,” and ”experience points (XP)”
significantly increased user motivation and daily engagement habits compared to traditional
textbook learning. This validates the design choice of Sign-Lingo to incorporate a streak-based
system and leaderboards to maintain student interest in learning ASL over long periods.

Smutny and Schreiberova [5] investigated the rising trend of chatbots in educational settings.
Their research concluded that chatbots serve as effective ”24/7 tutors,” capable of answering
repetitive student queries and providing immediate descriptive assistance. They highlighted
that rule-based chatbots are particularly effective for structured domains. This supports the
integration of the Chatbot Assistant in the proposed system, which acts as a secondary support
layer to describe hand formations textually when visual aids are insufficient.

Mishra et al. [6] focused on the importance of real-time feedback in e-learning platforms for the
hearing impaired. Their study emphasized that students learning sign language often struggle
with ”proprioception” (knowing where their hands are relative to their body). They suggested
that overlaying visual cues (such as skeletons or color-coded borders) on the user’s own video
feed significantly improves learning accuracy. Sign-Lingo adopts this recommendation by
providing a ”Green/Red” border feedback mechanism directly on the webcam feed.

Kumar and Wu [7] focused specifically on the recognition of static American Sign Language
(ASL) alphabets using shape-based features and morphological operations. Their study high-
lighted that for static signs (like ’A’, ’B’, ’C’), analyzing the geometric shape and contour of the
hand is often more efficient than training complex deep neural networks. They demonstrated
that extracting the ”convex hull” and ”defects” of the hand shape can accurately identify finger
positioning. This insight supports the Sign-Lingo approach of using geometric vector analysis
for alphabet verification, ensuring the system remains lightweight and fast.

Al-Hammadi et al. [8] conducted a comparative analysis of using Random Forest versus Support
Vector Machines (SVM) for classifying hand gestures based on extracted landmarks. Their
results indicated that once skeletal features are extracted, lightweight classifiers like Random
Forest or Neural Networks perform with high speed and accuracy. This informs the backend
logic of the proposed system, suggesting that complex Deep Learning models are not always
necessary if the feature extraction (geometry of fingers) is robust.

Garg et al. [9] explored the development of web-based assistive technologies using TensorFlow.js.
They demonstrated that running machine learning models directly in the browser protects user
privacy, as video data does not need to be sent to a central server. This aligns with the security
goals of Sign-Lingo, ensuring that the user’s webcam feed is processed locally on their device,
thereby reducing bandwidth costs and enhancing data privacy.

Sahu and Ghorpade [10], in their research on ”Hand Gesture Recognition for Deaf and Dumb
using Web Camera,” addressed the critical need for systems that function on standard hardware.
They argued that previous generations of sign language translators failed to gain mass adoption
because they relied on expensive depth sensors (like Microsoft Kinect). Their proposed system
utilized standard low-resolution webcams and image processing techniques to detect gestures.
This validates the core architectural decision of Sign-Lingo to rely solely on the user’s built-in
laptop camera, maximizing accessibility for the general public.

CHAPTER 3
SYSTEM ANALYSIS
3.1 EXISTING SYSTEM
While the landscape of sign language education has evolved to include various mobile applica-
tions and digital platforms, significant gaps remain in user engagement and interactive support.
Many existing applications function primarily as digital flashcards or gamified dictionaries,
where users learn signs in isolation. Although some platforms offer basic gesture recognition,
they often lack the immersive gamification ecosystem found in mainstream language learning
apps—specifically elements like competitive global leaderboards, rigorous daily streak main-
tenance, and XP-based progression systems. Consequently, users often lose motivation over
time as the learning process feels solitary and repetitive rather than dynamic and rewarding. The
majority of free resources, such as video tutorials on streaming platforms, still suffer from the
fundamental issue of being passive, offering no mechanism for the user to verify their accuracy.
A critical limitation in the current market is the absence of intelligent, conversational assistance.
Existing apps typically rely solely on visual cues; if a learner struggles to understand the nuance
of a hand shape or orientation from a video, there is no built-in mechanism to ask for help.
They cannot query the system for descriptive instructions (e.g., ”How exactly do I tuck my
thumb for ’B’?”). This lack of an interactive ”Chatbot” or AI assistant forces users to leave the
application to search for answers elsewhere, breaking the learning flow. Furthermore, many
advanced features in current solutions are locked behind premium paywalls, restricting access
for general users who wish to learn this vital skill without financial commitment. The existing

system, therefore, struggles to provide a holistic, deeply engaging, and self-contained learning
environment.
3.2 PROPOSED SYSTEM
The proposed Sign-Lingo system represents a significant evolution in the field of educational
technology, specifically targeting the domain of accessibility and sign language acquisition.
It is designed as a comprehensive, AI-driven educational platform that fundamentally shifts
the pedagogical paradigm from passive observation—typical of video tutorials—to active,
verified participation. The system creates a continuous, self-reinforcing learning loop where
the learner acquires a concept through visual aids, practices it immediately using computer
vision technology, receives instant verification from the AI, which shows success or error. By
integrating advanced computer vision frameworks like MediaPipe for real-time skeletal tracking
and landmark detection, the architecture ensures that the complex processing required for gesture
recognition is handled efficiently directly on the user’s device. This technological foundation
enables a responsive mobile application optimized for interactive learning without latency, while
a separate web-based dashboard serves comprehensive management needs. This dual-interface
approach ensures that the system remains robust, accurate, and secure while maintaining a
seamless, user-friendly experience for both users and administrators.
The core educational experience is delivered through a mobile application, designed to leverage
the portability and camera capabilities of modern smartphones. The workflow for the user is
structured to mimic the engaging nature of popular gaming applications, thereby reducing the
dropout rate associated with self-study. Upon launching the application, users undergo a secure
registration process to create a unique profile. This profile serves as the repository for their
learning history, experience points (XP), and personalized settings. Once logged in, the user
is presented with a structured ”Learning Map.” Unlike a traditional list of videos, this map
is a visual journey containing various modules such as Alphabets, Numbers, Greetings, and
Basic Phrases. The curriculum is progressive; users must master the basics before unlocking
more complex signs, ensuring a logical learning curve that prevents the user from feeling
overwhelmed.
When a user selects a lesson, the system first presents high-quality visual references in the form
of GIFs or static images demonstrating the correct hand shape and movement. The workflow

for the user is structured around the concept of ’Daily Quests.’ Upon logging in, the user
is presented with a specific set of challenges for the day (e.g., ’Practice 5 Greetings’). This
approach shifts the focus from aimless browsing to structured, goal-oriented daily habits. The
core educational experience is delivered through interactive modules. When a user engages
with a quest or a specific lesson, the system accesses the mobile device’s camera to capture a
sequence of hand movements. Unlike simple static analysis, the system records a short video
buffer (e.g., 1 second) to analyze the trajectory and flow of the sign. Using the MediaPipe
framework, the system overlays a digital skeleton onto the user’s hand in real-time, visualizing
the twenty-one key landmarks of the fingers and palm. The backend logic calculates the vector
geometry—specifically the angles between joints and the orientation of the hand—to compare
the user’s gesture against the correct mathematical model of the sign. If the gesture is correct,
the interface provides immediate positive feedback through visual cues like a green border,
success animation, and haptic feedback. If incorrect, the system prompts to adjust the hand, thus
mimicking the guidance of a human tutor.
To reinforce memory retention and ensure a comprehensive understanding, the system includes
interactive quizzes interleaved between practical lessons. These multiple-choice assessments
challenge the user to identify signs from images or demonstrate specific signs within a time limit.
This variation in testing methods ensures that the user not only develops muscle memory through
the camera but also cognitive recognition of the signs. A critical innovation in the proposed
system is the ”Weakness Tracking Engine.” The system silently logs every failed attempt during
AI practice and every wrong answer in quizzes. If a user consistently fails a specific sign, such
as confusing similar letters, it is added to a ”Weak Signs” list. The system then prompts the user
to enter a ”Smart Review” session, which focuses exclusively on these difficult items, ensuring
that learning gaps are addressed systematically. Additionally, to bridge the gap in theoretical
understanding, an integrated Chatbot is available within the mobile interface. Users can query
the bot for descriptive instructions receiving instant text-based guidance without leaving the
application.
While the mobile app focuses on the learner, the management side is handled through a central-
ized Web-Based Admin Dashboard. This interface is optimized for desktop viewing, providing
a broad overview of the platform’s health, security, and activity. The Admin plays a supervisory
role, responsible for maintaining the integrity of the educational ecosystem. The Admin is

capable of viewing the list of registered users, and identifying online and offline user accounts.
This oversight ensures the platform remains a safe and constructive environment for all learners.
The dashboard also provides a suite of analytical tools, allowing the Admin to visualize critical
metrics such as daily active users, module completion rates, and user retention statistics. This
data is vital for understanding the effectiveness of the curriculum; for instance, if analytics
show that a significant percentage of users fail a specific module, the Admin can infer that the
difficulty curve needs adjustment or better visual references are required.

Furthermore, to ensure fair play in the gamified environment, the Admin oversees the Global
Leaderboard. They have the ability to identify anomalies, such as a user gaining an impossible
amount of XP in a short time, and take corrective action to prevent cheating. The Admin also
reviews feedback submitted by users regarding bugs, content errors, or feature requests. This
feedback loop is essential for the continuous improvement of the system. The proposed system
utilizes a client-side AI approach to ensure data privacy and performance. Unlike cloud-based
processing, which requires sending video data to a server causing latency and privacy concerns,
Sign-Lingo processes the video feed locally on the user’s device. The mobile camera captures
video frames which are analyzed by the MediaPipe framework to detect the presence of a hand
and extract the coordinates of distinct points. These calculated vectors are compared against a
pre-defined library of correct sign configurations within a specific confidence threshold, ensuring
accurate and rapid validation.

3.3 MODULE DESCRIPTION
3.3.1 User Authentication Security Module
This module is responsible for the secure onboarding and session management of all users within
the application. It handles the registration process by capturing essential user details such as
name, email, and password, ensuring that sensitive data like passwords are encrypted using
hashing algorithms (Bcrypt) before storage. During login, the module authenticates credentials
and issues a JSON Web Token (JWT) to maintain a secure, persistent session, allowing users to
refresh pages without losing their state. Additionally, it implements role based access control to
strictly separate the ’User’ interface from the ’Administrator’ dashboard, ensuring data privacy
and security.

3.3.2 Interactive Learning Interface Module
This module serves as the primary front-end layer where users interact with the curriculum.
It dynamically renders the ”Learning Map,” locking or unlocking levels based on the user’s
previous progress. When a specific lesson is selected, the module retrieves and displays the
appropriate visual reference—high-quality static images for ASL Alphabets/Numbers and
animated GIFs for dynamic gestures. It include structured progression and the ’Daily Quest’
interface for immediate engagement. The bottom navigation is streamlined to focus on Home,
Quests, Leaderboard, and Profile, integrating the camera practice directly into the learning flow
rather than isolating it as a separate tab.

3.3.3 AI Verification Engine
Functioning as the core intelligence of the system, this module handles real-time dynamic
gesture recognition. It captures video frame sequences (time-series data) and processes them
using MediaPipe to extract skeletal key points for every frame. These temporal sequences are fed
into a trained LSTM (Long Short-Term Memory) Deep Learning model. The model analyzes the
change in coordinates over time to classify complex dynamic actions—distinguishing between
signs like ’Hello’ (waving) and ’Stop’ (stationary palm). This ensures the system can accurately
validate a vocabulary of 50+ words involving movement.

3.3.4 Intelligent Chatbot Assistant Module
This module provides immediate, text-based support to users who struggle to replicate a sign
based on visual cues alone. It accepts natural language queries from the user, such as ”How do I
make the sign for ’A’?”, and processes the text to identify key intent. Based on the keyword, the
module retrieves specific, descriptive anatomical instructions (e.g., ”Fold your fingers down and
keep your thumb upright”) and displays them in an overlay chat interface. This ensures that the
user receives multi-modal guidance without interrupting the learning flow.

3.3.5 Gamification Progress Tracking Module
Designed to increase user retention and motivation, this module manages the gamified mechanics.
It automatically calculates and updates the user’s Experience Points (XP) upon every successful
AI validation and tracks ”Daily Streaks” to encourage consistent habits. It also includes a

”Daily Quest” section to complete daily tasks to keep the user’s addictive. Crucially, it handles
personalization by logging repeated failures into a ”Weakness Tracker,” allowing the system to
recommend focused practice sessions for difficult signs. This module also aggregates data to
update the global leaderboard, fostering a healthy competitive environment among users.

3.3.6 Administrator Control Analytics Module
This module provides a comprehensive dashboard for the administrator to monitor the system’s
health and community engagement. Beyond basic user management tasks, it includes advanced
features such as automatically identifying ”Top Performers”. It also aggregates user ratings
and feedback on specific lessons, allowing the administrator to assess the quality of the content.
Visual analytics regarding daily active users and module completion rates are generated here to
help the admin understand learning trends.
3.4 FEASIBILITY STUDY
The feasibility study assesses the practicality of implementing the automated sign language tutor,
considering operational, technical, and economic factors to ensure the successful deployment of
the project.
3.4.1 Operational Feasibility
The system is designed with a mobile-first, responsive interface that mimics the user experience
of popular social media and gaming applications. This familiarity ensures that users of all
demographic backgrounds can navigate the platform with minimal training. The core feature of
AI feedback is highly intuitive, utilizing simple visual cues like green borders for success and
red for failure, which requires no technical knowledge to understand. Since the system directly
solves the primary frustration of self-taught learners—the uncertainty of accuracy—it is highly
operationally feasible and likely to be readily accepted by the target audience.
3.4.2 Technical Feasibility
The project is technically sound and relies on robust, modern technologies suitable for mobile
application development. The application is built using React Native for the frontend, ensuring
a responsive cross-platform user experience on handheld devices, while the backend is powered
by Python Flask, which is highly efficient for handling API requests and integrating with AI
logic. The artificial intelligence component utilizes MediaPipe, which is optimized for real-time
on-device processing on mobile hardware. This client-side processing approach eliminates the
need for heavy backend GPU servers for gesture recognition and ensures that the application
runs smoothly on standard smartphones. Additionally, MongoDB is used as the NoSQL database
for flexible and scalable data storage. Given the maturity and strong community support for
these tools, the technical risks associated with implementation are minimal.

3.4.3 Economic Feasibility
Sign-Lingo is a highly cost-effective solution that is economically sustainable. The development
relies entirely on open-source software and libraries, incurring zero licensing costs. Unlike
hardware-based sign language translation systems that require expensive data gloves or depth
sensors, this system requires only a standard device camera, which is a peripheral most users
already possess. This significantly lowers the barrier to entry for students and reduces the capital
investment required for deployment. By automating the tutoring process, the system provides a
scalable model for free education, ensuring long-term economic viability.

3.5 SYSTEM ENVIRONMENT
This section outlines the system requirements necessary for developing and deploying the
Sign-Lingo application. It includes both developer and user environments, ensuring seamless
functioning during implementation and usage.

3.5.1 Developer Requirements
3.5.1.1 Hardware Requirements
To support the development, compilation, and testing of the mobile application and backend
servers, the following hardware configuration is recommended:

Processor: Intel Core i3 or higher (quad-core)
RAM: 8 GB or above
Storage: Minimum 256 GB Hard Disk Drive or SSD (for faster processing)
3.5.1.2 Software Requirements
The system will be developed using open-source and widely supported tools suitable for mobile
AI development. The required software stack includes:

Operating System: Windows 10 / 11, Linux or macOS
Front-End Technologies: React Native, JavaScript (ES6+), Tailwind CSS
Back-End Framework: Python Flask
Image Processing Library: OpenCV
AI/Gesture Recognition Engine: MediaPipe, TensorFlow (Keras)
Database: MongoDB
IDE / Code Editor: Visual Studio Code
Testing Tool: jest for web and mobile application
Version History : git
3.5.2 User Requirements
To access the system through the mobile application and utilize the AI features effectively, the
following user-level setup is sufficient:

Device: Any standard Smartphone (Android or iOS)
Operating System: Android 8.0 (Oreo) or higher / iOS 12 or higher
Hardware Peripheral: Functional front-facing camera (Required for AI gesture recogni-
tion)
Internet Connection: Stable connection (at least 1 Mbps)
3.6 ACTORS AND THEIR ROLES
3.6.1 Admin
Logs into the web portal to access the admin dashboard
Manages student accounts (views user lists)
Views system analytics including active users and module completion rates
Monitors the Global Leaderboard to identify top performers
Reviews user feedback, ratings, and bug reports
3.6.2 User
Logs into the mobile application
Selects learning modules (Alphabets, Numbers, Greetings...)
Views visual references (GIFs/Images)
Attempts interactive quizzes to earn XP and maintain daily streaks
Captures hand movement sequences using the mobile camera for AI analysis
Receives real-time feedback (Success/Fail) on sign accuracy
Interacts with the Chatbot for descriptive assistance
Participates in Daily Quests to maintain engagement
Accesses ”Weakness Mode” to review and practice failed signs
submit ratings/feedback
CHAPTER 4
SYSTEM DESIGN
4.1 METHODOLOGY
The development of the Sign-Lingo application follows the Agile methodology, utilizing an
iterative approach to manage the integration of AI within a mobile framework. This allows for
continuous refinement based on user feedback. Agile divides the project into manageable sprints,
covering planning, development, testing, and review phases. This structure ensures rapid issue
resolution, which is essential for systems relying on real-time gesture recognition and mobile
video processing. Early sprints focus on the interaction between the React Native frontend and
the Python Flask backend. The priority is establishing the core architecture and ensuring the
mobile camera feed correctly captures and transmits data. Securing this communication pipeline
early guarantees that high-quality frames are available for the AI engine, a critical requirement
for accurate sign detection.

The methodology supports progressive implementation, developing the AI logic incrementally.
Subsequent phases focus on tuning geometric rules to recognize specific signs under varying
lighting conditions. Once recognition is stable, gamification features such as XP systems, Daily
Quest and leaderboards are integrated. This flexibility ensures the timely delivery of features
that enhance both accuracy and user engagement. Ultimately, this user-centered environment
ensures the system is efficient and well-suited to handheld learning. Iterative testing of features
like ”Weakness Mode” ensures the final product functions technically and effectively addresses
the challenges of passive learning by providing reliable, real-time feedback.


# One-Handed ASL Words for Mobile App

## Prioritized List (50 One-Handed Signs)

This list focuses on **one-handed ASL signs** suitable for mobile app where users hold the phone with one hand and sign with the other.

---

✅ Category 1: Greetings & Basics

No changes needed here, just filled in the missing descriptions.

ID	Word	Description	Difficulty
1	HELLO	Wave hand side to side	Easy
2	GOODBYE	Open hand wave	Easy
3	YES	Fist nodding up/down	Easy
4	NO	Index/middle fingers snap	Easy
5	PLEASE	Circular motion on chest (one hand)	Easy
6	THANK_YOU	Hand from chin forward	Easy
7	SORRY	Fist rub chest in circle	Easy
8	OK	O-shape with thumb and index	Easy
9	FINE	5-hand (open palm) thumb taps chest	Easy
10	WELCOME	Hand sweep toward body	Easy

✅ Category 2: Personal & Pronouns

Filled in the missing descriptions. Note: CHILD usually uses two hands (patting heads), so I swapped it for BOY which is strictly one-handed.

ID	Word	Description	Difficulty
11	ME/I	Point to chest	Easy
12	YOU	Point forward	Easy
13	HE/SHE	Point to side	Easy
14	MY	Palm on chest	Easy
15	YOUR	Point palm forward	Easy
16	MOTHER	Thumb on chin (5-hand)	Easy
17	FATHER	Thumb on forehead (5-hand)	Easy
18	CHILD	Hand grabs imaginary cap at forehead	Easy
19	UNCLE	U-hand shakes at temple	Easy
20	AUNT	A-hand circles at cheek	Easy

✅ Category 3: Emotions & States

Replaced 2-handed signs (Happy, Sad, Love, Tired, Sick) with strictly one-handed emotional/state signs.

ID	Word	Description	Difficulty
21	PROUD	Thumb draws line up chest	Easy
22	LONELY	Index finger circles near lips	Easy
23	MAD	Claw hand from face	Medium
24	FUNNY	Index & middle fingers brush nose	Easy
25	LIKE	Pull from chest (one hand)	Medium
26	GOOD	Hand from chin down	Easy
27	BAD	Hand flip down from chin	Easy
28	HUNGRY	C-hand down throat	Medium
29	THIRSTY	Index finger tracks down throat	Easy
30	HOT	Claw hand throws "heat" from mouth	Easy

✅ Category 4: Questions, Time & Directions

Replaced 2-handed signs (What, When, How, Now) with your extra Directional words.

ID	Word	Description	Difficulty
31	SOON	F-hand (thumb/index circle) taps chin	Easy
32	WHO	Circle index around lips	Medium
33	WHERE	Wave index side to side	Easy
34	SAME	Y-hand slides side to side	Easy
35	WHY	Y-hand from forehead	Medium
36	LEFT	L-hand moves to the left	Easy
37	RIGHT	R-hand moves to the right	Easy
38	LATER	L-hand forward (thumb pivot)	Easy
39	YESTERDAY	Thumb on cheek backward	Medium
40	TOMORROW	Thumb on cheek forward	Medium

✅ Category 5: Important & Daily Words

Replaced 2-handed signs (Help, School, Work) with your extra True/False words and other one-handed essentials.

ID	Word	Description	Difficulty
41	TRUE	Index finger moves forward from lips	Easy
42	WATER	W-hand taps chin	Easy
43	FOOD	Fingers to mouth (squashed O)	Easy
44	HOME	Fingers from mouth to cheek	Medium
45	FALSE	Index finger brushes past nose	Easy
46	NEED	X-hand (hook) moves down	Easy
47	PHONE	Y-hand at ear	Easy
48	BATHROOM	T-hand shakes side to side	Easy
49	FINISH	5-hand flips out (one hand variation)	Easy
50	UNDERSTAND	Flick index finger up at forehead	Easy
