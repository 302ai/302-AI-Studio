import { PropsWithChildren, HTMLAttributes } from "react";
import { isMac, isWindows } from "@renderer/config/constant";
import { cn } from "@renderer/lib/utils";

type Props = PropsWithChildren & HTMLAttributes<HTMLDivElement>;

interface TitlebarProps extends Props {
	className?: string;
}

const dragRegion = { WebkitAppRegion: "drag" } as React.CSSProperties;

export function TitlebarContainer({ children, ...props }: TitlebarProps) {
	return (
		<div
			className={cn(
				"flex w-full flex-row items-center bg-navbar",
				isMac ? "pl-[140px]" : "",
			)}
			style={dragRegion}
			{...props}
		>
			{children}
		</div>
	);
}

export function TitlebarLeft({ children, className, ...props }: TitlebarProps) {
	return (
		<div
			className={cn(
				"flex flex-row items-center h-[var(--title-bar-height)]",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function TitlebarCenter({
	children,
	className,
	...props
}: TitlebarProps) {
	return (
		<div
			className={cn(
				"flex flex-1 items-center font-bold h-[var(--title-bar-height)]",
				isMac ? "px-5" : "px-0",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function TitlebarRight({
	children,
	className,
	...props
}: TitlebarProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-end pl-3 h-[var(--title-bar-height)]",
				isWindows ? "pr-[140px]" : "pr-3",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
