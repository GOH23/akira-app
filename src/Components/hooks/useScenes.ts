import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ScenesType = {
    id: string
    modelPathOrLink: string,
    sceneName: string,
    modelName: string
}
interface ScenesState  {
    scenes: ScenesType[],
    addScene: (scene: ScenesType)=>void,
    changeSceneModel: (id: string,modelPathOrLink: string,modelName?: string)=>void
    changeSceneSetting: <T extends keyof ScenesType>(id: string,name: T,value: ScenesType[T])=>void
    removeScene: (id: string)=>void
}
const useScenes = create<ScenesState>()(
    persist(
        (set) => ({
            scenes: [] as any[],
            addScene: (scene: ScenesType)=>set((state)=>({scenes: [...state.scenes,scene]})),
            removeScene: (id: string) => set((state) => ({
                scenes: state.scenes.filter((el, i) => el.id !== id)
            })),
            changeSceneModel: (id, modelPathOrLink,modelName)=>set((state)=>{
                var scene = state.scenes.find((el)=>el.id == id)!;
                scene.modelPathOrLink = modelPathOrLink;
                scene.modelName = modelName || modelPathOrLink;
                return ({
                    scenes: [...state.scenes]
                })
            }),
            changeSceneSetting: (id,name,value)=>set((state)=>{
                var scene = state.scenes.find((el)=>el.id == id)!;
                scene[name] = value;
                return ({
                    scenes: [...state.scenes]
                })
            })
        }),{
            name: "scenes",
            version: 1
        }
    )
)
export { useScenes }
export type { ScenesType, ScenesState }
