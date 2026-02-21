import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# 1. Load the data
df = pd.read_csv('bbl_poisson_data.csv')

# 2. Features (X) and Target (y)
X = df[['rel_response_time', 'toggle_count', 'is_correct']]
y = df['learner_state']

# 3. Split into Training (80%) and Testing (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Initialize and Train the Random Forest
# We use 100 trees (n_estimators) to ensure stability
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. Evaluate the model
y_pred = model.predict(X_test)
print("--- Model Performance ---")
print(classification_report(y_test, y_pred))

# 6. Save the model for your Web App
joblib.dump(model, 'bbl_student_model.pkl')
print("\nModel saved as 'bbl_student_model.pkl'")