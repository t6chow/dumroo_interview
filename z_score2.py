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

def process_batch_results(question_id):
    # 1. Fetch all submissions for this question
    response = supabase.table("quiz_submissions") \
        .select("*") \
        .eq("question_id", question_id) \
        .execute()
    
    subs = response.data
    if not subs: return

    # 2. Calculate the Batch Stats (The "Fair" Baseline)
    raw_times = [s['raw_rt'] for s in subs]
    batch_avg = sum(raw_times) / len(raw_times)
    
    # Calculate Standard Deviation for the group
    variance = sum((x - batch_avg) ** 2 for x in raw_times) / len(raw_times)
    batch_std = variance ** 0.5
    if batch_std == 0: batch_std = 0.5 # Safety floor

    print(f"Batch Stats for {question_id}: Avg={batch_avg:.2f}, Std={batch_std:.2f}")

    # 3. Process every student using the same group baseline
    for sub in subs:
        # Normalize relative to their peers
        z_score = (sub['raw_rt'] - batch_avg) / batch_std
        
        # Inference
        features = [[z_score, sub['toggle_count'], int(sub['is_correct'])]]
        prediction = model.predict(features)[0]

        # 4. Update the database
        supabase.table("quiz_submissions").update({
            "ml_state_prediction": prediction
        }).eq("id", sub['id']).execute()

    # 5. Optional: Update the questions table once for historical record
    supabase.table("questions").update({
        "avg_rt": batch_avg,
        "std_rt": batch_std,
        "total_attempts": len(subs)
    }).eq("id", question_id).execute()

    print(f"Successfully processed {len(subs)} students fairly.")