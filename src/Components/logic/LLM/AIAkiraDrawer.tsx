import { useState, useEffect, useRef } from "react";
import { AkiraDrawer } from "../../../Components/Elements/AkiraDrawer";
import { DrawerStatesType } from "../../../Components/ScenePage";
import { Sender, Bubble } from '@ant-design/x';
import { Button, Divider, Flex, Space, Switch } from "antd/es";
import { ApiOutlined, CopyOutlined, LinkOutlined, SearchOutlined, SyncOutlined, DownOutlined, UpOutlined } from "@ant-design/icons/lib";
import { AudioModel } from "./audioModel";
import { fileURLToPath } from "url";
import { MotionModel } from "../MotionModel";
import { Scene } from "@babylonjs/core";
import { MmdRuntime, VmdLoader } from "babylon-mmd";
import { useTranslation } from "react-i18next";
import i18n from "../../../Components/i18n";
import { AkiraModalDialog } from "../../../Components/Elements/AkiraModalDialog";
import { QuestionCircleOutlined } from "@ant-design/icons";
type jsonText = {
    animation: string,

}
export function AIAkiraDrawer({ DrawerStates, OpenDrawer, motionModel, mmdScene,mmdRuntime }: { DrawerStates: DrawerStatesType,mmdRuntime: MmdRuntime, OpenDrawer: (drawer: keyof DrawerStatesType, value: boolean) => void, motionModel: MotionModel, mmdScene: Scene }) {
    const [loading, setLoading] = useState<boolean>(false);
    const [value, setValue] = useState<string>('');
    const [vmdLoader, SetVmdLoader] = useState<VmdLoader>(new VmdLoader(mmdScene))
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, think?: string }[]>([]);
    const [AudioOutput, setAudioOutput] = useState(true);
    const [thinkBlocks, setThinkBlocks] = useState<{ idx: number, content: string, open: boolean }[]>([]);
    const [aiResponding, setAiResponding] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null)
    const audioModelRef = useRef<AudioModel>(new AudioModel());
    const { t } = useTranslation();
    const [GuideOpened, setGuideOpened] = useState(false);

    useEffect(() => {
        audioModelRef.current.loadModel().then(() => {
            console.log("Audio model loaded")
        })

    }, [audioRef]);
    useEffect(() => {
        // Listen for streamed AI responses
        const handler = (_event: any, data: any) => {
            setMessages(prev => {
                const lastIdx = prev.map(m => m.role).lastIndexOf('ai');
                if (lastIdx === -1) return prev;
                let chunk = data.accumulated;
                let thinkContent = '';
                const thinkMatch = chunk.match(/<think>([\s\S]*?)<\/think>/);
                if (thinkMatch) {
                    thinkContent = thinkMatch[1];
                    chunk = chunk.replace(/<think>[\s\S]*?<\/think>/g, '');
                }
                let displayContent = chunk;

                try {
                    // Найти первую { и последнюю }
                    const first = chunk.indexOf('{');
                    const last = chunk.lastIndexOf('}');
                    if (first !== -1 && last !== -1 && last > first) {
                        const jsonStr = chunk.substring(first, last + 1);
                        console.log(jsonStr)
                        const parsed = JSON.parse(jsonStr);
                        if (parsed && parsed.text) {
                            console.log('FINAL JSON:', parsed);
                            if (parsed.emotion && vmdLoader) {
                                const animationPath = `../assets/animation/${parsed.emotion}`;
                                console.log("Attempting to load animation:", animationPath);
                                vmdLoader.loadAsync("model_motion_1", [
                                    animationPath
                                ]).then((val) => {
                                    console.log("Loaded animation value:", val);
                                    motionModel._Model.addAnimation(val);
                                    motionModel._Model.setAnimation("model_motion_1");
                                    mmdRuntime.playAnimation();
                                }).catch((err) => {
                                    console.error("Failed to load animation:", err);
                                });
                            }
                            const removeEmojis = (str: string) => str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\uFE0F]/gu, '');
                            audioModelRef.current.textToSpeech(String(removeEmojis(parsed.text)).replace("!", "").replace("?", "")).then((val: any) => {
                                if (audioRef.current) {
                                    audioRef.current.pause();
                                    audioRef.current.currentTime = 0;
                                    audioRef.current.src = URL.createObjectURL(val);
                                    audioRef.current.play();
                                }
                            })
                            displayContent = removeEmojis(parsed.text);
                            setLoading(false);
                            setAiResponding(false);

                        }
                    }
                } catch (e) {

                    displayContent = e;
                    // Не JSON — показываем как есть
                }
                const updated = [...prev];
                updated[lastIdx] = { ...updated[lastIdx], content: displayContent, think: thinkContent };
                // Reasoning всегда обновляется, не сбрасываем loading если не найден JSON
                return updated;
            });
        };
        window.electronAPI.onAIStream(handler);
        return () => {
            // Remove listener if component unmounts
            // (Not strictly necessary with Electron, but good practice)
        };
    }, []);

    const handleSend = async (msg?: string) => {
        const text = typeof msg === 'string' ? msg : value;
        if (!text.trim()) return;
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setValue('');
        // Add a thinking block
        setMessages(prev => [...prev, { role: 'ai', content: '...' }]);
        setLoading(true);
        setAiResponding(true);
        try {
            // Получаем выбранную модель из localStorage
            const selectedModel = localStorage.getItem('ollamaModel') || 'default-model';
            // Получаем текущий язык интерфейса
            const currentLang = i18n.resolvedLanguage || i18n.language || 'ru';
            // Отправляем сообщение в main process и ждем ответ через window.electronAPI, передавая язык
            const aiResponse = await window.electronAPI.sendMessage({
                model: selectedModel,
                prompt: text,
                stream: true,
                lang: currentLang,
            });

            if (!aiResponse.streamed) {
                setMessages(prev => {
                    const lastIdx = prev.map(m => m.role).lastIndexOf('ai');
                    if (lastIdx === -1) return prev;
                    let chunk = aiResponse.response || '';
                    let thinkContent = '';
                    const thinkMatch = chunk.match(/<think>([\s\S]*?)<\/think>/);
                    if (thinkMatch) {
                        thinkContent = thinkMatch[1];
                        chunk = chunk.replace(/<think>[\s\S]*?<\/think>/g, '');
                    }
                    let displayContent = chunk;
                    let foundJson = false;
                    try {
                        // Найти первую { и последнюю }
                        const first = chunk.indexOf('{');
                        const last = chunk.lastIndexOf('}');
                        if (first !== -1 && last !== -1 && last > first) {
                            const jsonStr = chunk.substring(first, last + 1);
                            const parsed = JSON.parse(jsonStr);
                            if (parsed && parsed.text) {

                                const removeEmojis = (str: string) => str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\uFE0F]/gu, '');
                                displayContent = removeEmojis(parsed.text);
                                foundJson = true;
                            }
                        }
                    } catch (e) {
                        // Не JSON — показываем как есть
                    }
                    const updated = [...prev];
                    updated[lastIdx] = { ...updated[lastIdx], content: displayContent, think: thinkContent };
                    if (thinkContent) {
                        setThinkBlocks(blocks => {
                            const exists = blocks.find(b => b.idx === lastIdx);
                            if (exists) return blocks.map(b => b.idx === lastIdx ? { ...b, content: thinkContent } : b);
                            return [...blocks, { idx: lastIdx, content: thinkContent, open: false }];
                        });
                    }
                    return updated;
                });
            }

        } catch (e) {
            setMessages(prev => {
                const lastIdx = prev.map(m => m.role).lastIndexOf('ai');
                if (lastIdx === -1) return prev;
                const updated = [...prev];
                updated[lastIdx] = { ...updated[lastIdx], content: t('aiDrawer.error') };
                return updated;
            });
            setLoading(false);
            setAiResponding(false);
        }
    };
    const onCopy = (textToCopy: any) => {

    };
    return <AkiraDrawer
        title={<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <span>{t('aiDrawer.title')}</span>
            <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={() => setGuideOpened(true)}
                style={{ fontSize: 20 }}
            />
        </div>}
        placement="right"
        blurDisabledMask
        onClose={() => OpenDrawer("AssistantOpened", false)}
        open={DrawerStates.AssistantOpened}
        styles={{
            mask: {
                backdropFilter: "none",
                background: "transparent"
            },
        }}
    >
        {/* Чат-история AntX */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
                {/* Маппинг сообщений с поддержкой loading и reasoning */}
                {messages.map((msg, idx) => {
                    const isLast = idx === messages.length - 1;
                    const showLoading = msg.role === 'ai' && isLast && aiResponding;
                    return (
                        <Bubble
                            key={idx}
                            loading={showLoading}
                            content={msg.content && msg.content !== '...' ? msg.content : t('aiDrawer.thinking')}
                            role={msg.role}
                            footer={(content, info) => (
                                <Space>
                                    <Button color="default" variant="text" size="small" icon={<SyncOutlined />} />
                                    <Button
                                        color="default"
                                        variant="text"
                                        size="small"
                                        onClick={() => onCopy(content)}
                                        icon={<CopyOutlined />}
                                    />
                                </Space>
                            )}
                        />
                    );
                })}
                {/* THINK BLOCKS */}
                {thinkBlocks.map(block => (
                    <div key={block.idx} style={{ background: '#f6f6f6', borderRadius: 8, padding: 8, margin: '8px 0', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }} onClick={() => setThinkBlocks(bs => bs.map(b => b.idx === block.idx ? { ...b, open: !b.open } : b))}>
                            <span style={{ fontWeight: 500, color: '#888' }}>{t('aiDrawer.reasoning')}</span>
                            {block.open ? <UpOutlined style={{ marginLeft: 8 }} /> : <DownOutlined style={{ marginLeft: 8 }} />}
                        </div>
                        {block.open && (
                            <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#222', width: '100%' }}>{block.content}</div>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 8 }}>
                <Sender
                    value={value}
                    onChange={setValue}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    placeholder={t('aiDrawer.inputPlaceholder')}
                    onSubmit={handleSend}
                    loading={loading}
                    footer={({ components }) => {
                        return (
                            <Flex justify="space-between" align="center">
                                <Flex gap="small" align="center">
                                    {t('aiDrawer.audioOutput')}
                                    <Switch size="small" checked={AudioOutput} onChange={setAudioOutput} />
                                </Flex>
                            </Flex>
                        );
                    }} />
            </div>
            <audio ref={audioRef} id="audio-element" />
        </div>
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
                        <span dangerouslySetInnerHTML={{__html: t('guide.ollamaStep1').replace('https://ollama.com/download', '<a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer">https://ollama.com/download</a>')}} />
                    </li>
                    <li>{t('guide.ollamaStep2')}</li>
                    <li>
                        <span dangerouslySetInnerHTML={{__html: t('guide.ollamaStep3').replace('Ollama Library', '<a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer">Ollama Library</a>')}} />
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
                    <span dangerouslySetInnerHTML={{__html: t('guide.moreHelp').replace('Ollama documentation', '<a href="https://ollama.com/docs" target="_blank" rel="noopener noreferrer">Ollama documentation</a>')}} />
                </p>
            </div>
        </AkiraModalDialog>
    </AkiraDrawer>
}