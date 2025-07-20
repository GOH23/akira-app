"use client"
import { useScenes, ScenesType } from './hooks/useScenes'
import { useEffect, useRef, useState, MouseEvent, useMemo } from 'react'
//babylon-mmd & babylonjs
import { AbstractMesh, AssetContainer, Color3, CreateGround, DebugLayer, DirectionalLight, Engine, FlyCamera, HavokPlugin, HemisphericLight, LoadAssetContainerAsync, Mesh, Scene, ShadowGenerator, Vector3 } from '@babylonjs/core'
import { MmdModel, MmdPhysics, MmdRuntime, MmdStandardMaterialBuilder, SdefInjector } from 'babylon-mmd'
import { AkiraButton } from './Elements/AkiraButton'
import { EyeInvisibleOutlined, EyeOutlined, MutedOutlined, PauseOutlined, PlayCircleOutlined, SoundOutlined, UploadOutlined } from '@ant-design/icons'
import { Inspector } from '@babylonjs/inspector';
import { AkiraDrawer } from "./Elements/AkiraDrawer";
import { FilesetResolver, HolisticLandmarker } from "@mediapipe/tasks-vision";
import { SkeletonShow } from "./logic/Skeleton";
import { KeyFrameType, MotionModel, MotionSettingsType, SETTINGS_CONFIGType } from './logic/MotionModel'
import AkiraRadioButton from './Elements/AkiraRadioButton'
import { IsUUID } from './logic/extentions'
import { useSavedModel } from './hooks/useSavedModel'
import { InputNumber } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimationControlUi } from './Elements/ControlModelAnimation/AnimationControlUi'
import { Holistic } from '@mediapipe/holistic'

import { ControlPanel } from './Elements/ControlPanel'
import { AIAkiraDrawer } from './logic/LLM/AIAkiraDrawer'
export type DrawerStatesType = {
    VideoDrawerOpened: boolean,
    SettingsDrawerOpened: boolean,
    SkeletonModelOpened: boolean,
    ExportOpened: boolean,
    AssistantOpened: boolean
}
export type VideoState = {
    isPlaying: boolean,
    SkeletonPlaced: boolean,
    SoundEnabled: boolean
}

export default function ScenePage() {

    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams()
    const sceneId = searchParams.get('sceneId')
    const scenes = useScenes((state) => state.scenes);
    const [scene, setScene] = useState<ScenesType>();
    const [DrawerStates, setOpen] = useState<DrawerStatesType>({
        VideoDrawerOpened: false,
        SettingsDrawerOpened: false,
        SkeletonModelOpened: false,
        ExportOpened: false,
        AssistantOpened: false
    });
    const { GetModelData } = useSavedModel((state) => state);
    function OpenDrawer(selected: keyof DrawerStatesType, value: boolean) {
        const newState: DrawerStatesType = {
            ...DrawerStates,
        }
        newState[selected] = value;
        setOpen(newState)

    }
    //video
    const VideoCurrentRef = useRef<HTMLVideoElement>(null)
    const SkeletonCanvasRef = useRef<HTMLCanvasElement>(null);

    const [VideoState, SetVideoState] = useState<VideoState>({
        isPlaying: false,
        SkeletonPlaced: true,
        SoundEnabled: true
    });
    const onClicked = (ev: MouseEvent<HTMLButtonElement>) => {
        const newState: typeof VideoState = {
            ...VideoState,
        }
        newState[ev.currentTarget.id as keyof typeof VideoState] = !newState[ev.currentTarget.id as keyof typeof VideoState]
        SetVideoState(newState)
    }
    //mediapipe with drawing
    const [SelectedOld, SetSelectedOld] = useState(false)
    const [MotionCap] = useState(new MotionModel())
    const HolisticRef = useRef<HolisticLandmarker>(null)
    const HolisticOldRef = useRef<Holistic>(new Holistic({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        }
    }))
    HolisticOldRef.current.setOptions({
        modelComplexity: 2,
        smoothLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
        refineFaceLandmarks: true,
    })
    const [OnHolisticLoaded, SetHolisticLoaded] = useState(false)
    const loadHolistic = async () => {
        try {

            FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm").then(
                async (vision) => {
                    HolisticRef.current = await HolisticLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task",
                            delegate: "GPU",
                        },

                        runningMode: "VIDEO",
                    })

                })

        } catch (err) {
            console.log(err)
        }

    }
    const runAnimation = async () => {
        if (!SelectedOld && HolisticRef.current && VideoCurrentRef.current && !VideoCurrentRef.current.paused && VideoCurrentRef.current.readyState >= 2) {
            var timestamp = performance.now()
            HolisticRef.current!.detectForVideo(VideoCurrentRef.current, timestamp, (res) => {
                if (VideoState.SkeletonPlaced) SkeletonShow.onShowSkeleton(SkeletonCanvasRef, res)
                if (MMDStates.MMDRuntime && MMDStates.MMDModel) {
                    //v1
                    MotionCap.motionCalculate(res)
                    //v2
                    // var bones = new GrokFunc().mapLandmarksToMmdBones(res).bones
                    // Object.keys(bones).map((el) => {

                    //     MotionCap.setRotation(el as any, bones[el].rotation)
                    // })
                    SetKeyFrames(MotionCap.keyframes)
                }
            });
        }
        if (SelectedOld && VideoCurrentRef.current && !VideoCurrentRef.current.paused && VideoCurrentRef.current.readyState >= 2) {
            await HolisticOldRef.current.send({
                image: VideoCurrentRef.current
            })
        }
        requestAnimationFrame(runAnimation)
    }
    useEffect(() => {
        loadHolistic()
    }, [])

    useEffect(() => {
        if (HolisticRef.current) {
            console.log("Holistic loaded");
            SetHolisticLoaded(true)

        }

    }, [HolisticRef.current])
    //babylon-mmd
    const [MotionCaptureSettings, SetMotionCaptureSettings] = useState<MotionSettingsType>({
        BodyCalculate: true,
        LegsCalculate: true,
        ArmsCalculate: true,
        HeadCalculate: true,
        FacialAndEyesCalculate: true
    })
    const [SETTINGS_CONFIG, SetSETTINGS_CONFIG] = useState<SETTINGS_CONFIGType>({
        POSE_Y_SCALE: 0
    })
    const [KeyFrames, SetKeyFrames] = useState<KeyFrameType[]>([])
    const [MMDStates, SetMMDStates] = useState<{
        MMDScene?: Scene,
        MMDRuntime?: MmdRuntime,
        MMDModel?: MmdModel,
        MMDEngine?: Engine,
        MMDAssetContainer?: AssetContainer
        MMDShadowManager?: ShadowGenerator,
        MMDDebugLayer?: DebugLayer
    }>({})

    //Controls
    const Materials = useMemo(() => MMDStates.MMDModel?.mesh.metadata.meshes || [], [MMDStates.MMDModel])
    const [MaterialBuilder, _] = useState(new MmdStandardMaterialBuilder())
    const convRef = useRef<HTMLCanvasElement>(null)

    // Add new state for video position
    const [videoPosition, setVideoPosition] = useState({ x: 16, y: 16 }); // Default position (top-right)
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleDragStart = (e: React.MouseEvent) => {
        const videoContainer = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - videoContainer.left, // Убрано деление на 5
            y: e.clientY - videoContainer.top
        });
        setIsDragging(true);
    };
    useEffect(() => {
        const handleMouseMove = (e: any) => {
            if (!isDragging) return;

            const videoContainer = document.querySelector('.video-container')?.getBoundingClientRect();
            if (!videoContainer) return;

            const maxX = window.innerWidth - videoContainer.width;
            const maxY = window.innerHeight - videoContainer.height;

            let newX = e.clientX - dragOffset.x;
            let newY = e.clientY - dragOffset.y;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            setVideoPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const loadModel = async (
        eng: Engine,
        modelScene: Scene,
        modelName: string,
        mmdRuntime: MmdRuntime,
        shadowGenerator: ShadowGenerator
    ) => {

        if (MMDStates.MMDModel && MMDStates.MMDAssetContainer) {
            shadowGenerator?.removeShadowCaster(MMDStates.MMDModel.mesh);
            MMDStates.MMDModel.mesh.dispose(true, true);
            mmdRuntime.destroyMmdModel(MMDStates.MMDModel);
            MMDStates.MMDAssetContainer.removeAllFromScene();
            MMDStates.MMDAssetContainer.dispose();
        }

        if (!modelName) throw new Error("Invalid model name");
        let modelUrl: string;
        let blobUrl: string | null = null;

        if (IsUUID(modelName)) {
            const modelData = await GetModelData(modelName);
            if (!modelData) throw new Error("Model data not found");
            const blob = new Blob([modelData], { type: "application/octet-stream" });
            blobUrl = URL.createObjectURL(blob);
            modelUrl = blobUrl;
        } else {
            modelUrl = modelName;
        }

        // Load assets
        const [modelMesh, assetContainer] = await LoadAssetContainerAsync(
            modelUrl,
            modelScene,
            {
                rootUrl: IsUUID(modelName) ? undefined : `../assets/models/`,
                pluginExtension: IsUUID(modelName) ? ".bpmx" : undefined,
                onProgress: (event) => {
                    eng.loadingUIText = `\n\n\nLoading model... ${event.loaded}/${event.total} 
                            (${Math.floor((event.loaded / event.total) * 100)}%)`;
                },
                pluginOptions: {
                    mmdmodel: {
                        materialBuilder: MaterialBuilder,
                        boundingBoxMargin: 60,
                        loggingEnabled: true
                    }
                }
            }
        ).then(res => {
            // Validate loaded assets
            if (!res.meshes || res.meshes.length === 0) {
                throw new Error("No meshes found in asset container");
            }

            const mainMesh = res.meshes[0];
            res.addAllToScene();
            return [mainMesh, res] as [AbstractMesh, AssetContainer];
        }).finally(() => {
            // Cleanup blob URL after loading
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        });
        // Update state
        const result = {
            Model: modelMesh as Mesh,
            AssetContainer: assetContainer
        };
        return result;

    };

    useEffect(() => {
        const engine = new Engine(convRef.current, true, {
            preserveDrawingBuffer: false,
            stencil: false,
            antialias: false,
            alpha: true,
            premultipliedAlpha: false,
            powerPreference: "high-performance",
            doNotHandleTouchAction: false,
            doNotHandleContextLost: true,
            audioEngine: false,
        }, true);
        const mmdscene = new Scene(engine);
        if (window.havokPlugin)
            mmdscene.enablePhysics(new Vector3(0, -9.8 * 10, 0), new HavokPlugin(false, window.havokPlugin))
        Inspector._SetNewScene(mmdscene)


        SdefInjector.OverrideEngineCreateEffect(engine);
        MaterialBuilder.loadOutlineRenderingProperties = (): void => { /* do nothing */ };
        engine.loadingUIBackgroundColor = "var(--bg-color)"
        mmdscene.ambientColor = new Color3(0, 0, 0);
        //const camera = new MmdCamera("mmdCamera", new Vector3(0, 10, 0), mmdscene);
        var camera = new FlyCamera("camera", new Vector3(0, 15, -35), mmdscene);

        camera.bankedTurnLimit = Math.PI / 2;
        camera.bankedTurnMultiplier = 1;
        camera.attachControl(true);
        // const camera = new ArcRotateCamera("Camera", -1.6, 1, 50, Vector3.Zero(), mmdscene);
        // camera.attachControl(convRef.current, true);
        const mmdRuntime = new MmdRuntime(mmdscene, window.havokPlugin ? new MmdPhysics(mmdscene) : null);
        mmdRuntime.register(mmdscene)

        const hemisphericLight = new HemisphericLight("HemisphericLight", new Vector3(0, 1, 0), mmdscene);
        hemisphericLight.intensity = 0.3;
        hemisphericLight.specular.set(0, 0, 0);
        hemisphericLight.groundColor.set(1, 1, 1);

        const directionalLight = new DirectionalLight("directionalLight", new Vector3(0.5, -1, 1), mmdscene);
        directionalLight.intensity = 0.7;
        directionalLight.autoCalcShadowZBounds = false;
        directionalLight.autoUpdateExtends = false;
        directionalLight.shadowMaxZ = 20;
        directionalLight.shadowMinZ = -20;
        directionalLight.orthoTop = 18;
        directionalLight.orthoBottom = -3;
        directionalLight.orthoLeft = -10;
        directionalLight.orthoRight = 10;
        directionalLight.shadowOrthoScale = 0;

        const shadowGenerator = new ShadowGenerator(1024, directionalLight, true);
        shadowGenerator.transparencyShadow = true;
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.forceBackFacesOnly = false;
        shadowGenerator.bias = 0.01;
        shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;
        shadowGenerator.frustumEdgeFalloff = 0.1

        const ground = CreateGround("ground2", { width: 120, height: 120, subdivisions: 2, updatable: false }, mmdscene);
        ground.receiveShadows = true;

        mmdscene.onAfterRenderObservable.addOnce(() => engine.hideLoadingUI());
        if (scene) {
            Promise.all([loadModel(engine, mmdscene, scene.modelPathOrLink, mmdRuntime, shadowGenerator), mmdscene.debugLayer]).then(([res, debugLayer]) => {
                SetMMDStates({
                    MMDRuntime: mmdRuntime,
                    MMDScene: mmdscene,
                    MMDEngine: engine,
                    MMDModel: mmdRuntime.createMmdModel(res.Model),
                    MMDAssetContainer: res.AssetContainer,
                    MMDShadowManager: shadowGenerator,
                    MMDDebugLayer: debugLayer
                });

            });
        }

    }, [scene])

    useEffect(() => {

        if (VideoCurrentRef.current && VideoCurrentRef.current.src && VideoState) {
            if (VideoState.isPlaying) VideoCurrentRef.current.play()
            else VideoCurrentRef.current.pause();
        }
    }, [VideoState])
    //rerender model with shadow
    useEffect(() => {
        if (MMDStates.MMDEngine && MMDStates.MMDScene && MMDStates.MMDRuntime && MMDStates.MMDShadowManager && scene && scene.modelPathOrLink) {
            loadModel(MMDStates.MMDEngine, MMDStates.MMDScene, scene!.modelPathOrLink, MMDStates.MMDRuntime, MMDStates.MMDShadowManager).then((res) => {
                SetMMDStates({ ...MMDStates, MMDModel: MMDStates.MMDRuntime?.createMmdModel(res.Model), MMDAssetContainer: res.AssetContainer });
                MMDStates.MMDEngine!.hideLoadingUI();
            })
        }
        console.log("Changed to " + scene?.modelPathOrLink)
    }, [scene?.modelPathOrLink])
    //rerender scene
    useEffect(() => {
        if (MMDStates.MMDEngine && MMDStates.MMDScene) {
            console.log("Loaded");
            MMDStates.MMDEngine?.runRenderLoop(() => {
                MMDStates.MMDEngine!.resize();
                MMDStates.MMDScene?.render()

            });
        }
    }, [MMDStates.MMDEngine, MMDStates.MMDScene])

    useEffect(() => {
        if (MMDStates.MMDModel && MMDStates.MMDEngine) MotionCap.init(MMDStates.MMDModel, MMDStates.MMDEngine);
    }, [MMDStates.MMDModel])
    //settings
    useEffect(() => {
        MotionCap.setSettings(MotionCaptureSettings)
    }, [MotionCaptureSettings])
    useEffect(() => {
        MotionCap.SETTINGS_CONFIG = SETTINGS_CONFIG;
    }, [SETTINGS_CONFIG])

    useEffect(() => {
        setScene(scenes.find((el) => el.id == sceneId))
    }, [scenes, sceneId])



    return (
        <div className="relative h-screen bg-gray-900">
            <div className="absolute inset-0">
                <canvas ref={convRef} className="w-full h-full" />
            </div>
            {/* Video container */}
            <div
                className="absolute w-80 video-container aspect-video bg-black rounded-xl overflow-hidden shadow-2xl cursor-move"
                style={{
                    transform: `translate(${videoPosition.x}px, ${videoPosition.y}px)`,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 999,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleDragStart}
            >
                <div className="relative w-full h-full">
                    {VideoState.SkeletonPlaced && (
                        <div
                            className="absolute w-full h-full pointer-events-none"
                            style={{

                                zIndex: 45
                            }}
                        >
                            <canvas ref={SkeletonCanvasRef} className="w-full h-full" />
                        </div>
                    )}

                    <video
                        onPlay={() => {
                            requestAnimationFrame(runAnimation)
                        }}
                        onPause={() => MotionCap.endRecordMp4()}
                        ref={VideoCurrentRef}
                        controls={false}
                        className="w-full max-h-96 h-full object-contain"

                        muted={!VideoState.SoundEnabled}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    id="isPlaying"
                                    onClick={onClicked}
                                    className="text-white hover:text-purple-400 transition-colors"
                                >
                                    {VideoState.isPlaying ?
                                        <PauseOutlined className="text-xl" /> :
                                        <PlayCircleOutlined className="text-xl" />
                                    }
                                </button>

                                <button
                                    id="SkeletonPlaced"
                                    onClick={onClicked}
                                    className={`transition-colors ${VideoState.SkeletonPlaced ? 'text-purple-400' : 'text-white hover:text-purple-400'}`}
                                >
                                    {VideoState.SkeletonPlaced ?
                                        <EyeOutlined className="text-xl" /> :
                                        <EyeInvisibleOutlined className="text-xl" />
                                    }
                                </button>
                                <label htmlFor="file" className='cursor-pointer flex justify-center text-purple-400 items-center h-[25px] w-full'>
                                    <UploadOutlined className="text-xl" />
                                </label>
                                <input
                                    id="file"
                                    type="file"
                                    className="hidden"
                                    accept="video/*"
                                    onChange={async (event) => {
                                        const file = event.target.files![0]
                                        const url = URL.createObjectURL(file);
                                        VideoCurrentRef.current!.src = url;
                                        requestAnimationFrame(runAnimation)
                                    }}
                                />
                                <button
                                    id="SoundEnabled"
                                    onClick={onClicked}
                                    className={`transition-colors ${VideoState.SoundEnabled ? 'text-purple-400' : 'text-white hover:text-purple-400'}`}
                                >
                                    {VideoState.SoundEnabled ?
                                        <SoundOutlined className="text-xl" /> :
                                        <MutedOutlined className="text-xl" />
                                    }
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-white text-sm">
                                    {VideoCurrentRef.current?.currentTime ?
                                        `${Math.floor(VideoCurrentRef.current.currentTime / 60)}:${Math.floor(VideoCurrentRef.current.currentTime % 60).toString().padStart(2, '0')}` :
                                        '0:00'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control panel */}
            <ControlPanel onOpenDrawer={OpenDrawer} />
            <AkiraDrawer
                title={t("scenePage.ModalTitle")}
                placement="right"
                onClose={() => OpenDrawer('VideoDrawerOpened', false)}
                open={DrawerStates.VideoDrawerOpened}
                loading={!OnHolisticLoaded}
            >
                <AkiraButton className="w-full p-0">
                    <div className="w-full">
                        <label htmlFor="file" className='cursor-pointer flex justify-center items-center h-[25px] w-full'>
                            {t("scenePage.FileUpload")}
                        </label>
                        <input
                            id="file"
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={async (event) => {
                                const file = event.target.files![0]
                                const url = URL.createObjectURL(file);
                                VideoCurrentRef.current!.src = url;
                                requestAnimationFrame(runAnimation)
                            }}
                        />
                    </div>
                </AkiraButton>

                <div className='mt-2 flex flex-col gap-y-2'>
                    <AkiraButton
                        className="w-full"
                        onClick={async () => {
                            const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
                            if (hasGetUserMedia()) {
                                try {
                                    const stream = await navigator.mediaDevices.getUserMedia({
                                        video: {
                                            width: 640,
                                            height: 480,
                                            facingMode: "user"
                                        }
                                    });

                                    if (VideoCurrentRef.current) {
                                        VideoCurrentRef.current.srcObject = stream;
                                        await VideoCurrentRef.current.play();

                                    }
                                } catch (error) {
                                    console.error('Error accessing camera:', error);
                                }
                            } else {
                                console.error('getUserMedia is not supported in this browser');
                            }
                        }}
                    >
                        {t("scenePage.UseCamera")}
                    </AkiraButton>
                    {/* <AkiraButton
                        className="w-full"
                        onClick={() => {
                            if (VideoCurrentRef.current && VideoCurrentRef.current.src)
                                MotionCap.startRecordMp4(VideoCurrentRef.current)
                        }}
                    >
                        {t("scenePage.RecordVideo")}
                    </AkiraButton> */}

                </div>
            </AkiraDrawer>
            {MMDStates.MMDRuntime && MMDStates.MMDScene && <AIAkiraDrawer motionModel={MotionCap} mmdRuntime={MMDStates.MMDRuntime} mmdScene={MMDStates.MMDScene} DrawerStates={DrawerStates} OpenDrawer={OpenDrawer} />}

            <AkiraDrawer
                title="Settings"
                placement="right"
                onClose={() => OpenDrawer('SettingsDrawerOpened', false)}
                open={DrawerStates.SettingsDrawerOpened}
            >
                <p className='text-ForegroundColor text-lg text-center font-bold mb-4'>
                    {t("scenePage.MotionCaptureSettings.title")}
                </p>
                <div className='flex justify-around mb-6'>
                    <div className='flex flex-col text-base gap-y-3 text-ForegroundColor'>
                        <p>{t("scenePage.MotionCaptureSettings.settingTitle")}</p>
                        <p>{t("scenePage.MotionCaptureSettings.settingTitle2")}</p>
                        <p>{t("scenePage.MotionCaptureSettings.settingTitle3")}</p>
                        <p>{t("scenePage.MotionCaptureSettings.settingTitle4")}</p>
                        <p>{t("scenePage.MotionCaptureSettings.settingTitle5")}</p>
                        <p>{t("scenePage.MotionCaptureSettings.settingTitle6")}</p>
                    </div>
                    <div className='flex gap-y-3 flex-col justify-center items-center'>
                        {Object.keys(MotionCaptureSettings).map((el, ind) => (
                            <AkiraRadioButton
                                key={ind}
                                checked={MotionCaptureSettings[el as keyof MotionSettingsType]}
                                onChange={() => {
                                    SetMotionCaptureSettings((prevState) => {
                                        var prevStates = { ...prevState };
                                        var elem = el as keyof MotionSettingsType;
                                        var newState = prevStates;
                                        newState[elem] = !prevStates[elem]
                                        return newState;
                                    })
                                }}
                            />
                        ))}
                        <AkiraRadioButton
                            checked={SelectedOld}
                            onChange={() => {
                                SetSelectedOld(!SelectedOld)
                            }}
                        />
                    </div>
                </div>
                <p className='text-ForegroundColor text-lg text-center font-bold mb-4'>
                    {t("scenePage.VariableSettings.title")}
                </p>
                <div className='flex justify-around mb-3'>
                    <div className='flex flex-col text-base gap-y-3 text-ForegroundColor'>
                        <p>{t("scenePage.VariableSettings.settingTitle")}</p>
                    </div>
                    <div className='flex gap-y-3 flex-col justify-center items-center'>
                        <InputNumber
                            type="number"
                            controls
                            onChange={(value) => {
                                if (value) {
                                    SetSETTINGS_CONFIG({
                                        ...SETTINGS_CONFIG,
                                        POSE_Y_SCALE: value
                                    })
                                }
                            }}
                            value={SETTINGS_CONFIG.POSE_Y_SCALE}
                        />
                    </div>
                </div>
                <p className='text-ForegroundColor text-lg text-center font-bold mb-4'>
                    Babylonjs UI
                </p>
                <div className='flex gap-y-3 flex-col justify-center items-center'>
                    <AkiraButton className=' w-full' onClick={() => {
                        MMDStates.MMDDebugLayer.show({ showInspector: true, showExplorer: false })
                        MMDStates.MMDDebugLayer.popupInspector();
                    }}>
                        Open INSPECTOR
                    </AkiraButton>
                    <AkiraButton className='w-full' onClick={() => {
                        MMDStates.MMDDebugLayer.show({ showInspector: false, showExplorer: true })
                        MMDStates.MMDDebugLayer.popupSceneExplorer();
                    }}>
                        Open SCENE EXPLORER
                    </AkiraButton>
                </div>
            </AkiraDrawer>

            {/* <AkiraDrawer
                title={t("scenePage.MaterialsControl.title")}
                placement="right"
                onClose={() => OpenDrawer('SkeletonModelOpened', false)}
                open={DrawerStates.SkeletonModelOpened}
            >
                <MaterialsDrawer
                    materials={Materials}
                    onClose={() => OpenDrawer('SkeletonModelOpened', false)}
                />
            </AkiraDrawer> */}

            {/* Animation Control UI */}
            <AnimationControlUi
                title={t("scenePage.AnimationControl.title")}
                open={DrawerStates.ExportOpened}
                placement="bottom"
                SetKeyFrames={SetKeyFrames}
                onClose={() => OpenDrawer("ExportOpened", false)}
                KeyFrames={KeyFrames}
                MotionModelInstance={MotionCap}
            />

        </div>
    );
} 