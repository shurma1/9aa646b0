import { cn } from "@/lib/utils"

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Направление оси flex */
	direction?: "row" | "row-reverse" | "col" | "col-reverse"
	
	/** Горизонтальное выравнивание */
	justify?:
		| "start"
		| "end"
		| "center"
		| "between"
		| "around"
		| "evenly"
	
	/** Вертикальное выравнивание */
	align?:
		| "start"
		| "end"
		| "center"
		| "baseline"
		| "stretch"
	
	/** Оборачивание элементов */
	wrap?: "nowrap" | "wrap" | "wrap-reverse"
	
	/** Отступ между элементами (gap) — использует scale Tailwind */
	gap?: string
}


export function Flex({
	direction = "row",
	justify = "start",
	align = "stretch",
	gap = "0",
	wrap,
	className,
	...props
}: FlexProps) {
	const directionMap: Record<NonNullable<FlexProps['direction']>, string> = {
		row: 'flex-row',
		'row-reverse': 'flex-row-reverse',
		col: 'flex-col',
		'col-reverse': 'flex-col-reverse',
	}

	const justifyMap: Record<NonNullable<FlexProps['justify']>, string> = {
		start: 'justify-start',
		end: 'justify-end',
		center: 'justify-center',
		between: 'justify-between',
		around: 'justify-around',
		evenly: 'justify-evenly',
	}

	const alignMap: Record<NonNullable<FlexProps['align']>, string> = {
		start: 'items-start',
		end: 'items-end',
		center: 'items-center',
		baseline: 'items-baseline',
		stretch: 'items-stretch',
	}

	const wrapMap: Record<NonNullable<FlexProps['wrap']>, string> = {
		nowrap: 'flex-nowrap',
		wrap: 'flex-wrap',
		'wrap-reverse': 'flex-wrap-reverse',
	}

	const gapClass = gap && gap !== '0' ? `gap-${gap}` : undefined

	return (
		<div
			className={cn(
				'flex',
				directionMap[direction],
				justifyMap[justify],
				alignMap[align],
				wrap ? wrapMap[wrap] : undefined,
				gapClass,
				className
			)}
			{...props}
		/>
	)
}
