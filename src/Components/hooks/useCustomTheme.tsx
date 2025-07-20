

type HookType = {
    Layout: {
        bg: string,
        fg: string,
        triggerBg: string
    },
    MenuTheme: {
        bg: string,
        fg: string,
        activeFg: string,
        itemSelectedBg: string
    },
    borderActiveColor: string
    borderColor: string
}

export const useNextJSToAntdTheme = (theme: string | undefined): HookType => {
    switch (theme) {
        case "purple":
            return {
                Layout: {
                    bg: "#682a92",
                    fg: "#fbfaff",
                    triggerBg: "#590996"
                },
                MenuTheme: {
                    bg: "#682a92",
                    fg: "#fbfaff",
                    activeFg: "#000000",
                    itemSelectedBg: "#590996"
                },
                borderColor: "#613dc1",
                borderActiveColor: "#ffffff"
            }
        case "dark":
            return {
                Layout: {
                    bg: "#04052e",
                    fg: "#fbfaff",
                    triggerBg: "#090a57"
                },
                MenuTheme: {
                    bg: "#04052e",
                    fg: "#fbfaff",
                    activeFg: "#000000",
                    itemSelectedBg: "#090a57"
                },
                borderColor: "#613dc1",
                borderActiveColor: "#522882"
            }
        case "light":
            return {
                Layout: {
                    bg: "#ffffff",
                    fg: "#374151",
                    triggerBg: "#7c3aed"
                },
                MenuTheme: {
                    bg: "#ffffff",
                    fg: "#374151",
                    activeFg: "#ffffff",
                    itemSelectedBg: "#f5f3ff"
                },

                borderColor: "#e3d5ca",
                borderActiveColor: "#d5bdaf"
            }
        default:
            return {
                Layout: {
                    bg: "",
                    fg: "",
                    triggerBg: ""
                },
                MenuTheme: {
                    bg: "",
                    fg: "",
                    activeFg: "",
                    itemSelectedBg: ""
                },
                borderColor: "613dc1",
                borderActiveColor: "#522882"
            }

    }
}