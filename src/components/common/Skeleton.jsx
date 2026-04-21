import React from 'react';

const Skeleton = ({ className, circle = false }) => {
    return (
        <div
            className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${circle ? 'rounded-full' : 'rounded-lg'
                } ${className}`}
        />
    );
};

export const TaskSkeleton = () => (
    <div className="card p-4 space-y-3">
        <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
            <div className="flex gap-1.5">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-8 w-8 circle" />
        </div>
    </div>
);

export const StatSkeleton = () => (
    <div className="card p-4 space-y-2 flex flex-col items-center">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-3 w-16" />
    </div>
);

export default Skeleton;
