'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { useLoadingStore } from '@/store/useLoadingStore';
import { forgotPassword, verifyOtp, resetPassword } from '@/lib/api/ApiFunctions';
import { toast } from 'sonner';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const OtpSchema = Yup.object().shape({
  otp: Yup.string().length(6, 'OTP must be 6 digits').required('OTP is required'),
});

const ResetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string().min(6).required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm Password is required'),
});

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'change-password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const { showLoader, hideLoader } = useLoadingStore();

  // Mutations
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response, variables) => {
      setEmail(variables.email);
      setStep('otp');
      setCooldown(60);
      toast.success(response.message);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Failed to send OTP');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (response, variables) => {
      setOtp(variables.otp);
      setStep('change-password');
      toast.success(response.message);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Invalid OTP');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      setStep('success');
      toast.success(response.message);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Failed to reset password');
    },
  });

  // Countdown Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Resend OTP
  const handleResendOtp = () => {
    if (cooldown > 0) return;
    showLoader();
    forgotPasswordMutation.mutate(
      { email },
      {
        onSuccess: (response) => {
          toast.success(response.message);
          setCooldown(60);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || error.message || 'Failed to resend OTP');
        },
        onSettled: hideLoader,
      }
    );
  };

  return (
    <div className="w-full lg:w-[30%] flex flex-col justify-center p-8">
      <div className="text-center mb-6">
        <img src="/BINC_logo.png" alt="Company Logo" className="w-40 mx-auto" />
      </div>

      {/* Step 1: Email */}
      {step === 'email' && (
        <Formik
          initialValues={{ email: '' }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={(values, { setSubmitting, setFieldError }) => {
            showLoader();
            forgotPasswordMutation.mutate(values, {
              onError: (error) => setFieldError('email', error?.response?.data?.message),
              onSettled: () => {
                setSubmitting(false);
                hideLoader();
              },
            });
          }}
        >
          {({ errors, touched }) => (
            <Form className="space-y-6 w-full max-w-md mx-auto">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Field name="email" as={Input} placeholder="example@binc.pk" />
                {errors.email && touched.email && (
                  <div className="text-red-500 text-sm">{errors.email}</div>
                )}
              </div>
              <Button type="submit" className="w-full shadow-md">Reset Password</Button>
            </Form>
          )}
        </Formik>
      )}

      {/* Step 2: OTP */}
      {step === 'otp' && (
        <Formik
          initialValues={{ otp: '' }}
          validationSchema={OtpSchema}
          onSubmit={(values, { setSubmitting, setFieldError }) => {
            showLoader();
            verifyOtpMutation.mutate(
              { email, otp: values.otp },
              {
                onError: () => setFieldError('otp', 'Invalid OTP'),
                onSettled: () => {
                  setSubmitting(false);
                  hideLoader();
                },
              }
            );
          }}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form className="space-y-6 w-full max-w-md mx-auto text-center">
              <label className="text-lg font-medium">Enter OTP</label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={values.otp}
                  onChange={(val) => setFieldValue('otp', val)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {errors.otp && touched.otp && (
                <div className="text-red-500 text-sm">{errors.otp}</div>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full shadow-md">Verify OTP</Button>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleResendOtp}
                  className={`text-sm font-medium  cursor-pointer ml-2 ${cooldown > 0 ? 'text-gray-400' : 'text-primary hover:text-secondary'}`}
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}

      {/* Step 3: Reset Password */}
      {step === 'change-password' && (
        <Formik
          initialValues={{ newPassword: '', confirmPassword: '' }}
          validationSchema={ResetPasswordSchema}
          onSubmit={(values, { setSubmitting, setFieldError }) => {
            showLoader();
            resetPasswordMutation.mutate(
              { email, otp, newPassword: values.newPassword },
              {
                onError: () => setFieldError('newPassword', 'Failed to reset password'),
                onSettled: () => {
                  setSubmitting(false);
                  hideLoader();
                },
              }
            );
          }}
        >
          {({ errors, touched }) => (
            <Form className="space-y-6 w-full max-w-md mx-auto">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">Password</label>
                <Field name="newPassword" type="password" as={Input} placeholder="**********" />
                {errors.newPassword && touched.newPassword && (
                  <div className="text-red-500 text-sm">{errors.newPassword}</div>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <Field name="confirmPassword" type="password" as={Input} placeholder="**********" />
                {errors.confirmPassword && touched.confirmPassword && (
                  <div className="text-red-500 text-sm">{errors.confirmPassword}</div>
                )}
              </div>
              <Button type="submit" className="w-full shadow-md">Reset Password</Button>
            </Form>
          )}
        </Formik>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Password Reset Successful</h2>
          <p>Your password has been reset successfully.</p>
          <Button onClick={() => router.push('/')} className="w-full shadow-md">
            Back to Login
          </Button>
        </div>
      )}
    </div>
  );
}
