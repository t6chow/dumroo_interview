import pandas as pd
import numpy as np
import random

def generate_bbl_data_poisson(num_samples=1000):
    data = []
    states = ['Mastery', 'Productive Struggle', 'Uncertainty', 'Guessing']
    
    for _ in range(num_samples):
        state = random.choice(states)
        
        # Inside your loop...
        if state == 'Mastery':
            rt_z = np.random.normal(-0.8, 0.2) 
            tc = np.random.poisson(0.2)
            is_correct = 1 # Masters almost always get it right

        elif state == 'Productive Struggle':
            rt_z = np.random.normal(0.7, 0.3)
            tc = np.random.poisson(0.8)
            is_correct = 1 # The "struggle" pays off!

        elif state == 'Uncertainty':
            rt_z = np.random.normal(0.8, 0.5)
            tc = np.random.poisson(5.0)
            # 30% chance they stumble into the right answer
            is_correct = np.random.choice([0, 1], p=[0.7, 0.3]) 

        elif state == 'Guessing':
            rt_z = np.random.normal(-1.8, 0.2)
            tc = np.random.poisson(2.5)
            # Pure luck (assuming a 4-choice quiz)
            is_correct = np.random.choice([0, 1], p=[0.75, 0.25])
            
        data.append([round(rt_z, 2), tc, is_correct, state])

    df = pd.DataFrame(data, columns=['rel_response_time', 'toggle_count', 'is_correct', 'learner_state'])
    df.to_csv('bbl_poisson_data.csv', index=False)
    print("Dataset generated with Poisson distributions!")

generate_bbl_data_poisson(1000)