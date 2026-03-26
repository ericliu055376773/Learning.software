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

// === 圖示組件 ===
const I = ({ children, c = "", onClick }) => <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>{children}</svg>;
const BookOpen = ({ c }) => <I c={c}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></I>;
const ListTodo = ({ c }) => <I c={c}><path d="M14 14h6"/><path d="M14 19h6"/><path d="M14 9h6"/><path d="M4 14h.01"/><path d="M4 19h.01"/><path d="M4 9h.01"/></I>;
const User = ({ c }) => <I c={c}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></I>;
const Trash2 = ({ c }) => <I c={c}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></I>;
const PlusCircle = ({ c }) => <I c={c}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></I>;
const UploadCloud = ({ c }) => <I c={c}><polyline points="16 16 12 12 8 16"/><line x1="12" x2="12" y1="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></I>;
const ShieldCheck = ({ c }) => <I c={c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></I>;
const Store = ({ c }) => <I c={c}><path d="m2 7 4.38-5.46a2 2 0 0 1 1.56-.78h8.12a2 2 0 0 1 1.56.78L22 7"/><path d="M2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6"/><path d="M2 7h20"/></I>;
const XCircle = ({ c }) => <I c={c}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></I>;
const CheckCircle2 = ({ c }) => <I c={c}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></I>;
const Bell = ({ c }) => <I c={c}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></I>;
const LogOut = ({ c }) => <I c={c}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></I>;
const Edit = ({ c }) => <I c={c}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></I>;
const SproutLeaf = ({ c }) => <I c={c}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></I>;
const ChevronLeft = ({ c }) => <I c={c}><polyline points="15 18 9 12 15 6"/></I>;
const Lock = ({ c }) => <I c={c}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></I>;
const Settings = ({ c }) => <I c={c}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></I>;
const Camera = ({ c }) => <I c={c}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></I>;
const FolderPlus = ({ c }) => <I c={c}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></I>;

const customStyles = `
  .badge-solid-rainbow { background: linear-gradient(90deg, #ef4444, #eab308, #3b82f6, #a855f7, #ef4444); color: white; }
  .badge-solid-gold { background-color: #eab308; color: white; }
  .badge-solid-silver { background-color: #94a3b8; color: white; }
  .badge-solid-bronze { background-color: #b45309; color: white; }
  .badge-solid-black { background-color: #1f2937; color: white; }
  .badge-solid-green { background-color: #22c55e; color: white; }
  .badge-solid-gray { background-color: #f3f4f6; color: #4b5563; }
  
  @keyframes border-glow-rainbow { 0%, 100% { box-shadow: 0 0 8px #ef4444; border-color: #ef4444; } 33% { box-shadow: 0 0 14px #eab308; border-color: #eab308; } 66% { box-shadow: 0 0 14px #3b82f6; border-color: #3b82f6; } }
  
  @keyframes pulse-glow {
    0% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }
    100% { box-shadow: 0 0 25px rgba(236, 72, 153, 0.7); }
  }
  .level-card-glow {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
    animation: pulse-glow 2.5s infinite alternate;
  }

  /* 風琴夾樣式與滾動條隱藏 */
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
`;

const RoleBadge = ({ role }) => {
  let badgeClass = "badge-solid-gray"; let icon = null;
  if (role === '店長') badgeClass = "badge-solid-rainbow";
  else if (role === '副店長') badgeClass = "badge-solid-gold";
  else if (role === '組長') badgeClass = "badge-solid-silver";
  else if (role === '儲備') badgeClass = "badge-solid-bronze";
  else if (role === '正職' || role === '兼職') badgeClass = "badge-solid-black";
  else if (role?.includes('實習')) { badgeClass = "badge-solid-green"; icon = <SproutLeaf c="w-3.5 h-3.5 mr-1 fill-current" />; }
  return <span className={`px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center tracking-wider shadow-sm ${badgeClass}`}>{icon}{role}</span>;
};

const getCardGlowClass = (role) => {
  if (role === '店長') return 'card-glow-rainbow';
  return 'border-gray-200 border-2 border-solid border-gray-100';
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [currentUserRole, setCurrentUserRole] = useState(null); 
  const [currentUserName, setCurrentUserName] = useState('');
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretPwd, setSecretPwd] = useState('');
  const [authPassword, setAuthPassword] = useState(''); 
  const [authError, setAuthError] = useState(''); 
  const [activeTab, setActiveTab] = useState('learning'); 
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const jobRoles = ['店長', '副店長', '組長', '儲備', '正職', '兼職', '實習正職', '實習兼職'];
  
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editEmployeeData, setEditEmployeeData] = useState({ name: '', store: '', role: '', password: '', birthdate: '', hireDate: '', phone: '', mbti: '' });

  const [stores, setStores] = useState([]);
  const [learningSteps, setLearningSteps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [progressApprovals, setProgressApprovals] = useState([]);
  const [learningLevelUpThreshold, setLearningLevelUpThreshold] = useState(3);
  const [taskRoles, setTaskRoles] = useState([]); 
  
  // 等級與分類狀態
  const [levelRules, setLevelRules] = useState([]); 
  const [editingLevelRules, setEditingLevelRules] = useState([]); 
  
  const [categories, setCategories] = useState([{id: 'default', name: '綜合學習'}]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategories, setEditingCategories] = useState([]);

  useEffect(() => {
    const unsubStores = onSnapshot(collection(db, 'stores'), snap => setStores(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubSteps = onSnapshot(collection(db, 'learningSteps'), snap => setLearningSteps(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>a.createdAt-b.createdAt)));
    const unsubTasks = onSnapshot(collection(db, 'tasks'), snap => setTasks(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>a.createdAt-b.createdAt)));
    const unsubEmp = onSnapshot(collection(db, 'employees'), snap => setEmployees(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPending = onSnapshot(collection(db, 'pendingAccounts'), snap => setPendingAccounts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubProg = onSnapshot(collection(db, 'progressApprovals'), snap => setProgressApprovals(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubConfig = onSnapshot(doc(db, 'config', 'global'), d => { 
      if(d.exists()) {
        const data = d.data();
        setLearningLevelUpThreshold(data.learningLevelUpThreshold || 3); 
        setTaskRoles(data.taskRoles || []); 
        setLevelRules(data.levelRules || []);
        setEditingLevelRules(prev => prev.length === 0 && data.levelRules?.length > 0 ? data.levelRules : prev);
        
        // 讀取分類
        if (data.learningCategories && data.learningCategories.length > 0) {
          setCategories(data.learningCategories);
          if (!activeCategoryId) setActiveCategoryId(data.learningCategories[0].id);
        }
      }
    });

    return () => { unsubStores(); unsubSteps(); unsubTasks(); unsubEmp(); unsubPending(); unsubProg(); unsubConfig(); };
  }, [activeCategoryId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const canEdit = currentUserRole === 'super_admin';
  const canEditTaskCount = canEdit || taskRoles.includes(currentUserRole); 
  
  const currentUserData = employees.find(e => e.name === currentUserName);

  // 取得總完成數以計算總等級
  const getTotalProgress = (completedLearning) => {
    if (typeof completedLearning === 'number') return completedLearning;
    if (typeof completedLearning === 'object' && completedLearning !== null) {
        return Object.values(completedLearning).reduce((a, b) => a + b, 0);
    }
    return 0;
  };

  const getLevelDisplay = (completedCount) => {
    const totalCount = getTotalProgress(completedCount);
    if (!levelRules || levelRules.length === 0) {
      return `Lv. ${Math.floor(totalCount / learningLevelUpThreshold)}`;
    }
    const rule = levelRules.find(r => totalCount >= parseInt(r.min) && totalCount <= parseInt(r.max));
    if (rule) return `Lv. ${rule.levelName}`;
    
    const sortedRules = [...levelRules].sort((a,b) => parseInt(b.max) - parseInt(a.max));
    const highestRule = sortedRules[0];
    if (highestRule && totalCount > parseInt(highestRule.max)) return `Lv. ${highestRule.levelName} (Max)`;
    
    return 'Lv. 0';
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const password = authPassword;
    const store = e.target.store?.value;

    if (authMode === 'register') {
      const name = e.target.managerName.value;
      const role = e.target.jobRole.value;
      const birthdate = e.target.birthdate.value;
      const hireDate = e.target.hireDate.value;
      const phone = e.target.phone.value;
      const mbti = e.target.mbti.value;

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
        setIsAuthenticated(true); setCurrentUserRole(matchedUser.role); setCurrentUserName(matchedUser.name);
        setAuthPassword(''); setAuthError('');
      } else {
        showToast('登入失敗！查無此門店或密碼錯誤。'); setAuthError('密碼錯誤，請重新輸入');
      }
    }
  };

  const handleFileUpload = async (stepId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true); showToast("上傳中，請稍候...");
    try {
      const storageRef = ref(storage, `media/${stepId}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'learningSteps', stepId), { mediaUrl: url, fileName: file.name });
      showToast("上傳成功！");
    } catch (err) { showToast("上傳失敗，請檢查網路！"); } finally { setIsUploading(false); e.target.value = null; }
  };

  const handleAvatarUpload = async (empId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast("上傳大頭照中...");
    try {
      const storageRef = ref(storage, `avatars/${empId}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'employees', empId), { avatarUrl: url });
      showToast("大頭照更新成功！");
    } catch (err) { showToast("上傳失敗，請檢查網路！"); } finally { e.target.value = null; }
  };

  const toggleTaskRole = async (role) => {
    let newRoles = [...taskRoles];
    if (newRoles.includes(role)) {
      newRoles = newRoles.filter(r => r !== role);
    } else {
      newRoles.push(role);
    }
    await setDoc(doc(db, 'config', 'global'), { taskRoles: newRoles }, { merge: true });
    showToast(`統計權限已更新！`);
  };

  const startEditEmployee = (emp) => {
    setEditingEmployeeId(emp.id);
    setEditEmployeeData({ 
      name: emp.name, 
      store: emp.store, 
      role: emp.role, 
      password: emp.password || '',
      birthdate: emp.birthdate || '',
      hireDate: emp.hireDate || '',
      phone: emp.phone || '',
      mbti: emp.mbti || ''
    });
  };

  const saveEditEmployee = async (id) => {
    if (!editEmployeeData.name.trim() || (editEmployeeData.password && editEmployeeData.password.length !== 6)) {
      showToast('資料格式不完整或密碼不為 6 碼！'); return;
    }
    try {
      await updateDoc(doc(db, 'employees', id), editEmployeeData);
      setEditingEmployeeId(null); showToast('人員資料已成功更新！');
    } catch (error) { showToast('更新失敗，請檢查網路連線。'); }
  };

  // 等級規則管理
  const addLevelRule = () => {
    setEditingLevelRules([...editingLevelRules, { id: Date.now().toString(), min: 0, max: 0, levelName: '' }]);
  };
  const removeLevelRule = (id) => {
    setEditingLevelRules(editingLevelRules.filter(r => r.id !== id));
  };
  const updateLevelRule = (id, field, value) => {
    setEditingLevelRules(editingLevelRules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  const saveLevelRulesConfig = async () => {
    const parsedRules = editingLevelRules.map(r => ({ ...r, min: parseInt(r.min) || 0, max: parseInt(r.max) || 0, levelName: r.levelName.toString() }));
    try { await setDoc(doc(db, 'config', 'global'), { levelRules: parsedRules }, { merge: true }); setLevelRules(parsedRules); showToast('學習升級門檻已儲存！'); } catch (e) { showToast('儲存失敗！'); }
  };

  // 分類管理
  const saveCategoriesConfig = async () => {
    const validCategories = editingCategories.filter(c => c.name.trim() !== '');
    try {
      await setDoc(doc(db, 'config', 'global'), { learningCategories: validCategories }, { merge: true });
      setCategories(validCategories);
      if (!validCategories.find(c => c.id === activeCategoryId) && validCategories.length > 0) {
        setActiveCategoryId(validCategories[0].id);
      }
      setShowCategoryManager(false);
      showToast('分類已成功更新！');
    } catch(e) { showToast('分類儲存失敗！'); }
  };

  const displayCategories = categories.length > 0 ? categories : [{id: 'default', name: '綜合學習'}];
  const currentActiveCatId = activeCategoryId || displayCategories[0].id;
  
  const filteredSteps = learningSteps.filter(s => s.categoryId === currentActiveCatId || (!s.categoryId && currentActiveCatId === displayCategories[0].id));
  
  const categoryProgress = typeof currentUserData?.completedLearning === 'object' 
                           ? (currentUserData?.completedLearning[currentActiveCatId] || 0) 
                           : (currentActiveCatId === displayCategories[0].id ? currentUserData?.completedLearning || 0 : 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-10 font-sans relative">
        <style>{customStyles}</style>
        
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
                <select name="store" required defaultValue="" className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 appearance-none">
                  <option value="" disabled>請選擇門店...</option>
                  {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
            </div>

            {authMode === 'register' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">申請職位</label>
                    <div className="relative">
                      <select name="jobRole" required defaultValue="" className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 appearance-none">
                        <option value="" disabled>請選擇...</option>
                        {jobRoles.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">真實姓名</label>
                    <input type="text" name="managerName" required className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" placeholder="劉德華" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">出生年月日</label>
                    <input type="date" name="birthdate" required className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">到職日</label>
                    <input type="date" name="hireDate" required className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">聯絡電話</label>
                    <input type="tel" name="phone" required className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" placeholder="09XX" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">人格特質</label>
                    <div className="relative">
                      <select name="mbti" required defaultValue="" className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 appearance-none">
                        <option value="" disabled>請選擇...</option>
                        <option value="E">E型 (外向)</option>
                        <option value="I">I型 (內向)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
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
                minLength="6" 
                maxLength="6" 
                value={authPassword}
                onChange={(e) => {
                  setAuthError(''); 
                  const val = e.target.value.replace(/\D/g, '');
                  if(val.length <= 6) setAuthPassword(val);
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full p-3.5 border rounded-xl font-bold text-gray-700 outline-none tracking-widest transition-all duration-300 ${
                  authError ? 'bg-red-50/50 border-red-500 focus:border-red-500 ring-2 ring-red-100' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'
                }`} 
                placeholder={authMode === 'login' ? "請輸入6碼數字密碼" : "請設定6碼數字密碼"} 
              />
              {authError && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 flex items-center animate-in slide-in-from-top-1"><XCircle c="w-3 h-3 mr-1" />{authError}</p>}
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-2 tracking-widest">
              {authMode === 'login' ? '進入系統' : '送出申請'}
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

  const isProfileTabAdmin = canEdit;
  const displayEmployees = isProfileTabAdmin ? employees : employees.filter(e => e.name === currentUserName);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans relative">
      <style>{customStyles}</style>
      <div className="w-full max-w-md bg-slate-50 relative min-h-screen shadow-xl flex flex-col overflow-hidden sm:border-x border-gray-200">
        
        <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Store c="w-4 h-4" /></div>
            <h1 className="font-black text-gray-800 tracking-wide text-lg">{canEdit ? '總部學習系統' : '門店學習系統'}</h1>
          </div>
          <div className="flex items-center gap-4">
            {pendingAccounts.length > 0 && canEdit && (
              <button onClick={() => setActiveTab('pending')} className="relative bg-gray-100 p-1.5 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer">
                <Bell c="w-5 h-5 text-gray-500 group-hover:text-blue-500 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            )}
            <button onClick={() => { setIsAuthenticated(false); setAuthPassword(''); }} className="bg-gray-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><LogOut c="w-4 h-4" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
          
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
                          <h4 className="font-bold text-gray-800 text-lg">{pa.name}</h4>
                          <p className="text-[11px] text-gray-500 font-bold mt-1 tracking-widest uppercase">{pa.store} | <span className="text-blue-600 font-bold">{pa.requestedRole}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-3 pl-2">
                        <button onClick={async () => {
                          await deleteDoc(doc(db, 'pendingAccounts', pa.id));
                          await addDoc(collection(db, 'employees'), { name: pa.name, role: pa.requestedRole, store: pa.store, password: pa.password || '', birthdate: pa.birthdate || '', hireDate: pa.hireDate || '', phone: pa.phone || '', mbti: pa.mbti || '', completedLearning: {}, tasksDetail: [], createdAt: Date.now() });
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

          {activeTab === 'learning' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center text-gray-800"><CheckCircle2 c="w-5 h-5 mr-2 text-indigo-500" />進度審核 ({progressApprovals.length})</h2>
                {progressApprovals.length === 0 ? <p className="text-xs text-gray-400 text-center py-4 font-medium">目前無待審核項目</p> : (
                  <div className="space-y-2">
                    {progressApprovals.map(pa => {
                      const categoryName = displayCategories.find(c => c.id === pa.categoryId)?.name || '綜合學習';
                      return (
                      <div key={pa.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-sm">申請人: {pa.employeeName}</span>
                          <span className="text-[10px] text-gray-500 font-medium">分類: {categoryName}</span>
                          <span className="text-[10px] text-gray-500 font-medium">項目: {pa.stepName}</span>
                          {pa.status === 'first_approved' && (
                            <span className="text-[10px] text-blue-500 font-bold mt-0.5 flex items-center"><CheckCircle2 c="w-3 h-3 mr-1" />初審通過 ({pa.firstApprover})</span>
                          )}
                        </div>
                        <div>
                          {(!pa.status || pa.status === 'pending') ? (
                            currentUserName === pa.employeeName ? (
                              <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-100 rounded border border-gray-200 shadow-inner inline-block">待同事初審</span>
                            ) : (
                              <button onClick={async () => {
                                await updateDoc(doc(db, 'progressApprovals', pa.id), { status: 'first_approved', firstApprover: currentUserName || '員工' });
                                showToast('已完成初審！');
                              }} className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-sm hover:bg-blue-600 transition-colors">初審核准</button>
                            )
                          ) : canEdit ? (
                            <button onClick={async () => {
                              await deleteDoc(doc(db, 'progressApprovals', pa.id));
                              const emp = employees.find(e => e.name === pa.employeeName);
                              if(emp) {
                                const targetCatId = pa.categoryId || displayCategories[0]?.id || 'default';
                                const newProgress = typeof emp.completedLearning === 'object' ? {...emp.completedLearning} : { [displayCategories[0]?.id || 'default']: emp.completedLearning || 0 };
                                newProgress[targetCatId] = (newProgress[targetCatId] || 0) + 1;
                                await updateDoc(doc(db, 'employees', emp.id), { completedLearning: newProgress });
                              }
                              showToast('複審完成，已核發進度！');
                            }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors">最終核准</button>
                          ) : (
                            <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-100 rounded border border-gray-200 shadow-inner inline-block">待後台核准</span>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>

              {/* 學習內容設定主區塊 */}
              <div className="bg-transparent">
                <div className="flex justify-between items-center mb-2 px-1">
                  <div>
                     <h2 className="font-bold text-gray-800 text-lg">學習內容設定</h2>
                     {!canEdit && <p className="text-[10px] text-gray-500 font-bold mt-0.5">※ 完成後請提交至主管審核</p>}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCategories([...displayCategories]); setShowCategoryManager(true); }} className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"><Settings c="w-3.5 h-3.5 mr-1" /><span>管理分類</span></button>
                    </div>
                  )}
                </div>

                {/* 分類管理介面 (僅後台) */}
                {canEdit && showCategoryManager && (
                  <div className="mb-4 bg-slate-800 rounded-xl p-4 shadow-lg text-white animate-in slide-in-from-top-2">
                     <h3 className="font-bold mb-3 flex items-center text-sm"><FolderPlus c="w-4 h-4 mr-2 text-indigo-400"/>編輯學習分類</h3>
                     <p className="text-[10px] text-gray-400 mb-3">新增或編輯類似「語文」、「數學」等學習頁籤：</p>
                     <div className="space-y-2 mb-4">
                       {editingCategories.map(cat => (
                         <div key={cat.id} className="flex gap-2 items-center">
                           <input type="text" value={cat.name} onChange={e => setEditingCategories(editingCategories.map(c => c.id === cat.id ? {...c, name: e.target.value} : c))} className="flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-sm font-bold outline-none focus:border-indigo-400" placeholder="分類名稱" />
                           <button onClick={() => setEditingCategories(editingCategories.filter(c => c.id !== cat.id))} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"><Trash2 c="w-4 h-4"/></button>
                         </div>
                       ))}
                       <button onClick={() => setEditingCategories([...editingCategories, {id: Date.now().toString(), name: ''}])} className="w-full p-2 mt-1 border border-dashed border-slate-600 rounded text-slate-400 font-bold hover:text-white hover:border-slate-400 text-xs transition-colors"> + 新增頁籤分類</button>
                     </div>
                     <div className="flex gap-2 pt-2 border-t border-slate-700">
                       <button onClick={() => setShowCategoryManager(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors">取消</button>
                       <button onClick={saveCategoriesConfig} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-400 rounded text-xs font-bold shadow-md shadow-indigo-500/30 transition-colors">儲存分類</button>
                     </div>
                  </div>
                )}
                
                {/* 總部專屬：進階多行門檻設定 */}
                {canEdit && !showCategoryManager && (
                  <div className="mb-6 space-y-4">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <BookOpen c="w-5 h-5 text-indigo-600" />
                          <div>
                            <h3 className="text-sm font-bold text-indigo-900">學習升級門檻設定</h3>
                            <p className="text-[10px] text-indigo-500">依據總完成數量區間，自動轉換等級名稱</p>
                          </div>
                        </div>
                        <button onClick={saveLevelRulesConfig} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow transition-colors active:scale-95">
                          儲存門檻
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {editingLevelRules.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-2">尚未設定門檻區間，目前將使用預設倍數計算</p>
                        ) : (
                          editingLevelRules.map((rule) => (
                            <div key={rule.id} className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                              <span className="text-xs font-bold text-gray-500">條件：</span>
                              <input type="number" value={rule.min} onChange={e => updateLevelRule(rule.id, 'min', e.target.value)} className="w-12 sm:w-14 text-center border border-gray-200 rounded p-1 text-sm font-bold outline-none focus:border-indigo-500" />
                              <span className="text-xs font-bold text-gray-400">至</span>
                              <input type="number" value={rule.max} onChange={e => updateLevelRule(rule.id, 'max', e.target.value)} className="w-12 sm:w-14 text-center border border-gray-200 rounded p-1 text-sm font-bold outline-none focus:border-indigo-500" />
                              <span className="text-xs font-bold text-gray-500">項 ➔ 升級</span>
                              <input type="text" value={rule.levelName} onChange={e => updateLevelRule(rule.id, 'levelName', e.target.value)} className="flex-1 min-w-[60px] border border-gray-200 rounded p-1 text-sm font-bold outline-none text-indigo-600 focus:border-indigo-500" placeholder="Lv 1" />
                              <button onClick={() => removeLevelRule(rule.id)} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors"><Trash2 c="w-4 h-4"/></button>
                            </div>
                          ))
                        )}
                      </div>
                      <button onClick={addLevelRule} className="mt-4 w-full py-2 bg-white border border-indigo-200 border-dashed rounded-lg text-xs text-indigo-600 font-bold flex justify-center items-center hover:bg-indigo-50 transition-colors">
                        <PlusCircle c="w-4 h-4 mr-1.5"/> 新增區間行數
                      </button>
                    </div>
                  </div>
                )}

                {/* 風琴夾頁籤 UI (Folder Tabs) */}
                <div className="flex overflow-x-auto pl-2 pt-2 -mb-[1px] hide-scrollbar z-10 relative">
                  {displayCategories.map((cat, i) => {
                    const isActive = currentActiveCatId === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`relative cursor-pointer px-4 sm:px-6 py-2.5 min-w-[80px] max-w-[120px] text-center rounded-t-xl -ml-2 border border-gray-200 transition-all select-none flex-shrink-0 ${
                          isActive
                            ? 'bg-white text-indigo-600 font-black border-b-white z-20 pt-3.5 -mt-1.5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
                            : 'bg-indigo-50/90 text-gray-500 font-bold hover:bg-indigo-100/90 shadow-inner inset-shadow'
                        }`}
                        style={{ zIndex: isActive ? 20 : displayCategories.length - i }}
                      >
                        <span className="truncate block text-[13px]">{cat.name}</span>
                      </div>
                    )
                  })}
                </div>

                {/* 學習內容列表區域 */}
                <div className="bg-white border border-gray-200 rounded-xl rounded-tl-none shadow-sm relative z-10">
                  
                  {/* 後台專屬：新增當前分類的按鈕 */}
                  {canEdit && (
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-tr-xl">
                      <button onClick={async () => await addDoc(collection(db, 'learningSteps'), { title: '新學習項目', description: '', categoryId: currentActiveCatId, status: 'locked', mediaUrl: '', fileName: '', createdAt: Date.now() })} className="w-full py-2 border border-dashed border-indigo-300 rounded-lg text-xs text-indigo-600 font-bold flex justify-center items-center hover:bg-indigo-50 transition-colors">
                        <PlusCircle c="w-4 h-4 mr-1.5"/> 於「{displayCategories.find(c=>c.id === currentActiveCatId)?.name}」新增內容
                      </button>
                    </div>
                  )}

                  {filteredSteps.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm font-bold">
                      <BookOpen c="w-10 h-10 mx-auto mb-3 text-gray-200" />
                      此分類目前尚無學習內容
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {canEdit ? (
                        /* 後台編輯視角：顯示所有可編輯的卡片 */
                        filteredSteps.map((step, index) => (
                          <div key={step.id} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm relative">
                            <button onClick={async () => await deleteDoc(doc(db, 'learningSteps', step.id))} className="absolute top-2 right-2 p-1.5 text-red-300 hover:text-red-500 rounded transition-colors"><Trash2 c="w-4 h-4" /></button>
                            
                            <div className="flex items-center space-x-2">
                              <div className="font-black text-gray-300 text-lg w-5">{index + 1}.</div>
                              <div className="flex flex-1 gap-2 pr-6">
                                <input type="text" defaultValue={step.title} onBlur={e => updateDoc(doc(db, 'learningSteps', step.id), { title: e.target.value })} className="flex-1 p-2 border border-gray-200 rounded-lg font-bold text-gray-800 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" placeholder="請輸入標題"/>
                              </div>
                            </div>
                            
                            <div className="pl-7">
                              <textarea defaultValue={step.description} onBlur={e => updateDoc(doc(db, 'learningSteps', step.id), { description: e.target.value })} className="w-full p-3 border border-gray-200 rounded-lg text-xs text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[80px]" placeholder="請輸入學習內容..." />
                            </div>
                            
                            <div className="pl-7 flex items-center space-x-3 mt-1">
                              <label className={`flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <UploadCloud c="w-4 h-4 mr-1.5 text-indigo-500" />{isUploading ? '上傳中...' : '上傳附件'}
                                <input type="file" accept="image/*,video/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(step.id, e)} />
                              </label>
                              <span className="text-xs text-gray-500 truncate max-w-[150px]">{step.fileName || (step.mediaUrl ? '已上傳' : '無附件')}</span>
                            </div>

                            {step.mediaUrl && (
                              <div className="pl-7 mt-2 relative inline-block">
                                {step.mediaUrl.match(/\.(mp4|webm|ogg|MOV|m4v)/i) || (step.mediaUrl.includes('firebasestorage') && step.mediaUrl.includes('media%2F')) ? (
                                  <video src={step.mediaUrl} controls className="max-h-32 rounded border border-gray-200" />
                                ) : ( <img src={step.mediaUrl} className="max-h-32 object-contain rounded border border-gray-200" alt="預覽" /> )}
                                <button onClick={() => updateDoc(doc(db, 'learningSteps', step.id), { mediaUrl: '', fileName: '' })} className="absolute top-1 right-1 bg-red-500/90 text-white px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm shadow-sm">移除</button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        /* 員工視角：遊戲化的一關一關解鎖地圖 (依據分類進度) */
                        <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-8 my-2 pb-4">
                          {filteredSteps.map((step, index) => {
                            const isCompleted = index < categoryProgress;
                            const isCurrent = index === categoryProgress;
                            const isLocked = index > categoryProgress;
                            const pendingApproval = progressApprovals.find(pa => pa.employeeName === currentUserName && pa.stepId === step.id);

                            if (isLocked) {
                              return (
                                <div key={step.id} className="relative">
                                  <div className="absolute -left-[39px] top-2 w-7 h-7 bg-gray-100 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                                    <Lock c="w-3 h-3 text-gray-400" />
                                  </div>
                                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center space-x-3 opacity-60">
                                    <div className="bg-gray-200 text-gray-500 font-black text-xs px-2 py-1 rounded">Lv.{index + 1}</div>
                                    <div className="text-gray-400 font-bold text-sm tracking-widest">尚未解鎖</div>
                                  </div>
                                </div>
                              );
                            }

                            if (isCompleted) {
                              return (
                                <div key={step.id} className="relative group">
                                  <div className="absolute -left-[39px] top-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                                    <CheckCircle2 c="w-4 h-4 text-white" />
                                  </div>
                                  <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm opacity-70 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-green-100 text-green-700 font-black text-[10px] px-2 py-1 rounded">Lv.{index + 1}</span>
                                      <h3 className="font-bold text-gray-700 text-sm line-clamp-1">{step.title}</h3>
                                      <span className="ml-auto text-[10px] font-bold text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 c="w-3 h-3 mr-1"/>已通過
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (isCurrent) {
                              return (
                                <div key={step.id} className="relative">
                                  <div className="absolute -left-[43px] top-2 w-9 h-9 bg-indigo-600 rounded-full border-4 border-white flex items-center justify-center shadow-md animate-pulse">
                                    <BookOpen c="w-4 h-4 text-white" />
                                  </div>
                                  <div className="bg-white border-2 border-indigo-400 rounded-xl p-5 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="bg-indigo-100 text-indigo-700 font-black text-xs px-2 py-1 rounded">Lv.{index + 1}</span>
                                      <h3 className="font-bold text-indigo-900 text-lg">{step.title}</h3>
                                      <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full animate-bounce">目前進度</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">{step.description}</p>
                                    
                                    {step.mediaUrl && (
                                      <div className="mt-3 mb-4 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex justify-center">
                                        {step.mediaUrl.match(/\.(mp4|webm|ogg|MOV|m4v)/i) || (step.mediaUrl.includes('firebasestorage') && step.mediaUrl.includes('media%2F')) ? (
                                          <video src={step.mediaUrl} controls className="max-h-48 w-full object-contain" />
                                        ) : ( <img src={step.mediaUrl} className="max-h-48 w-full object-contain" alt="教材" /> )}
                                      </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                      {pendingApproval ? (
                                        <div className={`py-4 rounded-xl text-sm font-bold flex justify-center items-center border ${pendingApproval.status === 'first_approved' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                          <span className="animate-pulse flex items-center">
                                            <Bell c="w-5 h-5 mr-2"/>
                                            {pendingApproval.status === 'first_approved' ? `初審已過 (${pendingApproval.firstApprover})，待後台複審...` : '審核中，請通知同事初審...'}
                                          </span>
                                        </div>
                                      ) : (
                                        <button onClick={async () => {
                                            await addDoc(collection(db, 'progressApprovals'), {
                                              employeeName: currentUserName || '員工',
                                              stepName: step.title,
                                              stepId: step.id,
                                              categoryId: currentActiveCatId,
                                              status: 'pending',
                                              createdAt: Date.now()
                                            });
                                            showToast('已提交審核！請通知同事進行初審。');
                                          }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-base shadow-lg shadow-indigo-200 transition-all active:scale-95 flex justify-center items-center">
                                          <CheckCircle2 c="w-6 h-6 mr-2" />完成學習，提交核准
                                        </button>
                                      )}
                                    </div>
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
            </div>
          )}

          {/* TAB 2: 工作項目管理 */}
          {activeTab === 'tasks' && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="font-bold text-gray-800 text-lg">工作項目管理</h2></div>
              </div>

              {/* 總部專屬：工作項目統計權限設定 */}
              {canEdit && (
                <div className="mb-6 bg-slate-900 text-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Settings c="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold tracking-wider">工作項目統計權限</h3>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-3 font-medium">請勾選哪些職位可以在系統中統計工作項目次數：</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {jobRoles.map(role => (
                      <label key={role} className="flex items-center space-x-2 bg-white/10 p-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={taskRoles.includes(role)} 
                          onChange={() => toggleTaskRole(role)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-[11px] font-bold">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 text-xs">
                    <th className="p-3 font-bold">項目名稱</th><th className="p-3 font-bold w-20 text-center">總次數</th>{canEdit && <th className="p-3 font-bold text-right w-12">刪除</th>}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} className="border-b border-gray-100">
                      <td className="p-2"><input type="text" defaultValue={task.name} disabled={!canEdit} onBlur={e => updateDoc(doc(db, 'tasks', task.id), { name: e.target.value })} className="w-full p-2 border border-gray-200 rounded text-sm font-medium focus:border-indigo-500 outline-none bg-white disabled:bg-transparent disabled:border-transparent"/></td>
                      <td className="p-2"><input type="number" defaultValue={task.count} disabled={!canEditTaskCount} onBlur={e => updateDoc(doc(db, 'tasks', task.id), { count: parseInt(e.target.value)||0 })} className="w-full p-2 border border-gray-200 rounded text-sm font-bold text-indigo-600 focus:border-indigo-500 outline-none bg-white disabled:bg-transparent disabled:border-transparent text-center"/></td>
                      {canEdit && <td className="p-2 text-right"><button onClick={async () => await deleteDoc(doc(db, 'tasks', task.id))} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 c="w-4 h-4" /></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {canEdit && <button onClick={async () => await addDoc(collection(db, 'tasks'), { name: '新項目', count: 0, createdAt: Date.now() })} className="mt-4 flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-bold p-2 text-xs bg-indigo-50 rounded-lg transition-colors"><PlusCircle c="w-4 h-4" /><span>新增工作項目</span></button>}
            </div>
          )}
          
          {/* TAB 3: 個人資料 / 人員名單 */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {pendingAccounts.length > 0 && canEdit && (
                <div onClick={() => setActiveTab('pending')} className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm flex justify-between items-center cursor-pointer transition-all active:scale-95">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2.5 rounded-lg text-white shadow-inner">
                      <User c="w-5 h-5" />
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
                    {stores.map(s => (
                      <span key={s.id} className="bg-gray-50 text-gray-700 px-3 py-1 rounded border border-gray-200 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        {s.name}
                        <button onClick={()=>deleteDoc(doc(db,'stores',s.id))} className="text-gray-400 hover:text-red-500 transition-colors"><XCircle c="w-3.5 h-3.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" id="ns" className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="新增門店..." />
                    <button onClick={async () => { const i = document.getElementById('ns'); if(i.value) { await addDoc(collection(db, 'stores'), { name: i.value, createdAt: Date.now() }); i.value = ''; } }} className="bg-indigo-600 text-white px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700">新增</button>
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                 <h2 className="font-bold mb-4 flex items-center text-gray-800">
                   <User c="w-4 h-4 mr-2 text-indigo-500" />
                   {isProfileTabAdmin ? `人員名單 (${displayEmployees.length})` : '個人資料'}
                 </h2>
                 
                 {/* 統一的人員卡片排版 (前台後台同步) */}
                 <div className="space-y-4">
                    {displayEmployees.map(emp => {
                      const totalTasks = emp.tasksDetail?.reduce((sum, t) => sum + t.count, 0) || 0;
                      
                      return (
                        <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative flex flex-col">
                          
                          {/* 編輯模式表單 */}
                          {editingEmployeeId === emp.id ? (
                            <div className="flex flex-col space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-inner">
                               <div>
                                 <label className="text-[10px] font-bold text-blue-600 mb-1 block">員工姓名</label>
                                 <input type="text" value={editEmployeeData.name} onChange={(e) => setEditEmployeeData({...editEmployeeData, name: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800" placeholder="修改姓名"/>
                               </div>
                               <div>
                                 <label className="text-[10px] font-bold text-blue-600 mb-1 block">聯絡電話</label>
                                 <input type="tel" value={editEmployeeData.phone || ''} onChange={(e) => setEditEmployeeData({...editEmployeeData, phone: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800" placeholder="09XX"/>
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
                                   <label className="text-[10px] font-bold text-blue-600 mb-1 block">所屬門店</label>
                                   <select value={editEmployeeData.store} onChange={(e) => setEditEmployeeData({...editEmployeeData, store: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                     {stores.map(store => <option key={store.id} value={store.name}>{store.name}</option>)}
                                   </select>
                                 </div>
                                 <div>
                                   <label className="text-[10px] font-bold text-blue-600 mb-1 block">職位權限</label>
                                   <select value={editEmployeeData.role} onChange={(e) => setEditEmployeeData({...editEmployeeData, role: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                     {jobRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                   </select>
                                 </div>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                 <div>
                                   <label className="text-[10px] font-bold text-blue-600 mb-1 block">人格特質</label>
                                   <select value={editEmployeeData.mbti || ''} onChange={(e) => setEditEmployeeData({...editEmployeeData, mbti: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                     <option value="">未填寫</option>
                                     <option value="E">E型 (外向)</option>
                                     <option value="I">I型 (內向)</option>
                                   </select>
                                 </div>
                                 <div>
                                   <label className="text-[10px] font-bold text-blue-600 mb-1 block">登入密碼 (6碼)</label>
                                   <input 
                                     type="text" 
                                     maxLength="6" 
                                     value={editEmployeeData.password} 
                                     onChange={(e) => {
                                       const val = e.target.value.replace(/\D/g, ''); 
                                       if(val.length <= 6) setEditEmployeeData({...editEmployeeData, password: val});
                                     }} 
                                     className="w-full p-2.5 border border-blue-200 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800 tracking-widest" 
                                     placeholder="請輸入6碼數字新密碼"
                                   />
                                 </div>
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
                                    <label className={`block w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-indigo-50 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center group ${canEdit || currentUserName === emp.name ? 'cursor-pointer' : ''}`}>
                                      {emp.avatarUrl ? <img src={emp.avatarUrl} className="w-full h-full object-cover"/> : <User c="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />}
                                      
                                      {/* 只有自己或後台可以上傳大頭照 */}
                                      {(canEdit || currentUserName === emp.name) && (
                                        <>
                                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                             <Camera c="w-6 h-6 text-white" />
                                          </div>
                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(emp.id, e)} />
                                        </>
                                      )}
                                    </label>
                                  </div>
                                  <div>
                                    <h3 className="font-black text-gray-800 text-xl sm:text-2xl tracking-wide mb-1">{emp.name}</h3>
                                    <RoleBadge role={emp.role} />
                                    <span className="text-xs text-gray-500 font-bold ml-2">{emp.store}</span>
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

                              {/* 發光實色等級卡片 */}
                              <div className="level-card-glow bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-5 text-white relative overflow-hidden mb-5">
                                <div className="absolute inset-0 bg-white/10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIvPjwvc3ZnPg==')]"></div>
                                <div className="flex justify-between items-end relative z-10">
                                   <div>
                                     <p className="text-[11px] font-bold text-indigo-100 mb-1 tracking-widest">目前等級</p>
                                     <p className="text-3xl font-black drop-shadow-md">{getLevelDisplay(emp.completedLearning || 0)}</p>
                                   </div>
                                   <div className="text-right">
                                     <p className="text-[11px] font-bold text-indigo-100 mb-1 tracking-widest">所屬職位</p>
                                     <p className="text-xl font-bold drop-shadow-md">{emp.role}</p>
                                   </div>
                                </div>
                              </div>

                              {/* 個人詳細資料列表 */}
                              <div className="bg-gray-50 rounded-xl border border-gray-100 p-1 mb-4">
                                 <div className="flex justify-between items-center p-3 border-b border-gray-200/60">
                                   <span className="text-xs text-gray-500 font-bold">出生年月日</span>
                                   <span className="text-sm font-bold text-gray-800">{emp.birthdate || '未填寫'}</span>
                                 </div>
                                 <div className="flex justify-between items-center p-3 border-b border-gray-200/60">
                                   <span className="text-xs text-gray-500 font-bold">到職日</span>
                                   <span className="text-sm font-bold text-gray-800">{emp.hireDate || '未填寫'}</span>
                                 </div>
                                 <div className="flex justify-between items-center p-3 border-b border-gray-200/60">
                                   <span className="text-xs text-gray-500 font-bold">聯絡電話</span>
                                   <span className="text-sm font-bold text-gray-800">{emp.phone || '未填寫'}</span>
                                 </div>
                                 <div className="flex justify-between items-center p-3">
                                   <span className="text-xs text-gray-500 font-bold">人格特質</span>
                                   <span className="text-sm font-black text-indigo-600">{emp.mbti ? `${emp.mbti}型人` : '未填寫'}</span>
                                 </div>
                              </div>

                              {/* 詳細工作統計 (若有統計數據則顯示在最下方) */}
                              {emp.tasksDetail && emp.tasksDetail.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-100 p-3 z-10 shadow-sm mt-1">
                                   <div className="flex justify-between items-center mb-2">
                                      <p className="text-[10px] text-gray-400 font-bold">詳細工作統計：</p>
                                      <p className="text-[10px] text-gray-400 font-bold">總計 {totalTasks} 次</p>
                                   </div>
                                   <div className="flex flex-wrap gap-2">
                                     {emp.tasksDetail.map(t => (
                                       <span key={t.id} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-1 rounded-md flex items-center font-medium">
                                         {t.name} <span className="font-black text-blue-600 ml-1.5">{t.count}</span>
                                       </span>
                                     ))}
                                   </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                 </div>
              </div>
            </div>
          )}
        </main>

        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe shadow-lg z-30">
          <button onClick={() => setActiveTab('learning')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'learning' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <BookOpen c={`w-5 h-5 ${activeTab === 'learning' ? 'fill-indigo-50' : ''}`} /><span className="text-[10px] font-bold">學習審核</span>
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'tasks' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <ListTodo c={`w-5 h-5 ${activeTab === 'tasks' ? 'fill-indigo-50' : ''}`} /><span className="text-[10px] font-bold">工作項目</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'profile' || activeTab === 'pending' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <User c={`w-5 h-5 ${activeTab === 'profile' || activeTab === 'pending' ? 'fill-indigo-50' : ''}`} /><span className="text-[10px] font-bold">{isProfileTabAdmin ? '人員門店' : '個人資料'}</span>
          </button>
        </nav>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-2.5 rounded-lg z-[100] text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
