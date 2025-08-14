 import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Brain, ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

 const questions = [
  // Original questions
  {
    id: 1,
    text: "Feeling nervous, anxious, or on edge?",
    category: "anxiety",
  },
  {
    id: 2,
    text: "Little interest or pleasure in doing things?",
    category: "depression",
  },
  {
    id: 3,
    text: "Feeling down, depressed, or hopeless?",
    category: "depression",
  },
  {
    id: 4,
    text: "Trouble relaxing or feeling restless?",
    category: "anxiety",
  },
  {
    id: 5,
    text: "Feeling tired or having little energy?",
    category: "general",
  },
  // New questions
  {
    id: 6,
    text: "Difficulty concentrating on things like reading or watching TV?",
    category: "cognitive",
  },
  {
    id: 7,
    text: "Being so restless that it's hard to sit still?",
    category: "anxiety",
  },
  {
    id: 8,
    text: "Thoughts that you would be better off dead?",
    category: "depression",
    severity: "high" // Flag for more severe symptom
  },
  {
    id: 9,
    text: "Trouble falling or staying asleep, or sleeping too much?",
    category: "sleep",
  },
  {
    id: 10,
    text: "Poor appetite or overeating?",
    category: "physical",
  }
];

const options = [
  { value: "0", label: "Not at all", score: 0 },
  { value: "1", label: "Several days", score: 1 },
  { value: "2", label: "More than half the days", score: 2 },
  { value: "3", label: "Nearly every day", score: 3 },
];

export default function Individual() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestion]);

  const handleAnswer = (questionId, score) => {
    const newAnswers = { ...answers, [questionId]: score };
    setAnswers(newAnswers);
    setSelectedOption(score.toString());
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResults(true);
      }
    }, 300);
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    return Object.values(answers).reduce((sum, score) => sum + score, 0);
  };

  const getResultAnalysis = (score) => {
    if (score <= 4) {
      return {
        level: "Minimal",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        description: "You may be experiencing mild symptoms. Try self-help strategies like deep breathing, exercise, or journaling.",
        recommendations: [
          "Practice daily mindfulness or meditation",
          "Maintain regular exercise routine",
          "Keep a mood journal",
          "Ensure adequate sleep (7-9 hours)",
          "Stay connected with supportive friends and family",
        ],
        needsProfessionalHelp: false,
      };
    } else if (score <= 9) {
      return {
        level: "Mild to Moderate",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        description: "Symptoms are noticeable. Consider self-help strategies and monitor for 2 weeks. If no improvement, seek professional help.",
        recommendations: [
          "Try mindfulness apps or guided meditation",
          "Consider online therapy or counseling",
          "Establish a daily routine",
          "Limit alcohol and caffeine",
          "Practice stress management techniques",
        ],
        needsProfessionalHelp: false,
      };
    } else {
      return {
        level: "Moderate to Severe",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        description: "Significant symptoms detected. We strongly recommend consulting a professional therapist for support.",
        recommendations: [
          "Schedule an appointment with a mental health professional",
          "Consider therapy (CBT, DBT, or other evidence-based treatments)",
          "Speak with your primary care physician",
          "Join a support group",
          "Create a safety plan if needed",
        ],
        needsProfessionalHelp: true,
      };
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResults) {
    const score = calculateScore();
    const analysis = getResultAnalysis(score);
    const scorePercentage = Math.round((score / 15) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <Card className={`${analysis.bgColor} border-2 ${analysis.borderColor} shadow-lg`}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Brain className={`h-8 w-8 ${analysis.color}`} />
              </div>
              <CardTitle className={`text-3xl ${analysis.color} mb-2`}>Mental Health Assessment Results</CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Your total score: {score}/15
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Well-being Level</span>
                  <span className="text-sm font-medium text-gray-600">{scorePercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${analysis.color.replace('text', 'bg')}`}
                    style={{ width: `${scorePercentage}%` }}
                  ></div>
                </div>
                <div className={`text-center px-4 py-3 rounded-lg ${analysis.bgColor} mb-4`}>
                  <h3 className={`text-xl font-semibold ${analysis.color} mb-1`}>{analysis.level}</h3>
                  <p className="text-gray-700">{analysis.description}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <ChevronRight className={`h-5 w-5 mr-2 ${analysis.color}`} />
                  Recommended Actions
                </h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${analysis.color.replace('text', 'bg')}`}></div>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {analysis.needsProfessionalHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                  <h4 className="font-semibold text-blue-800 mb-2">Professional Support Recommended</h4>
                  <p className="text-blue-700 mb-4">
                    Based on your responses, speaking with a mental health professional could be beneficial.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Link to="/professionals" className="flex items-center">
                      Find a Therapist <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1">
                  <Link to="/individual" className="flex items-center justify-center">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retake Assessment
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open("https://moodmantra.com/", "_blank", "noopener,noreferrer")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Self-Help Resources
                </Button>
                <Button variant="outline" className="flex-1">
                  <Link to="/" className="flex items-center justify-center">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 bg-white rounded-lg shadow-sm text-sm text-gray-600 border border-gray-200">
            <p className="text-center">
              <strong>Disclaimer:</strong> This assessment is not a diagnostic tool nor a substitute for professional medical advice. 
              Please consult a qualified healthcare provider for proper evaluation and treatment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-200" />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">
              {questions[currentQuestion].text}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Over the last 2 weeks, how often have you been bothered by this?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedOption}
              onValueChange={(value) => handleAnswer(questions[currentQuestion].id, Number.parseInt(value))}
              className="space-y-3"
            >
              {options.map((option) => (
                <div 
                  key={option.value} 
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer
                    ${selectedOption === option.value ? 
                      'border-purple-500 bg-purple-50' : 
                      'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                  `}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={`q${questions[currentQuestion].id}-${option.value}`} 
                    className="h-5 w-5"
                  />
                  <Label 
                    htmlFor={`q${questions[currentQuestion].id}-${option.value}`} 
                    className="flex-1 cursor-pointer text-gray-700"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={prevQuestion} 
                disabled={currentQuestion === 0}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <div className="text-sm text-gray-500">
                Select an option to continue
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}