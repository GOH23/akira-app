
import { useState, useEffect } from 'react';
import { CodeFilled, DiscordOutlined, GithubFilled, StarFilled } from "@ant-design/icons"
import { AkiraModalDialog } from '../Components/Elements/AkiraModalDialog';
import { AkiraButton } from './Elements/AkiraButton';
import { useTranslation } from 'react-i18next';
const AkiraTitle = ({ children }: { children: React.ReactNode }) => {
    return (<p className="text-2xl font-bold">{children}</p>)
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
        if (merged_at) return 'bg-green-100 text-green-800';
        if (state === 'closed') return 'bg-red-100 text-red-800';
        return 'bg-blue-100 text-blue-800';
    };

    const getStatusText = (state: string, merged_at: string | null) => {
        if (merged_at) return 'Merged';
        if (state === 'closed') return 'Closed';
        return 'Open';
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <CodeFilled className="text-purple-500" />
                    <span className="text-sm text-gray-500">
                        #{pr.number}
                    </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pr.state, pr.merged_at)}`}>
                    {getStatusText(pr.state, pr.merged_at)}
                </span>
            </div>
            <p className="font-semibold text-lg mb-1">{pr.title}</p>
            <div className="flex items-center gap-2">
                <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    className="w-5 h-5 rounded-full"
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
            <div>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-ForegroundColor mb-2">{t("mainPage.modal.name1")}</h3>
                        <p className="text-ForegroundColor">{pr.title}</p>
                    </div>
                    {/* <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">
                            <MDXRemote source={pr.body} />
                        </p>
                    </div> */}
                    <div>
                        <h3 className="font-semibold text-ForegroundColor mb-2">{t("mainPage.modal.name2")}</h3>
                        <div className="flex items-center gap-2">
                            <img
                                src={pr.user.avatar_url}
                                alt={pr.user.login}
                                className="w-6 h-6 rounded-full"
                            />
                            <p className="text-ForegroundColor">{pr.user.login}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-ForegroundColor mb-2">{t("mainPage.modal.name3")}</h3>
                        <p className="text-ForegroundColor">
                            {pr.merged_at ? `Merged on ${new Date(pr.merged_at).toLocaleString()}` :
                                pr.state === 'closed' ? 'Closed' : 'Open'}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-ForegroundColor mb-2">{t("mainPage.modal.name4")}</h3>
                        <p className="text-ForegroundColor">{new Date(pr.created_at).toLocaleString()}</p>
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

    const handleStarClick = () => {
        window.open('https://github.com/GOH23/akira-mmd', '_blank');
    };

    const handlePRClick = (pr: PullRequest) => {
        setSelectedPR(pr);
        setIsModalOpen(true);
    };

    return (
        <div style={{ minHeight: "100vh" }} className=" text-center p-8">

            <div className="max-w-4xl mx-auto">
                <div className='flex justify-center my-1 items-center'>
                    <AkiraTitle>{t("mainPage.NewTitle")}</AkiraTitle>
                    {/* <div className='flex ml-auto gap-x-2'>
                        <AkiraButton>
                            {t("mainPage.SelectButtonNew.webName")}
                        </AkiraButton>
                        <AkiraButton>
                            {t("mainPage.SelectButtonNew.desktopName")}
                        </AkiraButton>
                    </div> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {pullRequests.map((pr) => (
                        <PullRequestCard
                            key={pr.id}
                            pr={pr}
                            onClick={() => handlePRClick(pr)}
                        />
                    ))}
                </div>

                <AkiraTitle>{t("mainPage.SocialTitle")}</AkiraTitle>
                <div className="flex justify-center gap-6 mb-8">
                    <a
                        href="https://github.com/GOH23"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-3xl hover:text-gray-600 transition-colors"
                    >
                        <GithubFilled />
                    </a>

                    <a
                        href="https://discord.gg/b8FncDDwmK"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-3xl hover:text-gray-600 transition-colors"
                    >
                        <DiscordOutlined />
                    </a>
                </div>

                <AkiraTitle>{t("mainPage.SupportMe")}</AkiraTitle>
                <div className='flex gap-2'>
                    <button
                        onClick={handleStarClick}
                        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
                    >
                        <StarFilled className="text-xl" />
                        <span>Web {t("mainPage.GithubButton")}  ({starWebCount})</span>
                    </button>
                    <button
                        onClick={handleStarClick}
                        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
                    >
                        <StarFilled className="text-xl" />
                        <span>App {t("mainPage.GithubButton")}  ({starAppCount})</span>
                    </button>
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
        </div>
    );
}
