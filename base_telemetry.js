let startTime = performance.now();
let toggleCount = 0;
let selectedAnswer = null;

// Call this every time a user clicks a multiple-choice option
function handleOptionClick(optionValue) {
    if (selectedAnswer !== null && selectedAnswer !== optionValue) {
        toggleCount++; // They changed their mind!
    }
    selectedAnswer = optionValue;
}

// Call this when they hit "Submit"
async function handleSubmit() {
    const endTime = performance.now();
    const totalSeconds = (endTime - startTime) / 1000;
    const isCorrect = selectedAnswer === "correct_value";

    // Prepare the data for Supabase
    const telemetryData = {
        question_id: "...", 
        raw_rt: totalSeconds,
        toggle_count: toggleCount,
        is_correct: isCorrect,
        student_name: "Student A"
    };

    // NEXT STEP: Send this to your ML Model + Supabase
    console.log("Telemetry Captured:", telemetryData);
}