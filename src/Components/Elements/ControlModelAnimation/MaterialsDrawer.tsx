import { Material, Mesh } from "@babylonjs/core";
import { AkiraDrawer } from "../AkiraDrawer";
import { DrawerProps, Slider } from "antd/es";
import { useTranslation } from "react-i18next";
export type MaterialsProps = {
    materials: readonly Mesh[]
}
export function MaterialsDrawer(data: DrawerProps & MaterialsProps) {
    const {t} = useTranslation();
    return (<AkiraDrawer blurDisabledMask {...data}>
        {<div className="flex flex-col gap-y-1">
            {data.materials.map((el, ind) => {
                return <div className="text-ForegroundColor flex-col border p-2 border-ForegroundColor flex" key={ind}>
                    {t("scenePage.MaterialsControl.title1")}: {el.name}
                    <div className="m-2">
                        <p>{t("scenePage.MaterialsControl.stat1")}</p>
                        <Slider className="w-full" defaultValue={el.visibility} max={1} min={0}
                            step={0.1}
                            onChange={(e: number) => {
                                el.visibility = e
                            }} />

                    </div>
                </div>
            })}
        </div>}
    </AkiraDrawer>)
}