import React from "react";
export type HoverAnimation = "" | ""
export function AkiraButton({ textSize, fillWidth, children, className, onClick, disabled,ref }: {
    ref?: React.Ref<HTMLButtonElement>,
    textSize?: number,
    fillWidth?: boolean,
    children?: React.ReactNode,
    className?: string,
    loading?: boolean,
    disabled?: boolean,
    onClick?: (event: React.MouseEvent) => void
}) {
    return (<button ref={ref} onClick={!disabled ? onClick : undefined} className={`
        ${fillWidth && "w-full"} ${textSize ? `text-[${textSize}px]` : ""} 
        ${!disabled ? "bg-BackgroundButton hover:bg-BackgroundHoverButton" : "bg-BackgroundButtonDisabled select-none cursor-not-allowed"} 
        text-ForegroundButton rounded-md duration-700 p-2 font-bold ${className}`}>
        {children}
    </button>)
}