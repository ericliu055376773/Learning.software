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

const customStyles = `
  .badge-solid-rainbow { background: linear-gradient(90deg, #ef4444, #eab308, #3b82f6, #a855f7, #ef4444); color: white; }
  .badge-solid-gold { background-color: #eab308; color: white; }
  .badge-solid-silver { background-color: #94a3b8; color: white; }
  .badge-solid-bronze { background-color: #b45309; color: white; }
  .badge-solid-black { background-color: #1f2937; color: white; }
  .badge-solid-green { background-color: #22c55e; color: white; }
  .badge-solid-gray { background-color: #f3f4f6; color: #4b5563; }
  
  @keyframes border-glow-rainbow { 0%, 100% { box-shadow: 0 0 8px #ef4444; border-color: #ef4444; } 33% { box-shadow: 0 0 14px #eab308; border-color: #eab308; } 66% { box-shadow: 0 0 14px #3b82f6; border-color: #3b82f6; } }
  @keyframes border-glow-gold { 0%, 100% { box-shadow: 0 0 6px #ca8a04; border-color: #ca8a04; } 50% { box-shadow: 0 0 16px #fde047; border-color: #fde047; } }
  @keyframes border-glow-silver { 0%, 100% { box-shadow: 0 0 5px #94a3b8; border-color: #94a3b8; } 50% { box-shadow: 0 0 14px #cbd5e1; border-color: #cbd5e1; } }
  @keyframes border-glow-bronze { 0%, 100% { box-shadow: 0 0 6px #b45309; border-color: #b45309; } 50% { box-shadow: 0 0 14px #d97706; border-color: #d97706; } }
  @keyframes border-glow-black { 0%, 100% { box-shadow: 0 0 5px #1f2937; border-color: #1f2937; } 50% { box-shadow: 0 0 12px #4b5563; border-color: #4b5563; } }
  @keyframes border-glow-green { 0%, 100% { box-shadow: 0 0 6px #16a34a; border-color: #16a34a; } 50% { box-shadow: 0 0 16px #4ade80; border-color: #4ade80; } }

  .card-glow-rainbow { animation: border-glow-rainbow 3s infinite; border-width: 2px; }
  .card-glow-gold { animation: border-glow-gold 2s infinite; border-width: 2px; }
  .card-glow-silver { animation: border-glow-silver 2s infinite; border-width: 2px; }
  .card-glow-bronze { animation: border-glow-bronze 2s infinite; border-width: 2px; }
  .card-glow-black { animation: border-glow-black 2.5s infinite; border-width: 2px; }
  .card-glow-green { animation: border-glow-green 2s infinite; border-width: 2px; }
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
  if (role === '副店長') return 'card-glow-gold';
  if (role === '組長') return 'card-glow-silver';
  if (role === '儲備') return 'card-glow-bronze';
  if (role === '正職' || role === '兼職') return 'card-glow-black';
  if (role?.includes('實習')) return 'card-glow-green';
  return 'border-gray-200 border-2 border-solid border-gray-100';
};

export default function BackendApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 新增註冊/登入切換
  const [currentUserRole, setCurrentUserRole] = useState(null); 
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretPwd, setSecretPwd] = useState('');
  const [activeTab, setActiveTab] = useState('learning'); 
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showManagerLearning, setShowManagerLearning] = useState(false);

  const jobRoles = ['店長', '副店長', '組長', '儲備', '正職', '兼職', '實習正職', '實習兼職'];
  
  // 編輯人員相關狀態
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editEmployeeData, setEditEmployeeData] = useState({ name: '', store: '', role: '' });

  // Firebase 資料狀態
  const [stores, setStores] = useState([]);
  const [learningSteps, setLearningSteps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [progressApprovals, setProgressApprovals] = useState([]);
  const [learningLevelUpThreshold, setLearningLevelUpThreshold] = useState(3);

  // 初始化所有 Firebase 監聽
  useEffect(() => {
    const unsubStores = onSnapshot(collection(db, 'stores'), snap => setStores(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubSteps = onSnapshot(collection(db, 'learningSteps'), snap => setLearningSteps(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>a.createdAt-b.createdAt)));
    const unsubTasks = onSnapshot(collection(db, 'tasks'), snap => setTasks(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b)=>a.createdAt-b.createdAt)));
    const unsubEmp = onSnapshot(collection(db, 'employees'), snap => setEmployees(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPending = onSnapshot(collection(db, 'pendingAccounts'), snap => setPendingAccounts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubProg = onSnapshot(collection(db, 'progressApprovals'), snap => setProgressApprovals(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubConfig = onSnapshot(doc(db, 'config', 'global'), d => { if(d.exists()) setLearningLevelUpThreshold(d.data().learningLevelUpThreshold || 3); });

    return () => { unsubStores(); unsubSteps(); unsubTasks(); unsubEmp(); unsubPending(); unsubProg(); unsubConfig(); };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const canEdit = currentUserRole === 'super_admin';

  // 登入與註冊處理
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authMode === 'register') {
      const name = e.target.managerName.value;
      const store = e.target.store.value;
      const role = e.target.jobRole.value; // 抓取選擇的職位

      // 寫入到待審核名單中，並標示申請的職位身分
      await addDoc(collection(db, 'pendingAccounts'), {
        name: name,
        store: store,
        requestedRole: role, 
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      });
      showToast('主管帳號申請已送出！請等待總部核准。');
      setAuthMode('login');
    } else {
      setIsAuthenticated(true);
      setCurrentUserRole('manager');
    }
  };

  // 手機檔案上傳至 Firebase Storage
  const handleFileUpload = async (stepId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    showToast("上傳中，請稍候...");
    try {
      const storageRef = ref(storage, `media/${stepId}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'learningSteps', stepId), { mediaUrl: url, fileName: file.name });
      showToast("上傳成功！");
    } catch (err) { 
      showToast("上傳失敗，請檢查網路！"); 
    } finally { 
      setIsUploading(false); 
      e.target.value = null; 
    }
  };

  // 編輯人員功能
  const startEditEmployee = (emp) => {
    setEditingEmployeeId(emp.id);
    setEditEmployeeData({ name: emp.name, store: emp.store, role: emp.role });
  };

  const saveEditEmployee = async (id) => {
    if (!editEmployeeData.name.trim()) {
      showToast('員工姓名不能為空！');
      return;
    }
    try {
      await updateDoc(doc(db, 'employees', id), { 
        name: editEmployeeData.name, 
        store: editEmployeeData.store, 
        role: editEmployeeData.role 
      });
      setEditingEmployeeId(null);
      showToast('人員資料已成功更新！');
    } catch (error) {
      showToast('更新失敗，請檢查網路連線。');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-10 font-sans relative">
        <style>{customStyles}</style>
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl relative animate-in fade-in duration-500 border border-gray-100">
          <div onClick={() => setShowSecretModal(true)} className="w-20 h-20 bg-indigo-50 rounded-2xl mx-auto mb-6 flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors">
             <ShieldCheck c="w-10 h-10 text-indigo-600" />
          </div>
          
          <h1 className="text-2xl font-black text-center text-gray-800 mb-1 tracking-wider">
            {authMode === 'login' ? '後台管理系統' : '註冊主管帳號'}
          </h1>
          <p className="text-center text-gray-400 text-xs tracking-widest mb-8 font-bold">
            {authMode === 'login' ? '請輸入管理資訊以進入' : '請填寫申請資料，等待總部審核'}
          </p>
          
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">
                {authMode === 'login' ? '登入門店' : '申請管理門店'}
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
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">申請職位</label>
                  <div className="relative">
                    <select name="jobRole" required defaultValue="" className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 appearance-none">
                      <option value="" disabled>請選擇職位...</option>
                      {jobRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">真實姓名</label>
                  <input type="text" name="managerName" required className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" placeholder="例如：李店長" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">
                {authMode === 'login' ? '管理密碼' : '設定密碼'}
              </label>
              <input type="password" required className="w-full p-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500" placeholder={authMode === 'login' ? "••••••" : "請設定6碼密碼"} />
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-2 tracking-widest">
              {authMode === 'login' ? '進入系統' : '送出申請'}
            </button>
          </form>

          {/* 註冊與登入切換按鈕 */}
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-indigo-500 font-bold text-xs tracking-widest hover:text-indigo-700 transition-colors underline decoration-2 underline-offset-4"
            >
              {authMode === 'login' ? '尚未開通？申請主管帳號' : '已有帳號？返回登入'}
            </button>
          </div>

          {showSecretModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-white p-8 rounded-2xl w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-slate-900 rounded-xl mx-auto mb-4 flex items-center justify-center"><ShieldCheck c="w-6 h-6 text-white" /></div>
                <h3 className="font-black text-xl mb-1 text-gray-800">總部權限登入</h3>
                <p className="text-xs text-gray-400 mb-6 font-bold tracking-widest">SUPER ADMIN</p>
                <input type="password" autoFocus value={secretPwd} onChange={e => setSecretPwd(e.target.value)} className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl mb-6 text-center tracking-widest outline-none focus:border-indigo-600 font-bold" placeholder="請輸入總部密碼" />
                <div className="flex gap-2">
                  <button onClick={() => setShowSecretModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">取消</button>
                  <button onClick={() => { if(secretPwd==='0204') { setIsAuthenticated(true); setCurrentUserRole('super_admin'); setShowSecretModal(false); setAuthMode('login'); } else { showToast('密碼錯誤！'); } }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold">登入</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans relative">
      <style>{customStyles}</style>
      <div className="w-full max-w-md bg-slate-50 relative min-h-screen shadow-xl flex flex-col overflow-hidden sm:border-x border-gray-200">
        
        <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Store c="w-4 h-4" /></div>
            <h1 className="font-black text-gray-800 tracking-wide text-lg">{canEdit ? '總部管理系統' : '門店管理系統'}</h1>
          </div>
          <div className="flex items-center gap-4">
            {pendingAccounts.length > 0 && <div className="relative"><Bell c="w-5 h-5 text-gray-400 animate-pulse" /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span></div>}
            <button onClick={() => setIsAuthenticated(false)} className="bg-gray-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><LogOut c="w-4 h-4" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
          
          {activeTab === 'learning' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* 進度審核 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center text-gray-800"><CheckCircle2 c="w-5 h-5 mr-2 text-indigo-500" />進度審核 ({progressApprovals.length})</h2>
                {progressApprovals.length === 0 ? <p className="text-xs text-gray-400 text-center py-4 font-medium">目前無待審核項目</p> : (
                  <div className="space-y-2">
                    {progressApprovals.map(pa => (
                      <div key={pa.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-sm">{pa.employeeName}</span>
                          <span className="text-[10px] text-gray-500 font-medium">{pa.stepName}</span>
                        </div>
                        <button onClick={async () => {
                          await deleteDoc(doc(db, 'progressApprovals', pa.id));
                          const emp = employees.find(e => e.name === pa.employeeName);
                          if(emp) await updateDoc(doc(db, 'employees', emp.id), { completedLearning: (emp.completedLearning || 0) + 1 });
                          showToast('已核准！');
                        }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-sm">核准</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 內容管理 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                     <h2 className="font-bold text-gray-800 text-lg">學習內容設定</h2>
                     {!canEdit && <p className="text-[10px] text-red-400 font-bold mt-0.5">※ 僅總公司具備修改權限</p>}
                  </div>
                  {canEdit && <button onClick={async () => await addDoc(collection(db, 'learningSteps'), { title: '新學習項目', description: '', status: 'locked', mediaUrl: '', fileName: '', createdAt: Date.now() })} className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"><PlusCircle c="w-4 h-4" /><span>新增內容</span></button>}
                </div>
                
                {/* 總部專屬：升級門檻 */}
                {canEdit && (
                  <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2">
                      <BookOpen c="w-4 h-4 text-indigo-600" />
                      <div>
                        <h3 className="text-xs font-bold text-indigo-900">學習升級門檻</h3>
                        <p className="text-[9px] text-indigo-500">完成指定數量自動升級</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded border border-indigo-200">
                      <span className="text-[10px] font-bold text-gray-600">每</span>
                      <input type="number" min="1" max="10" value={learningLevelUpThreshold} onChange={(e) => setLearningLevelUpThreshold(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} onBlur={(e) => setDoc(doc(db, 'config', 'global'), { learningLevelUpThreshold: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) }, { merge: true })} className="w-6 text-center border-b border-indigo-500 font-bold text-indigo-600 text-xs outline-none bg-transparent"/>
                      <span className="text-[10px] font-bold text-gray-600">項 / 級</span>
                    </div>
                  </div>
                )}

                {/* 學習卡片列表 (經典還原版) */}
                {!canEdit && !showManagerLearning ? (
                  <button onClick={() => setShowManagerLearning(true)} className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 py-3 rounded-lg text-xs font-bold transition-colors flex justify-center items-center">
                    <BookOpen c="w-4 h-4 mr-2 text-indigo-500" />展開檢視學習內容
                  </button>
                ) : (
                  <div className="space-y-4">
                    {learningSteps.map((step, index) => (
                      <div key={step.id} className={`flex flex-col gap-3 p-4 rounded-lg border relative ${canEdit ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                        {canEdit && <button onClick={async () => await deleteDoc(doc(db, 'learningSteps', step.id))} className="absolute top-2 right-2 p-1.5 text-red-300 hover:text-red-500 rounded transition-colors"><Trash2 c="w-4 h-4" /></button>}
                        
                        <div className="flex items-center space-x-2">
                          <div className="font-black text-gray-400 text-lg w-5">{index + 1}.</div>
                          <div className="flex flex-1 gap-2 pr-6">
                            <input type="text" defaultValue={step.title} disabled={!canEdit} onBlur={e => updateDoc(doc(db, 'learningSteps', step.id), { title: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded font-bold text-gray-800 bg-white disabled:bg-gray-100 disabled:text-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="請輸入標題"/>
                            {canEdit && (
                              <select value={step.status || 'locked'} onChange={e => updateDoc(doc(db, 'learningSteps', step.id), { status: e.target.value })} className="p-1 border border-gray-300 rounded bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 text-gray-700">
                                <option value="completed">已完成</option><option value="current">進行中</option><option value="locked">未解鎖</option>
                              </select>
                            )}
                          </div>
                        </div>
                        
                        <div className="pl-7">
                          <textarea defaultValue={step.description} disabled={!canEdit} onBlur={e => updateDoc(doc(db, 'learningSteps', step.id), { description: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-500 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="請輸入學習內容或規範說明..." rows="3"/>
                        </div>
                        
                        <div className="pl-7 flex items-center space-x-3 mt-1">
                          {canEdit ? (
                            <>
                              <label className={`flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs font-bold shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <UploadCloud c="w-4 h-4 mr-1.5 text-indigo-500" />{isUploading ? '上傳中...' : '上傳相片/影片'}
                                <input type="file" accept="image/*,video/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(step.id, e)} />
                              </label>
                              <span className="text-xs text-gray-500 truncate max-w-[150px]">{step.fileName || (step.mediaUrl ? '已上傳檔案' : '尚未上傳檔案')}</span>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2 text-xs font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 text-gray-500 w-full">
                              <UploadCloud c="w-4 h-4 text-gray-400" /><span className="truncate">{step.fileName || (step.mediaUrl ? '已包含媒體檔案' : '無附加媒體檔案')}</span>
                            </div>
                          )}
                        </div>

                        {step.mediaUrl && canEdit && (
                          <div className="pl-7 mt-2 relative inline-block">
                            {step.mediaUrl.match(/\.(mp4|webm|ogg|MOV|m4v)/i) || (step.mediaUrl.includes('firebasestorage') && step.mediaUrl.includes('media%2F')) ? (
                              <video src={step.mediaUrl} controls className="max-h-32 rounded border border-gray-200" />
                            ) : ( <img src={step.mediaUrl} className="max-h-32 object-contain rounded border border-gray-200" alt="預覽" /> )}
                            <button onClick={() => updateDoc(doc(db, 'learningSteps', step.id), { mediaUrl: '', fileName: '' })} className="absolute top-1 right-1 bg-red-500/90 text-white px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm">移除</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {!canEdit && showManagerLearning && (
                      <button onClick={() => setShowManagerLearning(false)} className="w-full text-gray-400 hover:text-gray-600 py-2 text-xs font-bold transition-colors text-center">▲ 收起學習內容</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 工作項目管理 */}
          {activeTab === 'tasks' && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="font-bold text-gray-800 text-lg">工作項目管理</h2></div>
              </div>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 text-xs">
                    <th className="p-3 font-bold">追蹤名稱</th><th className="p-3 font-bold w-20">總次數</th>{canEdit && <th className="p-3 font-bold text-right w-12">刪除</th>}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} className="border-b border-gray-100">
                      <td className="p-2"><input type="text" defaultValue={task.name} disabled={!canEdit} onBlur={e => updateDoc(doc(db, 'tasks', task.id), { name: e.target.value })} className="w-full p-2 border border-gray-200 rounded text-sm font-medium focus:border-indigo-500 outline-none bg-white disabled:bg-transparent disabled:border-transparent"/></td>
                      <td className="p-2"><input type="number" defaultValue={task.count} disabled={!canEdit} onBlur={e => updateDoc(doc(db, 'tasks', task.id), { count: parseInt(e.target.value)||0 })} className="w-full p-2 border border-gray-200 rounded text-sm font-bold text-indigo-600 focus:border-indigo-500 outline-none bg-white disabled:bg-transparent disabled:border-transparent text-center"/></td>
                      {canEdit && <td className="p-2 text-right"><button onClick={async () => await deleteDoc(doc(db, 'tasks', task.id))} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 c="w-4 h-4" /></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {canEdit && <button onClick={async () => await addDoc(collection(db, 'tasks'), { name: '新項目', count: 0, createdAt: Date.now() })} className="mt-4 flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-bold p-2 text-xs bg-indigo-50 rounded-lg"><PlusCircle c="w-4 h-4" /><span>新增工作項目</span></button>}
            </div>
          )}
          
          {/* TAB 3: 人員與門店管理 */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* 人員註冊審核 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4 flex items-center text-blue-600"><User c="w-5 h-5 mr-2" />新進人員審核 ({pendingAccounts.length})</h2>
                {pendingAccounts.length === 0 ? <p className="text-xs text-gray-400 text-center py-4 font-medium">目前無待審核名單</p> : (
                  <div className="space-y-3">
                    {pendingAccounts.map(pa => (
                      <div key={pa.id} className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-start mb-3 pl-1">
                          <div><h4 className="font-bold text-gray-800 text-sm">{pa.name}</h4><p className="text-[10px] text-gray-500 font-medium mt-1">{pa.store} | {pa.requestedRole}</p></div>
                        </div>
                        <div className="flex gap-2 pl-1">
                          <button onClick={async () => {
                            await deleteDoc(doc(db, 'pendingAccounts', pa.id));
                            await addDoc(collection(db, 'employees'), { name: pa.name, role: pa.requestedRole, store: pa.store, completedLearning: 0, tasksDetail: [], createdAt: Date.now() });
                            showToast('已加入名單！');
                          }} className="flex-1 bg-blue-600 text-white py-2 rounded-md text-xs font-bold shadow-sm">核准開通</button>
                          <button onClick={async () => await deleteDoc(doc(db, 'pendingAccounts', pa.id))} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-xs font-bold">拒絕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 門店管理 (僅總部顯示) */}
              {canEdit && (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="font-bold mb-4 flex items-center text-gray-800"><Store c="w-4 h-4 mr-2 text-indigo-500" />門店類別設定</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {stores.map(s => (
                      <span key={s.id} className="bg-gray-50 text-gray-700 px-3 py-1 rounded border border-gray-200 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        {s.name}
                        <button onClick={()=>deleteDoc(doc(db,'stores',s.id))} className="text-gray-400 hover:text-red-500"><XCircle c="w-3.5 h-3.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" id="ns" className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="新增門店..." />
                    <button onClick={async () => { const i = document.getElementById('ns'); if(i.value) { await addDoc(collection(db, 'stores'), { name: i.value, createdAt: Date.now() }); i.value = ''; } }} className="bg-indigo-600 text-white px-4 rounded-lg text-xs font-bold shadow-sm">新增</button>
                  </div>
                </div>
              )}

              {/* 已開通人員名單 (支援編輯與刪除) */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                 <h2 className="font-bold mb-4 flex items-center text-gray-800"><User c="w-4 h-4 mr-2 text-indigo-500" />人員名單 ({employees.length})</h2>
                 <div className="space-y-4">
                    {employees.map(emp => {
                      const totalTasks = emp.tasksDetail?.reduce((sum, t) => sum + t.count, 0) || 0;
                      return (
                        <div key={emp.id} className={`bg-white rounded-xl shadow-sm border p-1 relative flex flex-col ${getCardGlowClass(emp.role)}`}>
                          
                          {/* 編輯模式表單 */}
                          {editingEmployeeId === emp.id ? (
                            <div className="flex flex-col space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-inner">
                               <div>
                                 <label className="text-[10px] font-bold text-blue-600 mb-1 block">員工姓名</label>
                                 <input type="text" value={editEmployeeData.name} onChange={(e) => setEditEmployeeData({...editEmployeeData, name: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800" placeholder="修改員工姓名"/>
                               </div>
                               <div>
                                 <label className="text-[10px] font-bold text-blue-600 mb-1 block">所屬門店</label>
                                 <select value={editEmployeeData.store} onChange={(e) => setEditEmployeeData({...editEmployeeData, store: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800">
                                   {stores.map(store => <option key={store.id} value={store.name}>{store.name}</option>)}
                                 </select>
                               </div>
                               <div>
                                 <label className="text-[10px] font-bold text-blue-600 mb-1 block">職位權限</label>
                                 <select value={editEmployeeData.role} onChange={(e) => setEditEmployeeData({...editEmployeeData, role: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800">
                                   {['店長', '副店長', '組長', '儲備', '正職', '兼職', '實習正職', '實習兼職'].map(role => <option key={role} value={role}>{role}</option>)}
                                 </select>
                               </div>
                               <div className="flex space-x-3 mt-2 pt-2 border-t border-blue-200">
                                 <button onClick={() => setEditingEmployeeId(null)} className="flex-1 py-2.5 bg-white text-gray-500 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">取消</button>
                                 <button onClick={() => saveEditEmployee(emp.id)} className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">儲存變更</button>
                               </div>
                            </div>
                          ) : (
                            /* 正常卡片顯示 */
                            <>
                              <div className="flex justify-between items-start mb-4 p-3 z-10">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 shadow-inner">
                                    <User c="w-5 h-5 text-gray-400" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-gray-800 text-base leading-tight mb-1">{emp.name}</h3>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] text-gray-500 font-medium">{emp.store}</span>
                                      <RoleBadge role={emp.role} />
                                    </div>
                                  </div>
                                </div>
                                {canEdit && (
                                  <div className="flex items-center space-x-1">
                                    <button onClick={() => startEditEmployee(emp)} className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-gray-100 rounded transition-colors" title="編輯人員"><Edit c="w-4 h-4" /></button>
                                    <button onClick={async () => await deleteDoc(doc(db, 'employees', emp.id))} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors" title="刪除人員"><Trash2 c="w-4 h-4" /></button>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-center px-1 z-10">
                                <div className="text-center flex-1 flex flex-col justify-center bg-indigo-50/50 py-2 rounded-lg border border-indigo-50">
                                  <p className="text-[10px] text-gray-500 font-bold mb-1">等級</p>
                                  <p className="text-sm font-black text-indigo-600">Lv. {Math.floor((emp.completedLearning || 0) / learningLevelUpThreshold)} <span className="text-[9px] text-indigo-400 font-bold ml-0.5">({emp.completedLearning || 0}項)</span></p>
                                </div>
                                <div className="w-px h-8 bg-gray-100 mx-3"></div>
                                <div className="text-center flex-1 flex flex-col justify-center bg-blue-50/50 py-2 rounded-lg border border-blue-50">
                                  <p className="text-[10px] text-gray-500 font-bold mb-1">工作次數總計</p>
                                  <p className="text-sm font-black text-blue-600">{totalTasks} 次</p>
                                </div>
                              </div>

                              {emp.tasksDetail && emp.tasksDetail.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-100 p-2.5 mt-3 z-10 shadow-sm mx-1 mb-1">
                                   <p className="text-[10px] text-gray-400 font-bold mb-1.5">依據工作項目統計：</p>
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

        {/* 底部導覽列 */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe shadow-lg z-30">
          <button onClick={() => setActiveTab('learning')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'learning' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <BookOpen c={`w-5 h-5 ${activeTab === 'learning' ? 'fill-indigo-50' : ''}`} /><span className="text-[10px] font-bold">審核管理</span>
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'tasks' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <ListTodo c={`w-5 h-5 ${activeTab === 'tasks' ? 'fill-indigo-50' : ''}`} /><span className="text-[10px] font-bold">工作項目</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <User c={`w-5 h-5 ${activeTab === 'profile' ? 'fill-indigo-50' : ''}`} /><span className="text-[10px] font-bold">人員門店</span>
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
