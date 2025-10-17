import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Upload} from "lucide-react";
import React, {useCallback, useRef, useState} from "react";

interface FilePickerCardProps {
	onFileSelected?: (file: File) => void;
}
import {Typography} from "@/components/ui/typography";


const FilePickerCard: React.FC<FilePickerCardProps> = ({ onFileSelected }) => {
	
	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const dragCounter = React.useRef(0);
	
	
	const openFileDialog = useCallback(() => {
		fileInputRef.current?.click();
	}, []);
	
	const handleFiles = useCallback((files: FileList | null) => {
		if (files && files.length > 0) {
			setFileName(files[0].name);
			// notify parent about selected file
			onFileSelected?.(files[0]);
		}
	}, []);
	
	const prevent = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);
	
	
	const onDragEnter = useCallback((e: React.DragEvent) => {
		prevent(e);
		dragCounter.current += 1;
		setIsDragging(true);
	}, [prevent]);

	const onDragLeave = useCallback((e: React.DragEvent) => {
		prevent(e);
		dragCounter.current -= 1;
		if (dragCounter.current <= 0) {
			dragCounter.current = 0;
			setIsDragging(false);
		}
	}, [prevent]);
	
	const onDrop = useCallback((e: React.DragEvent) => {
		prevent(e);
		dragCounter.current = 0;
		setIsDragging(false);
		handleFiles(e.dataTransfer.files);
	}, [prevent, handleFiles]);
	
	const onFileSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		handleFiles(e.target.files);
	};
	
	return (
			<Card
				className={`w-full max-w-sm border-dashed ${
					isDragging ? "border-primary bg-primary/5" : "border-border"
				}`}
			onDragEnter={onDragEnter}
			onDragOver={prevent}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
		>
			<CardHeader>
				<CardTitle>Загрузите файл</CardTitle>
				<CardDescription>
					Перетащите видеофайл или изображение в эту область или выберите вручную.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div
					role="button"
					tabIndex={0}
					onClick={openFileDialog}
					onKeyDown={(event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							openFileDialog();
						}
					}}
					className="group flex h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-muted/40 p-6 text-center hover:border-primary"
				>
					<Upload className="h-12 w-12 text-muted-foreground group-hover:text-primary" strokeWidth={1.5} />
					<Typography.p className="text-sm text-muted-foreground">
						Перетащите файл сюда или кликните, чтобы выбрать
					</Typography.p>
					{fileName && (
						<Typography.p className="text-xs text-muted-foreground/80">
							Выбран файл: {fileName}
						</Typography.p>
					)}
				</div>
				<input
					type="file"
					ref={fileInputRef}
					className="hidden"
					onChange={onFileSelect}
				/>
			</CardContent>
		</Card>
	);
};

export default FilePickerCard;
