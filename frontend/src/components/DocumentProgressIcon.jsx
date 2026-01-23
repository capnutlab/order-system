import React from 'react';

const DocumentProgressIcon = ({ 
  size = 32, 
  progressColor = '#2a2a2a',
  documentColor = '#1a1a1a',
  backgroundColor = '#e5e5e5',
  checkColor = '#10b981',
  className = ''
}) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      {/* 背景円 */}
      <circle cx="100" cy="100" r="95" fill={documentColor} opacity="0.1"/>
      
      {/* 円形プログレスバー（背景） */}
      <circle 
        cx="100" 
        cy="100" 
        r="75" 
        fill="none" 
        stroke={backgroundColor} 
        strokeWidth="8"
      />
      
      {/* 円形プログレスバー（進捗 - 約70%） */}
      <circle 
        cx="100" 
        cy="100" 
        r="75" 
        fill="none" 
        stroke={progressColor} 
        strokeWidth="8"
        strokeDasharray="331" 
        strokeDashoffset="99"
        strokeLinecap="round" 
        transform="rotate(-90 100 100)"
      />
      
      {/* ドキュメント本体 */}
      <path 
        d="M 65 50 L 120 50 L 135 65 L 135 135 L 65 135 Z" 
        fill="white" 
        stroke={documentColor} 
        strokeWidth="3"
      />
      
      {/* ドキュメント右上の折り返し */}
      <path 
        d="M 120 50 L 120 65 L 135 65" 
        fill="#f5f5f5" 
        stroke={documentColor} 
        strokeWidth="3" 
        strokeLinejoin="miter"
      />
      
      {/* ドキュメント内の線（ヘッダー） */}
      <rect x="75" y="70" width="50" height="4" rx="2" fill={documentColor}/>
      
      {/* ドキュメント内の線（コンテンツ） */}
      <rect x="75" y="85" width="45" height="3" rx="1.5" fill="#4a4a4a"/>
      <rect x="75" y="95" width="50" height="3" rx="1.5" fill="#4a4a4a"/>
      <rect x="75" y="105" width="40" height="3" rx="1.5" fill="#4a4a4a"/>
      
      {/* チェックマーク */}
      <path 
        d="M 85 118 L 92 125 L 105 112" 
        fill="none" 
        stroke={checkColor} 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* プログレスバーの進捗インジケーター */}
      <circle cx="137" cy="55" r="5" fill={progressColor}>
        <animate 
          attributeName="opacity" 
          values="1;0.5;1" 
          dur="2s" 
          repeatCount="indefinite"
        />
      </circle>
      
      {/* 小さな時計アイコン */}
      <g transform="translate(115, 115)">
        <circle cx="0" cy="0" r="10" fill="white" stroke={documentColor} strokeWidth="2"/>
        <line x1="0" y1="0" x2="0" y2="-6" stroke={documentColor} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="0" y1="0" x2="4" y2="0" stroke={documentColor} strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  );
};

export default DocumentProgressIcon;
