"use client"
import { Input, Modal, Select } from "antd"
import { useState, useEffect, useRef } from "react";
import { useScenes, ScenesType } from "../hooks/useScenes";

//babylon-mmd
import { AssetContainer, Color3, Color4, DirectionalLight, Engine, HavokPlugin, HemisphericLight, LoadAssetContainerAsync, Mesh, MeshBuilder, Scene, ShadowGenerator, Vector3 } from "@babylonjs/core";
import { MmdCamera, MmdMesh, MmdPhysics, MmdRuntime, VmdLoader } from "babylon-mmd";
import { useMMDModels } from '../hooks/useMMDModels';
import { AkiraButton } from './AkiraButton';
import { useSavedModel } from "../hooks/useSavedModel";
import { IsUUID } from "../logic/extentions";
import { useSearchParams } from 'react-router-dom';
import { DeleteFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { OllamaAIAssistant } from '../logic/LLM/ollama';

const modalStyles = {
    mask: {
        backdropFilter: 'blur(10px)',
    },
    header: {
        backgroundColor: "var(--menu-layout-bg) !important"
    },
    content: {
        backgroundColor: "var(--menu-layout-bg) !important"
    }
}


export default function SettingsModal({ opened, SetOpened }: { opened: boolean, SetOpened: () => void }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { i18n, t } = useTranslation()
    const [SubModalOpened, SetSubModalOpened] = useState(false)
    const sceneId = searchParams.get('sceneId')
    const { scenes, changeSceneModel, changeSceneSetting } = useScenes((state) => state);
    const { ModelPaths, AddModelPath, GetModelData, RemoveModelPath } = useSavedModel((state) => state);
    const [scene, setScene] = useState<ScenesType>();

    //babylon-mmd
    const conv = useRef<HTMLCanvasElement>(null);
    const models = useMMDModels()

    const [engine, setEng] = useState<Engine>();
    const [MMDScene, setMMDScene] = useState<Scene>();
    const [mmdRuntime, setmmdRuntime] = useState<MmdRuntime>();
    const [mmdShadowGenerator, setShadowGenerator] = useState<ShadowGenerator>();
    const [MMDAssetContainer, SetMMDAssetContainer] = useState<AssetContainer>()

    // Ollama host
    const [ollamaHost, setOllamaHost] = useState(() => localStorage.getItem('ollamaHost') || 'http://localhost:11434');
    const ollamaAssistantRef = useRef<OllamaAIAssistant>(new OllamaAIAssistant(ollamaHost));
    // Ollama models
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [ollamaModelLoading, setOllamaModelLoading] = useState(false);
    const [ollamaModelError, setOllamaModelError] = useState<string | null>(null);
    const [selectedOllamaModel, setSelectedOllamaModel] = useState(() => localStorage.getItem('ollamaModel') || '');

    //load mmd model
    const loadMMDModel = async (path?: string, shadowGenerator?: ShadowGenerator) => {
        if (MMDAssetContainer) {

            MMDAssetContainer.removeAllFromScene();
            if (MMDAssetContainer.meshes[0]) {

                for (const mesh of MMDAssetContainer.meshes[0].metadata.meshes) mesh.receiveShadows = false;
                shadowGenerator?.removeShadowCaster(MMDAssetContainer.meshes[0]);
            }

        }
        if (MMDScene) {
            let modelUrl: string;
            if (path && IsUUID(path)) {
                const modelData = await GetModelData(path);
                if (!modelData) throw new Error("Model data not found");
                const blob = new Blob([modelData], { type: "application/octet-stream" });
                modelUrl = URL.createObjectURL(blob);
            } else {
                modelUrl = path ?? "Ganyubikini.bpmx";
            }
            const mmdMesh = await LoadAssetContainerAsync(modelUrl, MMDScene, {
                rootUrl: modelUrl.startsWith("blob:") ? undefined : `${window.location.origin}/assets/models/`,
                pluginExtension: modelUrl.startsWith("blob:") ? ".bpmx" : undefined
            })
                .then((result) => {
                    SetMMDAssetContainer(result);
                    result.addAllToScene();
                    console.log("Load model");
                    return result.meshes[0] as MmdMesh;

                });
            for (const mesh of mmdMesh.metadata.meshes) mesh.receiveShadows = true;
            if (shadowGenerator) shadowGenerator.addShadowCaster(mmdMesh);
        }
    }
    //load animation
    //future function [load custom animation]
    const loadAnimation = async (vmdLoader: VmdLoader, container: AssetContainer, mmdRuntime: MmdRuntime) => {
        const modelMotion = await vmdLoader.loadAsync("model_motion_1", [
            "../assets/animation/Way Back Home Motion.vmd"
        ]);
        var model = mmdRuntime.createMmdModel(container.meshes[0] as Mesh);
        model.addAnimation(modelMotion);
        model.setAnimation("model_motion_1");
        mmdRuntime.playAnimation()
    }

    useEffect(() => {
        if (mmdRuntime && MMDAssetContainer && MMDScene) {
            const vmdLoader = new VmdLoader(MMDScene);
            loadAnimation(vmdLoader, MMDAssetContainer, mmdRuntime);
        }
    }, [MMDAssetContainer])
    useEffect(() => {
        setScene(scenes.find((el) => el.id == sceneId))
    })
    useEffect(() => {

        if (SubModalOpened) {
            const engine = new Engine(conv.current!, true);
            const scene = new Scene(engine);
            scene.ambientColor = new Color3(0.5, 0.5, 0.5);
            scene.clearColor = new Color4(0.95, 0.95, 0.95, 1.0);
            scene.enablePhysics(new Vector3(0, -9.8 * 10, 0), new HavokPlugin(true, window.havokPlugin))

            const camera = new MmdCamera("mmdCamera", new Vector3(0, 10, 0), scene);
            const mmdRuntime = new MmdRuntime(scene, new MmdPhysics(scene));
            mmdRuntime.register(scene)

            const hemisphericLight = new HemisphericLight("HemisphericLight", new Vector3(0, 1, 0), scene);
            hemisphericLight.intensity = 0.3;
            hemisphericLight.specular.set(0, 0, 0);
            hemisphericLight.groundColor.set(1, 1, 1);

            const directionalLight = new DirectionalLight("DirectionalLight", new Vector3(0.5, -1, 1), scene);
            directionalLight.intensity = 0.7;
            directionalLight.shadowMaxZ = 20;
            directionalLight.shadowMinZ = -15;

            const shadowGenerator = new ShadowGenerator(2048, directionalLight, true, camera);
            shadowGenerator.transparencyShadow = true;
            shadowGenerator.bias = 0.01;


            const ground = MeshBuilder.CreateGround("ground1", { width: 60, height: 60, subdivisions: 2, updatable: false }, scene);
            ground.receiveShadows = true;

            shadowGenerator.addShadowCaster(ground);

            mmdRuntime.setCamera(camera);
            setMMDScene(scene);
            setEng(engine);
            setmmdRuntime(mmdRuntime);
            setShadowGenerator(shadowGenerator);
            engine.runRenderLoop(() => {
                scene.render()
            });
        } else {
            engine?.dispose();
            MMDScene?.dispose()
            MMDAssetContainer?.dispose()
            if (mmdRuntime && MMDScene) mmdRuntime.dispose(MMDScene);
            setEng(undefined);
            setMMDScene(undefined);
            setmmdRuntime(undefined);
            console.log("Disposed all")
        }
    }, [SubModalOpened])
    useEffect(() => {
        loadMMDModel(scene?.modelPathOrLink)
    }, [MMDScene])
    useEffect(() => {
        ollamaAssistantRef.current.setOllamaHost(ollamaHost);
        localStorage.setItem('ollamaHost', ollamaHost);
    }, [ollamaHost]);

    useEffect(() => {
        setOllamaModelLoading(true);
        setOllamaModelError(null);
        ollamaAssistantRef.current.getLocalModels()
            .then(data => {
                // data.models: [{name: string, ...}]
                const models = (data.models || data.tags || []).map((m: any) => m.name || m.model || m);
                setOllamaModels(models);
                // Если нет выбранной модели, выбрать первую
                if (!selectedOllamaModel && models.length > 0) {
                    setSelectedOllamaModel(models[0]);
                    localStorage.setItem('ollamaModel', models[0]);
                }
            })
            .catch(e => setOllamaModelError(e.message))
            .finally(() => setOllamaModelLoading(false));
    }, [ollamaHost]);

    const handleOllamaModelChange = (value: string) => {
        setSelectedOllamaModel(value);
        localStorage.setItem('ollamaModel', value);
    };

    const SaveSettings = () => {
        SetOpened();
    }
    const [languageOptions, setLanguageOptions] = useState<{label: string, value: string}[]>([]);
    const [baseModels, setBaseModels] = useState<any[]>([]);
    const [userModels, setUserModels] = useState<any[]>([]);

    useEffect(() => {
      async function loadLangs() {
        let langLabels: Record<string, string> = {};
        try {
          const resp = await fetch('../assets/locales/langLabels.json');
          langLabels = await resp.json();
        } catch {}
        if (window.electronAPI && window.electronAPI.getLocales) {
          window.electronAPI.getLocales().then((langs: string[]) => {
            setLanguageOptions(langs.map((code: string) => ({ label: langLabels[code] || code, value: code })));
          });
        }
      }
      loadLangs();
    }, []);

    useEffect(() => {
      if (window.electronAPI && window.electronAPI.getModels) {
        window.electronAPI.getModels().then(({ base, user }) => {
          setBaseModels(base);
          setUserModels(user);
        });
      }
    }, []);

    return (<>

        <Modal onCancel={SetOpened} title={<div className="bg-transparent">
            <p className="text-ForegroundColor">{t("settingsModal.title")}</p>
        </div>} footer={
            <div className="flex gap-x-5">
                <AkiraButton fillWidth onClick={() => SetOpened()}>{t("settingsModal.buttons.cancelButton")}</AkiraButton>
                <AkiraButton fillWidth onClick={() => SaveSettings()}>{t("settingsModal.buttons.submitButton")}</AkiraButton>
            </div>
        } open={opened} styles={modalStyles}>
            <div className="my-2">
                <div className="flex justify-end items-center gap-x-3">
                    <p className="text-ForegroundColor">{t("settingsModal.titleLang")}</p>
                    <Select onChange={(value) => {
                        i18n.changeLanguage(value)
                    }} value={i18n.resolvedLanguage} className="w-52" >
                        {languageOptions.map(opt => <Select.Option key={opt.value}>{opt.label}</Select.Option>)}
                    </Select>

                </div>
            </div>
            <div className="my-2">
                <div className="flex justify-end items-center gap-x-3">
                    <p className="text-ForegroundColor">Ollama Host</p>
                    <Input
                        value={ollamaHost}
                        onChange={e => setOllamaHost(e.target.value)}
                        className="w-52"
                        placeholder="http://localhost:11434"
                    />
                </div>
            </div>
            <div className="my-2">
                <div className="flex justify-end items-center gap-x-3">
                    <p className="text-ForegroundColor">Ollama Model</p>
                    <Select
                        loading={ollamaModelLoading}
                        value={selectedOllamaModel}
                        onChange={handleOllamaModelChange}
                        className="w-52"
                        placeholder={ollamaModelLoading ? 'Loading...' : 'Select model'}
                        disabled={ollamaModelLoading || !!ollamaModelError || ollamaModels.length === 0}
                    >
                        {ollamaModels.map(model => (
                            <Select.Option key={model} value={model}>{model}</Select.Option>
                        ))}
                    </Select>
                    {ollamaModelError && <span className="text-red-500">{ollamaModelError}</span>}
                </div>
            </div>
            {scene && <div className="flex flex-col gap-y-2">
                <div className="flex justify-end items-center gap-x-3">
                    <p className="text-ForegroundColor">{t("settingsModal.titleSelectModel")}</p>
                    <Input value={scene.modelName} style={{ maxWidth: "300px" }} readOnly />

                </div>
                <div className="flex justify-end items-center gap-x-3">
                    <p className="text-ForegroundColor">{t("settingsModal.titleSceneName")}</p>
                    <Input value={scene.sceneName} style={{ maxWidth: "300px" }} onChange={(ev) => {
                        changeSceneSetting(scene.id, "sceneName", ev.target.value)
                    }} />

                </div>
                <AkiraButton className="w-full" onClick={() => SetSubModalOpened(true)}>{t("settingsModal.buttons.selectModel")}</AkiraButton>
            </div>}

        </Modal>
        <Modal title={<div className="bg-transparent">
            <p className="text-ForegroundColor">{t("settingsModal.titleSelectModel")}</p>
        </div>} open={SubModalOpened} styles={modalStyles} onCancel={() => SetSubModalOpened(false)} footer={
            <div className="flex gap-x-5">

                <AkiraButton fillWidth onClick={() => SetSubModalOpened(false)}>{t("settingsModal.buttons.cancelButton")}</AkiraButton>
                <AkiraButton disabled fillWidth onClick={() => {

                }}>{t("settingsModal.buttons.submitButton")}</AkiraButton>
            </div>
        }>
            <div className="flex gap-x-4 h-[500px]">
                <div className="basis-1/2">
                    <input type="file" id="modelUpload" accept=".bpmx" className="hidden" onChange={async (event) => {
                        var file = event.target.files![0];
                        AddModelPath(file);
                    }} />
                    <label htmlFor="modelUpload" className={`block text-center cursor-pointer bg-BackgroundButton w-full my-2 hover:bg-BackgroundHoverButton text-ForegroundButton rounded-md duration-700 p-2 font-bold`}>
                        {t("settingsModal.buttons.addModel")}
                    </label>
                    <div className="overflow-y-auto max-h-[400px]">
                        {baseModels.length > 0 && <div className="font-bold text-xs text-gray-400 px-2 py-1">Базовые модели</div>}
                        {baseModels.map((model, ind) => (
                            <div onClick={() => {
                                if (sceneId) {
                                    changeSceneModel(sceneId, model)
                                    loadMMDModel(model, mmdShadowGenerator)
                                }
                            }} key={"base-"+ind} className="bg-BackgroundButton font-bold duration-700 hover:bg-BackgroundHoverButton cursor-pointer text-ForegroundButton p-3">
                                <p>{model}</p>
                            </div>
                        ))}
                        {userModels.length > 0 && <div className="font-bold text-xs text-gray-400 px-2 py-1">Пользовательские модели</div>}
                        {userModels.map((model, ind) => (
                            <div onClick={() => {
                                if (sceneId) {
                                    changeSceneModel(sceneId, model)
                                    loadMMDModel(model, mmdShadowGenerator)
                                }
                            }} key={"user-"+ind} className="bg-BackgroundButton font-bold duration-700 hover:bg-BackgroundHoverButton cursor-pointer text-ForegroundButton p-3">
                                <p>{model}</p>
                            </div>
                        ))}
                        {ModelPaths.map((el, ind) => <div onClick={async () => {
                            if (sceneId) {
                                const data = await GetModelData(el.id);

                                if (data && MMDScene) {
                                    const blob = new Blob([data]);
                                    const url = URL.createObjectURL(blob);
                                    changeSceneModel(sceneId, el.id, el.fileName)
                                    loadMMDModel(url, mmdShadowGenerator)
                                }

                            }
                        }} key={ind} className="bg-BackgroundButton flex justify-between font-bold duration-700 hover:bg-BackgroundHoverButton cursor-pointer text-ForegroundButton p-3">
                            <p>{el.fileName}</p>
                            <DeleteFilled className="hover:text-red-400 duration-500 " onClick={() => {
                                if (sceneId) {
                                    changeSceneModel(sceneId, "Black.bpmx")
                                    RemoveModelPath(el);
                                }
                            }
                            } />
                        </div>)}
                    </div>
                </div>
                <div className="basis-1/2 relative">
                    <canvas ref={conv} className="shadow-md rounded-md m-1" style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
        </Modal>
    </>)
}

