import { RefObject } from "react";
import { HolisticLandmarkerResult, PoseLandmarker, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS, FACEMESH_TESSELATION, HAND_CONNECTIONS, Results } from "@mediapipe/holistic";



export class SkeletonShow {
    static onShowSkeleton(canvas: RefObject<HTMLCanvasElement | null>, result: HolisticLandmarkerResult) {
        if (canvas.current) {
            const canvasCtx = canvas.current.getContext('2d')!;
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvas.current.width, canvas.current.height)
            const drawingUtils = new DrawingUtils(canvasCtx);
            drawingUtils.drawConnectors(result.rightHandLandmarks[0], HandLandmarker.HAND_CONNECTIONS);
            drawingUtils.drawConnectors(result.leftHandLandmarks[0], HandLandmarker.HAND_CONNECTIONS);
            drawingUtils.drawConnectors(result.poseLandmarks[0], PoseLandmarker.POSE_CONNECTIONS);

        }

    }
    static onOldShowSkeleton(canvas: RefObject<HTMLCanvasElement | null>, results: Results) {
        if (canvas.current) {
            var canvasElement = canvas.current;
            const canvasCtx = canvas.current.getContext('2d')!;

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
                color: "#00cff7",
                lineWidth: 4,
            });
            drawLandmarks(canvasCtx, results.poseLandmarks, {
                color: "#ff0364",
                lineWidth: 2,
            });
            drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
                color: "#C0C0C070",
                lineWidth: 1,
            });
            if (results.faceLandmarks && results.faceLandmarks.length === 478) {
                //draw pupils
                drawLandmarks(
                    canvasCtx,
                    [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
                    {
                        color: "#ffe603",
                        lineWidth: 2,
                    }
                );
            }
            drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
                color: "#eb1064",
                lineWidth: 5,
            });
            drawLandmarks(canvasCtx, results.leftHandLandmarks, {
                color: "#00cff7",
                lineWidth: 2,
            });
            drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
                color: "#22c3e3",
                lineWidth: 5,
            });
            drawLandmarks(canvasCtx, results.rightHandLandmarks, {
                color: "#ff0364",
                lineWidth: 2,
            });
            canvasCtx.restore();

        }

    }
}