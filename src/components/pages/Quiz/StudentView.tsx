'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Edit, HelpCircle, RotateCcw, Calendar } from 'lucide-react'
import type { Quiz } from "@/lib/types"
import React from 'react'
import PaginationComponent from '@/components/common/Pagination'

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  default: "bg-gray-200 text-gray-800"
};

export default function StudentView({ quizzesData, currentPage, setCurrentPage, selectedQuiz, setSelectedQuiz }: any) {
    console.log('quizzes', quizzesData)
    const quizzes = quizzesData?.quizzes || [];
    const totalPages = quizzesData?.totalPages || 1;
    const page = quizzesData?.currentPage || 1;

    // Helper for pagination items
    const getPageNumbers = () => {
      if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
      if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
      if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      return [1, '...', page - 1, page, page + 1, '...', totalPages];
    };

    return (
    <section>
         {/* Quizzes Grid */}
   <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {quizzes.map((quiz: any) => (
    <div key={quiz.id} className="rounded-lg border bg-card p-6 shadow-sm h-full flex flex-col">
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{quiz.title}</h3>
            <p className="text-sm text-muted-foreground">{quiz.subject?.name || "-"}</p>
          </div>
          <Badge className={statusColors[quiz.status] || statusColors.default}>
                  {quiz.status?.charAt(0).toUpperCase() + quiz.status?.slice(1)}
                </Badge>
        </div>

        <p className="text-sm leading-relaxed">{quiz.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <div className="flex items-center gap-1 font-medium">
              <Clock className="h-4 w-4" />
              {quiz.duration} mins
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Questions:</span>
            <div className="flex items-center gap-1 font-medium">
              <HelpCircle className="h-4 w-4" />
              {quiz.questions?.length ?? "-"}
            </div>
          </div>
          <div className="col-span-2">
                  <span className="text-muted-foreground">Due Date:</span>
                  <div className="flex items-center gap-1 font-medium">
                    <Calendar className="h-4 w-4" />
                    {formatDate(quiz.dueDate)}
                  </div>
                </div>
        </div>

        {/* Spacer to push content below */}
        <div className="flex-grow"></div>

        <div className="pt-2 space-y-2">
          {quiz.status === "pending" && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="sm"
                onClick={() => setSelectedQuiz && setSelectedQuiz(quiz.id)}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Start Quiz
              </Button>
            </div>
          )}

          {quiz.status === "completed" && (
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" size="sm" disabled>
                <RotateCcw className="mr-2 h-4 w-4" />
                Submitted
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  ))}
</div>
     <PaginationComponent
       currentPage={currentPage}
       totalPages={totalPages}
       onPageChange={setCurrentPage}
     />
    </section>
  )
}
