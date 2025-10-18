import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Upload, AlertCircle, Loader2} from "lucide-react";
import React, {useCallback, useRef, useState} from "react";
import {Typography} from "@/components/ui/typography";
import { useNavigate } from "react-router-dom";
import { uploadFileWithProgress } from "@/api/uploadApi";
import type { UploadResponse } from "@/api";

interface FilePickerCardProps {
	onFileSelected?: (file: File) => void;
	onUploadComplete?: (result: UploadResponse) => void;
}


const FilePickerCard: React.FC<FilePickerCardProps> = ({ 
	onFileSelected, 
	onUploadComplete
}) => {
	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const dragCounter = React.useRef(0);
	const navigate = useNavigate();
	
	const openFileDialog = useCallback(() => {
		fileInputRef.current?.click();
	}, []);
	
	const handleFiles = useCallback(async (files: FileList | null) => {
		if (files && files.length > 0) {
			const file = files[0];
			setFileName(file.name);
			setUploadError(null);
			
			// Уведомляем родителя о выбранном файле
			onFileSelected?.(file);
			
			// Автоматически загружаем файл
			setIsUploading(true);
			setUploadProgress(0);
			
			try {
				const result = await uploadFileWithProgress(file, (progress) => {
					setUploadProgress(progress);
				});
				
				setIsUploading(false);
				
				if (result.type === 'complete') {
					onUploadComplete?.(result);
					// Перенаправляем на страницу обработки с processing_id
					navigate(`/processing/${result.id}`);
				}
			} catch (error) {
				console.error('Upload failed:', error);
				setIsUploading(false);
				setUploadError(error instanceof Error ? error.message : 'Ошибка загрузки');
			}
		}
	}, [onFileSelected, onUploadComplete, navigate]);
	
	const prevent = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);
	
	
	const onDragEnter = useCallback((e: React.DragEvent) => {
		prevent(e);
		if (!isUploading) {
			dragCounter.current += 1;
			setIsDragging(true);
		}
	}, [prevent, isUploading]);

	const onDragLeave = useCallback((e: React.DragEvent) => {
		prevent(e);
		if (!isUploading) {
			dragCounter.current -= 1;
			if (dragCounter.current <= 0) {
				dragCounter.current = 0;
				setIsDragging(false);
			}
		}
	}, [prevent, isUploading]);
	
	const onDrop = useCallback((e: React.DragEvent) => {
		prevent(e);
		if (!isUploading) {
			dragCounter.current = 0;
			setIsDragging(false);
			handleFiles(e.dataTransfer.files);
		}
	}, [prevent, handleFiles, isUploading]);
	
	const onFileSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		handleFiles(e.target.files);
	};
	
	return (
			<Card
				className={`w-full border-dashed ${
					isDragging && !isUploading 
						? "border-primary bg-primary/5" 
						: isUploading
						? "border-primary bg-primary/10"
						: uploadError
						? "border-red-500 bg-red-50"
						: "border-border"
				}`}
			onDragEnter={onDragEnter}
			onDragOver={prevent}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
		>
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Загрузите видео</CardTitle>
				<CardDescription className="text-base">
					Перетащите видеофайл в эту область или кликните для выбора файла
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div
					role="button"
					tabIndex={0}
					onClick={isUploading ? undefined : openFileDialog}
					onKeyDown={(event) => {
						if ((event.key === "Enter" || event.key === " ") && !isUploading) {
							event.preventDefault();
							openFileDialog();
						}
					}}
					className={`group flex h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border/80 bg-muted/40 p-8 text-center transition-all duration-200 ${
						isUploading 
							? "cursor-default" 
							: "cursor-pointer hover:border-primary hover:bg-primary/5 hover:shadow-lg"
					}`}
				>
					{/* Иконка состояния */}
					{isUploading ? (
						<Loader2 className="h-12 w-12 text-primary animate-spin" strokeWidth={1.5} />
					) : uploadError ? (
						<AlertCircle className="h-12 w-12 text-red-600" strokeWidth={1.5} />
					) : (
						<Upload className="h-12 w-12 text-muted-foreground group-hover:text-primary" strokeWidth={1.5} />
					)}
					
					{/* Текст состояния */}
					{isUploading ? (
						<>
							<Typography.p className="text-base font-semibold text-primary">
								Загрузка файла...
							</Typography.p>
							<div className="w-full max-w-md">
								<div className="flex justify-between text-sm text-muted-foreground mb-2">
									<span className="font-medium">{uploadProgress}%</span>
									<span className="truncate ml-4">{fileName}</span>
								</div>
								<div className="w-full bg-muted rounded-full h-3 shadow-inner">
									<div 
										className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-300 shadow-sm" 
										style={{ width: `${uploadProgress}%` }}
									/>
								</div>
							</div>
						</>
					) : uploadError ? (
						<>
							<Typography.p className="text-base font-semibold text-red-600">
								❌ Ошибка загрузки
							</Typography.p>
							<Typography.p className="text-sm text-muted-foreground">
								{uploadError}
							</Typography.p>
						</>
					) : (
						<>
							<Typography.p className="text-lg font-medium text-foreground/90">
								Перетащите видео сюда
							</Typography.p>
							<Typography.p className="text-sm text-muted-foreground">
								или кликните для выбора файла
							</Typography.p>
							{fileName && (
								<div className="mt-2 px-4 py-2 bg-primary/10 rounded-full">
									<Typography.p className="text-sm text-primary font-medium">
										📁 {fileName}
									</Typography.p>
								</div>
							)}
						</>
					)}
				</div>
				
				{/* Кнопка сброса при ошибке */}
				{uploadError && (
					<div className="mt-6 flex justify-center">
						<button
							onClick={(e) => {
								e.stopPropagation();
								setUploadError(null);
								setFileName(null);
								setUploadProgress(0);
							}}
							className="px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg active:scale-95"
						>
							🔄 Попробовать снова
						</button>
					</div>
				)}
				
				<input
					type="file"
					ref={fileInputRef}
					className="hidden"
					onChange={onFileSelect}
					accept="video/*"
					disabled={isUploading}
				/>
			</CardContent>
		</Card>
	);
};

export default FilePickerCard;
