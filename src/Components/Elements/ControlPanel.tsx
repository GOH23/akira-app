import { VideoCameraFilled, SettingFilled, SkinOutlined, ShareAltOutlined, UserOutlined, CloseCircleOutlined, DragOutlined } from "@ant-design/icons/lib";
import { useTranslation } from "react-i18next";
import { DrawerStatesType } from "../ScenePage";


export const ControlPanel = ({ onOpenDrawer }: { onOpenDrawer: (drawer: keyof DrawerStatesType, value: boolean) => void, }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4 z-50">
            <button
                onClick={() => onOpenDrawer('VideoDrawerOpened', true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
            >
                <VideoCameraFilled className="text-xl" />
                <span className="font-medium">{t('controlPanel.video')}</span>
            </button>

            <button
                onClick={() => onOpenDrawer('SettingsDrawerOpened', true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
            >
                <SettingFilled className="text-xl" />
                <span className="font-medium">{t('controlPanel.settings')}</span>
            </button>
            <button
                onClick={() => onOpenDrawer("ExportOpened", true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
            >
                <ShareAltOutlined className="text-xl" />
                <span className="font-medium">{t('controlPanel.export')}</span>
            </button>
            <button
                onClick={() => onOpenDrawer('SkeletonModelOpened', true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
            >
                <SkinOutlined className="text-xl" />
                <span className="font-medium">{t('controlPanel.skeleton')}</span>
            </button>
            <button onClick={() => onOpenDrawer("AssistantOpened", true)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors">
                <UserOutlined className="text-xl" />
                <span className="font-medium">{t('controlPanel.assistant')}</span>
            </button>

        </div>
    );
};
