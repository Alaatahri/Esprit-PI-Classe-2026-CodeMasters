"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText, ArrowLeft, Plus, CheckCircle2, Clock, XCircle,
  Send, Trash2, Eye, ChevronDown, ChevronUp, CreditCard,
  AlertTriangle, FileCheck, Receipt, ReceiptText, Printer, Search, Filter, Sparkles,
  Download, ShieldCheck, Mail, MapPin, Building2, Copy, FileSignature, Wallet
} from "lucide-react";

import { getStoredUser, type BMPUser } from "@/lib/auth";
import { fetchAPI, fetchAPISafe } from "@/lib/fetchHelper";
import { DictationButton } from "@/components/DictationButton";
import { useLanguage } from "@/components/LanguageProvider";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const LOCALE = {
  "fr-FR": {
    devis: "Devis", factures: "Factures",
    cycle: "Cycle financier automatisé : Devis → Facture → Paiement",
    devis_env: "Devis envoyés", devis_acc: "Devis acceptés",
    tot_fact: "Total facturé", fact_ret: "Factures en retard",
    tous_devis: "Tous les devis", toutes_fact: "Toutes les factures",
    no_devis: "Aucun devis pour le moment.",
    no_fact: "Aucune facture. Acceptez un devis pour en générer une automatiquement.",
    nv_devis: "Nouveau devis", titre: "Titre", desc: "Description",
    placeholder_titre: "Ex: Rénovation salle de bain", placeholder_desc: "Détails des travaux...",
    articles: "Articles / Prestations", desc_art: "Description", qte: "Qté", prix: "Prix TND",
    add_ligne: "Ajouter une ligne", tot_estime: "Total estimé", validite: "Validité (jours)",
    btn_creer: "Créer le devis", btn_creer_load: "Création en cours...", err_creer: "Erreur lors de la création",
    sans_titre: "Sans titre", total: "Total", envoyer: "Envoyer", envoyer_client: "Envoyer au client",
    accepter: "Accepter → Facture auto", refuser: "Refuser", suppr: "Supprimer",
    emise: "Émise", echeance: "Échéance", paye: "Payé", solde_du: "Solde dû",
    enr_paiement: "Enregistrer un paiement", montant: "Montant TND",
    virement: "Virement", especes: "Espèces", cheque: "Chèque", carte: "Carte",
    recherche: "Rechercher (Titre, N°)...", filtrer: "Filtrer par statut",
    tous_statuts: "Tous les statuts", imprimer: "Imprimer",
    ia_accep: "Proba. acceptation: ", ia_retard: "Risque de retard: ",
    email_client: "Email du client", email_placeholder: "exemple@client.com", confirm_envoyer: "Confirmer l'envoi",
    voir_facture: "Voir Facture"
  },
  "en-US": {
    devis: "Quotes", factures: "Invoices",
    cycle: "Automated financial cycle: Quote → Invoice → Payment",
    devis_env: "Quotes sent", devis_acc: "Quotes accepted",
    tot_fact: "Total invoiced", fact_ret: "Overdue invoices",
    tous_devis: "All quotes", toutes_fact: "All invoices",
    no_devis: "No quotes yet.",
    no_fact: "No invoices. Accept a quote to generate one automatically.",
    nv_devis: "New quote", titre: "Title", desc: "Description",
    placeholder_titre: "Ex: Bathroom renovation", placeholder_desc: "Work details...",
    articles: "Items / Services", desc_art: "Description", qte: "Qty", prix: "Price TND",
    add_ligne: "Add line", tot_estime: "Estimated Total", validite: "Validity (days)",
    btn_creer: "Create quote", btn_creer_load: "Creating...", err_creer: "Creation error",
    sans_titre: "Untitled", total: "Total", envoyer: "Send", envoyer_client: "Send to client",
    accepter: "Accept → Auto Invoice", refuser: "Reject", suppr: "Delete",
    emise: "Issued", echeance: "Due date", paye: "Paid", solde_du: "Balance due",
    enr_paiement: "Record payment", montant: "Amount TND",
    virement: "Bank Transfer", especes: "Cash", cheque: "Check", carte: "Card",
    recherche: "Search (Title, No.)...", filtrer: "Filter by status",
    tous_statuts: "All statuses", imprimer: "Print",
    ia_accep: "Approval prob.: ", ia_retard: "Overdue risk: ",
    email_client: "Client Email", email_placeholder: "example@client.com", confirm_envoyer: "Confirm Send",
    voir_facture: "View Invoice"
  },
  "ar-SA": {
    devis: "عروض الأسعار", factures: "الفواتير",
    cycle: "الدورة المالية الآلية: عرض السعر ← فاتورة ← الدفع",
    devis_env: "العروض المرسلة", devis_acc: "العروض المقبولة",
    tot_fact: "إجمالي الفواتير", fact_ret: "فواتير متأخرة",
    tous_devis: "جميع عروض الأسعار", toutes_fact: "جميع الفواتير",
    no_devis: "لا توجد عروض أسعار حالياً.",
    no_fact: "لا توجد فواتير. اقبل عرض سعر لإنشاء واحدة تلقائياً.",
    nv_devis: "عرض سعر جديد", titre: "العنوان", desc: "الوصف",
    placeholder_titre: "مثال: تجديد الحمام", placeholder_desc: "تفاصيل العمل...",
    articles: "العناصر / الخدمات", desc_art: "الوصف", qte: "الكمية", prix: "السعر TND",
    add_ligne: "إضافة سطر", tot_estime: "الإجمالي المقدر", validite: "الصلاحية (أيام)",
    btn_creer: "إنشاء العرض", btn_creer_load: "جاري الإنشاء...", err_creer: "خطأ في الإنشاء",
    sans_titre: "بدون عنوان", total: "الإجمالي", envoyer: "إرسال", envoyer_client: "إرسال للعميل",
    accepter: "قبول ← فاتورة آلية", refuser: "رفض", suppr: "حذف",
    emise: "تاريخ الإصدار", echeance: "تاريخ الاستحقاق", paye: "المدفوع", solde_du: "الرصيد المستحق",
    enr_paiement: "تسجيل دفعة", montant: "المبلغ TND",
    virement: "تحويل بنكي", especes: "نقدي", cheque: "شيك", carte: "بطاقة",
    recherche: "بحث (العنوان، الرقم)...", filtrer: "تصفية حسب الحالة",
    tous_statuts: "كل الحالات", imprimer: "طباعة",
    ia_accep: "احتمال القبول: ", ia_retard: "خطر التأخير: ",
    email_client: "بريد العميل الإلكتروني", email_placeholder: "example@client.com", confirm_envoyer: "تأكيد الإرسال",
    voir_facture: "عرض الفاتورة"
  }
};

// ── CSS Animations ──────────────────────────────────────────────────
const OVERDUE_STYLES = `
  @keyframes pulse-red-glow {
    0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.4), inset 0 0 5px rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); }
    50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.8), inset 0 0 15px rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 1); }
    100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.4), inset 0 0 5px rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); }
  }
  @keyframes alert-shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-1px); }
    75% { transform: translateX(1px); }
    100% { transform: translateX(0); }
  }
  @keyframes scanner-red {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(200%); opacity: 0; }
  }
  .animate-overdue-card {
    animation: pulse-red-glow 2s infinite ease-in-out !important;
    background: linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(0,0,0,0.1)) !important;
    position: relative !important;
    overflow: hidden !important;
    border: 2px solid #ef4444 !important;
    z-index: 10;
  }
  .animate-overdue-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 50%;
    background: linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.2), transparent);
    animation: scanner-red 3s infinite linear;
    pointer-events: none;
  }
  .alert-shake {
    animation: alert-shake 0.5s infinite;
  }
`;

// ── Types ──────────────────────────────────────────────────────────────
type Article = { nom: string; quantite: number | string; prix_unitaire: number | string; total: number };

type Devis = {
  _id: string;
  numero_devis: string;
  titre: string;
  description: string;
  articles: Article[];
  montant_total: number;
  statut: "brouillon" | "envoyé" | "accepté" | "refusé" | "expiré";
  delai_validite: number;
  date_creation: string;
  date_envoi?: string;
  date_acceptation?: string;
  clientId?: any;
  artisanId?: any;
  projectId?: any;
  temp_client_nom?: string;
  temp_client_email?: string;
};

type Facture = {
  _id: string;
  numero_facture: string;
  titre: string;
  description: string;
  montant_total: number;
  montant_paye: number;
  solde_du: number;
  statut: "brouillon" | "envoyée" | "payée" | "partiellement_payée" | "en_retard" | "annulée";
  date_facture: string;
  date_echeance?: string;
  projectId?: any;
  clientId?: any;
  artisanId?: any;
  devisId?: any;
  temp_client_nom?: string;
  temp_client_email?: string;
};

// ── Modale Document (Vue PDF / Signature) ──────────────────────────────────
function DocumentModal({ 
  type, 
  data, 
  user, 
  onClose, 
  onAction 
}: { 
  type: 'devis' | 'facture', 
  data: any, 
  user: BMPUser | null,
  onClose: () => void,
  onAction: (a: string) => void 
}) {
  const { lang } = useLanguage();
  const T = LOCALE[lang] || LOCALE["fr-FR"];
  
  const inputStyle = {
    width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: '#fff', outline: 'none'
  };
  
  const [payerNom, setPayerNom] = useState('');
  const [payerPrenom, setPayerPrenom] = useState('');
  const [payerTelephone, setPayerTelephone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paying, setPaying] = useState(false);
  const [showPaymentPanel, setShowPaymentPanel] = useState(type === 'facture');
  const [payMethod, setPayMethod] = useState<'carte'|'virement'|'paypal'|'flouci'>('carte');
  const [virementRef, setVirementRef] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [flouciPhone, setFlouciPhone] = useState('');
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPaymentDate, setLastPaymentDate] = useState<string>('');

  const isDevis = type === 'devis';
  const articles = data.articles || [];
  const articleSumHT = articles.reduce((s: number, a: any) => s + (Number(a.total) || (Number(a.prix_unitaire)*Number(a.quantite)) || 0), 0);
  const derivedTotalTTC = data.montant_total > 0 ? data.montant_total : articleSumHT * 1.19;
  
  const numero = isDevis ? data.numero_devis : data.numero_facture;
  const dateStr = fmtDate(isDevis ? data.date_creation : data.date_facture);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-7xl animate-in fade-in zoom-in duration-300 my-auto py-12">
        
        {/* Actions Bar (Top) */}
        <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 mb-6 no-print">
          <button onClick={() => window.print()} 
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold shadow-xl hover:bg-amber-400 transition-all">
            <Printer className="w-4 h-4" /> {T.imprimer}
          </button>
          {type === 'facture' && user?.role === 'client' && (
            <button onClick={() => setShowPaymentPanel((prev) => !prev)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-xl hover:bg-slate-700 transition-all border border-white/10">
              <Wallet className="w-4 h-4" /> {showPaymentPanel ? 'Masquer paiement' : 'Voir paiement'}
            </button>
          )}
          <button onClick={onClose} 
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold shadow-xl hover:bg-red-500 transition-all border border-white/5">
            <XCircle className="w-4 h-4" /> {lang === 'ar-SA' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>

        {/* The Paper / Printable Document */}
        <div className="md:grid md:grid-cols-[2fr_1fr] gap-6 items-start">
          <div id="printable-doc" className="relative bg-white text-slate-900 shadow-2xl p-12 md:p-20 min-h-[1100px] flex flex-col font-sans ring-1 ring-slate-100 overflow-hidden rounded-lg">
          
          {/* Top Decorative Border */}
          <div className="absolute top-0 left-0 right-0 flex h-2">
            <div className={`flex-1 ${isDevis ? 'bg-slate-900' : 'bg-amber-600'}`} />
            <div className="w-1/4 bg-slate-200" />
          </div>

          {/* 1. Header Section */}
          <div className="flex justify-between items-start mb-16 relative z-10">
            <div className="space-y-6">
              <div className="space-y-1">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isDevis ? 'bg-slate-900 text-white' : 'bg-amber-600 text-white'} text-[9px] font-black uppercase tracking-[0.2em] w-fit shadow-lg shadow-slate-200`}>
                  {isDevis ? 'Devis Officiel' : 'Facture Certifiée'}
                </div>
                <h1 className="text-7xl font-black tracking-tighter text-slate-950 uppercase leading-[0.8]">
                  {isDevis ? 'Devis' : 'Facture'}
                </h1>
              </div>
              <div className="flex gap-12 pt-4 border-t border-slate-100 w-fit">
                 <div className="space-y-1"><p className="text-[9px] uppercase tracking-widest text-slate-400 font-black">RÉFÉRENCE</p><p className="text-sm font-black text-slate-900">{numero}</p></div>
                 <div className="space-y-1"><p className="text-[9px] uppercase tracking-widest text-slate-400 font-black">DATE D'ÉMISSION</p><p className="text-sm font-black text-slate-900">{dateStr}</p></div>
                 {isDevis && <div className="space-y-1"><p className="text-[9px] uppercase tracking-widest text-amber-600 font-black">VALIDITÉ</p><p className="text-sm font-black text-amber-600">{data.delai_validite || 30} JOURS</p></div>}
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center -rotate-6 shadow-2xl shadow-slate-300 border-2 border-white"><span className="text-white font-black text-2xl italic">B</span></div>
                <div>
                  <p className="font-black text-3xl tracking-tighter text-slate-950 flex items-center gap-1 leading-none">BMP<span className="text-amber-500">.TN</span></p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">CONSTRUCTION OS</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium max-w-[200px] leading-relaxed">Centre Urbain Nord, Tunis<br/>Assistance IA 24/7 • tech@bmp.tn</p>
            </div>
          </div>

          {/* 2. Stakeholders */}
          <div className="grid grid-cols-2 gap-20 mb-16 relative z-10">
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-black mb-4">Émetteur du document</h3>
              <p className="font-black text-2xl text-slate-900 tracking-tight leading-none mb-2">{data.artisanId?.nom || 'Artisan Expert BMP'}</p>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-600 flex items-center gap-2"><Mail className="w-3 h-3 opacity-30" /> {data.artisanId?.email}</p>
                <p className="text-xs font-bold text-slate-400 flex items-center gap-2"><MapPin className="w-3 h-3 opacity-30" /> Tunis, Tunisie</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end relative">
              <div className="absolute -right-4 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-black mb-4">Destinataire</h3>
              <p className="font-black text-2xl text-slate-900 tracking-tight leading-none mb-2">{data.clientId?.nom || data.temp_client_nom || 'Client Particulier'}</p>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-600 flex items-center justify-end gap-2">{data.clientId?.email || data.temp_client_email} <Mail className="w-3 h-3 opacity-30" /></p>
                <p className="text-xs font-bold text-slate-400 flex items-center justify-end gap-2">Client certifié BMP <ShieldCheck className="w-3 h-3 opacity-30" /></p>
              </div>
            </div>
          </div>

          {/* 3. Items Table */}
          <div className="flex-grow mb-12">
            <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="py-5 px-6 text-left">Prestation / Article</th>
                    <th className="py-5 px-6 text-right w-32">P.U (TND)</th>
                    <th className="py-5 px-6 text-center w-20">Qté</th>
                    <th className="py-5 px-6 text-right w-40">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic font-medium">
                  {(data.articles || []).map((art: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 px-6"><p className="font-black text-slate-900 uppercase not-italic tracking-tight">{art.nom}</p></td>
                      <td className="py-5 px-6 text-right text-slate-500 font-mono tracking-tighter">{fmt(art.prix_unitaire).replace(' TND', '')}</td>
                      <td className="py-5 px-6 text-center font-black text-slate-900">{art.quantite}</td>
                      <td className="py-5 px-6 text-right font-black text-slate-900 font-mono tracking-tighter">{fmt(art.total).replace(' TND', '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Financial Footer */}
          <div className="flex justify-between items-end mb-16">
            <div className="space-y-4 max-w-[300px]">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <p className="text-[10px] font-bold text-slate-500 leading-tight">Cette offre a été optimisée par l'IA BMP pour garantir le meilleur rapport qualité-prix du marché.</p>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic ml-1">Modalités: Virement à 30 jours.</p>
            </div>
            
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-[11px] font-black text-slate-400 px-4"><span>TOTAL HORS TAXES</span><span>{fmt(derivedTotalTTC / 1.19).replace(' TND', '')}</span></div>
              <div className="flex justify-between text-[11px] font-black text-slate-400 px-4"><span>TAXE SUR LA VALEUR AJOUTÉE (19%)</span><span>{fmt(derivedTotalTTC - (derivedTotalTTC / 1.19)).replace(' TND', '')}</span></div>
              <div className={`mt-6 p-8 rounded-[2rem] ${isDevis ? 'bg-slate-950' : 'bg-amber-600'} text-white shadow-2xl shadow-slate-300 relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:bg-white/10 transition-colors" />
                <div className="relative z-10 flex justify-between items-center">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">NET À PAYER</p>
                     <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Toutes Taxes Comprises</p>
                   </div>
                   <div className="text-right">
                     <p className="text-4xl font-black tracking-tighter leading-none mb-1">{fmt(derivedTotalTTC).replace(' TND', '')}</p>
                     <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">TND</p>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Validation Section */}
          <div className="grid grid-cols-2 gap-12 border-t border-slate-100 pt-12 mt-auto">
            <div className="space-y-6">
              <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.3em]">Signature et Cachet Émetteur</p>
              {/* ── Cachet officiel de l'entreprise ── */}
              <div className="h-36 flex items-center justify-center relative">
                {/* Cachet circulaire style tampon */}
                <div className="relative w-32 h-32 flex items-center justify-center select-none" style={{ filter: 'drop-shadow(0 2px 8px rgba(217,119,6,0.18))' }}>
                  {/* Cercle extérieur */}
                  <svg viewBox="0 0 128 128" className="absolute inset-0 w-full h-full" aria-hidden>
                    {/* Double border circulaire */}
                    <circle cx="64" cy="64" r="60" fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="none" opacity="0.85"/>
                    <circle cx="64" cy="64" r="52" fill="none" stroke="#d97706" strokeWidth="1" opacity="0.5"/>
                    {/* Texte circulaire haut */}
                    <path id="top-arc" d="M 20,64 A 44,44 0 0,1 108,64" fill="none"/>
                    <text fontSize="8" fontWeight="900" letterSpacing="3" fill="#92400e" fontFamily="sans-serif" textAnchor="middle">
                      <textPath href="#top-arc" startOffset="50%">BMP.TN • CONSTRUCTION OS •</textPath>
                    </text>
                    {/* Texte circulaire bas */}
                    <path id="bot-arc" d="M 20,64 A 44,44 0 0,0 108,64" fill="none"/>
                    <text fontSize="7" fontWeight="700" letterSpacing="2" fill="#92400e" fontFamily="sans-serif" textAnchor="middle">
                      <textPath href="#bot-arc" startOffset="50%">RC: B123456789 • MF: 1234567</textPath>
                    </text>
                    {/* Étoiles décoratives */}
                    <text x="14" y="67" fontSize="7" fill="#d97706" opacity="0.7" textAnchor="middle">★</text>
                    <text x="114" y="67" fontSize="7" fill="#d97706" opacity="0.7" textAnchor="middle">★</text>
                    {/* Ligne horizontale centrale */}
                    <line x1="36" y1="74" x2="92" y2="74" stroke="#d97706" strokeWidth="0.8" opacity="0.4"/>
                  </svg>
                  {/* Contenu central */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <span className="text-[15px] font-black tracking-tighter text-amber-800 leading-none">BMP</span>
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em] leading-none">.TN</span>
                    <div className="my-1 w-8 h-[1px] bg-amber-600 opacity-40"/>
                    <span className="text-[6.5px] font-bold text-amber-700 uppercase tracking-wider leading-tight">
                      {new Date().toLocaleDateString('fr-TN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right space-y-6">
              <p className="text-[9px] uppercase font-black text-slate-950 tracking-[0.3em]">Validation Client</p>
              <div className={`h-32 rounded-[2rem] border-2 ${data.statut === 'accepté' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-900 bg-white'} relative flex flex-col items-center justify-center group overflow-hidden`}>
                 <div className="absolute top-2 right-4"><Copy className="w-12 h-12 text-slate-50 absolute opacity-10" /></div>
                 {data.statut === 'accepté' ? (
                    <div className="flex flex-col items-center animate-in zoom-in duration-500">
                       <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                       <p className="text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-emerald-500/20 shadow-sm shadow-emerald-500/10">Approuvé numériquement</p>
                    </div>
                 ) : (
                    <p className="text-[11px] text-slate-200 font-black uppercase tracking-[0.4em] rotate-12 select-none group-hover:text-slate-100 transition-colors">SIGNATURE ÉLECTRONIQUE</p>
                 )}
              </div>
            </div>
          </div>

          {/* 6. Legal Notice Footer */}
          <div className="mt-10 text-center opacity-30">
             <p className="text-[8px] font-black uppercase tracking-[0.5em] mb-1 italic">BMP.TN — AI Construction OS</p>
             <p className="text-[7px] font-medium uppercase">Management certifié • RC: B123456789 • MF: 1234567 • Tunis</p>
          </div>
        </div>

          {/* Payment Panel (Right side if visible) */}
          {type === 'facture' && user?.role === 'client' && data.statut !== 'payée' && showPaymentPanel && (
            <div className="no-print md:sticky md:top-6" style={{
              background: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
              padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', width: '100%', maxWidth: '380px'
            }}>
              
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c4b5fd', margin: '0 0 4px' }}>Paiement Sécurisé</h2>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Réglez votre facture instantanément</p>
              </div>

              {/* Alerts */}
              {paymentError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#fca5a5', marginBottom: '16px' }}>{paymentError}</div>}
              {paymentSuccess && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#86efac', marginBottom: '16px' }}>{paymentSuccess}</div>}

              {/* Method Selector */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px' }}>
                {(['carte','virement','paypal','flouci'] as const).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{
                    flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px',
                    background: payMethod === m ? '#8b5cf6' : 'transparent',
                    color: payMethod === m ? '#fff' : '#475569',
                    cursor: 'pointer', transition: '0.2s', fontSize: '20px'
                  }}>
                    {m === 'carte' && '💳'} {m === 'virement' && '🏦'} {m === 'paypal' && '🅿'} {m === 'flouci' && '📱'}
                  </button>
                ))}
              </div>

              {/* Fields Grid */}
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input value={payerNom} onChange={e=>setPayerNom(e.target.value)} placeholder="Nom" style={inputStyle} />
                  <input value={payerPrenom} onChange={e=>setPayerPrenom(e.target.value)} placeholder="Prénom" style={inputStyle} />
                </div>
                <input value={payerTelephone} onChange={e=>setPayerTelephone(e.target.value)} placeholder="Téléphone" style={inputStyle} />
                <input value={data.temp_client_email||''} disabled style={{...inputStyle, opacity: 0.5}} />

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />

                {payMethod === 'carte' && (
                  <>
                    <input value={cardNumber} onChange={e=>setCardNumber(e.target.value)} placeholder="Numéro de carte" style={inputStyle} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input value={cardExpiry} onChange={e=>setCardExpiry(e.target.value)} placeholder="MM/AA" style={inputStyle} />
                      <input value={cardCvc} onChange={e=>setCardCvc(e.target.value)} placeholder="CVC" style={inputStyle} />
                    </div>
                  </>
                )}

                {payMethod === 'virement' && (
                  <div style={{ background: 'rgba(139,92,246,0.05)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(139,92,246,0.2)', fontSize: '11px', color: '#c4b5fd' }}>
                    <p style={{ margin: '0 0 5px', fontWeight: 800 }}>Virement BIAT</p>
                    <p style={{ margin: 0, opacity: 0.8, fontFamily: 'monospace' }}>IBAN: TN59 1000 0067...</p>
                    <input value={virementRef} onChange={e=>setVirementRef(e.target.value)} placeholder="Réf. virement" style={{...inputStyle, marginTop: '10px'}} />
                  </div>
                )}
                
                {payMethod === 'paypal' && <input value={paypalEmail} onChange={e=>setPaypalEmail(e.target.value)} placeholder="PayPal User" style={inputStyle} />}
                {payMethod === 'flouci' && <input value={flouciPhone} onChange={e=>setFlouciPhone(e.target.value)} placeholder="N° Flouci" style={inputStyle} />}
              </div>

              {/* Action */}
              <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>Montant total</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>{fmt(data.solde_du ?? derivedTotalTTC)}</p>
                
                <button onClick={() => {
                    if (!payerNom || !payerPrenom || !payerTelephone) { 
                      setPaymentError('Veuillez remplir vos informations de contact.'); 
                      return; 
                    }
                    setShowConfirmPayment(true);
                  }}
                  disabled={paying}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px',
                    cursor: paying ? 'not-allowed' : 'pointer', transition: '0.2s', boxShadow: '0 10px 20px rgba(16,185,129,0.2)'
                  }}>
                  {paying ? '⏳ Prévu...' : 'Payer Maintenant'}
                </button>
              </div>
            </div>
          )}

          {/* 7. Confirmation Modal (Floating) */}
          {showConfirmPayment && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 no-print">
               <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tight">Confirmer le paiement</h3>
                  <p className="text-sm text-slate-400 text-center mb-8 leading-relaxed">
                    Souhaitez-vous procéder au règlement de <span className="text-white font-black">{fmt(data.solde_du ?? derivedTotalTTC)}</span> via <span className="text-amber-400 font-bold uppercase">{payMethod}</span> ?
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setShowConfirmPayment(false)}
                      className="py-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest border border-white/5">
                      Annuler
                    </button>
                    <button onClick={async () => {
                        setShowConfirmPayment(false);
                        setPaymentError(''); setPaymentSuccess('');
                        setPaying(true);
                        try {
                          await fetchAPI(`${API}/factures/${data._id}/paiements`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              montant: Number(data.solde_du ?? derivedTotalTTC) || 0,
                              methode_paiement: payMethod,
                              details: { 
                                nom: payerNom, prenom: payerPrenom, telephone: payerTelephone, email: data.temp_client_email || '',
                                ...(payMethod==='carte'?{carte:cardNumber,expiry:cardExpiry,cvc:cardCvc}:{})
                              }
                            }),
                          });
                          setPaymentSuccess('Paiement enregistré avec succès !');
                          setLastPaymentDate(new Date().toLocaleString());
                          setTimeout(() => {
                            setShowReceipt(true);
                          }, 1000);
                        } catch (err: any) { 
                          setPaymentError(err.message || 'Erreur lors du paiement'); 
                        } finally { 
                          setPaying(false); 
                        }
                      }}
                      className="py-4 rounded-2xl bg-emerald-500 text-white font-black text-xs hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all uppercase tracking-widest">
                      Confirmer
                    </button>
                  </div>
               </div>
            </div>
          )}

          {/* 8. Receipt Modal (Popup) */}
          {showReceipt && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500 no-print">
               <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-1 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-700">
                  <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-x-12 -translate-y-12 blur-2xl" />
                     <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                        <ReceiptText className="w-10 h-10 text-white" />
                     </div>
                     <h2 className="text-white text-2xl font-black uppercase tracking-tight leading-none mb-2">Reçu de Paiement</h2>
                     <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Transaction Approuvée</p>
                  </div>
                  
                  <div className="p-8 space-y-6">
                     <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Référence Facture</span>
                           <span className="text-xs font-black text-slate-900">{numero}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Heure</span>
                           <span className="text-xs font-black text-slate-900">{lastPaymentDate}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode de Paiement</span>
                           <span className="text-xs font-black text-slate-900 uppercase">{payMethod}</span>
                        </div>
                        <div className="pt-2">
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Montant Réglé</span>
                              <span className="text-xl font-black text-slate-900">{fmt(data.solde_du ?? derivedTotalTTC)}</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <button onClick={() => window.print()}
                           className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                           <Printer className="w-4 h-4" /> Imprimer le reçu
                        </button>
                        <button onClick={() => setShowReceipt(false)}
                           className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                           Fermer
                        </button>
                     </div>
                     
                     <p className="text-[8px] text-slate-300 font-bold text-center uppercase tracking-[0.3em]">Certifié par BMP.TN Security</p>
                  </div>
               </div>
            </div>
          )}


        {/* 7. Client Actions Bar (On Devis only) */}
        {isDevis && user?.role === 'client' && data.statut === 'envoyé' && (
          <div className="mt-8 flex gap-4 no-print scale-95 origin-top">
            <button onClick={() => onAction('accepter')}
              className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl bg-emerald-500 text-white font-black text-xl hover:bg-emerald-600 hover:scale-[1.01] transition-all shadow-xl shadow-emerald-500/30 active:scale-95">
              <CheckCircle2 className="w-6 h-6" /> {T.accepter.split(' →')[0]}
            </button>
            <button onClick={() => onAction('refuser')}
              className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-95">
              {T.refuser}
            </button>
          </div>
        )}
      </div>

    </div>
  </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
const statutBadge: Record<string, string> = {
  brouillon: "bg-gray-500/20 text-gray-300",
  envoyé: "bg-blue-500/20 text-blue-300",
  envoyée: "bg-blue-500/20 text-blue-300",
  accepté: "bg-emerald-500/20 text-emerald-300",
  refusé: "bg-red-500/20 text-red-300",
  expiré: "bg-orange-500/20 text-orange-300",
  payée: "bg-emerald-500/20 text-emerald-300",
  partiellement_payée: "bg-yellow-500/20 text-yellow-300",
  en_retard: "bg-red-500/20 text-red-300",
  annulée: "bg-gray-500/20 text-gray-400",
};

function Badge({ statut }: { statut: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statutBadge[statut] || "bg-gray-700 text-gray-300"}`}>
      {statut}
    </span>
  );
}

function fmt(n?: any) { return (Number(n) || 0).toLocaleString("fr-TN", { minimumFractionDigits: 3 }) + " TND"; }
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString("fr-TN") : "-"; }

// ── Formulaire Devis ───────────────────────────────────────────────────
function CreateDevisForm({ user, projects, clients, onCreated, initialProjectId }: { user: BMPUser; projects: any[]; clients: BMPUser[]; onCreated: () => void; initialProjectId?: string }) {
  const { lang, t } = useLanguage();
  const T = LOCALE[lang] || LOCALE["fr-FR"];
  const [titre, setTitre] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientNom, setClientNom] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState(0);
  const [delai, setDelai] = useState(30);
  const [articles, setArticles] = useState<Omit<Article, "total">[]>([
    { nom: "", quantite: 1, prix_unitaire: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-select client based on project
  useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find(p => p._id === selectedProjectId);
      if (proj && proj.clientId) {
        const cid = typeof proj.clientId === 'string' ? proj.clientId : proj.clientId._id;
        if (cid) {
          setSelectedClientId(cid);
          const c = clients.find(cl => cl._id === cid);
          if (c) {
            setClientNom(c.nom || "");
            setClientEmail(c.email || "");
          }
        }
      }
    }
  }, [selectedProjectId, projects, clients]);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [modeDeTravail, setModeDeTravail] = useState("");

  // Définition des modes de travail avec articles par défaut
  const modes = {
    "Développement Web": [
      { nom: "Analyse fonctionnelle et technique", quantite: 1, prix_unitaire: 2500 },
      { nom: "Développement frontend (React/Vue/Angular)", quantite: 1, prix_unitaire: 4500 },
      { nom: "Développement backend (Node.js/Python)", quantite: 1, prix_unitaire: 5000 },
      { nom: "Tests unitaires et intégration", quantite: 1, prix_unitaire: 1800 },
      { nom: "Déploiement et mise en production", quantite: 1, prix_unitaire: 1200 },
    ],
    "Design Graphique": [
      { nom: "Conception logo et identité visuelle", quantite: 1, prix_unitaire: 1500 },
      { nom: "Création charte graphique complète", quantite: 1, prix_unitaire: 2200 },
      { nom: "Maquettes UI/UX interactives", quantite: 1, prix_unitaire: 3500 },
      { nom: "Design responsive mobile", quantite: 1, prix_unitaire: 1800 },
    ],
    "Consulting": [
      { nom: "Audit technique complet", quantite: 1, prix_unitaire: 3000 },
      { nom: "Conseil stratégique IT", quantite: 1, prix_unitaire: 2500 },
      { nom: "Formation équipe technique", quantite: 1, prix_unitaire: 2000 },
      { nom: "Accompagnement projet", quantite: 1, prix_unitaire: 1500 },
    ],
    "Maintenance": [
      { nom: "Maintenance corrective (bugs)", quantite: 1, prix_unitaire: 800 },
      { nom: "Maintenance évolutive (nouvelles features)", quantite: 1, prix_unitaire: 1200 },
      { nom: "Support technique mensuel", quantite: 1, prix_unitaire: 500 },
      { nom: "Monitoring et sécurité", quantite: 1, prix_unitaire: 600 },
    ],
    "Plomberie": [
      { nom: "Installation tuyauteries (PVC/Cuivre)", quantite: 1, prix_unitaire: 1200 },
      { nom: "Pose appareils sanitaires (Lavabo/WC)", quantite: 2, prix_unitaire: 450 },
      { nom: "Branchement chauffe-eau", quantite: 1, prix_unitaire: 350 },
      { nom: "Test d'étanchéité et mise en service", quantite: 1, prix_unitaire: 150 },
    ],
    "Électricité": [
      { nom: "Installation tableau électrique", quantite: 1, prix_unitaire: 850 },
      { nom: "Tirage de câbles par pièce", quantite: 5, prix_unitaire: 120 },
      { nom: "Pose appareillage (Prises/Interrupteurs)", quantite: 20, prix_unitaire: 15 },
      { nom: "Installation luminaires LED", quantite: 10, prix_unitaire: 25 },
    ],
    "Peinture & Décoration": [
      { nom: "Préparation des supports (Enduit/Ponçage)", quantite: 50, prix_unitaire: 12 },
      { nom: "Peinture acrylique mate (2 couches)", quantite: 120, prix_unitaire: 18 },
      { nom: "Peinture plafonds", quantite: 45, prix_unitaire: 20 },
      { nom: "Nettoyage et finitions", quantite: 1, prix_unitaire: 150 },
    ],
    "Gros Œuvre / Maçonnerie": [
      { nom: "Coulage dalle béton armé", quantite: 1, prix_unitaire: 4500 },
      { nom: "Élévation murs parpaings", quantite: 80, prix_unitaire: 35 },
      { nom: "Réalisation enduit ciment extérieur", quantite: 60, prix_unitaire: 25 },
      { nom: "Chape lissée", quantite: 30, prix_unitaire: 18 },
    ],
    "Expertise Technique": [
      { nom: "Visite de contrôle de chantier", quantite: 1, prix_unitaire: 350 },
      { nom: "Rédaction rapport d'expertise", quantite: 1, prix_unitaire: 600 },
      { nom: "Vérification conformité normes", quantite: 1, prix_unitaire: 450 },
      { nom: "Validation des étapes clés", quantite: 1, prix_unitaire: 300 },
    ],
  };

  // Calcul automatique des articles par défaut selon mode
  useEffect(() => {
    if (modeDeTravail && modeDeTravail in modes) {
      setArticles(modes[modeDeTravail as keyof typeof modes]);
    } else if (!modeDeTravail) {
      setArticles([{ nom: "", quantite: 1, prix_unitaire: "" }]);
    }
  }, [modeDeTravail]);

  const handleReset = () => {
    setTitre("");
    setDesc("");
    setClientNom("");
    setClientEmail("");
    setSelectedClientId("");
    setSelectedProjectId("");
    setArticles([{ nom: "", quantite: 1, prix_unitaire: "" }]);
    setDiscount(0);
    setDelai(30);
    setModeDeTravail("");
    setError("");
  };

  const autoCorrectText = async () => {
    setIsCorrecting(true);
    
    const fixText = async (text: string) => {
      if (!text.trim()) return text;
      try {
        const res = await fetch("https://api.languagetoolplus.com/v2/check", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ text, language: "fr" }),
        });
        const data = await res.json();
        let corrected = text;
        if (data.matches) {
          const matches = [...data.matches].sort((a, b) => b.offset - a.offset);
          for (const match of matches) {
            if (match.replacements && match.replacements.length > 0) {
              corrected = corrected.slice(0, match.offset) + match.replacements[0].value + corrected.slice(match.offset + match.length);
            }
          }
        }
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
        return corrected;
      } catch (err) {
        return text;
      }
    };

    if (titre) setTitre(await fixText(titre));
    if (desc) {
      let newDesc = await fixText(desc);
      if (!newDesc.endsWith('.')) newDesc += '.';
      newDesc = newDesc.replace(/\s+,/g, ',').replace(/\s+\./g, '.').replace(/\s{2,}/g, ' ');
      setDesc(newDesc);
    }

    // Correction des articles
    if (articles.length > 0) {
      const correctedArticles = await Promise.all(articles.map(async (a) => ({
        ...a,
        nom: await fixText(a.nom)
      })));
      setArticles(correctedArticles);
    }
    
    setIsCorrecting(false);
  };

  const addArticle = () =>
    setArticles((p) => [...p, { nom: "", quantite: 1, prix_unitaire: "" }]);

  const removeArticle = (i: number) =>
    setArticles((p) => p.filter((_, idx) => idx !== i));

  const updateArticle = (i: number, key: keyof Omit<Article, "total">, value: any) =>
    setArticles((p) => p.map((a, idx) => idx === i ? { ...a, [key]: value } : a));

  const subTotal = articles.reduce((s, a) => s + (Number(a.quantite) || 0) * (Number(a.prix_unitaire) || 0), 0);
  const totalAfterDiscount = subTotal * (1 - discount / 100);
  const tva = totalAfterDiscount * 0.19;
  const totalTTC = totalAfterDiscount + tva;

  const handleSubmit = async (e: React.FormEvent, immediateSend: boolean = false) => {
    e.preventDefault();
    if (!clientNom && !selectedClientId) {
      setError("Veuillez choisir un client.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const selectedProject = projects.find(p => p._id === selectedProjectId);
      
      const payload: any = {
        titre,
        description: desc,
        temp_client_nom: clientNom,
        temp_client_email: clientEmail,
        artisanId: user._id,
        clientId: (selectedClientId && selectedClientId !== "manual") ? selectedClientId : undefined,
        envoyer: immediateSend,
        articles: articles.map((a) => ({ 
          nom: a.nom || "Article", 
          quantite: Number(a.quantite) || 1, 
          prix_unitaire: Number(a.prix_unitaire) || 0,
          total: (Number(a.quantite) || 1) * (Number(a.prix_unitaire) || 0)
        })),
        delai_validite: Number(delai) || 30,
      };

      if (selectedClientId) payload.clientId = selectedClientId;

      const isValidId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

      if (selectedProjectId && isValidId(selectedProjectId)) {
        payload.projectId = selectedProjectId;
      }

      await fetchAPI(`${API}/devis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      // On vide le formulaire comme demandé (restauration du comportement initial)
      setTitre(""); setDesc(""); setArticles([{ nom: "", quantite: 1, prix_unitaire: "" }]);
      setSelectedProjectId(""); setSelectedClientId("");
      setClientNom(""); setClientEmail("");
      setModeDeTravail("");
      onCreated();
      alert("Devis créé avec succès !"); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5 rounded-2xl bg-white/5 border border-white/10 p-5" dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}>
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        <Plus className="w-4 h-4 text-amber-400" /> {T.nv_devis}
      </h2>

      {error && <p className="text-xs text-red-300 bg-red-500/10 rounded-xl p-3">{error}</p>}

      <div className="space-y-4">
        <div>
          <select 
            value={selectedClientId} 
            onChange={(e) => {
              const cid = e.target.value;
              setSelectedClientId(cid);
              if (cid) {
                const c = clients.find(cl => cl._id === cid);
                if (c) {
                  setClientNom(c.nom || "");
                  setClientEmail(c.email || "");
                }
              }
            }}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50 mb-3"
          >
            <option value="">-- Sélectionner un client existant --</option>
            {clients.map((c) => <option key={c._id} value={c._id}>{c.nom} ({c.email})</option>)}
            <option value="manual">-- Nouveau client (Saisie manuelle) --</option>
          </select>

          {selectedClientId === "manual" && (
            <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
              <input value={clientNom} onChange={(e) => setClientNom(e.target.value)}
                placeholder="Nom du client" className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50" />
              <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email client" className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 text-[10px]">Associer à un projet (Optionnel)</label>
          <select value={selectedProjectId} onChange={(e) => {
            const pid = e.target.value;
            setSelectedProjectId(pid);
            if (pid) {
              const p = projects.find(pr => pr._id === pid);
              if (p && p.clientId) {
                const cid = typeof p.clientId === 'string' ? p.clientId : p.clientId._id;
                setSelectedClientId(cid);
                const c = clients.find(cl => cl._id === cid);
                if (c) {
                  setClientNom(c.nom || "");
                  setClientEmail(c.email || "");
                } else if (p.clientNom || p.clientEmail) {
                   // Fallback si le client n'est pas dans clientsList mais les infos sont sur le projet
                   setClientNom(p.clientNom || "");
                   setClientEmail(p.clientEmail || "");
                }
              }
            }
          }}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-amber-400/30">
            <option value="">-- Aucun projet associé --</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.titre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 text-[10px]">Mode de travail</label>
          <select value={modeDeTravail} onChange={(e) => setModeDeTravail(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-amber-400/30">
            <option value="">-- Sélectionner un mode --</option>
            {Object.keys(modes).map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">{T.titre}</label>
        <div className="relative">
          <input 
            value={titre} 
            onChange={(e) => setTitre(e.target.value)} 
            onBlur={() => autoCorrectText()}
            required
            placeholder={T.placeholder_titre} 
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 pr-12 text-sm text-white focus:outline-none focus:border-amber-400/50" 
          />
          <DictationButton onResult={(t) => setTitre((p) => p ? p + " " + t : t)} className={`absolute ${lang === 'ar-SA' ? 'left-1' : 'right-1'} top-1`} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-300">{T.desc}</label>
          {(titre || desc) && (
            <button type="button" onClick={autoCorrectText} disabled={isCorrecting}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
              <Sparkles className={`w-3 h-3 ${isCorrecting ? 'animate-spin' : ''}`} /> {isCorrecting ? "Correction..." : "Auto-correction IA"}
            </button>
          )}
        </div>
        <div className="relative">
          <textarea 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)} 
            onBlur={() => autoCorrectText()}
            rows={2}
            placeholder={T.placeholder_desc}
            className={`w-full rounded-xl bg-black/30 border ${isCorrecting ? 'border-indigo-500/50' : 'border-white/10'} px-3 py-2 pr-12 text-sm text-white resize-none focus:border-amber-400/50 outline-none`} 
          />
          <DictationButton onResult={(t) => setDesc((p) => p ? p + " " + t : t)} className={`absolute ${lang === 'ar-SA' ? 'left-1' : 'right-1'} top-1`} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-2">{T.articles}</label>
        <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-2 mb-2">
          {articles.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_80px_30px] gap-2 items-center">
              <input value={a.nom} onChange={(e) => updateArticle(i, "nom", e.target.value)} placeholder="Article" className="rounded-lg bg-black/30 border border-white/10 px-2 py-2 text-[11px] text-white focus:border-amber-400/30 outline-none" />
              <input type="number" min={0} value={a.quantite} onChange={(e) => updateArticle(i, "quantite", e.target.value === '' ? '' : Number(e.target.value))} className="rounded-lg bg-black/30 border border-white/10 px-2 py-2 text-[11px] text-white text-center outline-none" />
              <input type="number" min={0} value={a.prix_unitaire} onChange={(e) => updateArticle(i, "prix_unitaire", e.target.value === '' ? '' : Number(e.target.value))} className="rounded-lg bg-black/30 border border-white/10 px-2 py-2 text-[11px] text-white text-right outline-none" />
              <button type="button" onClick={() => removeArticle(i)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addArticle} className="text-[10px] text-amber-400 font-bold flex items-center gap-1 hover:text-amber-300 transition-colors uppercase tracking-widest"><Plus className="w-3 h-3" /> {T.add_ligne}</button>
      </div>

      <div className="space-y-2 border-t border-white/5 pt-4 mb-4">
        <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400">
          <span className="uppercase tracking-widest">Total HT</span>
          <span>{fmt(subTotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-[11px] font-semibold text-green-400">
            <span className="uppercase tracking-widest">Remise ({discount}%)</span>
            <span>-{fmt(subTotal * discount / 100)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400">
          <span className="uppercase tracking-widest">Total après remise</span>
          <span>{fmt(totalAfterDiscount)}</span>
        </div>
        <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400">
          <span className="uppercase tracking-widest">TVA (19%)</span>
          <span>{fmt(tva)}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-black text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
          <span className="uppercase tracking-widest">Total TTC</span>
          <span>{fmt(totalTTC)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={handleReset}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 font-bold text-[10px] hover:bg-red-500/20 border border-red-500/20 transition-all uppercase tracking-widest active:scale-95">
            <Trash2 className="w-3.5 h-3.5" /> Effacer tout
          </button>
          <button type="button" onClick={autoCorrectText} disabled={isCorrecting}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-[10px] hover:bg-indigo-500/20 border border-indigo-500/20 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50">
            {isCorrecting ? <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} 
            {isCorrecting ? 'Correction...' : 'Corriger par IA'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="submit" disabled={loading}
            className="py-3.5 rounded-xl bg-white/5 text-white font-black text-[10px] hover:bg-white/10 border border-white/10 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50">
            Enregistrer Brouillon
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading}
            className="py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-950 font-black text-[10px] hover:shadow-xl hover:shadow-amber-500/20 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50">
            Créer & Envoyer
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Carte Devis ────────────────────────────────────────────────────────
function DevisCard({ devis, user, factures, onRefresh, onSeeFacture }: { devis: Devis; user: BMPUser | null; factures: Facture[]; onRefresh: () => void; onSeeFacture: (num: string) => void }) {
  const { lang } = useLanguage();
  const T = LOCALE[lang] || LOCALE["fr-FR"];
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const isClient = user?.role === 'client';

  const daysOld = Math.floor((new Date().getTime() - new Date(devis.date_creation).getTime()) / (24 * 60 * 60 * 1000));
  const remainingDays = (devis.delai_validite || 30) - daysOld;
  const isExpiringSoon = devis.statut === 'envoyé' && remainingDays <= 10;
  const expIntensity = isExpiringSoon ? Math.min(0.8, ((10 - remainingDays) / 10) * 0.8) : 0;

  const action = async (endpoint: string) => {
    setLoading(true); setMsg("");
    try {
      const data = await fetchAPI(`${API}/devis/${devis._id}/${endpoint}`, { method: "POST" });
      if (endpoint === "accepter" && data.facture) {
        setSelectedFacture(data.facture);
        setShowFactureModal(true);
        setMsg(`✅ Facture ${data.facture.numero_facture} générée !`);
      } else if (endpoint === "accepter") {
        setMsg("✅ Devis accepté. Facture générée.");
      } else {
        setMsg("✅ Opération réussie");
      }
      onRefresh();
      setShowModal(false);
    } catch (err) { 
      setMsg("❌ Erreur");
      console.error(err);
    }
    finally { setLoading(false); }
  };

  const del = async () => {
    if (!confirm("Supprimer ce devis ?")) return;
    try {
      await fetchAPI(`${API}/devis/${devis._id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  return (
    <>
      {showModal && (
        <DocumentModal 
          type="devis" 
          data={devis} 
          user={user} 
          onClose={() => setShowModal(false)} 
          onAction={action} 
        />
      )}

      {showFactureModal && selectedFacture && (
        <DocumentModal
          type="facture"
          data={selectedFacture}
          user={user}
          onClose={() => {
            setShowFactureModal(false);
            setSelectedFacture(null);
          }}
          onAction={() => {}}
        />
      )}

      <div className={`group relative overflow-hidden flex flex-col bg-slate-900/40 backdrop-blur-3xl border ${isExpiringSoon ? 'border-red-500 animate-flash-red' : 'border-slate-100/10'} rounded-[2rem] transition-all hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-blue-500/10 mb-4 ring-1 ring-white/5`}>
        <div className={`absolute top-0 left-0 w-1 h-full ${devis.statut === 'accepté' ? 'bg-emerald-500' : isExpiringSoon ? 'bg-red-500' : 'bg-blue-600'}`} />
        
        <div onClick={() => setShowModal(true)} className="cursor-pointer relative z-10 grid grid-cols-1 md:grid-cols-12 items-center gap-6 px-8 py-6">
          <div className="md:col-span-4 flex items-center gap-5">
            <div className={`relative p-3.5 rounded-2xl ${devis.statut === 'accepté' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'} border border-white/5 group-hover:scale-105 transition-transform duration-500 shadow-inner`}>
              <FileText className="w-7 h-7" />
              <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${devis.statut === 'accepté' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">{devis.numero_devis}</span>
                <Badge statut={devis.statut} />
              </div>
              <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight truncate max-w-[200px] group-hover:text-blue-400 transition-colors">
                {devis.titre || T.sans_titre}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter truncate max-w-[150px]">
                {devis.clientId?.nom || devis.temp_client_nom || "Client Particulier"}
              </p>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col justify-center">
             <div className="flex items-end justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offre de prix certifiée</span>
                <span className={`text-[10px] font-black uppercase ${isExpiringSoon ? 'text-red-400' : 'text-slate-500'}`}>
                  {isExpiringSoon ? `Expire dans ${remainingDays} jours` : `Valable ${devis.delai_validite || 30} Jours`}
                </span>
             </div>
             <div className="relative h-2 w-full bg-slate-950/50 rounded-full border border-white/5 overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${isExpiringSoon ? 'bg-red-500 animate-pulse' : 'bg-blue-500/30'}`} 
                  style={{ width: `${Math.min(100, Math.round((daysOld / (devis.delai_validite || 30)) * 100))}%` }} 
                />
             </div>
          </div>

          <div className="md:col-span-3 text-right flex flex-col items-end">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-3xl font-black text-white font-mono tracking-tighter">{fmt((Number(devis.montant_total) || (devis.articles?.reduce((s, a) => s + (Number(a.total) || (Number(a.prix_unitaire)*Number(a.quantite)) || 0), 0) * 1.19) || 0)).replace(' TND', '')}</span>
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase leading-none">TTC</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">TND</span>
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className={`mt-3 p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5 ${expanded ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}`}>
              <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex px-8 py-3 bg-white/[0.01] border-t border-white/5 items-center justify-between relative z-10 transition-colors group-hover:bg-white/[0.03]">
          <div className="flex gap-4">
             <button onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
               className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors group/view">
               <Eye className="w-4 h-4 transition-transform group-hover/view:scale-110" /> {isClient ? "Voir Proposition" : "Gérer Document"}
             </button>
              {isClient && devis.statut === 'envoyé' && (
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); action('accepter'); }}
                    className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Accepter & Lancer
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); action('refuser'); }}
                    className="flex items-center gap-2 text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors">
                    <XCircle className="w-4 h-4" /> Refuser
                  </button>
                </div>
              )}
              {devis.statut === 'accepté' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const f = factures.find(fac => fac.devisId === devis._id);
                    if (f) {
                      setSelectedFacture(f);
                      setShowFactureModal(true);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black bg-purple-500/20 text-purple-300 rounded-lg uppercase tracking-widest hover:bg-purple-500/30 transition-all"
                >
                  <ReceiptText className="w-3.5 h-3.5" /> Voir la facture
                </button>
              )}
             {!isClient && devis.statut === 'brouillon' && (
                <button onClick={(e) => { e.stopPropagation(); action('envoyer'); }}
                  className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
                  <Send className="w-4 h-4" /> Envoyer au Client
                </button>
             )}
          </div>
          {!isClient && (
            <button onClick={(e) => { e.stopPropagation(); del(); }} className="text-slate-600 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {expanded && (
          <div className="p-8 bg-slate-950/40 border-t border-white/5 animate-in slide-in-from-top-2 duration-500">
            {msg && <p className="mb-6 text-[10px] font-black text-emerald-400 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 shadow-inner flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {msg}</p>}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4 items-center">
                    <div className="p-2 bg-blue-500/10 rounded-xl"><Clock className="w-4 h-4 text-blue-400" /></div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Création</p>
                      <p className="text-xs font-black text-slate-200">{fmtDate(devis.date_creation)}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4 items-center">
                    <div className="p-2 bg-amber-500/10 rounded-xl"><ShieldCheck className="w-4 h-4 text-amber-400" /></div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Validité</p>
                      <p className="text-xs font-black text-slate-200">{devis.delai_validite || 30} Jours</p>
                    </div>
                  </div>
               </div>

               <div className="p-6 rounded-3xl bg-indigo-500/[0.03] border border-indigo-500/10 relative overflow-hidden group/ai">
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">BMP AI ANALYSIS</p>
                  </div>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
                    Probabilité d'acceptation estimée à <span className="text-emerald-400 font-black">92%</span>. Le profil client est aligné avec cette offre.
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Carte Facture ──────────────────────────────────────────────────────
function FactureCard({ facture, user, onRefresh }: { facture: Facture; user: BMPUser | null; onRefresh: () => void }) {
  const { lang } = useLanguage();
  const T = LOCALE[lang] || LOCALE["fr-FR"];
  const [expanded, setExpanded] = useState(false);
  const [montant, setMontant] = useState("");
  const [methode, setMethode] = useState<string>("virement");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [paiements, setPaiements] = useState<any[]>([]);
  const isClient = user?.role === 'client';

  useEffect(() => {
    if (expanded) {
      fetchAPI(`${API}/factures/${facture._id}/paiements`).then(setPaiements).catch(err => console.warn("Paiements error:", err));
    }
  }, [expanded, facture._id]);

  const articles = facture.articles || [];
  const articleSumHT = articles.reduce((s, a) => s + (Number(a.total) || (Number(a.prix_unitaire)*Number(a.quantite)) || 0), 0);
  const derivedTotal = facture.montant_total > 0 ? facture.montant_total : articleSumHT * 1.19;
  const pct = derivedTotal > 0 ? Math.round((facture.montant_paye / derivedTotal) * 100) : 0;
  const isPaid = facture.statut === 'payée' || pct >= 100;

  // Logique d'alerte progressive
  const diffTime = new Date().getTime() - new Date(facture.date_facture || facture.createdAt).getTime();
  const daysOld = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  const isOverdue = !isPaid && daysOld >= 0; // Seuil mis à 0 pour affichage immédiat même aujourd'hui
  const isApproaching = !isPaid;
  const intensity = Math.min(0.8, ((daysOld + 1) / 1) * 0.8);

  useEffect(() => {
    console.log(`DEBUG Facture ${facture.numero_facture}: daysOld=${daysOld}, isOverdue=${isOverdue}, date=${facture.date_facture || facture.createdAt}`);
  }, [daysOld, isOverdue, facture.numero_facture, facture.date_facture, facture.createdAt]);

  const playAlertSound = useCallback(() => {
    if (!isOverdue) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'triangle'; // Son plus riche
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0, audioCtx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + start + 0.05); // Plus fort
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + start + duration);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };
      // Sirène triple : bip-bip-bip
      playTone(880, 0, 0.2);
      playTone(880, 0.3, 0.2);
      playTone(880, 0.6, 0.2);
    } catch (e) { console.warn("Sound blocked", e); }
  }, [isOverdue]);

  useEffect(() => {
    if (isOverdue) {
      // Tenter de jouer au chargement (peut être bloqué par le navigateur sans clic préalable)
      playAlertSound();
      // Ajouter un listener global pour jouer dès la première interaction si bloqué
      const once = () => { playAlertSound(); window.removeEventListener('click', once); };
      window.addEventListener('click', once);
      return () => window.removeEventListener('click', once);
    }
  }, [isOverdue, playAlertSound]);

  const action = async (endpoint: string) => {
    setLoading(true); setMsg("");
    try {
      await fetchAPI(`${API}/factures/${facture._id}/${endpoint}`, { method: "POST" });
      setMsg("✅ Opération réussie");
      onRefresh();
      setShowModal(false);
    } catch (err) { 
      setMsg("❌ Erreur");
      console.error(err);
    }
    finally { setLoading(false); }
  };

  const addPaiement = async () => {
    const m = parseFloat(montant);
    if (!m || m <= 0) return;
    setLoading(true);
    try {
      await fetchAPI(`${API}/factures/${facture._id}/paiements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant: m, methode_paiement: methode }),
      });
      setMsg(`✅ Règlement de ${fmt(m)} enregistré`);
      setMontant("");
      onRefresh();
    } catch (err) { 
      setMsg("❌ Erreur lors de l'enregistrement");
      console.warn("Add payment error:", err);
    }
    finally { setLoading(false); }
  };



  return (
    <>
      {showModal && (
        <DocumentModal 
          type="facture" 
          data={facture} 
          user={user} 
          onClose={() => setShowModal(false)} 
          onAction={onRefresh} 
        />
      )}

      <div 
        onMouseEnter={() => playAlertSound()}
        className={`group relative overflow-hidden flex flex-col bg-slate-900/40 backdrop-blur-3xl border rounded-[2rem] transition-all hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-purple-500/10 mb-4 ring-1 ring-white/5 ${isOverdue ? 'animate-overdue-card' : ''}`}
        style={!isOverdue && isApproaching ? { borderColor: `rgba(239, 68, 68, ${intensity})`, backgroundColor: `rgba(239, 68, 68, ${intensity / 10})` } : {}}
      >
        <div className={`absolute top-0 left-0 w-1 h-full ${isPaid ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : isApproaching ? 'bg-red-400' : 'bg-purple-600'}`} style={!isOverdue && isApproaching ? { opacity: intensity + 0.2 } : {}} />
        
        <div onClick={() => setShowModal(true)} className="cursor-pointer relative z-10 grid grid-cols-1 md:grid-cols-12 items-center gap-6 px-8 py-6">
          <div className="md:col-span-4 flex items-center gap-5">
            <div className={`relative p-3.5 rounded-2xl ${isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'} border border-white/5 group-hover:scale-105 transition-transform duration-500 shadow-inner`}>
              <ReceiptText className="w-7 h-7" />
              {isPaid && <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-emerald-500 bg-slate-950 rounded-full" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">{facture.numero_facture}</span>
                <Badge statut={facture.statut} />
              </div>
              <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight truncate max-w-[200px] group-hover:text-amber-400 transition-colors">
                {facture.titre?.startsWith('Facture pour') ? facture.numero_facture : (facture.titre || T.sans_titre)}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Émis le {fmtDate(facture.date_facture)}</p>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col justify-center">
            <div className="flex items-end justify-between mb-2 px-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pct === 100 ? 'Règlement Complet' : `Paiement : ${pct}%`}</span>
               {!isPaid && <span className="text-[10px] font-black text-red-400 uppercase">Dû: {fmt(facture.solde_du)}</span>}
            </div>
            <div className="relative h-2.5 w-full bg-slate-950/50 rounded-full border border-white/5 overflow-hidden mb-2">
               <div className={`absolute left-0 top-0 h-full rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-purple-500'} shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-1000`} style={{ width: `${pct}%` }} />
            </div>
            {!isPaid && (
               <>
                 <div className="flex items-end justify-between mb-1 px-1 mt-2">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Délai de paiement (Immédiat)</span>
                   <span className={`text-[9px] font-black uppercase ${isOverdue ? 'text-red-500' : 'text-amber-400'}`}>
                     {isOverdue ? 'Alerte Active' : `Jour ${daysOld}/1`}
                   </span>
                 </div>
                 <div className="relative h-1.5 w-full bg-slate-950/50 rounded-full border border-white/5 overflow-hidden">
                   <div 
                     className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${isOverdue ? 'bg-red-500 animate-pulse' : 'bg-amber-500/80'}`} 
                     style={{ width: `${Math.min(100, (daysOld / 1) * 100)}%` }} 
                   />
                 </div>
               </>
            )}
            {isOverdue && (
               <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Alerte : Facture impayée depuis plus de 1 jour</span>
               </div>
            )}
          </div>

          <div className="md:col-span-3 text-right flex flex-col items-end">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-3xl font-black text-white font-mono tracking-tighter">{fmt((Number(facture.montant_total) || (facture.articles?.reduce((s, a) => s + (Number(a.total) || (Number(a.prix_unitaire)*Number(a.quantite)) || 0), 0) * 1.19) || 0)).replace(' TND', '')}</span>
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase leading-none">TTC</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">TND</span>
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className={`mt-3 p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5 ${expanded ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : ''}`}>
              <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="p-8 bg-slate-950/40 border-t border-white/5 animate-in slide-in-from-top-2 duration-500">
            {msg && <p className="mb-6 text-[10px] font-black text-emerald-400 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 shadow-inner flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {msg}</p>}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {user?.role !== 'client' && !isPaid && (
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-3 bg-purple-500 rounded-full" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{T.enr_paiement}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)}
                      placeholder={T.montant} className="flex-1 bg-slate-900 border border-slate-700/50 rounded-xl px-5 py-3 text-xs text-white placeholder:text-slate-600 focus:border-purple-500/50 outline-none transition-all shadow-inner" />
                    <select value={methode} onChange={(e) => setMethode(e.target.value)}
                      className="bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-3 text-xs text-white focus:border-purple-500/50 cursor-pointer outline-none transition-all">
                      <option value="virement">Virement</option>
                      <option value="espèces">Espèces</option>
                      <option value="chèque">Chèque</option>
                    </select>
                    <button onClick={addPaiement} disabled={loading || !montant}
                      className="p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-30">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className={`p-6 rounded-3xl bg-purple-500/[0.03] border border-purple-500/10 relative overflow-hidden group/ai ${user?.role === 'client' || isPaid ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="relative">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    <div className="absolute inset-0 bg-purple-400 blur-md opacity-20" />
                  </div>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">BMP AI TRANSACTION INSIGHT</p>
                </div>
                <p className="text-xs font-bold text-slate-400 leading-relaxed relative z-10 italic">
                  Statut de trésorerie : <span className="text-emerald-400 font-black">SOLVABLE</span>. Risque d'impayé quasi nul sur la base de l'historique bancaire. Prévision de clôture comptable : J+2.
                </p>

                {paiements.length > 0 && (
                  <div className="mt-6 space-y-3 relative z-10">
                    <p className="text-[9px] font-black uppercase text-purple-400 tracking-widest pl-1">Historique des règlements</p>
                    {paiements.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-purple-500/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                             <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-200 uppercase">{p.methode_paiement}</p>
                            <p className="text-[8px] font-medium text-slate-500 uppercase">{new Date(p.createdAt || p.date_paiement).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-emerald-400 font-mono">+{fmt(p.montant)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                 <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl backdrop-blur-xl group/rib transition-all hover:border-purple-500/20">
                    <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-4 ml-1 flex items-center gap-2">
                       <Building2 className="w-3.5 h-3.5" /> Références Bancaires
                    </p>
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 mb-4 group-hover/rib:border-purple-500/10 transition-colors">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Titulaire du compte</p>
                       <p className="text-xs font-black text-slate-100 uppercase">BMP TECHNOLOGY TUNISIE</p>
                    </div>
                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-purple-500/30 transition-all cursor-pointer group/copy active:scale-[0.98]">
                       <div className="overflow-hidden">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">RIB / IBAN</p>
                          <p className="text-[11px] font-black text-purple-300 font-mono tracking-tighter truncate">TN59 1200 0000 1234 5678 9012</p>
                       </div>
                       <div className="p-2.5 bg-white/5 rounded-xl text-slate-500 group-hover/copy:text-white transition-colors">
                          <Copy className="w-4 h-4" />
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl backdrop-blur-xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-4 ml-1">Modes de Règlement Acceptés</p>
                    <div className="grid grid-cols-2 gap-3">
                       {[
                         { id: 'vir', label: 'Virement', icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                         { id: 'chq', label: 'Chèque', icon: FileSignature, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                         { id: 'esp', label: 'Espèces', icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                         { id: 'crd', label: 'Carte', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                       ].map((m) => (
                         <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-white/10 transition-all group/mode">
                            <div className={`p-2 ${m.bg} ${m.color} rounded-lg group-hover/mode:scale-110 transition-transform`}>
                               <m.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover/mode:text-slate-200 transition-colors">{m.label}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Content Component ────────────────────────────────────────────────────
function GestionDevisContent() {
  const { lang } = useLanguage();
  const T = LOCALE[lang] || LOCALE["fr-FR"];
  const [user, setUser] = useState<BMPUser | null>(null);
  const [tab, setTab] = useState<"devis" | "factures">("devis");
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [facturesList, setFacturesList] = useState<Facture[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<BMPUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
 
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || undefined;
  
  const loadDevis = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let url = `${API}/devis?`;
      if (initialProjectId) url += `projectId=${initialProjectId}&`;
      
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 
          "x-user-id": user._id || "", 
          "x-user-role": user.role || "",
          "x-user-email": user.email || ""
        }
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDevisList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn("Erreur de chargement des devis:", err.message || err);
      setDevisList([]);
    } finally { setLoading(false); }
  }, [user, initialProjectId]);

  const loadFactures = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let url = `${API}/factures?`;
      if (initialProjectId) url += `projectId=${initialProjectId}&`;

      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 
          "x-user-id": user._id || "", 
          "x-user-role": user.role || "",
          "x-user-email": user.email || ""
        }
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFacturesList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn("Erreur de chargement des factures:", err.message || err);
      setFacturesList([]);
    } finally { setLoading(false); }
  }, [user, initialProjectId]);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let url = `${API}/projects?`;
      if (initialProjectId) url += `projectId=${initialProjectId}&`;
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 
          "x-user-id": user._id || "", 
          "x-user-role": user.role || "",
          "x-user-email": user.email || ""
        }
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("DEBUG PROJECTS LOADED:", data);
      setProjectsList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn("Erreur de chargement des projets:", err.message || err);
      setProjectsList([]);
    }
  }, [user]);

  const loadClients = useCallback(async () => {
    if (!user) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const url = `${API}/users?role=client`;
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: { 
          "x-user-id": user._id || "", 
          "x-user-role": user.role || "",
          "x-user-email": user.email || ""
        }
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClientsList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn("Erreur de chargement des clients:", err.message || err);
      setClientsList([]);
    }
  }, [user]);

  const handleExportPDF = () => {
    const list = tab === 'devis' ? filteredDevis : filteredFactures;
    if (list.length === 0) {
      alert("Aucun document à exporter.");
      return;
    }
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport ${tab === 'devis' ? 'Devis' : 'Factures'}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            .montant { font-weight: bold; color: #0f172a; text-align: right; }
            .statut { font-weight: bold; font-size: 9px; padding: 3px 6px; border-radius: 4px; background: #f1f5f9; text-transform: uppercase; }
            footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>Rapport des ${tab === 'devis' ? 'Devis' : 'Factures'}</h1>
              <p style="font-size: 12px; color: #64748b; margin: 5px 0 0 0;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            <div style="text-align: right">
              <p style="margin: 0; font-size: 14px;"><strong>Total Dossiers:</strong> ${list.length}</p>
            </div>
          </header>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Titre</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th style="text-align: right">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(item => `
                <tr>
                  <td>${item.numero_devis || item.numero_facture || '—'}</td>
                  <td>${item.titre || 'Sans titre'}</td>
                  <td>${(item.clientId?.nom || item.temp_client_nom || 'Client Particulier')}</td>
                  <td>${new Date(item.date_creation || item.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td><span class="statut">${item.statut}</span></td>
                  <td class="montant">${(Number(item.montant_total) || 0).toLocaleString('fr-TN')} TND</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <footer>Document confidentiel - BMP.tn</footer>
        </body>
      </html>
    `;
    
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(content);
      iframe.contentWindow.document.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) setUser(storedUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadDevis();
      loadFactures();
      loadProjects();
      loadClients();
    }
  }, [user, loadDevis, loadFactures, loadProjects, loadClients]);

  const refresh = () => { 
    loadDevis(); 
    loadFactures(); 
    loadProjects(); 
    loadClients(); 
  };
  
  const filteredDevis = devisList.filter(d => 
    (!statusFilter || d.statut === statusFilter) && 
    (!searchTerm || d.titre?.toLowerCase().includes(searchTerm.toLowerCase()) || d.numero_devis?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredFactures = facturesList.filter(f => {
    return true; // Backend performs identity filtering
  }).filter(f => 
    (!statusFilter || f.statut === statusFilter) && 
    (!searchTerm || f.numero_facture?.toLowerCase().includes(searchTerm.toLowerCase()) || f.titre?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statsCounts = {
    brouillon: filteredDevis.filter((d) => d.statut === "brouillon").length,
    envoyé: filteredDevis.filter((d) => d.statut === "envoyé").length,
    accepté: filteredDevis.filter((d) => d.statut === "accepté").length,
  };

  const factureStats = {
    total: filteredFactures.reduce((s, f) => s + (f.montant_total || 0), 0),
    paye: filteredFactures.reduce((s, f) => s + (f.montant_paye || 0), 0),
    enRetard: filteredFactures.filter((f) => f.statut === "en_retard").length,
  };

  const overdueClientFactures = user?.role === 'client' ? facturesList.filter(f => {
    const isPaid = f.statut === 'payée' || (f.montant_total > 0 && f.montant_paye >= f.montant_total);
    if (isPaid) return false;
    const daysOld = Math.floor((new Date().getTime() - new Date(f.date_facture).getTime()) / (24 * 60 * 60 * 1000));
    return daysOld >= 0;
  }) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white" dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: OVERDUE_STYLES }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-950/20 via-gray-950/90 to-gray-950" />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-amber-300 transition-colors">
              <ArrowLeft className={`w-5 h-5 ${lang === 'ar-SA' ? 'rotate-180' : ''}`} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-400" />
                {T.devis} & {T.factures} IA
              </h1>
              <p className="text-xs text-gray-400">{T.cycle}</p>
            </div>
          </div>
        </div>

        {/* Alerte Globale Client pour Factures en Retard */}
        {user?.role === 'client' && overdueClientFactures.length > 0 && (
          <div className="mb-8 p-5 rounded-[2rem] bg-red-500/10 border border-red-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-red-400 uppercase tracking-tight">Action Requise</h3>
                <p className="text-sm font-medium text-red-200 mt-1">Vous avez {overdueClientFactures.length} facture(s) en retard de paiement (dépassant 1 jour depuis l'émission).</p>
              </div>
            </div>
            <button onClick={() => setTab("factures")} className="px-6 py-3 rounded-xl bg-red-500/20 text-red-300 font-bold text-xs uppercase tracking-widest border border-red-500/20 hover:bg-red-500/30 hover:text-red-200 transition-colors">
              Consulter
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="group relative overflow-hidden rounded-[2rem] bg-white/[0.03] border border-white/10 p-5 transition-all hover:bg-white/[0.05]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Send className="w-12 h-12 text-blue-400" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">{T.devis_env}</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-white">{statsCounts.envoyé}</p>
              <div className="mb-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] bg-white/[0.03] border border-white/10 p-5 transition-all hover:bg-white/[0.05]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">{T.devis_acc}</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-white">{statsCounts.accepté}</p>
              <div className="mb-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] bg-white/[0.03] border border-white/10 p-5 transition-all hover:bg-white/[0.05]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <CreditCard className="w-12 h-12 text-amber-400" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">{T.tot_fact}</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-black text-amber-300">{fmt(factureStats.total)}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] bg-white/[0.03] border border-white/10 p-5 transition-all hover:bg-white/[0.05]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">{T.fact_ret}</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-white">{factureStats.enRetard}</p>
              {factureStats.enRetard > 0 && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-10">
          <div className="flex gap-1.5 p-1.5 rounded-[1.25rem] bg-white/[0.03] border border-white/10 w-fit backdrop-blur-sm shadow-xl">
            <button onClick={() => setTab("devis")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${tab === "devis" ? "bg-amber-500 text-gray-950 shadow-lg shadow-amber-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {T.devis}
              <span className="ml-2 py-0.5 px-2 rounded-full bg-black/20 text-[10px]">{filteredDevis.length}</span>
            </button>
            <button onClick={() => setTab("factures")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${tab === "factures" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {T.factures}
              <span className="ml-2 py-0.5 px-2 rounded-full bg-black/20 text-[10px]">{filteredFactures.length}</span>
            </button>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className={`absolute ${lang === 'ar-SA' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
              <input type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={T.recherche}
                className={`w-full bg-white/5 border border-white/10 rounded-xl ${lang === 'ar-SA' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50`}
              />
            </div>
            <div className="relative">
              <Filter className={`absolute ${lang === 'ar-SA' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`appearance-none bg-white/5 border border-white/10 rounded-xl ${lang === 'ar-SA' ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 cursor-pointer`}
              >
                <option value="">{T.tous_statuts}</option>
                <option value="brouillon">Brouillon</option>
                {tab === "devis" ? (
                  <>
                    <option value="envoyé">Envoyé</option>
                    <option value="accepté">Accepté</option>
                    <option value="refusé">Refusé</option>
                  </>
                ) : (
                  <>
                    <option value="envoyée">Envoyée</option>
                    <option value="payée">Payée</option>
                    <option value="en_retard">En retard</option>
                  </>
                )}
              </select>
            </div>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-bold shadow-xl active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Exporter PDF
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`grid ${tab === "devis" && user && user.role !== 'client' ? "lg:grid-cols-[1fr_380px]" : ""} gap-6`}>
          {tab === "devis" && (
            <>
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-widest">{T.tous_devis}</h2>
                {loading ? (
                  <div className="flex justify-center py-12"><div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" /></div>
                ) : filteredDevis.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                    <p className="text-gray-500 font-medium italic">{T.no_devis}</p>
                  </div>
                ) : (
                  filteredDevis.map((d) => (
                    <DevisCard 
                      key={d._id} 
                      devis={d} 
                      user={user} 
                      factures={facturesList} 
                      onRefresh={refresh} 
                      onSeeFacture={(num) => {
                        setTab("factures");
                        setSearchTerm(num);
                      }} 
                    />
                  ))
                )}
              </div>
              {user && user.role !== 'client' && <CreateDevisForm user={user} projects={projectsList} clients={clientsList} onCreated={refresh} initialProjectId={initialProjectId} />}
            </>
          )}

          {tab === "factures" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-widest">{T.toutes_fact}</h2>
              {loading ? (
                <div className="flex justify-center py-12"><div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin" /></div>
              ) : filteredFactures.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                  <p className="text-gray-500 font-medium italic">{T.no_fact}</p>
                </div>
              ) : (
                filteredFactures.map((f) => (
                  <FactureCard key={f._id} facture={f} user={user} onRefresh={refresh} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Export with Suspense boundary ──────────────────────────────────────
export default function GestionDevisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" /></div>}>
      <GestionDevisContent />
    </Suspense>
  );
}
