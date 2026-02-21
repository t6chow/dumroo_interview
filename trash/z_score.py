import joblib
import pandas as pd
from supabase import create_client, Client
import time

# --- INITIALIZATION ---
url = "https://opitvfomwzmhgzqbtijp.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waXR2Zm9td3ptaGd6cWJ0aWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODkyNzksImV4cCI6MjA4NzE2NTI3OX0.fYkmSVQjd3pHa6ALFts70u8Lw1iZ7nh1gdbsbyg9dMw"
supabase: Client = create_client(url, key)

# Load your trained RFC model
model = joblib.load('bbl_student_model.pkl')

def process_new_submissions():
    # 1. Look for any submission that hasn't been analyzed yet
    response = supabase.table("quiz_submissions").select("*").is_("ml_state_prediction", "null").execute()
    submissions = response.data

    for sub in submissions:
        # 2. Get the "Normal" baseline for this specific question
        q_id = sub['question_id']
        q_data = supabase.table("questions").select("avg_rt", "std_rt", "total attempts").eq("id", q_id).single().execute()
        
        avg_rt = q_data.data['avg_rt']
        std_rt = q_data.data['std_rt']

        n = q_data.data.get('total_attempts')# or 0

        # 3. NORMALIZE (Z-score math)
        z_score = (sub['raw_rt'] - avg_rt) / std_rt if std_rt != 0 else 0
        
        # 4. INFERENCE (Run the Model)
        # Model expects: [[rel_response_time, toggle_count, is_correct]]
        features = [[z_score, sub['toggle_count'], int(sub['is_correct'])]]
        prediction = model.predict(features)[0]

        # 5. --- NEW CODE: UPDATE QUESTION BASELINE ---
        new_n = n + 1
        # Calculate new moving average
        new_avg = avg_rt + (sub['raw_rt'] - avg_rt) / new_n
        # Simplified moving standard deviation to keep the baseline shifting
        new_std = (std_rt * n + abs(sub['raw_rt'] - new_avg)) / new_n
        # Ensure std_rt doesn't hit 0 to avoid future math errors
        new_std = max(0.5, new_std)

        # Update the question stats in Supabase
        supabase.table("questions").update({
            "avg_rt": round(new_avg, 2),
            "std_rt": round(new_std, 2),
            "total_attempts": new_n
        }).eq("id", q_id).execute()

        # 5. UPDATE SUBMISSION with the ML prediction
        supabase.table("quiz_submissions").update({
            "ml_state_prediction": prediction
        }).eq("id", sub['id']).execute()
        
        print(f"Processed student {sub['student_name']}: State is {prediction}")

# Run this in a loop to act as a "Real-Time" listener
if __name__ == "__main__":
    print("Brain is online. Listening for quiz submissions...")
    while True:
        process_new_submissions()
        time.sleep(2) # Checks every 2 seconds