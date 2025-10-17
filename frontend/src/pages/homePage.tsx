
import React, { useEffect, useState} from "react";
import { Typography } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import QrCodeCard from "@/components/qrCodeCard.tsx";
import FilePickerCard from "@/components/FilePickerCard.tsx";

const HomePage: React.FC = () => {
	const [link, setLink] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	
	useEffect(() => {
		setTimeout(() => {
			setLink('http://reassel.com/stream/129392301290429391s')
		}, 2000)
	}, []);
	

	return (
		<div className="p-8 flex flex-col items-center">
			<Typography.h1 className="mb-8 text-center">ORB-SLAM3 Demo</Typography.h1>

			<Flex gap="6" align="center" justify="center" wrap="nowrap" className="overflow-auto">
				<FilePickerCard onFileSelected={(file) => setSelectedFile(file)} />
				<QrCodeCard
					value={link}
				/>
			</Flex>

			{selectedFile && (
				<div className="mt-4 text-center">
					<Typography.p>Выбран файл: {selectedFile.name}</Typography.p>
				</div>
			)}
		</div>
	);
};

export default HomePage;
