import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Database, Globe, FileClock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTranslation } from 'react-i18next';

interface AddAccountDialogProps {
    onAdd: (email: string, refreshToken: string) => Promise<void>;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

function AddAccountDialog({ onAdd }: AddAccountDialogProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'oauth' | 'token' | 'import'>('oauth');
    const [refreshToken, setRefreshToken] = useState('');

    // UI State
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState('');

    const { startOAuthLogin, importFromDb, importV1Accounts } = useAccountStore();

    // Reset state when dialog opens or tab changes
    useEffect(() => {
        if (isOpen) {
            resetState();
        }
    }, [isOpen, activeTab]);

    const resetState = () => {
        setStatus('idle');
        setMessage('');
        setRefreshToken('');
    };

    const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
        setStatus('loading');
        setMessage(`${actionName}...`);
        try {
            await actionFn();
            setStatus('success');
            setMessage(`${actionName} ${t('common.success')}!`);

            // 延迟关闭，让用户看到成功状态
            setTimeout(() => {
                setIsOpen(false);
                resetState();
            }, 1500);
        } catch (error) {
            setStatus('error');
            setMessage(`${actionName} ${t('common.error')}: ${error} `);
        }
    };

    const handleSubmit = () => {
        if (!refreshToken) {
            setStatus('error');
            setMessage(t('accounts.add.status.error_token'));
            return;
        }
        // Email 传空字符串，后端会自动获取
        handleAction(t('accounts.add_account'), () => onAdd("", refreshToken));
    };

    const handleOAuth = () => {
        handleAction(t('accounts.add.tabs.oauth'), startOAuthLogin);
    };

    const handleImportDb = () => {
        handleAction(t('accounts.add.tabs.import'), importFromDb);
    };

    const handleImportV1 = () => {
        handleAction(t('accounts.add.import.btn_v1'), importV1Accounts);
    };

    // 状态提示组件
    const StatusAlert = () => {
        if (status === 'idle' || !message) return null;

        const styles = {
            loading: 'alert-info',
            success: 'alert-success',
            error: 'alert-error'
        };

        const icons = {
            loading: <Loader2 className="w-5 h-5 animate-spin" />,
            success: <CheckCircle2 className="w-5 h-5" />,
            error: <XCircle className="w-5 h-5" />
        };

        return (
            <div className={`alert ${styles[status]} mb-4 text-sm py-2 shadow-sm`}>
                {icons[status]}
                <span>{message}</span>
            </div>
        );
    };

    return (
        <>
            <button
                className="px-4 py-2 bg-white dark:bg-base-100 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-base-200 transition-colors flex items-center gap-2 shadow-sm border border-gray-200/50 dark:border-base-300"
                onClick={() => setIsOpen(true)}
            >
                <Plus className="w-4 h-4" />
                {t('accounts.add_account')}
            </button>

            {isOpen && createPortal(
                <dialog className="modal modal-open z-[100]">
                    {/* Draggable Top Region */}
                    <div data-tauri-drag-region className="fixed top-0 left-0 right-0 h-8 z-[110]" />

                    <div className="modal-box bg-white dark:bg-base-100 text-gray-900 dark:text-base-content">
                        <h3 className="font-bold text-lg mb-4">{t('accounts.add.title')}</h3>

                        {/* Tab 导航 - 胶囊风格 */}
                        <div className="bg-gray-100 dark:bg-base-200 p-1 rounded-xl mb-6 grid grid-cols-3 gap-1">
                            <button
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'oauth'
                                    ? 'bg-white dark:bg-base-100 shadow-sm text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-base-300'
                                    } `}
                                onClick={() => setActiveTab('oauth')}
                            >
                                {t('accounts.add.tabs.oauth')}
                            </button>
                            <button
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'token'
                                    ? 'bg-white dark:bg-base-100 shadow-sm text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-base-300'
                                    } `}
                                onClick={() => setActiveTab('token')}
                            >
                                {t('accounts.add.tabs.token')}
                            </button>
                            <button
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'import'
                                    ? 'bg-white dark:bg-base-100 shadow-sm text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-base-300'
                                    } `}
                                onClick={() => setActiveTab('import')}
                            >
                                {t('accounts.add.tabs.import')}
                            </button>
                        </div>

                        {/* 状态提示区 */}
                        <StatusAlert />

                        <div className="min-h-[200px]">
                            {/* OAuth 授权 */}
                            {activeTab === 'oauth' && (
                                <div className="space-y-6 py-4">
                                    <div className="text-center space-y-3">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                                            <Globe className="w-10 h-10 text-blue-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('accounts.add.oauth.recommend')}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                                {t('accounts.add.oauth.desc')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        onClick={handleOAuth}
                                        disabled={status === 'loading' || status === 'success'}
                                    >
                                        {status === 'loading' ? t('accounts.add.oauth.btn_waiting') : t('accounts.add.oauth.btn_start')}
                                    </button>
                                </div>
                            )}

                            {/* Refresh Token */}
                            {activeTab === 'token' && (
                                <div className="space-y-4 py-2">
                                    <div className="bg-gray-50 dark:bg-base-200 p-4 rounded-lg border border-gray-200 dark:border-base-300">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('accounts.add.token.label')}</span>
                                        </div>
                                        <textarea
                                            className="textarea textarea-bordered w-full h-32 font-mono text-xs leading-relaxed focus:outline-none focus:border-blue-500 transition-colors bg-white dark:bg-base-100 text-gray-900 dark:text-base-content border-gray-300 dark:border-base-300 placeholder:text-gray-400"
                                            placeholder={t('accounts.add.token.placeholder')}
                                            value={refreshToken}
                                            onChange={(e) => setRefreshToken(e.target.value)}
                                            disabled={status === 'loading' || status === 'success'}
                                        />
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {t('accounts.add.token.hint')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 从数据库导入 */}
                            {activeTab === 'import' && (
                                <div className="space-y-6 py-2">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                            <Database className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            {t('accounts.add.import.scheme_a')}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t('accounts.add.import.scheme_a_desc')}
                                        </p>
                                        <button
                                            className="btn btn-outline w-full border-gray-300 dark:border-base-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-base-200 hover:border-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            onClick={handleImportDb}
                                            disabled={status === 'loading' || status === 'success'}
                                        >
                                            {t('accounts.add.import.btn_db')}
                                        </button>
                                    </div>

                                    <div className="divider text-xs text-gray-300 dark:text-gray-600">{t('accounts.add.import.or')}</div>

                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                            <FileClock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            {t('accounts.add.import.scheme_b')}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t('accounts.add.import.scheme_b_desc')}
                                        </p>
                                        <button
                                            className="btn btn-outline w-full border-gray-300 dark:border-base-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-base-200 hover:border-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            onClick={handleImportV1}
                                            disabled={status === 'loading' || status === 'success'}
                                        >
                                            {t('accounts.add.import.btn_v1')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 w-full mt-6">
                            <button
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-base-200 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-base-300 transition-colors focus:outline-none focus:ring-2 focus:ring-200 dark:focus:ring-base-300"
                                onClick={() => setIsOpen(false)}
                                disabled={status === 'loading' || status === 'success'}
                            >
                                {t('accounts.add.btn_cancel')}
                            </button>
                            {activeTab === 'token' && (
                                <button
                                    className="flex-1 px-4 py-2.5 text-white font-medium rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 shadow-blue-100 dark:shadow-blue-900/30 flex justify-center items-center gap-2"
                                    onClick={handleSubmit}
                                    disabled={status === 'loading' || status === 'success'}
                                >
                                    {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {t('accounts.add.btn_confirm')}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="modal-backdrop bg-black/40 backdrop-blur-sm fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
                </dialog>,
                document.body
            )}
        </>
    );
}

export default AddAccountDialog;
