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
    static onOldShowSkeleton(
        canvas: RefObject<HTMLCanvasElement | null>,
        results: Results,
        skeletonSettings?: {
            showPose?: boolean;
            poseColor?: string;
            poseLineWidth?: number;
            showHands?: boolean;
            handColor?: string;
            handLineWidth?: number;
            showFace?: boolean;
            faceColor?: string;
            faceLineWidth?: number;
        }
    ) {
        if (canvas.current) {
            var canvasElement = canvas.current;
            const canvasCtx = canvas.current.getContext('2d')!;

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            // Pose
            if (skeletonSettings?.showPose ?? true) {
                drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
                    color: skeletonSettings?.poseColor ?? "#00cff7",
                    lineWidth: skeletonSettings?.poseLineWidth ?? 4,
                });
                drawLandmarks(canvasCtx, results.poseLandmarks, {
                    color: "#ff0364",
                    lineWidth: 2,
                });
            }
            // Face
            if ((skeletonSettings?.showFace ?? true) && results.faceLandmarks) {
                drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
                    color: skeletonSettings?.faceColor ?? "#C0C0C070",
                    lineWidth: skeletonSettings?.faceLineWidth ?? 1,
                });
                if (results.faceLandmarks.length === 478) {
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
            }
            // Left Hand
            if (skeletonSettings?.showHands ?? true) {
                drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
                    color: skeletonSettings?.handColor ?? "#eb1064",
                    lineWidth: skeletonSettings?.handLineWidth ?? 5,
                });
                drawLandmarks(canvasCtx, results.leftHandLandmarks, {
                    color: "#00cff7",
                    lineWidth: 2,
                });
                // Right Hand
                drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
                    color: skeletonSettings?.handColor ?? "#22c3e3",
                    lineWidth: skeletonSettings?.handLineWidth ?? 5,
                });
                drawLandmarks(canvasCtx, results.rightHandLandmarks, {
                    color: "#ff0364",
                    lineWidth: 2,
                });
            }
            canvasCtx.restore();

        }

    }
}