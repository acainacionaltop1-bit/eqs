import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import type { VideoQuestion } from '@/shared/types';

interface VideoQuestionModalProps {
  question: VideoQuestion;
  isOpen: boolean;
  onAnswer: (answer: string) => void;
  onClose: () => void;
}

export default function VideoQuestionModal({ 
  question, 
  isOpen, 
  onAnswer, 
  onClose 
}: VideoQuestionModalProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const answers = [question.correct_answer, question.wrong_answer].sort(() => Math.random() - 0.5);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    const correct = answer === question.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Wait 2 seconds then call onAnswer
    setTimeout(() => {
      onAnswer(answer);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/90" />
      
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Pergunta do Vídeo</h2>
            <p className="text-gray-400 text-sm">
              Responda corretamente para receber sua recompensa
            </p>
          </div>
          {!showResult && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Question content */}
        <div className="p-8">
          {!showResult ? (
            <>
              {/* Question */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-6 leading-relaxed">
                  {question.question}
                </h3>
              </div>

              {/* Answer options */}
              <div className="space-y-4">
                {answers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(answer)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ${
                      selectedAnswer === answer
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === answer
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-500'
                      }`}>
                        {selectedAnswer === answer && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-base">{answer}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-400 text-sm">
                  Selecione uma resposta para continuar
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Result display */}
              <div className="text-center py-8">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  isCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {isCorrect ? (
                    <CheckCircle className="w-10 h-10 text-white" />
                  ) : (
                    <XCircle className="w-10 h-10 text-white" />
                  )}
                </div>

                <h3 className={`text-2xl font-bold mb-4 ${
                  isCorrect ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isCorrect ? 'Resposta Correta! 🎉' : 'Resposta Incorreta 😔'}
                </h3>

                <p className="text-gray-300 mb-6">
                  {isCorrect 
                    ? 'Parabéns! Você respondeu corretamente e vai receber sua recompensa.' 
                    : `A resposta correta era: "${question.correct_answer}"`
                  }
                </p>

                <div className="bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-400 mb-2">Sua resposta:</p>
                  <p className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedAnswer}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-2000"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Processando resultado...
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
