import { useState } from 'react';
import './ShareButton.css';

const ShareButton = ({ title, url }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'Quiz', url: shareUrl });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <button className="share-btn" onClick={handleShare} title="Share quiz" aria-label={copied ? 'Link copied' : 'Share quiz'}>
      {copied ? '✅ Copied!' : '🔗 Share'}
    </button>
  );
};

export default ShareButton;
