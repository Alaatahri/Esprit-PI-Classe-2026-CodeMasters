'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      setStatus('error'); return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      setStatus('error'); return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) setStatus('success');
      else { setErrorMsg(data.message || 'Lien invalide ou expiré.'); setStatus('error'); }
    } catch { setErrorMsg('Une erreur est survenue.'); setStatus('error'); }
  };

  if (!token) return (
    <div style={{ minHeight:'100vh', background:'#0f0f1a', display:'flex',
      alignItems:'center', justifyContent:'center', color:'#fff' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:'40px' }}>❌</p>
        <p style={{ color:'#e74c3c' }}>Lien invalide ou manquant.</p>
        <a href="/forgot-password" style={{ color:'#F5A623', marginTop:'12px',
          display:'inline-block' }}>Redemander un lien</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0f0f1a', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1a1a2e', padding:'40px', borderRadius:'12px',
        width:'100%', maxWidth:'440px', color:'#fff' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <h2 style={{ color:'#F5A623', margin:'0 0 8px' }}>Nouveau mot de passe</h2>
          <p style={{ color:'#aaa', fontSize:'14px', margin:0 }}>
            Choisissez un nouveau mot de passe sécurisé.
          </p>
        </div>
        {status === 'success' ? (
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:'48px', margin:'0 0 16px' }}>✅</p>
            <p style={{ marginBottom:'20px' }}>Mot de passe modifié avec succès !</p>
            <a href="/login" style={{ display:'inline-block', background:'#F5A623',
              color:'#fff', padding:'12px 28px', borderRadius:'8px',
              textDecoration:'none', fontWeight:'bold' }}>
              Se connecter
            </a>
          </div>
        ) : (
          <>
            <label style={{ fontSize:'13px', color:'#ccc' }}>
              Nouveau mot de passe
            </label>
            <div style={{ position:'relative', margin:'8px 0 16px' }}>
              <input type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setStatus('idle'); }}
                placeholder="6 caractères minimum"
                style={{ width:'100%', padding:'12px 40px 12px 12px',
                  background:'#2a2a3e', border:'1px solid #3a3a5e',
                  borderRadius:'8px', color:'#fff', boxSizing:'border-box' }} />
              <span onClick={() => setShowNew(!showNew)}
                style={{ position:'absolute', right:'12px', top:'50%',
                  transform:'translateY(-50%)', cursor:'pointer', fontSize:'16px' }}>
                {showNew ? '🙈' : '👁️'}
              </span>
            </div>
            <label style={{ fontSize:'13px', color:'#ccc' }}>
              Confirmer le mot de passe
            </label>
            <div style={{ position:'relative', margin:'8px 0 16px' }}>
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setStatus('idle'); }}
                placeholder="Répétez le mot de passe"
                style={{ width:'100%', padding:'12px 40px 12px 12px',
                  background:'#2a2a3e', border:'1px solid #3a3a5e',
                  borderRadius:'8px', color:'#fff', boxSizing:'border-box' }} />
              <span onClick={() => setShowConfirm(!showConfirm)}
                style={{ position:'absolute', right:'12px', top:'50%',
                  transform:'translateY(-50%)', cursor:'pointer', fontSize:'16px' }}>
                {showConfirm ? '🙈' : '👁️'}
              </span>
            </div>
            {status === 'error' && (
              <p style={{ color:'#e74c3c', fontSize:'13px', marginBottom:'12px' }}>
                {errorMsg}
              </p>
            )}
            <button onClick={handleSubmit} disabled={status === 'loading'}
              style={{ width:'100%', padding:'13px', background:'#F5A623',
                border:'none', borderRadius:'8px', color:'#fff', fontWeight:'bold',
                cursor:'pointer', fontSize:'15px',
                opacity: status === 'loading' ? 0.7 : 1 }}>
              {status === 'loading' ? 'Mise à jour...' : 'Changer mon mot de passe'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

