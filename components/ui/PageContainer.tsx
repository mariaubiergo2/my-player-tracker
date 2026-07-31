import React from "react";

interface PageContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  maxWidthClassName?: string;
}

export default function PageContainer({
  children,
  className = "",
  maxWidthClassName = "",
  ...props
}: PageContainerProps) {
  return (
    <section
      className={`container mx-auto px-4 md:px-5 lg:px-6 ${maxWidthClassName} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
