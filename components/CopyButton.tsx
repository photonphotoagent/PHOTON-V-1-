import React, { useState } from 'react';
import { CopyIcon } from './icons';

export const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button onClick={handleCopy} title="Copy to clipboard" className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors absolute top-2 right-2">
            {copied ? <span className="text-sm text-indigo-400 px-2">Copied!</span> : <CopyIcon className="h-5 w-5" />}
        </button>
    );
};
