import joblib
import pandas as pd
from supabase import create_client, Client
import time
from z_score2 import process_batch_results

# --- INITIALIZATION ---
url = "https://opitvfomwzmhgzqbtijp.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waXR2Zm9td3ptaGd6cWJ0aWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODkyNzksImV4cCI6MjA4NzE2NTI3OX0.fYkmSVQjd3pHa6ALFts70u8Lw1iZ7nh1gdbsbyg9dMw"
supabase: Client = create_client(url, key)

def run_all_predictions():
    question_ids = supabase.table("questions").select("id").execute()
    for q in question_ids.data:
        process_batch_results(q['id'])

if __name__ == "__main__":
    run_all_predictions()