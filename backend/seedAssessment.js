// // backend/seedAssessment.js
// import mongoose from 'mongoose';
// import { Assessment } from './models/assessmentModel.js';
// import 'dotenv/config';

// // Include all three assessment objects here (phq9Assessment, gad7Assessment, pssAssessment)
// const phq9Assessment = {
//   title: "Depression Screening (PHQ-9)",
//   description: "A 9-item depression screening tool used to assess the presence and severity of depressive symptoms.",
//   questions: [
//     {
//       text: "Little interest or pleasure in doing things",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     },
//     {
//       text: "Feeling down, depressed, or hopeless",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     },
//     {
//       text: "Trouble falling or staying asleep, or sleeping too much",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     },
//     {
//       text: "Feeling tired or having little energy",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     },
//     {
//       text: "Poor appetite or overeating",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     },
//     {
//       text: "Feeling bad about yourself — or that you're a failure or have let yourself or your family down",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     },
//     {
//       text: "Trouble concentrating on things, such as reading the newspaper or watching television",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     },
//     {
//       text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     },
//     {
//       text: "Thoughts that you would be better off dead or of hurting yourself in some way",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Depression"
//     }
//   ],
//   scoringRanges: [
//     {
//       minScore: 0,
//       maxScore: 4,
//       result: "Minimal depression",
//       recommendations: [
//         "Your score suggests minimal depression symptoms",
//         "Continue to monitor your mood",
//         "Practice self-care and maintain healthy habits"
//       ]
//     },
//     {
//       minScore: 5,
//       maxScore: 9,
//       result: "Mild depression",
//       recommendations: [
//         "Your score suggests mild depression symptoms",
//         "Consider talking to a healthcare provider",
//         "Practice stress-reduction techniques",
//         "Maintain social connections"
//       ]
//     },
//     {
//       minScore: 10,
//       maxScore: 14,
//       result: "Moderate depression",
//       recommendations: [
//         "Your score suggests moderate depression symptoms",
//         "We recommend consulting with a mental health professional",
//         "Consider therapy options like CBT",
//         "Talk to your doctor about treatment options"
//       ]
//     },
//     {
//       minScore: 15,
//       maxScore: 19,
//       result: "Moderately severe depression",
//       recommendations: [
//         "Your score suggests moderately severe depression symptoms",
//         "Strongly recommend consulting with a mental health professional",
//         "Consider therapy and discuss medication options with your doctor",
//         "Reach out to friends/family for support"
//       ]
//     },
//     {
//       minScore: 20,
//       maxScore: 27,
//       result: "Severe depression",
//       recommendations: [
//         "Your score suggests severe depression symptoms",
//         "Immediate consultation with a mental health professional is recommended",
//         "Contact a healthcare provider or crisis line if having suicidal thoughts",
//         "You don't have to go through this alone - help is available"
//       ]
//     }
//   ],
//   isActive: true
// };

// const gad7Assessment = {
//   title: "Anxiety Screening (GAD-7)",
//   description: "A 7-item anxiety screening tool used to assess generalized anxiety disorder symptoms.",
//   questions: [
//     {
//       text: "Feeling nervous, anxious, or on edge",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Anxiety"
//     },
//     {
//       text: "Not being able to stop or control worrying",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Anxiety"
//     },
//     {
//       text: "Worrying too much about different things",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Anxiety"
//     },
//     {
//       text: "Trouble relaxing",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Anxiety"
//     },
//     {
//       text: "Being so restless that it's hard to sit still",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Anxiety"
//     },
//     {
//       text: "Becoming easily annoyed or irritable",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Anxiety"
//     },
//     {
//       text: "Feeling afraid as if something awful might happen",
//       options: [
//         { text: "Not at all", value: 0 },
//         { text: "Several days", value: 1 },
//         { text: "More than half the days", value: 2 },
//         { text: "Nearly every day", value: 3 }
//       ],
//       category: "Anxiety"
//     }
//   ],
//   scoringRanges: [
//     {
//       minScore: 0,
//       maxScore: 4,
//       result: "Minimal anxiety",
//       recommendations: [
//         "Your score suggests minimal anxiety symptoms",
//         "Continue to monitor your feelings",
//         "Practice relaxation techniques as needed"
//       ]
//     },
//     {
//       minScore: 5,
//       maxScore: 9,
//       result: "Mild anxiety",
//       recommendations: [
//         "Your score suggests mild anxiety symptoms",
//         "Consider stress management techniques",
//         "Mindfulness exercises may be helpful",
//         "Monitor if symptoms persist or worsen"
//       ]
//     },
//     {
//       minScore: 10,
//       maxScore: 14,
//       result: "Moderate anxiety",
//       recommendations: [
//         "Your score suggests moderate anxiety symptoms",
//         "Consider consulting with a mental health professional",
//         "Cognitive Behavioral Therapy (CBT) can be effective",
//         "Practice regular relaxation techniques"
//       ]
//     },
//     {
//       minScore: 15,
//       maxScore: 21,
//       result: "Severe anxiety",
//       recommendations: [
//         "Your score suggests severe anxiety symptoms",
//         "Strongly recommend consulting with a mental health professional",
//         "Treatment options including therapy and/or medication may help",
//         "Consider stress reduction strategies and self-care"
//       ]
//     }
//   ],
//   isActive: true
// };


// const pssAssessment = {
//   title: "Perceived Stress Scale (PSS)",
//   description: "A 10-item scale measuring the degree to which situations in one's life are appraised as stressful.",
//   questions: [
//     {
//       text: "In the last month, how often have you been upset because of something that happened unexpectedly?",
//       options: [
//         { text: "Never", value: 0 },
//         { text: "Almost never", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Fairly often", value: 3 },
//         { text: "Very often", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you felt that you were unable to control the important things in your life?",
//       options: [
//         { text: "Never", value: 0 },
//         { text: "Almost never", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Fairly often", value: 3 },
//         { text: "Very often", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you felt nervous and 'stressed'?",
//       options: [
//         { text: "Never", value: 0 },
//         { text: "Almost never", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Fairly often", value: 3 },
//         { text: "Very often", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you felt confident about your ability to handle your personal problems?",
//       options: [
//         { text: "Very often", value: 0 },
//         { text: "Fairly often", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Almost never", value: 3 },
//         { text: "Never", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you felt that things were going your way?",
//       options: [
//         { text: "Very often", value: 0 },
//         { text: "Fairly often", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Almost never", value: 3 },
//         { text: "Never", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you found that you could not cope with all the things that you had to do?",
//       options: [
//         { text: "Never", value: 0 },
//         { text: "Almost never", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Fairly often", value: 3 },
//         { text: "Very often", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you been able to control irritations in your life?",
//       options: [
//         { text: "Very often", value: 0 },
//         { text: "Fairly often", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Almost never", value: 3 },
//         { text: "Never", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you felt that you were on top of things?",
//       options: [
//         { text: "Very often", value: 0 },
//         { text: "Fairly often", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Almost never", value: 3 },
//         { text: "Never", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you been angered because of things that happened that were outside of your control?",
//       options: [
//         { text: "Never", value: 0 },
//         { text: "Almost never", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Fairly often", value: 3 },
//         { text: "Very often", value: 4 }
//       ],
//       category: "Stress"
//     },
//     {
//       text: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?",
//       options: [
//         { text: "Never", value: 0 },
//         { text: "Almost never", value: 1 },
//         { text: "Sometimes", value: 2 },
//         { text: "Fairly often", value: 3 },
//         { text: "Very often", value: 4 }
//       ],
//       category: "Stress"
//     }
//   ],
//   scoringRanges: [
//     {
//       minScore: 0,
//       maxScore: 13,
//       result: "Low stress",
//       recommendations: [
//         "Your score suggests low perceived stress",
//         "Continue healthy stress management practices",
//         "Maintain good work-life balance"
//       ]
//     },
//     {
//       minScore: 14,
//       maxScore: 26,
//       result: "Moderate stress",
//       recommendations: [
//         "Your score suggests moderate perceived stress",
//         "Consider stress reduction techniques",
//         "Mindfulness and relaxation exercises may help",
//         "Evaluate work-life balance"
//       ]
//     },
//     {
//       minScore: 27,
//       maxScore: 40,
//       result: "High stress",
//       recommendations: [
//         "Your score suggests high perceived stress",
//         "Recommend stress management strategies",
//         "Consider counseling or therapy if stress is affecting daily life",
//         "Prioritize self-care and healthy coping mechanisms"
//       ]
//     }
//   ],
//   isActive: true
// };

// const seedDatabase = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log('Connected to MongoDB');
    
//     // Check if assessments already exist
//     const existingPHQ9 = await Assessment.findOne({ title: phq9Assessment.title });
//     const existingGAD7 = await Assessment.findOne({ title: gad7Assessment.title });
//     const existingPSS = await Assessment.findOne({ title: pssAssessment.title });

//     if (!existingPHQ9) {
//       const phq9 = new Assessment(phq9Assessment);
//       await phq9.save();
//       console.log('PHQ-9 assessment seeded');
//     }

//     if (!existingGAD7) {
//       const gad7 = new Assessment(gad7Assessment);
//       await gad7.save();
//       console.log('GAD-7 assessment seeded');
//     }

//     if (!existingPSS) {
//       const pss = new Assessment(pssAssessment);
//       await pss.save();
//       console.log('PSS assessment seeded');
//     }

//     console.log('Database seeding completed');
//     process.exit(0);
//   } catch (error) {
//     console.error('Error seeding database:', error);
//     process.exit(1);
//   }
// };

// seedDatabase();