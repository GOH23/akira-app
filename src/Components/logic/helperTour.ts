import { useTranslation } from "react-i18next"
import type { TourProps } from 'antd';
export const getSteps = (
    fullScreenButton: any,
    sceneSettingsButton: any,
    selectVideoButton: any,
    materialsButton: any,
    animationControlButton: any
) => {
    const { t } = useTranslation()

    function getDem(type: "Settings" | "SelectVideo" | "AnimationControlUi" | "FullScreen" | "MaterialsButton",dataType: "title" | "description"){
        return t(`scenePage.Tutor.${type}.${dataType}`)
    }
    const steps: TourProps['steps'] = [
        {
            title: getDem("FullScreen","title"),
            description: getDem("FullScreen","description"),
            target: () => fullScreenButton
        },
        {
            title: getDem("SelectVideo","title"),
            description: getDem("SelectVideo","description"),
            target: () => selectVideoButton
        },
        {
            title: getDem("Settings","title"),
            description: getDem("Settings","description"),
            target: () => sceneSettingsButton
        },        
        {
            title: getDem("MaterialsButton","title"),
            description: getDem("MaterialsButton","description"),
            target: () => materialsButton
        },        
        {
            title: getDem("AnimationControlUi","title"),
            description: getDem("AnimationControlUi","description"),
            target: () => animationControlButton
        }
    ]
    return steps
}