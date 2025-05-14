"use client"
import { useScenes, ScenesType } from './hooks/useScenes'
import { useEffect, useRef, useState, MouseEvent, useMemo } from 'react'
//babylon-mmd & babylonjs
import { AbstractMesh, AssetContainer, Color3, CreateGround, DirectionalLight, Engine, FlyCamera, HavokPlugin, HemisphericLight, LoadAssetContainerAsync, Mesh, Scene, ShadowGenerator, Vector3 } from '@babylonjs/core'
import { MmdModel, MmdPhysics, MmdRuntime, MmdStandardMaterialBuilder, SdefInjector } from 'babylon-mmd'
import { AkiraButton } from './Elements/AkiraButton'
import { ArrowsAltOutlined, EyeInvisibleOutlined, EyeOutlined, MutedOutlined, PauseOutlined, PlayCircleOutlined, QuestionOutlined, SettingFilled, SkinOutlined, SoundOutlined, TableOutlined, VideoCameraFilled } from '@ant-design/icons'

import { AkiraDrawer } from "./Elements/AkiraDrawer";
import { FilesetResolver, HolisticLandmarker } from "@mediapipe/tasks-vision";
import { SkeletonShow } from "./logic/Skeleton";
import { KeyFrameType, MotionModel, MotionSettingsType, SETTINGS_CONFIGType } from './logic/MotionModel'
import AkiraRadioButton from './Elements/AkiraRadioButton'
import { IsUUID } from './logic/extentions'
import { useSavedModel } from './hooks/useSavedModel'
import { Button, GetRef, InputNumber, Tour } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MaterialsDrawer } from './Elements/ControlModelAnimation/MaterialsDrawer'
import { AnimationControlUi } from './Elements/ControlModelAnimation/AnimationControlUi'
import { getSteps } from './logic/helperTour'
import { Holistic } from '@mediapipe/holistic'



export default function ScenePage() {

    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams()
    const sceneId = searchParams.get('sceneId')
    const scenes = useScenes((state) => state.scenes);
    const [scene, setScene] = useState<ScenesType>();
    const [DrawerStates, setOpen] = useState<{
        VideoDrawerOpened: boolean,
        SettingsDrawerOpened: boolean,
        SkeletonModelOpened: boolean,
    }>({
        VideoDrawerOpened: false,
        SettingsDrawerOpened: false,
        SkeletonModelOpened: false
    });
    const { GetModelData } = useSavedModel((state) => state);
    function OpenDrawer(selected: keyof typeof DrawerStates, value: boolean) {
        const newState: typeof DrawerStates = {
            ...DrawerStates,
        }
        newState[selected] = value;
        setOpen(newState)

    }
    //video
    const VideoCurrentRef = useRef<HTMLVideoElement>(null)
    const SkeletonCanvasRef = useRef<HTMLCanvasElement>(null);
    type videoState = {
        isPlaying: boolean,
        SkeletonPlaced: boolean,
        SoundEnabled: boolean
    }
    const [VideoState, SetVideoState] = useState<videoState>({
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
    const [MotionCap, SetMotionCap] = useState(new MotionModel())
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
        return FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        ).then(async vision => {
            const holisticLandmarker = await HolisticLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task",
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
            })

            HolisticRef.current = holisticLandmarker;
        })
    }
    const runAnimation = async () => {
        if (!SelectedOld && HolisticRef.current && VideoCurrentRef.current && !VideoCurrentRef.current.paused && VideoCurrentRef.current.readyState >= 2) {
            var timestamp = performance.now()
            HolisticRef.current!.detectForVideo(VideoCurrentRef.current, timestamp, (res) => {
                if (VideoState.SkeletonPlaced) {
                    SkeletonShow.onShowSkeleton(SkeletonCanvasRef, res)
                }
                if (MMDStates.MMDRuntime && MMDStates.MMDModel) {
                    MotionCap.motionCalculate(res)
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
        loadHolistic();
    }, [])

    useEffect(() => {
        if (HolisticRef.current && HolisticOldRef.current) {
            console.log("Holistic loaded");
            HolisticOldRef.current.initialize().then(() => {
                HolisticOldRef.current.onResults((results) => {
                    if (VideoState.SkeletonPlaced) {
                        SkeletonShow.onOldShowSkeleton(SkeletonCanvasRef, results)
                    }
                    MotionCap.motionOldCalculate(results as any, VideoCurrentRef.current)
                    SetKeyFrames(MotionCap.keyframes)
                });
                SetHolisticLoaded(true)
            })

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
        MMDShadowManager?: ShadowGenerator
    }>({})
    //Tutor Refs 
    const [OpenTutor, SetOpenTutor] = useState(false)
    const button1Ref = useRef<GetRef<any>>(null)
    const button2Ref = useRef<GetRef<any>>(null)
    const button3Ref = useRef<GetRef<any>>(null)
    const button56Ref = useRef<GetRef<any>>(null)
    const button5Ref = useRef<GetRef<any>>(null)
    //Controls
    const [animationControlDrawer, setAnimationControlDrawer] = useState(false);
    const [materialsDrawer, setmaterialsDrawer] = useState(false);
    const Materials = useMemo(() => MMDStates.MMDModel?.mesh.metadata.meshes || [], [MMDStates.MMDModel])
    const [MaterialBuilder, _] = useState(new MmdStandardMaterialBuilder())
    const convRef = useRef<HTMLCanvasElement>(null)

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
                rootUrl: IsUUID(modelName) ? undefined : `${window.location.origin}/assets/models/`,
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
        mmdscene.enablePhysics(new Vector3(0, -9.8 * 10, 0), new HavokPlugin(true, window.havokPlugin))

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
        const mmdRuntime = new MmdRuntime(mmdscene, new MmdPhysics(mmdscene));
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
            Promise.all([loadModel(engine, mmdscene, scene.modelPathOrLink, mmdRuntime, shadowGenerator)]).then(([res]) => {
                SetMMDStates({
                    MMDRuntime: mmdRuntime,
                    MMDScene: mmdscene,
                    MMDEngine: engine,
                    MMDModel: mmdRuntime.createMmdModel(res.Model),
                    MMDAssetContainer: res.AssetContainer,
                    MMDShadowManager: shadowGenerator
                })
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

    return (<div className="relative overflow-y-hidden">
        <canvas ref={convRef} style={{ width: "100%", height: "100vh" }} className="" />
        {/* Controls */}
        <div className="absolute m-2 font-bold text-xl flex gap-x-2 right-0 top-0">
            <AkiraButton ref={button1Ref} onClick={() => convRef.current?.requestFullscreen()}>
                <ArrowsAltOutlined />
            </AkiraButton>
            <AkiraButton ref={button2Ref} onClick={() => OpenDrawer("VideoDrawerOpened", true)}>
                <VideoCameraFilled />
            </AkiraButton>
            <AkiraButton ref={button3Ref} onClick={() => OpenDrawer("SettingsDrawerOpened", true)}>
                <SettingFilled />
            </AkiraButton>
            <AkiraButton onClick={() => {
                SetOpenTutor(true)
            }}>
                <QuestionOutlined />
            </AkiraButton>
        </div>

        <div className="absolute m-2 font-bold text-xl flex gap-x-2 right-0 bottom-0">
            <AkiraButton ref={button56Ref} onClick={() => { setmaterialsDrawer(!materialsDrawer) }}>
                <SkinOutlined />
            </AkiraButton>
            <AkiraButton ref={button5Ref} onClick={() => { setAnimationControlDrawer(!animationControlDrawer) }}>
                <TableOutlined />
            </AkiraButton>
        </div>
        <AkiraDrawer removeBlurButton closable title="Settings" open={DrawerStates.SettingsDrawerOpened} onClose={() => { OpenDrawer("SettingsDrawerOpened", false) }} >
            <p className='text-ForegroundColor text-lg text-center font-bold'>{t("scenePage.MotionCaptureSettings.title")}</p>
            <div className='flex justify-around mb-3'>

                <div className='flex flex-col text-base gap-y-3 text-ForegroundColor'>
                    <p>{t("scenePage.MotionCaptureSettings.settingTitle")}</p>
                    <p>{t("scenePage.MotionCaptureSettings.settingTitle2")}</p>
                    <p>{t("scenePage.MotionCaptureSettings.settingTitle3")}</p>
                    <p>{t("scenePage.MotionCaptureSettings.settingTitle4")}</p>
                    <p>{t("scenePage.MotionCaptureSettings.settingTitle5")}</p>
                    <p>{t("scenePage.MotionCaptureSettings.settingTitle6")}</p>
                </div>
                <div className='flex gap-y-3 flex-col justify-center items-center'>
                    {Object.keys(MotionCaptureSettings).map((el, ind) => <AkiraRadioButton
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
                    />)}
                    <AkiraRadioButton
                        checked={SelectedOld}
                        onChange={() => {
                            SetSelectedOld(!SelectedOld)
                        }}
                    />
                </div>
            </div>
            <p className='text-ForegroundColor text-lg text-center font-bold'>{t("scenePage.VariableSettings.title")}</p>
            <div className='flex justify-around mb-3'>

                <div className='flex flex-col text-base gap-y-3 text-ForegroundColor'>
                    <p>{t("scenePage.VariableSettings.settingTitle")}</p>
                </div>
                <div className='flex gap-y-3 flex-col justify-center items-center'>
                    <InputNumber type="number" controls onChange={(value) => {
                        if (value) {
                            SetSETTINGS_CONFIG({
                                ...SETTINGS_CONFIG,
                                POSE_Y_SCALE: value
                            })
                        }
                    }} value={SETTINGS_CONFIG.POSE_Y_SCALE} />
                </div>
            </div>
        </AkiraDrawer>
        {/* Motion Video */}
        <AkiraDrawer removeBlurButton closable title={t("scenePage.ModalTitle")} open={DrawerStates.VideoDrawerOpened} onClose={() => { OpenDrawer("VideoDrawerOpened", false) }} loading={!OnHolisticLoaded}>
            <AkiraButton className="w-full p-0">
                <div className="w-full">
                    <label htmlFor="file" className='cursor-pointer text-white flex justify-center items-center h-[25px] w-full'>{t("scenePage.FileUpload")}</label>
                    <input id="file" type="file" className="hidden" accept="video/*" onChange={async (event) => {
                        const file = event.target.files![0]
                        const url = URL.createObjectURL(file);
                        VideoCurrentRef.current!.src = url;
                        requestAnimationFrame(runAnimation)
                    }} />
                </div>
            </AkiraButton>
            <div className='flex m-1 justify-center'>
                <div className="w-fit relative">
                    {/* `${window.location.origin}/assets/models/` */}
                    <video onPlay={() => {
                        requestAnimationFrame(runAnimation)
                    }} onPause={() => MotionCap.endRecordMp4()} muted={VideoState.SoundEnabled} ref={VideoCurrentRef} controls={false} className="rounded-md max-h-[400px] w-full min-h-[200px]" />
                    <canvas ref={SkeletonCanvasRef} className={`${VideoState.SkeletonPlaced ? "absolute" : "hidden"} top-0 h-full w-full`} />
                </div>
            </div>
            <div className="flex justify-around text-[20px]">
                <button id="isPlaying" className="p-2 font-bold cursor-pointer hover:bg-BackgroundHoverButton flex duration-700 justify-center items-center aspect-square rounded bg-BackgroundButton text-white" onClick={onClicked}>
                    {VideoState.isPlaying ? <PlayCircleOutlined /> : <PauseOutlined />}
                </button>
                <button id="SkeletonPlaced" className="p-2 font-bold cursor-pointer  hover:bg-BackgroundHoverButton duration-700 flex justify-center items-center aspect-square rounded bg-BackgroundButton text-white" onClick={onClicked}>
                    {VideoState.SkeletonPlaced ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
                <button id="SoundEnabled" className="p-2 font-bold cursor-pointer  hover:bg-BackgroundHoverButton duration-700 flex justify-center items-center aspect-square rounded bg-BackgroundButton text-white" onClick={onClicked}>
                    {!VideoState.SoundEnabled ? <SoundOutlined /> : <MutedOutlined />}
                </button>

            </div>
            <div className='mt-2 flex flex-col gap-y-2'>
                <AkiraButton className="w-full" onClick={() => {
                    if (VideoCurrentRef.current && VideoCurrentRef.current.src)
                        MotionCap.startRecordMp4(VideoCurrentRef.current)
                }}>
                    {t("scenePage.RecordVideo")}
                </AkiraButton>

            </div>

        </AkiraDrawer>
        <MaterialsDrawer

            title={t("scenePage.MaterialsControl.title")}
            open={materialsDrawer}

            materials={Materials}
            onClose={() => { setmaterialsDrawer(!materialsDrawer) }}
        />
        <AnimationControlUi
            title={t("scenePage.AnimationControl.title")}
            open={animationControlDrawer}
            placement="bottom"
            SetKeyFrames={SetKeyFrames}
            onClose={() => { setAnimationControlDrawer(!animationControlDrawer) }}
            KeyFrames={KeyFrames}
            MotionModelInstance={MotionCap}
        />
        {/* Bugged Antd */}
        <Tour open={OpenTutor} onClose={() => SetOpenTutor(false)} steps={getSteps(button1Ref.current, button3Ref.current, button2Ref.current, undefined, undefined)} />

    </div>)
} 