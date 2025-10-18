
import React, { useEffect, useState} from "react";
import { Typography } from "@/components/ui/typography";
import FilePickerCard from "@/components/FilePickerCard.tsx";

const HomePage: React.FC = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8 flex flex-col items-center justify-center">
			<div className="w-full max-w-6xl mx-auto space-y-8 flex flex-col items-center">
				{/* Header Section */}
				<div className="text-center space-y-4 mb-8">
					<Typography.h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
						ORB-SLAM3 Video Tracker
					</Typography.h1>
					<Typography.p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Загрузите видео для анализа и отслеживания траектории камеры в реальном времени с помощью технологии SLAM
					</Typography.p>
				</div>

				{/* Upload Section */}
				<div className="w-[80vw] max-w-6xl">
					<FilePickerCard />
				</div>
			</div>
		</div>
	);
};

export default HomePage;
