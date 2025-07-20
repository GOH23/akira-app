"use client"
import { FolderFilled, MoonFilled, SettingFilled, SunFilled, ThunderboltFilled, PlusOutlined, GlobalOutlined, DeleteOutlined, TranslationOutlined, MenuFoldOutlined, MenuUnfoldOutlined, MoreOutlined, UpOutlined, DownOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { ConfigProvider, Menu, notification, Button, Tooltip, Select, Space, Dropdown, Drawer, Input, Form } from "antd";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from 'framer-motion';
import { useNextJSToAntdTheme } from "../hooks/useCustomTheme";
import { ScenesType, useScenes } from "../hooks/useScenes";
import { useSearchParams, useNavigate } from 'react-router-dom';
import SettingsModal from "./SettingsModal";
import { AkiraModalDialog } from "./AkiraModalDialog";
import { AkiraButton } from "./AkiraButton";
import { v4 as uuid } from 'uuid';
import { useTranslation } from "react-i18next";
import i18n from '../i18n';
import { AkiraDrawer } from "./AkiraDrawer";

export default function HeaderLayout() {
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams()
    const sceneId = searchParams.get('sceneId')
    const { addScene, scenes, removeScene, changeSceneSetting } = useScenes((el) => el);
    const { Layout, MenuTheme } = useNextJSToAntdTheme(theme);
    const [SettingsOpened, SetSettingsOpened] = useState(false)
    const [ModalDeleteSceneOpened, SetModalDeleteSceneOpened] = useState(false);
    const [SelectedScene, SetSelectedScene] = useState<ScenesType>()
    const [hoveredScene, setHoveredScene] = useState<string | null>(null);

    const [isSceneSettingsOpen, setIsSceneSettingsOpen] = useState(false);
    const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    const [visibleScenes, setVisibleScenes] = useState<ScenesType[]>([]);
    const [hiddenScenes, setHiddenScenes] = useState<ScenesType[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);
    const [form] = Form.useForm();
    const [languageOptions, setLanguageOptions] = useState<{ label: string, value: string }[]>([]);
    const [GuideOpened, setGuideOpened] = useState(false);

    useEffect(() => {
        async function loadLangs() {
            let langLabels: Record<string, string> = {};
            try {
                console.log(process.cwd())
                const resp = await fetch('../assets/locales/langLabels.json');
                langLabels = await resp.json();
            } catch { }
            if (window.electronAPI && window.electronAPI.getLocales) {
                window.electronAPI.getLocales().then((langs: string[]) => {
                    setLanguageOptions(langs.map((code: string) => ({ label: langLabels[code] || code, value: code })));
                });
            }
        }
        loadLangs();
    }, []);

    // Add resize observer to handle adaptive scenes
    useEffect(() => {
        const updateVisibleScenes = () => {
            if (!menuRef.current) return;

            const containerWidth = menuRef.current.offsetWidth;
            const sceneItems = scenes;
            const tempVisible: ScenesType[] = [];
            const tempHidden: ScenesType[] = [];

            // Approximate width needed for each scene item (including padding and margins)
            const sceneItemWidth = 200; // Approximate width of each scene item
            const moreButtonWidth = 100; // Width for the "more" button

            let currentWidth = 0;

            sceneItems.forEach((scene) => {
                // Check if adding this scene would exceed container width
                if (currentWidth + sceneItemWidth <= containerWidth - moreButtonWidth) {
                    tempVisible.push(scene);
                    currentWidth += sceneItemWidth;
                } else {
                    tempHidden.push(scene);
                }
            });

            setVisibleScenes(tempVisible);
            setHiddenScenes(tempHidden);
        };

        const resizeObserver = new ResizeObserver(updateVisibleScenes);
        if (menuRef.current) {
            resizeObserver.observe(menuRef.current);
        }

        // Initial calculation
        updateVisibleScenes();

        return () => {
            resizeObserver.disconnect();
        };
    }, [scenes]);

    const [api, contextHolder] = notification.useNotification();

    // Получаем текущую сцену

    useEffect(() => {
        SetModalDeleteSceneOpened(!!SelectedScene);
    }, [SelectedScene]);


    const handleWebOpen = () => {
        window.open('https://akirammd.vercel.app/', '_blank');
    };

    const handleAddScene = () => {
        if (scenes.length <= 10) {
            addScene({
                sceneName: `Scene ${scenes.length + 1}`,
                id: uuid(),
                modelPathOrLink: "Black.bpmx",
                modelName: "Black.bpmx"
            });
            api.success({
                message: t("notifications.sceneAdded"),
                description: t("notifications.sceneAddedDesc"),
                placement: "bottomRight",
                className: "bg-MenuItemBg rounded-md !text-white"
            })
        } else {
            api.warning({
                message: t("notifications.maxScenesReached"),
                description: t("notifications.maxScenesReachedDesc"),
                placement: "bottomRight",
                className: "bg-MenuItemBg rounded-md !text-white"
            })
        }
    };

    const handleSceneSettings = (scene: ScenesType) => {
        SetSelectedScene(scene);
        form.setFieldsValue({
            sceneName: scene.sceneName,
            modelName: scene.modelName
        });
        setIsSceneSettingsOpen(true);
    };

    const handleSceneSettingsSave = async () => {
        try {
            const values = await form.validateFields();
            if (SelectedScene) {
                changeSceneSetting(SelectedScene.id, "sceneName", values.sceneName);
                changeSceneSetting(SelectedScene.id, "modelName", values.modelName);
                api.success({
                    message: t("notifications.settingsSaved"),
                    description: t("notifications.settingsSavedDesc"),
                    placement: "bottomRight",
                    className: "bg-MenuItemBg rounded-md !text-white"
                });
                setIsSceneSettingsOpen(false);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleDeleteScene = (sceneId: string) => {
        removeScene(sceneId);
        if (searchParams.get('sceneId') === sceneId) navigate("/");
    };

    const renderSceneItem = (scene: ScenesType) => (
        <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200 text-ForegroundHoverButton`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => setHoveredScene(scene.id)}
            onMouseLeave={() => setHoveredScene(null)}
            onClick={() => navigate(`/scenes?sceneId=${scene.id}`)}
        >
            <FolderFilled className={`transition-colors duration-200 text-ForegroundHoverButton`} />
            <span>{scene.sceneName}</span>

            <AnimatePresence>
                {hoveredScene === scene.id && (
                    <motion.div
                        className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-lg"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Button
                            type="text"
                            icon={<SettingFilled />}
                            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSceneSettings(scene);
                            }}
                        />
                        <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScene(scene.id);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    return (
        <ConfigProvider
            theme={{
                components: {
                    Layout: {
                        siderBg: Layout.bg,
                        triggerBg: Layout.triggerBg
                    },
                    Dropdown: {
                        colorBgElevated: MenuTheme.bg
                    },
                    Menu: {
                        colorBgContainer: MenuTheme.bg,
                        colorText: MenuTheme.fg,
                        itemSelectedBg: MenuTheme.itemSelectedBg,
                        itemSelectedColor: MenuTheme.fg,
                        colorBgElevated: MenuTheme.bg,
                        subMenuItemSelectedColor: MenuTheme.fg
                    },
                }
            }}
        >
            {contextHolder}

            <motion.header
                className="fixed top-0 left-0 right-0 z-50 bg-MenuItemBg border-b border-gray-800/50"
                initial={false}
                animate={{
                    y: isHeaderHidden ? -100 : 0,
                    height: isMenuCollapsed ? "64px" : "auto"
                }}
                transition={{ duration: 0.3 }}
            >
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo and Menu Toggle */}
                        <div className="flex items-center gap-4">
                            <motion.a
                                href="/main_window"
                                className="text-md md:text-lg lg:text-2xl font-bold text-ForegroundColor flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >

                                Akira {t("header.appTitle")}
                            </motion.a>
                        </div>

                        {/* Scenes Menu */}
                        <AnimatePresence>
                            {!isMenuCollapsed && (
                                <motion.div
                                    ref={menuRef}
                                    className="flex-1 flex items-center justify-center space-x-4 mx-8 overflow-hidden"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {visibleScenes.map((scene) => renderSceneItem(scene))}

                                    {hiddenScenes.length > 0 && (
                                        <Dropdown
                                            menu={{
                                                items: hiddenScenes.map(scene => ({
                                                    key: scene.id,
                                                    label: (
                                                        <div className="flex items-center gap-2">
                                                            <FolderFilled className={sceneId === scene.id ? 'text-purple-400' : 'text-ForegroundHoverButton'} />
                                                            <span className={sceneId === scene.id ? 'text-purple-400' : 'text-ForegroundHoverButton'}>
                                                                {scene.sceneName}
                                                            </span>

                                                            <motion.div
                                                                className="flex items-center ml-auto gap-2 bg-gray-900/90 rounded-lg"
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -10 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <button
                                                                    type="button"

                                                                    className="text-blue-400 hover:text-blue-400 transition-colors duration-200"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSceneSettings(scene);
                                                                    }}
                                                                ><SettingFilled /></button>
                                                                <button
                                                                    type="button"

                                                                    className="text-red-400 hover:text-red-300 transition-colors duration-200"


                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteScene(scene.id);
                                                                    }}
                                                                ><DeleteOutlined /></button>
                                                            </motion.div>
                                                        </div>
                                                    ),
                                                    onClick: () => navigate(`/scenes?sceneId=${scene.id}`)
                                                }))
                                            }}
                                            placement="bottom"
                                        >
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex items-center gap-2 px-4 py-2 font-bold rounded-lg cursor-pointer hover:bg-gray-800/50 text-ForegroundHoverButton hover:text-ForegroundHoverButton transition-colors duration-200"
                                            >
                                                <MoreOutlined className="text-2xl" />
                                                <span>{hiddenScenes.length}</span>
                                            </motion.div>
                                        </Dropdown>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Right Side Actions */}
                        <motion.div
                            className="flex items-center gap-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    icon={<PlusOutlined />}
                                    onClick={handleAddScene}
                                    className="bg-BackgroundButton text-ForegroundButton hover:bg-BackgroundHoverButton border border-ForegroundHoverButton hover:text-ForegroundHoverButton transition-colors duration-200"
                                >
                                    {t("header.button.addScene")}
                                </Button>
                            </motion.div>

                            {/* <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    icon={<GlobalOutlined />}
                                    onClick={handleWebOpen}
                                    className="bg-BackgroundButton text-ForegroundButton hover:bg-BackgroundHoverButton border border-ForegroundHoverButton hover:text-ForegroundHoverButton transition-colors duration-200"
                                >
                                    {t("header.button.webOpen")}
                                </Button>
                            </motion.div> */}

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    type="text"
                                    icon={
                                        <AnimatePresence mode="wait">
                                            {theme === "light" ? (
                                                <motion.div key="sun" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }}>
                                                    <SunFilled className="text-yellow-400" />
                                                </motion.div>
                                            ) : theme === "dark" ? (
                                                <motion.div key="moon" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }}>
                                                    <MoonFilled className="text-blue-400" />
                                                </motion.div>
                                            ) : (
                                                <motion.div key="thunder" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }}>
                                                    <ThunderboltFilled className="text-purple-400" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    }
                                    onClick={() => setTheme(theme === "dark" ? "purple" : theme === "purple" ? "light" : "dark")}
                                    className="text-gray-300 text-xl hover:text-white hover:bg-gray-800/50 transition-colors duration-200 rounded-full"
                                />
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Dropdown
                                    menu={{
                                        items: languageOptions.map(lang => ({
                                            key: lang.value,
                                            label: <div className="text-ForegroundHoverButton">
                                                {lang.label}
                                            </div>,

                                            onClick: () => i18n.changeLanguage(lang.value)
                                        }))
                                    }}
                                    placement="bottomRight"
                                >
                                    <button
                                        type="button"
                                        className="text-xl text-ForegroundHoverButton hover:bg-gray-800/50 transition-colors duration-200 rounded-full"
                                    ><TranslationOutlined /></button>
                                </Dropdown>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <button
                                    onClick={() => SetSettingsOpened(true)}
                                    className="text-xl text-ForegroundHoverButton transition-colors duration-200 rounded-full"
                                ><SettingFilled /></button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <button
                                    onClick={() => setIsHeaderHidden(!isHeaderHidden)}
                                    className=" text-xl hover:text-white text-ForegroundHoverButton  hover:bg-gray-800/50 transition-colors duration-200 rounded-full"
                                >{isHeaderHidden ? <DownOutlined /> : <UpOutlined />}</button>
                            </motion.div>

                        </motion.div>
                    </div>
                </div>
            </motion.header>

            {/* Show Header Button */}
            <AnimatePresence>
                {isHeaderHidden && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-50"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsHeaderHidden(false)}
                            className="bg-MenuItemBg/80 backdrop-blur-sm border border-ForegroundHoverButton p-2 rounded-full aspect-square text-ForegroundHoverButton transition-colors duration-200"
                        >
                            <DownOutlined className="size-[20px]" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scene Settings Drawer */}
            <AkiraDrawer
                title={t("settingsModal.title")}
                placement="right"
                onClose={() => setIsSceneSettingsOpen(false)}
                open={isSceneSettingsOpen}
                width={400}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        sceneName: SelectedScene?.sceneName,
                        modelName: SelectedScene?.modelName
                    }}
                >
                    <Form.Item
                        name="sceneName"

                        label={<div className="text-ForegroundHoverButton">
                            {t("settingsModal.titleSceneName")}
                        </div>}
                        rules={[{ required: true, message: t("validation.sceneNameRequired") }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="modelName"
                        label={<div className="text-ForegroundHoverButton">
                            {t("settingsModal.titleSelectModel")}
                        </div>}
                        rules={[{ required: true, message: t("validation.modelRequired") }]}
                    >
                        <Select
                            showSearch
                            placeholder={t("settingsModal.buttons.selectModel")}
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={[
                                { value: 'Black.bpmx', label: 'Black.bpmx' },
                                { value: 'White.bpmx', label: 'White.bpmx' }
                            ]}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            onClick={handleSceneSettingsSave}
                            className="w-full bg-purple-600 hover:bg-purple-500 transition-colors duration-200"
                        >
                            {t("settingsModal.buttons.submitButton")}
                        </Button>
                    </Form.Item>
                </Form>
            </AkiraDrawer>

            <SettingsModal
                opened={SettingsOpened}
                SetOpened={() => SetSettingsOpened(!SettingsOpened)}
            />
            <AkiraModalDialog
                open={GuideOpened}
                onCancel={() => setGuideOpened(false)}
                title={t('guide.title')}
                footer={null}
            >
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <h3>{t('guide.howToUseTitle')}</h3>
                    <ol>
                        <li>{t('guide.howToUseStep1')}</li>
                        <li>{t('guide.howToUseStep2')}</li>
                        <li>{t('guide.howToUseStep3')}</li>
                        <li>{t('guide.howToUseStep4')}</li>
                        <li>{t('guide.howToUseStep5')}</li>
                    </ol>
                    <p><b>{t('guide.note')}</b> {t('guide.noteText')}</p>
                    <h3 className="mt-4">{t('guide.ollamaTitle')}</h3>
                    <ol>
                        <li>
                            <span dangerouslySetInnerHTML={{ __html: t('guide.ollamaStep1').replace('https://ollama.com/download', '<a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer">https://ollama.com/download</a>') }} />
                        </li>
                        <li>{t('guide.ollamaStep2')}</li>
                        <li>
                            <span dangerouslySetInnerHTML={{ __html: t('guide.ollamaStep3').replace('Ollama Library', '<a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer">Ollama Library</a>') }} />
                        </li>
                        <li>{t('guide.ollamaStep4')}</li>
                        <li>{t('guide.ollamaStep5')}</li>
                    </ol>
                    <h4 className="mt-4">{t('guide.troubleshootingTitle')}</h4>
                    <ul>
                        <li>{t('guide.troubleshooting1')}<ul>
                            <li>{t('guide.troubleshooting2')}</li>
                            <li>{t('guide.troubleshooting3')}</li>
                            <li>{t('guide.troubleshooting4')}</li>
                        </ul></li>
                    </ul>
                    <p>
                        <span dangerouslySetInnerHTML={{ __html: t('guide.moreHelp').replace('Ollama documentation', '<a href="https://ollama.com/docs" target="_blank" rel="noopener noreferrer">Ollama documentation</a>') }} />
                    </p>
                </div>
            </AkiraModalDialog>
        </ConfigProvider>
    );
}
