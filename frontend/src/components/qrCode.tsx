import { forwardRef, useEffect, useState } from "react";
import QRCode from "react-fancy-qrcode";
import { Spinner } from "./ui/spinner";

export type FancyQRCodeProps = {
  value?: string;
  size?: number;
  className?: string;
  color?: string;
  showPicker?: boolean;
  defaultColor?: string;
  [key: string]: any;
};

const FancyQRCode = forwardRef<SVGSVGElement, FancyQRCodeProps>(
	(props, ref) => {
	const { className, color, showPicker, defaultColor, isLoading, size = 100, ...rest } = props;
	const initial = color ?? defaultColor ?? "#000000";
	const [selectedColor, setSelectedColor] = useState<string>(initial);
		
		useEffect(() => {
			console.log(props.value)
		}, [props.value]);
		
		
		useEffect(() => {
		if (color) {
			setSelectedColor(color);
		}
	}, [color]);

	const effectiveColor = color ?? selectedColor;
	
	return (
		<div className={className}>
			{showPicker && (
				<div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
					<label style={{ fontSize: 12, color: "#444" }}>Color:</label>
					<input
						aria-label="Pick QR color"
						type="color"
						value={selectedColor}
						onChange={(e) => setSelectedColor(e.target.value)}
						style={{ width: 36, height: 36, padding: 0, border: "none", background: "transparent" }}
					/>
				</div>
				)}
				
				<div style={{
					width: typeof size === "number" ? size : Number(size),
					height: typeof size === "number" ? size : Number(size),
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
				}}>
				{!props.value ? (
					<div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
						<Spinner className="size-8" />
					</div>
				) : (
					<QRCode ref={ref as any} size={size as number} color={effectiveColor} backgroundColor="transparent" {...rest} />
			)}
			</div>
		</div>
	);
});

FancyQRCode.displayName = "FancyQRCode";

export default FancyQRCode;
