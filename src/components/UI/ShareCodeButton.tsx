import { useState, type MouseEvent } from 'react';
import { Check, Copy } from 'lucide-react';
import './ShareCodeButton.css';

type CopyStatus = 'idle' | 'copied' | 'failed';

type ShareCodeButtonProps = {
  readonly shareCode: string;
  readonly className?: string;
  readonly iconSize?: number;
};

export function ShareCodeButton({ shareCode, className = '', iconSize = 13 }: ShareCodeButtonProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const isCopied = copyStatus === 'copied';
  const isFailed = copyStatus === 'failed';
  const title = isCopied
    ? 'Copié !'
    : isFailed
      ? 'Copie impossible'
      : 'Cliquer pour copier le code de partage';

  const resetStatusLater = () => {
    window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleCopyShareCode = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!navigator.clipboard) {
      setCopyStatus('failed');
      resetStatusLater();
      return;
    }

    void navigator.clipboard.writeText(shareCode)
      .then(() => {
        setCopyStatus('copied');
        resetStatusLater();
      })
      .catch(() => {
        setCopyStatus('failed');
        resetStatusLater();
      });
  };

  return (
    <button
      className={`share-code-button${isCopied ? ' share-code-button--copied' : ''}${isFailed ? ' share-code-button--failed' : ''}${className ? ` ${className}` : ''}`}
      onClick={handleCopyShareCode}
      title={title}
      aria-label={title}
      type="button"
    >
      {isCopied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      <span className="share-code-button__text">{shareCode}</span>
    </button>
  );
}
