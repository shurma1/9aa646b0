import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const typographyVariants = cva('', {
	variants: {
		variant: {
			h1: 'scroll-m-20 text-6xl font-extrabold tracking-tight lg:text-7xl',
			h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
			h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
			h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
			p: 'leading-7',
		},
	},
	defaultVariants: {
		variant: 'p',
	},
});

type TypographyVariant = NonNullable<VariantProps<typeof typographyVariants>['variant']>;

interface BaseTypographyProps {
	variant?: TypographyVariant;
	className?: string;
	as?: React.ElementType;
	children?: React.ReactNode;
}

const TypographyBase = forwardRef<HTMLElement, BaseTypographyProps>(
	({ as: Component = 'p', variant = 'p', className, children, ...props }, ref) => {
		return (
			<Component
				ref={ref as React.Ref<HTMLElement>}
				className={cn(typographyVariants({ variant }), className)}
				{...props}
			>
				{children}
			</Component>
		);
	}
);

TypographyBase.displayName = 'TypographyBase';

function createTypography(variant: TypographyVariant, defaultAs: React.ElementType) {
	const Comp = forwardRef<HTMLElement, Omit<BaseTypographyProps, 'variant'>>(
		({ as, className, children, ...props }, ref) => {
			const Component = as || defaultAs;
			return (
				<Component
					ref={ref as React.Ref<HTMLElement>}
					className={cn(typographyVariants({ variant }), className)}
					{...props}
				>
					{children}
				</Component>
			);
		}
	);
	Comp.displayName = `Typography.${variant}`;
	return Comp;
}

const Typography = {
	h1: createTypography('h1', 'h1'),
	h2: createTypography('h2', 'h2'),
	h3: createTypography('h3', 'h3'),
	h4: createTypography('h4', 'h4'),
	p: createTypography('p', 'p'),
};

export { Typography, TypographyBase };
export type { BaseTypographyProps };
export default Typography;
