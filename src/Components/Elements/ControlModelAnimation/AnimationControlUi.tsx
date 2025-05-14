import { DrawerProps, Table, TableColumnsType } from "antd/es";
import { AkiraDrawer } from "../AkiraDrawer";
import { KeyFrameType, MotionModel } from "../../logic/MotionModel";
import { data } from "react-router-dom/dist";
import { AkiraButton } from "../AkiraButton";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function AnimationControlUi({ KeyFrames, MotionModelInstance,SetKeyFrames, ...data }: DrawerProps & {
    KeyFrames: KeyFrameType[];
    MotionModelInstance?: MotionModel;
    SetKeyFrames: (state: any[])=>void
}) {
    const [selectedKey, setSelectedKey] = useState<number>(0);
    const {t} = useTranslation()
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
                        MotionModelInstance?.applyKeyFrame(record.keyNum)
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
    return (<AkiraDrawer {...data} blurDisabledMask className="relative">
        <div className="flex absolute gap-x-1 top-0 right-0 m-1">
            <AkiraButton onClick={() => exportToGLTF()}>
            {t("scenePage.AnimationControl.buttons.buttonTitle1")}
            </AkiraButton>
            <AkiraButton onClick={() => exportToVMD()}>
            {t("scenePage.AnimationControl.buttons.buttonTitle2")}
            </AkiraButton>
            <AkiraButton onClick={() => {
                MotionModelInstance.keyframes = []
                SetKeyFrames([]);
            }}>
                {t("scenePage.AnimationControl.buttons.buttonTitle3")}
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
                    MotionModelInstance?.applyKeyFrame(record.keyNum);
                },
            })}
            pagination={{
                pageSize: 8,

            }}
            
            bordered
            size="small"
        />
    </AkiraDrawer>)
}