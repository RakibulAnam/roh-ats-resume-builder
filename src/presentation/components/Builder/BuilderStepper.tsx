import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AppStep } from '../../../domain/entities';

interface StepInfo {
    id: AppStep;
    title: string;
}

interface BuilderStepperProps {
    steps: StepInfo[];
    currentStep: AppStep;
}

export const BuilderStepper = ({ steps, currentStep }: BuilderStepperProps) => {
    return (
        <div className="bg-white border-b border-charcoal-200 shadow-sm py-4">
            <div className="max-w-5xl mx-auto px-4">
                {/* Desktop Stepper */}
                <div className="hidden md:flex items-center justify-between">
                    <div className="flex-1 flex items-center justify-between relative">
                        {/* Progress Bar Background Line */}
                        <div className="absolute top-5 left-0 w-full h-0.5 bg-charcoal-200 -z-10" />

                        {steps.map((s, idx) => {
                            const isActive = s.id === currentStep;
                            const isCompleted = s.id < currentStep;

                            return (
                                <div key={s.id} className="flex flex-col items-center relative z-10">
                                    {/* Circle */}
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 ${isActive
                                                ? 'bg-brand-600 border-brand-600 text-white shadow-lg scale-110'
                                                : isCompleted
                                                    ? 'bg-white border-green-500 text-green-500'
                                                    : 'bg-white border-charcoal-300 text-charcoal-400'
                                            }`}
                                    >
                                        {isCompleted ? <CheckCircle2 size={20} /> : idx + 1}
                                    </div>

                                    {/* Label */}
                                    <div className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-brand-600' : isCompleted ? 'text-green-600' : 'text-charcoal-400'
                                        }`}>
                                        {s.title}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Stepper */}
                <div className="md:hidden">
                    <div className="flex items-center justify-between mb-2">
                        {(() => {
                            const currentStepIndex = steps.findIndex(s => s.id === currentStep);
                            return (
                                <>
                                    <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                                        Step {currentStepIndex + 1} of {steps.length}
                                    </span>
                                    <span className="text-sm font-bold text-brand-600">
                                        {steps[currentStepIndex]?.title}
                                    </span>
                                </>
                            );
                        })()}
                    </div>
                    <div className="w-full h-2 bg-charcoal-100 rounded-full overflow-hidden">
                        {(() => {
                            const currentStepIndex = steps.findIndex(s => s.id === currentStep);
                            const progress = ((currentStepIndex + 1) / steps.length) * 100;
                            return (
                                <div
                                    className="h-full bg-brand-600 transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};
