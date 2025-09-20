'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Edit, HelpCircle, RotateCcw } from 'lucide-react'
import type { Quiz, Question } from "@/lib/types"
import React, { useState } from 'react'
import { usePagePermissions } from '@/hooks/usePagePermissions'
import { permissionsDef } from '@/lib/constants'


export default function TeacherView({quizzesData,selectedQuiz,setSelectedQuiz}: any) {
  const permissions = usePagePermissions('/quizzes');

    const getStatusColor = (status: Boolean) => {
      switch (status) {
        case true:
          return "bg-green-100 text-green-800"
        case false:
          return "bg-red-100 text-red-800"
        default:
          return "bg-red-100 text-red-800"
      }
    }



  return (
    permissions?.includes(permissionsDef.get) &&
    <section>
         {/* Quizzes Grid */}
   <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {quizzesData?.quizzes?.map((quiz:any) => (
    <div key={quiz.id} className="rounded-lg border bg-card p-6 shadow-sm h-full">
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{quiz.title}</h3>
            <p className="text-sm text-muted-foreground">{quiz?.subject?.name}</p>
          </div>
          <Badge className={`${getStatusColor(quiz.isActive)}`}>{quiz.isActive ? "Active" : "Inactive"}</Badge>
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
              {quiz.questions.filter((q:any) => q.type !== "text").length}
            </div>
          </div>
        </div>

        {/* Spacer to push content below */}
        <div className="flex-grow"></div>

        <div className="pt-2 space-y-2">
          {/* {quiz.status === "available" && ( */}
            <div className="flex gap-2">
              {/* <Button
                className="flex-1"
                size="sm"
                // onClick={() => {
                //   const latest = quizzes.find((q) => q.id === quiz.id)
                //   if (latest) setActiveQuiz(latest)
                // }}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Start Quiz
              </Button> */}
              {permissions?.includes(permissionsDef.edit) && (
              <Button variant="outline" className='w-full' onClick={() => setSelectedQuiz(quiz)}>
                <Edit className="h-4 w-4" /> Edit
              </Button>
              )}
            </div>
          {/* )} */}

          {/* {quiz.status === "completed" && (
            <div className="flex gap-2">
              <Button className="flex-1 bg-black hover:bg-gray-800 text-white" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Review
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )} */}
        </div>
      </div>
    </div>
  ))}
</div>
    </section>
  )
}
