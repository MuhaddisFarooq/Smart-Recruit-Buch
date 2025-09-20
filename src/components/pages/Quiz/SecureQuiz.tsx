'use client';

import { useEffect, useRef, useState } from 'react';
import screenfull from 'screenfull';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'; // add toast import
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const Modal = ({ open, title, message, onConfirm, showCancel = false, onCancel }: any) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg text-center space-y-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-gray-600">{message}</p>
          <div className="flex justify-center gap-4 pt-2">
            {showCancel && (
              <Button
                onClick={() => {
                  if (onCancel) onCancel();
                }}
                variant="outline"
              >
                Cancel
              </Button>
            )}
            <Button onClick={onConfirm}>OK</Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function SecureQuizModal({ quiz, onSubmit, onStart }: any) {
  // Always open quiz when rendered by parent
  const [isOpen] = useState(true);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(() => parseInt(quiz?.duration || 0) * 60);
  const [leftScreenCount, setLeftScreenCount] = useState(0);
   const audioRef = useRef(new Audio("/countdown-quiz.mp3"));
  const [modal, setModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false,
    onCancel: null,
  });
  const [fullscreenActive, setFullscreenActive] = useState(true);

  const showModal = (
    title: any,
    message: any,
    onConfirm: any,
    showCancel = false,
    onCancel = null
  ) => {
    const audio = new Audio('/notify.mp3');
    audio.play();
    setModal({ open: true, title, message, onConfirm, showCancel, onCancel });
  };

  const closeModal = () => setModal({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false,
    onCancel: null,
  });

  // Restore first screen: do not auto-start quiz, show intro screen with Start Quiz button
  const startQuiz = async () => {
    if (screenfull.isEnabled && !screenfull.isFullscreen) await screenfull.request();
    setLoading(true);
    if (onStart) onStart();
    setTimeLeft(parseInt(quiz?.duration || 0) * 60);
    setTimeout(() => {
      setStarted(true);
      setLoading(false);
      setFullscreenActive(screenfull.isEnabled ? screenfull.isFullscreen : true);
    }, 1000);
  };

  // Remove auto-start on mount
  // useEffect(() => {
  //   startQuiz();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const handleAnswer = (id:any, value:any) => setAnswers((prev:any) => ({ ...prev, [id]: value }));

  const handleSubmit = () => {
    // Ensure all questions are included, even if not answered, and exclude type 'text'
    const formattedAnswers = (quiz.questions || [])
      .filter((q: any) => q.type !== "text")
      .map((q: any) => ({
        id: q.id,
        answer: answers[q.id] ?? "",
      }));
    if (onSubmit) onSubmit(formattedAnswers);
    if (screenfull.isEnabled && screenfull.isFullscreen) screenfull.exit();
    setStarted(false);
    setAnswers({});
    // Reset timer on submit/exit
    setTimeLeft(parseInt(quiz?.duration || 0) * 60);
  };

  const confirmSubmit = () => {
    showModal(
      'Submit Quiz?',
      'Are you sure you want to submit your quiz? This cannot be undone.',
      () => {
        closeModal();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        handleSubmit();
      },
      true,
      // On cancel, just close the modal (do not submit, do not exit quiz)
      closeModal as any
    );
  };

  useEffect(() => {
    if (!started) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
         if(prev == 10) {
      
    audioRef.current.play();
    }
        if (prev <= 1) {
          clearInterval(timer);
          showModal('Time Up!', 'Your time has ended. The quiz will now be submitted.', () => {
            closeModal();
            handleSubmit();
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const disableRightClick = (e:any) => e.preventDefault();
    const disableCopy = (e:any) => e.preventDefault();
    const blockKeys = (e:any) => {
      // Block all function keys (F1-F12)
      if ((e.key && /^F\d{1,2}$/.test(e.key)) ||
          // Block Escape key
          e.key === 'Escape' ||
          // Block Windows key (Meta)
          e.key === 'Meta' ||
          // Block Ctrl+U, Ctrl+S
          (e.ctrlKey && ['u', 's'].includes(e.key.toLowerCase())) ||
          // Block Ctrl+Shift+I/J/C
          (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
        // toast.error('Key combination is disabled during the quiz.');
      }
    };

    // Use toast for tab switch/blur
    const onBlur = () => {
      setLeftScreenCount((prev) => {
        const next = prev + 1;
        toast.warning(`Screen/tab switch detected! Attempt: ${next}`);
        if (next >= 3) {
          toast.error('You switched screens too many times. Submitting quiz now.');
          setTimeout(() => handleSubmit(), 1000);
        }
        return next;
      });
    };

    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('copy', disableCopy);
    document.addEventListener('keydown', blockKeys);
    window.addEventListener('blur', onBlur);

    // Use toast for fullscreen exit, and force re-entry
    let fullscreenHandler:any;
    if (screenfull.isEnabled) {
      fullscreenHandler = () => {
        const isFs = screenfull.isFullscreen;
        setFullscreenActive(isFs);
        if (!isFs) {
        //   toast.error('You must stay in fullscreen mode to continue the quiz.', { duration: 5000 });
          // Try to force fullscreen re-entry repeatedly
          const tryFullscreen = () => {
            if (screenfull.isEnabled && !screenfull.isFullscreen) {
              screenfull.request();
              setTimeout(tryFullscreen, 500);
            }
          };
          setTimeout(tryFullscreen, 200);
        }
      };
      screenfull.on('change', fullscreenHandler);
      // Also check on mount
      setFullscreenActive(screenfull.isFullscreen);
    }

    // Prevent minimizing: Listen for visibilitychange and focus events
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        toast.error('Minimizing or switching away is not allowed. Please return to the quiz and fullscreen.', { duration: 5000 });
        if (screenfull.isEnabled && !screenfull.isFullscreen) {
          screenfull.request();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('copy', disableCopy);
      document.removeEventListener('keydown', blockKeys);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      if (screenfull.isEnabled && fullscreenHandler) screenfull.off('change', fullscreenHandler);
    };
  }, [started]);
  
  const formatTime = (seconds:any) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const renderQuestion = (q:any, i:any) => {
    const selected = answers[q.id];

    switch (q.type) {
      case 'text':
        return (
          <Card key={q.id} className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">{q.content}</CardTitle>
            </CardHeader>
          </Card>
        );

      case 'multiple-choice':
      case 'true-false': {
        const options = q.type === 'true-false' ? ['true', 'false'] : q.options;
        return (
          <Card key={q.id} className="mb-8">
            <CardHeader>
              <CardTitle className="font-semibold text-lg">{i + 1}. {q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selected ?? ""}
                onValueChange={val => handleAnswer(q.id, val)}
                className="space-y-2"
              >
                {options.map((opt:any, index:any) => (
                  <div key={index} className="flex items-center space-x-3">
                    <RadioGroupItem value={opt} id={`q${q.id}-opt${index}`} />
                    <label
                      htmlFor={`q${q.id}-opt${index}`}
                      className={`cursor-pointer font-medium text-gray-700 capitalize ${selected === opt ? "text-primary" : ""}`}
                    >
                      {opt}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        );
      }

      case 'short-answer':
        return (
          <Card key={q.id} className="mb-8">
            <CardHeader>
              <CardTitle className="font-semibold text-lg">{i + 1}. {q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="w-full"
                rows={3}
                placeholder="Your answer"
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
              />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (!isOpen) {
    return null;
  }

  // UI: Banner and overlay if not fullscreen
  const fullscreenBanner = !fullscreenActive && started && !loading && (
    <div className="fixed top-0 left-0 w-full z-50 bg-red-600 text-white text-center py-3 font-bold shadow-lg">
      Please return to fullscreen mode to continue the quiz. The quiz is paused until fullscreen is restored.
    </div>
  );

  const overlay = !fullscreenActive && started && !loading && (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 flex items-center justify-center pointer-events-auto">
      {/* Optionally, you can add a spinner or icon here */}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col min-h-screen w-full">
      {fullscreenBanner}
      {/* Sticky header with timer */}
      {started && !loading && (
        <div className="w-full fixed top-0 left-0 bg-white border-b shadow-md z-20 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">{quiz.title}</h2>
          <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-md">
            Time Left: <span className="text-red-600">{formatTime(timeLeft)}</span>
          </span>
        </div>
      )}

      {/* Restore first screen with Start Quiz and Cancel */}
      {!started && !loading && (
        <div className="flex flex-col justify-center items-center flex-1 p-8">
          <div className="max-w-xl text-center space-y-5">
            <h2 className="text-3xl font-bold text-gray-900">{quiz.title}</h2>
            <p className="text-gray-600">{quiz.description}</p>
            <p className="text-sm text-gray-500">Exiting fullscreen, copying, minimizing, or switching tabs will show warnings and may auto-submit the quiz.</p>
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={startQuiz}>Start Quiz</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStarted(false);
                  setAnswers({});
                  if (onSubmit) onSubmit(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}

      {started && !loading && (
        <>
          <div className={`mt-[80px] flex-1 overflow-y-auto px-6 py-3 w-full  mx-auto transition-opacity duration-300 ${!fullscreenActive ? 'opacity-30 pointer-events-none select-none' : ''}`}>
            {quiz.questions.map((q: any, i: any) => renderQuestion(q, i))}
          </div>
          <div className="w-full border-t px-6 py-2 bg-white text-center sticky bottom-0 z-10 flex justify-end">
            <Button
              className=""
              onClick={confirmSubmit}
              disabled={!fullscreenActive}
            >
              Submit Quiz
            </Button>
          </div>
        </>
      )}

      {overlay}
      <Modal {...modal} />
    </div>
  );
}

