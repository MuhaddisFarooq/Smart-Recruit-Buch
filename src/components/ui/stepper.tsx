import React from 'react'

export default function stepper({steps,currentStep,setCurrentStep,hideControls}:any) {
  return (
    <div className='flex flex-row gap-5 justify-center items-center'>
      {
        steps?.map((step:any,index:number)=>(
          <>
          {index>0 && (
            <div className='flex-1 h-0.5 bg-primary'></div>
          )}
          <div className='flex flex-row justify-center items-center gap-2'>
            <div><div className={`size-10 rounded-full  flex justify-center items-center ${currentStep==index+1 ? `border border-black text-black bg-primary` : `border border-primary text-primary`}`}>{index+1}</div></div>
            <div className={`text-sm ${currentStep==index+1 ? `text-black` : `text-black`}`}>{step?.title}</div>
          </div>
          </>
        ))
      }
    </div>
  )
}
