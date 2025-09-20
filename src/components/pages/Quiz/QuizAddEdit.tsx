"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Save, Eye, Calendar, GripVertical, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuery } from '@tanstack/react-query';
import { getAssignedSubjects, getPrograms, getSections, getSessions, getSubjectsByProgramId } from '@/lib/api/ApiFunctions';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { useClassStore } from '@/store/useClassStore';
import { getAssignedClass } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'text';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  content?: string;
  points: number; // Add points field
}

interface QuizForm {
  title: string;
  description: string;
  subjectId: string;
  programId: string;
  sessionId: string;
  sectionId: string;
  semester: string;
  totalPoints: number;
  duration: number;
  dueDate: string;
  questions: QuizQuestion[];
  postMessage?: string;
}

interface QuizBuilderProps {
  onSave: (quiz: QuizForm, payload: any) => void;
  onCancel: () => void;
  initialQuiz?: any;
}

// Mock data for dropdowns
// const programs = [
//   { id: '1', name: 'Computer Science', code: 'CS' },
//   { id: '2', name: 'Software Engineering', code: 'SE' },
//   { id: '3', name: 'Information Technology', code: 'IT' },
//   { id: '4', name: 'Data Science', code: 'DS' }
// ];

// const sessions = [
//   { id: '1', name: '2024-2025', year: '2024-25' },
//   { id: '2', name: '2023-2024', year: '2023-24' },
//   { id: '3', name: '2025-2026', year: '2025-26' }
// ];

// const sections = [
//   { id: '1', name: 'Section A', code: 'A' },
//   { id: '2', name: 'Section B', code: 'B' },
//   { id: '3', name: 'Section C', code: 'C' },
//   { id: '4', name: 'Section D', code: 'D' }
// ];

// const subjects = [
//   { id: '1', name: 'Web Development', code: 'CS302' },
//   { id: '2', name: 'Database Systems', code: 'CS301' },
//   { id: '3', name: 'Data Structures', code: 'CS201' },
//   { id: '4', name: 'Machine Learning', code: 'CS401' },
//   { id: '5', name: 'Artificial Intelligence', code: 'CS402' }
// ];

// Draggable Question Item Component
interface DraggableQuestionProps {
  question: QuizQuestion;
  index: number;
  moveQuestion: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (question: QuizQuestion) => void;
  onDelete: (id: string) => void;
  questionNumber: number;
}

const DraggableQuestion: React.FC<DraggableQuestionProps> = ({
  question,
  index,
  moveQuestion,
  onEdit,
  onDelete,
  questionNumber
}) => {
  const [{ isDragging }, drag]:any = useDrag({
    type: 'question',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'question',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveQuestion(item.index, index);
        item.index = index;
      }
    },
  });

  const getQuestionTypeDisplay = (type: string) => {
    switch (type) {
      case 'multiple-choice': return 'Multiple Choice';
      case 'true-false': return 'True/False';
      case 'short-answer': return 'Short Answer';
      case 'text': return 'Informational Text';
      default: return type;
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`border rounded-lg p-4 bg-card transition-all cursor-move ${
        isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-accent text-accent-foreground mt-1">
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">
              {question.type === 'text' ? 'Info' : `Q${questionNumber}`}
            </span>
            <span className="text-xs bg-accent px-2 py-1 rounded">
              {getQuestionTypeDisplay(question.type)}
            </span>
            {question.type !== 'text' && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {question.points} pts
              </span>
            )}
          </div>
          
          {question.type === 'text' ? (
            <div className="mb-2">
              <p className="text-sm text-muted-foreground mb-1">Informational Content:</p>
              <p className="bg-blue-50 border-l-4 border-blue-400 pl-4 py-2 text-sm">
                {question.content}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-2">{question.question}</p>
              {question.type === 'multiple-choice' && (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1">Options:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {question.options?.map((option, idx) => (
                      <li key={idx} className={option === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                        {option} {option === question.correctAnswer && '✓'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {question.type === 'true-false' && (
                <div className="text-sm text-muted-foreground">
                  Correct Answer: <span className="font-medium text-green-600">{question.correctAnswer}</span>
                </div>
              )}
              {question.type === 'short-answer' && question.correctAnswer && (
                <div className="text-sm text-muted-foreground">
                  Expected Answer: <span className="font-medium">{question.correctAnswer}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(question)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(question.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function QuizAddEdit({ onSave, onCancel, initialQuiz }: QuizBuilderProps) {
  const { programId, sessionId, sectionId, semester, setClassData } = useClassStore();
useEffect(() => {
    if(initialQuiz){
     getAssignedClass({
            programId: initialQuiz.programId,
            sessionId: initialQuiz.sessionId,
            sectionId: initialQuiz.sectionId,
            semester: initialQuiz.semester,
          }).then(({ matchedClass }) => {
            setClassData({
              programId: matchedClass?.data?.programId,
              sessionId: matchedClass?.data?.sessionId,
              sectionId: matchedClass?.data?.sectionId,
              semester: matchedClass?.data?.semester,
              selectedClassName: matchedClass?.className,
              type: matchedClass?.type,
            });
          });
  }
}, []);
    const { data: session, status } = useSession();
  const [quiz, setQuiz] = useState<QuizForm>(
    initialQuiz
      ? {
          ...initialQuiz,
          // subjectId: initialQuiz.subjectId ? String(initialQuiz.subjectId) : '',
          dueDate: initialQuiz.dueDate
            ? format(new Date(initialQuiz.dueDate), "yyyy-MM-dd'T'HH:mm")
            : "",
        }
      : {
          title: '',
          description: '',
          subjectId: '',
          totalPoints: 0,
          duration: 30,
          dueDate: '',
          questions: [],
          postMessage: ''
        }
  );

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    id: '',
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    content: '',
    points: 1 // Add default points
  });

    const { data: programs }: any = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(null, ""),
  });

  const { data: sessions }: any = useQuery({
    queryKey: ["sessions"],
    queryFn: () => getSessions(null, ""),
  });

  const { data: sections }: any = useQuery({
    queryKey: ["sections"],
    queryFn: () => getSections(null, "", null),
  });

   const { data: subjects }: any = useQuery({
     queryKey: ["assignedSubjects", programId],
     queryFn: () => getSubjectsByProgramId(programId as any),
     enabled: !!session && !! programId,
   });

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const moveQuestion = useCallback((dragIndex: number, hoverIndex: number) => {
    setQuiz(prev => {
      const draggedQuestion = prev.questions[dragIndex];
      const newQuestions = [...prev.questions];
      newQuestions.splice(dragIndex, 1);
      newQuestions.splice(hoverIndex, 0, draggedQuestion);
      return { ...prev, questions: newQuestions };
    });
  }, []);

  const addQuestion = () => {
    if (currentQuestion.type === 'text') {
      if (!currentQuestion.content?.trim()) return;
    } else {
      if (!currentQuestion.question.trim()) return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: editingQuestionId || Date.now().toString(),
      points: currentQuestion.type === 'text' ? 0 : currentQuestion.points // Text questions have 0 points
    };

    if (editingQuestionId) {
      setQuiz(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === editingQuestionId ? newQuestion : q)
      }));
      setEditingQuestionId(null);
    } else {
      setQuiz(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
    }

    setCurrentQuestion({
      id: '',
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      content: '',
      points: 1 // Reset to default points
    });
  };

  const editQuestion = (question: QuizQuestion) => {
    setCurrentQuestion(question);
    setEditingQuestionId(question.id);
  };

  const deleteQuestion = (id: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const handleSave = () => {
    if (quiz.title.trim() && quiz.questions.length > 0 && quiz.subjectId && 
        programId && quiz.dueDate) {

      const payload = {
        title: quiz.title,
        description: quiz.description,
        postMessage: quiz.postMessage,
        totalPoints: quiz.totalPoints,
        questions: quiz.questions.map(q => ({
          id: q.id,
          type: q.type,
          question: q.question || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          content: q.content || '',
          points: q.points // Include points in payload
        })),
        dueDate: new Date(quiz.dueDate).toISOString(),
        duration: quiz.duration,
        programId: programId,
        sessionId: sessionId,
        subjectId: parseInt(quiz.subjectId),
        sectionId: sectionId,
        semester: semester,
      };

      onSave(quiz, payload);
    }
  };

  const handleCorrectAnswerChange = (value: string) => {
    setCurrentQuestion(prev => ({ ...prev, correctAnswer: value }));
  };

  // Get question number (excluding text type)
  const getQuestionNumber = (index: number) => {
    let questionCount = 0;
    for (let i = 0; i <= index; i++) {
      if (quiz.questions[i]?.type !== 'text') {
        questionCount++;
      }
    }
    return questionCount;
  };

  // Calculate total points from all questions
  const calculateTotalPoints = () => {
    return quiz.questions
      .filter(q => q.type !== 'text')
      .reduce((total, question) => total + question.points, 0);
  };

  // Update quiz total points when questions change
  React.useEffect(() => {
    const newTotalPoints = calculateTotalPoints();
    setQuiz(prev => ({ ...prev, totalPoints: newTotalPoints }));
  }, [quiz.questions]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className=" mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{initialQuiz ? 'Edit' : 'Create'} Quiz</h1>
            <p className="text-muted-foreground">Build your quiz with questions and manage settings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!quiz.title.trim() || quiz.questions.length === 0 || !quiz.subjectId || 
                       !programId || !quiz.dueDate}
              className=""
            >
              <Save className="h-4 w-4 mr-2" />
              Save Quiz
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quiz Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Settings</CardTitle>
                <CardDescription>Configure basic quiz information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={quiz.title}
                    onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter quiz title"
                  />
                </div>
                
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={quiz.description}
                    onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter quiz description"
                    rows={3}
                  />
                </div>

            

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={quiz.subjectId} onValueChange={(value) => setQuiz(prev => ({ ...prev, subjectId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject:any) => (
                        <SelectItem key={subject?.id} value={subject?.id}>
                          {subject?.code} - {subject?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="totalPoints">Total Points</Label>
                    <Input
                      id="totalPoints"
                      type="number"
                      value={quiz.totalPoints}
                      disabled
                      className="bg-muted"
                      placeholder="Auto-calculated"
                    />
                    <p className="text-xs text-muted-foreground">Auto-calculated from questions</p>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={quiz.duration}
                      onChange={(e) => setQuiz(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                      min="1"
                      max="180"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="dueDate">Due Date & Time</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={quiz.dueDate}
                    onChange={(e) => setQuiz(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="postMessage">Post Quiz Message</Label>
                  <Textarea
                    id="postMessage"
                    value={quiz.postMessage || ''}
                    onChange={(e) => setQuiz(prev => ({ ...prev, postMessage: e.target.value }))}
                    placeholder="Optional message after completion"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quiz Summary */}
            <Card className="border-primary bg-primary/10">
              <CardHeader>
                <CardTitle className="text-sm">Quiz Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions:</span>
                    <span className="font-medium">{quiz.questions.filter(q => q.type !== 'text').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Info Sections:</span>
                    <span className="font-medium">{quiz.questions.filter(q => q.type === 'text').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Points:</span>
                    <span className="font-medium">{quiz.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{quiz.duration} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Question Builder & List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Question Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingQuestionId ? 'Edit Question' : 'Add Question'}
                </CardTitle>
                <CardDescription>
                  Create questions or add informational content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="questionType">Question Type</Label>
                  <Select value={currentQuestion.type} onValueChange={(value: any) => setCurrentQuestion(prev => ({ 
                    ...prev, 
                    type: value,
                    question: value === 'text' ? '' : prev.question,
                    content: value === 'text' ? prev.content : '',
                    options: value === 'multiple-choice' ? ['', '', '', ''] : [],
                    correctAnswer: ''
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Informational Text</SelectItem>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="true-false">True/False</SelectItem>
                      <SelectItem value="short-answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {currentQuestion.type === 'text' ? (
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="content">Informational Content</Label>
                    <Textarea
                      id="content"
                      value={currentQuestion.content || ''}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter informational text or instructions"
                      rows={4}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="question">Question</Label>
                      <Textarea
                        id="question"
                        value={currentQuestion.question}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                        placeholder="Enter your question"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))
                        }
                        min="1"
                        max="100"
                        placeholder="Points for this question"
                      />
                    </div>
                  </>
                )}

                {currentQuestion.type === 'multiple-choice' && (
                  <div className="space-y-2">
                    <Label>Answer Options</Label>
                    <RadioGroup 
                      value={currentQuestion.correctAnswer as string}
                      onValueChange={handleCorrectAnswerChange}
                    >
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                          />
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={option} 
                              id={`option-${index}`}
                              disabled={!option.trim()}
                            />
                            <Label htmlFor={`option-${index}`} className="text-sm">Correct</Label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {currentQuestion.type === 'true-false' && (
                  <div>
                    <Label>Correct Answer</Label>
                    <RadioGroup 
                      value={currentQuestion.correctAnswer as string} 
                      onValueChange={handleCorrectAnswerChange}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="true" />
                        <Label htmlFor="true">True</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="false" />
                        <Label htmlFor="false">False</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {currentQuestion.type === 'short-answer' && (
                  <div>
                    <Label htmlFor="shortAnswer">Expected Answer (Optional)</Label>
                    <Input
                      id="shortAnswer"
                      value={currentQuestion.correctAnswer as string || ''}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      placeholder="Enter expected answer for reference"
                    />
                  </div>
                )}

                <Button onClick={addQuestion} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingQuestionId ? 'Update Question' : 'Add Question'}
                </Button>
              </CardContent>
            </Card>

            {/* Questions List */}
            {quiz.questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Questions ({quiz.questions.length})</CardTitle>
                  <CardDescription>
                    Drag and drop to reorder questions. Click edit to modify.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quiz.questions.map((question, index) => (
                      <DraggableQuestion
                        key={question.id}
                        question={question}
                        index={index}
                        moveQuestion={moveQuestion}
                        onEdit={editQuestion}
                        onDelete={deleteQuestion}
                        questionNumber={getQuestionNumber(index)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}