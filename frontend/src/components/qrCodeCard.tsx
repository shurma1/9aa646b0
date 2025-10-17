import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import QRCodeComponent from "@/components/qrCode.tsx";
import {type FC} from "react";

interface OwnProps {
	value?: string | null;
}

const QrCodeCard:FC<OwnProps> = ({value}) => {
	
	return (
		<Card className="w-full max-w-xs">
			<CardHeader>
				<CardTitle>QR-код</CardTitle>
				<CardDescription>Отсканируйте QR-код для начала трансляции.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/40">
					<QRCodeComponent
						value={value}
						color="#ffffff"
						size={200}/>
				</div>
			</CardContent>
		</Card>
	);
};

export default QrCodeCard;
