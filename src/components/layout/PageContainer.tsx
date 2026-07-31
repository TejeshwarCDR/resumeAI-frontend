import React from "react";

type PageContainerVariant = "standard" | "wide" | "full" | "narrow";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PageContainerVariant;
  children: React.ReactNode;
}

const maxWidthByVariant: Record<PageContainerVariant, string> = {
  narrow: "var(--page-max-narrow)",
  standard: "var(--page-max-standard)",
  wide: "var(--page-max-wide)",
  full: "none",
};

export function PageContainer({
  variant = "wide",
  children,
  style = {},
  ...rest
}: PageContainerProps) {
  return (
    <div
      className="sig-page-container"
      style={{
        width: "100%",
        maxWidth: maxWidthByVariant[variant],
        marginInline: "auto",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
