import { AkiraModalDialog } from './AkiraModalDialog';
import { useTranslation } from 'react-i18next';

interface AkiraGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function AkiraGuideModal({ open, onClose }: AkiraGuideModalProps) {
  const { t } = useTranslation();
  return (
    <AkiraModalDialog open={open} onCancel={onClose} footer={null} width={800}>
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-ForegroundColor">{t('guide.title')}</h2>
        <p className="mb-4 text-ForegroundColor">
          {t('guide.intro')}
        </p>
        <ol className="list-decimal pl-6 space-y-4 text-ForegroundColor">
          <li>{t('guide.step1')}</li>
          <li>{t('guide.step2')}</li>
          <li>{t('guide.step3')}</li>
          <li>{t('guide.step4')}</li>
          <li>{t('guide.step5')}</li>
          <li>{t('guide.step6')}</li>
          <li>{t('guide.step7')}</li>
          <li>{t('guide.step8')}</li>
        </ol>
        <div className="mt-8 text-center flex flex-col items-center gap-4">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-6 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mb-2"
          >
            {t('guide.okButton')}
          </button>
          <div className="flex gap-4 justify-center">
            <a
              href="https://discord.gg/b8FncDDwmK"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-black rounded-lg shadow transition-all duration-300"
            >
              
              <span className="font-bold drop-shadow-lg text-base px-1">Discord</span>
            </a>
            <a
              href="https://github.com/GOH23/akira-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow transition-all duration-300"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.241 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </AkiraModalDialog>
  );
} 