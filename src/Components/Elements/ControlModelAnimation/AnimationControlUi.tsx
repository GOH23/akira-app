import { DrawerProps, Table, TableColumnsType, Tabs, Select, message, Tooltip } from "antd/es";
import { AkiraDrawer } from "../AkiraDrawer";
import { KeyFrameType, MotionModel, MMDModelBones } from "../../logic/MotionModel";
import { data } from "react-router-dom/dist";
import { AkiraButton } from "../AkiraButton";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BoneSettings } from "../../logic/MotionModel";
import { Table as AntTable, InputNumber } from "antd";

type BoneFineTunePanelProps = {
    boneSettings: BoneSettings;
    onChange: (bone: string, settings: { offset: number }) => void;
};
function BoneFineTunePanel({ boneSettings, onChange }: BoneFineTunePanelProps) {
    const { t } = useTranslation();
    const tWithFallback = (key: string, fallback?: string) => t(key, { defaultValue: fallback });
    const bones = MotionModel.getUserFriendlyBones(tWithFallback);
    // Таблица для быстрого редактирования всех костей
    const columns = [
        {
            title: t("scenePage.AnimationControl.boneTable.bone", "Bone"),
            dataIndex: "label",
            key: "label",
            width: 220,
        },
        {
            title: t("scenePage.AnimationControl.boneTable.offset", "Offset"),
            dataIndex: "offset",
            key: "offset",
            width: 120,
            render: (_: any, record: any) => (
                <InputNumber
                    min={-1}
                    max={1}
                    step={0.01}
                    value={boneSettings[record.value]?.offset || 0}
                    onChange={val => onChange(record.value, { ...boneSettings[record.value], offset: Number(val) })}
                    style={{ width: 80 }}
                />
            ),
        },
        {
            title: t("scenePage.AnimationControl.boneTable.jp", "Enum name"),
            dataIndex: "original",
            key: "original",
            width: 120,
        },
    ];
    return (
        <div style={{ marginBottom: 16 }}>
            <h4>{t("scenePage.AnimationControl.boneFineTuneTitle", "Bone Fine-Tuning")}</h4>
            <AntTable
                columns={columns}
                dataSource={bones}
                rowKey="value"
                pagination={false}
                size="small"
                scroll={{ y: 320 }}
            />
        </div>
    );
}

export function AnimationControlUi({ KeyFrames, MotionModelInstance, SetKeyFrames, ...data }: DrawerProps & {
    KeyFrames: KeyFrameType[];
    MotionModelInstance?: MotionModel;
    SetKeyFrames: (state: any[]) => void;
}) {
    const [selectedKey, setSelectedKey] = useState<number>(0);
    const [boneSettings, setBoneSettings] = useState<BoneSettings>({});
    const [perFrameBoneSettings, setPerFrameBoneSettings] = useState<Record<number, BoneSettings>>({});
    const [copiedSettings, setCopiedSettings] = useState<BoneSettings | null>(null);
    const { t } = useTranslation();
    const columns: TableColumnsType<KeyFrameType> = [
        {
            title: t("scenePage.AnimationControl.table.title1"),
            dataIndex: 'keyNum',
            key: 'keyNum',
            sorter: (a, b) => a.keyNum - b.keyNum,
            defaultSortOrder: 'ascend',
        },
        {
            title: t("scenePage.AnimationControl.table.title2"),
            key: 'bones',
            render: (_, record) => record.keyData.length,
        },
        {
            title: t("scenePage.AnimationControl.table.title3"),
            key: 'morphs',
            render: (_, record) => record.morphData.length,
        },
        {
            title: t("scenePage.AnimationControl.table.title4"),
            key: 'actions',
            render: (_, record) => (
                <AkiraButton
                    onClick={() => {
                        MotionModelInstance?.applyKeyFrame(record.keyNum, boneSettings);
                    }}
                >
                    {t("scenePage.AnimationControl.buttons.buttonTitle4")}
                </AkiraButton>
            ),
        }
    ];
    const rowSelection = {
        selectedRowKeys: [selectedKey],
        onChange: (selectedKeys: React.Key[]) => {
            if (selectedKeys.length > 0) {
                setSelectedKey(selectedKeys[0] as number);
            }
        },
    };
    const exportToVMD = () => {
        if (!MotionModelInstance) {
            alert("Model is not initialized");
            return;
        }

        try {
            const vmdBlob = MotionModelInstance.exportToVMD();
            const url = URL.createObjectURL(vmdBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "akira_animation.vmd";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting to VMD:", error);
            alert(`Export error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // Функция для воспроизведения VMD
    const loadAndPlayVMD = () => {
        if (!MotionModelInstance) {
            alert("Model is not initialized");
            return;
        }

        // Создаем элемент ввода файла
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.vmd';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Обработчик выбора файла
        fileInput.onchange = async (event) => {
            const target = event.target as HTMLInputElement;
            const files = target.files;

            if (files && files.length > 0) {
                const vmdFile = files[0];
                try {
                    // Загружаем и воспроизводим VMD файл
                    const success = await MotionModelInstance.loadAndPlayVmdAnimation(vmdFile);
                    if (!success) {
                        alert("Failed to play animation");
                    }
                } catch (error) {
                    console.error("Error loading VMD:", error);
                    alert(`Error loading VMD: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            // Удаляем элемент ввода файла
            document.body.removeChild(fileInput);
        };

        // Эмулируем клик для открытия диалога выбора файла
        fileInput.click();
    };

    // Функция для экспорта в glTF
    const exportToGLTF = async () => {
        if (!MotionModelInstance) {
            alert("Model is not initialized");
            return;
        }

        try {
            const gltfBlob = MotionModelInstance.exportToGLTF();
            const url = URL.createObjectURL(gltfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "akira_animation.gltf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting to glTF:", error);
            alert(`Export error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // Сохранить настройки для кадра
    const saveBoneSettingsForFrame = () => {
        setPerFrameBoneSettings(prev => ({ ...prev, [selectedKey]: { ...boneSettings } }));
    };
    // Загрузить настройки из кадра
    const loadBoneSettingsFromFrame = () => {
        if (perFrameBoneSettings[selectedKey]) {
            setBoneSettings({ ...perFrameBoneSettings[selectedKey] });
        }
    };
    // Сбросить настройки костей
    const resetBoneSettings = () => {
        setBoneSettings({});
    };
    // Копировать настройки костей текущего кадра
    const copyBoneSettings = () => {
        setCopiedSettings({ ...boneSettings });
        message.success(t("scenePage.AnimationControl.copied", "Settings copied!"));
    };
    // Вставить скопированные настройки в текущий кадр
    const pasteBoneSettings = () => {
        if (copiedSettings) {
            setBoneSettings({ ...copiedSettings });
            message.success(t("scenePage.AnimationControl.pasted", "Settings pasted!"));
        }
    };
    // Экспорт всех настроек в JSON
    const exportAllSettings = () => {
        const data = JSON.stringify(perFrameBoneSettings, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "akira_bone_settings.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    // Импорт всех настроек из JSON
    const importAllSettings = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target?.result as string);
                    setPerFrameBoneSettings(imported);
                    message.success(t("scenePage.AnimationControl.imported", "Settings imported!"));
                } catch {
                    message.error(t("scenePage.AnimationControl.importError", "Import error!"));
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // При применении кадра обновлять boneSettings из сохранённых для этого кадра
    const handleApplyKeyFrame = (keyNum: number) => {
        MotionModelInstance?.applyKeyFrame(keyNum, perFrameBoneSettings[keyNum] || boneSettings);
        if (perFrameBoneSettings[keyNum]) {
            setBoneSettings({ ...perFrameBoneSettings[keyNum] });
        }
    };
    return (
        <AkiraDrawer {...data} blurDisabledMask className="relative">
            <Tabs
                defaultActiveKey="animation"
                items={[
                    {
                        key: "animation",
                        label: t("scenePage.AnimationControl.tabs.animation", "Animation"),
                        children: (
                            <>
                                <div className="flex gap-x-1 mb-2" style={{ justifyContent: 'flex-end' }}>
                                    <AkiraButton onClick={() => exportToGLTF()}>
                                        {t("scenePage.AnimationControl.buttons.buttonTitle1", "Export glTF")}
                                    </AkiraButton>
                                    <AkiraButton onClick={() => exportToVMD()}>
                                        {t("scenePage.AnimationControl.buttons.buttonTitle2", "Export VMD")}
                                    </AkiraButton>
                                    <AkiraButton onClick={() => {
                                        if (MotionModelInstance) MotionModelInstance.keyframes = [];
                                        SetKeyFrames([]);
                                    }}>
                                        {t("scenePage.AnimationControl.buttons.buttonTitle3", "Clear Keyframes")}
                                    </AkiraButton>
                                </div>
                                <Table
                                    className="h-full"
                                    rowKey="keyNum"
                                    columns={columns}
                                    dataSource={KeyFrames}
                                    rowSelection={{
                                        type: 'radio',
                                        ...rowSelection,
                                    }}
                                    onRow={(record) => ({
                                        onClick: () => {
                                            setSelectedKey(record.keyNum);
                                            handleApplyKeyFrame(record.keyNum);
                                        },
                                    })}
                                    pagination={{
                                        pageSize: 8,
                                    }}
                                    bordered
                                    size="small"
                                />
                                <div className="flex gap-x-2 mt-2 flex-wrap">
                                    <AkiraButton onClick={saveBoneSettingsForFrame}>{t("scenePage.AnimationControl.saveBoneSettings", "Save settings for frame")}</AkiraButton>
                                    <AkiraButton onClick={loadBoneSettingsFromFrame}>{t("scenePage.AnimationControl.loadBoneSettings", "Load settings from frame")}</AkiraButton>
                                    <AkiraButton onClick={resetBoneSettings}>{t("scenePage.AnimationControl.resetBoneSettings", "Reset settings")}</AkiraButton>
                                    <AkiraButton onClick={copyBoneSettings}>{t("scenePage.AnimationControl.copyBoneSettings", "Copy settings")}</AkiraButton>
                                    <AkiraButton onClick={pasteBoneSettings} disabled={!copiedSettings}>{t("scenePage.AnimationControl.pasteBoneSettings", "Paste settings")}</AkiraButton>
                                    <AkiraButton onClick={exportAllSettings}>{t("scenePage.AnimationControl.exportAllSettings", "Export all settings")}</AkiraButton>
                                    <AkiraButton onClick={importAllSettings}>{t("scenePage.AnimationControl.importAllSettings", "Import all settings")}</AkiraButton>
                                </div>
                            </>
                        ),
                    },
                    {
                        key: "fine-tune",
                        label: t("scenePage.AnimationControl.tabs.fineTune", "Bone Fine-Tuning"),
                        children: (
                            <BoneFineTunePanel
                                boneSettings={boneSettings}
                                onChange={(bone, settings) => setBoneSettings(s => ({ ...s, [bone]: settings }))}
                            />
                        ),
                    },
                ]}
            />
        </AkiraDrawer>
    );
}