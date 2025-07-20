import { useState, useEffect } from 'react';
import { CodeFilled, DiscordOutlined, GithubFilled, StarFilled } from "@ant-design/icons"
import { AkiraModalDialog } from '../Components/Elements/AkiraModalDialog';
import { useTranslation } from 'react-i18next';
import { AkiraGuideModal } from './Elements/AkiraGuideModal';

const AkiraTitle = ({ children }: { children: React.ReactNode }) => {
    return (
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-6">
            {children}
        </h1>
    )
}

interface PullRequest {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    created_at: string;
    merged_at: string | null;
    user: {
        login: string;
        avatar_url: string;
    };
}

const PullRequestCard = ({ pr, onClick }: { pr: PullRequest; onClick: () => void }) => {
    const getStatusColor = (state: string, merged_at: string | null) => {
        if (merged_at) return 'bg-green-100 text-green-800 border-green-200';
        if (state === 'closed') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-blue-100 text-blue-800 border-blue-200';
    };

    const getStatusText = (state: string, merged_at: string | null) => {
        if (merged_at) return 'Merged';
        if (state === 'closed') return 'Closed';
        return 'Open';
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <CodeFilled className="text-purple-500 text-lg" />
                    <span className="text-sm font-medium text-gray-600">
                        #{pr.number}
                    </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(pr.state, pr.merged_at)}`}>
                    {getStatusText(pr.state, pr.merged_at)}
                </span>
            </div>
            <p className="font-semibold text-lg mb-3 text-gray-800 hover:text-purple-600 transition-colors">{pr.title}</p>
            <div className="flex items-center gap-2">
                <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    className="w-6 h-6 rounded-full ring-2 ring-purple-100"
                />
                <p className="text-sm text-gray-600">by {pr.user.login}</p>
            </div>
        </div>
    );
};

const Modal = ({ isOpen, onClose, pr }: { isOpen: boolean; onClose: () => void; pr: PullRequest | null }) => {
    const { t } = useTranslation();
    if (!isOpen || !pr) return null;

    return (
        <AkiraModalDialog open={isOpen} onCancel={onClose}>
            <div className="p-6">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">{t("mainPage.modal.name1")}</h3>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{pr.title}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">{t("mainPage.modal.name2")}</h3>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <img
                                src={pr.user.avatar_url}
                                alt={pr.user.login}
                                className="w-8 h-8 rounded-full ring-2 ring-purple-200"
                            />
                            <p className="text-gray-700 font-medium">{pr.user.login}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">{t("mainPage.modal.name3")}</h3>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {pr.merged_at ? `Merged on ${new Date(pr.merged_at).toLocaleString()}` :
                                pr.state === 'closed' ? 'Closed' : 'Open'}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">{t("mainPage.modal.name4")}</h3>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{new Date(pr.created_at).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </AkiraModalDialog>
    );
};

export default function MainPage() {
    const { t } = useTranslation();
    const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
    const [starWebCount, setStarWebCount] = useState(0);
    const [starAppCount, setStarAppCount] = useState(0);
    const [isWeb, setIsWeb] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    useEffect(() => {
        // Автоматически показывать гайд при первом запуске
        setIsGuideOpen(true);
    }, []);

    useEffect(() => {
        // Fetch GitHub pull requests
        if (!isWeb) {
            fetch('https://api.github.com/repos/GOH23/akira-mmd/pulls?state=all&sort=updated&direction=desc')
                .then(res => res.json())
                .then(data => {
                    setPullRequests(data.slice(0, 5));
                })
                .catch(err => console.error('Error fetching pull requests:', err));
        } else {
            fetch('https://api.github.com/repos/GOH23/akira-desktop/pulls?state=all&sort=updated&direction=desc')
                .then(res => res.json())
                .then(data => {
                    setPullRequests(data.slice(0, 5));
                })
                .catch(err => console.error('Error fetching pull requests:', err));
        }

        // Fetch star count
        fetch('https://api.github.com/repos/GOH23/akira-mmd')
            .then(res => res.json())
            .then(data => setStarWebCount(data.stargazers_count))
            .catch(err => console.error('Error fetching star count:', err));
        fetch('https://api.github.com/repos/GOH23/akira-app')
            .then(res => res.json())
            .then(data => setStarAppCount(data.stargazers_count))
            .catch(err => console.error('Error fetching star count:', err));
    }, []);

    const handlePRClick = (pr: PullRequest) => {
        setSelectedPR(pr);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 mt-12 to-white">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="text-center mb-12 flex flex-col items-center">
                    <div className="flex justify-center items-center w-full mb-2">
                        <AkiraTitle>{t("mainPage.NewTitle")}</AkiraTitle>
                        <button
                            onClick={() => setIsGuideOpen(true)}
                            className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow hover:from-purple-600 hover:to-blue-600 transition-all"
                        >
                            {t('mainPage.guideButton')}
                        </button>
                    </div>
                   
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {pullRequests.map((pr) => (
                        <PullRequestCard
                            key={pr.id}
                            pr={pr}
                            onClick={() => handlePRClick(pr)}
                        />
                    ))}
                </div>

                <div className="text-center mb-12">
                    <AkiraTitle>{t("mainPage.SocialTitle")}</AkiraTitle>
                    <div className="flex justify-center gap-8 mb-8">
                        <a
                            href="https://github.com/GOH23"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-4xl text-gray-700 hover:text-purple-600 transition-colors duration-300"
                        >
                            <GithubFilled />
                        </a>
                        <a
                            href="https://discord.gg/b8FncDDwmK"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-4xl text-gray-700 hover:text-purple-600 transition-colors duration-300"
                        >
                            <DiscordOutlined />
                        </a>
                    </div>
                </div>

                <div className="text-center">
                    <AkiraTitle>{t("mainPage.SupportMe")}</AkiraTitle>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => window.open('https://github.com/GOH23/akira-mmd', '_blank')}
                            className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            <StarFilled className="text-2xl" />
                            <span className="font-semibold">Web {t("mainPage.GithubButton")} ({starWebCount})</span>
                        </button>
                        <button
                            onClick={() => window.open('https://github.com/GOH23/akira-app', '_blank')}
                            className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            <StarFilled className="text-2xl" />
                            <span className="font-semibold">App {t("mainPage.GithubButton")} ({starAppCount})</span>
                        </button>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedPR(null);
                }}
                pr={selectedPR}
            />
            <AkiraGuideModal open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
        </div>
    );
}
