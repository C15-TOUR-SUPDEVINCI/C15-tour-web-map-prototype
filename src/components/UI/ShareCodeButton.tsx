import { useState, type MouseEvent } from 'react';
import { Check, Copy } from 'lucide-react';
import './ShareCodeButton.css';

type ShareCodeButtonProps = {
  readonly shareCode: string;
  readonly className?: string;
  readonly iconSize?: number;
};

export function ShareCodeButton({ shareCode, className = '', iconSize = 13 }: ShareCodeButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyShareCode = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void navigator.clipboard.writeText(shareCode).then(() => {
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <button
      className={`share-code-button${isCopied ? ' share-code-button--copied' : ''}${className ? ` ${className}` : ''}`}
      onClick={handleCopyShareCode}
      title={isCopied ? 'Copié !' : 'Cliquer pour copier le code de partage'}
      type="button"
    >
      {isCopied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      <span className="share-code-button__text">{shareCode}</span>
    </button>
  );
}
