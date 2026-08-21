// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// === Firebase 連線設定 ===
const firebaseConfig = {
  apiKey: 'AIzaSyD4fOYP3yVyZ4NxXZdSWYZr5Z6Oc_lX8fQ',
  authDomain: 'dailytasks-4d281.firebaseapp.com',
  projectId: 'dailytasks-4d281',
  storageBucket: 'dailytasks-4d281.firebasestorage.app',
  messagingSenderId: '955083665386',
  appId: '1:955083665386:web:515c82426eda8210660c93',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// === 預設頭貼 SVG 組件（8個，男/女/中性） ===
const PRESET_AVATARS = [
  {
    id: 'avatar_m1', label: '男生1', gender: 'male',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#4FC3F7"/>
      <circle cx="50" cy="38" r="18" fill="#FFCC80"/>
      <ellipse cx="50" cy="80" rx="22" ry="15" fill="#1565C0"/>
      <circle cx="42" cy="36" r="2.5" fill="#5D4037"/>
      <circle cx="58" cy="36" r="2.5" fill="#5D4037"/>
      <path d="M44 44 Q50 49 56 44" stroke="#BF7B5E" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M34 31 Q42 26 50 29 Q58 26 66 31" stroke="#5D4037" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_m2', label: '男生2', gender: 'male',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#FF7043"/>
      <circle cx="50" cy="38" r="18" fill="#FFAB76"/>
      <ellipse cx="50" cy="80" rx="22" ry="15" fill="#212121"/>
      <circle cx="43" cy="36" r="2.5" fill="#3E2723"/>
      <circle cx="57" cy="36" r="2.5" fill="#3E2723"/>
      <path d="M44 44 Q50 48 56 44" stroke="#C97A5A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <rect x="35" y="22" width="30" height="10" rx="5" fill="#212121"/>
      <path d="M37 22 Q50 15 63 22" fill="#212121"/>
    </svg>`
  },
  {
    id: 'avatar_f1', label: '女生1', gender: 'female',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#CE93D8"/>
      <circle cx="50" cy="38" r="18" fill="#FFCCBC"/>
      <ellipse cx="50" cy="80" rx="22" ry="15" fill="#AD1457"/>
      <circle cx="43" cy="36" r="2.5" fill="#4A148C"/>
      <circle cx="57" cy="36" r="2.5" fill="#4A148C"/>
      <path d="M44 44 Q50 49 56 44" stroke="#E8956D" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M32 28 Q50 18 68 28 Q70 35 68 30 Q50 22 32 30 Q30 35 32 28Z" fill="#6A1B9A"/>
      <ellipse cx="36" cy="42" r="4" ry="3" fill="#F48FB1" opacity="0.6"/>
      <ellipse cx="64" cy="42" r="4" ry="3" fill="#F48FB1" opacity="0.6"/>
    </svg>`
  },
  {
    id: 'avatar_f2', label: '女生2', gender: 'female',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#80DEEA"/>
      <circle cx="50" cy="38" r="18" fill="#FFCCBC"/>
      <ellipse cx="50" cy="80" rx="22" ry="15" fill="#00838F"/>
      <circle cx="43" cy="36" r="2.5" fill="#263238"/>
      <circle cx="57" cy="36" r="2.5" fill="#263238"/>
      <path d="M44 44 Q50 49 56 44" stroke="#E8956D" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M32 26 Q50 18 68 26 L66 34 Q50 28 34 34Z" fill="#263238"/>
      <path d="M28 34 Q32 28 35 38 Q32 42 28 38Z" fill="#263238"/>
      <path d="M72 34 Q68 28 65 38 Q68 42 72 38Z" fill="#263238"/>
      <ellipse cx="36" cy="42" r="4" ry="3" fill="#FFAB91" opacity="0.5"/>
      <ellipse cx="64" cy="42" r="4" ry="3" fill="#FFAB91" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'avatar_n1', label: '中性1', gender: 'neutral',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#A5D6A7"/>
      <circle cx="50" cy="38" r="18" fill="#FFE0B2"/>
      <ellipse cx="50" cy="80" rx="22" ry="15" fill="#2E7D32"/>
      <circle cx="43" cy="36" r="2.5" fill="#33691E"/>
      <circle cx="57" cy="36" r="2.5" fill="#33691E"/>
      <path d="M44 44 Q50 49 56 44" stroke="#D4905A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M34 28 Q42 23 50 25 Q58 23 66 28 Q60 20 50 19 Q40 20 34 28Z" fill="#558B2F"/>
    </svg>`
  },
  {
    id: 'avatar_n2', label: '中性2', gender: 'neutral',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#FFD54F"/>
      <circle cx="50" cy="38" r="18" fill="#FFCC80"/>
      <ellipse cx="50" cy="80" rx="22" ry="15" fill="#E65100"/>
      <circle cx="43" cy="36" r="3" fill="#4E342E"/>
      <circle cx="57" cy="36" r="3" fill="#4E342E"/>
      <path d="M44 44 Q50 50 56 44" stroke="#BF7B5E" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="30" r="2" fill="#BF7B5E"/>
      <path d="M38 28 Q50 22 62 28" stroke="#4E342E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_f3', label: '女生3', gender: 'female',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#F8BBD0"/>
      <circle cx="50" cy="39" r="18" fill="#FFE0B2"/>
      <ellipse cx="50" cy="80" rx="22" ry="15" fill="#C2185B"/>
      <circle cx="43" cy="37" r="2.5" fill="#4A148C"/>
      <circle cx="57" cy="37" r="2.5" fill="#4A148C"/>
      <path d="M44 45 Q50 50 56 45" stroke="#E8956D" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M30 29 Q50 16 70 29 Q68 23 50 19 Q32 23 30 29Z" fill="#880E4F"/>
      <path d="M50 19 L48 10 Q50 8 52 10 L50 19Z" fill="#880E4F"/>
      <ellipse cx="36" cy="43" r="5" ry="3.5" fill="#F48FB1" opacity="0.55"/>
      <ellipse cx="64" cy="43" r="5" ry="3.5" fill="#F48FB1" opacity="0.55"/>
    </svg>`
  },
  {
    id: 'avatar_m3', label: '男生3', gender: 'male',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#90CAF9"/>
      <circle cx="50" cy="38" r="18" fill="#D7A87A"/>
      <ellipse cx="50" cy="80" rx="22" ry="15" fill="#1A237E"/>
      <circle cx="43" cy="35" r="2.5" fill="#1A237E"/>
      <circle cx="57" cy="35" r="2.5" fill="#1A237E"/>
      <path d="M44 44 Q50 48 56 44" stroke="#A0684A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M33 28 Q50 20 67 28 Q65 22 50 18 Q35 22 33 28Z" fill="#1A237E"/>
      <path d="M42 44 Q50 50 58 44 Q56 52 50 54 Q44 52 42 44Z" fill="#C4956A"/>
    </svg>`
  },
];

// 頭貼選擇器組件
const AvatarPicker = ({ currentAvatar, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xl text-[#1A1A1A]">選擇頭貼</h3>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-500">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1">共 8 款 — 男生 / 女生 / 中性</p>
        </div>
        <div className="p-6 grid grid-cols-4 gap-4">
          {PRESET_AVATARS.map((av) => (
            <button
              key={av.id}
              onClick={() => onSelect(av.id)}
              className={`relative flex flex-col items-center gap-2 group`}
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden transition-all duration-200 ${
                currentAvatar === av.id
                  ? 'ring-4 ring-[#D85E38] ring-offset-2 scale-110'
                  : 'ring-2 ring-transparent hover:ring-gray-300 hover:scale-105'
              }`}
                dangerouslySetInnerHTML={{ __html: av.svg }}
              />
              {currentAvatar === av.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D85E38] rounded-full flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
              <span className="text-[9px] font-bold text-gray-400">{av.label}</span>
            </button>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#1A1A1A] text-white rounded-full font-bold text-sm hover:bg-black transition-colors shadow-lg"
          >
            確認選擇
          </button>
        </div>
      </div>
    </div>
  );
};

// 取得頭貼SVG的工具函數
const getAvatarContent = (avatarId, avatarUrl) => {
  if (avatarId) {
    const preset = PRESET_AVATARS.find(a => a.id === avatarId);
    if (preset) return { type: 'svg', content: preset.svg };
  }
  if (avatarUrl) return { type: 'img', content: avatarUrl };
  return null;
};

// 頭貼顯示組件
const AvatarDisplay = ({ avatarId, avatarUrl, className = "w-full h-full" }) => {
  const av = getAvatarContent(avatarId, avatarUrl);
  if (!av) return null;
  if (av.type === 'svg') {
    return <div className={className} dangerouslySetInnerHTML={{ __html: av.content }} />;
  }
  return <img src={av.content} className={`${className} object-cover`} />;
};

// === 座標距離計算 ===
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// === 圖示組件 ===
const I = ({ children, c = '', onClick }) => (
  <svg
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={c}
  >
    {children}
  </svg>
);
const User = ({ c }) => (
  <I c={c}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </I>
);
const Trash2 = ({ c }) => (
  <I c={c}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </I>
);
const PlusCircle = ({ c }) => (
  <I c={c}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </I>
);
const ShieldCheck = ({ c }) => (
  <I c={c}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </I>
);
const Store = ({ c }) => (
  <I c={c}>
    <path d="m2 7 4.38-5.46a2 2 0 0 1 1.56-.78h8.12a2 2 0 0 1 1.56.78L22 7" />
    <path d="M2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6" />
    <path d="M2 7h20" />
  </I>
);
const XCircle = ({ c }) => (
  <I c={c}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </I>
);
const CheckCircle2 = ({ c }) => (
  <I c={c}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </I>
);
const Bell = ({ c }) => (
  <I c={c}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </I>
);
const LogOut = ({ c }) => (
  <I c={c}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </I>
);
const Edit = ({ c }) => (
  <I c={c}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </I>
);
const SproutLeaf = ({ c }) => (
  <I c={c}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 12" />
  </I>
);
const ClipboardCheck = ({ c }) => (
  <I c={c}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
    <path d="m9 14 2 2 4-4" />
  </I>
);
const Lock = ({ c }) => (
  <I c={c}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </I>
);
const Settings = ({ c }) => (
  <I c={c}>
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </I>
);
const Camera = ({ c }) => (
  <I c={c}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </I>
);
const MapPin = ({ c }) => (
  <I c={c}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </I>
);
const Search = ({ c }) => (
  <I c={c}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </I>
);
const CircleOutline = ({ c }) => (
  <I c={c}>
    <circle cx="12" cy="12" r="9" />
  </I>
);
const XOutline = ({ c }) => (
  <I c={c}>
    <path d="M18 6L6 18M6 6l12 12" />
  </I>
);
const Mic = ({ c }) => (
  <I c={c}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </I>
);
const MonitorPlay = ({ c }) => (
  <I c={c}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="m10 8 6 4-6 4Z" />
  </I>
);
const Square = ({ c }) => (
  <I c={c}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </I>
);
const CheckSquare = ({ c }) => (
  <I c={c}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </I>
);
const Send = ({ c }) => (
  <I c={c}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </I>
);
const BarChart = ({ c }) => (
  <I c={c}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </I>
);
const CalendarIcon = ({ c }) => (
  <I c={c}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </I>
);
const ChevronRight = ({ c }) => (
  <I c={c}>
    <polyline points="9 18 15 12 9 6" />
  </I>
);
const ChevronLeft = ({ c }) => (
  <I c={c}>
    <polyline points="15 18 9 12 15 6" />
  </I>
);
const AlertTriangle = ({ c }) => (
  <I c={c}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </I>
);
const PenTool = ({ c }) => (
  <I c={c}>
    <path d="m12 19 7-7 3 3-7 7-3-3z" />
    <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="m2 2 7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </I>
);
const RefreshCw = ({ c }) => (
  <I c={c}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </I>
);
const Award = ({ c }) => (
  <I c={c}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </I>
);

const customStyles = `
  .soft-shadow { box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.04); }
  .bottom-nav-shadow { box-shadow: 0 -8px 32px -4px rgba(0, 0, 0, 0.1); }
  .badge-solid-manager { background-color: #242424; color: white; }
  .badge-solid-deputy { background-color: #525252; color: white; }
  .badge-solid-leader { background-color: #8C8C8C; color: white; }
  .badge-solid-reserve { background-color: #A3A3A3; color: white; }
  .badge-solid-staff { background-color: #E0E0E0; color: #1A1A1A; }
  .badge-solid-intern { background-color: #F1F8F5; color: #2F7E5B; }
  .badge-solid-default { background-color: #F0F2F5; color: #4b5563; }
  .premium-dark-card { background-color: #242424; box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.15); }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
  summary { list-style: none; outline: none; }
  summary::-webkit-details-marker { display: none; }
`;

const RoleBadge = ({ role }) => {
  let badgeClass = 'badge-solid-default';
  let icon = null;
  if (role === '店長') badgeClass = 'badge-solid-manager';
  else if (role === '副店長') badgeClass = 'badge-solid-deputy';
  else if (role === '組長') badgeClass = 'badge-solid-leader';
  else if (role === '儲備') badgeClass = 'badge-solid-reserve';
  else if (role === '正職' || role === '兼職') badgeClass = 'badge-solid-staff';
  else if (role?.includes('實習')) {
    badgeClass = 'badge-solid-intern';
    icon = <SproutLeaf c="w-3.5 h-3.5 mr-1 fill-current" />;
  }
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center tracking-wider ${badgeClass}`}
    >
      {icon}
      {role ? String(role) : ''}
    </span>
  );
};

// === 簽名畫板組件 ===
const SignaturePad = ({ onSave }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1A1A1A';
  }, []);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0)
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const start = (e) => {
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stop = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full relative mb-4">
        <p className="absolute top-2 left-3 text-[10px] text-gray-400 font-bold pointer-events-none">
          請在此處滑動簽名
        </p>
        <canvas
          ref={canvasRef}
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={stop}
          className="w-full h-[180px] bg-white border-2 border-dashed border-gray-300 rounded-xl touch-none shadow-inner"
        />
      </div>
      <div className="flex gap-3 w-full">
        <button
          type="button"
          onClick={() => {
            const c = canvasRef.current;
            c.getContext('2d').clearRect(0, 0, c.width, c.height);
          }}
          className="flex-1 py-3.5 bg-gray-200 text-gray-700 rounded-full font-bold text-sm hover:bg-gray-300 transition-colors"
        >
          清除重簽
        </button>
        <button
          type="button"
          onClick={() => onSave(canvasRef.current.toDataURL('image/png'))}
          className="flex-1 py-3.5 bg-[#D85E38] text-white rounded-full font-bold text-sm shadow-lg hover:bg-[#C25330] transition-colors"
        >
          確認送出
        </button>
      </div>
    </div>
  );
};

// === 橫式成就解鎖進度條元件 ===
const AchievementProgress = ({ emp, categories, exams, compact = false }) => {
  // 預先計算每個分類的分數資料
  const catData = categories.map((cat, index) => {
    const catExams = exams.filter(
      (e) => e.categoryId === cat.id || (!e.categoryId && index === 0)
    );
    const total = catExams.length;
    let passedCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    catExams.forEach((exam) => {
      const record = emp?.examRecords?.[exam.id];
      const pv = exam.pointValue ?? 10;
      totalPoints += pv;
      if (record === 'passed' || (record && typeof record === 'object' && record.status === 'passed')) {
        passedCount++;
        earnedPoints += pv;
      }
    });
    const isPassed = total > 0 && passedCount === total;
    const catScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const hasSomeRecord = catExams.some((exam) => {
      const r = emp?.examRecords?.[exam.id];
      return r && (r === 'passed' || r === 'failed' || (typeof r === 'object' && r.status));
    });
    const nameDisplay = cat.name && cat.name.length > 5
      ? String(cat.name).substring(0, 5) + '..'
      : String(cat.name || '');
    return { cat, isPassed, catScore, hasSomeRecord, nameDisplay, total };
  });

  const sz = compact ? 'w-7 h-7' : 'w-9 h-9';
  const lineW = compact ? 'w-8' : 'w-12 sm:w-16';
  const allPassed = catData.every(d => d.isPassed);

  return (
    <div className="overflow-x-auto hide-scrollbar">
      {/* 第一行：圓圈 + 連線 */}
      <div className="flex items-center">
        {catData.map(({ cat, isPassed }, index) => {
          const nextPassed = index < catData.length - 1 ? catData[index + 1].isPassed : false;
          return (
            <div key={cat.id} className="flex items-center flex-shrink-0">
              <div className={`rounded-full flex items-center justify-center shadow-sm transition-colors duration-300 ${sz} ${
                isPassed ? 'bg-[#3B82F6] text-white' : 'bg-white text-gray-300 border-2 border-gray-200'
              }`}>
                {isPassed ? (
                  <svg className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <Lock c={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                )}
              </div>
              {index < catData.length - 1 && (
                <div className={`h-1.5 transition-colors duration-300 ${lineW} ${nextPassed ? 'bg-[#3B82F6]' : 'bg-gray-100'}`} />
              )}
              {index === catData.length - 1 && (
                <>
                  <div className={`h-1.5 transition-colors duration-300 ${compact ? 'w-4' : 'w-8'} ${isPassed ? 'bg-[#3B82F6]' : 'bg-gray-100'}`} />
                  <div className={`flex items-center justify-center rounded-full font-black shadow-sm transition-all duration-300 ${
                    compact ? 'px-2 py-1 text-[9px]' : 'px-3 py-1.5 text-[11px]'
                  } ${allPassed ? 'bg-[#3B82F6] text-white shadow-blue-500/30' : 'bg-gray-100 text-gray-400'}`}>
                    ★ +100
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {/* 第二行：名稱 + 分數，每個 label 寬度 = dotW，中心對齊圓圈，線寬用 spacer 補 */}
      <div className="flex items-start mt-2">
        {catData.map(({ cat, isPassed, catScore, hasSomeRecord, nameDisplay }, index) => {
          const dotW = compact ? 28 : 36;
          const lineW2 = compact ? 32 : 64;
          return (
            <React.Fragment key={cat.id}>
              {/* label 寬度 = 圓圈寬，文字置中對齊圓圈 */}
              <div className="flex-shrink-0 flex flex-col items-center" style={{ width: dotW }}>
                <span style={{ fontSize: compact ? 8 : 9, fontWeight: 700, lineHeight: '1.3', whiteSpace: 'nowrap' }} className={isPassed ? 'text-gray-600' : 'text-gray-400'}>
                  {nameDisplay}
                </span>
                <span style={{ fontSize: compact ? 8 : 9, fontWeight: 900, lineHeight: '1.3', whiteSpace: 'nowrap' }} className={isPassed ? 'text-[#3B82F6]' : hasSomeRecord ? 'text-[#D85E38]' : 'text-gray-300'}>
                  {hasSomeRecord ? `${catScore}分` : '–'}
                </span>
              </div>
              {/* 連線 spacer：非最後一個才加 */}
              {index < catData.length - 1 && (
                <div className="flex-shrink-0" style={{ width: lineW2 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};



export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [hasShownLoginNotice, setHasShownLoginNotice] = useState(false);
  const [isCheckingGPS, setIsCheckingGPS] = useState(false);
  const [secretPwd, setSecretPwd] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('exams');
  const [toast, setToast] = useState(null);

  // === App 設定 (標題、Logo) ===
  const [appConfig, setAppConfig] = useState({ title: '學習系統', logoUrl: '', examGradingTitle: '考試評分紀錄' });
  const [editAppTitle, setEditAppTitle] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showAppConfigModal, setShowAppConfigModal] = useState(false);

  // === 頭貼選擇器狀態 ===
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarPickerTarget, setAvatarPickerTarget] = useState(null);
  const [regSelectedAvatar, setRegSelectedAvatar] = useState('');
  const [editEmpSelectedAvatar, setEditEmpSelectedAvatar] = useState('');

  const jobRoles = [
    '店長',
    '副店長',
    '組長',
    '儲備',
    '正職',
    '兼職',
    '實習正職',
    '實習兼職',
  ];

  const [stores, setStores] = useState([]);
  const [exams, setExams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // 考試狀態
  const [editingExamId, setEditingExamId] = useState(null);
  const [editExamData, setEditExamData] = useState({
    type: 'basic',
    title: '',
    subtitle: '',
    description: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    pointValue: 10,
  });
  const [showExamResult, setShowExamResult] = useState(false);
  const [examFinalScore, setExamFinalScore] = useState(null);
  const [deletingExamId, setDeletingExamId] = useState(null);

  // 考試作答前選擇考官與開始狀態
  const [selectedProctor, setSelectedProctor] = useState('');
  const [examStarted, setExamStarted] = useState(false);
  const [examStartTime, setExamStartTime] = useState(null);
  const [examTimeRemaining, setExamTimeRemaining] = useState(null);
  const [examTimeUp, setExamTimeUp] = useState(false);

  // 人員名單狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStoreFilter, setActiveStoreFilter] = useState('all');

  const [regAvatarFile, setRegAvatarFile] = useState(null);
  const [regAvatarPreview, setRegAvatarPreview] = useState(null);

  // 平時紀錄與檢討紀錄狀態
  const [dailyItems, setDailyItems] = useState([]);
  const [recordTab, setRecordTab] = useState('mine');
  const [recordAdminMode, setRecordAdminMode] = useState('grade');
  const [editingDailyItemId, setEditingDailyItemId] = useState(null);
  const [editDailyItemData, setEditDailyItemData] = useState({
    title: '',
    targetRoles: [],
  });
  const [deletingDailyItemId, setDeletingDailyItemId] = useState(null);
  const [selectedRecordDate, setSelectedRecordDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [gradingEmployeeId, setGradingEmployeeId] = useState(null);
  const [gradingScores, setGradingScores] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [dailyConfig, setDailyConfig] = useState({ graderRoles: [] });

  const [incidents, setIncidents] = useState([]);
  const [isAddingIncident, setIsAddingIncident] = useState(false);
  const [editIncidentData, setEditIncidentData] = useState({
    empId: '',
    title: '',
    description: '',
  });
  const [editingIncidentId, setEditingIncidentId] = useState(null);
  const [deletingIncidentId, setDeletingIncidentId] = useState(null);
  const [reviewModal, setReviewModal] = useState({
    show: false,
    incident: null,
    text: '',
  });
  const [activeIncidentStoreFilter, setActiveIncidentStoreFilter] =
    useState('all');
  const [activeExamStoreFilter, setActiveExamStoreFilter] = useState('all');

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryPassingScore, setEditCategoryPassingScore] = useState(60);
  const [editCategoryTimeLimit, setEditCategoryTimeLimit] = useState(0);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editEmployeeData, setEditEmployeeData] = useState({});
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    store: '',
    role: '',
    password: '',
  });

  const [currentAnswers, setCurrentAnswers] = useState({});
  const [proctorModal, setProctorModal] = useState({
    show: false,
    examId: null,
    proctorName: '',
  });
  const [proctorReviewModal, setProctorReviewModal] = useState({
    show: false,
    examId: null,
    proctorName: '',
    password: '',
    verified: false,
  });

  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [deletingStoreId, setDeletingStoreId] = useState(null);

  const [draggedCatId, setDraggedCatId] = useState(null);
  const categoryTabsRef = useRef(null);
  const [draggedStoreId, setDraggedStoreId] = useState(null);
  const [draggedExamId, setDraggedExamId] = useState(null);

  // 後台人員卡片的切換 Tab 控制
  const [empTabs, setEmpTabs] = useState({});
  // 後台編輯個性特徵的暫存區
  const [editPersonalityObj, setEditPersonalityObj] = useState({});

  useEffect(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    );
  }, []);

  useEffect(() => {
    const unsubStores = onSnapshot(collection(db, 'stores'), (snap) =>
      setStores(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (a.order !== undefined ? a.order : a.createdAt) -
              (b.order !== undefined ? b.order : b.createdAt)
          )
      )
    );
    const unsubExams = onSnapshot(collection(db, 'exams'), (snap) =>
      setExams(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (a.order !== undefined ? a.order : a.createdAt) -
              (b.order !== undefined ? b.order : b.createdAt)
          )
      )
    );
    const unsubCats = onSnapshot(collection(db, 'examCategories'), (snap) =>
      setCategories(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (a.order !== undefined ? a.order : a.createdAt) -
              (b.order !== undefined ? b.order : b.createdAt)
          )
      )
    );
    const unsubEmp = onSnapshot(collection(db, 'employees'), (snap) =>
      setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubPending = onSnapshot(collection(db, 'pendingAccounts'), (snap) =>
      setPendingAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubDailyItems = onSnapshot(collection(db, 'dailyItems'), (snap) =>
      setDailyItems(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.createdAt - b.createdAt)
      )
    );
    const unsubIncidents = onSnapshot(collection(db, 'incidents'), (snap) =>
      setIncidents(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => b.createdAt - a.createdAt)
      )
    );
    const unsubDailyConfig = onSnapshot(
      doc(db, 'settings', 'dailyConfig'),
      (snap) => {
        if (snap.exists()) setDailyConfig(snap.data());
        else setDailyConfig({ graderRoles: [] });
      }
    );

    const unsubAppConfig = onSnapshot(
      doc(db, 'settings', 'appConfig'),
      (snap) => {
        if (snap.exists()) setAppConfig({ title: '學習系統', logoUrl: '', examGradingTitle: '考試評分紀錄', ...snap.data() });
        else setAppConfig({ title: '學習系統', logoUrl: '', examGradingTitle: '考試評分紀錄' });
      }
    );

    return () => {
      unsubStores();
      unsubExams();
      unsubCats();
      unsubEmp();
      unsubPending();
      unsubDailyItems();
      unsubIncidents();
      unsubDailyConfig();
      unsubAppConfig();
    };
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId)
      setActiveCategoryId(categories[0].id);
  }, [categories, activeCategoryId]);

  const canEdit = currentUserRole === 'super_admin';
  const currentUserData = employees.find((e) => e.name === currentUserName);
  const isGrader =
    canEdit || (dailyConfig.graderRoles || []).includes(currentUserRole);

  // === 考試計時器 ===
  useEffect(() => {
    if (!examStarted || !examStartTime) return;
    const activeCat = categories.find((c) => c.id === activeCategoryId);
    const timeLimit = activeCat?.timeLimit;
    if (!timeLimit || timeLimit <= 0) {
      setExamTimeRemaining(null);
      return;
    }
    const timeLimitMs = timeLimit * 60 * 1000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - examStartTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setExamTimeRemaining(remaining);
      if (remaining <= 0) {
        setExamTimeUp(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [examStarted, examStartTime, activeCategoryId, categories]);

  const handleRecordsTabClick = () => {
    setActiveTab('records');
    if (canEdit) setRecordTab('review');
    else if (isGrader) setRecordTab('grade');
    else setRecordTab('mine');
  };

  let pendingRetests = [];
  if (canEdit || isGrader) {
    const retestTargetEmps = canEdit
      ? employees
      : employees.filter((e) => e.store === currentUserData?.store);
    retestTargetEmps.forEach((emp) => {
      if (emp.examRecords) {
        Object.entries(emp.examRecords).forEach(([examId, record]) => {
          if (record && typeof record === 'object' && record.retestRequested) {
            pendingRetests.push({
              empId: emp.id,
              empName: emp.name,
              store: emp.store,
              examId: examId,
              examTitle: record.title || '未知考試',
              timestamp: record.timestamp,
            });
          }
        });
      }
    });
  }
  const totalAdminNotifications =
    pendingAccounts.length + pendingRetests.length;

  useEffect(() => {
    if (
      isAuthenticated &&
      (canEdit || isGrader) &&
      totalAdminNotifications > 0 &&
      !hasShownLoginNotice
    ) {
      setShowNotificationModal(true);
      setHasShownLoginNotice(true);
    }
  }, [isAuthenticated, canEdit, isGrader, totalAdminNotifications, hasShownLoginNotice]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const target = e.target;
    const formData = new FormData(target);
    const password = authPassword;
    const store = formData.get('store');

    if (authMode === 'register') {
      const name = formData.get('managerName');
      const role = formData.get('jobRole');
      const birthdate = formData.get('birthdate');
      const hireDate = formData.get('hireDate');
      const phone = formData.get('phone');
      const mbti = formData.get('mbti');

      if (
        !store ||
        !name ||
        !role ||
        !password ||
        !birthdate ||
        !hireDate ||
        !phone ||
        !mbti
      ) {
        showToast('請完整填寫所有必填欄位！');
        setAuthError('請填寫完整資料');
        return;
      }

      if (
        employees.some((emp) => emp.password === password) ||
        pendingAccounts.some((pa) => pa.password === password)
      ) {
        showToast('此密碼已被使用，請更換其他密碼！');
        setAuthError('此密碼已有人使用，請更換');
        return;
      }

      setIsCheckingGPS(true);
      try {
        await addDoc(collection(db, 'pendingAccounts'), {
          name: String(name).trim(),
          store: String(store),
          requestedRole: String(role),
          password: password,
          birthdate: String(birthdate),
          hireDate: String(hireDate),
          phone: String(phone).trim(),
          mbti: String(mbti),
          avatarId: regSelectedAvatar || '',
          avatarUrl: '',
          date: new Date().toISOString().split('T')[0],
          createdAt: Date.now(),
        });
        showToast('帳號密碼申請已送出！請等待總部核准。');
        setAuthMode('login');
        setAuthPassword('');
        setAuthError('');
        setRegSelectedAvatar('');
        target.reset();
      } catch (error) {
        console.error('註冊失敗:', error);
        showToast(
          '註冊失敗：' + (error.message || '請檢查網路連線或系統權限！')
        );
      } finally {
        setIsCheckingGPS(false);
      }
    } else {
      const matchedUser = employees.find(
        (emp) => emp.store === store && emp.password === password
      );
      if (matchedUser) {
        const userStore = stores.find((s) => s.name === store);
        if (userStore && userStore.lat && userStore.lng) {
          setIsCheckingGPS(true);
          showToast('正在驗證您的 GPS 定位，請稍候...');
          if (!navigator.geolocation) {
            setIsCheckingGPS(false);
            showToast('您的裝置不支援 GPS 定位，無法登入。');
            setAuthError('裝置不支援 GPS');
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setIsCheckingGPS(false);
              const dist = getDistanceFromLatLonInM(
                position.coords.latitude,
                position.coords.longitude,
                userStore.lat,
                userStore.lng
              );
              if (dist > 100) {
                showToast(
                  `登入失敗！您距離門店約 ${Math.round(
                    dist
                  )} 公尺 (不可超過 100m)。`
                );
                setAuthError('不在門店範圍內，無法登入');
              } else {
                setIsAuthenticated(true);
                setCurrentUserRole(matchedUser.role);
                setCurrentUserName(matchedUser.name);
                setAuthPassword('');
                setAuthError('');
              }
            },
            (error) => {
              setIsCheckingGPS(false);
              showToast('無法取得定位，請確認已開啟手機及瀏覽器的定位權限！');
              setAuthError('請允許定位權限');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          setIsAuthenticated(true);
          setCurrentUserRole(matchedUser.role);
          setCurrentUserName(matchedUser.name);
          setAuthPassword('');
          setAuthError('');
        }
      } else {
        if (
          pendingAccounts.some(
            (pa) => pa.store === store && pa.password === password
          )
        ) {
          showToast('登入失敗！此帳號尚未開通。');
          setAuthError('此帳號尚未開通');
        } else {
          showToast('登入失敗！查無此門店或密碼錯誤。');
          setAuthError('密碼錯誤，請重新輸入');
        }
      }
    }
  }

  async function handleAvatarUpload(empId, e, isEditMode = false) {
    const file = e.target.files[0];
    if (!file) return;
    showToast('上傳大頭照中...');
    try {
      const storageRef = ref(storage, `avatars/${empId}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      if (isEditMode) {
        setEditEmployeeData({ ...editEmployeeData, avatarUrl: url, avatarId: '' });
      } else {
        await updateDoc(doc(db, 'employees', empId), { avatarUrl: url, avatarId: '' });
      }
      showToast('大頭照更新成功！');
    } catch (err) {
      showToast('上傳失敗：' + (err.message || '請檢查權限設定！'));
    } finally {
      e.target.value = null;
    }
  }

  async function handlePresetAvatarSelect(avatarId) {
    if (avatarPickerTarget === 'register') {
      setRegSelectedAvatar(avatarId);
    } else if (avatarPickerTarget === 'edit') {
      setEditEmpSelectedAvatar(avatarId);
      setEditEmployeeData(prev => ({ ...prev, avatarId: avatarId, avatarUrl: '' }));
    } else if (avatarPickerTarget) {
      // 直接更新員工頭貼
      await updateDoc(doc(db, 'employees', avatarPickerTarget), { avatarId: avatarId, avatarUrl: '' });
      showToast('頭貼已更新！');
    }
    setShowAvatarPicker(false);
    setAvatarPickerTarget(null);
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingLogo(true);
    showToast('上傳 Logo 中...');
    try {
      const storageRef = ref(storage, `system/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'settings', 'appConfig'), { ...appConfig, logoUrl: url }, { merge: true });
      showToast('Logo 已更新！');
    } catch (err) {
      showToast('上傳失敗：' + (err.message || '請檢查權限！'));
    } finally {
      setIsUploadingLogo(false);
      e.target.value = null;
    }
  }

  function startEditEmployee(emp) {
    setEditingEmployeeId(emp.id);
    setEditEmployeeData({
      name: emp.name,
      store: emp.store,
      role: emp.role,
      password: emp.password || '',
      birthdate: emp.birthdate || '',
      hireDate: emp.hireDate || '',
      phone: emp.phone || '',
      mbti: emp.mbti || '',
      avatarUrl: emp.avatarUrl || '',
      avatarId: emp.avatarId || '',
    });
    setEditEmpSelectedAvatar(emp.avatarId || '');
  }

  async function saveEditEmployee(id) {
    if (
      !editEmployeeData.name.trim() ||
      (editEmployeeData.password && editEmployeeData.password.length !== 6)
    ) {
      showToast('資料格式不完整或密碼不為 6 碼！');
      return;
    }
    try {
      await updateDoc(doc(db, 'employees', id), editEmployeeData);
      setEditingEmployeeId(null);
      showToast('人員資料已成功更新！');
    } catch (error) {
      showToast('更新失敗，請檢查網路連線。');
    }
  }

  async function saveNewEmployee() {
    if (
      !newEmployeeData.name.trim() ||
      newEmployeeData.password.length !== 6 ||
      !newEmployeeData.store ||
      !newEmployeeData.role
    ) {
      showToast('請填寫完整資料，且密碼必須為 6 碼數字！');
      return;
    }
    if (
      employees.some((emp) => emp.password === newEmployeeData.password) ||
      pendingAccounts.some((pa) => pa.password === newEmployeeData.password)
    ) {
      showToast('此密碼已被使用，請更換其他密碼！');
      return;
    }
    await addDoc(collection(db, 'employees'), {
      name: newEmployeeData.name.trim(),
      store: newEmployeeData.store,
      role: newEmployeeData.role,
      password: newEmployeeData.password,
      avatarId: '',
      avatarUrl: '',
      examRecords: {},
      dailyRecords: {},
      createdAt: Date.now(),
    });
    setIsAddingEmployee(false);
    setNewEmployeeData({ name: '', store: '', role: '', password: '' });
    showToast('人員新增成功！');
  }

  const handleCategoryDrop = async (targetId) => {
    if (!draggedCatId || draggedCatId === targetId) return;
    const draggedIdx = categories.findIndex((c) => c.id === draggedCatId);
    const targetIdx = categories.findIndex((c) => c.id === targetId);
    const newCategories = [...categories];
    const [moved] = newCategories.splice(draggedIdx, 1);
    newCategories.splice(targetIdx, 0, moved);
    for (let i = 0; i < newCategories.length; i++)
      await updateDoc(doc(db, 'examCategories', newCategories[i].id), {
        order: i,
      });
    setDraggedCatId(null);
  };

  const handleStoreDrop = async (targetId) => {
    if (!draggedStoreId || draggedStoreId === targetId) return;
    const draggedIdx = stores.findIndex((s) => s.id === draggedStoreId);
    const targetIdx = stores.findIndex((s) => s.id === targetId);
    const newStores = [...stores];
    const [moved] = newStores.splice(draggedIdx, 1);
    newStores.splice(targetIdx, 0, moved);
    for (let i = 0; i < newStores.length; i++)
      await updateDoc(doc(db, 'stores', newStores[i].id), { order: i });
    setDraggedStoreId(null);
  };

  const handleExamDrop = async (targetId) => {
    if (!draggedExamId || draggedExamId === targetId) return;
    const draggedIdx = activeExams.findIndex((e) => e.id === draggedExamId);
    const targetIdx = activeExams.findIndex((e) => e.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const newExams = [...activeExams];
    const [moved] = newExams.splice(draggedIdx, 1);
    newExams.splice(targetIdx, 0, moved);
    for (let i = 0; i < newExams.length; i++)
      await updateDoc(doc(db, 'exams', newExams[i].id), { order: i });
    setDraggedExamId(null);
  };

  let missingGradesCount = 0;
  let pendingApprovalsCount = 0;
  if (isGrader || canEdit) {
    const gradeTargetEmps = canEdit
      ? employees.filter((e) => e.id !== currentUserData?.id)
      : employees.filter((e) => e.store === currentUserData?.store && e.id !== currentUserData?.id);
    gradeTargetEmps.forEach((emp) => {
      const applicableItems = dailyItems.filter((item) =>
        (item.targetRoles || []).includes(emp.role)
      );
      const dateRecords = emp.dailyRecords?.[selectedRecordDate] || {};
      const sc = dateRecords.scores || dateRecords;
      const hasApplicable = applicableItems.length > 0;
      const isCompletedToday =
        hasApplicable &&
        applicableItems.every((item) => sc[item.id] !== undefined);
      if (hasApplicable && !isCompletedToday) missingGradesCount++;

      if (canEdit) {
        Object.values(emp.dailyRecords || {}).forEach((rec) => {
          if (rec.status === 'pending') pendingApprovalsCount++;
        });
      }
    });
  }
  const recordsBadgeCount = canEdit
    ? missingGradesCount + pendingApprovalsCount
    : isGrader
    ? missingGradesCount
    : 0;

  let isPreviousPassed = true;
  const enrichedCategories = categories.map((cat, idx) => {
    const catExams = exams.filter(
      (e) => e.categoryId === cat.id || (!e.categoryId && idx === 0)
    );
    let passedCount = 0;
    catExams.forEach((exam) => {
      const record = currentUserData?.examRecords?.[exam.id];
      if (
        record === 'passed' ||
        (record && typeof record === 'object' && record.status === 'passed')
      )
        passedCount++;
    });
    const total = catExams.length;
    // 計算真實分數：各題 pointValue 加總，已通過才得分
    let totalPoints = 0;
    let earnedPoints = 0;
    catExams.forEach((exam) => {
      const pv = exam.pointValue ?? 10;
      totalPoints += pv;
      const rec = currentUserData?.examRecords?.[exam.id];
      if (rec === 'passed' || (rec && typeof rec === 'object' && rec.status === 'passed')) {
        earnedPoints += pv;
      }
    });
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
    const passingScore = cat.passingScore ?? 60;
    const allAnswered = catExams.every((exam) => {
      const rec = currentUserData?.examRecords?.[exam.id];
      return rec && (rec === 'passed' || rec === 'failed' || (typeof rec === 'object' && (rec.status === 'passed' || rec.status === 'failed' || rec.status === 'pending_proctor')));
    });
    const isPassed = total === 0 || (allAnswered && score >= passingScore);
    const isUnlocked = canEdit || isPreviousPassed;
    isPreviousPassed = isPassed;
    return {
      ...cat,
      progress: { total, passed: passedCount, score, isPassed, allAnswered, passingScore },
      isUnlocked,
    };
  });

  const activeCategoryData =
    enrichedCategories.find((c) => c.id === activeCategoryId) || null;
  const activeExams = exams.filter(
    (e) =>
      e.categoryId === activeCategoryId ||
      (!e.categoryId && enrichedCategories[0]?.id === activeCategoryId)
  );

  const handleAnswerChange = (examId, value) =>
    setCurrentAnswers((prev) => ({ ...prev, [examId]: value }));

  const submitAnswer = async (exam) => {
    if (!currentUserData) return;
    if (!canEdit && !selectedProctor) {
      showToast('請先在上方選擇本場考官！');
      return;
    }
    let status = 'failed';
    const userAnswer = currentAnswers[exam.id];

    if (exam.type === 'tf' || exam.type === 'mc') {
      if (userAnswer === exam.correctAnswer) status = 'passed';
    } else if (exam.type === 'fill') {
      status = 'pending_proctor';
    } else if (exam.type === 'essay') {
      status = 'pending_proctor';
    }

    const newRecords = currentUserData.examRecords
      ? { ...currentUserData.examRecords }
      : {};
    const prevMistakes = newRecords[exam.id]?.mistakes || 0;
    const newMistakes = status === 'failed' ? prevMistakes + 1 : prevMistakes;
    const pointValue = exam.pointValue ?? 10;

    newRecords[exam.id] = {
      ...(typeof newRecords[exam.id] === 'object' ? newRecords[exam.id] : {}),
      status,
      timestamp: Date.now(),
      title: exam.title,
      mistakes: newMistakes,
      approver: selectedProctor,
      score: status === 'passed' ? pointValue : 0,
      pointValue,
    };

    if (exam.type === 'essay' || exam.type === 'fill') {
      newRecords[exam.id].userAnswer = userAnswer || '';
    }

    await updateDoc(doc(db, 'employees', currentUserData.id), {
      examRecords: newRecords,
    });

    if (status === 'passed') showToast('✅ 答對了！已記錄通過。');
    else if (status === 'pending_proctor')
      showToast('📝 已送出作答，請等待考官審核。');
    else showToast('❌ 答錯了！請再接再厲。');

    setCurrentAnswers((prev) => {
      const n = { ...prev };
      delete n[exam.id];
      return n;
    });
  };

  const submitProctorSignoff = async () => {
    if (!currentUserData || !proctorModal.proctorName.trim()) return;
    const exam = exams.find((e) => e.id === proctorModal.examId);
    if (!exam) return;
    const newRecords = currentUserData.examRecords
      ? { ...currentUserData.examRecords }
      : {};
    const prevMistakes = newRecords[exam.id]?.mistakes || 0;
    newRecords[exam.id] = {
      ...(typeof newRecords[exam.id] === 'object' ? newRecords[exam.id] : {}),
      status: 'passed',
      approver: proctorModal.proctorName,
      timestamp: Date.now(),
      title: exam.title,
      mistakes: prevMistakes,
    };
    await updateDoc(doc(db, 'employees', currentUserData.id), {
      examRecords: newRecords,
    });
    showToast(`已由 ${String(proctorModal.proctorName)} 考官核准通過！`);
    setProctorModal({ show: false, examId: null, proctorName: '' });
  };

  const isProfileTabAdmin = canEdit;
  const baseEmployees = isProfileTabAdmin
    ? employees
    : employees.filter((e) => e.name === currentUserName);

  const filteredDisplayEmployees = baseEmployees.filter((emp) => {
    if (!isProfileTabAdmin) return true;
    const matchStore =
      activeStoreFilter === 'all' || emp.store === activeStoreFilter;
    const matchSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.store?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStore && matchSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col justify-center items-center px-4 py-10 font-sans relative overflow-hidden">
        <style>{customStyles}</style>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#D85E38] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[40px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] relative animate-in fade-in duration-500 border border-white/10 z-10">
          <div
            onClick={() => setShowSecretModal(true)}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FCEEEA] rounded-full mx-auto mb-6 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 overflow-hidden"
          >
            {appConfig.logoUrl ? (
              <img src={appConfig.logoUrl} className="w-full h-full object-cover rounded-full" />
            ) : (
              <ShieldCheck c="w-8 h-8 sm:w-10 sm:h-10 text-[#D85E38]" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-center text-[#1A1A1A] mb-2 tracking-tight">
            {authMode === 'login' ? (appConfig.title || '學習系統') : '申請帳號'}
          </h1>
          <p className="text-center text-gray-400 text-xs tracking-widest mb-8 font-medium">
            {authMode === 'login'
              ? '請輸入管理資訊以進入'
              : '請填寫申請資料，等待總部審核'}
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div className="flex flex-col items-center mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPickerTarget('register');
                    setShowAvatarPicker(true);
                  }}
                  className="relative w-20 h-20 rounded-full bg-[#F0F2F5] flex items-center justify-center overflow-hidden cursor-pointer group shadow-sm border-2 border-white hover:ring-2 hover:ring-[#D85E38]/50 transition-all"
                >
                  {regSelectedAvatar ? (
                    <AvatarDisplay avatarId={regSelectedAvatar} />
                  ) : (
                    <Camera c="w-8 h-8 text-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <span className="text-white text-[10px] font-bold">選擇頭貼</span>
                  </div>
                </button>
                <p className="text-[10px] text-gray-400 font-bold mt-2">點擊選擇頭貼</p>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">
                {authMode === 'login' ? '登入門店' : '申請門店'}
              </label>
              <div className="relative">
                <select
                  name="store"
                  required
                  defaultValue=""
                  className="w-full p-4 bg-[#F0F2F5] rounded-[20px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#D85E38]/50 appearance-none text-sm sm:text-base border-none"
                >
                  <option value="" disabled>
                    請選擇門店...
                  </option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.name}>
                      {String(s.name)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronRight c="w-4 h-4" />
                </div>
              </div>
            </div>

            {authMode === 'register' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">
                      申請職位
                    </label>
                    <div className="relative">
                      <select
                        name="jobRole"
                        required
                        defaultValue=""
                        className="w-full p-3.5 bg-[#F0F2F5] rounded-[20px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#D85E38]/50 appearance-none text-xs border-none"
                      >
                        <option value="" disabled>
                          請選擇...
                        </option>
                        {jobRoles.map((role) => (
                          <option key={role} value={role}>
                            {String(role)}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        <ChevronRight c="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">
                      真實姓名
                    </label>
                    <input
                      type="text"
                      name="managerName"
                      required
                      className="w-full p-3.5 bg-[#F0F2F5] rounded-[20px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-xs border-none"
                      placeholder="輸入姓名"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">
                      出生年月日
                    </label>
                    <input
                      type="date"
                      name="birthdate"
                      required
                      className="w-full px-3 py-3.5 bg-[#F0F2F5] rounded-[20px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-xs border-none"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">
                      到職日
                    </label>
                    <input
                      type="date"
                      name="hireDate"
                      required
                      className="w-full px-3 py-3.5 bg-[#F0F2F5] rounded-[20px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-xs border-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">
                      聯絡電話
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full p-3.5 bg-[#F0F2F5] rounded-[20px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-xs border-none"
                      placeholder="09XX"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">
                      人格特質
                    </label>
                    <div className="relative">
                      <select
                        name="mbti"
                        required
                        defaultValue=""
                        className="w-full p-3.5 bg-[#F0F2F5] rounded-[20px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#D85E38]/50 appearance-none text-xs border-none"
                      >
                        <option value="" disabled>
                          請選擇...
                        </option>
                        <option value="E">E型 (外向)</option>
                        <option value="I">I型 (內向)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        <ChevronRight c="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                className={`block text-[11px] font-bold mb-1.5 ml-1 transition-colors ${
                  authError ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                {authMode === 'login' ? '管理密碼' : '設定密碼'}
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                maxLength={6}
                value={authPassword}
                onChange={(e) => {
                  setAuthError('');
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 6) setAuthPassword(val);
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full p-4 rounded-[20px] font-bold text-gray-700 outline-none tracking-widest transition-all duration-300 text-sm sm:text-base border-none ${
                  authError
                    ? 'bg-red-50 focus:ring-2 focus:ring-red-400'
                    : 'bg-[#F0F2F5] focus:ring-2 focus:ring-[#D85E38]/50'
                }`}
                placeholder={
                  authMode === 'login' ? '輸入6碼密碼' : '設定6碼密碼'
                }
              />
              {authError && (
                <p className="text-red-500 text-[10px] font-bold mt-2 ml-2 flex items-center animate-in slide-in-from-top-1">
                  <XCircle c="w-3 h-3 mr-1" />
                  {String(authError)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isCheckingGPS}
              className={`w-full bg-[#D85E38] text-white py-4 rounded-full font-bold shadow-[0_8px_20px_rgba(216,94,56,0.3)] transition-all mt-4 tracking-widest ${
                isCheckingGPS
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-[#C25330] hover:shadow-[0_10px_25px_rgba(216,94,56,0.4)] hover:-translate-y-0.5'
              }`}
            >
              {isCheckingGPS
                ? '處理中...'
                : authMode === 'login'
                ? '進入系統'
                : '送出申請'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthPassword('');
                setAuthError('');
              }}
              className="text-gray-400 font-bold text-xs tracking-widest hover:text-[#D85E38] transition-colors"
            >
              {authMode === 'login'
                ? '尚未開通？申請帳號'
                : '已有帳號？返回登入'}
            </button>
          </div>

          {showSecretModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
              <div className="bg-[#242424] p-8 rounded-[32px] w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
                <div className="w-14 h-14 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShieldCheck c="w-6 h-6 text-[#D85E38]" />
                </div>
                <h3 className="font-black text-xl mb-1 text-white">總部登入</h3>
                <p className="text-[10px] text-gray-400 mb-6 font-bold tracking-widest">
                  SUPER ADMIN
                </p>
                <input
                  type="password"
                  autoFocus
                  value={secretPwd}
                  onChange={(e) =>
                    setSecretPwd(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  className="w-full p-4 bg-white/5 rounded-[20px] mb-6 text-center tracking-widest outline-none focus:ring-2 focus:ring-[#D85E38] font-bold text-white border-none"
                  placeholder="輸入密碼"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSecretModal(false);
                      setSecretPwd('');
                    }}
                    className="flex-1 py-3.5 bg-white/10 text-white rounded-full font-bold text-gray-300 hover:bg-white/20 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      if (secretPwd === '0204') {
                        setIsAuthenticated(true);
                        setCurrentUserRole('super_admin');
                        setCurrentUserName('總部管理員');
                        setShowSecretModal(false);
                        setAuthMode('login');
                        setSecretPwd('');
                      } else {
                        showToast('密碼錯誤！');
                        setSecretPwd('');
                      }
                    }}
                    className="flex-1 py-3.5 bg-[#D85E38] text-white rounded-full font-bold hover:bg-[#C25330] transition-colors shadow-lg shadow-[#D85E38]/20"
                  >
                    登入
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] bg-[#1A1A1A] flex justify-center font-sans overflow-hidden">
      <style>{customStyles}</style>

      {/* 系統通知彈出視窗 */}
      {showNotificationModal && (canEdit || isGrader) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col border-none">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-[#1A1A1A] flex items-center">
                <Bell c="w-6 h-6 mr-2 text-[#D85E38]" /> 系統通知
              </h3>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
              >
                <XCircle c="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-4 pr-2 hide-scrollbar">
              {pendingAccounts.length > 0 && (
                <div
                  onClick={() => {
                    setShowNotificationModal(false);
                    setActiveTab('pending');
                  }}
                  className="bg-[#F0F2F5] p-5 rounded-[24px] border-none soft-shadow cursor-pointer hover:bg-[#E3E5E8] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#FCEEEA] p-2.5 rounded-full">
                        <User c="w-5 h-5 text-[#D85E38]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1A1A1A] text-sm">
                          新進人員審核
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          有 {pendingAccounts.length} 筆新帳號等待開通
                        </p>
                      </div>
                    </div>
                    <ChevronRight c="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )}
              {pendingRetests.length > 0 && (
                <div className="bg-[#F0F2F5] p-5 rounded-[24px] border-none soft-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-100 p-2.5 rounded-full">
                      <RefreshCw c="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1A1A1A] text-sm">
                        重新測驗申請
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        有 {pendingRetests.length} 筆重測申請等待處理
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto hide-scrollbar">
                    {pendingRetests.map((rt, idx) => (
                      <div key={`${rt.empId}-${rt.examId}`} className="bg-white p-3.5 rounded-xl flex items-center justify-between shadow-sm border border-gray-100">
                        <div>
                          <p className="text-sm font-bold text-[#1A1A1A]">{rt.empName}</p>
                          <p className="text-[11px] text-gray-400">{rt.store} · {rt.examTitle}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const emp = employees.find(e => e.id === rt.empId);
                            if (!emp) return;
                            const newRecords = { ...emp.examRecords };
                            delete newRecords[rt.examId];
                            await updateDoc(doc(db, 'employees', rt.empId), {
                              examRecords: newRecords,
                            });
                            showToast(`已核准 ${rt.empName} 重考：${rt.examTitle}`);
                          }}
                          className="px-3 py-1.5 bg-[#2F7E5B] text-white rounded-full text-[11px] font-bold hover:bg-[#256348] transition-colors shadow-sm"
                        >
                          核准重考
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pendingAccounts.length === 0 && pendingRetests.length === 0 && (
                <div className="text-center py-10 bg-[#F0F2F5] rounded-[24px]">
                  <CheckCircle2 c="w-10 h-10 text-[#2F7E5B] mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400 text-sm font-bold">
                    目前沒有新的系統通知
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GPS 設定彈出視窗 */}
      {showGpsModal && canEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col border-none">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-[#1A1A1A] flex items-center">
                <MapPin c="w-6 h-6 mr-2 text-[#D85E38]" /> GPS 定位設定
              </h3>
              <button
                onClick={() => setShowGpsModal(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
              >
                <XCircle c="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 font-bold leading-relaxed px-2">
              設定後，該門店員工登入時須距離此座標 100
              公尺內。未設定座標的門店將不受限制。
            </p>
            <div className="overflow-y-auto flex-1 space-y-4 pr-2 hide-scrollbar">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="bg-[#F0F2F5] p-5 rounded-[24px] border-none soft-shadow"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[#1A1A1A] text-sm">
                      {String(store.name)}
                    </h4>
                    <button
                      onClick={() => {
                        if (!navigator.geolocation) {
                          showToast('您的裝置不支援定位功能');
                          return;
                        }
                        showToast('定位中...');
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            updateDoc(doc(db, 'stores', store.id), {
                              lat: pos.coords.latitude,
                              lng: pos.coords.longitude,
                            });
                            showToast(`${String(store.name)} 座標已更新！`);
                          },
                          (err) =>
                            showToast('無法取得定位，請確認權限是否開啟'),
                          {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0,
                          }
                        );
                      }}
                      className="text-[10px] bg-white text-[#D85E38] border border-[#FCEEEA] px-3 py-1.5 rounded-full font-bold hover:bg-[#FCEEEA] transition-colors shadow-sm"
                    >
                      抓取目前位置
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1.5 ml-1">
                        緯度 (Lat)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={store.lat || ''}
                        onChange={(e) =>
                          updateDoc(doc(db, 'stores', store.id), {
                            lat: parseFloat(e.target.value) || null,
                          })
                        }
                        className="w-full p-3 bg-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#D85E38]/30 border-none shadow-sm"
                        placeholder="未設定"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1.5 ml-1">
                        經度 (Lng)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={store.lng || ''}
                        onChange={(e) =>
                          updateDoc(doc(db, 'stores', store.id), {
                            lng: parseFloat(e.target.value) || null,
                          })
                        }
                        className="w-full p-3 bg-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#D85E38]/30 border-none shadow-sm"
                        placeholder="未設定"
                      />
                    </div>
                  </div>
                  {store.lat && store.lng && (
                    <div className="mt-4 text-[10px] text-[#2F7E5B] bg-[#F1F8F5] p-2 rounded-lg font-bold flex items-center justify-center">
                      <CheckCircle2 c="w-3 h-3 mr-1" /> 已啟用距離防護 (100m內)
                    </div>
                  )}
                </div>
              ))}
              {stores.length === 0 && (
                <p className="text-center text-gray-400 text-xs py-8 font-bold bg-[#F0F2F5] rounded-[24px]">
                  目前無門店資料，請先新增門店
                </p>
              )}
            </div>
            <div className="pt-4 mt-2">
              <button
                onClick={() => setShowGpsModal(false)}
                className="w-full py-4 bg-[#1A1A1A] text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform"
              >
                完成設定
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-[#1A1A1A] relative h-full flex flex-col overflow-hidden sm:border-x border-[#333]">
        <header className="bg-transparent pt-10 pb-6 px-6 flex justify-between items-center z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#D85E38] p-2.5 rounded-full text-white shadow-lg shadow-[#D85E38]/30 overflow-hidden w-10 h-10 flex items-center justify-center">
              {appConfig.logoUrl ? (
                <img src={appConfig.logoUrl} className="w-full h-full object-cover rounded-full" />
              ) : (
                <Store c="w-5 h-5" />
              )}
            </div>
            <h1 className="font-black text-white tracking-tight text-2xl">
              {canEdit ? (appConfig.title ? `${appConfig.title} 後台` : '總部學習') : (appConfig.title || '門店學習')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => { setEditAppTitle(appConfig.title || ''); setShowAppConfigModal(true); }}
                className="bg-white/10 p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-white/20 transition-all border border-white/5"
                title="系統設定"
              >
                <Settings c="w-4 h-4" />
              </button>
            )}
            {(canEdit || (isGrader && pendingRetests.length > 0)) && (
              <button
                onClick={() => setShowNotificationModal(true)}
                className="relative bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-all group cursor-pointer border border-white/5"
                title="系統通知"
              >
                <Bell
                  c={`w-4 h-4 text-gray-300 group-hover:text-white ${
                    totalAdminNotifications > 0 ? 'text-white' : ''
                  }`}
                />
                {totalAdminNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#D85E38] rounded-full border-2 border-[#1A1A1A]"></span>
                )}
              </button>
            )}
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setAuthPassword('');
                setHasShownLoginNotice(false);
              }}
              className="bg-white/10 p-2.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-white/20 transition-all border border-white/5"
              title="登出"
            >
              <LogOut c="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="bg-[#F5F6F8] flex-1 w-full rounded-t-[40px] flex flex-col overflow-hidden relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <main className="flex-1 overflow-y-auto px-5 pt-8 pb-6 relative z-0 hide-scrollbar">
            {/* 新進人員審核 (僅後台可見) */}
            {activeTab === 'pending' && canEdit && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-6 mt-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="p-2 bg-white rounded-full soft-shadow text-gray-500 hover:text-[#1A1A1A] transition-colors border-none"
                  >
                    <ChevronLeft c="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
                    新進人員審核
                    <span className="text-[#D85E38] ml-2">
                      {pendingAccounts.length}
                    </span>
                  </h2>
                </div>
                {pendingAccounts.length === 0 ? (
                  <div className="bg-white p-10 rounded-[32px] soft-shadow text-center flex flex-col items-center border-none">
                    <div className="w-16 h-16 bg-[#F1F8F5] rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 c="w-8 h-8 text-[#2F7E5B]" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">
                      目前所有人員皆已審核完畢
                    </p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="mt-6 bg-[#F0F2F5] text-gray-600 px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#E3E5E8] transition-colors"
                    >
                      返回
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAccounts.map((pa) => (
                      <div
                        key={pa.id}
                        className="p-6 bg-white rounded-[28px] soft-shadow relative overflow-hidden border-none"
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#F0F2F5] rounded-full flex items-center justify-center overflow-hidden shrink-0">
                              {pa.avatarUrl ? (
                                <img
                                  src={pa.avatarUrl}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User c="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-black text-[#1A1A1A] text-lg">
                                {String(pa.name)}
                              </h4>
                              <p className="text-[11px] text-gray-400 font-bold mt-1 tracking-widest">
                                {String(pa.store)}{' '}
                                <span className="text-[#D85E38]">
                                  {String(pa.requestedRole)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              await deleteDoc(
                                doc(db, 'pendingAccounts', pa.id)
                              );
                              await addDoc(collection(db, 'employees'), {
                                name: pa.name,
                                role: pa.requestedRole,
                                store: pa.store,
                                password: pa.password || '',
                                birthdate: pa.birthdate || '',
                                hireDate: pa.hireDate || '',
                                phone: pa.phone || '',
                                mbti: pa.mbti || '',
                                avatarId: pa.avatarId || '',
                                avatarUrl: pa.avatarUrl || '',
                                examRecords: {},
                                createdAt: Date.now(),
                              });
                              showToast('已加入名單！');
                              if (pendingAccounts.length === 1)
                                setActiveTab('profile');
                            }}
                            className="flex-1 bg-[#1A1A1A] text-white py-3.5 rounded-full text-sm font-bold shadow-lg hover:bg-black active:scale-95 transition-all"
                          >
                            核准開通
                          </button>
                          <button
                            onClick={async () => {
                              await deleteDoc(
                                doc(db, 'pendingAccounts', pa.id)
                              );
                              if (pendingAccounts.length === 1)
                                setActiveTab('profile');
                            }}
                            className="bg-[#F0F2F5] text-gray-500 px-6 py-3.5 rounded-full text-sm font-bold hover:bg-gray-300 transition-colors"
                          >
                            拒絕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- 考試列表 --- */}
            {activeTab === 'exams' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-2 px-1 mt-2">
                  <div>
                    <h2 className="font-black text-[#1A1A1A] text-3xl tracking-tight mb-2">
                      考試項目<span className="text-[#D85E38]">.</span>
                    </h2>
                    {!canEdit && (
                      <div className="inline-flex items-center text-[11px] text-gray-500 font-bold bg-white/60 px-3 py-1.5 rounded-lg shadow-sm border border-white/50">
                        <span className="text-[#D85E38] mr-1.5 text-xs">※</span>{' '}
                        依照題型指示進行作答
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setActiveTab('exam-grading')}
                      className="bg-[#FCEEEA] text-[#D85E38] px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform flex items-center gap-2 font-bold text-xs"
                      title="考試評分紀錄"
                    >
                      <ClipboardCheck c="w-4 h-4" /> 評分紀錄
                    </button>
                  )}
                </div>

                {!canEdit && !examStarted ? (
                  <div className="bg-white p-8 rounded-[32px] soft-shadow mt-6 flex flex-col items-center justify-center text-center border border-gray-100 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-[#FCEEEA] rounded-full flex items-center justify-center mb-6">
                      <User c="w-10 h-10 text-[#D85E38]" />
                    </div>
                    <h3 className="font-black text-xl text-[#1A1A1A] mb-2">
                      準備開始測驗
                    </h3>
                    <p className="text-xs text-gray-500 font-bold mb-4">
                      請先選擇本場次的主考官，選定後即可進入題庫作答。
                    </p>
                    {(() => {
                      const activeCat = categories.find((c) => c.id === activeCategoryId);
                      const tl = activeCat?.timeLimit;
                      const proctorTypes = ['fill', 'essay', 'oral'];
                      const timedCount = activeExams.filter((e) => !proctorTypes.includes(e.type)).length;
                      const proctorCount = activeExams.filter((e) => proctorTypes.includes(e.type)).length;
                      return tl && tl > 0 ? (
                        <div className="w-full bg-[#EBF2FF] p-4 rounded-xl mb-6 text-left">
                          <p className="text-sm font-black text-[#3B82F6] mb-1">⏱ 限時 {tl} 分鐘</p>
                          <p className="text-[11px] text-[#3B82F6]/70 font-bold">
                            計時題目 {timedCount} 題（是非 / 選擇）
                            {proctorCount > 0 && `，不計時 ${proctorCount} 題（需考官）`}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-4" />
                      );
                    })()}

                    <div className="w-full text-left mb-8">
                      <label className="text-[11px] font-bold text-gray-400 block mb-2 ml-1">
                        本場考官姓名
                      </label>
                      <div className="relative">
                        <select
                          value={selectedProctor}
                          onChange={(e) => setSelectedProctor(e.target.value)}
                          className="w-full bg-[#F0F2F5] p-4 rounded-[20px] text-sm font-bold text-[#1A1A1A] outline-none border-none focus:ring-2 focus:ring-[#D85E38]/50 appearance-none"
                        >
                          <option value="">請選擇...</option>
                          {employees
                            .filter(
                              (e) =>
                                e.store === currentUserData?.store &&
                                e.id !== currentUserData?.id
                            )
                            .map((e) => (
                              <option key={e.id} value={e.name}>
                                {String(e.name)} ({String(e.role)})
                              </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                          <ChevronRight c="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!selectedProctor) {
                          showToast('請先選擇考官！');
                          return;
                        }
                        setExamStarted(true);
                        setExamStartTime(Date.now());
                        setExamTimeUp(false);
                        setExamTimeRemaining(null);
                      }}
                      className="w-full bg-[#D85E38] text-white py-4 rounded-full font-bold shadow-lg hover:bg-[#C25330] transition-transform active:scale-95 tracking-widest"
                    >
                      開始考試
                    </button>
                  </div>
                ) : (
                  <>
                    {!canEdit && examStarted && (
                      <div className="bg-white p-3 rounded-[20px] shadow-sm border border-gray-100 flex justify-between items-center mb-4 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#FCEEEA] p-1.5 rounded-full">
                            <User c="w-3.5 h-3.5 text-[#D85E38]" />
                          </div>
                          <span className="text-xs font-bold text-gray-600">
                            考官:{' '}
                            <span className="text-[#1A1A1A]">
                              {String(selectedProctor)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {examTimeRemaining !== null && (
                            <span className={`text-xs font-black px-3 py-1.5 rounded-full ${
                              examTimeUp
                                ? 'bg-red-100 text-red-600 animate-pulse'
                                : examTimeRemaining < 60000
                                ? 'bg-red-100 text-red-600'
                                : examTimeRemaining < 180000
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-[#EBF2FF] text-[#3B82F6]'
                            }`}>
                              {examTimeUp ? '⏰ 時間到' : `⏱ ${Math.floor(examTimeRemaining / 60000)}:${String(Math.floor((examTimeRemaining % 60000) / 1000)).padStart(2, '0')}`}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setExamStarted(false);
                              setSelectedProctor('');
                              setExamStartTime(null);
                              setExamTimeRemaining(null);
                              setExamTimeUp(false);
                            }}
                            className="text-[10px] text-gray-500 font-bold bg-[#F0F2F5] px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            結束 / 更換
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="relative mt-4 pt-2 mb-4">
                      <button
                        onClick={() => {
                          if (categoryTabsRef.current) {
                            categoryTabsRef.current.scrollBy({ left: -150, behavior: 'smooth' });
                          }
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                        style={{ marginLeft: '-4px' }}
                      >
                        <ChevronLeft c="w-4 h-4 text-gray-600" />
                      </button>

                      <div ref={categoryTabsRef} className="flex overflow-x-auto hide-scrollbar mx-8">
                        {enrichedCategories.map((cat, idx) => (
                          <button
                            key={cat.id}
                            draggable={canEdit}
                            onDragStart={() => {
                              if (canEdit) setDraggedCatId(cat.id);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (canEdit) handleCategoryDrop(cat.id);
                            }}
                            onClick={() => {
                              if (cat.isUnlocked) setActiveCategoryId(cat.id);
                              else showToast('🔒 請先通過前一階段的所有測驗！');
                            }}
                            className={`px-5 py-3.5 font-bold text-[14px] whitespace-nowrap transition-all rounded-t-[16px] border border-b-0 flex items-center gap-2 relative top-[1px] ${
                              activeCategoryId === cat.id
                                ? 'bg-white text-[#5C6AC4] border-gray-200 z-10 pb-4'
                                : 'bg-[#F0F2F5] text-gray-400 border-transparent hover:bg-gray-100'
                            } ${
                              !cat.isUnlocked
                                ? 'opacity-60 bg-gray-50 text-gray-300 cursor-not-allowed'
                                : ''
                            } ${
                              draggedCatId === cat.id
                                ? 'opacity-40 border-dashed border-[#5C6AC4]'
                                : ''
                            }`}
                          >
                            {String(cat.name)}{' '}
                            {!cat.isUnlocked && <Lock c="w-3 h-3" />}
                          </button>
                        ))}
                        {canEdit && (
                          <button
                            onClick={() => setIsAddingCategory(true)}
                            className="px-4 py-3.5 text-gray-400 hover:text-[#5C6AC4] border-b border-gray-200 flex-1 text-left flex items-center min-w-[100px]"
                          >
                            <PlusCircle c="w-4 h-4 mr-1" />{' '}
                            <span className="text-[12px] font-bold">
                              新增分類
                            </span>
                          </button>
                        )}
                        {!canEdit && (
                          <div className="flex-1 border-b border-gray-200"></div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (categoryTabsRef.current) {
                            categoryTabsRef.current.scrollBy({ left: 150, behavior: 'smooth' });
                          }
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                        style={{ marginRight: '-4px' }}
                      >
                        <ChevronRight c="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {canEdit && isAddingCategory && (
                      <div className="mb-4 bg-white p-4 rounded-[16px] soft-shadow flex gap-2 border border-gray-100 animate-in fade-in">
                        <input
                          type="text"
                          autoFocus
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-sm"
                          placeholder="輸入新分類名稱..."
                        />
                        <button
                          onClick={async () => {
                            if (newCategoryName.trim()) {
                              try {
                                const newDoc = await addDoc(
                                  collection(db, 'examCategories'),
                                  {
                                    name: newCategoryName.trim(),
                                    order: categories.length,
                                    createdAt: Date.now(),
                                  }
                                );
                                setIsAddingCategory(false);
                                setNewCategoryName('');
                                setActiveCategoryId(newDoc.id);
                                showToast('新分類已建立');
                              } catch (err) {
                                console.error('新增分類失敗:', err);
                                showToast('新增分類失敗：' + (err.message || '請檢查網路或權限'));
                              }
                            }
                          }}
                          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
                        >
                          儲存
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategoryName('');
                          }}
                          className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-xs font-bold"
                        >
                          取消
                        </button>
                      </div>
                    )}

                    {canEdit && activeCategoryData && !isAddingCategory && (
                      <div className="mb-5 bg-white p-4 rounded-[20px] soft-shadow flex items-center justify-between border border-gray-100">
                        {editingCategoryId === activeCategoryData.id ? (
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-sm"
                                placeholder="分類名稱"
                              />
                              <div className="flex items-center gap-1 bg-[#FCEEEA] px-3 rounded-lg">
                                <span className="text-[10px] font-bold text-[#D85E38] whitespace-nowrap">及格分數</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={editCategoryPassingScore}
                                  onChange={(e) => setEditCategoryPassingScore(Number(e.target.value))}
                                  className="w-12 p-1 bg-transparent outline-none font-black text-[#D85E38] text-sm text-center"
                                />
                                <span className="text-[10px] font-bold text-[#D85E38]">分</span>
                              </div>
                              <div className="flex items-center gap-1 bg-[#EBF2FF] px-3 rounded-lg">
                                <span className="text-[10px] font-bold text-[#3B82F6] whitespace-nowrap">限時</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="999"
                                  value={editCategoryTimeLimit}
                                  onChange={(e) => setEditCategoryTimeLimit(Number(e.target.value))}
                                  className="w-12 p-1 bg-transparent outline-none font-black text-[#3B82F6] text-sm text-center"
                                />
                                <span className="text-[10px] font-bold text-[#3B82F6]">分鐘</span>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (editCategoryName.trim()) {
                                  try {
                                    await updateDoc(
                                      doc(
                                        db,
                                        'examCategories',
                                        activeCategoryData.id
                                      ),
                                      { name: editCategoryName.trim(), passingScore: Number(editCategoryPassingScore) || 60, timeLimit: Number(editCategoryTimeLimit) || 0 }
                                    );
                                    setEditingCategoryId(null);
                                    showToast('分類名稱及及格分數已更新');
                                  } catch (err) {
                                    console.error('更新分類失敗:', err);
                                    showToast('更新分類失敗：' + (err.message || '請檢查網路或權限'));
                                  }
                                }
                              }}
                              className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-xs font-bold"
                            >
                              儲存
                            </button>
                            <button
                              onClick={() => setEditingCategoryId(null)}
                              className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-xs font-bold"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-black text-[#1A1A1A] text-[15px] flex items-center flex-wrap gap-2">
                              {String(activeCategoryData.name)}
                              <span className="text-[10px] bg-[#F0F2F5] text-gray-500 px-2.5 py-1 rounded-full">
                                {activeExams.length} 題
                              </span>
                              <span className="text-[10px] bg-[#FCEEEA] text-[#D85E38] px-2.5 py-1 rounded-full font-bold">
                                及格 {activeCategoryData.passingScore ?? 60} 分
                              </span>
                              {(activeCategoryData.timeLimit ?? 0) > 0 && (
                                <span className="text-[10px] bg-[#EBF2FF] text-[#3B82F6] px-2.5 py-1 rounded-full font-bold">
                                  限時 {activeCategoryData.timeLimit} 分鐘
                                </span>
                              )}
                            </h3>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingCategoryId(activeCategoryData.id);
                                  setEditCategoryName(activeCategoryData.name);
                                  setEditCategoryPassingScore(activeCategoryData.passingScore ?? 60);
                                  setEditCategoryTimeLimit(activeCategoryData.timeLimit ?? 0);
                                }}
                                className="p-2 text-gray-400 hover:text-[#5C6AC4] bg-gray-50 rounded-full transition-colors"
                              >
                                <Edit c="w-4 h-4" />
                              </button>
                              {deletingCategoryId === activeCategoryData.id ? (
                                <button
                                  onClick={async () => {
                                    await deleteDoc(
                                      doc(
                                        db,
                                        'examCategories',
                                        activeCategoryData.id
                                      )
                                    );
                                    setDeletingCategoryId(null);
                                    setActiveCategoryId(
                                      categories.length > 1
                                        ? categories.find(
                                            (c) =>
                                              c.id !== activeCategoryData.id
                                          ).id
                                        : null
                                    );
                                    showToast('分類已刪除');
                                  }}
                                  className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in"
                                >
                                  確定刪除?
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setDeletingCategoryId(activeCategoryData.id)
                                  }
                                  className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full transition-colors"
                                >
                                  <Trash2 c="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {canEdit && activeCategoryData && (
                      <div className="bg-white p-3 rounded-[24px] soft-shadow border-none mb-5">
                        <button
                          onClick={async () => {
                            try {
                              // 將現有考題的 order 全部 +1，讓新考題排在最上方
                              for (const e of activeExams) {
                                await updateDoc(doc(db, 'exams', e.id), { order: (e.order ?? 0) + 1 });
                              }
                              const newDocRef = await addDoc(
                                collection(db, 'exams'),
                                {
                                  type: 'tf',
                                  title: '新考題',
                                  categoryId: activeCategoryId,
                                  subtitle: '分類',
                                  description: '',
                                  options: ['', '', '', ''],
                                  correctAnswer: 'O',
                                  pointValue: 10,
                                  order: 0,
                                  createdAt: Date.now(),
                                }
                              );
                              setEditingExamId(newDocRef.id);
                              setEditExamData({
                                type: 'tf',
                                title: '新考題',
                                subtitle: '分類',
                                description: '',
                                options: ['', '', '', ''],
                                correctAnswer: 'O',
                              });
                              showToast('已新增考題，請開始編輯！');
                            } catch (err) {
                              showToast('新增失敗，請檢查權限');
                            }
                          }}
                          className="w-full py-3.5 bg-[#FCEEEA] rounded-full text-sm text-[#D85E38] font-bold flex justify-center items-center hover:bg-[#F9E2DB] transition-colors"
                        >
                          <PlusCircle c="w-5 h-5 mr-2" /> 新增考題
                        </button>
                      </div>
                    )}

                    <div className="space-y-5">
                      {activeExams.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm font-bold bg-white rounded-[24px] soft-shadow border border-gray-100">
                          此分類目前尚無考題
                        </div>
                      ) : (
                        activeExams.map((exam, i) => {
                          const empRecord =
                            currentUserData?.examRecords?.[exam.id];
                          const isPassed =
                            empRecord?.status === 'passed' ||
                            empRecord === 'passed';
                          const isFailed =
                            empRecord?.status === 'failed' ||
                            empRecord === 'failed';
                          const isPendingProctor =
                            empRecord?.status === 'pending_proctor';
                          const isRetestRequested =
                            empRecord?.retestRequested === true;
                          const qType = exam.type || 'basic';

                          const typeTags = {
                            tf: {
                              label: '是非題',
                              style: 'bg-[#EBF2FF] text-[#3B82F6]',
                            },
                            mc: {
                              label: '選擇題',
                              style: 'bg-[#F3E8FF] text-[#9333EA]',
                            },
                            fill: {
                              label: '填空題',
                              style: 'bg-[#FEF3C7] text-[#D97706]',
                            },
                            essay: {
                              label: '問答題',
                              style: 'bg-[#FFE4E6] text-[#E11D48]',
                            },
                            oral: {
                              label: '口述',
                              style: 'bg-[#DCFCE7] text-[#16A34A]',
                            },
                            practical: {
                              label: '現在考試',
                              style: 'bg-[#FEE2E2] text-[#DC2626]',
                            },
                            basic: {
                              label: '基本任務',
                              style: 'bg-gray-100 text-gray-600',
                            },
                          };
                          const typeInfo = typeTags[qType] || typeTags['basic'];

                          if (canEdit && editingExamId === exam.id) {
                            return (
                              <div
                                key={exam.id}
                                className="bg-white p-6 rounded-[28px] soft-shadow border-2 border-[#1A1A1A]/10 animate-in fade-in"
                              >
                                <h4 className="font-black text-lg mb-4 flex items-center">
                                  <Edit c="w-5 h-5 mr-2 text-[#D85E38]" />{' '}
                                  編輯考題
                                </h4>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block pl-1">
                                      題型選擇
                                    </label>
                                    <select
                                      value={editExamData.type}
                                      onChange={(e) =>
                                        setEditExamData({
                                          ...editExamData,
                                          type: e.target.value,
                                        })
                                      }
                                      className="w-full p-3.5 bg-[#F0F2F5] rounded-xl font-bold text-sm text-[#1A1A1A] outline-none"
                                    >
                                      <option value="tf">
                                        是非題 (自動批改)
                                      </option>
                                      <option value="mc">
                                        選擇題 (自動批改)
                                      </option>
                                      <option value="fill">
                                        填空題 (需考官)
                                      </option>
                                      <option value="essay">
                                        問答題 (考官審核)
                                      </option>
                                      <option value="oral">
                                        口述題 (需考官)
                                      </option>
                                      <option value="practical">
                                        實作題 (需考官)
                                      </option>
                                      <option value="basic">
                                        一般文字任務
                                      </option>
                                    </select>
                                  </div>
                                  <input
                                    type="text"
                                    value={editExamData.title}
                                    onChange={(e) =>
                                      setEditExamData({
                                        ...editExamData,
                                        title: e.target.value,
                                      })
                                    }
                                    className="w-full p-4 bg-[#F0F2F5] rounded-[16px] font-black text-[#1A1A1A] text-lg outline-none"
                                    placeholder="輸入題目內容..."
                                  />
                                  {(editExamData.type === 'oral' ||
                                    editExamData.type === 'practical' ||
                                    editExamData.type === 'basic' ||
                                    editExamData.type === 'essay') && (
                                    <textarea
                                      value={editExamData.description}
                                      onChange={(e) =>
                                        setEditExamData({
                                          ...editExamData,
                                          description: e.target.value,
                                        })
                                      }
                                      className="w-full p-4 bg-[#F0F2F5] rounded-[16px] text-sm text-gray-600 outline-none min-h-[80px]"
                                      placeholder="輔助說明或情境提示 (選填)..."
                                    />
                                  )}
                                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {editExamData.type === 'tf' && (
                                      <div>
                                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                                          設定正確答案
                                        </label>
                                        <div className="flex gap-4">
                                          <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                              type="radio"
                                              name="tf_ans"
                                              value="O"
                                              checked={
                                                editExamData.correctAnswer ===
                                                'O'
                                              }
                                              onChange={(e) =>
                                                setEditExamData({
                                                  ...editExamData,
                                                  correctAnswer: e.target.value,
                                                })
                                              }
                                              className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="font-black text-lg text-blue-600">
                                              O
                                            </span>
                                          </label>
                                          <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                              type="radio"
                                              name="tf_ans"
                                              value="X"
                                              checked={
                                                editExamData.correctAnswer ===
                                                'X'
                                              }
                                              onChange={(e) =>
                                                setEditExamData({
                                                  ...editExamData,
                                                  correctAnswer: e.target.value,
                                                })
                                              }
                                              className="w-4 h-4 text-gray-600"
                                            />
                                            <span className="font-black text-lg text-gray-600">
                                              X
                                            </span>
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                    {editExamData.type === 'mc' && (
                                      <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-500 block">
                                          設定選項與答案
                                        </label>
                                        {['A', 'B', 'C', 'D'].map(
                                          (letter, idx) => (
                                            <div
                                              key={letter}
                                              className="flex items-center gap-2"
                                            >
                                              <span className="w-6 font-black text-gray-400">
                                                {letter}.
                                              </span>
                                              <input
                                                type="text"
                                                value={
                                                  editExamData.options?.[idx] ||
                                                  ''
                                                }
                                                onChange={(e) => {
                                                  const newOpts = [
                                                    ...(editExamData.options || [
                                                      '',
                                                      '',
                                                      '',
                                                      '',
                                                    ]),
                                                  ];
                                                  newOpts[idx] = e.target.value;
                                                  setEditExamData({
                                                    ...editExamData,
                                                    options: newOpts,
                                                  });
                                                }}
                                                className="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                                                placeholder={`選項 ${letter}`}
                                              />
                                              <input
                                                type="radio"
                                                name="mc_ans"
                                                value={letter}
                                                checked={
                                                  editExamData.correctAnswer ===
                                                  letter
                                                }
                                                onChange={(e) =>
                                                  setEditExamData({
                                                    ...editExamData,
                                                    correctAnswer:
                                                      e.target.value,
                                                  })
                                                }
                                                className="w-4 h-4 ml-2"
                                              />
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                    {editExamData.type === 'fill' && (
                                      <div>
                                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                                          設定正確解答 (完全比對)
                                        </label>
                                        <input
                                          type="text"
                                          value={editExamData.correctAnswer}
                                          onChange={(e) =>
                                            setEditExamData({
                                              ...editExamData,
                                              correctAnswer: e.target.value,
                                            })
                                          }
                                          className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none"
                                          placeholder="輸入標準答案"
                                        />
                                      </div>
                                    )}
                                    {editExamData.type === 'essay' && (
                                      <div>
                                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                                          設定參考解答 (考官評閱時顯示)
                                        </label>
                                        <textarea
                                          value={editExamData.correctAnswer}
                                          onChange={(e) =>
                                            setEditExamData({
                                              ...editExamData,
                                              correctAnswer: e.target.value,
                                            })
                                          }
                                          className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none min-h-[80px]"
                                          placeholder="輸入標準答案，供考官核對..."
                                        />
                                      </div>
                                    )}
                                    {editExamData.type === 'practical' && (
                                      <p className="text-xs text-gray-500 font-bold">
                                        此題型由現場考官人工確認與批改，無須設定標準答案。
                                      </p>
                                    )}
                                    {editExamData.type === 'oral' && (
                                      <div>
                                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                                          標準答案（考官輸入密碼後才會顯示）
                                        </label>
                                        <textarea
                                          value={editExamData.correctAnswer}
                                          onChange={(e) =>
                                            setEditExamData({
                                              ...editExamData,
                                              correctAnswer: e.target.value,
                                            })
                                          }
                                          className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none font-bold text-[#1A1A1A] text-sm focus:border-[#D85E38] min-h-[80px] resize-none"
                                          placeholder="輸入此口述題的標準答案或評分要點..."
                                        />
                                      </div>
                                    )}
                                  </div>
                                  {/* 題目分數設定 */}
                                  <div className="bg-[#F8FAFC] rounded-xl p-3 border border-gray-100">
                                    <label className="text-[11px] font-bold text-gray-500 block mb-2">此題配分（分）</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={editExamData.pointValue ?? 10}
                                      onChange={(e) => setEditExamData({ ...editExamData, pointValue: Number(e.target.value) || 10 })}
                                      className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none font-black text-[#1A1A1A] text-sm focus:border-[#D85E38]"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">預設 10 分，所有題目總分即為各題配分總和</p>
                                  </div>

                                  <div className="flex pt-2 gap-3">
                                    <button
                                      onClick={() => setEditingExamId(null)}
                                      className="flex-1 py-3.5 bg-[#F0F2F5] text-gray-500 rounded-full text-sm font-bold hover:bg-gray-300"
                                    >
                                      取消
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await updateDoc(
                                          doc(db, 'exams', exam.id),
                                          editExamData
                                        );
                                        setEditingExamId(null);
                                        showToast('考題已儲存');
                                      }}
                                      className="flex-1 bg-[#1A1A1A] text-white py-3.5 rounded-full text-sm font-bold shadow-lg hover:bg-black"
                                    >
                                      儲存變更
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={exam.id}
                              draggable={canEdit}
                              onDragStart={() => {
                                if (canEdit) setDraggedExamId(exam.id);
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (canEdit) handleExamDrop(exam.id);
                              }}
                              className={`bg-white p-6 rounded-[28px] soft-shadow relative overflow-hidden border transition-all hover:shadow-md animate-in fade-in ${
                                canEdit ? 'cursor-move' : ''
                              } ${
                                draggedExamId === exam.id
                                  ? 'opacity-40 border-dashed border-[#5C6AC4] scale-[0.98]'
                                  : 'border-gray-100'
                              }`}
                            >
                              {canEdit && (
                                <div className="absolute top-5 right-5 flex gap-2 z-20">
                                  <button
                                    onClick={async () => {
                                      if (i === 0) return;
                                      const prev = activeExams[i - 1];
                                      const currOrder = exam.order ?? i;
                                      const prevOrder = prev.order ?? (i - 1);
                                      await updateDoc(doc(db, 'exams', exam.id), { order: prevOrder });
                                      await updateDoc(doc(db, 'exams', prev.id), { order: currOrder });
                                    }}
                                    className={`p-2 bg-white rounded-full shadow-sm transition-colors ${i === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-[#5C6AC4]'}`}
                                    title="上移"
                                  >
                                    <ChevronLeft c="w-4 h-4 rotate-90" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (i === activeExams.length - 1) return;
                                      const next = activeExams[i + 1];
                                      const currOrder = exam.order ?? i;
                                      const nextOrder = next.order ?? (i + 1);
                                      await updateDoc(doc(db, 'exams', exam.id), { order: nextOrder });
                                      await updateDoc(doc(db, 'exams', next.id), { order: currOrder });
                                    }}
                                    className={`p-2 bg-white rounded-full shadow-sm transition-colors ${i === activeExams.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-[#5C6AC4]'}`}
                                    title="下移"
                                  >
                                    <ChevronRight c="w-4 h-4 rotate-90" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingExamId(exam.id);
                                      setEditExamData({
                                        type: exam.type || 'basic',
                                        title: exam.title || '',
                                        subtitle: exam.subtitle || '',
                                        description: exam.description || '',
                                        options: exam.options || [
                                          '',
                                          '',
                                          '',
                                          '',
                                        ],
                                        correctAnswer: exam.correctAnswer || '',
                                        pointValue: exam.pointValue ?? 10,
                                      });
                                    }}
                                    className="text-gray-400 hover:text-[#1A1A1A] p-2 bg-white rounded-full shadow-sm"
                                  >
                                    <Edit c="w-4 h-4" />
                                  </button>
                                  {deletingExamId === exam.id ? (
                                    <button
                                      onClick={() => {
                                        deleteDoc(doc(db, 'exams', exam.id));
                                        setDeletingExamId(null);
                                      }}
                                      className="text-white bg-red-500 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center"
                                    >
                                      確定刪除?
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setDeletingExamId(exam.id)}
                                      className="text-gray-400 hover:text-red-500 p-2 bg-white rounded-full shadow-sm"
                                    >
                                      <Trash2 c="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-3 mb-5">
                                <span
                                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wider ${typeInfo.style}`}
                                >
                                  {String(typeInfo.label)}
                                </span>
                                <span className="text-[11px] font-bold text-gray-400">
                                  {qType === 'tf'
                                    ? '上方會友可以打圈或打叉'
                                    : qType === 'mc'
                                    ? '有四個答案可以選'
                                    : qType === 'fill'
                                    ? '上方有問題，則下方需自行填寫'
                                    : qType === 'essay'
                                    ? '需自行填寫，送出後由考官批改'
                                    : qType === 'oral'
                                    ? '需現場詢問 (考官專用區)'
                                    : qType === 'practical'
                                    ? '需現場模擬 (考官專用區)'
                                    : ''}
                                </span>
                              </div>

                              <div className="bg-white rounded-[16px] p-5 shadow-sm border border-gray-50">
                                <h3 className="font-black text-[#1A1A1A] text-lg mb-4 pr-16 leading-relaxed">
                                  {i + 1}. {String(exam.title)}
                                </h3>
                                {exam.description && (
                                  <p className="text-sm text-gray-500 mb-4">
                                    {String(exam.description)}
                                  </p>
                                )}

                                {isPassed ? (
                                  <div className="mt-4 p-4 bg-[#F1F8F5] rounded-xl flex items-center text-[#2F7E5B] font-bold text-sm border border-[#2F7E5B]/20 animate-in zoom-in-95">
                                    <CheckCircle2 c="w-5 h-5 mr-2" />
                                    <div>
                                      <span>已通過</span>
                                      {empRecord?.approver && (
                                        <span className="text-[10px] ml-2 bg-white px-2 py-0.5 rounded-md text-[#2F7E5B]">
                                          考官: {String(empRecord.approver)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : isPendingProctor ? (
                                  <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                                    <div className="flex items-center text-orange-600 font-bold mb-2">
                                      <AlertTriangle c="w-5 h-5 mr-2" />{' '}
                                      等待考官審核中...
                                    </div>
                                    <div className="bg-white p-3 rounded-lg text-sm text-gray-700 mb-3 border border-orange-100">
                                      <span className="text-[10px] text-gray-400 block mb-1">
                                        您的作答：
                                      </span>
                                      {String(empRecord.userAnswer || '')}
                                    </div>
                                    {!canEdit && (
                                      <button
                                        onClick={() => {
                                          if (!selectedProctor) {
                                            showToast(
                                              '請先在上方選擇本場考官！'
                                            );
                                            return;
                                          }
                                          setProctorReviewModal({
                                            show: true,
                                            examId: exam.id,
                                            proctorName: selectedProctor,
                                            password: '',
                                            verified: false,
                                          });
                                        }}
                                        className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center shadow-md"
                                      >
                                        <CheckSquare c="w-4 h-4 mr-2" />{' '}
                                        考官評閱
                                      </button>
                                    )}
                                  </div>
                                ) : isFailed ? (
                                  <div className="mt-4 space-y-3">
                                    <div className="p-4 bg-[#FFE4DE] rounded-xl flex flex-col text-[#D85E38] font-bold text-sm border border-[#D85E38]/20">
                                      <div className="flex items-center">
                                        <XCircle c="w-5 h-5 mr-2" />{' '}
                                        上次答錯，請重新作答
                                      </div>
                                      {empRecord?.approver && (
                                        <span className="text-[10px] mt-2 inline-block bg-white/50 px-2 py-0.5 rounded-md w-max">
                                          考官: {String(empRecord.approver)}
                                        </span>
                                      )}
                                    </div>
                                    {!canEdit &&
                                      (isRetestRequested ? (
                                        <div className="w-full py-3.5 bg-orange-100 text-orange-600 rounded-xl text-sm font-bold flex items-center justify-center">
                                          已送出重新測驗申請...請等待主管審核
                                        </div>
                                      ) : (
                                        <button
                                          onClick={async () => {
                                            const newRecords = {
                                              ...currentUserData.examRecords,
                                            };
                                            newRecords[exam.id] = {
                                              ...newRecords[exam.id],
                                              retestRequested: true,
                                            };
                                            await updateDoc(
                                              doc(
                                                db,
                                                'employees',
                                                currentUserData.id
                                              ),
                                              { examRecords: newRecords }
                                            );
                                            showToast(
                                              '已送出重新測驗申請！請通知主管核准'
                                            );
                                          }}
                                          className="w-full py-3.5 bg-[#D85E38] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-[#C25330] transition-colors flex items-center justify-center"
                                        >
                                          <RefreshCw c="w-4 h-4 mr-2" />{' '}
                                          申請重新測驗
                                        </button>
                                      ))}
                                  </div>
                                ) : (
                                  <div className="mt-2">
                                    {qType === 'tf' && (
                                      <div className="flex gap-4">
                                        <button
                                          onClick={() =>
                                            handleAnswerChange(exam.id, 'O')
                                          }
                                          className={`flex-1 py-4 border-2 rounded-xl flex justify-center items-center transition-all ${
                                            currentAnswers[exam.id] === 'O'
                                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                                              : 'border-gray-200 text-gray-400 hover:border-blue-200 hover:bg-blue-50/50'
                                          }`}
                                        >
                                          <CircleOutline c="w-8 h-8" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleAnswerChange(exam.id, 'X')
                                          }
                                          className={`flex-1 py-4 border-2 rounded-xl flex justify-center items-center transition-all ${
                                            currentAnswers[exam.id] === 'X'
                                              ? 'border-gray-600 bg-gray-100 text-gray-700'
                                              : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                                          }`}
                                        >
                                          <XOutline c="w-8 h-8" />
                                        </button>
                                      </div>
                                    )}
                                    {qType === 'mc' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {['A', 'B', 'C', 'D'].map(
                                          (letter, idx) => (
                                            <button
                                              key={letter}
                                              onClick={() =>
                                                handleAnswerChange(
                                                  exam.id,
                                                  letter
                                                )
                                              }
                                              className={`flex items-center p-3.5 border-2 rounded-xl text-left transition-all ${
                                                currentAnswers[exam.id] ===
                                                letter
                                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                  : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                              }`}
                                            >
                                              <span
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs mr-3 ${
                                                  currentAnswers[exam.id] ===
                                                  letter
                                                    ? 'bg-purple-200 text-purple-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}
                                              >
                                                {letter}
                                              </span>
                                              <span className="font-bold text-sm">
                                                {exam.options?.[idx] || ''}
                                              </span>
                                            </button>
                                          )
                                        )}
                                      </div>
                                    )}
                                    {qType === 'fill' && (
                                      <div>
                                        <input
                                          type="text"
                                          value={currentAnswers[exam.id] || ''}
                                          onChange={(e) =>
                                            handleAnswerChange(
                                              exam.id,
                                              e.target.value
                                            )
                                          }
                                          className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-orange-400 focus:bg-orange-50/30 font-bold text-gray-700 transition-colors"
                                          placeholder="請在此輸入您的答案..."
                                        />
                                      </div>
                                    )}
                                    {qType === 'essay' && (
                                      <div>
                                        <textarea
                                          value={currentAnswers[exam.id] || ''}
                                          onChange={(e) =>
                                            handleAnswerChange(
                                              exam.id,
                                              e.target.value
                                            )
                                          }
                                          className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-rose-400 focus:bg-rose-50/30 font-bold text-gray-700 transition-colors min-h-[100px] resize-none"
                                          placeholder="請在此輸入您的詳細解答..."
                                        />
                                      </div>
                                    )}
                                    {!canEdit &&
                                      ['tf', 'mc', 'fill', 'essay'].includes(
                                        qType
                                      ) &&
                                      currentAnswers[exam.id] !== undefined &&
                                      currentAnswers[exam.id].trim() !== '' && (
                                        examTimeUp && ['tf', 'mc'].includes(qType) ? (
                                          <div className="w-full mt-4 bg-red-100 text-red-600 py-3.5 rounded-xl font-bold flex items-center justify-center">
                                            ⏰ 時間已到，無法作答此題
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => submitAnswer(exam)}
                                            className="w-full mt-4 bg-[#5C6AC4] text-white py-3.5 rounded-xl font-bold flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
                                          >
                                            <Send c="w-4 h-4 mr-2" /> 送出作答
                                          </button>
                                        )
                                      )}
                                    {(qType === 'oral' ||
                                      qType === 'practical') && (
                                      <div
                                        className="mt-4 flex items-center justify-between p-4 rounded-xl border-2 border-dashed bg-gray-50/50"
                                        style={{
                                          borderColor:
                                            qType === 'oral'
                                              ? '#bbf7d0'
                                              : '#fecaca',
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                              qType === 'oral'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-red-100 text-red-500'
                                            }`}
                                          >
                                            {qType === 'oral' ? (
                                              <Mic c="w-6 h-6" />
                                            ) : (
                                              <MonitorPlay c="w-6 h-6" />
                                            )}
                                          </div>
                                          <p className="text-xs font-bold text-gray-500 max-w-[150px]">
                                            請依照指示，現場向主考官
                                            {qType === 'oral'
                                              ? '口頭回答'
                                              : '操作並完成'}
                                            。
                                          </p>
                                        </div>
                                        {!canEdit && (
                                          qType === 'oral' ? (
                                            <button
                                              onClick={async () => {
                                                if (!selectedProctor) {
                                                  showToast('請先在上方選擇本場考官！');
                                                  return;
                                                }
                                                const newRecords = currentUserData.examRecords
                                                  ? { ...currentUserData.examRecords }
                                                  : {};
                                                const prevMistakes = newRecords[exam.id]?.mistakes || 0;
                                                const pointValue = exam.pointValue ?? 10;
                                                newRecords[exam.id] = {
                                                  ...(typeof newRecords[exam.id] === 'object' ? newRecords[exam.id] : {}),
                                                  status: 'pending_proctor',
                                                  timestamp: Date.now(),
                                                  title: exam.title,
                                                  mistakes: prevMistakes,
                                                  approver: selectedProctor,
                                                  score: 0,
                                                  pointValue,
                                                  userAnswer: '（口述作答，請考官現場確認）',
                                                };
                                                await updateDoc(doc(db, 'employees', currentUserData.id), {
                                                  examRecords: newRecords,
                                                });
                                                showToast('📝 已送出，請等待考官輸入密碼評分。');
                                              }}
                                              className="flex items-center gap-2 border-2 border-gray-200 bg-white px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                              <Square c="w-5 h-5 text-gray-400" />{' '}
                                              <span className="font-bold text-sm text-gray-600">
                                                送出給考官
                                              </span>
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                if (!selectedProctor) {
                                                  showToast(
                                                    '請先在上方選擇本場考官！'
                                                  );
                                                  return;
                                                }
                                                setProctorModal({
                                                  show: true,
                                                  examId: exam.id,
                                                  proctorName: selectedProctor,
                                                });
                                              }}
                                              className="flex items-center gap-2 border-2 border-gray-200 bg-white px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                              <Square c="w-5 h-5 text-gray-400" />{' '}
                                              <span className="font-bold text-sm text-gray-600">
                                                考官確認
                                              </span>
                                            </button>
                                          )
                                        )}
                                      </div>
                                    )}
                                    {qType === 'basic' && !canEdit && (
                                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                          onClick={() => {
                                            if (!selectedProctor) {
                                              showToast(
                                                '請先在上方選擇本場考官！'
                                              );
                                              return;
                                            }
                                            setProctorModal({
                                              show: true,
                                              examId: exam.id,
                                              proctorName: selectedProctor,
                                            });
                                          }}
                                          className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                                        >
                                          通過 (需簽核)
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}

                      {!canEdit && activeExams.length > 0 && (() => {
                        const prog = activeCategoryData?.progress;
                        const allAnswered = prog?.allAnswered;
                        const score = prog?.score ?? 0;
                        const passingScore = prog?.passingScore ?? 60;
                        const isPassed = prog?.isPassed;

                        return (
                          <div className="mt-8 mb-4 bg-white p-8 rounded-[32px] soft-shadow border border-gray-100 text-center relative overflow-hidden animate-in slide-in-from-bottom-4">
                            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-10 pointer-events-none ${isPassed ? 'bg-[#2F7E5B]' : 'bg-[#D85E38]'}`}></div>
                            <h3 className="font-black text-[#1A1A1A] text-lg mb-2 relative z-10">
                              本分類測驗結果
                            </h3>

                            {allAnswered ? (
                              <>
                                <div className={`text-5xl font-black mb-1 tracking-tighter relative z-10 ${isPassed ? 'text-[#2F7E5B]' : 'text-[#D85E38]'}`}>
                                  {score}
                                  <span className="text-[16px] text-gray-400 font-bold ml-1">/ 100 分</span>
                                </div>
                                <p className="text-[11px] text-gray-400 font-bold mb-5 relative z-10">
                                  及格標準：{passingScore} 分
                                </p>
                                <div className="relative z-10">
                                  {isPassed ? (
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="inline-flex items-center bg-[#F1F8F5] text-[#2F7E5B] px-5 py-3 rounded-full font-bold text-[13px] shadow-sm">
                                        <CheckCircle2 c="w-4 h-4 mr-2" /> 恭喜通過！已解鎖下一分類
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="inline-flex items-center bg-[#FCEEEA] text-[#D85E38] px-5 py-3 rounded-full font-bold text-[13px] shadow-sm">
                                        <XCircle c="w-4 h-4 mr-2" /> 未達及格分數，請向考官申請重考
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-5xl font-black text-[#D85E38] mb-1 tracking-tighter relative z-10">
                                  {score}
                                  <span className="text-[16px] text-gray-400 font-bold ml-1">/ 100 分</span>
                                </div>
                                <p className="text-[11px] text-gray-400 font-bold mb-5 relative z-10">
                                  尚有題目未作答，請完成所有題目後結束考試
                                </p>
                                <div className="inline-flex items-center bg-[#F0F2F5] text-gray-400 px-5 py-3 rounded-full font-bold text-[13px] relative z-10">
                                  <Lock c="w-4 h-4 mr-2" /> 完成所有題目後即可結束考試
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* --- 考試評分紀錄 (Exam Grading) --- */}
            {activeTab === 'exam-grading' && canEdit && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-4 mt-2 px-1">
                  <button
                    onClick={() => setActiveTab('exams')}
                    className="p-2 bg-white rounded-full soft-shadow text-gray-500 hover:text-[#1A1A1A] transition-colors border-none"
                  >
                    <ChevronLeft c="w-5 h-5" />
                  </button>
                  <h2 className="font-black text-[#1A1A1A] text-3xl tracking-tight">
                    {appConfig.examGradingTitle || '考試評分紀錄'}<span className="text-[#D85E38]">.</span>
                  </h2>
                </div>

                <div className="flex overflow-x-auto hide-scrollbar mt-4 pt-2 mb-4">
                  <button
                    onClick={() => setActiveExamStoreFilter('all')}
                    className={`px-5 py-3.5 font-bold text-[14px] whitespace-nowrap transition-all rounded-t-[16px] border border-b-0 flex items-center gap-2 relative top-[1px]
                    ${
                      activeExamStoreFilter === 'all'
                        ? 'bg-white text-[#5C6AC4] border-gray-200 z-10 pb-4'
                        : 'bg-[#F0F2F5] text-gray-400 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    全部門店
                  </button>
                  {stores.map((store) => (
                    <button
                      key={`exam-store-${store.id}`}
                      onClick={() => setActiveExamStoreFilter(store.name)}
                      className={`px-5 py-3.5 font-bold text-[14px] whitespace-nowrap transition-all rounded-t-[16px] border border-b-0 flex items-center gap-2 relative top-[1px]
                      ${
                        activeExamStoreFilter === store.name
                          ? 'bg-white text-[#5C6AC4] border-gray-200 z-10 pb-4'
                          : 'bg-[#F0F2F5] text-gray-400 border-transparent hover:bg-gray-100'
                      }
                      `}
                    >
                      {String(store.name)}
                    </button>
                  ))}
                  <div className="flex-1 border-b border-gray-200"></div>
                </div>

                <div className="space-y-4">
                  {employees
                    .filter(
                      (emp) =>
                        activeExamStoreFilter === 'all' ||
                        emp.store === activeExamStoreFilter
                    )
                    .map((emp) => {
                      // 計算「目前正在進行的考試分類名稱」
                      let currentCategoryName = '已完成所有考核';
                      for (let cat of categories) {
                        const catExams = exams.filter(
                          (e) =>
                            e.categoryId === cat.id ||
                            (!e.categoryId && cat.id === categories[0]?.id)
                        );
                        let catPassed = true;
                        if (catExams.length > 0) {
                          for (let ex of catExams) {
                            const rec = emp.examRecords?.[ex.id];
                            if (
                              !rec ||
                              (rec !== 'passed' && rec.status !== 'passed')
                            ) {
                              catPassed = false;
                              break;
                            }
                          }
                        } else {
                          catPassed = true;
                        }
                        if (!catPassed && catExams.length > 0) {
                          currentCategoryName = cat.name;
                          break;
                        }
                      }

                      return (
                        <div
                          key={emp.id}
                          className="bg-white rounded-[24px] p-5 soft-shadow border border-gray-100"
                        >
                          <div className="mb-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#F0F2F5] rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                  {(emp.avatarId || emp.avatarUrl) ? (
                                    <AvatarDisplay avatarId={emp.avatarId} avatarUrl={emp.avatarUrl} />
                                  ) : (
                                    <User c="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-[15px] text-[#1A1A1A]">
                                    {String(emp.name)}{' '}
                                    <span className="text-[10px] text-gray-400 font-bold ml-1 bg-gray-100 px-2 py-0.5 rounded-full">
                                      {String(emp.store)}
                                    </span>
                                  </p>
                                  <div className="mt-1">
                                    <RoleBadge role={emp.role} />
                                  </div>
                                </div>
                              </div>
                              <p
                                className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 max-w-[110px] truncate shrink-0"
                                title={currentCategoryName}
                              >
                                進行中:{' '}
                                <span className={currentCategoryName === '已完成所有考核' ? 'text-[#2F7E5B]' : 'text-[#D85E38]'}>
                                  {String(currentCategoryName)}
                                </span>
                              </p>
                            </div>
                            {/* 成就解鎖進度條 — 獨立一行避免重疊 */}
                            <div className="mt-3 overflow-x-auto hide-scrollbar">
                              <AchievementProgress
                                emp={emp}
                                categories={categories}
                                exams={exams}
                                compact={true}
                              />
                            </div>
                          </div>

                          <div className="bg-[#F0F2F5] rounded-xl p-3 space-y-3 mt-4">
                            {categories.map((cat, idx) => {
                              const catExams = exams.filter(
                                (e) =>
                                  e.categoryId === cat.id ||
                                  (!e.categoryId && idx === 0)
                              );
                              const catRecords = catExams
                                .map((ex) => ({
                                  exam: ex,
                                  record: emp.examRecords?.[ex.id],
                                }))
                                .filter(
                                  (r) =>
                                    r.record &&
                                    (r.record === 'passed' || r.record.status)
                                );

                              if (catRecords.length === 0) return null;

                              const failedRecords = catRecords.filter(
                                (r) =>
                                  r.record.status === 'failed' ||
                                  r.record === 'failed'
                              );
                              const passedRecords = catRecords.filter(
                                (r) =>
                                  r.record.status === 'passed' ||
                                  r.record === 'passed'
                              );

                              const latestRecord = [...catRecords].sort(
                                (a, b) =>
                                  (b.record.timestamp || 0) -
                                  (a.record.timestamp || 0)
                              )[0];
                              const approverName =
                                latestRecord?.record?.approver || '系統';

                              return (
                                <div
                                  key={cat.id}
                                  className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden"
                                >
                                  <div className="bg-[#F8FAFC] p-3 flex justify-between items-center border-b border-gray-100">
                                    <span className="font-black text-[13px] text-[#1A1A1A]">
                                      {String(cat.name)}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#D85E38] bg-[#FCEEEA] px-2.5 py-1 rounded-full">
                                      考官: {String(approverName)}
                                    </span>
                                  </div>

                                  <div className="p-3 space-y-2">
                                    {failedRecords.length > 0 && (
                                      <div className="space-y-2 mb-3">
                                        {failedRecords.map(
                                          ({ exam, record }) => (
                                            <div
                                              key={exam.id}
                                              className="flex justify-between items-start p-2.5 bg-red-50/50 rounded-lg border border-red-100"
                                            >
                                              <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-gray-700">
                                                  {String(exam.title)}
                                                </span>
                                                {record.score !== undefined && (
                                                  <span className="text-[10px] font-black text-red-400">
                                                    得分：{record.score} 分
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] text-red-500 bg-white px-2 py-1 rounded-md font-bold flex items-center shadow-sm">
                                                  <XCircle c="w-3 h-3 mr-1" />
                                                  未通過
                                                </span>
                                                {record.timestamp && (
                                                  <span className="text-[9px] text-gray-400">
                                                    {new Date(record.timestamp).toLocaleDateString()}
                                                  </span>
                                                )}
                                                {!record.retestRequested ? (
                                                  <button
                                                    onClick={async () => {
                                                      const newRecords = { ...emp.examRecords };
                                                      delete newRecords[exam.id];
                                                      await updateDoc(doc(db, 'employees', emp.id), {
                                                        examRecords: newRecords,
                                                      });
                                                      showToast(`已為 ${emp.name} 開放重考：${exam.title}`);
                                                    }}
                                                    className="text-[9px] font-bold text-white bg-[#D85E38] px-2.5 py-1 rounded-full hover:bg-[#C25330] transition-colors shadow-sm mt-0.5"
                                                  >
                                                    開放重考
                                                  </button>
                                                ) : (
                                                  <button
                                                    onClick={async () => {
                                                      const newRecords = { ...emp.examRecords };
                                                      delete newRecords[exam.id];
                                                      await updateDoc(doc(db, 'employees', emp.id), {
                                                        examRecords: newRecords,
                                                      });
                                                      showToast(`已核准 ${emp.name} 重考：${exam.title}`);
                                                    }}
                                                    className="text-[9px] font-bold text-white bg-orange-500 px-2.5 py-1 rounded-full hover:bg-orange-600 transition-colors shadow-sm mt-0.5 animate-pulse"
                                                  >
                                                    核准重考
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}

                                    {passedRecords.length > 0 && (
                                      <details className="group">
                                        <summary className="text-xs font-bold text-[#2F7E5B] cursor-pointer outline-none flex items-center bg-[#F1F8F5] p-2.5 rounded-lg select-none hover:bg-[#E2F1EA] transition-colors">
                                          <CheckCircle2 c="w-4 h-4 mr-1.5" />
                                          已通過項目 ({passedRecords.length})
                                          <ChevronRight c="w-4 h-4 ml-auto transition-transform group-open:rotate-90" />
                                        </summary>
                                        <div className="space-y-2 mt-2 pl-1">
                                          {passedRecords.map(
                                            ({ exam, record }) => (
                                              <div
                                                key={exam.id}
                                                className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm border border-gray-50"
                                              >
                                                <span className="text-[11px] font-bold text-gray-700">
                                                  {String(exam.title)}
                                                </span>
                                                <div className="flex flex-col items-end">
                                                  {record.score !== undefined && (
                                                    <span className="text-[10px] font-black text-[#2F7E5B]">{record.score} 分</span>
                                                  )}
                                                  <span className="text-[9px] text-gray-400">
                                                    {record.timestamp ? new Date(record.timestamp).toLocaleDateString() : ''}
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {Object.keys(emp.examRecords || {}).length ===
                              0 && (
                              <p className="text-xs text-gray-400 font-bold text-center py-2">
                                尚未有考試紀錄
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* --- 平時紀錄 (Daily Records) --- */}
            {activeTab === 'records' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="mb-4 px-1 mt-2 flex justify-between items-end">
                  <h2 className="font-black text-[#1A1A1A] text-3xl tracking-tight">
                    {canEdit
                      ? '平時紀錄審核'
                      : isGrader
                      ? '平時紀錄管理'
                      : '我的平時紀錄'}
                    <span className="text-[#D85E38]">.</span>
                  </h2>
                </div>

                <div className="flex bg-[#F0F2F5] p-1.5 rounded-2xl mb-4 overflow-x-auto hide-scrollbar shrink-0">
                  {canEdit && (
                    <button
                      onClick={() => setRecordTab('review')}
                      className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                        recordTab === 'review'
                          ? 'bg-white text-[#D85E38] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      月結審核
                    </button>
                  )}
                  {isGrader && (
                    <button
                      onClick={() => setRecordTab('grade')}
                      className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                        recordTab === 'grade'
                          ? 'bg-white text-[#D85E38] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      人員打分
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => setRecordTab('settings')}
                      className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                        recordTab === 'settings'
                          ? 'bg-white text-[#D85E38] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      評分設定
                    </button>
                  )}
                  {!canEdit && (
                    <button
                      onClick={() => setRecordTab('mine')}
                      className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                        recordTab === 'mine'
                          ? 'bg-white text-[#D85E38] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      我的紀錄
                    </button>
                  )}
                </div>

                {recordTab === 'review' && canEdit && (
                  <div className="space-y-5">
                    <div className="bg-white p-5 rounded-[24px] soft-shadow border border-gray-100 flex items-center justify-between">
                      <label className="font-black text-gray-700 flex items-center">
                        <CalendarIcon c="w-5 h-5 mr-2 text-[#D85E38]" />{' '}
                        選擇月份
                      </label>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="p-2 bg-[#F0F2F5] rounded-xl outline-none font-bold text-sm text-[#1A1A1A] border-none"
                      />
                    </div>

                    {employees.map((emp) => {
                      const monthRecords = Object.entries(
                        emp.dailyRecords || {}
                      )
                        .filter(([date]) => date.startsWith(selectedMonth))
                        .sort((a, b) => b[0].localeCompare(a[0]));

                      let totalScore = 0;
                      let approvedDays = 0;
                      let pendingDays = 0;
                      monthRecords.forEach(([date, data]) => {
                        const status = data.status || 'approved';
                        if (status === 'pending') pendingDays++;
                        else if (status === 'approved') {
                          const scores = data.scores || data;
                          const vals = Object.values(scores).map(Number);
                          if (vals.length > 0) {
                            totalScore +=
                              vals.reduce((a, b) => a + b, 0) / vals.length;
                            approvedDays++;
                          }
                        }
                      });
                      const monthlyAvg =
                        approvedDays > 0
                          ? Math.round(totalScore / approvedDays)
                          : 0;
                      if (monthRecords.length === 0 && pendingDays === 0)
                        return null;

                      return (
                        <details
                          key={`rev-${emp.id}`}
                          className="bg-white rounded-[24px] soft-shadow border border-gray-100 group mb-4 overflow-hidden"
                        >
                          <summary className="p-5 flex items-center justify-between cursor-pointer outline-none list-none [&::-webkit-details-marker]:hidden hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[#F0F2F5] rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                {(emp.avatarId || emp.avatarUrl) ? (
                                  <AvatarDisplay avatarId={emp.avatarId} avatarUrl={emp.avatarUrl} />
                                ) : (
                                  <User c="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-black text-[15px] text-[#1A1A1A]">
                                  {String(emp.name)}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">
                                  {String(emp.store)} | {String(emp.role)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <p className="text-[10px] text-gray-400 font-bold mb-1">
                                本月總分
                              </p>
                              <p className="font-black text-2xl text-[#D85E38] leading-none">
                                {monthlyAvg} <span className="text-xs">分</span>
                              </p>
                              {pendingDays > 0 && (
                                <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-2 font-black animate-pulse">
                                  {pendingDays} 筆待審
                                </span>
                              )}
                            </div>
                          </summary>
                          <div className="p-5 border-t border-gray-100 space-y-4 bg-[#F8FAFC]">
                            {monthRecords.map(([dateStr, data]) => {
                              const status = data.status || 'approved';
                              const scores = data.scores || data;
                              return (
                                <div
                                  key={dateStr}
                                  className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-50"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-sm text-[#1A1A1A] flex items-center">
                                      <CalendarIcon c="w-4 h-4 mr-1.5 text-gray-400" />
                                      {dateStr}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                                        status === 'pending'
                                          ? 'bg-orange-100 text-orange-600'
                                          : 'bg-[#F1F8F5] text-[#2F7E5B]'
                                      }`}
                                    >
                                      {status === 'pending'
                                        ? '待審核'
                                        : '已核准'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 mb-3 font-bold border-b border-dashed pb-2">
                                    評分人：{String(data.gradedBy || '管理員')}
                                  </div>
                                  <div className="space-y-1.5">
                                    {Object.entries(scores).map(
                                      ([itemId, val]) => {
                                        const item = dailyItems.find(
                                          (i) => i.id === itemId
                                        );
                                        return (
                                          <div
                                            key={itemId}
                                            className="flex justify-between items-center text-xs font-bold bg-[#F0F2F5] px-3 py-2 rounded-lg"
                                          >
                                            <span className="text-gray-600">
                                              {String(
                                                item?.title || '未知項目'
                                              )}
                                            </span>
                                            <span className="text-[#D85E38] text-sm">
                                              {String(val)}{' '}
                                              <span className="text-[9px] text-gray-400">
                                                分
                                              </span>
                                            </span>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                  {status === 'pending' && canEdit && (
                                    <div className="mt-4 flex justify-end">
                                      <button
                                        onClick={async () => {
                                          const newRecs = {
                                            ...emp.dailyRecords,
                                          };
                                          newRecs[dateStr].status = 'approved';
                                          await updateDoc(
                                            doc(db, 'employees', emp.id),
                                            { dailyRecords: newRecs }
                                          );
                                          showToast('已核准此評分！');
                                        }}
                                        className="bg-[#1A1A1A] hover:bg-black text-white text-xs px-5 py-2.5 rounded-full font-bold shadow-md transition-all active:scale-95"
                                      >
                                        核准此紀錄
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      );
                    })}
                    {employees.every(
                      (emp) =>
                        Object.entries(emp.dailyRecords || {}).filter(
                          ([date]) => date.startsWith(selectedMonth)
                        ).length === 0
                    ) && (
                      <div className="text-center py-10 text-gray-400 font-bold text-sm bg-white rounded-[24px] soft-shadow border border-gray-100">
                        本月尚未有任何平時紀錄
                      </div>
                    )}
                  </div>
                )}

                {canEdit && recordTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-[24px] soft-shadow border border-gray-100 mb-6 animate-in slide-in-from-bottom-4">
                      <h3 className="font-black text-[#1A1A1A] mb-3 flex items-center text-lg">
                        <Settings c="w-5 h-5 mr-2 text-[#D85E38]" />{' '}
                        評分權限設定
                      </h3>
                      <p className="text-xs text-gray-500 font-bold mb-4 leading-relaxed">
                        請勾選允許進行「人員打分」的職位，設定後該職位登入即可幫門店人員進行平時評分。(總部管理員預設擁有權限)
                      </p>
                      <div className="grid grid-cols-2 gap-3 bg-[#F0F2F5] p-4 rounded-xl">
                        {jobRoles.map((role) => (
                          <label
                            key={`grader-${role}`}
                            className="flex items-center gap-2 cursor-pointer py-1"
                          >
                            <input
                              type="checkbox"
                              checked={dailyConfig.graderRoles?.includes(role)}
                              onChange={async (e) => {
                                const newRoles = e.target.checked
                                  ? [...(dailyConfig.graderRoles || []), role]
                                  : (dailyConfig.graderRoles || []).filter(
                                      (r) => r !== role
                                    );
                                setDailyConfig({
                                  ...dailyConfig,
                                  graderRoles: newRoles,
                                });
                                await setDoc(
                                  doc(db, 'settings', 'dailyConfig'),
                                  { graderRoles: newRoles },
                                  { merge: true }
                                );
                              }}
                              className="w-4 h-4 text-[#D85E38] rounded border-gray-300 focus:ring-[#D85E38]"
                            />
                            <span className="text-sm font-bold text-gray-700">
                              {String(role)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const newDoc = await addDoc(
                          collection(db, 'dailyItems'),
                          {
                            title: '新增評分項目',
                            targetRoles: [],
                            createdAt: Date.now(),
                          }
                        );
                        setEditingDailyItemId(newDoc.id);
                        setEditDailyItemData({
                          title: '新增評分項目',
                          targetRoles: [],
                        });
                      }}
                      className="w-full py-4 bg-[#FCEEEA] rounded-full text-sm text-[#D85E38] font-bold flex justify-center items-center hover:bg-[#F9E2DB] transition-colors shadow-sm"
                    >
                      <PlusCircle c="w-5 h-5 mr-2" /> 新增評分項目
                    </button>

                    {dailyItems.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-[24px] text-gray-400 font-bold text-sm soft-shadow">
                        目前尚未建立任何評分項目
                      </div>
                    ) : (
                      dailyItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-5 rounded-[24px] soft-shadow border border-gray-100 relative"
                        >
                          {editingDailyItemId === item.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                                  項目名稱
                                </label>
                                <input
                                  type="text"
                                  value={editDailyItemData.title}
                                  onChange={(e) =>
                                    setEditDailyItemData({
                                      ...editDailyItemData,
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full p-3.5 bg-[#F0F2F5] rounded-xl font-bold text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#D85E38]/50"
                                  placeholder="例如：服裝儀容"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="text-xs font-bold text-gray-500 block pl-1">
                                    適用職位 (打勾後才會出現在評分清單)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isAllSelected =
                                        (editDailyItemData.targetRoles || [])
                                          .length === jobRoles.length;
                                      setEditDailyItemData({
                                        ...editDailyItemData,
                                        targetRoles: isAllSelected
                                          ? []
                                          : [...jobRoles],
                                      });
                                    }}
                                    className="text-[10px] font-bold px-3 py-1 rounded-md bg-[#FCEEEA] text-[#D85E38] hover:bg-[#F9E2DB] transition-colors"
                                  >
                                    {(editDailyItemData.targetRoles || [])
                                      .length === jobRoles.length
                                      ? '取消全選'
                                      : '全選所有職位'}
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-[#F0F2F5] p-3 rounded-xl">
                                  {jobRoles.map((role) => (
                                    <label
                                      key={role}
                                      className="flex items-center gap-2 cursor-pointer py-1"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={(
                                          editDailyItemData.targetRoles || []
                                        ).includes(role)}
                                        onChange={(e) => {
                                          const newRoles = e.target.checked
                                            ? [
                                                ...(editDailyItemData.targetRoles ||
                                                  []),
                                                role,
                                              ]
                                            : (
                                                editDailyItemData.targetRoles ||
                                                []
                                              ).filter((r) => r !== role);
                                          setEditDailyItemData({
                                            ...editDailyItemData,
                                            targetRoles: newRoles,
                                          });
                                        }}
                                        className="w-4 h-4 text-[#D85E38] rounded border-gray-300 focus:ring-[#D85E38]"
                                      />
                                      <span className="text-sm font-bold text-gray-700">
                                        {String(role)}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div className="flex pt-2 gap-3">
                                <button
                                  onClick={() => setEditingDailyItemId(null)}
                                  className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={async () => {
                                    await updateDoc(
                                      doc(db, 'dailyItems', item.id),
                                      editDailyItemData
                                    );
                                    setEditingDailyItemId(null);
                                    showToast('評分項目已儲存');
                                  }}
                                  className="flex-1 bg-[#1A1A1A] text-white py-3 rounded-full text-sm font-bold shadow-lg hover:bg-black transition-colors"
                                >
                                  儲存
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="absolute top-4 right-4 flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingDailyItemId(item.id);
                                    setEditDailyItemData({
                                      title: item.title,
                                      targetRoles: item.targetRoles || [],
                                    });
                                  }}
                                  className="p-2 text-gray-400 hover:text-[#1A1A1A] bg-gray-50 rounded-full transition-colors"
                                >
                                  <Edit c="w-4 h-4" />
                                </button>
                                {deletingDailyItemId === item.id ? (
                                  <button
                                    onClick={async () => {
                                      await deleteDoc(
                                        doc(db, 'dailyItems', item.id)
                                      );
                                      setDeletingDailyItemId(null);
                                      showToast('項目已刪除');
                                    }}
                                    className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in"
                                  >
                                    確定刪除?
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setDeletingDailyItemId(item.id)
                                    }
                                    className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full transition-colors"
                                  >
                                    <Trash2 c="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <h3 className="font-black text-[#1A1A1A] text-lg pr-16 mb-2">
                                {String(item.title)}
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {(item.targetRoles || []).length === 0 ? (
                                  <span className="text-[10px] text-red-400 bg-red-50 px-2 py-1 rounded-md font-bold">
                                    尚未設定適用職位
                                  </span>
                                ) : (
                                  (item.targetRoles || []).map((r) => (
                                    <span
                                      key={r}
                                      className="text-[10px] text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-bold"
                                    >
                                      {String(r)}
                                    </span>
                                  ))
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {isGrader && recordTab === 'grade' && (
                  <div className="space-y-5">
                    <div className="bg-white p-5 rounded-[24px] soft-shadow border border-gray-100 flex items-center justify-between sticky top-0 z-20">
                      <label className="font-black text-gray-700 flex items-center">
                        <CalendarIcon c="w-5 h-5 mr-2 text-[#D85E38]" />{' '}
                        評分日期
                      </label>
                      <input
                        type="date"
                        value={selectedRecordDate}
                        onChange={(e) => {
                          setSelectedRecordDate(e.target.value);
                          setGradingEmployeeId(null);
                        }}
                        className="p-2 bg-[#F0F2F5] rounded-xl outline-none font-bold text-sm text-[#1A1A1A] border-none"
                      />
                    </div>

                    {(() => {
                      const gradeTargetEmps = canEdit
                        ? employees.filter((e) => e.id !== currentUserData?.id)
                        : employees.filter(
                            (e) => e.store === currentUserData?.store && e.id !== currentUserData?.id
                          );

                      if (gradeTargetEmps.length === 0)
                        return (
                          <p className="text-center text-gray-400 text-sm font-bold py-4">
                            目前沒有符合的員工資料
                          </p>
                        );
                      return gradeTargetEmps.map((emp) => {
                        const isGrading = gradingEmployeeId === emp.id;
                        const applicableItems = dailyItems.filter((item) =>
                          (item.targetRoles || []).includes(emp.role)
                        );
                        const dateRecords =
                          emp.dailyRecords?.[selectedRecordDate] || {};
                        const sc = dateRecords.scores || dateRecords;
                        const hasApplicable = applicableItems.length > 0;
                        const isCompletedToday =
                          hasApplicable &&
                          applicableItems.every(
                            (item) => sc[item.id] !== undefined
                          );
                        const needsAttention =
                          hasApplicable && !isCompletedToday;

                        return (
                          <div
                            key={emp.id}
                            className={`bg-white rounded-[24px] p-5 soft-shadow transition-all ${
                              isGrading
                                ? 'ring-2 ring-[#D85E38]/50 border-transparent'
                                : needsAttention
                                ? 'border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                                : 'border border-gray-100'
                            }`}
                          >
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() => {
                                if (!isGrading) {
                                  setGradingEmployeeId(emp.id);
                                  setGradingScores(sc);
                                } else {
                                  setGradingEmployeeId(null);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#F0F2F5] rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                  {(emp.avatarId || emp.avatarUrl) ? (
                                    <AvatarDisplay avatarId={emp.avatarId} avatarUrl={emp.avatarUrl} />
                                  ) : (
                                    <User c="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-[15px] text-[#1A1A1A]">
                                    {String(emp.name)}{' '}
                                    <span className="text-[10px] text-gray-400 font-bold ml-1 bg-gray-100 px-2 py-0.5 rounded-full">
                                      {String(emp.store)}
                                    </span>
                                  </p>
                                  <p className="text-[11px] font-bold mt-1 tracking-widest flex items-center gap-1">
                                    <RoleBadge role={emp.role} />
                                    {needsAttention ? (
                                      <span className="text-red-600 bg-red-100 px-1.5 py-0.5 rounded ml-1 font-black animate-pulse">
                                        待處理
                                      </span>
                                    ) : hasApplicable ? (
                                      <span className="text-[#2F7E5B] bg-[#F1F8F5] px-1.5 py-0.5 rounded ml-1">
                                        已完成
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">
                                        無項目
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <ChevronRight
                                  c={`w-5 h-5 transition-transform ${
                                    isGrading
                                      ? 'rotate-90 text-[#D85E38]'
                                      : needsAttention
                                      ? 'text-red-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </div>
                            </div>

                            {isGrading && (
                              <div className="mt-5 pt-5 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                {applicableItems.length === 0 ? (
                                  <div className="text-center p-4 bg-gray-50 rounded-xl text-xs font-bold text-gray-400">
                                    此職位目前無適用的平時評分項目
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {applicableItems.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between bg-[#F0F2F5] p-3 rounded-xl"
                                      >
                                        <span className="font-bold text-sm text-gray-700">
                                          {String(item.title)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="分數"
                                            value={
                                              gradingScores[item.id] !==
                                              undefined
                                                ? gradingScores[item.id]
                                                : ''
                                            }
                                            onChange={(e) =>
                                              setGradingScores({
                                                ...gradingScores,
                                                [item.id]:
                                                  e.target.value === ''
                                                    ? ''
                                                    : Number(e.target.value),
                                              })
                                            }
                                            className="w-16 p-2 text-center rounded-lg font-black text-[#D85E38] outline-none border border-gray-200 focus:border-[#D85E38]"
                                          />
                                          <span className="text-xs font-bold text-gray-400">
                                            分
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="flex pt-2">
                                      <button
                                        onClick={async () => {
                                          const finalScores = {
                                            ...gradingScores,
                                          };
                                          Object.keys(finalScores).forEach(
                                            (k) => {
                                              if (finalScores[k] === '')
                                                delete finalScores[k];
                                            }
                                          );
                                          const updatedRecords = {
                                            ...(emp.dailyRecords || {}),
                                          };
                                          updatedRecords[selectedRecordDate] = {
                                            scores: finalScores,
                                            status: canEdit
                                              ? 'approved'
                                              : 'pending',
                                            gradedBy: currentUserName,
                                            timestamp: Date.now(),
                                          };
                                          await updateDoc(
                                            doc(db, 'employees', emp.id),
                                            { dailyRecords: updatedRecords }
                                          );
                                          showToast(
                                            `${String(
                                              emp.name
                                            )} 的平時分數已送出！`
                                          );
                                          setGradingEmployeeId(null);
                                        }}
                                        className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center"
                                      >
                                        儲存本日評分
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {recordTab === 'mine' && (
                  <div className="space-y-4">
                    {(() => {
                      const myDailyRecords =
                        currentUserData?.dailyRecords || {};
                      const dates = Object.keys(myDailyRecords).sort(
                        (a, b) => new Date(b) - new Date(a)
                      );

                      if (dates.length === 0)
                        return (
                          <div className="bg-white rounded-[24px] p-10 soft-shadow border border-gray-100 text-center flex flex-col items-center">
                            <CalendarIcon c="w-8 h-8 text-gray-300 mb-4" />
                            <p className="text-gray-400 font-bold text-sm">
                              目前尚無平時紀錄分數
                            </p>
                          </div>
                        );

                      return dates.map((dateStr) => {
                        const dateData = myDailyRecords[dateStr];
                        const scores = dateData.scores || dateData;
                        const status = dateData.status || 'approved';
                        const scoreKeys = Object.keys(scores);
                        if (scoreKeys.length === 0) return null;
                        const totalScore = scoreKeys.reduce(
                          (acc, itemId) => acc + (Number(scores[itemId]) || 0),
                          0
                        );
                        const avgScore = Math.round(
                          totalScore / scoreKeys.length
                        );

                        return (
                          <div
                            key={dateStr}
                            className="bg-white rounded-[24px] p-6 soft-shadow border border-gray-100 mb-4 animate-in slide-in-from-bottom-4"
                          >
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                              <div className="flex items-center">
                                <div className="bg-[#FCEEEA] p-2 rounded-lg mr-3">
                                  <CalendarIcon c="w-5 h-5 text-[#D85E38]" />
                                </div>
                                <div>
                                  <h3 className="font-black text-lg text-[#1A1A1A]">
                                    {String(dateStr)}
                                  </h3>
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold mt-1 inline-block ${
                                      status === 'pending'
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'bg-[#F1F8F5] text-[#2F7E5B]'
                                    }`}
                                  >
                                    {status === 'pending'
                                      ? '主管審核中'
                                      : '已核准'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">
                                  平均得分
                                </span>
                                <span className="font-black text-2xl text-[#D85E38]">
                                  {avgScore}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {scoreKeys.map((itemId) => {
                                const itemInfo = dailyItems.find(
                                  (item) => item.id === itemId
                                );
                                const title = itemInfo
                                  ? itemInfo.title
                                  : '已刪除的評分項目';
                                const score = scores[itemId];
                                const scoreColor =
                                  score >= 90
                                    ? 'text-[#2F7E5B]'
                                    : score >= 60
                                    ? 'text-[#D85E38]'
                                    : 'text-red-500';

                                return (
                                  <div
                                    key={itemId}
                                    className="flex justify-between items-center p-3 bg-[#F0F2F5] rounded-xl"
                                  >
                                    <span className="font-bold text-sm text-gray-700">
                                      {String(title)}
                                    </span>
                                    <span
                                      className={`font-black text-lg ${scoreColor}`}
                                    >
                                      {score}{' '}
                                      <span className="text-[10px] text-gray-400 ml-0.5">
                                        分
                                      </span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* --- 新增：事件檢討紀錄 (Incidents) --- */}
            {activeTab === 'incidents' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="mb-4 px-1 mt-2">
                  <h2 className="font-black text-[#1A1A1A] text-3xl tracking-tight">
                    {canEdit ? '管理檢討紀錄' : '事件檢討單'}
                    <span className="text-[#D85E38]">.</span>
                  </h2>
                </div>

                {canEdit && (
                  <div className="flex overflow-x-auto hide-scrollbar mt-4 pt-2 mb-4">
                    <button
                      onClick={() => setActiveIncidentStoreFilter('all')}
                      className={`px-5 py-3.5 font-bold text-[14px] whitespace-nowrap transition-all rounded-t-[16px] border border-b-0 flex items-center gap-2 relative top-[1px] ${
                        activeIncidentStoreFilter === 'all'
                          ? 'bg-white text-[#5C6AC4] border-gray-200 z-10 pb-4'
                          : 'bg-[#F0F2F5] text-gray-400 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      全部門店
                    </button>
                    {stores.map((store) => (
                      <button
                        key={`inc-store-${store.id}`}
                        onClick={() => setActiveIncidentStoreFilter(store.name)}
                        className={`px-5 py-3.5 font-bold text-[14px] whitespace-nowrap transition-all rounded-t-[16px] border border-b-0 flex items-center gap-2 relative top-[1px] ${
                          activeIncidentStoreFilter === store.name
                            ? 'bg-white text-[#5C6AC4] border-gray-200 z-10 pb-4'
                            : 'bg-[#F0F2F5] text-gray-400 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {String(store.name)}
                      </button>
                    ))}
                    <div className="flex-1 border-b border-gray-200"></div>
                  </div>
                )}

                {canEdit && (
                  <div className="bg-white p-5 rounded-[28px] soft-shadow border border-gray-100 mb-6">
                    {isAddingIncident ? (
                      <div className="space-y-4 animate-in fade-in">
                        <h3 className="font-bold text-[#1A1A1A] mb-2 flex items-center">
                          <AlertTriangle c="w-4 h-4 mr-2 text-[#D85E38]" />{' '}
                          建立新檢討單
                        </h3>
                        <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block pl-1">
                            發生人員
                          </label>
                          <select
                            value={editIncidentData.empId}
                            onChange={(e) =>
                              setEditIncidentData({
                                ...editIncidentData,
                                empId: e.target.value,
                              })
                            }
                            className="w-full p-3.5 bg-[#F0F2F5] rounded-xl font-bold text-sm outline-none border-none"
                          >
                            <option value="">選擇員工...</option>
                            {employees
                              .filter(
                                (emp) =>
                                  activeIncidentStoreFilter === 'all' ||
                                  emp.store === activeIncidentStoreFilter
                              )
                              .map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {String(emp.name)} ({String(emp.store)})
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block pl-1">
                            事件標題
                          </label>
                          <input
                            type="text"
                            value={editIncidentData.title}
                            onChange={(e) =>
                              setEditIncidentData({
                                ...editIncidentData,
                                title: e.target.value,
                              })
                            }
                            className="w-full p-3.5 bg-[#F0F2F5] rounded-xl font-bold text-sm outline-none border-none"
                            placeholder="例如：遲到、服裝不整、客訴..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block pl-1">
                            事件描述 (選填)
                          </label>
                          <textarea
                            value={editIncidentData.description}
                            onChange={(e) =>
                              setEditIncidentData({
                                ...editIncidentData,
                                description: e.target.value,
                              })
                            }
                            className="w-full p-3.5 bg-[#F0F2F5] rounded-xl text-sm outline-none min-h-[80px] border-none"
                            placeholder="輸入管理員補充的詳細狀況..."
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              setIsAddingIncident(false);
                              setEditIncidentData({
                                empId: '',
                                title: '',
                                description: '',
                              });
                            }}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-full font-bold text-sm"
                          >
                            取消
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                !editIncidentData.empId ||
                                !editIncidentData.title.trim()
                              ) {
                                showToast('請選擇人員並輸入標題！');
                                return;
                              }
                              const empInfo = employees.find(
                                (e) => e.id === editIncidentData.empId
                              );
                              await addDoc(collection(db, 'incidents'), {
                                empId: empInfo.id,
                                empName: empInfo.name,
                                store: empInfo.store,
                                title: editIncidentData.title,
                                description: editIncidentData.description,
                                status: 'pending',
                                createdAt: Date.now(),
                              });
                              setIsAddingIncident(false);
                              setEditIncidentData({
                                empId: '',
                                title: '',
                                description: '',
                              });
                              showToast('已發送檢討單！');
                            }}
                            className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-full font-bold text-sm shadow-lg"
                          >
                            發送
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingIncident(true)}
                        className="w-full py-4 bg-[#FCEEEA] rounded-full text-sm text-[#D85E38] font-bold flex justify-center items-center hover:bg-[#F9E2DB] transition-colors border-none shadow-sm"
                      >
                        <PlusCircle c="w-5 h-5 mr-2" /> 新增事件檢討單
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {(() => {
                    let displayIncidents = canEdit
                      ? incidents
                      : incidents.filter(
                          (inc) => inc.empId === currentUserData?.id
                        );
                    if (canEdit && activeIncidentStoreFilter !== 'all')
                      displayIncidents = displayIncidents.filter(
                        (inc) => inc.store === activeIncidentStoreFilter
                      );
                    if (displayIncidents.length === 0)
                      return (
                        <div className="text-center py-10 bg-white rounded-[24px] text-gray-400 font-bold text-sm soft-shadow border border-gray-100">
                          目前尚無任何檢討紀錄
                        </div>
                      );

                    return displayIncidents.map((inc) => {
                      if (canEdit && editingIncidentId === inc.id) {
                        return (
                          <div
                            key={inc.id}
                            className="bg-white p-5 rounded-[24px] soft-shadow border border-gray-100 space-y-4 animate-in fade-in"
                          >
                            <input
                              type="text"
                              value={editIncidentData.title}
                              onChange={(e) =>
                                setEditIncidentData({
                                  ...editIncidentData,
                                  title: e.target.value,
                                })
                              }
                              className="w-full p-3.5 bg-[#F0F2F5] rounded-xl font-bold text-sm outline-none border-none"
                              placeholder="事件標題..."
                            />
                            <textarea
                              value={editIncidentData.description}
                              onChange={(e) =>
                                setEditIncidentData({
                                  ...editIncidentData,
                                  description: e.target.value,
                                })
                              }
                              className="w-full p-3.5 bg-[#F0F2F5] rounded-xl text-sm outline-none min-h-[80px] border-none"
                              placeholder="事件描述..."
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEditingIncidentId(null)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-full font-bold text-sm"
                              >
                                取消
                              </button>
                              <button
                                onClick={async () => {
                                  await updateDoc(
                                    doc(db, 'incidents', inc.id),
                                    {
                                      title: editIncidentData.title,
                                      description: editIncidentData.description,
                                    }
                                  );
                                  setEditingIncidentId(null);
                                  showToast('已儲存變更');
                                }}
                                className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-full font-bold text-sm shadow-lg"
                              >
                                儲存
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={inc.id}
                          className={`p-6 rounded-[24px] soft-shadow border relative overflow-hidden transition-all ${
                            inc.status === 'completed'
                              ? 'bg-white border-gray-100'
                              : 'bg-red-50/40 border-red-100'
                          }`}
                        >
                          {canEdit && (
                            <div className="absolute top-4 right-4 flex gap-1 z-10">
                              <button
                                onClick={() => {
                                  setEditingIncidentId(inc.id);
                                  setEditIncidentData({
                                    title: inc.title,
                                    description: inc.description || '',
                                  });
                                }}
                                className="p-2 text-gray-400 hover:text-[#1A1A1A] bg-gray-50 rounded-full"
                              >
                                <Edit c="w-4 h-4" />
                              </button>
                              {deletingIncidentId === inc.id ? (
                                <button
                                  onClick={async () => {
                                    await deleteDoc(
                                      doc(db, 'incidents', inc.id)
                                    );
                                    setDeletingIncidentId(null);
                                    showToast('已刪除！');
                                  }}
                                  className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in"
                                >
                                  確定刪除?
                                </button>
                              ) : (
                                <button
                                  onClick={() => setDeletingIncidentId(inc.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full"
                                >
                                  <Trash2 c="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            {inc.status === 'completed' ? (
                              <CheckCircle2 c="w-5 h-5 text-[#2F7E5B]" />
                            ) : (
                              <AlertTriangle c="w-5 h-5 text-red-500" />
                            )}
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                inc.status === 'completed'
                                  ? 'bg-[#F1F8F5] text-[#2F7E5B]'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {inc.status === 'completed'
                                ? '已結案'
                                : '待員工簽核'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              {new Date(inc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-black text-lg text-[#1A1A1A] mb-1 pr-16">
                            {String(inc.title)}
                          </h3>
                          {canEdit && (
                            <p className="text-[10px] text-gray-500 font-bold mb-2">
                              發生人員：{String(inc.empName)} (
                              {String(inc.store)})
                            </p>
                          )}
                          {inc.description && (
                            <p className="text-sm text-gray-600 mb-4 bg-white p-3 rounded-xl border border-gray-100">
                              {String(inc.description)}
                            </p>
                          )}

                          {inc.status === 'completed' ? (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                              <p className="text-xs font-bold text-gray-400 mb-2">
                                員工檢討內容
                              </p>
                              <p className="text-sm text-[#1A1A1A] font-bold bg-[#F0F2F5] p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                                {String(inc.reviewText)}
                              </p>
                              <div className="mt-4 flex justify-between items-end border-t border-dashed border-gray-200 pt-3">
                                <div className="text-[10px] text-gray-400 font-bold">
                                  簽署時間
                                  <br />
                                  <span className="text-gray-600">
                                    {new Date(inc.completedAt).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] text-gray-400 font-bold mb-1">
                                    本人親簽
                                  </span>
                                  <img
                                    src={inc.signatureBase64}
                                    alt="簽名"
                                    className="h-12 object-contain bg-white px-2 rounded border border-gray-100"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            !canEdit && (
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    show: true,
                                    incident: inc,
                                    text: '',
                                  })
                                }
                                className="mt-4 w-full py-3.5 bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-red-600 transition-colors flex justify-center items-center"
                              >
                                <PenTool c="w-4 h-4 mr-2" /> 填寫檢討與簽名
                              </button>
                            )
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* --- 個人資料 / 人員名單 --- */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="mb-4 px-1 mt-2">
                  <h2 className="font-black text-[#1A1A1A] text-3xl tracking-tight">
                    {isProfileTabAdmin ? '人員門店' : '個人資料'}
                    <span className="text-[#D85E38]">.</span>
                  </h2>
                </div>

                {isProfileTabAdmin && (
                  <div className="mb-4">
                    <div className="bg-white p-2 rounded-full soft-shadow flex items-center border border-gray-50 mb-6">
                      <div className="bg-[#F0F2F5] p-3 rounded-full">
                        <Search c="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜尋姓名或門店..."
                        className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-700 px-3 border-none"
                      />
                    </div>

                    <div className="flex overflow-x-auto hide-scrollbar mt-4 pt-2 mb-4">
                      <button
                        onClick={() => setActiveStoreFilter('all')}
                        className={`px-5 py-3.5 font-bold text-[14px] whitespace-nowrap transition-all rounded-t-[16px] border border-b-0 flex items-center gap-2 relative top-[1px] ${
                          activeStoreFilter === 'all'
                            ? 'bg-white text-[#5C6AC4] border-gray-200 z-10 pb-4'
                            : 'bg-[#F0F2F5] text-gray-400 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        全部門店
                      </button>
                      {stores.map((store) => (
                        <button
                          key={store.id}
                          draggable={canEdit}
                          onDragStart={() => {
                            if (canEdit) setDraggedStoreId(store.id);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (canEdit) handleStoreDrop(store.id);
                          }}
                          onClick={() => setActiveStoreFilter(store.name)}
                          className={`px-5 py-3.5 font-bold text-[14px] whitespace-nowrap transition-all rounded-t-[16px] border border-b-0 flex items-center gap-2 relative top-[1px] ${
                            activeStoreFilter === store.name
                              ? 'bg-white text-[#5C6AC4] border-gray-200 z-10 pb-4'
                              : 'bg-[#F0F2F5] text-gray-400 border-transparent hover:bg-gray-100'
                          } ${
                            draggedStoreId === store.id
                              ? 'opacity-40 border-dashed border-[#5C6AC4]'
                              : ''
                          }`}
                        >
                          {String(store.name)}
                        </button>
                      ))}
                      {canEdit && (
                        <button
                          onClick={() => setIsAddingStore(true)}
                          className="px-4 py-3.5 text-gray-400 hover:text-[#5C6AC4] border-b border-gray-200 flex-1 text-left flex items-center min-w-[100px]"
                        >
                          <PlusCircle c="w-4 h-4 mr-1" />{' '}
                          <span className="text-[12px] font-bold">
                            新增門店
                          </span>
                        </button>
                      )}
                      {!canEdit && (
                        <div className="flex-1 border-b border-gray-200"></div>
                      )}
                    </div>

                    {canEdit && isAddingStore && (
                      <div className="mb-4 bg-white p-4 rounded-[16px] soft-shadow flex gap-2 border border-gray-100 animate-in fade-in">
                        <input
                          type="text"
                          autoFocus
                          value={newStoreName}
                          onChange={(e) => setNewStoreName(e.target.value)}
                          className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-sm"
                          placeholder="輸入新門店名稱..."
                        />
                        <button
                          onClick={async () => {
                            if (newStoreName.trim()) {
                              await addDoc(collection(db, 'stores'), {
                                name: newStoreName.trim(),
                                order: stores.length,
                                createdAt: Date.now(),
                              });
                              setIsAddingStore(false);
                              setNewStoreName('');
                              setActiveStoreFilter(newStoreName.trim());
                              showToast('新門店已建立');
                            }
                          }}
                          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
                        >
                          儲存
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingStore(false);
                            setNewStoreName('');
                          }}
                          className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-xs font-bold"
                        >
                          取消
                        </button>
                      </div>
                    )}

                    {canEdit &&
                      activeStoreFilter !== 'all' &&
                      !isAddingStore &&
                      (() => {
                        const activeStoreObj = stores.find(
                          (s) => s.name === activeStoreFilter
                        );
                        if (!activeStoreObj) return null;
                        return (
                          <div className="mb-5 bg-white p-4 rounded-[20px] soft-shadow flex items-center justify-between border border-gray-100">
                            {editingStoreId === activeStoreObj.id ? (
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={editStoreName}
                                  onChange={(e) =>
                                    setEditStoreName(e.target.value)
                                  }
                                  className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none font-bold text-sm"
                                  placeholder="門店名稱"
                                />
                                <button
                                  onClick={async () => {
                                    if (editStoreName.trim()) {
                                      const qSnap = employees.filter(
                                        (e) => e.store === activeStoreObj.name
                                      );
                                      for (let e of qSnap) {
                                        await updateDoc(
                                          doc(db, 'employees', e.id),
                                          { store: editStoreName.trim() }
                                        );
                                      }
                                      await updateDoc(
                                        doc(db, 'stores', activeStoreObj.id),
                                        { name: editStoreName.trim() }
                                      );
                                      setEditingStoreId(null);
                                      setActiveStoreFilter(
                                        editStoreName.trim()
                                      );
                                      showToast('門店名稱已更新');
                                    }
                                  }}
                                  className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-xs font-bold"
                                >
                                  儲存
                                </button>
                                <button
                                  onClick={() => setEditingStoreId(null)}
                                  className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-xs font-bold"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <>
                                <h3 className="font-black text-[#1A1A1A] text-[15px] flex items-center">
                                  {String(activeStoreObj.name)}
                                  <span className="ml-3 text-[10px] bg-[#F0F2F5] text-gray-500 px-2.5 py-1 rounded-full">
                                    {
                                      employees.filter(
                                        (e) => e.store === activeStoreObj.name
                                      ).length
                                    }{' '}
                                    人
                                  </span>
                                </h3>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingStoreId(activeStoreObj.id);
                                      setEditStoreName(activeStoreObj.name);
                                    }}
                                    className="p-2 text-gray-400 hover:text-[#5C6AC4] bg-gray-50 rounded-full transition-colors"
                                  >
                                    <Edit c="w-4 h-4" />
                                  </button>
                                  {deletingStoreId === activeStoreObj.id ? (
                                    <button
                                      onClick={async () => {
                                        await deleteDoc(
                                          doc(db, 'stores', activeStoreObj.id)
                                        );
                                        setDeletingStoreId(null);
                                        setActiveStoreFilter('all');
                                        showToast('門店已刪除');
                                      }}
                                      className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in"
                                    >
                                      確定刪除?
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setDeletingStoreId(activeStoreObj.id)
                                      }
                                      className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full transition-colors"
                                    >
                                      <Trash2 c="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                )}

                {isProfileTabAdmin && (
                  <div className="bg-white p-4 rounded-[28px] soft-shadow mb-4 border border-gray-50">
                    {isAddingEmployee ? (
                      <div className="flex flex-col space-y-4 bg-[#F0F2F5] p-6 rounded-[24px]">
                        <h3 className="font-black text-lg text-[#1A1A1A] mb-2 flex items-center">
                          <User c="w-5 h-5 mr-2 text-[#D85E38]" /> 新增人員
                        </h3>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 mb-1.5 block pl-1">
                            員工姓名
                          </label>
                          <input
                            type="text"
                            value={newEmployeeData.name}
                            onChange={(e) =>
                              setNewEmployeeData({
                                ...newEmployeeData,
                                name: e.target.value,
                              })
                            }
                            className="w-full p-3.5 bg-white border-none rounded-[16px] font-bold text-sm outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-[#1A1A1A]"
                            placeholder="輸入姓名"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block pl-1">
                              所屬門店
                            </label>
                            <select
                              value={newEmployeeData.store}
                              onChange={(e) =>
                                setNewEmployeeData({
                                  ...newEmployeeData,
                                  store: e.target.value,
                                })
                              }
                              className="w-full p-3.5 bg-white border-none rounded-[16px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-[#1A1A1A]"
                            >
                              <option value="" disabled>
                                選擇門店...
                              </option>
                              {stores.map((store) => (
                                <option key={store.id} value={store.name}>
                                  {String(store.name)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block pl-1">
                              職位權限
                            </label>
                            <select
                              value={newEmployeeData.role}
                              onChange={(e) =>
                                setNewEmployeeData({
                                  ...newEmployeeData,
                                  role: e.target.value,
                                })
                              }
                              className="w-full p-3.5 bg-white border-none rounded-[16px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-[#1A1A1A]"
                            >
                              <option value="" disabled>
                                選擇職位...
                              </option>
                              {jobRoles.map((role) => (
                                <option key={role} value={role}>
                                  {String(role)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 mb-1.5 block pl-1">
                            登入密碼 (6碼數字)
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={newEmployeeData.password}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 6)
                                setNewEmployeeData({
                                  ...newEmployeeData,
                                  password: val,
                                });
                            }}
                            className="w-full p-3.5 bg-white border-none rounded-[16px] font-bold text-sm outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-[#1A1A1A] tracking-widest"
                            placeholder="設定6碼密碼"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              setIsAddingEmployee(false);
                              setNewEmployeeData({
                                name: '',
                                store: '',
                                role: '',
                                password: '',
                              });
                            }}
                            className="flex-1 py-3.5 bg-white text-gray-600 text-sm font-bold rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={saveNewEmployee}
                            className="flex-1 py-3.5 bg-[#1A1A1A] text-white text-sm font-bold rounded-full shadow-lg hover:bg-black transition-colors"
                          >
                            儲存新增
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingEmployee(true)}
                        className="w-full py-4 bg-[#FCEEEA] rounded-full text-sm text-[#D85E38] font-bold flex justify-center items-center hover:bg-[#F9E2DB] transition-colors border-none shadow-sm"
                      >
                        <PlusCircle c="w-5 h-5 mr-2" /> 直接新增人員
                      </button>
                    )}
                  </div>
                )}

                {filteredDisplayEmployees.map((emp) => {
                  const empIncidents = incidents.filter(
                    (inc) => inc.empId === emp.id
                  );
                  const activeEmpTab = empTabs[emp.id] || 'incidents';

                  let totalOverallScore = 0;
                  let monthTotalScore = 0;
                  let monthDays = 0;
                  const currentMonthStr = new Date().toISOString().slice(0, 7);
                  Object.entries(emp.dailyRecords || {}).forEach(
                    ([dateStr, recordData]: any) => {
                      if (recordData.status === 'approved') {
                        const sc = recordData.scores || recordData;
                        const vals = Object.values(sc).map(Number);
                        if (vals.length > 0) {
                          const dailyAvg =
                            vals.reduce((a, b) => a + b, 0) / vals.length;
                          totalOverallScore += vals.reduce((a, b) => a + b, 0);
                          if (dateStr.startsWith(currentMonthStr)) {
                            monthTotalScore += dailyAvg;
                            monthDays++;
                          }
                        }
                      }
                    }
                  );
                  const monthAvg =
                    monthDays > 0 ? Math.round(monthTotalScore / monthDays) : 0;

                  return (
                    <div
                      key={emp.id}
                      className="bg-white rounded-[32px] p-6 soft-shadow relative mb-4 border border-gray-50 flex flex-col overflow-hidden"
                    >
                      {editingEmployeeId === emp.id ? (
                        <div className="flex flex-col space-y-4 bg-[#F0F2F5] p-6 rounded-[24px] mb-4">
                          <h3 className="font-black text-lg text-[#1A1A1A] mb-2 flex items-center">
                            <Edit c="w-5 h-5 mr-2 text-[#D85E38]" />{' '}
                            編輯人員資料
                          </h3>
                          <div className="flex items-center gap-4 mb-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarPickerTarget('edit');
                                setShowAvatarPicker(true);
                              }}
                              className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden cursor-pointer group border-2 border-dashed border-gray-300 hover:border-[#D85E38] transition-colors"
                            >
                              {(editEmployeeData.avatarId || editEmpSelectedAvatar) ? (
                                <AvatarDisplay avatarId={editEmployeeData.avatarId || editEmpSelectedAvatar} />
                              ) : editEmployeeData.avatarUrl ? (
                                <img src={editEmployeeData.avatarUrl} className="w-full h-full object-cover" />
                              ) : (
                                <User c="w-8 h-8 text-gray-400" />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <Camera c="w-5 h-5 text-white" />
                              </div>
                            </button>
                            <span className="text-xs text-gray-500 font-bold">
                              點擊更換頭貼
                            </span>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block pl-1">
                              員工姓名
                            </label>
                            <input
                              type="text"
                              value={editEmployeeData.name}
                              onChange={(e) =>
                                setEditEmployeeData({
                                  ...editEmployeeData,
                                  name: e.target.value,
                                })
                              }
                              className="w-full p-3.5 bg-white border-none rounded-[16px] font-bold text-sm outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-[#1A1A1A]"
                              placeholder="修改姓名"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block pl-1">
                                所屬門店
                              </label>
                              <select
                                value={editEmployeeData.store}
                                onChange={(e) =>
                                  setEditEmployeeData({
                                    ...editEmployeeData,
                                    store: e.target.value,
                                  })
                                }
                                className="w-full p-3.5 bg-white border-none rounded-[16px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-[#1A1A1A]"
                              >
                                {stores.map((store) => (
                                  <option key={store.id} value={store.name}>
                                    {String(store.name)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block pl-1">
                                職位權限
                              </label>
                              <select
                                value={editEmployeeData.role}
                                onChange={(e) =>
                                  setEditEmployeeData({
                                    ...editEmployeeData,
                                    role: e.target.value,
                                  })
                                }
                                className="w-full p-3.5 bg-white border-none rounded-[16px] text-sm font-bold outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-[#1A1A1A]"
                              >
                                {jobRoles.map((role) => (
                                  <option key={role} value={role}>
                                    {String(role)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block pl-1">
                              登入密碼 (6碼數字)
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              value={editEmployeeData.password}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 6)
                                  setEditEmployeeData({
                                    ...editEmployeeData,
                                    password: val,
                                  });
                              }}
                              className="w-full p-3.5 bg-white border-none rounded-[16px] font-bold text-sm outline-none focus:ring-2 focus:ring-[#D85E38]/50 text-[#1A1A1A] tracking-widest"
                              placeholder="輸入新密碼"
                            />
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => setEditingEmployeeId(null)}
                              className="flex-1 py-3.5 bg-white text-gray-600 text-sm font-bold rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => saveEditEmployee(emp.id)}
                              className="flex-1 py-3.5 bg-[#1A1A1A] text-white text-sm font-bold rounded-full shadow-lg hover:bg-black transition-colors"
                            >
                              儲存變更
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* === 第一面：基本資料 === */}
                          <div className="flex justify-between items-start mb-5">
                            <div className="flex items-center space-x-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setAvatarPickerTarget(emp.id);
                                  setShowAvatarPicker(true);
                                }}
                                className="relative w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center overflow-hidden cursor-pointer group border-2 border-white shadow-sm"
                              >
                                {emp.avatarId ? (
                                  <AvatarDisplay avatarId={emp.avatarId} />
                                ) : emp.avatarUrl ? (
                                  <img src={emp.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <User c="w-8 h-8 text-gray-400" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                  <Camera c="w-5 h-5 text-white" />
                                </div>
                              </button>
                              <div>
                                <h3 className="font-black text-xl mb-1">
                                  {String(emp.name)}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <RoleBadge role={emp.role} />
                                  <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                                    {String(emp.store)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isProfileTabAdmin && (
                              <div className="flex items-center gap-1 bg-[#F0F2F5] p-1 rounded-full relative z-10">
                                <button
                                  onClick={() => startEditEmployee(emp)}
                                  className="text-gray-500 hover:text-[#1A1A1A] p-2 hover:bg-white rounded-full transition-colors"
                                >
                                  <Edit c="w-4 h-4" />
                                </button>
                                {deletingEmployeeId === emp.id ? (
                                  <button
                                    onClick={async () => {
                                      await deleteDoc(
                                        doc(db, 'employees', emp.id)
                                      );
                                      setDeletingEmployeeId(null);
                                      showToast('人員已刪除');
                                    }}
                                    className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-in fade-in"
                                  >
                                    確定刪除?
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setDeletingEmployeeId(emp.id)
                                    }
                                    className="text-gray-400 hover:text-red-500 p-2 hover:bg-white rounded-full transition-colors"
                                  >
                                    <Trash2 c="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* === 橫式成就解鎖 UI === */}
                          <div className="mb-5">
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-xs text-[#1A1A1A] font-black flex items-center">
                                <Award c="w-3.5 h-3.5 mr-1.5 text-[#3B82F6]" />{' '}
                                考試成就解鎖
                              </p>
                              <span className="text-[10px] text-[#3B82F6] font-bold bg-blue-50 px-2.5 py-0.5 rounded-full">
                                已解鎖{' '}
                                {
                                  categories.filter((c, index) => {
                                    const catExams = exams.filter(
                                      (e) =>
                                        e.categoryId === c.id ||
                                        (!e.categoryId && index === 0)
                                    );
                                    if (catExams.length === 0) return false;
                                    return catExams.every((exam) => {
                                      const record = emp.examRecords?.[exam.id];
                                      return (
                                        record === 'passed' ||
                                        (record &&
                                          typeof record === 'object' &&
                                          record.status === 'passed')
                                      );
                                    });
                                  }).length
                                }{' '}
                                / {categories.length}
                              </span>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-[20px] p-5">
                              <AchievementProgress
                                emp={emp}
                                categories={categories}
                                exams={exams}
                              />
                            </div>
                          </div>

                          {/* === 後台：風琴式切換 UI === */}
                          {isProfileTabAdmin ? (
                            <>
                              <div className="flex bg-[#F0F2F5] p-1 rounded-xl mb-4 overflow-x-auto hide-scrollbar">
                                <button
                                  onClick={() =>
                                    setEmpTabs((p) => ({
                                      ...p,
                                      [emp.id]: 'incidents',
                                    }))
                                  }
                                  className={`px-4 py-2 text-[11px] font-bold rounded-lg whitespace-nowrap flex-1 transition-all ${
                                    activeEmpTab === 'incidents'
                                      ? 'bg-white shadow-sm text-[#D85E38]'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  檢討紀錄
                                </button>
                                <button
                                  onClick={() =>
                                    setEmpTabs((p) => ({
                                      ...p,
                                      [emp.id]: 'daily',
                                    }))
                                  }
                                  className={`px-4 py-2 text-[11px] font-bold rounded-lg whitespace-nowrap flex-1 transition-all ${
                                    activeEmpTab === 'daily'
                                      ? 'bg-white shadow-sm text-[#D85E38]'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  平時紀錄
                                </button>
                                <button
                                  onClick={() =>
                                    setEmpTabs((p) => ({
                                      ...p,
                                      [emp.id]: 'personality',
                                    }))
                                  }
                                  className={`px-4 py-2 text-[11px] font-bold rounded-lg whitespace-nowrap flex-1 transition-all ${
                                    activeEmpTab === 'personality'
                                      ? 'bg-white shadow-sm text-[#D85E38]'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  個性特徵
                                </button>
                              </div>

                              <div className="flex-1">
                                {/* 第二面：管理檢討紀錄 */}
                                {activeEmpTab === 'incidents' && (
                                  <div className="animate-in fade-in duration-200">
                                    {empIncidents.length === 0 ? (
                                      <p className="text-center text-xs text-gray-400 font-bold bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
                                        目前沒有檢討紀錄
                                      </p>
                                    ) : (
                                      <div className="space-y-3">
                                        {empIncidents.map((inc) => (
                                          <div
                                            key={inc.id}
                                            className="bg-red-50/50 rounded-xl p-4 border border-red-100"
                                          >
                                            <div className="flex justify-between items-start mb-2">
                                              <span className="text-sm font-black text-gray-800">
                                                {String(inc.title)}
                                              </span>
                                              {inc.status === 'completed' ? (
                                                <span className="text-[10px] text-[#2F7E5B] bg-[#F1F8F5] px-2 py-1 rounded-md font-bold">
                                                  已完成
                                                </span>
                                              ) : (
                                                <span className="text-[10px] text-red-500 bg-white px-2 py-1 rounded-md font-bold border border-red-100">
                                                  待簽寫
                                                </span>
                                              )}
                                            </div>
                                            {inc.status === 'completed' && (
                                              <div className="mt-3 bg-white p-3 rounded-lg shadow-sm border border-red-50">
                                                <p className="text-xs text-gray-700 font-bold leading-relaxed whitespace-pre-wrap">
                                                  {String(inc.reviewText)}
                                                </p>
                                                <div className="border-t border-dashed border-gray-200 mt-2 pt-2 flex justify-between items-end">
                                                  <div className="text-[9px] text-gray-400 font-bold">
                                                    簽署時間
                                                    <br />
                                                    <span className="text-gray-500">
                                                      {new Date(
                                                        inc.completedAt
                                                      ).toLocaleDateString()}
                                                    </span>
                                                  </div>
                                                  <img
                                                    src={inc.signatureBase64}
                                                    className="h-6 object-contain"
                                                    alt="簽名"
                                                  />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 第三面：平時紀錄統計 */}
                                {activeEmpTab === 'daily' && (
                                  <div className="animate-in fade-in duration-200 grid grid-cols-2 gap-3">
                                    <div className="bg-[#F0F2F5] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                      <p className="text-[10px] font-bold text-gray-500 mb-1">
                                        當月平均分數
                                      </p>
                                      <p className="text-2xl font-black text-[#D85E38]">
                                        {monthAvg}{' '}
                                        <span className="text-[10px] text-gray-400">
                                          分
                                        </span>
                                      </p>
                                    </div>
                                    <div className="bg-[#F0F2F5] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                                      <p className="text-[10px] font-bold text-gray-500 mb-1">
                                        歷史總分數
                                      </p>
                                      <p className="text-2xl font-black text-[#1A1A1A]">
                                        {totalOverallScore}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* 第四面：個性特徵 (後台可自由編輯) */}
                                {activeEmpTab === 'personality' && (
                                  <div className="animate-in fade-in duration-200">
                                    <textarea
                                      value={
                                        editPersonalityObj[emp.id] !== undefined
                                          ? editPersonalityObj[emp.id]
                                          : emp.personalityText || ''
                                      }
                                      onChange={(e) =>
                                        setEditPersonalityObj((p) => ({
                                          ...p,
                                          [emp.id]: e.target.value,
                                        }))
                                      }
                                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#D85E38]/50 min-h-[100px] resize-none"
                                      placeholder="請輸入此人的性格特徵或備註..."
                                    />
                                    <div className="flex justify-end mt-2">
                                      <button
                                        onClick={async () => {
                                          const txt =
                                            editPersonalityObj[emp.id] !==
                                            undefined
                                              ? editPersonalityObj[emp.id]
                                              : emp.personalityText || '';
                                          await updateDoc(
                                            doc(db, 'employees', emp.id),
                                            { personalityText: txt }
                                          );
                                          showToast('已儲存個性特徵！');
                                        }}
                                        className="bg-[#1A1A1A] text-white text-xs px-5 py-2.5 rounded-full font-bold hover:bg-black transition-colors shadow-sm"
                                      >
                                        儲存設定
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            /* === 前台員工視角：性格特徵由後台管理，前台不顯示 === */
                            null
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* --- 底部導覽列 --- */}
          <nav className="bg-white/95 backdrop-blur-md border-t border-gray-200/60 flex justify-around items-center h-[85px] pb-safe z-30 shrink-0 px-4 relative">
            <button
              onClick={() => setActiveTab('exams')}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-colors ${
                activeTab === 'exams' || activeTab === 'exam-grading'
                  ? 'text-[#D85E38]'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  activeTab === 'exams' || activeTab === 'exam-grading'
                    ? 'bg-[#FCEEEA]'
                    : 'bg-transparent'
                }`}
              >
                <ClipboardCheck c="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold">考試</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-colors ${
                activeTab === 'profile' || activeTab === 'pending'
                  ? 'text-[#D85E38]'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  activeTab === 'profile' || activeTab === 'pending'
                    ? 'bg-[#FCEEEA]'
                    : 'bg-transparent'
                }`}
              >
                <User c="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold">
                {isProfileTabAdmin ? '人員門店' : '個人資料'}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* 員工填寫檢討紀錄彈窗 */}
      {reviewModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-[32px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <h3 className="font-black text-xl mb-4 text-[#1A1A1A] flex items-center">
              <PenTool c="w-6 h-6 mr-2 text-red-500" /> 填寫檢討與簽名
            </h3>
            <div className="bg-red-50 p-4 rounded-xl mb-4 border border-red-100 shrink-0">
              <p className="font-bold text-red-800 text-sm mb-1">
                {String(reviewModal.incident?.title)}
              </p>
              <p className="text-xs text-red-600">
                {String(reviewModal.incident?.description)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 hide-scrollbar">
              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1.5">
                  我的檢討內容
                </label>
                <textarea
                  value={reviewModal.text}
                  onChange={(e) =>
                    setReviewModal({ ...reviewModal, text: e.target.value })
                  }
                  className="w-full p-4 bg-[#F0F2F5] rounded-xl text-sm outline-none border-none min-h-[100px] font-bold text-gray-700"
                  placeholder="請輸入您對此次事件的檢討與改善方式..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1.5">
                  員工簽名
                </label>
                <SignaturePad
                  onSave={async (base64) => {
                    if (!reviewModal.text.trim()) {
                      showToast('請填寫檢討內容！');
                      return;
                    }
                    try {
                      await updateDoc(
                        doc(db, 'incidents', reviewModal.incident.id),
                        {
                          status: 'completed',
                          reviewText: reviewModal.text,
                          signatureBase64: base64,
                          completedAt: Date.now(),
                        }
                      );
                      setReviewModal({ show: false, incident: null, text: '' });
                      showToast('檢討單已完成！');
                    } catch (error) {
                      showToast('儲存失敗，請檢查網路連線。');
                    }
                  }}
                />
              </div>
            </div>

            <button
              onClick={() =>
                setReviewModal({ show: false, incident: null, text: '' })
              }
              className="mt-4 w-full py-3 bg-gray-100 text-gray-600 rounded-full font-bold text-sm shrink-0 hover:bg-gray-200 transition-colors"
            >
              取消返回
            </button>
          </div>
        </div>
      )}

      {/* 考官簽核彈出視窗 (用於實作/口述) */}
      {proctorModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#FCEEEA] rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckSquare c="w-8 h-8 text-[#D85E38]" />
            </div>
            <h3 className="font-black text-xl mb-2 text-[#1A1A1A]">考官確認</h3>
            <p className="text-sm text-gray-500 font-bold mb-6">
              是否確認該名員工已完成此項目的現場考核？
              <br />
              <span className="text-[#D85E38] text-[11px] mt-2 inline-block bg-orange-50 px-3 py-1 rounded-full">
                目前考官：{String(proctorModal.proctorName)}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setProctorModal({
                    show: false,
                    examId: null,
                    proctorName: '',
                  })
                }
                className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={submitProctorSignoff}
                className="flex-1 py-3.5 bg-[#D85E38] text-white rounded-full font-bold text-sm shadow-lg hover:bg-[#C25330] transition-colors"
              >
                確認核准
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 考官評閱問答題視窗 */}
      {proctorReviewModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <PenTool c="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-black text-xl mb-2 text-[#1A1A1A]">考官評閱</h3>
            <p className="text-sm text-gray-500 font-bold mb-4">
              {proctorReviewModal.verified
                ? '請確認該員工的作答是否通過？'
                : '請輸入考官密碼以查看答案並評分'}
              <br />
              <span className="text-orange-600 text-[11px] mt-2 inline-block bg-orange-50 px-3 py-1 rounded-full">
                評閱考官：{String(proctorReviewModal.proctorName)}
              </span>
            </p>

            {!proctorReviewModal.verified ? (
              <div className="space-y-4">
                <div className="text-left bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {(() => {
                    const reviewRecord =
                      currentUserData?.examRecords?.[proctorReviewModal.examId];
                    return (
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">
                          員工的作答：
                        </span>
                        <p className="text-sm text-gray-800 font-bold whitespace-pre-wrap break-words">
                          {reviewRecord?.userAnswer || '未填寫'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
                <input
                  type="password"
                  value={proctorReviewModal.password}
                  onChange={(e) =>
                    setProctorReviewModal({
                      ...proctorReviewModal,
                      password: e.target.value,
                    })
                  }
                  className="w-full p-3.5 bg-[#F0F2F5] rounded-xl font-bold text-sm text-[#1A1A1A] outline-none text-center tracking-[0.3em] border-2 border-transparent focus:border-orange-400"
                  placeholder="請輸入考官密碼（6碼）"
                  maxLength={6}
                />
                <button
                  onClick={() => {
                    const proctorEmp = employees.find(
                      (emp) => emp.name === proctorReviewModal.proctorName
                    );
                    if (
                      proctorEmp &&
                      proctorEmp.password === proctorReviewModal.password
                    ) {
                      setProctorReviewModal({
                        ...proctorReviewModal,
                        verified: true,
                      });
                    } else {
                      showToast('密碼錯誤，請重新輸入！');
                      setProctorReviewModal({
                        ...proctorReviewModal,
                        password: '',
                      });
                    }
                  }}
                  className="w-full py-3.5 bg-[#5C6AC4] text-white rounded-full font-bold text-sm shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  驗證密碼
                </button>
                <button
                  onClick={() =>
                    setProctorReviewModal({
                      show: false,
                      examId: null,
                      proctorName: '',
                      password: '',
                      verified: false,
                    })
                  }
                  className="w-full py-3.5 bg-gray-100 text-gray-600 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  取消返回
                </button>
              </div>
            ) : (
              <>
                {(() => {
                  const reviewExam = exams.find(
                    (e) => e.id === proctorReviewModal.examId
                  );
                  const reviewRecord =
                    currentUserData?.examRecords?.[proctorReviewModal.examId];
                  return (
                    <div className="text-left bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 max-h-[40vh] overflow-y-auto">
                      <div className="mb-3">
                        <span className="text-[10px] text-gray-400 font-bold block mb-1">
                          員工的作答：
                        </span>
                        <p className="text-sm text-gray-800 font-bold whitespace-pre-wrap break-words">
                          {reviewRecord?.userAnswer || '未填寫'}
                        </p>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <span className="text-[10px] text-[#D85E38] font-bold block mb-1">
                          後台標準答案：
                        </span>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                          {reviewExam?.correctAnswer || '未設定標準答案'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      const exam = exams.find(
                        (e) => e.id === proctorReviewModal.examId
                      );
                      if (!exam) return;
                      const newRecords = { ...currentUserData.examRecords };
                      const prevMistakes = newRecords[exam.id]?.mistakes || 0;
                      newRecords[exam.id] = {
                        ...newRecords[exam.id],
                        status: 'passed',
                        approver: proctorReviewModal.proctorName,
                        timestamp: Date.now(),
                        title: exam.title,
                        mistakes: prevMistakes,
                      };
                      await updateDoc(doc(db, 'employees', currentUserData.id), {
                        examRecords: newRecords,
                      });
                      showToast('已核准通過！');
                      setProctorReviewModal({
                        show: false,
                        examId: null,
                        proctorName: '',
                        password: '',
                        verified: false,
                      });
                    }}
                    className="w-full py-3.5 bg-[#2F7E5B] text-white rounded-full font-bold text-sm shadow-lg hover:bg-[#256348] transition-colors"
                  >
                    通過 (Pass)
                  </button>
                  <button
                    onClick={async () => {
                      const exam = exams.find(
                        (e) => e.id === proctorReviewModal.examId
                      );
                      if (!exam) return;
                      const newRecords = { ...currentUserData.examRecords };
                      const prevMistakes = newRecords[exam.id]?.mistakes || 0;
                      newRecords[exam.id] = {
                        ...newRecords[exam.id],
                        status: 'failed',
                        approver: proctorReviewModal.proctorName,
                        timestamp: Date.now(),
                        title: exam.title,
                        mistakes: prevMistakes + 1,
                      };
                      await updateDoc(doc(db, 'employees', currentUserData.id), {
                        examRecords: newRecords,
                      });
                      showToast('已退回，需重新作答。');
                      setProctorReviewModal({
                        show: false,
                        examId: null,
                        proctorName: '',
                        password: '',
                        verified: false,
                      });
                    }}
                    className="w-full py-3.5 bg-red-500 text-white rounded-full font-bold text-sm shadow-lg hover:bg-red-600 transition-colors"
                  >
                    不通過 (Fail)
                  </button>
                  <button
                    onClick={() =>
                      setProctorReviewModal({
                        show: false,
                        examId: null,
                        proctorName: '',
                        password: '',
                        verified: false,
                      })
                    }
                    className="w-full py-3.5 bg-gray-100 text-gray-600 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
                  >
                    取消返回
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* App 設定彈窗 (標題 + Logo) */}
      {showAppConfigModal && canEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-[32px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-[#1A1A1A] flex items-center">
                <Settings c="w-6 h-6 mr-2 text-[#D85E38]" /> 系統外觀設定
              </h3>
              <button onClick={() => setShowAppConfigModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                <XCircle c="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 標題設定 */}
            <div className="mb-5">
              <label className="text-[11px] font-bold text-gray-500 block mb-2 ml-1">系統標題名稱</label>
              <input
                type="text"
                value={editAppTitle}
                onChange={(e) => setEditAppTitle(e.target.value)}
                className="w-full p-4 bg-[#F0F2F5] rounded-[20px] font-bold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#D85E38]/50 border-none text-sm"
                placeholder="例如：XX 門市學習平台"
                maxLength={20}
              />
              <button
                onClick={async () => {
                  if (!editAppTitle.trim()) { showToast('請輸入標題名稱！'); return; }
                  await setDoc(doc(db, 'settings', 'appConfig'), { ...appConfig, title: editAppTitle.trim() }, { merge: true });
                  showToast('標題已更新！');
                }}
                className="mt-3 w-full py-3 bg-[#1A1A1A] text-white rounded-full font-bold text-sm hover:bg-black transition-colors shadow-md"
              >
                儲存標題
              </button>
            </div>

            {/* 考試評分紀錄標題設定 */}
            <div className="mb-5 pt-5 border-t border-gray-100">
              <label className="text-[11px] font-bold text-gray-500 block mb-2 ml-1">考試評分紀錄頁標題</label>
              <input
                type="text"
                value={appConfig.examGradingTitle || '考試評分紀錄'}
                onChange={(e) => setAppConfig(prev => ({ ...prev, examGradingTitle: e.target.value }))}
                className="w-full p-4 bg-[#F0F2F5] rounded-[20px] font-bold text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#D85E38]/50 border-none text-sm"
                placeholder="例如：門市考核評分"
                maxLength={20}
              />
              <button
                onClick={async () => {
                  await setDoc(doc(db, 'settings', 'appConfig'), { ...appConfig }, { merge: true });
                  showToast('評分紀錄標題已更新！');
                }}
                className="mt-3 w-full py-3 bg-[#1A1A1A] text-white rounded-full font-bold text-sm hover:bg-black transition-colors shadow-md"
              >
                儲存標題
              </button>
            </div>

            {/* Logo 設定 */}
            <div className="pt-5 border-t border-gray-100">
              <label className="text-[11px] font-bold text-gray-500 block mb-3 ml-1">系統 Logo 圖示</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#FCEEEA] flex items-center justify-center shrink-0 shadow-sm border-2 border-white">
                  {appConfig.logoUrl ? (
                    <img src={appConfig.logoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <ShieldCheck c="w-8 h-8 text-[#D85E38]" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 w-full py-3 bg-[#FCEEEA] text-[#D85E38] rounded-full font-bold text-sm cursor-pointer hover:bg-[#F9E2DB] transition-colors">
                    {isUploadingLogo ? '上傳中...' : (
                      <><Camera c="w-4 h-4" /> 上傳 Logo 圖片</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingLogo}
                      onChange={handleLogoUpload}
                    />
                  </label>
                  {appConfig.logoUrl && (
                    <button
                      onClick={async () => {
                        await setDoc(doc(db, 'settings', 'appConfig'), { ...appConfig, logoUrl: '' }, { merge: true });
                        showToast('Logo 已移除');
                      }}
                      className="mt-2 w-full py-2 text-gray-400 text-xs font-bold hover:text-red-500 transition-colors"
                    >
                      移除 Logo（使用預設圖示）
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* GPS 設定入口 */}
            <div className="pt-5 border-t border-gray-100 mt-2">
              <button
                onClick={() => { setShowAppConfigModal(false); setShowGpsModal(true); }}
                className="w-full py-3.5 bg-[#F0F2F5] text-gray-600 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <MapPin c="w-4 h-4 text-[#D85E38]" /> GPS 門店定位設定
              </button>
            </div>

            <button
              onClick={() => setShowAppConfigModal(false)}
              className="mt-3 w-full py-3.5 bg-[#1A1A1A] text-white rounded-full font-bold text-sm hover:bg-black transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 頭貼選擇器彈窗 */}
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatar={
            avatarPickerTarget === 'register' ? regSelectedAvatar :
            avatarPickerTarget === 'edit' ? (editEmpSelectedAvatar || editEmployeeData?.avatarId || '') :
            (employees.find(e => e.id === avatarPickerTarget)?.avatarId || '')
          }
          onSelect={handlePresetAvatarSelect}
          onClose={() => { setShowAvatarPicker(false); setAvatarPickerTarget(null); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#242424] text-white px-6 py-3.5 rounded-full z-[100] text-xs font-bold shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-bottom-4 flex items-center whitespace-nowrap">
          {String(toast)}
        </div>
      )}
    </div>
  );
}
