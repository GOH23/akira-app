"use client"
import { FolderFilled, MoonFilled, SettingFilled, SunFilled, ThunderboltFilled } from "@ant-design/icons";
import { ConfigProvider, Menu, notification } from "antd";
import Sider from "antd/es/layout/Sider";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from 'framer-motion'
import { useNextJSToAntdTheme } from "../hooks/useCustomTheme";
import { ScenesType, useScenes } from "../hooks/useScenes";
import { useSearchParams, useNavigate } from 'react-router-dom';
import SettingsModal from "./SettingsModal";
import { AkiraModalDialog } from "./AkiraModalDialog";
import { AkiraButton } from "./AkiraButton";
import { v4 as uuid } from 'uuid';
import { useTranslation } from "react-i18next";

export default function HeaderLayout() {
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams()
    const sceneId = searchParams.get('sceneId')
    const { addScene, scenes, removeScene } = useScenes((el) => el);
    const { Layout, MenuTheme } = useNextJSToAntdTheme(theme);
    const [SettingsOpened, SetSettingsOpened] = useState(false)
    const [collapsed, setCollapsed] = useState(false);
    const [ModalDeleteSceneOpened, SetModalDeleteSceneOpened] = useState(false);
    const [SelectedScene, SetSelectedScene] = useState<ScenesType>()

    const [api, contextHolder] = notification.useNotification({

    });
    useEffect(() => {
        if (SelectedScene) SetModalDeleteSceneOpened(!ModalDeleteSceneOpened);
    }, [SelectedScene])
    const handleWebOpen = () => {
        window.open('https://akirammd.vercel.app/', '_blank');
    };


    return <ConfigProvider
        theme={{
            components: {
                Layout: {
                    siderBg: Layout.bg,
                    triggerBg: MenuTheme.itemSelectedBg
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
        <Sider collapsible collapsed={collapsed} className="z-[100] overflow-y-hidden" onCollapse={(value) => {
            setCollapsed(value);
        }}>
            {contextHolder}
            <div className={!collapsed ? "flex items-center px-1 h-10 w-full" : "flex justify-center items-center  my-2 h-10 w-full"}>
                <a href="/main_window" className={`text-center font-bold text-lg text-ForegroundColor`}>
                    Akira {t("header.appTitle")}
                </a>

                {!collapsed && <button className="ml-auto text-2xl text-ForegroundColor" onClick={() => { setTheme(theme == "dark" ? "purple" : theme == "purple" ? "light" : "dark") }}>
                    <AnimatePresence >
                        {theme == "light" ? <SunFilled /> : theme == "dark" ? <MoonFilled /> : <ThunderboltFilled />}
                    </AnimatePresence>
                </button>}

            </div>
            {!collapsed && <div className="m-1 flex flex-col gap-y-1">
                <AkiraButton onClick={() => {
                    if (scenes.length <= 10) {
                        addScene({
                            sceneName: `Scene ${scenes.length + 1}`,
                            id: uuid(),
                            modelPathOrLink: "Black.bpmx",
                            modelName: "Black.bpmx"
                        });
                        api.success({
                            message: "Added scene",
                            pauseOnHover: true,
                            className: "bg-MenuItemBg rounded-md !text-white"
                        })
                    }

                }}>{t("header.button.addScene")}</AkiraButton>
                <AkiraButton onClick={handleWebOpen}>
                    {t("header.button.webOpen")}
                </AkiraButton>
            </div>}

            <Menu
                defaultSelectedKeys={[sceneId ?? ""]}
                onClick={(el) => {
                    if (el.key == "settings") {
                        SetSettingsOpened(!SettingsOpened)
                    } else {
                        navigate(`/scenes?sceneId=${el.key}`)
                    }

                }}
                style={{ height: '100%', borderRight: 0 }} mode="inline" items={[
                    {
                        key: 'g1',
                        label: t("header.menu1"),
                        icon: <FolderFilled />,
                        children: scenes.map((el) => {
                            return {
                                label: el.sceneName,
                                key: el.id,
                            }
                        }),
                    },
                    {
                        key: 'settings',
                        label: t("header.menu2"),
                        icon: <SettingFilled />
                    },
                    // {
                    //     key: "explore",
                    //     label: "Explore",
                    //     disabled: true,
                    //     icon: <CloudOutlined />
                    // }
                ]} />

        </Sider>
        <AkiraModalDialog title={<div>
            <p className="text-ForegroundColor">{t("header.button.deleteScene")}</p>
        </div>} okText="Delete" cancelText="Cancel" okType="danger" open={ModalDeleteSceneOpened}
            onOk={() => {
                if (SelectedScene?.id) {
                    removeScene(SelectedScene.id)
                    if (sceneId == SelectedScene.id) navigate("/")
                }
                SetModalDeleteSceneOpened(false);
            }}
            onCancel={() => {
                SetModalDeleteSceneOpened(false);
            }}>
            <div className="text-ForegroundColor">
                <p>{t("messages.deleteMessage")}</p>
            </div>

        </AkiraModalDialog>
        <SettingsModal opened={SettingsOpened} SetOpened={() => SetSettingsOpened(!SettingsOpened)} />
    </ConfigProvider>
}
