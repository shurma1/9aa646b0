import React from 'react';
import SlamVisualizer from '../components/orbSLAMViewer';

const SlamVisualizerPage: React.FC = () => {
    return (
        <div>
            <h1>ORB_SLAM3 Visualizer</h1>
            <SlamVisualizer />
        </div>
    );
};

export default SlamVisualizerPage;