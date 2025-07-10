"use client";

import * as React from 'react';

interface PageHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-headline font-semibold">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            {children && <div>{children}</div>}
        </div>
    );
}
