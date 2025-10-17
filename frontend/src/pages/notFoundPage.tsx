import { Flex } from "@/components/ui/flex.tsx";
import Typography from "@/components/ui/typography.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";

const notFoundPage = () => {
	return (
		<Flex
			direction="col"
			justify="center"
			align="center"
			gap="4"
			className="min-h-screen"
		>
			<Typography.h1>404</Typography.h1>
			<Typography.p>Страница не найдена</Typography.p>
			<Button asChild>
				<Link to="/">Вернуться на главную</Link>
			</Button>
		</Flex>
	);
};

export default notFoundPage;
