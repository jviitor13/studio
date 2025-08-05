
"use client";

import * as React from 'react';

interface PageHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-headline font-semibold">{title}</h1>
                <p className="text-muted-foreground mt-1">{description}</p>
            </div>
            {children && <div className="w-full md:w-auto">{children}</div>}
        </div>
    );
}
