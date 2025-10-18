import {
	BrowserRouter,
	Routes,
	Route
} from "react-router-dom";
import {routes} from "@/config/routerConfig.tsx";


const Router = () => {
	return (
		<BrowserRouter>
			<Routes>
				{
					routes.map(
						(route, index) =>
							<Route
								key={index}
								path={route.route}
								element={route.element}
							/>
					)
				}
			</Routes>
		</BrowserRouter>
	);
};

export default Router;
