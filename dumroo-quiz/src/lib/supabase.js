import { createClient } from '@supabase/supabase-js'

const url = "https://opitvfomwzmhgzqbtijp.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waXR2Zm9td3ptaGd6cWJ0aWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODkyNzksImV4cCI6MjA4NzE2NTI3OX0.fYkmSVQjd3pHa6ALFts70u8Lw1iZ7nh1gdbsbyg9dMw"

export const supabase = createClient(url, key)
