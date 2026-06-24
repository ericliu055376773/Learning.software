// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// === Firebase 連線設定 ===
const firebaseConfig = {
  apiKey: "AIzaSyD4fOYP3yVyZ4NxXZdSWYZr5Z6Oc_lX8fQ",
  authDomain: "dailytasks-4d281.firebaseapp.com",
  projectId: "dailytasks-4d281",
  storageBucket: "dailytasks-4d281.firebasestorage.app",
  messagingSenderId: "955083665386",
  appId: "1:955083665386:web:515c82426eda8210660c93"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// === 計算兩個 GPS 座標距離 (公尺) - Haversine Formula ===
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

// === 圖示組件 ===
const I = ({ children, c = "", onClick }: any) => <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>{children}</svg>;
const BookOpen = ({ c }: any) => <I c={c}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></I>;
const UserIcon = ({ c }: any) => <I c={c}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></I>;
const Trash2 = ({ c }: any) => <I c={c}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></I>;
const PlusCircle = ({ c }: any) => <I c={c}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></I>;
const UploadCloud = ({ c }: any) => <I c={c}><polyline points="16 16 12 12 8 16"/><line x1="12" x2="12" y1="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></I>;
const ShieldCheck = ({ c }: any) => <I c={c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></I>;
const Store = ({ c }: any) => <I c={c}><path d="m2 7 4.38-5.46a2 2 0 0 1 1.56-.78h8.12a2 2 0 0 1 1.56.78L22 7"/><path d="M2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6"/><path d="M2 7h20"/></I>;
const XCircle = ({ c }: any) => <I c={c}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></I>;
const CheckCircle2 = ({ c }: any) => <I c={c}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></I>;
const Bell = ({ c }: any) => <I c={c}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></I>;
const LogOut = ({ c }: any) => <I c={c}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></I>;
const Edit = ({ c }: any) => <I c={c}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></I>;
const ChevronLeft = ({ c }: any) => <I c={c}><polyline points="15 18 9 12 15 6"/></I>;
const Lock = ({ c }: any) => <I c={c}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></I>;
const Settings = ({ c }: any) => <I c={c}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></I>;
const Camera = ({ c }: any) => <I c={c}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></I>;
const FolderPlus = ({ c }: any) => <I c={c}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></I>;
const MapPin = ({ c }: any) => <I c={c}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></I>;
const Search = ({ c }: any) => <I c={c}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></I>;
const GripVertical = ({ c }: any) => <I c={c}><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></I>;
const Award = ({ c }: any) => <I c={c}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></I>;

// 24 種中性文青主題色
const extendedThemeColors = [
  { id: 'indigo', name: '靛藍', main: '#4f46e5', light: '#eef2ff' },
  { id: 'slate', name: '石板', main: '#475569', light: '#f8fafc' },
  { id: 'zinc', name: '鋅灰', main: '#52525b', light: '#f4f4f5' },
  { id: 'neutral', name: '中性', main: '#525252', light: '#f5f5f5' },
  { id: 'stone', name: '石頭', main: '#57534e', light: '#fafaf9' },
  { id: 'red', name: '磚紅', main: '#dc2626', light: '#fef2f2' },
  { id: 'orange', name: '橘褐', main: '#ea580c', light: '#fff7ed' },
  { id: 'amber', name: '琥珀', main: '#d97706', light: '#fffbeb' },
  { id: 'yellow', name: '芥末', main: '#ca8a04', light: '#fefce8' },
  { id: 'lime', name: '萊姆', main: '#65a30d', light: '#f7fee7' },
  { id: 'green', name: '草綠', main: '#16a34a', light: '#f0fdf4' },
  { id: 'emerald', name: '翡翠', main: '#059669', light: '#ecfdf5' },
  { id: 'teal', name: '藍綠', main: '#0d9488', light: '#f0fdfa' },
  { id: 'cyan', name: '青色', main: '#0891b2', light: '#ecfeff' },
  { id: 'sky', name: '天藍', main: '#0284c7', light: '#f0f9ff' },
  { id: 'blue', name: '海藍', main: '#2563eb', light: '#eff6ff' },
  { id: 'violet', name: '紫羅蘭', main: '#7c3aed', light: '#f5f3ff' },
  { id: 'purple', name: '紫色', main: '#9333ea', light: '#faf5ff' },
  { id: 'fuchsia', name: '紫紅', main: '#c026d3', light: '#fdf4ff' },
  { id: 'pink', name: '粉紅', main: '#db2777', light: '#fdf2f8' },
  { id: 'rose', name: '玫瑰', main: '#e11d48', light: '#ffe4e6' },
  { id: 'brown', name: '泥褐', main: '#8b5a2b', light: '#fdf8f5' },
  { id: 'olive', name: '橄欖', main: '#808000', light: '#fafaf0' },
  { id: 'navy', name: '海軍藍', main: '#000080', light: '#f0f0fa' },
];

const defaultAvatars = ['🧑🏻‍💻', '👩🏻‍💻', '👨🏽‍🏫', '👩🏼‍🏫', '👨🏻‍🍳', '👩🏻‍🍳', '🧑🏼‍🔧', '👩🏽‍🔧'];

const customStyles = `
  /* 等級大卡片顏色 */
  .bg-role-manager { background: linear-gradient(135deg, #ef4444, #eab308, #22c55e); }
  .bg-role-deputy { background: linear-gradient(135deg, #fbbf24, #f59e0b, #b45309); }
  .bg-role-leader { background: linear-gradient(135deg, #cbd5e1, #94a3b8, #64748b); }
  .bg-role-reserve { background: linear-gradient(135deg, #d97706, #b45309, #78350f); }
  .bg-role-staff { background: linear-gradient(135deg, #4b5563, #1f2937, #030712); }
  .bg-role-intern { background: linear-gradient(135deg, #4ade80, #22c55e, #15803d); }
  .bg-role-default { background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); }

  /* 隱藏原生滾動條 */
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
`;

const getRoleCardStyle = (role: any) => {
  const safeRole = role ? String(role) : '';
  let baseStyle = "relative overflow-hidden rounded-xl p-5 text-white mb-5 shadow-sm ";
  if (safeRole === '店長') return baseStyle + "bg-role-manager";
  if (safeRole === '副店長') return baseStyle + "bg-role-deputy";
  if (safeRole === '組長') return baseStyle + "bg-role-leader";
  if (safeRole === '儲備') return baseStyle + "bg-role-reserve";
  if (safeRole === '正職' || safeRole === '兼職') return baseStyle + "bg-role-staff";
  if (safeRole.includes('實習')) return baseStyle + "bg-role-intern";
  return baseStyle + "bg-role-default";
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<string>('login'); 
  const [currentUserRole, setCurrentUserRole] = useState<any>(null); 
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [showSecretModal, setShowSecretModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [hasShownLoginNotice, setHasShownLoginNotice] = useState<boolean>(false);
  const [isCheckingGPS, setIsCheckingGPS] = useState<boolean>(false);
  const [secretPwd, setSecretPwd] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>(''); 
  const [authError, setAuthError] = useState<string>(''); 
  const [activeTab, setActiveTab] = useState<string>('learning'); 
  const [toast, setToast] = useState<any>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const jobRoles = ['店長', '副店長', '組長', '儲備', '正職', '兼職', '實習正職', '實習兼職'];
  
  const [editingEmployeeId, setEditingEmployeeId] = useState<any>(null);
  const [editEmployeeData, setEditEmployeeData] = useState<any>({ name: '', store: '', role: '', password: '', birthdate: '', hireDate: '', phone: '', mbti: '', avatarUrl: '' });

  const [stores, setStores] = useState<any[]>([]);
  const [learningSteps, setLearningSteps] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  
  const [categories, setCategories] = useState<any[]>([{id: 'default', name: '綜合學習', parentId: null}]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [activeParentId, setActiveParentId] = useState<string>('');
  const [showCategoryManager, setShowCategoryManager] = useState<boolean>(false);
  const [editingCategories, setEditingCategories] = useState<any[]>([]);
  // 分類密碼鎖
  const [categoryPasswords, setCategoryPasswords] = useState<{[catId: string]: string}>({});
  const [unlockedCategories, setUnlockedCategories] = useState<Set<string>>(new Set());
  const [showCatLockModal, setShowCatLockModal] = useState<string | null>(null); // catId
  const [catLockInput, setCatLockInput] = useState<string>('');
  // 簽名功能
  const [showSignatureModal, setShowSignatureModal] = useState<any>(null); // step
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [localCompletedBlocks, setLocalCompletedBlocks] = useState<{[key: string]: boolean}>({});

  // ── Optimistic Update 架構 ─────────────────────────────────────────
  // 用 ref 存覆寫值＋寫入時間戳，snapshot 收到後只有「超過 3 秒」才覆蓋本地改動
  const localEmpOverridesRef  = React.useRef<{[id:string]:any}>({});
  const localStepOverridesRef = React.useRef<{[id:string]:any}>({});
  const localStoreOverridesRef= React.useRef<{[id:string]:any}>({});
  const empWriteAtRef   = React.useRef<{[id:string]:number}>({});
  const stepWriteAtRef  = React.useRef<{[id:string]:number}>({});
  const storeWriteAtRef = React.useRef<{[id:string]:number}>({});
  // ─────────────────────────────────────────────────────────────────
  const [globalTheme, setGlobalTheme] = useState<string>('indigo');
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);
  const [systemLogoUrl, setSystemLogoUrl] = useState<string>('');
  
  const [customTitles, setCustomTitles] = useState({
    hqTitle: '總部學習系統',
    storeTitle: '門店學習系統',
    learningTab: '學習進度',
    profileTab: '個人資料',
    learningContentTitle: '學習內容設定'
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStoreFilter, setActiveStoreFilter] = useState<string>('all');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // 門店拖曳
  const [draggedStoreIndex, setDraggedStoreIndex] = useState<number | null>(null);
  const [dragOverStoreIndex, setDragOverStoreIndex] = useState<number | null>(null);

  // 分類拖曳 (新增)
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);
  const [dragOverCatIndex, setDragOverCatIndex] = useState<number | null>(null);
  const [draggedChildIndex, setDraggedChildIndex] = useState<{parentId:string, index:number} | null>(null);
  const [dragOverChildIndex, setDragOverChildIndex] = useState<number | null>(null);
  const [draggedBlockInfo, setDraggedBlockInfo] = useState<{stepId: string, blockIndex: number} | null>(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState<number | null>(null);
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [dragOverStepIndex, setDragOverStepIndex] = useState<number | null>(null);

  const [showTrainerModal, setShowTrainerModal] = useState<boolean>(false);
  const [trainerModalStep, setTrainerModalStep] = useState<any>(null);
  const [selectedTrainerStore, setSelectedTrainerStore] = useState<string>('');
  const [selectedTrainerName, setSelectedTrainerName] = useState<string>('');

  useEffect(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }, []);

  useEffect(() => {
    // merge helper: 有本地 override 的欄位永遠以本地為準，不受時間限制
    function mergeSnap(fromDB: any[], overridesRef: React.MutableRefObject<{[id:string]:any}>) {
      return fromDB.map((base:any) => {
        const ov = overridesRef.current[base.id];
        return ov ? {...base, ...ov} : base;
      });
    }
    const unsubStores = onSnapshot(collection(db, 'stores'), 
      (snap: any) => { const d = snap.docs.map((d:any)=>({id:d.id,...d.data()})).sort((a:any,b:any)=>(a.order??a.createdAt??0)-(b.order??b.createdAt??0)); setStores(mergeSnap(d, localStoreOverridesRef)); },
      (err: any) => console.error("Stores fetch error:", err)
    );
    const unsubSteps = onSnapshot(collection(db, 'learningSteps'), 
      (snap: any) => { const d = snap.docs.map((d:any)=>({id:d.id,...d.data()})).sort((a:any,b:any)=>a.createdAt-b.createdAt); setLearningSteps(mergeSnap(d, localStepOverridesRef)); },
      (err: any) => console.error("Steps fetch error:", err)
    );
    const unsubEmp = onSnapshot(collection(db, 'employees'), 
      (snap: any) => { const d = snap.docs.map((d:any)=>({id:d.id,...d.data()})); setEmployees(mergeSnap(d, localEmpOverridesRef)); },
      (err: any) => console.error("Employees fetch error:", err)
    );
    const unsubPending = onSnapshot(collection(db, 'pendingAccounts'), 
      (snap: any) => setPendingAccounts(snap.docs.map((d: any) => ({id: d.id, ...d.data()}))),
      (err: any) => console.error("PendingAccounts fetch error:", err)
    );
    const unsubConfig = onSnapshot(doc(db, 'config', 'global'), 
      (d: any) => { 
        if(d.exists()) {
          const data = d.data();
          setGlobalTheme(data.theme || 'indigo');
          setSystemLogoUrl(data.logoUrl || '');
          if (data.customTitles) setCustomTitles(prev => ({...prev, ...data.customTitles}));
          
          if (data.learningCategories && data.learningCategories.length > 0) {
            setCategories(data.learningCategories);
            const parents = data.learningCategories.filter((c: any) => !c.parentId);
            const firstParent = parents[0];
            if (firstParent && !activeParentId) {
              setActiveParentId(firstParent.id);
              const firstChild = data.learningCategories.find((c: any) => c.parentId === firstParent.id);
              if (firstChild && !activeCategoryId) setActiveCategoryId(firstChild.id);
              else if (!activeCategoryId) setActiveCategoryId(firstParent.id);
            }
          }
          if (data.categoryPasswords) setCategoryPasswords(data.categoryPasswords);
        }
        setIsConfigLoaded(true);
      },
      (err: any) => { console.error("Config fetch error:", err); setIsConfigLoaded(true); }
    );

    return () => { unsubStores(); unsubSteps(); unsubEmp(); unsubPending(); unsubConfig(); };
  }, []);

  const canEdit = currentUserRole === 'super_admin';
  const currentUserData = employees.find(e => e.name === currentUserName);

  // ── Optimistic update helpers ──────────────────────────────────────
  function opt(
    id: string, fields: any,
    overridesRef: React.MutableRefObject<{[id:string]:any}>,
    writeAtRef:   React.MutableRefObject<{[id:string]:number}>,
    setter: React.Dispatch<React.SetStateAction<any[]>>
  ) {
    overridesRef.current = {...overridesRef.current, [id]: {...(overridesRef.current[id]||{}), ...fields}};
    writeAtRef.current[id] = Date.now();
    setter(prev => prev.map(item => item.id === id ? {...item, ...fields} : item));
  }
  function clearOpt(id: string, overridesRef: React.MutableRefObject<{[id:string]:any}>) {
    const next = {...overridesRef.current};
    delete next[id];
    overridesRef.current = next;
  }
  function optEmp  (id:string, fields:any) { opt(id, fields, localEmpOverridesRef,   empWriteAtRef,   setEmployees);    }
  function optStep (id:string, fields:any) { opt(id, fields, localStepOverridesRef,  stepWriteAtRef,  setLearningSteps);}
  function optStore(id:string, fields:any) { opt(id, fields, localStoreOverridesRef, storeWriteAtRef, setStores);       }
  async function optEmpWrite(id:string, fields:any, docRef:any) {
    optEmp(id, fields);
    await updateDoc(docRef, fields);
    clearOpt(id, localEmpOverridesRef);
  }
  async function optStepWrite(id:string, fields:any, docRef:any) {
    optStep(id, fields);
    await updateDoc(docRef, fields);
    clearOpt(id, localStepOverridesRef);
  }
  async function optStoreWrite(id:string, fields:any, docRef:any) {
    optStore(id, fields);
    await updateDoc(docRef, fields);
    clearOpt(id, localStoreOverridesRef);
  }
  // ──────────────────────────────────────────────────────────────────
  const totalAdminNotifications = pendingAccounts.length;

  useEffect(() => {
    if (isAuthenticated && canEdit && totalAdminNotifications > 0 && !hasShownLoginNotice) {
      setShowNotificationModal(true);
      setHasShownLoginNotice(true);
    }
  }, [isAuthenticated, canEdit, totalAdminNotifications, hasShownLoginNotice]);

  function showToast(msg: string) { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3000); 
  }

  // 安全抓取進度總數
  function getTotalProgress(completedLearning: any) {
    if (typeof completedLearning === 'number') return completedLearning || 0;
    if (typeof completedLearning === 'object' && completedLearning !== null) {
        return Object.values(completedLearning).reduce((a: any, b: any) => Number(a) + Number(b), 0);
    }
    return 0;
  }

  function getLevelDisplay(completedCount: any) {
    const totalCount = getTotalProgress(completedCount);
    return `Lv. ${totalCount}`;
  }

  function getStepBlocks(step: any) {
    if (step && step.blocks && Array.isArray(step.blocks)) return step.blocks;
    return [];
  }

  async function handleAuthSubmit(e: any) {
    e.preventDefault();
    const target = e.target as any;
    const password = authPassword;
    const store = target.store?.value;

    if (authMode === 'register') {
      const name = target.managerName.value;
      const role = target.jobRole.value;
      const birthdate = target.birthdate.value;
      const hireDate = target.hireDate.value;
      const phone = target.phone.value;
      const mbti = target.mbti.value;

      const isPasswordUsed = employees.some(emp => emp.password === password) || pendingAccounts.some(pa => pa.password === password);
      if (isPasswordUsed) {
        showToast('此密碼已被使用，請更換其他密碼！');
        setAuthError('此密碼已有人使用，請更換'); 
        return; 
      }

      await addDoc(collection(db, 'pendingAccounts'), {
        name, store, requestedRole: role, password, birthdate, hireDate, phone, mbti,
        date: new Date().toISOString().split('T')[0], createdAt: Date.now()
      });
      showToast('帳號密碼申請已送出！請等待總部核准。');
      setAuthMode('login'); setAuthPassword(''); setAuthError(''); 
    } else {
      const matchedUser = employees.find(emp => emp.store === store && emp.password === password);
      if (matchedUser) {
        const userStore = stores.find((s: any) => s.name === store);
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
                showToast(`登入失敗！您距離門店約 ${Math.round(dist)} 公尺 (不可超過 100m)。`);
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
        const isPending = pendingAccounts.some(pa => pa.store === store && pa.password === password);
        if (isPending) {
          showToast('登入失敗！此帳號尚未開通。');
          setAuthError('此帳號尚未開通');
        } else {
          showToast('登入失敗！查無此門店或密碼錯誤。'); 
          setAuthError('密碼錯誤，請重新輸入');
        }
      }
    }
  }

  async function handleBlockFileUpload(step: any, blockId: string, e: any) {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true); showToast("上傳中，請稍候...");
    try {
      const storageRef = ref(storage, `media/${step.id}_${blockId}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const blocks = getStepBlocks(step);
      const newBlocks = blocks.map((b: any) => b.id === blockId ? { ...b, mediaUrl: url, fileName: file.name } : b);
      optStepWrite(step.id, { blocks: newBlocks }, doc(db, 'learningSteps', step.id));
      optStep(step.id, { blocks: newBlocks });
    } catch (err: any) { 
      console.error("Upload error:", err);
      showToast("上傳失敗：" + (err.message || "請檢查權限設定！")); 
    } finally { setIsUploading(false); e.target.value = null; }
  }

  async function handleLogoUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    showToast("Logo 上傳中...");
    try {
      const storageRef = ref(storage, `system_logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'config', 'global'), { logoUrl: url }, { merge: true });
      setSystemLogoUrl(url);
      showToast("Logo 更新成功！");
    } catch (err: any) { 
      console.error("Upload error:", err);
      showToast("上傳失敗：" + (err.message || "請檢查權限設定！")); 
    } finally { e.target.value = null; }
  }

  async function addBlock(step: any) {
     const blocks = getStepBlocks(step);
     const newBlocks = [{ id: Date.now().toString(), subtitle: '', description: '', mediaUrl: '', fileName: '', enableCheck: true }, ...blocks];
     optStepWrite(step.id, { blocks: newBlocks }, doc(db, 'learningSteps', step.id));
     optStep(step.id, { blocks: newBlocks });
  }

  async function removeBlock(step: any, blockId: string) {
     if (!window.confirm("確定要刪除這個內容區塊嗎？（刪除後無法復原）")) return;
     const blocks = getStepBlocks(step);
     const newBlocks = blocks.filter((b: any) => b.id !== blockId);
     optStepWrite(step.id, { blocks: newBlocks }, doc(db, 'learningSteps', step.id));
     optStep(step.id, { blocks: newBlocks });
  }

  async function removeBlockMedia(step: any, blockId: string) {
     if (!window.confirm("確定要移除此附件嗎？")) return;
     const blocks = getStepBlocks(step);
     const newBlocks = blocks.map((b: any) => b.id === blockId ? { ...b, mediaUrl: '', fileName: '' } : b);
     optStepWrite(step.id, { blocks: newBlocks }, doc(db, 'learningSteps', step.id));
     optStep(step.id, { blocks: newBlocks });
  }

  async function updateBlockField(step: any, blockId: string, field: string, value: any) {
     const blocks = getStepBlocks(step);
     const newBlocks = blocks.map((b: any) => b.id === blockId ? { ...b, [field]: value } : b);
     optStepWrite(step.id, { blocks: newBlocks }, doc(db, 'learningSteps', step.id));
     optStep(step.id, { blocks: newBlocks });
  }

  function startEditEmployee(emp: any) {
    setEditingEmployeeId(emp.id);
    setEditEmployeeData({ 
      name: emp.name || '', 
      store: emp.store || '', 
      role: emp.role || '', 
      password: emp.password || '',
      birthdate: emp.birthdate || '',
      hireDate: emp.hireDate || '',
      phone: emp.phone || '',
      mbti: emp.mbti || '',
      avatarUrl: emp.avatarUrl || '' // Ensure avatarUrl is passed
    });
  }

  async function saveEditEmployee(id: string) {
    if (!editEmployeeData.name.trim() || (editEmployeeData.password && editEmployeeData.password.length !== 6)) {
      showToast('資料格式不完整或密碼不為 6 碼！'); return;
    }
    try {
      optEmpWrite(id, editEmployeeData, doc(db, 'employees', id));
      optEmp(id, editEmployeeData);
    } catch (error) { showToast('更新失敗，請檢查網路連線。'); }
  }
  
  async function saveCategoriesConfig() {
    const validCategories = editingCategories.filter((c: any) => c.name.trim() !== '');
    if (validCategories.length === 0) {
      showToast('請至少保留一個分類！');
      return;
    }
    if (categories.length > 2 && validCategories.length < categories.length / 2) {
      if (!window.confirm(`即將從 ${categories.length} 個分類減少到 ${validCategories.length} 個，確定要儲存嗎？`)) return;
    }
    try {
      await setDoc(doc(db, 'config', 'global'), { learningCategories: validCategories }, { merge: true });
      setCategories(validCategories);
      if (!validCategories.find((c: any) => c.id === activeCategoryId) && validCategories.length > 0) {
        setActiveCategoryId(validCategories[0].id);
      }
      setShowCategoryManager(false);
      showToast('分類已成功更新！');
    } catch(e) { showToast('分類儲存失敗！'); }
  }

  // 一鍵建立「未標注」分類並將所有孤兒內容指派進去
  async function createUntaggedAndAssignOrphans() {
    const untaggedId = 'untagged_' + Date.now();
    const untaggedCat = { id: untaggedId, name: '未標注', parentId: null };
    const newCategories = [...categories.filter((c:any) => c.name !== '未標注'), untaggedCat];
    // 現有所有有效分類 ID（排除 __orphan__ 等無效值）
    const validCatIds = new Set(newCategories.map((c:any) => c.id));
    // 所有 categoryId 不在有效分類中的 steps
    const stepsToAssign = learningSteps.filter((s: any) => 
      !s.categoryId || 
      s.categoryId === '__orphan__' || 
      s.categoryId === 'orphan' ||
      !validCatIds.has(s.categoryId)
    );
    try {
      await setDoc(doc(db, 'config', 'global'), { learningCategories: newCategories }, { merge: true });
      setCategories(newCategories);
      // 批次更新，每10筆一組避免超時
      const chunks = [];
      for (let i = 0; i < stepsToAssign.length; i += 10) {
        chunks.push(stepsToAssign.slice(i, i + 10));
      }
      for (const chunk of chunks) {
        await Promise.all(chunk.map((s: any) => {
          optStep(s.id, { categoryId: untaggedId }); return updateDoc(doc(db, 'learningSteps', s.id), { categoryId: untaggedId });
        }));
      }
      setActiveCategoryId(untaggedId);
      showToast(`✅ 已將 ${stepsToAssign.length} 筆內容移入「未標注」！`);
    } catch(e) { showToast('操作失敗，請重試！'); }
  }

  // === 提交學習核准 (附帶教學人員) - 現已改為直接紀錄 ===
  async function submitLearningRequest() {
    if (!selectedTrainerName) {
      showToast('請選擇教學人員！');
      return;
    }

    const emp = employees.find(e => e.name === currentUserName);
    if(emp) {
      const targetCatId = activeCategoryId || (categories[0]?.id || 'default');
      const newProgress = (typeof emp.completedLearning === 'object' && emp.completedLearning !== null) ? {...emp.completedLearning} : { [targetCatId]: emp.completedLearning || 0 };
      newProgress[targetCatId] = (newProgress[targetCatId] || 0) + 1;
      
      const newHistory = (emp.learningHistory && Array.isArray(emp.learningHistory)) ? [...emp.learningHistory] : [];
      newHistory.push({
        stepId: trainerModalStep.id,
        stepName: trainerModalStep.title,
        firstApprover: '直接通關紀錄',
        trainerName: selectedTrainerName,
        approvedAt: Date.now(),
        categoryId: targetCatId,
        // 如果有簽名則儲存
        ...(signatureDataUrl ? { signatureUrl: signatureDataUrl } : {})
      });

      await optEmpWrite(emp.id, { completedLearning: newProgress, learningHistory: newHistory }, doc(db, 'employees', emp.id));
    }
    
    setShowTrainerModal(false);
    setSignatureDataUrl('');
    showToast(signatureDataUrl ? '✅ 已簽名並完成學習！' : '已完成學習，紀錄已保存！');
  }

  async function updateLearningRecordTrainer(emp: any, historyIndex: number, newTrainerName: string) {
      if (!emp.learningHistory || !Array.isArray(emp.learningHistory)) return;
      const newHistory = [...emp.learningHistory];
      newHistory[historyIndex].trainerName = newTrainerName;
      try {
          optEmpWrite(emp.id, { learningHistory: newHistory }, doc(db, 'employees', emp.id));
          optEmp(emp.id, { learningHistory: newHistory });
      } catch (error) {
          showToast('更新失敗！請檢查網路。');
      }
  }

  async function handleDeleteLearningRecord(emp: any, historyIndex: number) {
      if (!window.confirm('確定要刪除這筆學習紀錄嗎？該人員將需要重新學習此項目。')) return;

      if (!emp.learningHistory || !Array.isArray(emp.learningHistory)) return;
      const recordToDelete = emp.learningHistory[historyIndex];
      if (!recordToDelete) return;

      const newHistory = [...emp.learningHistory];
      newHistory.splice(historyIndex, 1);

      let newCompletedLearning = emp.completedLearning;
      const step = learningSteps.find(s => s.id === recordToDelete.stepId);
      
      if (typeof newCompletedLearning === 'object' && newCompletedLearning !== null) {
          newCompletedLearning = { ...newCompletedLearning };
          let catId = 'default';
          if (step && step.categoryId) {
              catId = step.categoryId;
          } else {
              const availableCats = Object.keys(newCompletedLearning).filter(k => newCompletedLearning[k] > 0);
              if (availableCats.length > 0) catId = availableCats[0];
          }
          if (newCompletedLearning[catId] > 0) {
              newCompletedLearning[catId] -= 1;
          }
      } else if (typeof newCompletedLearning === 'number' && newCompletedLearning > 0) {
          newCompletedLearning -= 1;
      }

      const newCompletedBlocks = { ...(emp.completedBlocks || {}) };
      Object.keys(newCompletedBlocks).forEach(key => {
          if (key.startsWith(recordToDelete.stepId + '_')) {
              delete newCompletedBlocks[key];
          }
      });

      try {
          await optEmpWrite(emp.id, { learningHistory: newHistory, completedLearning: newCompletedLearning, completedBlocks: newCompletedBlocks }, doc(db, 'employees', emp.id));
          showToast('學習紀錄已刪除！該員需重新學習。');
      } catch (error) {
          showToast('刪除失敗！請檢查網路連線。');
      }
  }

  const isProfileTabAdmin = canEdit;
  const baseEmployees = isProfileTabAdmin ? employees : employees.filter(e => e.name === currentUserName);
  
  // 安全的過濾機制
  const filteredDisplayEmployees = baseEmployees.filter(emp => {
      if (!isProfileTabAdmin) return true;
      const matchStore = activeStoreFilter === 'all' || emp.store === activeStoreFilter;
      const empNameStr = emp.name ? String(emp.name).toLowerCase() : '';
      const empStoreStr = emp.store ? String(emp.store).toLowerCase() : '';
      const searchStr = searchQuery ? String(searchQuery).toLowerCase() : '';
      const matchSearch = empNameStr.includes(searchStr) || empStoreStr.includes(searchStr);
      return matchStore && matchSearch;
  });

  // 向下相容：舊資料沒有 parentId，視為母分類直接顯示
  const allCats = categories.length > 0 ? categories : [{id: 'default', name: '綜合學習', parentId: null}];
  
  // 判斷是否有兩層結構（有分類明確設了 parentId）
  const hasTwoLevel = allCats.some((c: any) => c.parentId != null && c.parentId !== '');
  
  const parentCategories = hasTwoLevel
    ? allCats.filter((c: any) => !c.parentId || c.parentId === '')
    : allCats;
  
  const currentParentId = activeParentId || parentCategories[0]?.id || '';
  
  const childCategories = hasTwoLevel
    ? allCats.filter((c: any) => c.parentId === currentParentId)
    : [];
  
  const hasChildren = childCategories.length > 0;
  
  const effectiveCategories = hasTwoLevel
    ? (hasChildren ? childCategories : [{...allCats.find((c:any) => c.id === currentParentId)}])
    : allCats;

  // 找出孤兒 steps（categoryId 不存在、或找不到對應分類）
  const ORPHAN_CAT_ID = '__orphan__';
  const orphanSteps = learningSteps.filter((s: any) => {
    // 沒有 categoryId → 孤兒
    if (!s.categoryId) return true;
    // categoryId 在現有分類找得到 → 不是孤兒
    if (allCats.some((c: any) => c.id === s.categoryId)) return false;
    // 名稱比對
    const matched = allCats.some((c: any) => {
      const catName = String(c.name).toLowerCase();
      const stepCatId = String(s.categoryId).toLowerCase();
      return catName === stepCatId || catName.includes(stepCatId) || stepCatId.includes(catName);
    });
    return !matched;
  });
  const hasOrphans = orphanSteps.length > 0;

  // 確認 activeCategoryId 在 allCats 或 ORPHAN 裡有效
  const currentActiveCatId = (() => {
    if (activeCategoryId === ORPHAN_CAT_ID) return ORPHAN_CAT_ID;
    if (activeCategoryId && allCats.some((c:any) => c.id === activeCategoryId)) return activeCategoryId;
    // fallback: 目前母分類的第一個子分類
    return effectiveCategories[0]?.id || '';
  })();
  const currentActiveCat = allCats.find((c:any) => c.id === currentActiveCatId);
  
  const filteredSteps = currentActiveCatId === ORPHAN_CAT_ID
    ? orphanSteps
    : learningSteps.filter((s: any) => s.categoryId === currentActiveCatId);
  
  // 計算登入者自己的進度 (若為總部看總部人員可能不具代表性，但防呆)
  const categoryProgress = (currentUserData && typeof currentUserData.completedLearning === 'object' && currentUserData.completedLearning !== null) 
                           ? (currentUserData.completedLearning[currentActiveCatId] || 0) 
                           : (currentActiveCatId === effectiveCategories[0]?.id ? (currentUserData?.completedLearning || 0) : 0);

  const currentThemeObj = extendedThemeColors.find(t => t.id === globalTheme) || extendedThemeColors[0];

  if (!isAuthenticated) {
    // 等 Firebase config 載入完才顯示，避免主題色閃爍
    if (!isConfigLoaded) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 font-bold">載入中...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-10 font-sans relative">
        <style>{`
          :root {
            --theme-main: ${currentThemeObj.main};
            --theme-light: ${currentThemeObj.light};
          }
          .bg-indigo-600, .hover\\:bg-indigo-600:hover { background-color: var(--theme-main) !important; }
          .bg-indigo-500 { background-color: var(--theme-main) !important; opacity: 0.9; }
          .text-indigo-600 { color: var(--theme-main) !important; }
          .text-indigo-500 { color: var(--theme-main) !important; opacity: 0.9; }
          .border-indigo-600 { border-color: var(--theme-main) !important; }
          .border-indigo-500 { border-color: var(--theme-main) !important; }
          .border-indigo-400 { border-color: var(--theme-main) !important; opacity: 0.7;}
          .focus\\:border-indigo-500:focus { border-color: var(--theme-main) !important; }
          .bg-indigo-50 { background-color: var(--theme-light) !important; }
          .bg-indigo-100 { background-color: var(--theme-light) !important; filter: brightness(0.95); }
          .hover\\:bg-indigo-50:hover { background-color: var(--theme-light) !important; }
          .text-indigo-900 { color: var(--theme-main) !important; filter: brightness(0.5); }
          .text-indigo-700 { color: var(--theme-main) !important; filter: brightness(0.8); }
          .text-indigo-400 { color: var(--theme-main) !important; filter: brightness(1.2); }
          .border-indigo-200 { border-color: var(--theme-light) !important; filter: brightness(0.85); }
          .border-indigo-100 { border-color: var(--theme-light) !important; filter: brightness(0.9); }
          .ring-indigo-200 { --tw-ring-color: var(--theme-light) !important; filter: brightness(0.85); }
          .focus\\:ring-indigo-500:focus { --tw-ring-color: var(--theme-main) !important; }
          .shadow-indigo-100 { --tw-shadow-color: var(--theme-light) !important; }
          .shadow-indigo-200 { --tw-shadow-color: var(--theme-light) !important; filter: brightness(0.85); }
          .fill-indigo-50 { fill: var(--theme-light) !important; }
          *, *::before, *::after { -webkit-user-select: text !important; user-select: text !important; }
          button, [draggable="true"] { -webkit-user-select: none !important; user-select: none !important; }
          input, textarea { -webkit-user-select: text !important; user-select: text !important; }
          [draggable="true"] { -webkit-user-drag: element !important; cursor: grab !important; }
          ${customStyles}
        `}</style>
        
        <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl shadow-xl relative animate-in fade-in duration-500 border border-gray-100">
          <div onClick={() => setShowSecretModal(true)} className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-2xl mx-auto mb-6 flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors">
             <ShieldCheck c="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black text-center text-gray-800 mb-1 tracking-wider">
            {authMode === 'login' ? '學習系統' : '申請帳號密碼'}
          </h1>
          <p className="text-center text-gray-400 text-xs tracking-widest mb-6 sm:mb-8 font-bold">
            {authMode === 'login' ? '請輸入管理資訊以進入' : '請填寫申請資料，等待總部審核'}
          </p>
          
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">
                {authMode === 'login' ? '登入門店' : '申請門店'}
              </label>
              <div className="relative">
                <select name="store" required defaultValue="" className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 appearance-none text-sm sm:text-base">
                  <option value="" disabled>請選擇門店...</option>
                  {stores.map(s => <option key={s.id} value={s.name}>{String(s.name)}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
            </div>

            {authMode === 'register' && (
              <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">申請職位</label>
                    <div className="relative">
                      <select name="jobRole" required defaultValue="" className="w-full p-2.5 sm:p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 appearance-none text-[11px] sm:text-sm">
                        <option value="" disabled>請選擇...</option>
                        {jobRoles.map(role => <option key={role} value={role}>{String(role)}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">真實姓名</label>
                    <input type="text" name="managerName" required className="w-full p-2.5 sm:p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 text-[11px] sm:text-sm" placeholder="劉德華" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">出生年月日</label>
                    <input type="date" name="birthdate" required className="w-full px-2 py-2.5 sm:p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 text-[11px] sm:text-sm" />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">到職日</label>
                    <input type="date" name="hireDate" required className="w-full px-2 py-2.5 sm:p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 text-[11px] sm:text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">聯絡電話</label>
                    <input type="tel" name="phone" required className="w-full p-2.5 sm:p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 text-[11px] sm:text-sm" placeholder="09XX" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">人格特質</label>
                    <div className="relative">
                      <select name="mbti" defaultValue="" className="w-full p-2.5 sm:p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 appearance-none text-[11px] sm:text-sm">
                        <option value="">請選擇（選填）</option>
                        <option value="E">E型 (外向)</option>
                        <option value="I">I型 (內向)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className={`block text-[10px] font-bold uppercase ml-1 mb-1 transition-colors ${authError ? 'text-red-500' : 'text-gray-500'}`}>
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
                  if(val.length <= 6) setAuthPassword(val);
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full p-3.5 border rounded-xl font-bold text-gray-700 outline-none tracking-widest transition-all duration-300 text-sm sm:text-base ${
                  authError ? 'bg-red-50/50 border-red-500 focus:border-red-500 ring-2 ring-red-100' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'
                }`} 
                placeholder={authMode === 'login' ? "請輸入6碼數字密碼" : "請設定6碼數字密碼"} 
              />
              {authError && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 flex items-center animate-in slide-in-from-top-1"><XCircle c="w-3 h-3 mr-1" />{String(authError)}</p>}
            </div>

            <button type="submit" disabled={isCheckingGPS} className={`w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all mt-2 tracking-widest ${isCheckingGPS ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'}`}>
              {isCheckingGPS ? '定位驗證中...' : (authMode === 'login' ? '進入系統' : '送出申請')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthPassword(''); setAuthError(''); 
              }}
              className="text-indigo-500 font-bold text-xs tracking-widest hover:text-indigo-700 transition-colors underline decoration-2 underline-offset-4"
            >
              {authMode === 'login' ? '尚未開通？申請帳號密碼' : '已有帳號？返回登入'}
            </button>
          </div>

          {showSecretModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-white p-8 rounded-2xl w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-slate-900 rounded-xl mx-auto mb-4 flex items-center justify-center"><ShieldCheck c="w-6 h-6 text-white" /></div>
                <h3 className="font-black text-xl mb-1 text-gray-800">總部權限登入</h3>
                <p className="text-xs text-gray-400 mb-6 font-bold tracking-widest">SUPER ADMIN</p>
                <input 
                  type="password" autoFocus value={secretPwd} 
                  onChange={e => setSecretPwd(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if(secretPwd==='0204') { 
                        setIsAuthenticated(true); setCurrentUserRole('super_admin'); setCurrentUserName('總部管理員'); 
                        setShowSecretModal(false); setAuthMode('login'); setSecretPwd(''); 
                      } else { showToast('密碼錯誤！'); setSecretPwd(''); }
                    }
                  }}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl mb-6 text-center tracking-widest outline-none focus:border-indigo-600 font-bold" placeholder="請輸入總部密碼" />
                <div className="flex gap-2">
                  <button onClick={() => { setShowSecretModal(false); setSecretPwd(''); }} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">取消</button>
                  <button onClick={() => { 
                    if(secretPwd==='0204') { 
                      setIsAuthenticated(true); setCurrentUserRole('super_admin'); setCurrentUserName('總部管理員'); 
                      setShowSecretModal(false); setAuthMode('login'); setSecretPwd(''); 
                    } else { showToast('密碼錯誤！'); setSecretPwd(''); } 
                  }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold">登入</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="app-scroll-container" className="h-screen h-[100dvh] bg-gray-50 flex justify-center font-sans overflow-y-auto">
      {/* 等待 Firebase config 載入，避免主題色閃爍 */}
      {!isConfigLoaded && (
        <div className="fixed inset-0 bg-white z-[999] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 font-bold">載入中...</p>
          </div>
        </div>
      )}
      <style>{`
          :root {
            --theme-main: ${currentThemeObj.main};
            --theme-light: ${currentThemeObj.light};
          }
          .bg-indigo-600, .hover\\:bg-indigo-600:hover { background-color: var(--theme-main) !important; }
          .bg-indigo-500 { background-color: var(--theme-main) !important; opacity: 0.9; }
          .text-indigo-600 { color: var(--theme-main) !important; }
          .text-indigo-500 { color: var(--theme-main) !important; opacity: 0.9; }
          .border-indigo-600 { border-color: var(--theme-main) !important; }
          .border-indigo-500 { border-color: var(--theme-main) !important; }
          .border-indigo-400 { border-color: var(--theme-main) !important; opacity: 0.7;}
          .focus\\:border-indigo-500:focus { border-color: var(--theme-main) !important; }
          .bg-indigo-50 { background-color: var(--theme-light) !important; }
          .bg-indigo-100 { background-color: var(--theme-light) !important; filter: brightness(0.95); }
          .hover\\:bg-indigo-50:hover { background-color: var(--theme-light) !important; }
          .text-indigo-900 { color: var(--theme-main) !important; filter: brightness(0.5); }
          .text-indigo-700 { color: var(--theme-main) !important; filter: brightness(0.8); }
          .text-indigo-400 { color: var(--theme-main) !important; filter: brightness(1.2); }
          .border-indigo-200 { border-color: var(--theme-light) !important; filter: brightness(0.85); }
          .border-indigo-100 { border-color: var(--theme-light) !important; filter: brightness(0.9); }
          .ring-indigo-200 { --tw-ring-color: var(--theme-light) !important; filter: brightness(0.85); }
          .focus\\:ring-indigo-500:focus { --tw-ring-color: var(--theme-main) !important; }
          .shadow-indigo-100 { --tw-shadow-color: var(--theme-light) !important; }
          .shadow-indigo-200 { --tw-shadow-color: var(--theme-light) !important; filter: brightness(0.85); }
          .fill-indigo-50 { fill: var(--theme-light) !important; }
          /* 強制允許文字選取複製 — 放在 customStyles 之前確保不被覆蓋 */
          *, *::before, *::after {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            user-select: text !important;
          }
          button, [draggable="true"] {
            -webkit-user-select: none !important;
            user-select: none !important;
          }
          input, textarea {
            -webkit-user-select: text !important;
            user-select: text !important;
            cursor: text !important;
          }
          [draggable="true"] {
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-user-drag: element !important;
            cursor: grab !important;
          }
          [draggable="true"]:active {
            cursor: grabbing !important;
          }
          /* 修正 emoji 顏色在 Chrome 顯示偏差 */
          p, span, div, textarea {
            font-variant-emoji: emoji;
            -webkit-font-feature-settings: normal;
          }
          /* 學習內容區塊間距加大 */
          .learning-block { margin-bottom: 1.5rem !important; }
          .learning-step { margin-bottom: 2rem !important; }
          ${customStyles}
      `}</style>
      
      {/* 總部專屬設定彈出視窗：整合 主題設定 與 GPS 定位 */}
      {showSettingsModal && canEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xl text-gray-800 flex items-center"><Settings c="w-6 h-6 mr-2 text-indigo-600" />系統進階設定</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle c="w-6 h-6" /></button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-6 pr-2 hide-scrollbar">
              
              {/* 自訂標題設定 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center"><Edit c="w-4 h-4 mr-1.5 text-indigo-500"/>自訂系統標題</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">總部端標題</label>
                    <input type="text" value={customTitles.hqTitle} onChange={e => setCustomTitles({...customTitles, hqTitle: e.target.value})} onBlur={() => updateDoc(doc(db, 'config', 'global'), { customTitles })} className="w-full p-2 border border-gray-200 rounded text-xs outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">門店端標題</label>
                    <input type="text" value={customTitles.storeTitle} onChange={e => setCustomTitles({...customTitles, storeTitle: e.target.value})} onBlur={() => updateDoc(doc(db, 'config', 'global'), { customTitles })} className="w-full p-2 border border-gray-200 rounded text-xs outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">學習分頁名稱</label>
                    <input type="text" value={customTitles.learningTab} onChange={e => setCustomTitles({...customTitles, learningTab: e.target.value})} onBlur={() => updateDoc(doc(db, 'config', 'global'), { customTitles })} className="w-full p-2 border border-gray-200 rounded text-xs outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">個人資料分頁名稱</label>
                    <input type="text" value={customTitles.profileTab} onChange={e => setCustomTitles({...customTitles, profileTab: e.target.value})} onBlur={() => updateDoc(doc(db, 'config', 'global'), { customTitles })} className="w-full p-2 border border-gray-200 rounded text-xs outline-none focus:border-indigo-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">學習內容大標題</label>
                    <input type="text" value={customTitles.learningContentTitle} onChange={e => setCustomTitles({...customTitles, learningContentTitle: e.target.value})} onBlur={() => updateDoc(doc(db, 'config', 'global'), { customTitles })} className="w-full p-2 border border-gray-200 rounded text-xs outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              {/* 主題顏色設定 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center"><Edit c="w-4 h-4 mr-1.5 text-indigo-500"/>主題顏色設定</h4>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 justify-items-center">
                  {extendedThemeColors.map(t => (
                    <button
                      key={t.id}
                      title={t.name}
                      onClick={() => updateDoc(doc(db, 'config', 'global'), { theme: t.id })}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform shadow-sm ${globalTheme === t.id ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: t.main, '--tw-ring-color': t.main }}
                    >
                      {globalTheme === t.id && <CheckCircle2 c="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 上傳 Logo 設定 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center"><Camera c="w-4 h-4 mr-1.5 text-indigo-500"/>系統 Logo 設定</h4>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                    {systemLogoUrl ? <img src={systemLogoUrl} className="max-w-full max-h-full object-contain" /> : <Store c="w-6 h-6 text-gray-300" />}
                  </div>
                  <label className="flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold shadow-sm">
                    <UploadCloud c="w-4 h-4 mr-1.5 text-indigo-500" />上傳 Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {systemLogoUrl && (
                     <button onClick={() => { updateDoc(doc(db, 'config', 'global'), { logoUrl: '' }); setSystemLogoUrl(''); }} className="text-xs text-red-500 font-bold hover:underline">移除</button>
                  )}
                </div>
              </div>

              {/* 分類密碼鎖設定 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm mb-1 flex items-center"><Lock c="w-4 h-4 mr-1.5 text-indigo-500" />分類密碼鎖設定</h4>
                <p className="text-xs text-gray-500 mb-4 font-bold leading-relaxed">設定後，員工需輸入密碼才能查看該分類內容。留空則不鎖定。</p>
                <div className="space-y-2">
                  {allCats.filter((c:any) => c.name.trim()).map((cat:any) => {
                    const parent = cat.parentId ? allCats.find((p:any) => p.id === cat.parentId) : null;
                    const label = parent ? `${parent.name} › ${cat.name}` : cat.name;
                    return (
                      <div key={cat.id} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100">
                        <span className="text-xs font-bold text-gray-700 flex-1 truncate">{label}</span>
                        <input
                          type="text"
                          maxLength={6}
                          value={categoryPasswords[cat.id] || ''}
                          onChange={async e => {
                            const val = e.target.value.replace(/\D/g, '');
                            const newPwds = {...categoryPasswords, [cat.id]: val};
                            if (!val) delete newPwds[cat.id];
                            setCategoryPasswords(newPwds);
                            await setDoc(doc(db, 'config', 'global'), { categoryPasswords: newPwds }, { merge: true });
                          }}
                          placeholder="輸入密碼鎖（留空不鎖）"
                          className="w-32 p-1.5 border border-gray-200 rounded text-xs outline-none focus:border-indigo-500 text-center tracking-widest"
                        />
                        {categoryPasswords[cat.id] && (
                          <span className="text-[10px] text-orange-500 font-bold">🔒 已鎖</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 各店 GPS 定位設定 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm mb-1 flex items-center"><MapPin c="w-4 h-4 mr-1.5 text-indigo-500" />各店 GPS 定位設定</h4>
                <p className="text-xs text-gray-500 mb-4 font-bold leading-relaxed">設定後，該門店員工登入時須距離此座標 100 公尺內。未設定座標的門店將不受限制。</p>

                <div className="space-y-4">
                  {stores.map(store => (
                    <div key={store.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-gray-800 text-sm">{String(store.name)}</h4>
                        <button
                          onClick={() => {
                            if (!navigator.geolocation) {
                              showToast('您的裝置不支援定位功能'); return;
                            }
                            showToast('定位中...');
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                const gf={lat:pos.coords.latitude,lng:pos.coords.longitude}; optStoreWrite(store.id,gf,doc(db,'stores',store.id));
                                showToast(`${store.name} 座標已更新！`);
                              },
                              (err) => showToast('無法取得定位，請確認權限是否開啟'),
                              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                            );
                          }}
                          className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 transition-colors"
                        >
                          抓取目前位置
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold block mb-1">緯度 (Latitude)</label>
                          <input type="number" step="any" value={store.lat || ''} onChange={e => { const v=parseFloat(e.target.value)||null; optStoreWrite(store.id,{lat:v},doc(db,'stores',store.id)); }} className="w-full p-2 border border-gray-200 rounded text-xs outline-none focus:border-indigo-500 bg-gray-50" placeholder="未設定" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-bold block mb-1">經度 (Longitude)</label>
                          <input type="number" step="any" value={store.lng || ''} onChange={e => { const v=parseFloat(e.target.value)||null; optStoreWrite(store.id,{lng:v},doc(db,'stores',store.id)); }} className="w-full p-2 border border-gray-200 rounded text-xs outline-none focus:border-indigo-500 bg-gray-50" placeholder="未設定" />
                        </div>
                      </div>
                      {(store.lat && store.lng) && (
                        <div className="mt-2 text-[10px] text-green-600 font-bold flex items-center">
                          <CheckCircle2 c="w-3 h-3 mr-1" /> 已啟用距離防護 (100m內)
                        </div>
                      )}
                    </div>
                  ))}
                  {stores.length === 0 && <p className="text-center text-gray-400 text-xs py-4 font-bold">目前無門店資料，請先新增門店</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <button onClick={() => setShowSettingsModal(false)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-200 active:scale-95 transition-transform">
                完成設定
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-slate-50 relative min-h-screen shadow-xl flex flex-col sm:border-x border-gray-200">
        
        <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center z-20 shrink-0 sticky top-0">
          <div className="flex items-center gap-2">
            {systemLogoUrl ? (
              <img src={systemLogoUrl} className="h-8 max-w-[120px] object-contain" alt="Logo" />
            ) : (
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Store c="w-4 h-4" /></div>
            )}
            {!systemLogoUrl && <h1 className="font-black text-gray-800 tracking-wide text-lg">{canEdit ? customTitles.hqTitle : customTitles.storeTitle}</h1>}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {canEdit && (
              <button onClick={() => setShowSettingsModal(true)} className="bg-gray-100 p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="系統設定">
                <Settings c="w-5 h-5" />
              </button>
            )}
            
            {/* 系統通知中心按鈕 */}
            {canEdit && (
              <button onClick={() => setShowNotificationModal(true)} className="relative bg-gray-100 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors group cursor-pointer" title="系統通知">
                <Bell c={`w-5 h-5 text-gray-500 group-hover:text-indigo-600 ${totalAdminNotifications > 0 ? 'text-indigo-500' : ''}`} />
                {totalAdminNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
            )}
            
            <button onClick={() => { setIsAuthenticated(false); setAuthPassword(''); setHasShownLoginNotice(false); }} className="bg-gray-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="登出"><LogOut c="w-4 h-4" /></button>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 relative z-0">
          
          {/* TAB 1.5: 待審核名單 (僅後台可見) */}
          {activeTab === 'pending' && canEdit && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setActiveTab('profile')} className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors"><ChevronLeft c="w-5 h-5" /></button>
                <h2 className="text-xl font-bold text-gray-800">新進人員審核 ({pendingAccounts.length})</h2>
              </div>
              
              {pendingAccounts.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm flex flex-col items-center">
                  <CheckCircle2 c="w-12 h-12 text-green-400 mb-3" />
                  <p className="text-sm font-bold text-gray-600">目前所有人員皆已審核完畢！</p>
                  <button onClick={() => setActiveTab('profile')} className="mt-4 text-indigo-600 text-xs font-bold hover:underline">返回人員名單</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAccounts.map(pa => (
                    <div key={pa.id} className="p-5 bg-white rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                      <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">{String(pa.name)}</h4>
                          <p className="text-[11px] text-gray-500 font-bold mt-1 tracking-widest uppercase">{String(pa.store)} | <span className="text-blue-600 font-bold">{String(pa.requestedRole)}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-3 pl-2">
                        <button onClick={async () => {
                          await deleteDoc(doc(db, 'pendingAccounts', pa.id));
                          await addDoc(collection(db, 'employees'), { name: pa.name, role: pa.requestedRole, store: pa.store, password: pa.password || '', birthdate: pa.birthdate || '', hireDate: pa.hireDate || '', phone: pa.phone || '', mbti: pa.mbti || '', completedLearning: {}, tasksDetail: [], learningHistory: [], examRecords: {}, avatarUrl: '', createdAt: Date.now() });
                          showToast('已加入名單！');
                          if(pendingAccounts.length === 1) setActiveTab('profile'); 
                        }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-md shadow-blue-200 active:scale-95 transition-transform">核准開通</button>
                        <button onClick={async () => {
                          await deleteDoc(doc(db, 'pendingAccounts', pa.id));
                          if(pendingAccounts.length === 1) setActiveTab('profile');
                        }} className="bg-gray-50 text-gray-500 px-6 py-2.5 rounded-lg text-sm font-bold border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">拒絕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: 學習地圖 */}
          {activeTab === 'learning' && (
            <div className="animate-in fade-in duration-300">

              {/* 學習內容設定主區塊 */}
              <div className="bg-transparent">
                {/* Sticky 標題列 + 分類頁籤 */}
                <div className="sticky top-0 z-20 pt-3 pb-3 -mx-4 px-4 border-b shadow-sm mb-4" style={{backgroundColor: 'color-mix(in srgb, var(--theme-main) 8%, white)', borderColor: 'color-mix(in srgb, var(--theme-main) 20%, #e5e7eb)'}}>
                  <div className="flex justify-between items-center mb-4 px-1">
                    <div></div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCategories([...allCats]); setShowCategoryManager(true); }} className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"><Settings c="w-3.5 h-3.5 mr-1" /><span>管理分類</span></button>
                      </div>
                    )}
                  </div>

                  {/* 頁籤 UI — sticky 區塊內 */}

                {/* 頁籤 UI */}
                <div className="mb-0" style={{width:'100%', minWidth:0}}>
                  {/* 第一排：母分類（有兩層結構才顯示） */}
                  {hasTwoLevel && (
                    <div style={{display:'flex', alignItems:'center', gap:'4px', paddingBottom:'8px', minWidth:0}}>
                      <div id="parent-tabs" style={{display:'flex', gap:'8px', overflowX:'auto', WebkitOverflowScrolling:'touch', flexWrap:'nowrap', minWidth:0, flex:1, scrollbarWidth:'none'}}>
                        {parentCategories.map((parent: any) => {
                          const isActive = currentParentId === parent.id;
                          return (
                            <button key={parent.id}
                              onClick={() => {
                                setActiveParentId(parent.id);
                                const firstChild = allCats.find((c: any) => c.parentId === parent.id);
                                setActiveCategoryId(firstChild ? firstChild.id : parent.id);
                                document.getElementById('app-scroll-container')?.scrollTo({top: 0, behavior: 'smooth'});
                              }}
                              style={{flexShrink:0, whiteSpace:'nowrap', WebkitUserSelect:'none', userSelect:'none'}}
                              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm ${isActive ? 'text-white border-transparent' : 'bg-white text-gray-600 border-white/80'}`}
                              style={isActive ? {backgroundColor: 'var(--theme-main)', borderColor: 'var(--theme-main)'} : {}}
                            >{String(parent.name)}</button>
                          );
                        })}
                      </div>
                      {/* 右箭頭：跳到下一個母分類 */}
                      {parentCategories.length > 1 && (() => {
                        const idx = parentCategories.findIndex((c:any) => c.id === currentParentId);
                        const next = parentCategories[idx + 1];
                        if (!next) return null;
                        return (
                          <button onClick={() => { setActiveParentId(next.id); const fc = allCats.find((c:any) => c.parentId === next.id); setActiveCategoryId(fc ? fc.id : next.id); }}
                            style={{flexShrink:0, WebkitUserSelect:'none', userSelect:'none'}}
                            className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center shadow-sm hover:bg-gray-50 text-xs font-bold">›</button>
                        );
                      })()}
                    </div>
                  )}
                  {/* 第二排（或唯一一排）＋未分類 */}
                  <div style={{display:'flex', alignItems:'center', gap:'4px', paddingTop: hasTwoLevel ? '8px' : '0', minWidth:0}}>
                    <div id="child-tabs" style={{display:'flex', gap:'8px', overflowX:'auto', WebkitOverflowScrolling:'touch', flexWrap:'nowrap', minWidth:0, flex:1, scrollbarWidth:'none'}}>
                      {effectiveCategories.map((cat: any) => {
                        if (!cat || !cat.id) return null;
                        const isActive = currentActiveCatId === cat.id;
                        return (
                          <button key={cat.id}
                            onClick={() => {
                              const pwd = categoryPasswords[cat.id];
                              if (!canEdit && pwd && !unlockedCategories.has(cat.id)) {
                                setShowCatLockModal(cat.id);
                                setCatLockInput('');
                              } else {
                                setActiveCategoryId(cat.id);
                                if (!hasTwoLevel) setActiveParentId(cat.id);
                                document.getElementById('app-scroll-container')?.scrollTo({top: 0, behavior: 'smooth'});
                              }
                            }}
                            style={{flexShrink:0, whiteSpace:'nowrap', WebkitUserSelect:'none', userSelect:'none', ...(isActive ? {color:'var(--theme-main)', borderBottom:`2px solid var(--theme-main)`, fontWeight:'800'} : {color:'rgba(0,0,0,0.45)', borderBottom:'2px solid transparent'})}}
                            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 ${isActive ? 'border-transparent' : 'bg-transparent text-gray-400 border-transparent hover:text-gray-600'}`}
                          >
                            {!canEdit && categoryPasswords[cat.id] && !unlockedCategories.has(cat.id) ? '🔒 ' : ''}{String(cat.name)}</button>
                        );
                      })}
                      {hasOrphans && (
                        <>
                          <button onClick={() => setActiveCategoryId(ORPHAN_CAT_ID)}
                            style={{flexShrink:0, whiteSpace:'nowrap', WebkitUserSelect:'none', userSelect:'none'}}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${currentActiveCatId === ORPHAN_CAT_ID ? 'bg-orange-50 text-orange-600 border-orange-300' : 'bg-white text-gray-400 border-gray-200 border-dashed'}`}
                          >⚠️ 未分類 ({orphanSteps.length})</button>
                          {canEdit && (
                            <button
                              onClick={createUntaggedAndAssignOrphans}
                              style={{flexShrink:0, whiteSpace:'nowrap', WebkitUserSelect:'none', userSelect:'none'}}
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-white border border-orange-500 hover:bg-orange-600 transition-all"
                              title={`建立「未標注」分類並將 ${orphanSteps.length} 筆內容移入`}
                            >＋ 移入未標注</button>
                          )}
                        </>
                      )}
                    </div>
                    {/* 右箭頭：跳到下一個子分類 */}
                    {(() => {
                      const allTabCats = [...effectiveCategories.filter((c:any) => c && c.id), ...(hasOrphans ? [{id: ORPHAN_CAT_ID}] : [])];
                      const idx = allTabCats.findIndex((c:any) => c.id === currentActiveCatId);
                      const next = allTabCats[idx + 1];
                      if (!next) return null;
                      return (
                        <button onClick={() => { setActiveCategoryId(next.id); if (!hasTwoLevel) setActiveParentId(next.id); }}
                          style={{flexShrink:0, WebkitUserSelect:'none', userSelect:'none'}}
                          className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center shadow-sm hover:bg-gray-50 text-sm font-bold">›</button>
                      );
                    })()}
                  </div>
                </div>{/* end sticky tabs div */}
                </div>{/* end sticky wrapper */}

                {/* 分類管理介面 (僅後台) - 在 sticky 外面 */}
                {canEdit && showCategoryManager && (
                  <div className="mb-4 mt-2 bg-slate-800 rounded-xl p-4 shadow-lg text-white animate-in slide-in-from-top-2">
                     <h3 className="font-bold mb-1 flex items-center text-sm"><FolderPlus c="w-4 h-4 mr-2 text-indigo-400"/>編輯學習分類（兩層結構）</h3>
                     <p className="text-[10px] text-gray-400 mb-3">拖曳 ⠿ 可調整順序，母分類＝外場/內場，子分類＝收桌/送餐…</p>

                     {/* 孤兒分類救援區 */}
                     {(() => {
                       const orphanCatIds = [...new Set(learningSteps
                         .filter((s:any) => s.categoryId && !editingCategories.some((c:any) => c.id === s.categoryId))
                         .map((s:any) => s.categoryId)
                       )];
                       if (orphanCatIds.length === 0) return null;
                       return (
                         <div className="mb-3 bg-orange-500/20 border border-orange-500/40 rounded-lg p-3">
                           <p className="text-[11px] text-orange-300 font-bold mb-2">⚠️ 發現 {orphanCatIds.length} 個遺失的舊分類，點擊可加回：</p>
                           <div className="flex flex-wrap gap-2">
                             {orphanCatIds.map((catId:string) => {
                               const count = learningSteps.filter((s:any) => s.categoryId === catId).length;
                               const oldName = catId.length > 20 ? catId.substring(0, 12) + '…' : catId;
                               return (
                                 <button
                                   key={catId}
                                   onClick={() => {
                                     const newId = Date.now().toString();
                                     // 新增一個子分類，id 用舊的 catId（保持對應關係）
                                     setEditingCategories(prev => {
                                       const firstParent = prev.find((c:any) => !c.parentId);
                                       return [...prev, {id: catId, name: `救援-${count}筆`, parentId: firstParent?.id || null}];
                                     });
                                     showToast(`已加回，請修改名稱後儲存`);
                                   }}
                                   className="text-[11px] bg-orange-500/30 hover:bg-orange-500/50 text-orange-200 px-2.5 py-1.5 rounded-lg font-bold transition-colors"
                                 >+ {count} 筆資料（點擊加回）</button>
                               );
                             })}
                           </div>
                         </div>
                       );
                     })()}
                     <div className="space-y-3 mb-4 max-h-[60vh] overflow-y-auto pr-1">
                       {editingCategories.filter((c:any) => !c.parentId).map((parent: any, pi: number) => {
                         const parentIndex = editingCategories.filter((c:any) => !c.parentId).indexOf(parent);
                         return (
                         <div
                           key={parent.id}
                           draggable
                           onDragStart={e => { setDraggedCatIndex(parentIndex); e.dataTransfer.effectAllowed = 'move'; }}
                           onDragEnter={() => setDragOverCatIndex(parentIndex)}
                           onDragOver={e => e.preventDefault()}
                           onDragEnd={() => { setDraggedCatIndex(null); setDragOverCatIndex(null); }}
                           onDrop={e => {
                             e.preventDefault();
                             if (draggedCatIndex === null || draggedCatIndex === parentIndex) return;
                             const parents = editingCategories.filter((c:any) => !c.parentId || c.parentId === '');
                             const [moved] = parents.splice(draggedCatIndex, 1);
                             parents.splice(parentIndex, 0, moved);
                             // 重新組合：保留所有子分類，parentId 不變（母分類 ID 沒改，只是順序變）
                             const children = editingCategories.filter((c:any) => c.parentId && c.parentId !== '');
                             setEditingCategories([...parents, ...children]);
                             setDraggedCatIndex(null); setDragOverCatIndex(null);
                           }}
                           style={{WebkitUserDrag:'element'} as any}
                           className={`border rounded-lg overflow-hidden transition-all ${draggedCatIndex === parentIndex ? 'opacity-40 scale-95 border-indigo-400' : dragOverCatIndex === parentIndex && draggedCatIndex !== parentIndex ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-600'}`}
                         >
                           {/* 母分類列 */}
                           <div className="flex gap-2 items-center bg-slate-600 p-2.5">
                             <span style={{cursor:'grab', WebkitUserSelect:'none', userSelect:'none', flexShrink:0}}>
                               <GripVertical c="w-4 h-4 text-slate-400 hover:text-white" />
                             </span>
                             <span className="text-[10px] text-indigo-300 font-bold whitespace-nowrap">母分類</span>
                             <input type="text" value={parent.name} onChange={e => setEditingCategories(editingCategories.map((c:any) => c.id === parent.id ? {...c, name: e.target.value} : c))} className="flex-1 bg-transparent text-sm font-bold outline-none text-white focus:text-indigo-300" placeholder="母分類名稱（例：外場）" style={{WebkitUserSelect:'text', userSelect:'text'}}/>
                             <button onClick={() => setEditingCategories(editingCategories.filter((c:any) => c.id !== parent.id && c.parentId !== parent.id))} className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 flex-shrink-0"><Trash2 c="w-3.5 h-3.5"/></button>
                           </div>
                           {/* 子分類列 */}
                           <div className="bg-slate-700 p-2 space-y-1.5">
                             {editingCategories.filter((c:any) => c.parentId === parent.id).map((child: any, ci: number) => (
                               <div
                                 key={child.id}
                                 draggable
                                 onDragStart={e => { e.stopPropagation(); setDraggedChildIndex({parentId: parent.id, index: ci}); e.dataTransfer.effectAllowed = 'move'; }}
                                 onDragEnter={e => { e.stopPropagation(); setDragOverChildIndex(ci); }}
                                 onDragOver={e => { e.stopPropagation(); e.preventDefault(); }}
                                 onDragEnd={() => { setDraggedChildIndex(null); setDragOverChildIndex(null); }}
                                 onDrop={e => {
                                   e.stopPropagation(); e.preventDefault();
                                   if (!draggedChildIndex || draggedChildIndex.parentId !== parent.id || draggedChildIndex.index === ci) return;
                                   const kids = editingCategories.filter((c:any) => c.parentId === parent.id);
                                   const [moved] = kids.splice(draggedChildIndex.index, 1);
                                   kids.splice(ci, 0, moved);
                                   const rest = editingCategories.filter((c:any) => c.parentId !== parent.id);
                                   setEditingCategories([...rest, ...kids]);
                                   setDraggedChildIndex(null); setDragOverChildIndex(null);
                                 }}
                                 style={{WebkitUserDrag:'element'} as any}
                                 className={`flex gap-2 items-center bg-slate-600/50 p-2 rounded transition-all ${draggedChildIndex?.parentId === parent.id && draggedChildIndex?.index === ci ? 'opacity-40 scale-95 border border-indigo-400' : dragOverChildIndex === ci && draggedChildIndex?.parentId === parent.id && draggedChildIndex?.index !== ci ? 'border border-indigo-500 ring-1 ring-indigo-500/50' : ''}`}
                               >
                                 <span style={{cursor:'grab', WebkitUserSelect:'none', userSelect:'none', flexShrink:0}}>
                                   <GripVertical c="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                                 </span>
                                 <span className="w-1 h-4 bg-indigo-400 rounded-full flex-shrink-0"></span>
                                 <input type="text" value={child.name} onChange={e => setEditingCategories(editingCategories.map((c:any) => c.id === child.id ? {...c, name: e.target.value} : c))} className="flex-1 bg-transparent text-xs outline-none text-gray-200 focus:text-white" placeholder="子分類名稱" style={{WebkitUserSelect:'text', userSelect:'text'}}/>
                                 <button onClick={() => setEditingCategories(editingCategories.filter((c:any) => c.id !== child.id))} className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 flex-shrink-0"><Trash2 c="w-3 h-3"/></button>
                               </div>
                             ))}
                             <button onClick={() => setEditingCategories([...editingCategories, {id: Date.now().toString(), name: '', parentId: parent.id}])} className="w-full p-1.5 border border-dashed border-slate-500 rounded text-slate-400 hover:text-white text-[11px] transition-colors">＋ 新增子分類</button>
                           </div>
                         </div>
                       );})}
                       <button onClick={() => setEditingCategories([...editingCategories, {id: 'parent_' + Date.now().toString(), name: '', parentId: null}])} className="w-full p-2 border border-dashed border-slate-500 rounded text-slate-300 font-bold hover:text-white text-xs transition-colors">＋ 新增母分類</button>
                     </div>
                     <div className="flex gap-2 pt-2 border-t border-slate-700">
                       <button onClick={() => setShowCategoryManager(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold">取消</button>
                       <button onClick={saveCategoriesConfig} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-400 rounded text-xs font-bold shadow-md">儲存分類</button>
                     </div>

                     {/* 未分類內容快速指派 */}
                     {orphanSteps.length > 0 && (() => {
                       const allChildCats = editingCategories.filter((c:any) => c.parentId && c.name.trim());
                       const allValidCats = allChildCats.length > 0 ? allChildCats : editingCategories.filter((c:any) => c.name.trim());
                       if (allValidCats.length === 0) return null;

                       // 依 categoryId 群組（null/undefined 也算一組）
                       const orphanGroups: {[key: string]: {steps: any[], label: string}} = {};
                       orphanSteps.forEach((s: any) => {
                         const key = s.categoryId || '__no_cat__';
                         if (!orphanGroups[key]) {
                           orphanGroups[key] = {
                             steps: [],
                             label: key === '__no_cat__' ? '（無分類欄位）' : `舊ID: ${String(key).slice(0, 16)}…`
                           };
                         }
                         orphanGroups[key].steps.push(s);
                       });

                       return (
                         <div className="mt-4 pt-3 border-t border-slate-600">
                           <p className="text-[11px] text-orange-400 font-bold mb-2">⚠️ 共 {orphanSteps.length} 筆待分類，請指派：</p>
                           <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                             {Object.entries(orphanGroups).map(([key, group]: any) => (
                               <div key={key} className="bg-slate-700/60 rounded-lg p-2.5">
                                 <div className="flex items-center justify-between gap-2 mb-1.5">
                                   <span className="text-[10px] text-orange-300 font-bold">{group.label} ({group.steps.length} 筆)</span>
                                   <select
                                     defaultValue=""
                                     onChange={async e => {
                                       const newCatId = e.target.value;
                                       if (!newCatId) return;
                                       for (const s of group.steps) {
                                         optStepWrite(s.id, { categoryId: newCatId }, doc(db, 'learningSteps', s.id));
                                         optStep(s.id, { categoryId: newCatId });
                                       }
                                       showToast(`✅ ${group.steps.length} 筆已移至新分類！`);
                                     }}
                                     className="text-[11px] bg-slate-600 text-white border border-slate-400 rounded px-2 py-1 outline-none"
                                     style={{WebkitUserSelect:'none', userSelect:'none'}}
                                   >
                                     <option value="">指派到分類…</option>
                                     {allValidCats.map((c:any) => (
                                       <option key={c.id} value={c.id}>{String(c.name)}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className="flex flex-wrap gap-1">
                                   {group.steps.slice(0, 5).map((s:any) => (
                                     <span key={s.id} className="text-[10px] bg-slate-600 text-gray-300 px-1.5 py-0.5 rounded">{String(s.title).slice(0, 12)}</span>
                                   ))}
                                   {group.steps.length > 5 && <span className="text-[10px] text-gray-400">+{group.steps.length - 5} 筆</span>}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       );
                     })()}
                  </div>
                )}

                {/* 後台診斷：已移除 */}

                {/* 後台專屬：掃描未分類內容按鈕 */}
                {canEdit && (() => {
                  const validCatIds = new Set(allCats.map((c:any) => c.id));
                  const total = learningSteps.filter((s:any) => 
                    !s.categoryId || 
                    s.categoryId === '__orphan__' ||
                    !validCatIds.has(s.categoryId)
                  ).length;
                  if (total === 0) return null;
                  return (
                    <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-orange-700">⚠️ 有 {total} 筆內容尚未分類</p>
                        <p className="text-[10px] text-orange-500 mt-0.5">點右側按鈕一鍵移入「未標注」，再逐一整理</p>
                      </div>
                      <button
                        onClick={createUntaggedAndAssignOrphans}
                        style={{WebkitUserSelect:'none', userSelect:'none', flexShrink:0}}
                        className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
                      >＋ 移入未標注</button>
                    </div>
                  );
                })()}
                  {canEdit && (
                    <div className="mb-4">
                      <button onClick={async () => {
                        const minCreatedAt = filteredSteps.length > 0 ? Math.min(...filteredSteps.map((s:any) => s.createdAt || 0)) - 1 : Date.now();
                        await addDoc(collection(db, 'learningSteps'), { title: '新學習項目', blocks: [{ id: Date.now().toString(), subtitle: '', description: '', mediaUrl: '', fileName: '', enableCheck: true }], categoryId: currentActiveCatId, status: 'locked', createdAt: minCreatedAt });
                      }} className="w-full py-3 border border-gray-200 rounded-xl text-sm text-indigo-600 font-bold flex justify-center items-center hover:bg-gray-50 transition-colors shadow-sm bg-white">
                        <PlusCircle c="w-4 h-4 mr-1.5"/> 於「{String(effectiveCategories.find((c:any)=>c.id === currentActiveCatId)?.name || '')}」新增內容
                      </button>
                    </div>
                  )}

                  {filteredSteps.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm font-bold bg-white rounded-xl border border-gray-100 shadow-sm">
                      <BookOpen c="w-10 h-10 mx-auto mb-3 text-gray-200" />
                      此分類目前尚無學習項目
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {canEdit ? (
                        /* 後台編輯視角：顯示所有可編輯的卡片 */
                        <>
                          {/* 後台快速跳轉卡片（同前台樣式） */}
                          {filteredSteps.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                              {filteredSteps.map((step, index) => (
                                <button
                                  key={step.id}
                                  onClick={() => {
                                    const el = document.getElementById(`step-admin-${step.id}`);
                                    const container = document.getElementById('app-scroll-container');
                                    if (el && container) {
                                      const stickyH = document.querySelector('.sticky.top-0')?.getBoundingClientRect().height || 0; const tabsH = 80; const topOffset = el.getBoundingClientRect().top + container.scrollTop - stickyH - tabsH - 8;
                                      container.scrollTo({ top: topOffset, behavior: 'smooth' });
                                    }
                                  }}
                                  style={{flexShrink:0, WebkitUserSelect:'none', userSelect:'none'}}
                                  className="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border bg-white text-gray-600 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                >
                                  {String(step.title).slice(0, 10)}
                                </button>
                              ))}
                            </div>
                          )}
                          {filteredSteps.map((step, index) => (
                          <div
                            id={`step-admin-${step.id}`}
                            key={step.id}
                            draggable={draggedStepIndex === index}
                            onDragStart={e => { if (draggedStepIndex !== index) { e.preventDefault(); return; } e.dataTransfer.effectAllowed = 'move'; }}
                            onDragEnter={() => setDragOverStepIndex(index)}
                            onDragOver={e => e.preventDefault()}
                            onDragEnd={() => { setDraggedStepIndex(null); setDragOverStepIndex(null); }}
                            onDrop={async e => {
                              e.preventDefault();
                              if (draggedStepIndex === null || draggedStepIndex === index) return;
                              const newSteps = [...filteredSteps];
                              const [moved] = newSteps.splice(draggedStepIndex, 1);
                              newSteps.splice(index, 0, moved);
                              setDraggedStepIndex(null);
                              setDragOverStepIndex(null);
                              // 更新 Firebase 排序
                              for (let i = 0; i < newSteps.length; i++) {
                                optStepWrite(newSteps[i].id, { createdAt: Date.now() + i }, doc(db, 'learningSteps', newSteps[i].id));
                                optStep(newSteps[i].id, { createdAt: Date.now() + i });
                              }
                            }}
                            className={`flex flex-col gap-3 p-5 rounded-xl border bg-white shadow-sm relative transition-all ${
                              draggedStepIndex === index ? 'opacity-40 scale-95 border-indigo-300' :
                              dragOverStepIndex === index && draggedStepIndex !== index ? 'border-indigo-500 ring-2 ring-indigo-200' :
                              'border-gray-200'
                            }`}
                          >
                            <button onClick={async () => await deleteDoc(doc(db, 'learningSteps', step.id))} className="absolute top-4 right-4 p-1.5 text-red-300 hover:text-red-500 rounded transition-colors"><Trash2 c="w-4 h-4" /></button>
                            
                            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3 bg-white rounded-lg">
                              {/* 學習項目拖曳把手 */}
                              <span
                                onMouseDown={() => setDraggedStepIndex(index)}
                                onMouseUp={() => setDraggedStepIndex(null)}
                                style={{cursor:'grab', WebkitUserSelect:'none', userSelect:'none', flexShrink:0}}
                                title="拖曳排序學習項目"
                              >
                                <GripVertical c="w-5 h-5 text-gray-300 hover:text-gray-500 transition-colors" />
                              </span>
                              <div className="font-black text-gray-300 text-xl w-6">{index + 1}.</div>
                              <div className="flex flex-1 gap-2 pr-6">
                                <input type="text" defaultValue={step.title} onBlur={e => { optStepWrite(step.id, {title: e.target.value}, doc(db,'learningSteps',step.id)); }} className="flex-1 p-2 border border-transparent hover:border-gray-200 rounded-lg font-black text-gray-800 text-lg outline-none focus:border-indigo-500 bg-white focus:bg-gray-50 transition-colors" placeholder="請輸入大標題"/>
                              </div>
                            </div>

                            {/* 移至其他分類 + 簽名開關 */}
                            <div className="flex items-center gap-2 px-1 pb-3 border-b border-gray-100 mb-2">
                              <span className="text-[11px] text-gray-500 font-bold whitespace-nowrap flex items-center gap-1">
                                📂 分類：
                              </span>
                              <select
                                value={step.categoryId || ''}
                                onChange={async e => {
                                  const newCatId = e.target.value;
                                  if (!newCatId) return;
                                  optStepWrite(step.id, { categoryId: newCatId }, doc(db, 'learningSteps', step.id));
                                  optStep(step.id, { categoryId: newCatId });
                                  // 同時切換母分類和子分類頁籤
                                  if (targetCat?.parentId) {
                                    setActiveParentId(targetCat.parentId);
                                  } else {
                                    setActiveParentId(newCatId);
                                  }
                                  setActiveCategoryId(newCatId);
                                  const catName = targetCat?.parentId
                                    ? `${allCats.find((p:any) => p.id === targetCat.parentId)?.name} › ${targetCat.name}`
                                    : targetCat?.name;
                                  showToast(`✅ 已移至「${catName}」，正在跳轉...`);
                                }}
                                className="flex-1 text-xs bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-2 outline-none focus:border-indigo-500 text-indigo-700 font-bold"
                                style={{WebkitUserSelect:'none', userSelect:'none'}}
                              >
                                <option value="">（未分類）</option>
                                {(() => {
                                  const parents = allCats.filter((c:any) => !c.parentId && c.name.trim());
                                  const result: any[] = [];
                                  parents.forEach((parent:any) => {
                                    const children = allCats.filter((c:any) => c.parentId === parent.id && c.name.trim());
                                    if (children.length > 0) {
                                      children.forEach((child:any) => {
                                        result.push(<option key={child.id} value={child.id}>{`${parent.name} › ${child.name}`}</option>);
                                      });
                                    } else {
                                      result.push(<option key={parent.id} value={parent.id}>{parent.name}</option>);
                                    }
                                  });
                                  return result;
                                })()}
                              </select>
                            </div>

                            {/* 簽名功能開關 */}
                            <div className="flex items-center justify-between px-1 pb-3 border-b border-gray-100 mb-2">
                              <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1">✍️ 完成時需要本人簽名</span>
                              <button
                                onClick={async () => {
                                  const nextSig = !step.requireSignature;
                                  optStepWrite(step.id, { requireSignature: nextSig }, doc(db, 'learningSteps', step.id));
                                  optStep(step.id, { requireSignature: nextSig });
                                }}
                                style={{WebkitUserSelect:'none', userSelect:'none'}}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${step.requireSignature ? 'bg-indigo-600' : 'bg-gray-200'}`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${step.requireSignature ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>
                            
                            <div className="mt-2 space-y-4 pb-2">
                              {getStepBlocks(step).map((block: any, bIndex: number) => (
                                <div
                                  key={block.id}
                                  draggable={draggedBlockInfo?.stepId === step.id && draggedBlockInfo?.blockIndex === bIndex}
                                  onDragStart={e => {
                                    if (!(draggedBlockInfo?.stepId === step.id && draggedBlockInfo?.blockIndex === bIndex)) { e.preventDefault(); return; }
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  onDragEnter={e => { e.preventDefault(); setDragOverBlockIndex(bIndex); }}
                                  onDragOver={e => e.preventDefault()}
                                  onDragEnd={() => { setDraggedBlockInfo(null); setDragOverBlockIndex(null); }}
                                  onDrop={async e => {
                                    e.preventDefault();
                                    if (!draggedBlockInfo) return;
                                    const isSameStep = draggedBlockInfo.stepId === step.id;
                                    if (isSameStep && draggedBlockInfo.blockIndex === bIndex) return;
                                    if (isSameStep) {
                                      const blocks = [...getStepBlocks(step)];
                                      const [moved] = blocks.splice(draggedBlockInfo.blockIndex, 1);
                                      blocks.splice(bIndex, 0, moved);
                                      optStepWrite(step.id, { blocks }, doc(db, 'learningSteps', step.id));
                                      optStep(step.id, { blocks });
                                      const srcStep = filteredSteps.find((s:any) => s.id === draggedBlockInfo.stepId);
                                      if (!srcStep) return;
                                      const srcBlocks = [...getStepBlocks(srcStep)];
                                      const [moved] = srcBlocks.splice(draggedBlockInfo.blockIndex, 1);
                                      const destBlocks = [...getStepBlocks(step)];
                                      destBlocks.splice(bIndex, 0, moved);
                                      optStepWrite(srcStep.id, {blocks:srcBlocks}, doc(db,'learningSteps',srcStep.id)); optStepWrite(step.id, {blocks:destBlocks}, doc(db,'learningSteps',step.id));
                                      optStep(srcStep.id,{blocks:srcBlocks}); optStep(step.id,{blocks:destBlocks});
                                      showToast(`區塊已移至「${step.title}」`);
                                    }
                                    setDraggedBlockInfo(null); setDragOverBlockIndex(null);
                                  }}
                                  className={`bg-white p-4 rounded-xl border shadow-sm relative transition-all ${
                                    draggedBlockInfo?.stepId === step.id && draggedBlockInfo?.blockIndex === bIndex ? 'opacity-40 scale-95 border-indigo-300' :
                                    dragOverBlockIndex === bIndex && draggedBlockInfo && (draggedBlockInfo.stepId !== step.id || draggedBlockInfo.blockIndex !== bIndex) ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                      {/* 拖曳把手：onMouseDown 觸發，跟項目卡片完全一樣 */}
                                      <span
                                        onMouseDown={() => setDraggedBlockInfo({ stepId: step.id, blockIndex: bIndex })}
                                        onMouseUp={() => setDraggedBlockInfo(null)}
                                        style={{cursor:'grab', WebkitUserSelect:'none', userSelect:'none', flexShrink:0}}
                                        title="拖曳排序"
                                      >
                                        <GripVertical c="w-5 h-5 text-gray-300 hover:text-gray-500 transition-colors" />
                                      </span>
                                      {/* 上下按鈕 */}
                                      <div className="flex gap-1">
                                        <button onClick={async () => { if (bIndex===0) return; const b=[...getStepBlocks(step)]; [b[bIndex-1],b[bIndex]]=[b[bIndex],b[bIndex-1]]; optStepWrite(step.id,{blocks:b},doc(db,'learningSteps',step.id)); }} disabled={bIndex===0} style={{WebkitUserSelect:'none',userSelect:'none'}} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${bIndex===0?'text-gray-200 cursor-not-allowed':'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>▲</button>
                                        <button onClick={async () => { const b=[...getStepBlocks(step)]; if(bIndex===b.length-1) return; [b[bIndex],b[bIndex+1]]=[b[bIndex+1],b[bIndex]]; optStepWrite(step.id,{blocks:b},doc(db,'learningSteps',step.id)); }} disabled={bIndex===getStepBlocks(step).length-1} style={{WebkitUserSelect:'none',userSelect:'none'}} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${bIndex===getStepBlocks(step).length-1?'text-gray-200 cursor-not-allowed':'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>▼</button>
                                      </div>
                                      <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">區塊 {bIndex + 1}</span>
                                      {/* 移至同分類其他項目 */}
                                      {filteredSteps.length > 1 && (
                                        <select
                                          value=""
                                          onChange={async e => {
                                            const targetStepId = e.target.value;
                                            if (!targetStepId) return;
                                            const targetStep = filteredSteps.find((s:any) => s.id === targetStepId);
                                            if (!targetStep) return;
                                            const srcBlocks = [...getStepBlocks(step)];
                                            const [moved] = srcBlocks.splice(bIndex, 1);
                                            const destBlocks = [...getStepBlocks(targetStep), moved];
                                            optStepWrite(step.id, {blocks:srcBlocks}, doc(db,'learningSteps',step.id)); optStepWrite(targetStepId, {blocks:destBlocks}, doc(db,'learningSteps',targetStepId));
                                            optStep(step.id,{blocks:srcBlocks}); optStep(targetStepId,{blocks:destBlocks});
                                            showToast(`✅ 區塊已移至「${targetStep.title}」`);
                                          }}
                                          style={{WebkitUserSelect:'none', userSelect:'none'}}
                                          className="text-[10px] bg-blue-50 border border-blue-200 rounded px-1.5 py-1 outline-none text-blue-600 max-w-[110px]"
                                        >
                                          <option value="">📦 移至項目...</option>
                                          {filteredSteps.filter((s:any) => s.id !== step.id).map((s:any) => (
                                            <option key={s.id} value={s.id}>{String(s.title).slice(0, 14)}</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                    <button onClick={() => removeBlock(step, block.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded transition-colors" title="刪除此區塊"><Trash2 c="w-3.5 h-3.5" /></button>
                                  </div>
                                  
                                  <input type="text" defaultValue={block.subtitle || ''} onBlur={e => updateBlockField(step, block.id, 'subtitle', e.target.value)} onDragStart={e => e.preventDefault()} className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-gray-800 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white mb-3 select-text" style={{userSelect:'text', WebkitUserSelect:'text'}} placeholder="請輸入子標題（選填）"/>
                                  
                                  {/* 教學完畢打勾開關 */}
                                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                                    <span className="text-xs font-bold text-gray-600">✅ 顯示「教學完畢」打勾按鈕</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = !(block.enableCheck !== false);
                                        const newBlocks = getStepBlocks(step).map((b: any) => b.id === block.id ? {...b, enableCheck: next} : b);
                                        optStepWrite(step.id, { blocks: newBlocks }, doc(db, 'learningSteps', step.id));
                                      }}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${block.enableCheck !== false ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                    >
                                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${block.enableCheck !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                  </div>
                                  
                                  <textarea defaultValue={block.description} onBlur={e => updateBlockField(step, block.id, 'description', e.target.value)} onDragStart={e => e.preventDefault()} className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[100px] select-text" style={{userSelect:'text', WebkitUserSelect:'text', resize:'vertical'}} placeholder="請輸入學習內容..." />
                                
                                  <div className="flex items-center space-x-3 mt-3">
                                    <label className={`flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                      <UploadCloud c="w-4 h-4 mr-1.5 text-indigo-500" />{isUploading ? '上傳中...' : '上傳附件'}
                                      <input type="file" accept="image/*,video/*" className="hidden" disabled={isUploading} onChange={(e) => handleBlockFileUpload(step, block.id, e)} />
                                    </label>
                                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{String(block.fileName || (block.mediaUrl ? '已上傳' : '無附件'))}</span>
                                  </div>

                                  {block.mediaUrl && (
                                    <div className="mt-3 relative inline-block">
                                      {(block.fileName && block.fileName.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) || block.mediaUrl.match(/\.(mp4|webm|ogg|mov|m4v)/i) ? (
                                        <video src={block.mediaUrl} controls className="max-h-32 rounded border border-gray-200" />
                                      ) : ( 
                                        <img src={block.mediaUrl} onClick={() => setFullscreenImage(block.mediaUrl)} className="max-h-32 object-contain rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" alt="預覽" title="點擊放大" /> 
                                      )}
                                      <button onClick={() => removeBlockMedia(step, block.id)} className="absolute top-1 right-1 bg-red-500/90 text-white px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm shadow-sm">移除</button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              
                              {/* 跨項目移動區塊接收區 */}
                              {draggedBlockInfo && draggedBlockInfo.stepId !== step.id && (
                                <div
                                  onDragEnter={() => setDragOverBlockIndex(-1)}
                                  onDragOver={e => e.preventDefault()}
                                  onDrop={async e => {
                                    e.preventDefault();
                                    if (!draggedBlockInfo) return;
                                    const srcStep = filteredSteps.find((s:any) => s.id === draggedBlockInfo.stepId);
                                    if (!srcStep) return;
                                    const srcBlocks = [...getStepBlocks(srcStep)];
                                    const [moved] = srcBlocks.splice(draggedBlockInfo.blockIndex, 1);
                                    const destBlocks = [...getStepBlocks(step), moved];
                                    optStepWrite(srcStep.id, {blocks:srcBlocks}, doc(db,'learningSteps',srcStep.id)); optStepWrite(step.id, {blocks:destBlocks}, doc(db,'learningSteps',step.id));
                                    optStep(srcStep.id,{blocks:srcBlocks}); optStep(step.id,{blocks:destBlocks});
                                    showToast(`區塊已移至「${step.title}」`);
                                    setDraggedBlockInfo(null); setDragOverBlockIndex(null);
                                  }}
                                  className={`w-full py-4 border-2 border-dashed rounded-xl text-xs font-bold flex justify-center items-center transition-all ${dragOverBlockIndex === -1 ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-300 bg-gray-50 text-gray-400'}`}
                                >＋ 拖放區塊到「{step.title}」</div>
                              )}

                              <button onClick={() => addBlock(step)} className="w-full py-3 bg-white border border-gray-200 border-dashed rounded-xl text-xs text-indigo-600 font-bold flex justify-center items-center hover:bg-indigo-50 transition-colors">
                                <PlusCircle c="w-4 h-4 mr-1.5"/> 新增內容區塊
                              </button>
                            </div>

                            {/* 固定底部操作列 */}
                            <div className="sticky bottom-16 z-30 -mx-5 px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex gap-2 items-center rounded-b-xl">
                              <button onClick={() => addBlock(step)} className="flex-1 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-indigo-600 font-bold flex justify-center items-center hover:bg-indigo-50 transition-colors">
                                <PlusCircle c="w-4 h-4 mr-1"/> 新增區塊
                              </button>
                              <button
                                onClick={async () => {
                                  const minCreatedAt = filteredSteps.length > 0 ? Math.min(...filteredSteps.map((s:any) => s.createdAt || 0)) - 1 : Date.now();
                                  await addDoc(collection(db, 'learningSteps'), {
                                    title: '新學習項目',
                                    blocks: [{ id: Date.now().toString(), subtitle: '', description: '', mediaUrl: '', fileName: '', enableCheck: true }],
                                    categoryId: currentActiveCatId,
                                    status: 'locked',
                                    createdAt: minCreatedAt
                                  });
                                  showToast(`已在「${effectiveCategories.find((c:any) => c.id === currentActiveCatId)?.name || ''}」新增項目！`);
                                }}
                                className="flex-1 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-bold flex justify-center items-center hover:bg-green-100 transition-colors"
                              >
                                <PlusCircle c="w-4 h-4 mr-1"/> 新增項目
                              </button>
                              <button onClick={() => showToast("所有內容已安全儲存！")} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center">
                                <CheckCircle2 c="w-4 h-4 mr-1" /> 儲存
                              </button>
                            </div>
                          </div>
                        ))}
                        </>
                      ) : (
                        /* 員工視角：純白底層闖關地圖 */
                        <div className="space-y-6 my-3">
                          {/* 快速跳轉卡片列 */}
                          {filteredSteps.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                              {filteredSteps.map((step, index) => {
                                const completedIds = new Set((currentUserData?.learningHistory || []).map((h:any) => h.stepId));
                                const isCompleted = completedIds.has(step.id);
                                return (
                                  <button
                                    key={step.id}
                                    onClick={() => {
                                      const el = document.getElementById(`step-${step.id}`);
                                      const container = document.getElementById('app-scroll-container');
                                      if (el && container) {
                                        const stickyH = document.querySelector('.sticky.top-0')?.getBoundingClientRect().height || 0; const tabsH = 80; const topOffset = el.getBoundingClientRect().top + container.scrollTop - stickyH - tabsH - 8;
                                        container.scrollTo({ top: topOffset, behavior: 'smooth' });
                                      }
                                    }}
                                    style={{flexShrink:0, WebkitUserSelect:'none', userSelect:'none'}}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                                      isCompleted ? 'bg-green-50 text-green-700 border-green-200' :
                                      'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}
                                  >
                                    {isCompleted ? '✅ ' : ''}{String(step.title).slice(0, 12)}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {filteredSteps.map((step, index) => {
                            const completedStepIds = new Set((currentUserData?.learningHistory || []).map((h:any) => h.stepId));
                            const isCompleted = completedStepIds.has(step.id);
                            const isCurrent = !isCompleted;
                            const isLocked = false; // 取消鎖定，所有項目都可執行

                            if (isLocked) {
                              return (
                                <div key={step.id} id={`step-${step.id}`} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                                      <BookOpen c="w-4 h-4" />
                                    </div>
                                    <h3 className="font-bold text-gray-700 text-lg">{String(step.title)}</h3>
                                  </div>
                                  <div className="space-y-4 select-text">
                                    {getStepBlocks(step).map((block: any, bIndex: number) => (
                                      <div key={block.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        {block.subtitle && (
                                          <h4 className="font-bold text-base mb-2 pb-2 border-b border-gray-200" style={{color:'#1e3a5f', fontFamily:'system-ui,-apple-system,sans-serif', whiteSpace:'pre-wrap'}}>{String(block.subtitle)}</h4>
                                        )}
                                        <p className="text-[15px] text-gray-700 whitespace-pre-wrap select-text cursor-text text-center" style={{fontFamily:'system-ui,-apple-system,sans-serif', lineHeight:'2.4'}}>{String(block.description)}</p>
                                        {block.mediaUrl && (
                                          <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 flex justify-center">
                                            {(block.fileName && block.fileName.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) || block.mediaUrl.match(/\.(mp4|webm|ogg|mov|m4v)/i) ? (
                                              <video src={block.mediaUrl} controls className="max-h-64 w-full object-contain" />
                                            ) : (
                                              <img src={block.mediaUrl} onClick={() => setFullscreenImage(block.mediaUrl)} className="max-h-64 w-full object-contain cursor-pointer" alt="教材" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-5 pt-4 border-t border-gray-100 pb-24">
                                    <button onClick={() => { if (step.requireSignature) { setShowSignatureModal(step); setSignatureDataUrl(''); } else { setTrainerModalStep(step); setSelectedTrainerStore(currentUserData?.store || ''); setSelectedTrainerName(''); setShowTrainerModal(true); } }} className="w-full py-4 bg-gray-700 hover:bg-gray-800 text-white font-black rounded-xl text-base shadow-lg transition-all active:scale-95 flex justify-center items-center">
                                      <CheckCircle2 c="w-6 h-6 mr-2" />完成學習，紀錄進度
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            if (isCompleted) {
                              const historyRecord = currentUserData?.learningHistory?.find((h: any) => h.stepId === step.id);
                              const trainerName = historyRecord?.trainerName;
                              return (
                                <div key={step.id} id={`step-${step.id}`} className="bg-white border border-green-200 rounded-xl p-5 shadow-sm relative">
                                  {/* 已完成標題列 */}
                                  <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full border-2 border-green-500 bg-green-50 flex items-center justify-center text-green-600 shadow-sm">
                                      <CheckCircle2 c="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg">{String(step.title)}</h3>
                                    <span className="ml-auto text-[10px] font-bold text-green-600 flex items-center bg-green-50 border border-green-200 px-2 py-1 rounded-full shadow-sm">
                                      <CheckCircle2 c="w-3 h-3 mr-1"/>已完成
                                    </span>
                                  </div>
                                  {trainerName && trainerName !== '無' && (
                                    <div className="text-[11px] font-bold text-red-500 flex items-center mb-3">
                                      <UserIcon c="w-3.5 h-3.5 mr-1" />教學人員: {trainerName}
                                    </div>
                                  )}
                                  {/* 顯示完整內容區塊（與目前進度相同） */}
                                  <div className="space-y-5 select-text">
                                    {getStepBlocks(step).map((block: any, bIndex: number) => (
                                      <div key={block.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          {block.subtitle && (
                                            <h4 className="font-bold text-base pb-2 border-b border-gray-200 flex-1" style={{color:'#1e3a5f', fontFamily:'system-ui,-apple-system,sans-serif', whiteSpace:'pre-wrap'}}>{String(block.subtitle)}</h4>
                                          )}
                                          {block.enableCheck !== false && (
                                          <button
                                            onClick={() => {
                                              const key = `${step.id}_${block.id}`;
                                              const base = currentUserData?.completedBlocks ? {...currentUserData.completedBlocks} : {};
                                              const merged = {...base, ...localCompletedBlocks};
                                              const next = !( merged[key] || false);
                                              const newBlocks = {...merged, [key]: next};
                                              setLocalCompletedBlocks(prev => ({...prev, [key]: next}));
                                              optEmpWrite(currentUserData.id, { completedBlocks: newBlocks }, doc(db, 'employees', currentUserData.id));
                                            }}
                                            style={{WebkitUserSelect:'none', userSelect:'none', flexShrink:0}}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${({...(currentUserData?.completedBlocks||{}), ...localCompletedBlocks})[`${step.id}_${block.id}`] ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-400'}`}
                                          >
                                            <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'14px',height:'14px',borderRadius:'3px',flexShrink:0,backgroundColor:({...(currentUserData?.completedBlocks||{}), ...localCompletedBlocks})[`${step.id}_${block.id}`]?'#16a34a':'white',border:({...(currentUserData?.completedBlocks||{}), ...localCompletedBlocks})[`${step.id}_${block.id}`]?'2px solid #16a34a':'2px solid #d1d5db'}}>
                                              {({...(currentUserData?.completedBlocks||{}), ...localCompletedBlocks})[`${step.id}_${block.id}`] && <svg width="8" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                            </span>
                                            教學完畢
                                          </button>
                                          )}{/* end enableCheck */}
                                        </div>
                                        <p className="text-[15px] text-gray-700 whitespace-pre-wrap select-text cursor-text text-center" style={{fontFamily:'system-ui,-apple-system,sans-serif', lineHeight:'2.4'}}>{String(block.description)}</p>
                                        {block.mediaUrl && (
                                          <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 flex justify-center">
                                            {(block.fileName && block.fileName.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) || block.mediaUrl.match(/\.(mp4|webm|ogg|mov|m4v)/i) ? (
                                              <video src={block.mediaUrl} controls className="max-h-64 w-full object-contain" />
                                            ) : (
                                              <img src={block.mediaUrl} onClick={() => setFullscreenImage(block.mediaUrl)} className="max-h-64 w-full object-contain cursor-pointer" alt="教材" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            if (isCurrent) {
                              return (
                                <div key={step.id} id={`step-${step.id}`} className="bg-white border-[3px] border-indigo-500 rounded-xl p-5 shadow-lg relative">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md animate-pulse">
                                      <BookOpen c="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-xl">{String(step.title)}</h3>
                                    <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full shadow-sm">目前進度</span>
                                  </div>
                                  
                                  {/* 純白底層內容區塊 */}
                                  <div className="space-y-5 mb-5 select-text">
                                    {getStepBlocks(step).map((block: any, bIndex: number) => (
                                      <div key={block.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                        <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-3 gap-2">
                                          {block.subtitle ? (
                                            <h4 className="font-bold text-lg flex-1" style={{color: '#1e3a5f', fontFamily: 'system-ui,-apple-system,sans-serif', whiteSpace:'pre-wrap'}}>{String(block.subtitle)}</h4>
                                          ) : (
                                            <h4 className="font-bold text-indigo-900 text-lg flex-1">內容區塊</h4>
                                          )}
                                          
                                          {/* --- 前台專用：教學完畢打勾儲存 --- */}
                                          {block.enableCheck !== false && (
                                          <button
                                            onClick={() => {
                                              const key = `${step.id}_${block.id}`;
                                              const base = currentUserData?.completedBlocks ? {...currentUserData.completedBlocks} : {};
                                              const merged = {...base, ...localCompletedBlocks};
                                              const current = merged[key] || false;
                                              const next = !current;
                                              const newBlocks = {...merged, [key]: next};
                                              setLocalCompletedBlocks(prev => ({...prev, [key]: next}));
                                              optEmpWrite(currentUserData.id, { completedBlocks: newBlocks }, doc(db, 'employees', currentUserData.id));
                                              showToast(next ? '已標記為教學完畢！' : '已取消標記！');
                                            }}
                                            style={{WebkitUserSelect:'none', userSelect:'none'}}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all shadow-sm cursor-pointer ${
                                              ({...( currentUserData?.completedBlocks || {}), ...localCompletedBlocks})[`${step.id}_${block.id}`]
                                                ? 'bg-green-50 border-green-300 text-green-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                                            }`}
                                          >
                                            <span style={{
                                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                              width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                                              backgroundColor: ({...( currentUserData?.completedBlocks || {}), ...localCompletedBlocks})[`${step.id}_${block.id}`] ? '#16a34a' : 'white',
                                              border: ({...( currentUserData?.completedBlocks || {}), ...localCompletedBlocks})[`${step.id}_${block.id}`] ? '2px solid #16a34a' : '2px solid #d1d5db',
                                              transition: 'all 0.2s',
                                            }}>
                                              {({...( currentUserData?.completedBlocks || {}), ...localCompletedBlocks})[`${step.id}_${block.id}`] && (
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                              )}
                                            </span>
                                            教學完畢
                                          </button>
                                          )}{/* end enableCheck */}
                                        </div>
                                        <p className="text-[15px] text-gray-700 whitespace-pre-wrap select-text cursor-text text-center" style={{fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '2.4', letterSpacing: '0.02em'}}>{String(block.description)}</p>
                                        
                                        {block.mediaUrl && (
                                          <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex justify-center shadow-inner">
                                            {(block.fileName && block.fileName.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) || block.mediaUrl.match(/\.(mp4|webm|ogg|mov|m4v)/i) ? (
                                              <video src={block.mediaUrl} controls className="max-h-64 w-full object-contain" />
                                            ) : ( 
                                              <img src={block.mediaUrl} onClick={() => setFullscreenImage(block.mediaUrl)} className="max-h-64 w-full object-contain cursor-pointer hover:scale-105 transition-transform duration-300" alt="教材" title="點擊放大" /> 
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  <div className="mt-5 pt-5 border-t border-gray-100 pb-24">
                                    <button onClick={() => {
                                        if (step.requireSignature) {
                                          setShowSignatureModal(step);
                                          setSignatureDataUrl('');
                                        } else {
                                          setTrainerModalStep(step);
                                          setSelectedTrainerStore(currentUserData?.store || '');
                                          setSelectedTrainerName('');
                                          setShowTrainerModal(true);
                                        }
                                      }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-base shadow-lg shadow-indigo-200 transition-all active:scale-95 flex justify-center items-center">
                                      <CheckCircle2 c="w-6 h-6 mr-2" />{step.requireSignature ? '✍️ 簽名並完成學習' : '完成學習，紀錄進度'}
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
          )}
          
          {/* TAB 3: 個人資料 / 人員名單 */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {pendingAccounts.length > 0 && canEdit && (
                <div onClick={() => setActiveTab('pending')} className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm flex justify-between items-center cursor-pointer transition-all active:scale-95">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2.5 rounded-lg text-white shadow-inner">
                      <UserIcon c="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-sm">待審核新進人員</h3>
                      <p className="text-[10px] text-blue-600 font-bold tracking-widest mt-0.5">有 {pendingAccounts.length} 筆註冊申請待處理</p>
                    </div>
                  </div>
                  <div className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">前往審核</div>
                </div>
              )}

              {canEdit && (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="font-bold mb-4 flex items-center text-gray-800"><Store c="w-4 h-4 mr-2 text-indigo-500" />門店類別設定</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {stores.map((s, index) => (
                      <div 
                        key={s.id} 
                        draggable
                        onDragStart={(e) => {
                          setDraggedStoreIndex(index);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/html", s.id);
                        }}
                        onDragEnter={() => setDragOverStoreIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={() => {
                          setDraggedStoreIndex(null);
                          setDragOverStoreIndex(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          if (draggedStoreIndex === null || draggedStoreIndex === index) return;
                          
                          const newStores = [...stores];
                          const draggedItem = newStores[draggedStoreIndex];
                          newStores.splice(draggedStoreIndex, 1);
                          newStores.splice(index, 0, draggedItem);
                          
                          setDraggedStoreIndex(null);
                          setDragOverStoreIndex(null);
                          
                          try {
                              for (let i = 0; i < newStores.length; i++) {
                                  if (stores[i].id !== newStores[i].id) {
                                      optStoreWrite(newStores[i].id,{order:i},doc(db,'stores',newStores[i].id));
                                  }
                              }
                          } catch (err) {
                              showToast('排序更新失敗');
                          }
                        }}
                        className={`bg-gray-50 text-gray-700 pl-2 pr-2 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 shadow-sm group cursor-grab active:cursor-grabbing transition-all select-none touch-none ${
                          draggedStoreIndex === index ? 'opacity-40 scale-95 border-indigo-400' : ''
                        } ${
                          dragOverStoreIndex === index && draggedStoreIndex !== index ? 'border-indigo-500 ring-2 ring-indigo-200 -translate-y-1' : 'border-gray-200'
                        }`}
                      >
                        <GripVertical c="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="mr-1">{String(s.name)}</span>
                        <button type="button" onClick={()=> { if(window.confirm('確定要刪除此門店嗎？')) deleteDoc(doc(db,'stores',s.id)) }} className="text-gray-400 hover:text-red-500 transition-colors ml-1" title="刪除"><XCircle c="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" id="ns" className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="新增門店..." />
                    <button type="button" onClick={async () => { const i = document.getElementById('ns'); if(i.value) { await addDoc(collection(db, 'stores'), { name: i.value, order: stores.length, createdAt: Date.now() }); i.value = ''; } }} className="bg-indigo-600 text-white px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700">新增</button>
                  </div>
                </div>
              )}

              {isProfileTabAdmin ? (
                <div className="bg-transparent">
                  {/* 後台專用：搜尋欄與門店風琴夾分類 */}
                  <div className="mb-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center">
                    <Search c="w-5 h-5 text-gray-400 mr-2" />
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      placeholder="搜尋姓名或門店..." 
                      className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-700" 
                    />
                  </div>
                  
                  <div className="flex overflow-x-auto pl-2 pt-2 -mb-[1px] hide-scrollbar z-10 relative">
                    {['all', ...stores.map(s => s.name)].map((storeName, i) => {
                      const isActive = activeStoreFilter === storeName;
                      const displayStoreName = storeName === 'all' ? '全部門店' : storeName;
                      return (
                        <div
                          key={storeName}
                          onClick={() => setActiveStoreFilter(storeName)}
                          className={`relative cursor-pointer px-4 sm:px-6 py-2.5 min-w-[80px] max-w-[120px] text-center rounded-t-xl -ml-2 border border-gray-200 transition-all select-none flex-shrink-0 ${
                            isActive
                              ? 'bg-white text-indigo-600 font-black border-b-white z-20 pt-3.5 -mt-1.5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
                              : 'bg-indigo-50/90 text-gray-500 font-bold hover:bg-indigo-100/90 shadow-inner inset-shadow'
                          }`}
                          style={{ zIndex: isActive ? 20 : stores.length + 1 - i }}
                        >
                          <span className="truncate block text-[13px]">{String(displayStoreName)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl rounded-tl-none shadow-sm relative z-10 p-5">
                    <h2 className="font-bold mb-4 flex items-center text-gray-800">
                      <UserIcon c="w-4 h-4 mr-2 text-indigo-500" />
                      人員名單 ({filteredDisplayEmployees.length})
                    </h2>
                    
                    <div className="space-y-4">
                       {filteredDisplayEmployees.map(emp => {
                         // 針對當前分類，計算總項目與已完成項目
                         const currentCatTotalSteps = learningSteps.filter(s => s.categoryId === currentActiveCatId || (!s.categoryId && currentActiveCatId === effectiveCategories[0]?.id)).length;
                         const currentCatCompletedSteps = (emp && typeof emp.completedLearning === 'object' && emp.completedLearning !== null) 
                            ? (emp.completedLearning[currentActiveCatId] || 0) 
                            : (currentActiveCatId === effectiveCategories[0]?.id ? (emp?.completedLearning || 0) : 0);
                         // 防呆，不超過總數
                         const displayCompleted = Math.min(currentCatCompletedSteps, currentCatTotalSteps);

                         return (
                           <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative flex flex-col">
                             
                             {/* 編輯模式表單 */}
                             {editingEmployeeId === emp.id ? (
                               <div className="flex flex-col space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-inner">
                                  <div>
                                    <label className="text-[10px] font-bold text-blue-600 mb-1 block">員工姓名</label>
                                    <input type="text" value={editEmployeeData.name} onChange={(e) => setEditEmployeeData({...editEmployeeData, name: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800" placeholder="修改姓名"/>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] font-bold text-blue-600 mb-1 block">所屬門店</label>
                                      <select value={editEmployeeData.store} onChange={(e) => setEditEmployeeData({...editEmployeeData, store: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        {stores.map(store => <option key={store.id} value={store.name}>{String(store.name)}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-bold text-blue-600 mb-1 block">職位權限</label>
                                      <select value={editEmployeeData.role} onChange={(e) => setEditEmployeeData({...editEmployeeData, role: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        {jobRoles.map(role => <option key={role} value={role}>{String(role)}</option>)}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] font-bold text-blue-600 mb-1 block">出生年月日</label>
                                      <input type="date" value={editEmployeeData.birthdate || ''} onChange={(e) => setEditEmployeeData({...editEmployeeData, birthdate: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"/>
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-bold text-blue-600 mb-1 block">到職日</label>
                                      <input type="date" value={editEmployeeData.hireDate || ''} onChange={(e) => setEditEmployeeData({...editEmployeeData, hireDate: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"/>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] font-bold text-blue-600 mb-1 block">聯絡電話</label>
                                      <input type="tel" value={editEmployeeData.phone || ''} onChange={(e) => setEditEmployeeData({...editEmployeeData, phone: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="09XX"/>
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-bold text-blue-600 mb-1 block">人格特質</label>
                                      <select value={editEmployeeData.mbti || ''} onChange={(e) => setEditEmployeeData({...editEmployeeData, mbti: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        <option value="">請選擇...</option>
                                        {['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'].map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                  
                                  {/* 大頭貼選擇 (Emoji 代替圖片上傳) */}
                                  <div>
                                    <label className="text-[10px] font-bold text-blue-600 mb-1 block">選擇頭貼</label>
                                    <div className="grid grid-cols-4 gap-2 bg-white p-2 rounded-lg border border-blue-200">
                                      {defaultAvatars.map(avatar => (
                                        <button 
                                          key={avatar}
                                          type="button"
                                          onClick={() => setEditEmployeeData({...editEmployeeData, avatarUrl: avatar})}
                                          className={`text-2xl p-1 rounded-lg transition-transform ${editEmployeeData.avatarUrl === avatar ? 'bg-blue-100 scale-110' : 'hover:bg-gray-100'}`}
                                        >
                                          {avatar}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-blue-600 mb-1 block">登入密碼 (6碼)</label>
                                    <input 
                                      type="text" 
                                      maxLength={6} 
                                      value={editEmployeeData.password} 
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, ''); 
                                        if(val.length <= 6) setEditEmployeeData({...editEmployeeData, password: val});
                                      }} 
                                      className="w-full p-2.5 border border-blue-200 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800 tracking-widest" 
                                      placeholder="請輸入6碼數字新密碼"
                                    />
                                  </div>
                                  <div className="flex space-x-3 mt-2 pt-2 border-t border-blue-200">
                                    <button onClick={() => setEditingEmployeeId(null)} className="flex-1 py-2.5 bg-white text-gray-500 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">取消</button>
                                    <button onClick={() => saveEditEmployee(emp.id)} className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">儲存</button>
                                  </div>
                               </div>
                             ) : (
                               /* 一般顯示模式 (前後台佈局統一) */
                               <>
                                 <div className="flex justify-between items-start mb-5">
                                   <div className="flex items-center space-x-4">
                                     <div className="relative">
                                       <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-indigo-50 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center text-4xl">
                                         {emp.avatarUrl ? (
                                           (typeof emp.avatarUrl === 'string' && emp.avatarUrl.startsWith('http')) ? <img src={emp.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-4xl">{emp.avatarUrl}</span>
                                         ) : <UserIcon c="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />}
                                       </div>
                                     </div>
                                     <div>
                                       <h3 className="font-black text-gray-800 text-xl sm:text-2xl tracking-wide mb-1">{String(emp.name)}</h3>
                                       <span className="text-xs text-gray-500 font-bold">{String(emp.store)}</span>
                                     </div>
                                   </div>
                                   
                                   {/* 後台專屬：保留編輯及刪除按鈕 */}
                                   {canEdit && (
                                     <div className="flex items-center space-x-1 mt-2">
                                       <button onClick={() => startEditEmployee(emp)} className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-gray-100 rounded transition-colors" title="編輯人員"><Edit c="w-4 h-4" /></button>
                                       <button onClick={async () => await deleteDoc(doc(db, 'employees', emp.id))} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors" title="刪除人員"><Trash2 c="w-4 h-4" /></button>
                                     </div>
                                   )}
                                 </div>

                                 {/* 實色等級卡片 */}
                                 <div className={getRoleCardStyle(emp.role)}>
                                   <div className="absolute inset-0 bg-white/10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIvPjwvc3ZnPg==')] z-0 pointer-events-none"></div>
                                   <div className="flex justify-between items-end relative z-10">
                                      <div>
                                        <p className="text-[11px] font-bold text-white/80 mb-1 tracking-widest">目前等級</p>
                                        <p className="text-3xl font-black drop-shadow-md">{getLevelDisplay(emp.completedLearning || 0)}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[11px] font-bold text-white/80 mb-1 tracking-widest">所屬職位</p>
                                        <p className="text-xl font-bold drop-shadow-md">{String(emp.role)}</p>
                                      </div>
                                   </div>
                                 </div>

                                 {/* --- 考試成就解鎖進度條 --- */}
                                 <div className="bg-white rounded-xl border border-gray-100 p-4 z-10 shadow-sm mt-2 mb-2">
                                     <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm text-gray-800 font-bold flex items-center">
                                          <Award c="w-4 h-4 mr-1.5 text-blue-500" />考試成就解鎖
                                        </p>
                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                          已解鎖 {effectiveCategories.filter(cat => {
                                            const cs = learningSteps.filter(s => s.categoryId === cat.id || (!s.categoryId && cat.id === effectiveCategories[0]?.id));
                                            const cc = (emp && typeof emp.completedLearning === 'object' && emp.completedLearning !== null) ? (emp.completedLearning[cat.id] || 0) : (cat.id === effectiveCategories[0]?.id ? (emp?.completedLearning || 0) : 0);
                                            return cs.length > 0 && cc >= cs.length;
                                          }).length} / {effectiveCategories.length}
                                        </span>
                                     </div>

                                     {/* 動態進度條橫向顯示 (分類鎖頭風格) */}
                                     <div className="bg-gray-100 rounded-2xl p-4 overflow-x-auto hide-scrollbar">
                                       <div className="flex items-center justify-start min-w-max mx-auto px-2">
                                         {effectiveCategories.length === 0 ? (
                                             <p className="text-xs text-gray-400 w-full text-center py-2">尚無學習分類</p>
                                         ) : (
                                             effectiveCategories.map((cat, catIndex) => {
                                               const catSteps = learningSteps.filter(s => s.categoryId === cat.id || (!s.categoryId && cat.id === effectiveCategories[0]?.id));
                                               const catTotalSteps = catSteps.length;
                                               const catCompleted = (emp && typeof emp.completedLearning === 'object' && emp.completedLearning !== null)
                                                 ? (emp.completedLearning[cat.id] || 0)
                                                 : (cat.id === effectiveCategories[0]?.id ? (emp?.completedLearning || 0) : 0);
                                               const isCatPassed = catTotalSteps > 0 && catCompleted >= catTotalSteps;
                                               const isNextPassed = (() => {
                                                 if (catIndex + 1 >= effectiveCategories.length) return false;
                                                 const nextCat = effectiveCategories[catIndex + 1];
                                                 const nextSteps = learningSteps.filter(s => s.categoryId === nextCat.id || (!s.categoryId && nextCat.id === effectiveCategories[0]?.id));
                                                 const nextCompleted = (emp && typeof emp.completedLearning === 'object' && emp.completedLearning !== null)
                                                   ? (emp.completedLearning[nextCat.id] || 0)
                                                   : 0;
                                                 return nextSteps.length > 0 && nextCompleted >= nextSteps.length;
                                               })();
                                               return (
                                                 <React.Fragment key={cat.id}>
                                                   <div className="flex flex-col items-center" style={{minWidth: '72px'}}>
                                                     <div className={`w-[54px] h-[54px] rounded-full flex items-center justify-center z-10 transition-all ${isCatPassed ? 'bg-white border-[3px] border-blue-500 text-blue-500 shadow-md' : 'bg-gray-200 text-gray-400'}`}>
                                                       {isCatPassed ? <CheckCircle2 c="w-6 h-6" /> : <Lock c="w-5 h-5" />}
                                                     </div>
                                                     <span className={`text-[10px] mt-2 font-bold text-center leading-tight px-1 max-w-[72px] truncate ${isCatPassed ? 'text-blue-600' : 'text-gray-400'}`}>
                                                       {String(cat.name)}
                                                     </span>
                                                   </div>
                                                   {catIndex < effectiveCategories.length - 1 && (
                                                     <div className={`h-[3px] w-8 mx-1 shrink-0 rounded-full self-start mt-[27px] transition-colors ${isCatPassed && isNextPassed ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                                                   )}
                                                 </React.Fragment>
                                               );
                                             })
                                         )}
                                       </div>
                                     </div>
                                 </div>

                                 {/* --- 學習通過紀錄卡片 --- */}
                                 <div className="bg-white rounded-xl border border-gray-100 p-3 z-10 shadow-sm mt-2 mb-2">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100/60">
                                       <p className="text-xs text-gray-700 font-bold flex items-center">
                                         <BookOpen c="w-3.5 h-3.5 mr-1.5 text-indigo-500" />學習通過紀錄
                                       </p>
                                       <p className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded">共 {emp.learningHistory?.length || 0} 項</p>
                                    </div>
                                    {emp.learningHistory && Array.isArray(emp.learningHistory) && emp.learningHistory.length > 0 ? (
                                      <div className="space-y-2 mt-2">
                                        {emp.learningHistory.map((h: any, i: number) => {
                                          // 找出這筆紀錄的分類名稱
                                          const histStep = learningSteps.find((s:any) => s.id === h.stepId);
                                          const histCatId = h.categoryId || histStep?.categoryId;
                                          const histCat = allCats.find((c:any) => c.id === histCatId);
                                          const histParent = histCat?.parentId ? allCats.find((c:any) => c.id === histCat.parentId) : null;
                                          const catLabel = histParent ? `${histParent.name} › ${histCat?.name}` : (histCat?.name || '');
                                          return (
                                          <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex justify-between items-center group">
                                            <div className="flex flex-col w-full">
                                              {catLabel && (
                                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full self-start mb-1">{catLabel}</span>
                                              )}
                                              <span className="text-xs font-bold text-gray-800">{String(h.stepName)}</span>
                                              {/* 簽名縮圖 */}
                                              {h.signatureUrl && (
                                                <div className="mt-2 mb-1">
                                                  <p className="text-[9px] text-gray-400 mb-1">✍️ 本人簽名</p>
                                                  <img src={h.signatureUrl} alt="簽名" className="h-12 border border-gray-200 rounded bg-white object-contain" onClick={() => setFullscreenImage(h.signatureUrl)} style={{cursor:'pointer'}} title="點擊放大" />
                                                </div>
                                              )}
                                              <div className="flex items-center mt-2 justify-between">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[9px] text-gray-400">{h.approvedAt ? new Date(h.approvedAt).toLocaleDateString() : ''} 完成</span>
                                                  
                                                  {/* 後台可編輯教學人員，前台僅顯示 */}
                                                  {canEdit ? (
                                                    <div className="flex items-center text-[10px] text-red-500 font-bold">
                                                      <UserIcon c="w-3 h-3 mr-0.5" />教學:
                                                      <select 
                                                        value={h.trainerName || ''} 
                                                        onChange={(e) => updateLearningRecordTrainer(emp, i, e.target.value)}
                                                        className="ml-1 bg-transparent border-b border-red-200 outline-none focus:border-red-500 py-0.5 text-red-600"
                                                      >
                                                        <option value="無">無</option>
                                                        {employees.map(e => e.name ? <option key={e.id} value={e.name}>{String(e.name)}</option> : null)}
                                                      </select>
                                                    </div>
                                                  ) : (
                                                    h.trainerName && h.trainerName !== '無' && (
                                                      <span className="text-[10px] text-red-500 font-bold flex items-center">
                                                        <UserIcon c="w-3 h-3 mr-0.5" />教學: {String(h.trainerName)}
                                                      </span>
                                                    )
                                                  )}
                                                </div>
                                                
                                                {canEdit && (
                                                  <button onClick={() => handleDeleteLearningRecord(emp, i)} className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors" title="刪除紀錄，重新學習">
                                                    <Trash2 c="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                             </div>
                                          </div>
                                        );})}
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-xs text-gray-400 font-bold bg-gray-50/50 rounded-lg border border-gray-100/50 border-dashed">
                                        尚未有通過的學習項目
                                      </div>
                                    )}
                                 </div>
                               </>
                             )}
                           </div>
                         );
                       })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-transparent">
                   <h2 className="font-bold mb-4 flex items-center text-gray-800 px-2">
                     <UserIcon c="w-4 h-4 mr-2 text-indigo-500" />
                     {customTitles.profileTab}
                   </h2>
                   <div className="space-y-4">
                      {filteredDisplayEmployees.map(emp => {
                        // 針對當前分類，計算總項目與已完成項目
                        const currentCatTotalSteps = learningSteps.filter(s => s.categoryId === currentActiveCatId || (!s.categoryId && currentActiveCatId === effectiveCategories[0]?.id)).length;
                        const currentCatCompletedSteps = (emp && typeof emp.completedLearning === 'object' && emp.completedLearning !== null) 
                           ? (emp.completedLearning[currentActiveCatId] || 0) 
                           : (currentActiveCatId === effectiveCategories[0]?.id ? (emp?.completedLearning || 0) : 0);
                        // 防呆，不超過總數
                        const displayCompleted = Math.min(currentCatCompletedSteps, currentCatTotalSteps);

                        return (
                          <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative flex flex-col">
                            {/* 編輯模式表單 */}
                            {editingEmployeeId === emp.id ? (
                              <div className="flex flex-col space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-inner">
                                 <div>
                                   <label className="text-[10px] font-bold text-blue-600 mb-1 block">員工姓名</label>
                                   <input type="text" value={editEmployeeData.name} onChange={(e) => setEditEmployeeData({...editEmployeeData, name: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800" placeholder="修改姓名"/>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                   <div>
                                     <label className="text-[10px] font-bold text-blue-600 mb-1 block">所屬門店</label>
                                     <select value={editEmployeeData.store} onChange={(e) => setEditEmployeeData({...editEmployeeData, store: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                       {stores.map(store => <option key={store.id} value={store.name}>{String(store.name)}</option>)}
                                     </select>
                                   </div>
                                   <div>
                                     <label className="text-[10px] font-bold text-blue-600 mb-1 block">職位權限</label>
                                     <select value={editEmployeeData.role} onChange={(e) => setEditEmployeeData({...editEmployeeData, role: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                       {jobRoles.map(role => <option key={role} value={role}>{String(role)}</option>)}
                                     </select>
                                   </div>
                                 </div>
                                 
                                 {/* 大頭貼選擇 (Emoji 代替圖片上傳) */}
                                 <div>
                                   <label className="text-[10px] font-bold text-blue-600 mb-1 block">選擇頭貼</label>
                                   <div className="grid grid-cols-4 gap-2 bg-white p-2 rounded-lg border border-blue-200">
                                     {defaultAvatars.map(avatar => (
                                       <button 
                                         key={avatar}
                                         type="button" 
                                         onClick={() => setEditEmployeeData({...editEmployeeData, avatarUrl: avatar})}
                                         className={`text-2xl p-1 rounded-lg transition-transform ${editEmployeeData.avatarUrl === avatar ? 'bg-blue-100 scale-110' : 'hover:bg-gray-100'}`}
                                       >
                                         {avatar}
                                       </button>
                                     ))}
                                   </div>
                                 </div>

                                 <div>
                                   <label className="text-[10px] font-bold text-blue-600 mb-1 block">登入密碼 (6碼)</label>
                                   <input 
                                     type="text" 
                                     maxLength={6} 
                                     value={editEmployeeData.password} 
                                     onChange={(e) => {
                                       const val = e.target.value.replace(/\D/g, ''); 
                                       if(val.length <= 6) setEditEmployeeData({...editEmployeeData, password: val});
                                     }} 
                                     className="w-full p-2.5 border border-blue-200 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800 tracking-widest" 
                                     placeholder="請輸入6碼數字新密碼"
                                   />
                                 </div>
                                 <div className="flex space-x-3 mt-2 pt-2 border-t border-blue-200">
                                   <button onClick={() => setEditingEmployeeId(null)} className="flex-1 py-2.5 bg-white text-gray-500 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">取消</button>
                                   <button onClick={() => saveEditEmployee(emp.id)} className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">儲存</button>
                                 </div>
                              </div>
                            ) : (
                              /* 一般顯示模式 (前後台佈局統一) */
                              <>
                                <div className="flex justify-between items-start mb-5">
                                  <div className="flex items-center space-x-4">
                                    <div className="relative">
                                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-indigo-50 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center text-4xl">
                                        {emp.avatarUrl ? (
                                          (typeof emp.avatarUrl === 'string' && emp.avatarUrl.startsWith('http')) ? <img src={emp.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-4xl">{emp.avatarUrl}</span>
                                        ) : <UserIcon c="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />}
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className="font-black text-gray-800 text-xl sm:text-2xl tracking-wide mb-1">{String(emp.name)}</h3>
                                      <span className="text-xs text-gray-500 font-bold">{String(emp.store)}</span>
                                    </div>
                                  </div>
                                  
                                  {/* 後台專屬：保留編輯及刪除按鈕 */}
                                  {canEdit && (
                                    <div className="flex items-center space-x-1 mt-2">
                                      <button onClick={() => startEditEmployee(emp)} className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-gray-100 rounded transition-colors" title="編輯人員"><Edit c="w-4 h-4" /></button>
                                      <button onClick={async () => await deleteDoc(doc(db, 'employees', emp.id))} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors" title="刪除人員"><Trash2 c="w-4 h-4" /></button>
                                    </div>
                                  )}
                                </div>

                                {/* 實色等級卡片 */}
                                <div className={getRoleCardStyle(emp.role)}>
                                  <div className="absolute inset-0 bg-white/10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIvPjwvc3ZnPg==')] z-0 pointer-events-none"></div>
                                  <div className="flex justify-between items-end relative z-10">
                                     <div>
                                       <p className="text-[11px] font-bold text-white/80 mb-1 tracking-widest">目前等級</p>
                                       <p className="text-3xl font-black drop-shadow-md">{getLevelDisplay(emp.completedLearning || 0)}</p>
                                     </div>
                                     <div className="text-right">
                                       <p className="text-[11px] font-bold text-white/80 mb-1 tracking-widest">所屬職位</p>
                                       <p className="text-xl font-bold drop-shadow-md">{String(emp.role)}</p>
                                     </div>
                                  </div>
                                </div>

                                {/* --- 考試成就解鎖進度條 --- */}
                                <div className="bg-white rounded-xl border border-gray-100 p-4 z-10 shadow-sm mt-2 mb-2">
                                    <div className="flex justify-between items-center mb-3">
                                       <p className="text-sm text-gray-800 font-bold flex items-center">
                                         <Award c="w-4 h-4 mr-1.5 text-blue-500" />考試成就解鎖
                                       </p>
                                       <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                         已解鎖 {effectiveCategories.filter(cat => {
                                           const cs = learningSteps.filter(s => s.categoryId === cat.id || (!s.categoryId && cat.id === effectiveCategories[0]?.id));
                                           const cc = (emp && typeof emp.completedLearning === 'object' && emp.completedLearning !== null) ? (emp.completedLearning[cat.id] || 0) : (cat.id === effectiveCategories[0]?.id ? (emp?.completedLearning || 0) : 0);
                                           return cs.length > 0 && cc >= cs.length;
                                         }).length} / {effectiveCategories.length}
                                       </span>
                                    </div>

                                    {/* 動態進度條橫向顯示 (分類鎖頭風格) */}
                                    <div className="bg-gray-100 rounded-2xl p-4 overflow-x-auto hide-scrollbar">
                                      <div className="flex items-center justify-start min-w-max mx-auto px-2">
                                        {effectiveCategories.length === 0 ? (
                                            <p className="text-xs text-gray-400 w-full text-center py-2">尚無學習分類</p>
                                        ) : (
                                            effectiveCategories.map((cat, catIndex) => {
                                              const catSteps = learningSteps.filter(s => s.categoryId === cat.id || (!s.categoryId && cat.id === effectiveCategories[0]?.id));
                                              const catTotalSteps = catSteps.length;
                                              const catCompleted = (emp && typeof emp.completedLearning === 'object' && emp.completedLearning !== null)
                                                ? (emp.completedLearning[cat.id] || 0)
                                                : (cat.id === effectiveCategories[0]?.id ? (emp?.completedLearning || 0) : 0);
                                              const isCatPassed = catTotalSteps > 0 && catCompleted >= catTotalSteps;
                                              const isNextPassed = (() => {
                                                if (catIndex + 1 >= effectiveCategories.length) return false;
                                                const nextCat = effectiveCategories[catIndex + 1];
                                                const nextSteps = learningSteps.filter(s => s.categoryId === nextCat.id || (!s.categoryId && nextCat.id === effectiveCategories[0]?.id));
                                                const nextCompleted = (emp && typeof emp.completedLearning === 'object' && emp.completedLearning !== null)
                                                  ? (emp.completedLearning[nextCat.id] || 0)
                                                  : 0;
                                                return nextSteps.length > 0 && nextCompleted >= nextSteps.length;
                                              })();
                                              return (
                                                <React.Fragment key={cat.id}>
                                                  <div className="flex flex-col items-center" style={{minWidth: '72px'}}>
                                                    <div className={`w-[54px] h-[54px] rounded-full flex items-center justify-center z-10 transition-all ${isCatPassed ? 'bg-white border-[3px] border-blue-500 text-blue-500 shadow-md' : 'bg-gray-200 text-gray-400'}`}>
                                                      {isCatPassed ? <CheckCircle2 c="w-6 h-6" /> : <Lock c="w-5 h-5" />}
                                                    </div>
                                                    <span className={`text-[10px] mt-2 font-bold text-center leading-tight px-1 max-w-[72px] truncate ${isCatPassed ? 'text-blue-600' : 'text-gray-400'}`}>
                                                      {String(cat.name)}
                                                    </span>
                                                  </div>
                                                  {catIndex < effectiveCategories.length - 1 && (
                                                    <div className={`h-[3px] w-8 mx-1 shrink-0 rounded-full self-start mt-[27px] transition-colors ${isCatPassed && isNextPassed ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                                                  )}
                                                </React.Fragment>
                                              );
                                            })
                                        )}
                                      </div>
                                    </div>
                                </div>

                                {/* --- 學習通過紀錄卡片 --- */}
                                <div className="bg-white rounded-xl border border-gray-100 p-3 z-10 shadow-sm mt-2 mb-2">
                                   <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100/60">
                                      <p className="text-xs text-gray-700 font-bold flex items-center">
                                        <BookOpen c="w-3.5 h-3.5 mr-1.5 text-indigo-500" />學習通過紀錄
                                      </p>
                                      <p className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded">共 {emp.learningHistory?.length || 0} 項</p>
                                   </div>
                                   {emp.learningHistory && Array.isArray(emp.learningHistory) && emp.learningHistory.length > 0 ? (
                                     <div className="space-y-2 mt-2">
                                       {emp.learningHistory.map((h: any, i: number) => {
                                         const histStep = learningSteps.find((s:any) => s.id === h.stepId);
                                         const histCatId = h.categoryId || histStep?.categoryId;
                                         const histCat = allCats.find((c:any) => c.id === histCatId);
                                         const histParent = histCat?.parentId ? allCats.find((c:any) => c.id === histCat.parentId) : null;
                                         const catLabel = histParent ? `${histParent.name} › ${histCat?.name}` : (histCat?.name || '');
                                         return (
                                         <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex justify-between items-center group">
                                           <div className="flex flex-col w-full">
                                             {catLabel && (
                                               <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full self-start mb-1">{catLabel}</span>
                                             )}
                                             <span className="text-xs font-bold text-gray-800">{String(h.stepName)}</span>
                                             {h.signatureUrl && (
                                               <div className="mt-2 mb-1">
                                                 <p className="text-[9px] text-gray-400 mb-1">✍️ 本人簽名</p>
                                                 <img src={h.signatureUrl} alt="簽名" className="h-12 border border-gray-200 rounded bg-white object-contain" onClick={() => setFullscreenImage(h.signatureUrl)} style={{cursor:'pointer'}} title="點擊放大" />
                                               </div>
                                             )}
                                             <div className="flex items-center mt-2 justify-between">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[9px] text-gray-400">{h.approvedAt ? new Date(h.approvedAt).toLocaleDateString() : ''} 完成</span>
                                                  
                                                  {/* 後台可編輯教學人員，前台僅顯示 */}
                                                  {canEdit ? (
                                                    <div className="flex items-center text-[10px] text-red-500 font-bold">
                                                      <UserIcon c="w-3 h-3 mr-0.5" />教學:
                                                      <select 
                                                        value={h.trainerName || ''} 
                                                        onChange={(e) => updateLearningRecordTrainer(emp, i, e.target.value)}
                                                        className="ml-1 bg-transparent border-b border-red-200 outline-none focus:border-red-500 py-0.5 text-red-600"
                                                      >
                                                        <option value="無">無</option>
                                                        {employees.map(e => e.name ? <option key={e.id} value={e.name}>{String(e.name)}</option> : null)}
                                                      </select>
                                                    </div>
                                                  ) : (
                                                    h.trainerName && h.trainerName !== '無' && (
                                                      <span className="text-[10px] text-red-500 font-bold flex items-center">
                                                        <UserIcon c="w-3 h-3 mr-0.5" />教學: {String(h.trainerName)}
                                                      </span>
                                                    )
                                                  )}
                                                </div>
                                                
                                                {canEdit && (
                                                  <button onClick={() => handleDeleteLearningRecord(emp, i)} className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors" title="刪除紀錄，重新學習">
                                                    <Trash2 c="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                         </div>
                                       );})}
                                     </div>
                                   ) : (
                                     <div className="text-center py-4 text-xs text-gray-400 font-bold bg-gray-50/50 rounded-lg border border-gray-100/50 border-dashed">
                                       尚未有通過的學習項目
                                     </div>
                                   )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                   </div>
                </div>
              )}
            </div>
          )}
        </main>

        <nav className="bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-30 shrink-0 sticky bottom-0">
          <button onClick={() => setActiveTab('learning')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'learning' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <BookOpen c={`w-5 h-5 ${activeTab === 'learning' ? 'fill-indigo-50' : ''}`} /><span className="text-[10px] font-bold">{customTitles.learningTab}</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'profile' || activeTab === 'pending' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <UserIcon c={`w-5 h-5 ${activeTab === 'profile' || activeTab === 'pending' ? 'fill-indigo-50' : ''}`} /><span className="text-[10px] font-bold">{isProfileTabAdmin ? '人員門店' : customTitles.profileTab}</span>
          </button>
        </nav>
      </div>

      {/* 系統通知中心彈出視窗 */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowNotificationModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-black text-lg flex items-center"><Bell c="w-5 h-5 mr-2 animate-pulse" /> 系統通知中心</h3>
              <button onClick={() => setShowNotificationModal(false)} className="text-indigo-200 hover:text-white transition-colors"><XCircle c="w-6 h-6" /></button>
            </div>
            <div className="p-5 space-y-4">
              {totalAdminNotifications === 0 ? (
                <div className="text-center py-6 text-gray-400 font-bold flex flex-col items-center">
                  <CheckCircle2 c="w-10 h-10 mb-2 text-green-400" />
                  太棒了，目前沒有待處理的事項！
                </div>
              ) : (
                <>
                  {pendingAccounts.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[10px] font-bold text-blue-500 tracking-wider mb-1">帳號申請</p>
                        <p className="text-sm font-bold text-blue-900">有 <span className="text-red-500 text-base mx-1">{pendingAccounts.length}</span> 位新進人員待核准</p>
                      </div>
                      <button onClick={() => { setShowNotificationModal(false); setActiveTab('pending'); }} className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all">前往審核</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 圖片滿版放大彈出視窗 */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/40 rounded-full p-1.5 transition-colors" onClick={() => setFullscreenImage(null)}>
            <XCircle c="w-8 h-8" />
          </button>
          <img src={fullscreenImage} className="max-w-full max-h-[90vh] object-contain animate-in zoom-in-95 duration-300 shadow-2xl" alt="放大圖片" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* 選擇教學人員 Modal */}
      {showTrainerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowTrainerModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-black text-lg flex items-center"><UserIcon c="w-5 h-5 mr-2" /> 選擇教學人員</h3>
              <button onClick={() => setShowTrainerModal(false)} className="text-indigo-200 hover:text-white transition-colors"><XCircle c="w-6 h-6" /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm font-bold text-gray-800">完成項目：<span className="text-indigo-600">{trainerModalStep?.title}</span></p>
                <p className="text-xs text-gray-500 mt-1">請選擇負責帶領您的教學人員</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase ml-1 mb-1">所屬門店</label>
                <div className="relative">
                  <select 
                    value={selectedTrainerStore} 
                    onChange={e => {
                      setSelectedTrainerStore(e.target.value);
                      setSelectedTrainerName(''); // 更換門店時清空人員
                    }} 
                    className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 appearance-none text-sm"
                  >
                    <option value="" disabled>請選擇門店...</option>
                    {stores.map(s => <option key={s.id} value={s.name}>{String(s.name)}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                    <ChevronLeft c="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase ml-1 mb-1">教學人員</label>
                <div className="relative">
                  <select 
                    value={selectedTrainerName} 
                    onChange={e => setSelectedTrainerName(e.target.value)} 
                    disabled={!selectedTrainerStore}
                    className={`w-full p-3 border rounded-xl font-bold outline-none appearance-none text-sm transition-colors ${!selectedTrainerStore ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-indigo-500'}`}
                  >
                    <option value="" disabled>請選擇人員...</option>
                    {employees.filter(emp => emp.store === selectedTrainerStore).map(emp => (
                      <option key={emp.id} value={emp.name}>{String(emp.name)} - {String(emp.role)}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                    <ChevronLeft c="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button onClick={() => setShowTrainerModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">取消</button>
                <button 
                  onClick={submitLearningRequest} 
                  disabled={!selectedTrainerName}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center ${!selectedTrainerName ? 'bg-indigo-300 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 active:scale-95'}`}
                >
                  <CheckCircle2 c="w-4 h-4 mr-1.5" />儲存紀錄
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 手寫簽名 Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-black text-lg">✍️ 請簽名確認</h3>
              <button onClick={() => setShowSignatureModal(null)} className="text-indigo-200 hover:text-white"><XCircle c="w-6 h-6" /></button>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-3 font-bold text-center">請在下方空白處以手指簽名，確認已完成「{showSignatureModal?.title}」學習</p>
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 relative" style={{touchAction:'none'}}>
                <canvas
                  id="signature-canvas"
                  width={340}
                  height={180}
                  className="w-full block"
                  style={{touchAction:'none', cursor:'crosshair'}}
                  onPointerDown={e => {
                    setIsDrawing(true);
                    const canvas = e.currentTarget;
                    const ctx = canvas.getContext('2d')!;
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    ctx.beginPath();
                    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                    ctx.strokeStyle = '#1e3a5f';
                    ctx.lineWidth = 2.5;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={e => {
                    if (!isDrawing) return;
                    const canvas = e.currentTarget;
                    const ctx = canvas.getContext('2d')!;
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                    ctx.stroke();
                  }}
                  onPointerUp={e => {
                    setIsDrawing(false);
                    const canvas = e.currentTarget;
                    setSignatureDataUrl(canvas.toDataURL());
                  }}
                />
                <p className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm font-bold pointer-events-none" style={{display: signatureDataUrl ? 'none' : 'flex'}}>在此簽名</p>
              </div>
              <button onClick={() => {
                const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
                if (canvas) { const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, canvas.width, canvas.height); }
                setSignatureDataUrl('');
              }} className="mt-2 text-xs text-red-400 hover:text-red-600 font-bold w-full text-center">清除重簽</button>
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <button onClick={() => setShowSignatureModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">取消</button>
              <button
                disabled={!signatureDataUrl}
                onClick={() => {
                  const step = showSignatureModal;
                  setShowSignatureModal(null);
                  setTrainerModalStep(step);
                  setSelectedTrainerStore(currentUserData?.store || '');
                  setSelectedTrainerName('');
                  setShowTrainerModal(true);
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${signatureDataUrl ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >確認簽名</button>
            </div>
          </div>
        </div>
      )}

      {/* 分類密碼解鎖 Modal */}
      {showCatLockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={() => setShowCatLockModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl">🔒</div>
              <h3 className="font-black text-gray-800 text-lg">分類已鎖定</h3>
              <p className="text-xs text-gray-400 mt-1">「{allCats.find((c:any) => c.id === showCatLockModal)?.name}」需要密碼才能查看</p>
            </div>
            <input
              type="password"
              autoFocus
              value={catLockInput}
              onChange={e => setCatLockInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (catLockInput === categoryPasswords[showCatLockModal]) {
                    setUnlockedCategories(prev => new Set([...prev, showCatLockModal]));
                    setActiveCategoryId(showCatLockModal);
                    document.getElementById('app-scroll-container')?.scrollTo({top: 0, behavior: 'smooth'});
                    setShowCatLockModal(null);
                    setCatLockInput('');
                  } else {
                    showToast('密碼錯誤！');
                    setCatLockInput('');
                  }
                }
              }}
              inputMode="numeric"
              placeholder="請輸入密碼"
              className="w-full p-3 border border-gray-200 rounded-xl text-center tracking-widest outline-none focus:border-indigo-500 font-bold mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowCatLockModal(null); setCatLockInput(''); }} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500 text-sm">取消</button>
              <button onClick={() => {
                if (catLockInput === categoryPasswords[showCatLockModal!]) {
                  setUnlockedCategories(prev => new Set([...prev, showCatLockModal!]));
                  setActiveCategoryId(showCatLockModal!);
                  document.getElementById('app-scroll-container')?.scrollTo({top: 0, behavior: 'smooth'});
                  setShowCatLockModal(null);
                  setCatLockInput('');
                } else {
                  showToast('密碼錯誤！');
                  setCatLockInput('');
                }
              }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">解鎖</button>
            </div>
          </div>
        </div>
      )}

      {/* 返回頂部按鈕 */}
      <button
        onClick={() => document.getElementById('app-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{WebkitUserSelect:'none', userSelect:'none'}}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-400 hover:bg-blue-500 text-white rounded-2xl shadow-lg flex items-center justify-center z-40 transition-all active:scale-95"
        title="回到頂部"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>
        </svg>
      </button>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-2.5 rounded-lg z-[100] text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {String(toast)}
        </div>
      )}
    </div>
  );
}
