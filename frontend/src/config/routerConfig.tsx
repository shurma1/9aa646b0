import type {ReactNode} from "react";
import HomePage from "@/pages/homePage.tsx";
import StreamPage from '@/pages/streamPage.tsx'
import NotFoundPage from "@/pages/notFoundPage.tsx";
import SlamVisualizerPage from "@/pages/viewer.tsx";

export type IRouterConfig = {
	route: string,
	element: ReactNode
}[]

export const routes: IRouterConfig = [
	{
		route: '',
		element: <HomePage/>
	},
	{
		route: 'stream',
		element: <StreamPage/>
	},
	{
		route: '*',
		element: <NotFoundPage/>
	},
    {
        route: 'viewer',
        element: <SlamVisualizerPage />
    }
]
