import sqlite3
import hashlib
import datetime as dt
import numpy as np
from sklearn.cluster import KMeans

from datetime import datetime, timezone

datetime.now(timezone.utc)

DB_NAME = "DeepfakeGame.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # create Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        Username TEXT UNIQUE NOT NULL,
        Password TEXT NOT NULL,
        FirstName TEXT,
        LastName TEXT,
        Email TEXT,
        HighScore INTEGER DEFAULT 0,
        LastEmailUpdate TEXT
    )
    ''')

    # create Questions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Questions (
        QuestionID INTEGER PRIMARY KEY AUTOINCREMENT,
        QuestionType TEXT NOT NULL,
        QuestionString TEXT NOT NULL
    )
    ''')

    # create Answers table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Answers (
        AnswerID INTEGER PRIMARY KEY AUTOINCREMENT,
        QuestionID INTEGER NOT NULL,
        Correct BOOLEAN NOT NULL,
        AnswerString TEXT NOT NULL,
        Feedback TEXT NOT NULL,
        FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
    )
    ''')

    # create Leaderboard table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Leaderboard (
        BoardID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER,
        Score INTEGER DEFAULT 0,
        ScoreDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    )
    ''')


        # Per-attempt responses (NEW)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Responses (
        ResponseID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        QuestionID INTEGER NOT NULL,
        Correct INTEGER NOT NULL,           -- 0/1
        ResponseTimeMs INTEGER NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
    )
    ''')

    # Cached difficulty per user (NEW)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS UserDifficulty (
        UserID INTEGER PRIMARY KEY,
        Tier TEXT NOT NULL,                 -- 'Easy','Medium','Hard'
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    )
    ''')

    # create PasswordResetTokens table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS PasswordResetTokens (
        Email TEXT PRIMARY KEY,
        Token TEXT NOT NULL,
        Expiry TIMESTAMP NOT NULL
    )
    ''')

    conn.commit()
    conn.close()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

    # add user to database


def add_user(username: str, password: str, first_name: str, last_name: str, email: str):
    # add user to database, return userID
    conn = get_connection()
    cursor = conn.cursor()

    # see if user already exists in db
    cursor.execute('''SELECT 1 FROM Users WHERE Username=?''', (username,))
    if cursor.fetchone() is not None:
        return -1
    hashed_pw = hash_password(password)

    # see if the email already exists in db
    cursor.execute('''SELECT 1 FROM Users WHERE Email=?''', (email,))
    if cursor.fetchone() is not None:
        return -2

    cursor.execute('''
    INSERT INTO Users (Username, Password, FirstName, LastName, Email)
    VALUES (?, ?, ?, ?, ?)
    ''', (username, hashed_pw, first_name, last_name, email))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id


def authenticate_user(username: str, password: str):
    # authenticate a user and return UserID
    conn = get_connection()
    cursor = conn.cursor()
    hashed_pw = hash_password(password)
    cursor.execute('''
    SELECT UserID 
    FROM Users 
    WHERE Username = ? AND Password = ?
    ''', (username, hashed_pw))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None



def add_question(question_type, question_string):
    # add a question to the database
    # type is either 'text', 'image', or 'video'

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO Questions (QuestionType, QuestionString)
    VALUES (?, ?)
    ''', (question_type, question_string))
    conn.commit()
    return cursor.lastrowid


def add_answer(question_id, correct, answer_string, feedback):
    # add an answer to the database
    # answer_string: either text answer or path to media
    # feedback: Explanation why answer is correct/incorrect or why media is deepfake or not

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO Answers (QuestionID, Correct, AnswerString, Feedback)
    VALUES (?, ?, ?, ?)
    ''', (question_id, correct, answer_string, feedback))
    conn.commit()
    return cursor.lastrowid


def update_leaderboard(user_id, score):
    conn = get_connection()
    cursor = conn.cursor()

    # Check if user already has a score
    cursor.execute('''
    SELECT Score FROM Leaderboard WHERE UserID = ?
    ''', (user_id,))
    existing_score = cursor.fetchone()

    if existing_score:
        if score > existing_score[0]:
            cursor.execute('''
            UPDATE Leaderboard 
            SET Score = ?
            WHERE UserID = ?
            ''', (score, user_id))
    else:
        cursor.execute('''
        INSERT INTO Leaderboard (UserID, Score)
        VALUES (?, ?)
        ''', (user_id, score))

    conn.commit()
    conn.close()
    return cursor.lastrowid


def get_user_highscore(user_id):
    # get user's high score
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT HighScore FROM Users WHERE UserID = ?', (user_id,))
    row = cursor.fetchone() 
    conn.close()
    return cursor.fetchone()[0]


def get_question_with_answers(question_id):
    # get a question and return and its answers
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT 
        q.QuestionString,
        q.QuestionType,
        a.AnswerString,
        a.Correct,
        a.Feedback
    FROM Questions q
    LEFT JOIN Answers a ON q.QuestionID = a.QuestionID
    WHERE q.QuestionID = ?
    ''', (question_id,))
    return cursor.fetchall()


def get_media_question_count():
    # get count of image and video questions
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT QuestionType, COUNT(*) 
    FROM Questions 
    WHERE QuestionType IN ('image', 'video')
    GROUP BY QuestionType
    ''')
    return cursor.fetchall()


def get_questions_by_type(question_type):
    # get all questions of a specific type
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT QuestionID, QuestionString
    FROM Questions
    WHERE QuestionType = ?
    ''', (question_type,))
    return cursor.fetchall()


def get_leaderboard(limit=10):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT u.Username, l.Score
    FROM Leaderboard l
    JOIN Users u ON l.UserID = u.UserID
    ORDER BY l.Score DESC 
    LIMIT ?
    ''', (limit,))
    result = cursor.fetchall()
    conn.close()
    return [{"username": row[0], "score": row[1]} for row in result]


def get_media(question_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
       SELECT 
           a.AnswerString
       FROM Questions q
       LEFT JOIN Answers a ON q.QuestionID = a.QuestionID
       WHERE q.QuestionID = ?
       ''', (question_id,))
    return cursor.fetchall()


def create_populate():
    init_db()
    # # adding question & answers
    qid = add_question('image', 'example question')
    add_answer(qid, True, "1drmg.jpg", "")
    add_answer(qid, False, "1rmg.jpg", "Focus on the jawline and cheeks. The fake image shows smoother skin and less "
                                       "defined shadows, especially around the lower face. There's also a slight "
                                       "mismatch in skin tone blending near the ears.")
    #
    #
    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "2kgd.png", "")
    add_answer(qid, False, "2kp.jpg", "Check the area around the nose and mouth. The fake has flatter lighting and "
                                      "less skin texture, making the face appear more artificial. Look closely at "
                                      "the eyes—reflection and sharpness are off.")

    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "3dd.jpg", "")
    add_answer(qid, False, "3d.jpg", "Notice the eyes and expression. The fake image may have slightly off-angle eye "
                                     "alignment and a glossy, unnatural look. Skin under the eyes and jaw appears "
                                     "softer in the fake version.")

    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "4_fake.png", "")
    add_answer(qid, False, "4_real.jpg", "Pay attention to the lighting on the forehead and nose. The fake version "
                                         "has over-smooth lighting with unrealistic highlights, and the texture of "
                                         "the skin is less detailed.")

    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "5_fake.jpg", "")
    add_answer(qid, False, "5_real.jpg", "Look at the transition between the face and the hairline. In the fake, "
                                         "the face may look like it's 'pasted on' due to different resolution or "
                                         "color blending. Neck and hand skin tones may also mismatch.")

    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "6_fake.png", "")
    add_answer(qid, False, "6_real.png", "Watch the edges of the face and lighting across the forehead. The fake "
                                         "might have overly smooth transitions and slightly plastic skin.")

    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "7_fake.png", "")
    add_answer(qid, False, "7_real.jpg", "Look at the hair—it may seem oddly placed or unnaturally blended in the "
                                          "fake. Also inspect eye detail and sharpness.")

    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "8_fake.png", "")
    add_answer(qid, False, "8_real.png", "Pay attention to the jawline and neck shadow. Fakes often render these "
                                         "inconsistently.")

    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "9_fake.png", "")
    add_answer(qid, False, "9_real.jpg", "This one doesn't have a matching real counterpart, but you can still "
                                         "examine the expression, posture, and eye sharpness.")

    qid = add_question('image', 'Select the Deepfake')
    add_answer(qid, True, "10_fake.png", "")
    add_answer(qid, False, "10_real.jpg", "Look closely at the mouth area and cheeks. Smile blending and cheek "
                                           "shadowing can be tells.")

    print("images done.")
    # Adding video questions
    qid = add_question('video', 'Select the Deepfake Video')
    add_answer(qid, True, "1_fake.mp4", "")
    add_answer(qid, False, "1_real.mp4", "Watch for unnatural facial movements—especially around the mouth and eyes. In the fake, the lip sync may be slightly off, and blinking patterns could appear robotic or too slow.")

    qid = add_question('video', 'Select the Deepfake Video')
    add_answer(qid, True, "2_fake.mp4", "")
    add_answer(qid, False, "2_real.mp4", "Look closely at the transitions when the head turns. The fake version may show jittery edges, blending artifacts around the jaw, or inconsistent lighting on the face that doesn't match the body or background.")

    qid = add_question('video', 'Select the Deepfake Video')
    add_answer(qid, True, "6_fake.mp4", "")
    add_answer(qid, False, "6_real.mp4", "The fake video might show overly smooth skin texture and slightly floaty facial features during talking. Watch the transition between jawline and neck — it may flicker or glow unnaturally.")


    print("videos done.")
    # Adding text questions about deepfakes
    qid = add_question('text', 'What is a deepfake?')
    add_answer(qid, True, "A video or audio clip altered using AI to mimic real people", "Deepfakes are synthetic media created using artificial intelligence to manipulate or generate visual and audio content.")
    add_answer(qid, False, "A prank video", "")
    add_answer(qid, False, "A fake news article", "")
    add_answer(qid, False, "A social media rumor", "")

    qid = add_question('text', "What is the main purpose behind creating malicious deepfakes?")
    add_answer(qid, True, "Spreading misinformation or manipulation", "Malicious deepfakes are often created to deceive, manipulate public opinion, or spread false information.")
    add_answer(qid, False, "Entertainment only", "")
    add_answer(qid, False, "Improving camera quality", "")
    add_answer(qid, False, "Fixing low-quality audio", "")

    qid = add_question('text', "What's the key difference between deepfakes and cheapfakes?")
    add_answer(qid, True, "Deepfakes use AI; cheapfakes rely on manual edits like speed or cropping", "While both can be used to manipulate media, deepfakes use advanced AI technology, whereas cheapfakes use simpler editing techniques.")
    add_answer(qid, False, "Deepfakes use simple video editing tools", "")
    add_answer(qid, False, "Cheapfakes cost more to produce", "")
    add_answer(qid, False, "Cheapfakes are always funny", "")

    qid = add_question('text', "Which of the following can also be deepfaked, besides video?")
    add_answer(qid, True, "Voice", "Audio deepfakes can replicate someone's voice with high accuracy using AI technology.")
    add_answer(qid, False, "Music", "")
    add_answer(qid, False, "Captions", "")
    add_answer(qid, False, "Filters", "")

    qid = add_question('text', "Why are deepfakes becoming more common?")
    add_answer(qid, True, "AI tools and editing apps are easier to use", "The increasing accessibility of AI tools and editing software has made creating deepfakes more widespread.")
    add_answer(qid, False, "People watch more videos", "")
    add_answer(qid, False, "News networks promote them", "")
    add_answer(qid, False, "Video quality is improving", "")

    qid = add_question('text', "What is a common visual flaw in deepfake videos?")
    add_answer(qid, True, "Inconsistent blinking or eye movement", "AI often struggles to perfectly replicate natural eye movements and blinking patterns.")
    add_answer(qid, False, "High contrast lighting", "")
    add_answer(qid, False, "Sharp shadows", "")
    add_answer(qid, False, "Background noise", "")

    qid = add_question('text', "Which of the following could be a red flag in a deepfake?")
    add_answer(qid, True, "Melting or glitching around the mouth", "Imperfections around facial features, especially the mouth, are common indicators of deepfake manipulation.")
    add_answer(qid, False, "Natural hand gestures", "")
    add_answer(qid, False, "Perfect audio syncing", "")
    add_answer(qid, False, "Consistent lighting", "")

    qid = add_question('text', "If a person in the video never blinks or blinks strangely, what might this suggest?")
    add_answer(qid, True, "It might be a deepfake", "Unnatural blinking patterns are a common sign of AI-generated content.")
    add_answer(qid, False, "They're tired", "")
    add_answer(qid, False, "It's edited for TV", "")
    add_answer(qid, False, "The video is sped up", "")

    qid = add_question('text', "Why is lip-syncing sometimes off in deepfakes?")
    add_answer(qid, True, "AI struggles with matching speech and motion perfectly", "Current AI technology still has limitations in perfectly synchronizing facial movements with speech.")
    add_answer(qid, False, "Bad acting", "")
    add_answer(qid, False, "Low camera quality", "")
    add_answer(qid, False, "Too much background noise", "")

    qid = add_question('text', "What's one way to identify a fake voice in an audio deepfake?")
    add_answer(qid, True, "Robotic or monotone sound", "AI-generated voices often lack natural variations in tone and emotion.")
    add_answer(qid, False, "Too much emotion", "")
    add_answer(qid, False, "Perfect grammar", "")
    add_answer(qid, False, "High-pitched tone", "")

    qid = add_question('text', "Which kind of video is most suspicious?")
    add_answer(qid, True, "Viral video with shocking claims and no source", "Unverified viral content with sensational claims should always be treated with skepticism.")
    add_answer(qid, False, "Official press conference", "")
    add_answer(qid, False, "Casual vlog", "")
    add_answer(qid, False, "Family cooking tutorial", "")

    qid = add_question('text', "How can you verify the source of a video?")
    add_answer(qid, True, "Look for the original uploader or trusted news sources", "Verifying the original source and checking with reputable news organizations is crucial for authenticity.")
    add_answer(qid, False, "Count the likes", "")
    add_answer(qid, False, "Check who shared it", "")
    add_answer(qid, False, "Look at the comments", "")

    qid = add_question('text', "Why is it suspicious if a public figure suddenly changes their views in a video?")
    add_answer(qid, True, "It might be edited or faked", "Sudden, uncharacteristic changes in public statements should raise red flags about potential manipulation.")
    add_answer(qid, False, "People can change", "")
    add_answer(qid, False, "They're joking", "")
    add_answer(qid, False, "They were misquoted", "")

    qid = add_question('text', "What should you do when you see a surprising video online?")
    add_answer(qid, True, "Search for the video on fact-checking or news sites", "Verifying information through trusted fact-checking sources is essential before believing or sharing content.")
    add_answer(qid, False, "Share it immediately", "")
    add_answer(qid, False, "Trust your gut", "")
    add_answer(qid, False, "Ignore it", "")

    qid = add_question('text', "What makes celebrity deepfakes especially dangerous?")
    add_answer(qid, True, "They can spread false endorsements or political opinions", "Celebrity deepfakes can be used to spread misinformation or false endorsements due to their wide reach and influence.")
    add_answer(qid, False, "They're funny", "")
    add_answer(qid, False, "People always believe celebrities", "")
    add_answer(qid, False, "Celebrities are always in the news", "")

    qid = add_question('text', "How can you check if a video or image has been manipulated?")
    add_answer(qid, True, "Use a reverse image search", "Reverse image search tools can help identify the original source and potential manipulations of media content.")
    add_answer(qid, False, "Turn off the sound", "")
    add_answer(qid, False, "Ask a friend", "")
    add_answer(qid, False, "Zoom in closely", "")

    qid = add_question('text', "If you see a suspected deepfake, what should you do on social platforms?")
    add_answer(qid, True, "Report it using platform tools", "Reporting suspicious content helps platforms identify and remove harmful deepfakes.")
    add_answer(qid, False, "Share it to warn others", "")
    add_answer(qid, False, "Save it for later", "")
    add_answer(qid, False, "Comment 'fake'", "")

    qid = add_question('text', "Which kind of content is most reliable?")
    add_answer(qid, True, "Verified news outlet footage", "Content from verified and reputable news sources typically undergoes fact-checking and verification processes.")
    add_answer(qid, False, "Random viral videos", "")
    add_answer(qid, False, "Private messages", "")
    add_answer(qid, False, "Anonymous posts", "")

    qid = add_question('text', "Should AI-generated content be clearly labeled?")
    add_answer(qid, True, "Yes, people deserve to know what's real", "Transparency about AI-generated content helps maintain trust and allows people to make informed decisions.")
    add_answer(qid, False, "No, it's obvious anyway", "")
    add_answer(qid, False, "Only if it's a video", "")
    add_answer(qid, False, "Only politicians need labeling", "")

    qid = add_question('text', "What's a great way to help friends spot deepfakes?")
    add_answer(qid, True, "Talk about digital literacy and give examples", "Educating others about digital literacy and providing real examples helps build awareness and critical thinking skills.")
    add_answer(qid, False, "Tell them to stop using social media", "")
    add_answer(qid, False, "Share suspicious videos", "")
    add_answer(qid, False, "Ignore what they share", "")
    print("text done.")


    


#create_populate()


# Setting db
# Example: store in a tokens table with columns: email, token, expires_at

def get_user_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT UserID, Username, Email
    FROM Users
    WHERE Email = ?
    ''', (email,))
    result = cursor.fetchone()
    conn.close()
    return result  # will be None if not found


def update_username(user_id, new_username):
    conn = get_connection()
    cursor = conn.cursor()

    # Check if username exists
    cursor.execute('''SELECT 1 FROM Users WHERE Username=?''', (new_username,))
    if cursor.fetchone() is not None:
        conn.close()
        return -1  # Username already exists

    cursor.execute('''
    UPDATE Users SET Username = ? WHERE UserID = ?
    ''', (new_username, user_id))
    conn.commit()
    conn.close()
    return 1  # Succes


def update_email(user_id, new_email):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    # Check if email exists
    cursor.execute('''SELECT 1 FROM Users WHERE Email=?''', (new_email,))
    if cursor.fetchone() is not None:
        conn.close()
        return -1  # Email already exists

    cursor.execute('''
    UPDATE Users SET Email = ?, LastEmailUpdate = ? WHERE UserID = ?
    ''', (new_email, now, user_id))
    conn.commit()
    updated = cursor.rowcount
    conn.close()
    return updated  # Success


def update_password(user_id, new_password):
    conn = get_connection()
    cursor = conn.cursor()

    hashed_pw = hash_password(new_password)
    cursor.execute('''
    UPDATE Users SET Password = ? WHERE UserID = ?
    ''', (hashed_pw, user_id))
    conn.commit()
    conn.close()
    return 1  # Success


def authenticate_user_by_id(user_id, password):
    conn = get_connection()
    cursor = conn.cursor()
    hashed_pw = hash_password(password)
    cursor.execute('''
    SELECT UserID 
    FROM Users 
    WHERE UserID = ? AND Password = ?
    ''', (user_id, hashed_pw))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None


def delete_user_by_username(username):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # First, check if the user exists
        cursor.execute('SELECT 1 FROM Users WHERE Username = ?', (username,))
        if not cursor.fetchone():
            conn.close()
            return 0  # User not found

        # Then delete the user
        cursor.execute('DELETE FROM Users WHERE Username = ?', (username,))
        rows_deleted = cursor.rowcount
        conn.commit()
        conn.close()
        return rows_deleted
    except Exception as e:
        print(f"Error deleting user {username}: {str(e)}")
        # Try to rollback if possible
        try:
            if conn:
                conn.rollback()
                conn.close()
        except:
            pass
        return 0  # Return 0 to indicate failure   


def delete_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM Users WHERE Email = ?', (email,))
    rows_deleted = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_deleted


def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT UserID, Username, FirstName, LastName, Email, HighScore
    FROM Users
    WHERE UserID = ?
    ''', (user_id,))
    result = cursor.fetchone()
    conn.close()
    return row


def get_email(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''

    Select Email
    FROM Users
    WHERE UserID = ?
    ''', (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result


def update_user_email(username, password, current_email, new_email):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
        UPDATE Users 
        SET Email = ?, LastEmailUpdate = ? 
        WHERE Username = ? AND Email = ?""",
                   (new_email, now, username, current_email))

    updated = cursor.rowcount
    conn.commit()
    conn.close()
    return updated

def record_response(user_id, question_id, correct, response_time_ms):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO Responses (UserID, QuestionID, Correct, ResponseTimeMs)
    VALUES (?, ?, ?, ?)
    ''', (user_id, question_id, int(correct), response_time_ms))
    conn.commit()
    conn.close()

def compute_user_features():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT UserID,
               AVG(Correct) as Accuracy,
               AVG(ResponseTimeMs) as AvgMs
        FROM Responses
        GROUP BY UserID
    ''')
    rows = cursor.fetchall()
    conn.close()
    if not rows: 
        return [], np.empty((0,2), dtype=float)
    
    users = [r[0] for r in rows]
    X = np.array([[r[1], r[2]] for r in rows], dtype=float)
    return users, X

def assign_tiers(users, X):
    if len(users) < 3:
        # fallback rule if not enough data
        tiers = {}
        for i, u in enumerate(users):
            acc, avg_ms = X[i]
            if acc >= 0.8 and avg_ms <= 2000: tiers[u] = "Easy"
            elif acc >= 0.5: tiers[u] = "Medium"
            else: tiers[u] = "Hard"
        return tiers

    X_scaled = np.column_stack([X[:,0], X[:,1] / 2000.0])
    km = KMeans(n_clusters=3, n_init="auto", random_state=42)
    labels = km.fit_predict(X_scaled)
    centers = km.cluster_centers_
    order = np.argsort(-(centers[:,0] - centers[:,1]))
    tier_names = ["Easy","Medium","Hard"]
    cluster_to_tier = {order[i]: tier_names[i] for i in range(3)}
    return {users[i]: cluster_to_tier[labels[i]] for i in range(len(users))}

def recompute_difficulty():
    users, X = compute_user_features()
    if len(users) == 0:
        return {}
    tiers = assign_tiers(users, X)
    conn = get_connection()
    cursor = conn.cursor()
    for u, t in tiers.items():
        cursor.execute('''
            INSERT INTO UserDifficulty (UserID, Tier, UpdatedAt)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(UserID) DO UPDATE SET
              Tier=excluded.Tier,
              UpdatedAt=CURRENT_TIMESTAMP
        ''', (u, t))
    conn.commit()
    conn.close()
    return tiers