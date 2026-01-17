
import React, { useState, useEffect, useCallback } from 'react';
import { Header, FooterNav } from './components/Layout';
import { TaskBoard } from './components/TaskBoard';
import { Wallet } from './components/Wallet';
import { ReferralCenter } from './components/ReferralCenter';
import { VipCenter } from './components/VipCenter';
import { AdminPanel } from './components/AdminPanel';
import { AdSlot } from './components/AdSlot';
import { GeminiAssistant } from './components/GeminiAssistant';
import { AdPromotionCenter } from './components/AdPromotionCenter';
import { Auth } from './components/Auth';
import { Toast } from './components/Toast';
import { UserState, HistoryItem, Task, BannerAd, SupportMessage, UserAd, ToastMessage, ToastType } from './types';

const VIP_LEVELS = [
  { id: 1, name: 'Free Tier', price: 0, multiplier: 1, color: 'border-slate-200' },
  { id: 2, name: 'VIP Basic', price: 5, multiplier: 1.5, color: 'border-indigo-300' },
  { id: 3, name: 'VIP Gold', price: 12, multiplier: 2.5, color: 'border-yellow-400' },
  { id: 4, name: 'VIP Diamond', price: 25, multiplier: 5, color: 'border-cyan-400' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [user, setUser] = useState<UserState | null>(() => {
    const saved = localStorage.getItem('ge_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tempUser, setTempUser] = useState<UserState | null>(null);

  const [allUsers, setAllUsers] = useState<UserState[]>(() => {
    const saved = localStorage.getItem('ge_all_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [userAdRequests, setUserAdRequests] = useState<UserAd[]>(() => {
    const saved = localStorage.getItem('ge_user_ad_reqs');
    return saved ? JSON.parse(saved) : [];
  });

  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
    username: user?.username || ''
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ge_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [bannerAds, setBannerAds] = useState<BannerAd[]>(() => {
    const saved = localStorage.getItem('ge_banners');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('ge_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() => {
    const saved = localStorage.getItem('ge_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [isConfetti, setIsConfetti] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ge_active_user', JSON.stringify(user));
      setAllUsers(prev => {
        const index = prev.findIndex(u => u.username === user.username);
        if (index === -1) return [...prev, user];
        const updated = [...prev];
        updated[index] = user;
        return updated;
      });
    } else {
      localStorage.removeItem('ge_active_user');
    }
    localStorage.setItem('ge_tasks', JSON.stringify(tasks));
    localStorage.setItem('ge_banners', JSON.stringify(bannerAds));
    localStorage.setItem('ge_history', JSON.stringify(history));
    localStorage.setItem('ge_messages', JSON.stringify(supportMessages));
    localStorage.setItem('ge_all_users', JSON.stringify(allUsers));
    localStorage.setItem('ge_user_ad_reqs', JSON.stringify(userAdRequests));
  }, [user, tasks, bannerAds, history, supportMessages, allUsers, userAdRequests]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAuthSuccess = (authUser: UserState) => {
    if (authUser.isBanned) {
      showToast('This account has been banned by the administrator.', 'error');
      return;
    }
    setUser(authUser);
    setTempUser(null);
    setEditForm({ name: authUser.name, avatar: authUser.avatar, username: authUser.username });
    showToast(`Welcome, ${authUser.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('home');
    setIsAdminAuthenticated(false);
    showToast('Logged out successfully', 'info');
  };

  const openBotForCode = (tUser: UserState) => {
    setTempUser(tUser);
    setIsBotOpen(true);
    showToast('Verification code sent to EarnBot', 'info');
  };

  const onUpdateUser = (username: string, updates: Partial<UserState>) => {
    const updatedUsers = allUsers.map(u => u.username === username ? { ...u, ...updates } : u);
    setAllUsers(updatedUsers);
    
    // If the updated user is currently logged in, sync their local state
    if (user && user.username === username) {
      setUser({ ...user, ...updates });
    }

    if (updates.isBanned !== undefined) {
      showToast(`User @${username} has been ${updates.isBanned ? 'banned' : 'unbanned'}.`, updates.isBanned ? 'error' : 'success');
    } else if (updates.level !== undefined) {
      showToast(`VIP Level for @${username} updated to ${VIP_LEVELS.find(l => l.id === updates.level)?.name}.`, 'success');
    } else {
      showToast(`User @${username} data updated.`, 'info');
    }
  };

  const completeTask = (reward: number) => {
    const currentLevel = VIP_LEVELS.find(l => l.id === user?.level) || VIP_LEVELS[0];
    const actualReward = reward * currentLevel.multiplier;

    setUser(prev => prev ? ({
      ...prev,
      balance: prev.balance + actualReward,
      tasksCompleted: prev.tasksCompleted + 1,
    }) : null);

    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      action: 'Ad Reward',
      amount: actualReward,
      type: 'earn',
      timestamp: new Date().toLocaleString(),
      status: 'completed',
    };
    setHistory(prev => [newItem, ...prev]);
    
    setIsConfetti(true);
    setTimeout(() => setIsConfetti(false), 2000);
    showToast(`Congrats! You earned $${actualReward.toFixed(3)}.`, 'success');
  };

  const handleTransaction = (amount: number, type: 'deposit' | 'withdraw', method: string, fee: number = 0) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      action: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} (${method})`,
      amount: amount,
      fee: fee,
      type: type,
      timestamp: new Date().toLocaleString(),
      status: 'pending',
    };
    setHistory(prev => [newItem, ...prev]);
    if (type === 'withdraw') {
      setUser(prev => prev ? ({ ...prev, balance: prev.balance - (amount + fee) }) : null);
      showToast('Withdrawal request successful', 'success');
    } else {
      showToast('Deposit request is pending verification', 'warning');
    }
  };

  const approveTransaction = (id: string) => {
    setHistory(prev => prev.map(item => {
      if (item.id === id) {
        if (item.type === 'deposit' && item.status === 'pending') {
          setUser(u => u ? ({ ...u, balance: u.balance + item.amount }) : null);
        }
        return { ...item, status: 'completed' };
      }
      return item;
    }));
    showToast('Transaction approved successfully', 'success');
  };

  const contactAdmin = (text: string) => {
    const newMsg: SupportMessage = {
      id: `msg_${Date.now()}`,
      senderName: user?.name + ' (@' + user?.username + ')',
      text: text,
      timestamp: new Date().toLocaleString(),
      type: 'support'
    };
    setSupportMessages(prev => [newMsg, ...prev]);
    showToast('Message sent to admin inbox', 'success');
  };

  const submitUserAd = (title: string, url: string) => {
    const newAd: UserAd = {
      id: `user_req_${Date.now()}`,
      submittedBy: user?.username || '',
      title: title,
      url: url,
      status: 'pending',
      timestamp: new Date().toLocaleString()
    };
    setUserAdRequests(prev => [newAd, ...prev]);
    showToast('Your ad submission is in review', 'info');
  };

  const approveUserAd = (adId: string) => {
    const req = userAdRequests.find(r => r.id === adId);
    if (!req) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: req.title,
      description: `User-submitted ad from @${req.submittedBy}`,
      reward: 0.001,
      category: 'click',
      icon: '🔗',
      adUrl: req.url
    };
    setTasks(prev => [newTask, ...prev]);
    setUserAdRequests(prev => prev.map(r => r.id === adId ? { ...r, status: 'approved' } : r));
    showToast('User ad successfully published', 'success');
  };

  const rejectUserAd = (adId: string) => {
    setUserAdRequests(prev => prev.map(r => r.id === adId ? { ...r, status: 'rejected' } : r));
    showToast('Ad submission rejected', 'warning');
  };

  const upgradeVip = (levelId: number, price: number) => {
    if (!user || user.balance < price) {
      showToast('Something went wrong: Insufficient balance', 'error');
      return;
    }
    setUser(prev => prev ? ({ ...prev, balance: prev.balance - price, level: levelId }) : null);
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      action: `Upgrade: ${VIP_LEVELS.find(l => l.id === levelId)?.name}`,
      amount: -price,
      type: 'withdraw',
      timestamp: new Date().toLocaleString(),
      status: 'completed',
    };
    setHistory(prev => [newItem, ...prev]);
    showToast('Congratulations! VIP level upgraded.', 'success');
  };

  const handleUpdateProfile = () => {
    setUser(prev => prev ? ({ ...prev, name: editForm.name, avatar: editForm.avatar, username: editForm.username }) : null);
    setIsEditModalOpen(false);
    showToast('Profile updated successfully', 'success');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '@Team#(12)') {
      setIsAdminAuthenticated(true);
      setAdminPassword('');
      showToast('Admin access granted', 'success');
    } else {
      showToast('Something went wrong: Incorrect password', 'error');
      setAdminPassword('');
    }
  };

  // Global Ban Screen
  if (user && user.isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50 p-6">
        <div className="glass-morphism w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-rose-200 bg-white text-center space-y-6">
          <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-5xl">🚫</div>
          <h2 className="text-3xl font-black text-rose-800 tracking-tight">Access Denied</h2>
          <div className="space-y-2">
            <p className="text-slate-600 font-medium">Your account <b>@{user.username}</b> has been suspended for violating our terms of service.</p>
            <p className="text-slate-400 text-xs italic">If you believe this is a mistake, please contact support via the EarnBot on the login screen.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-slate-800 text-white font-black rounded-2xl active:scale-95 transition-all"
          >
            LOGOUT
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onAuthSuccess={handleAuthSuccess} existingUsers={allUsers} onOpenBot={openBotForCode} showToast={showToast} />
        <GeminiAssistant 
          balance={0} 
          onContactAdmin={() => {}} 
          tempUser={tempUser} 
          isOpen={isBotOpen}
          setIsOpen={setIsBotOpen}
        />
        <Toast toasts={toasts} onClose={closeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-x-hidden bg-slate-50 selection:bg-indigo-100">
      <Toast toasts={toasts} onClose={closeToast} />
      
      {isConfetti && <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"><div className="text-6xl animate-bounce">💰</div></div>}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-800">Edit Profile</h3><button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 font-bold p-2">✕</button></div>
            <div className="space-y-4">
              <input className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold" placeholder="Username" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
              <input className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold" placeholder="Full Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              <input className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-medium text-sm" placeholder="Avatar URL" value={editForm.avatar} onChange={e => setEditForm({...editForm, avatar: e.target.value})} />
              <button onClick={handleUpdateProfile} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <Header balance={user.balance} name={user.name} avatar={user.avatar} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="glass-morphism p-8 rounded-[2rem] relative overflow-hidden border-indigo-100">
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                <div className="relative cursor-pointer group">
                  <div className="w-28 h-28 rounded-full border-2 border-indigo-500 p-1 bg-white shadow-xl shadow-indigo-200 transition-transform"><img src={user.avatar} className="w-full h-full rounded-full object-cover" /></div>
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white text-[10px] font-black text-white">LV{user.level}</div>
                  <button onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }} className="absolute -top-1 -right-1 bg-white w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 shadow-md text-slate-600 hover:text-indigo-600">✏️</button>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">{user.name}</h2>
                  <p className="text-indigo-600 font-black text-sm mt-1">@{user.username}</p>
                  <p className="text-slate-500 mt-2 font-medium">VIP Status: <span className="text-indigo-600 font-black">{VIP_LEVELS.find(l => l.id === user.level)?.name}</span></p>
                  <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
                    <button onClick={() => setActiveTab('vip')} className="px-6 py-2.5 bg-indigo-600 rounded-2xl text-xs font-black text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105">VIP Center</button>
                    <button onClick={handleLogout} className="px-6 py-2.5 bg-white rounded-2xl text-xs font-black text-rose-600 border border-rose-100 shadow-sm">Logout</button>
                  </div>
                </div>
              </div>
            </div>

            {bannerAds.length > 0 && <div className="space-y-2"><p className="text-[8px] text-center font-black text-slate-300 uppercase tracking-[0.3em]">Sponsored</p><AdSlot code={bannerAds[0].code} /></div>}

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="glass-morphism p-6 rounded-3xl bg-white shadow-sm"><p className="text-[10px] text-slate-500 font-black uppercase mb-1">Total Assets</p><h4 className="text-2xl font-black text-emerald-600">${user.balance.toFixed(3)}</h4></div>
              <div className="glass-morphism p-6 rounded-3xl bg-white shadow-sm"><p className="text-[10px] text-slate-500 font-black uppercase mb-1">Tasks Completed</p><h4 className="text-2xl font-black text-indigo-600">{user.tasksCompleted}</h4></div>
            </div>

            <section className="space-y-4">
              <div className="flex justify-between items-center px-2"><h3 className="text-xl font-black text-slate-800">Earning Feed</h3><span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">New Ads Live</span></div>
              <TaskBoard tasks={tasks} onCompleteTask={completeTask} />
            </section>
          </div>
        )}

        {activeTab === 'promote' && <AdPromotionCenter username={user.username} isVip={user.level > 1} onSubmitAd={submitUserAd} showToast={showToast} />}
        {activeTab === 'tasks' && <div className="space-y-6"><h2 className="text-3xl font-black text-slate-800 px-2">Ad Feed</h2>{bannerAds.length > 1 ? <AdSlot code={bannerAds[1].code} /> : (bannerAds.length > 0 && <AdSlot code={bannerAds[0].code} />)}<TaskBoard tasks={tasks} onCompleteTask={completeTask} /></div>}
        {activeTab === 'vip' && <VipCenter currentLevel={user.level} onUpgrade={upgradeVip} levels={VIP_LEVELS} />}
        
        {activeTab === 'admin' && (
          !isAdminAuthenticated ? (
            <div className="max-w-md mx-auto py-12">
              <div className="glass-morphism p-8 rounded-[2.5rem] bg-white text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">🔒</div>
                <h2 className="text-2xl font-black text-slate-800">Admin Login</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input type="password" placeholder="Enter Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-center font-bold tracking-widest" />
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20">Unlock Admin Panel</button>
                </form>
              </div>
            </div>
          ) : (
            <AdminPanel 
              tasks={tasks} bannerAds={bannerAds} history={history} messages={supportMessages} users={allUsers} userAdRequests={userAdRequests}
              onAddTask={(t) => { setTasks(prev => [...prev, t]); showToast('Task added successfully', 'success'); }} 
              onDeleteTask={(id) => { setTasks(prev => prev.filter(t => t.id !== id)); showToast('Task deleted', 'info'); }} 
              onAddBanner={(b) => { setBannerAds(prev => [...prev, b]); showToast('Banner added', 'success'); }} 
              onDeleteBanner={(id) => { setBannerAds(prev => prev.filter(b => b.id !== id)); showToast('Banner deleted', 'info'); }} 
              onDeleteMessage={(id) => { setSupportMessages(prev => prev.filter(m => m.id !== id)); showToast('Message deleted', 'info'); }} 
              onApproveTransaction={approveTransaction}
              onApproveUserAd={approveUserAd} onRejectUserAd={rejectUserAd}
              onUpdateUser={onUpdateUser}
            />
          )
        )}
        
        {activeTab === 'wallet' && <Wallet balance={user.balance} history={history} onTransaction={handleTransaction} showToast={showToast} />}
      </main>

      <GeminiAssistant 
        balance={user.balance} 
        onContactAdmin={contactAdmin} 
        isOpen={isBotOpen}
        setIsOpen={setIsBotOpen}
      />
      <FooterNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
