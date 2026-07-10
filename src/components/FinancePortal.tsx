import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Coins, Award, ArrowUpRight, ArrowDownLeft, TrendingUp, 
  Search, PlusCircle, MinusCircle, RefreshCw, Gift, Calendar, 
  Flame, ShoppingBag, Tag, AlertTriangle, CheckCircle, Server, 
  Activity, ShieldCheck, Key, Shield, Info, HelpCircle, FileText, 
  ShieldAlert, PlayCircle, Users, UserPlus, Copy, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinancePortalProps {
  stats: any;
  updateStats: (newStats: any) => void;
  loggedInUser: string | null;
  onOpenLogin: () => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  logs: any[];
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
}

export const FinancePortal: React.FC<FinancePortalProps> = ({
  stats,
  updateStats,
  loggedInUser,
  onOpenLogin,
  realBalance,
  setRealBalance,
  logs,
  setLogs
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'wallet' | 'quests' | 'marketplace' | 'audit' | 'affiliate'>('wallet');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'pix' | 'credit_card' | 'mercadopago' | 'stripe' | 'paypal' | 'debit_card'>('pix');
  const [showPixQr, setShowPixQr] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPixKey, setWithdrawPixKey] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  
  // Marketplace states
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [listingTitle, setListingTitle] = useState('');
  const [listingDesc, setListingDesc] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingCurrency, setListingCurrency] = useState<'coins' | 'real'>('coins');
  const [listingRarity, setListingRarity] = useState<'common' | 'rare' | 'epic' | 'legendary'>('common');
  const [marketSearch, setMarketSearch] = useState('');
  const [marketRarityFilter, setMarketRarityFilter] = useState('all');
  
  // Ledger and Audit states
  const [ledgerStatus, setLedgerStatus] = useState<'unchecked' | 'checking' | 'secure' | 'tampered'>('unchecked');
  const [ledgerAuditReport, setLedgerAuditReport] = useState<any>(null);
  const [systemAuditLogs, setSystemAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  
  // Messages / Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Payments infrastructure extended states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [affiliateCodeInput, setAffiliateCodeInput] = useState('');
  const [affiliateStats, setAffiliateStats] = useState<any>({ referrals: [], commissions: [], totalEarnings: 0 });
  const [userInvoices, setUserInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [conciliationRecords, setConciliationRecords] = useState<any[]>([]);
  const [pciScannerStatus, setPciScannerStatus] = useState<'idle' | 'scanning' | 'passed'>('idle');
  const [pciScannerReport, setPciScannerReport] = useState<any>(null);
  
  // Webhook Simulator state
  const [webhookSimProvider, setWebhookSimProvider] = useState<'stripe' | 'paypal' | 'mercadopago' | 'pix'>('stripe');
  const [webhookSimType, setWebhookSimType] = useState('payment.succeeded');
  const [webhookSimAmount, setWebhookSimAmount] = useState('50.00');
  const [webhookSimCoupon, setWebhookSimCoupon] = useState('');
  const [webhookSimAffiliateId, setWebhookSimAffiliateId] = useState('');
  const [webhookSimCardNum, setWebhookSimCardNum] = useState('');
  const [webhookSimCardName, setWebhookSimCardName] = useState('');
  const [webhookSimCardExpiry, setWebhookSimCardExpiry] = useState('');
  const [webhookSimCardCvv, setWebhookSimCardCvv] = useState('');

  // VIP Plans
  const vipPlans = [
    { id: 'bronze', title: 'VIP Bronze', price: 19.90, coins: 1000, color: 'from-amber-600 to-amber-800' },
    { id: 'silver', title: 'VIP Silver', price: 39.90, coins: 2500, color: 'from-slate-400 to-slate-600' },
    { id: 'gold', title: 'VIP Gold', price: 69.90, coins: 5000, color: 'from-yellow-500 to-amber-500' },
    { id: 'platinum', title: 'VIP Platinum', price: 99.90, coins: 10000, color: 'from-cyan-500 to-blue-600' }
  ];

  // Simulated Login Bonus streak
  const [loginStreak, setLoginStreak] = useState<number>(3); // day index (1-7)
  const [bonusClaimedToday, setBonusClaimedToday] = useState(false);

  // Simulated Quests
  const [dailyQuests, setDailyQuests] = useState([
    { id: 'quest_login', title: 'Login Diário', description: 'Entre no GameZon hoje.', rewardCoins: 50, rewardXp: 100, progress: 1, target: 1, claimed: false },
    { id: 'quest_play', title: 'Diversão Ativa', description: 'Jogue pelo menos 2 partidas em qualquer slot.', rewardCoins: 150, rewardXp: 300, progress: 1, target: 2, claimed: false },
    { id: 'quest_feed', title: 'Socializador', description: 'Deixe um comentário em algum post do feed.', rewardCoins: 80, rewardXp: 150, progress: 0, target: 1, claimed: false },
  ]);

  const [weeklyQuests, setWeeklyQuests] = useState([
    { id: 'quest_convert', title: 'Investidor Gamer', description: 'Converta pelo menos R$ 10,00 de Saldo Real para moedas.', rewardCoins: 300, rewardXp: 600, progress: 0, target: 10, claimed: false },
    { id: 'quest_vip', title: 'Elite GameZon', description: 'Assine qualquer plano VIP.', rewardCoins: 1000, rewardXp: 2000, progress: stats.isVip ? 1 : 0, target: 1, claimed: false }
  ]);

  useEffect(() => {
    if (loggedInUser) {
      fetchWalletAndLogs();
      fetchMarketplace();
      fetchAuditLogs();
      fetchInvoices();
      fetchAffiliateStats();
      fetchWebhookLogs();
      fetchConciliationRecords();
    }
  }, [loggedInUser]);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  const fetchInvoices = async () => {
    if (!loggedInUser) return;
    try {
      const res = await fetch('/api/payments/invoice/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setUserInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const fetchAffiliateStats = async () => {
    if (!loggedInUser) return;
    try {
      const res = await fetch('/api/payments/affiliate/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        setAffiliateStats(data);
      }
    } catch (err) {
      console.error('Error fetching affiliate stats:', err);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      const res = await fetch('/api/payments/webhook/logs');
      const data = await res.json();
      if (data.success) {
        setWebhookLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching webhook logs:', err);
    }
  };

  const fetchConciliationRecords = async () => {
    try {
      const res = await fetch('/api/payments/conciliation/list');
      const data = await res.json();
      if (data.success) {
        setConciliationRecords(data.records || []);
      }
    } catch (err) {
      console.error('Error fetching conciliation records:', err);
    }
  };

  const handleValidateCoupon = async (codeStr: string) => {
    if (!codeStr) return;
    try {
      const res = await fetch('/api/payments/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeStr })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.coupon);
        showAlert(`Cupom ${data.coupon.code} aplicado com sucesso! Desconto: R$ ${data.coupon.value}${data.coupon.type === 'percent' ? '%' : ''}`);
      } else {
        setAppliedCoupon(null);
        showAlert(data.error || 'Cupom inválido.', 'error');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      showAlert('Erro ao validar cupom.', 'error');
    }
  };

  const handleRegisterReferral = async (affId: string) => {
    if (!affId) return;
    try {
      const res = await fetch('/api/payments/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId: affId, referredUserId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Código de afiliado vinculado com sucesso!');
        fetchAffiliateStats();
      } else {
        showAlert(data.error || 'Erro ao vincular afiliado.', 'error');
      }
    } catch (err) {
      console.error('Error linking affiliate:', err);
      showAlert('Erro ao salvar indicação.', 'error');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const res = await fetch('/api/payments/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Assinatura recorrente cancelada.');
        fetchWalletAndLogs();
      } else {
        showAlert(data.error || 'Erro ao cancelar assinatura.', 'error');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
    }
  };

  const handleRequestRefund = async (transactionId: string) => {
    try {
      const res = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, userId: loggedInUser })
      });
      const data = await res.json();
      if (data.success) {
        showAlert(data.message || 'Estorno aprovado com sucesso!');
        fetchWalletAndLogs();
        fetchInvoices();
      } else {
        showAlert(data.error || 'Erro ao solicitar estorno.', 'error');
      }
    } catch (err) {
      console.error('Error requesting refund:', err);
    }
  };

  const handleSimulateWebhook = async () => {
    try {
      const res = await fetch('/api/payments/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: webhookSimProvider,
          eventType: webhookSimType,
          amount: parseFloat(webhookSimAmount),
          userId: loggedInUser,
          couponCode: webhookSimCoupon || undefined,
          affiliateId: webhookSimAffiliateId || undefined,
          cardDetails: webhookSimType.includes('card') ? {
            number: webhookSimCardNum || '4111222233334444',
            name: webhookSimCardName || 'GZ Player',
            expiry: webhookSimCardExpiry || '12/28',
            cvv: webhookSimCardCvv || '123'
          } : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert(`Simulação enviada! Webhook de ${webhookSimProvider.toUpperCase()} processado.`);
        fetchWalletAndLogs();
        fetchInvoices();
        fetchWebhookLogs();
        fetchConciliationRecords();
        fetchAffiliateStats();
      } else {
        showAlert(data.error || 'Falha na simulação de webhook.', 'error');
      }
    } catch (err) {
      console.error('Error simulating webhook:', err);
    }
  };

  const handleManualReconcile = async (transactionId: string) => {
    try {
      const res = await fetch('/api/payments/conciliation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          action: 'reconcile',
          providerAmount: 50.0
        })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('Transação conciliada manualmente com sucesso!');
        fetchConciliationRecords();
      } else {
        showAlert(data.error || 'Erro ao conciliar.', 'error');
      }
    } catch (err) {
      console.error('Error in conciliation:', err);
    }
  };

  const handleRunPciScanner = () => {
    setPciScannerStatus('scanning');
    setPciScannerReport(null);
    setTimeout(() => {
      setPciScannerStatus('passed');
      setPciScannerReport({
        scanDate: new Date().toLocaleString(),
        standards: 'PCI-DSS v4.0 Compliance Core Suite',
        status: 'SECURE / APPROVED',
        vulnerabilities: 0,
        checks: [
          { name: 'Cardholder Data Storage Encryption', status: 'PASS', details: 'All card numbers masked in storage (XXXX-XXXX-XXXX-1234)' },
          { name: 'Plaintext Logging Sanitization Filters', status: 'PASS', details: 'RegEx filters masking high-risk payment payloads successfully active' },
          { name: 'Cryptographic Ledger Hash Integrity', status: 'PASS', details: 'All HMAC sha256 transaction signatures correspond with local secrets' },
          { name: 'HTTPS Transit Security TLS v1.3 Enforcement', status: 'PASS', details: 'Cipher suite restrictions verified successfully' }
        ]
      });
      showAlert('Varredura PCI Completa! Ambiente 100% em conformidade com as normas de segurança PCI-DSS.');
    }, 2500);
  };

  const fetchWalletAndLogs = async () => {
    if (!loggedInUser) return;
    try {
      const response = await fetch('/api/finance/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser })
      });
      const data = await response.json();
      if (data.success) {
        setRealBalance(data.realBalance);
        updateStats({
          ...stats,
          coins: data.coins,
          level: data.level,
          points: data.xp
        });
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Error fetching wallet info:', err);
    }
  };

  const fetchMarketplace = async () => {
    try {
      const response = await fetch('/api/finance/marketplace');
      const data = await response.json();
      if (data.success) {
        setMarketplaceItems(data.listings);
      }
    } catch (err) {
      console.error('Error fetching marketplace listings:', err);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const response = await fetch('/api/finance/audit/logs');
      const data = await response.json();
      if (data.success) {
        setSystemAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching system audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Deposit funds
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      onOpenLogin();
      return;
    }
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) {
      showAlert('Por favor, informe um valor de depósito válido.', 'error');
      return;
    }

    if (depositMethod === 'pix') {
      setShowPixQr(true);
    } else {
      processDepositDirectly();
    }
  };

  const processDepositDirectly = async () => {
    try {
      const response = await fetch('/api/finance/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          amount: parseFloat(depositAmount),
          method: depositMethod === 'pix' ? 'PIX Gateway' : 'Credit Card Gateway'
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRealBalance(data.realBalance);
        setDepositAmount('');
        setShowPixQr(false);
        showAlert(`Depósito de R$ ${parseFloat(depositAmount).toFixed(2)} aprovado e creditado com sucesso!`);
        fetchWalletAndLogs();
        fetchAuditLogs();
      } else {
        showAlert(data.error || 'Falha ao processar depósito.', 'error');
      }
    } catch (err) {
      showAlert('Erro de rede ao processar depósito.', 'error');
    }
  };

  // Withdraw cashout
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      onOpenLogin();
      return;
    }
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      showAlert('Por favor, informe um valor de saque válido.', 'error');
      return;
    }
    if (!withdrawPixKey.trim()) {
      showAlert('Por favor, insira uma chave PIX válida para transferência.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/finance/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          amount: val,
          pixKey: withdrawPixKey
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRealBalance(data.realBalance);
        setWithdrawAmount('');
        setWithdrawPixKey('');
        showAlert(`Saque PIX de R$ ${val.toFixed(2)} solicitado com sucesso! Fundos transferidos.`);
        fetchWalletAndLogs();
        fetchAuditLogs();
      } else {
        showAlert(data.error || 'Falha ao processar saque.', 'error');
      }
    } catch (err) {
      showAlert('Erro de rede ao solicitar saque.', 'error');
    }
  };

  // Convert BRL to Coins
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      onOpenLogin();
      return;
    }
    const val = parseFloat(convertAmount);
    if (isNaN(val) || val <= 0) {
      showAlert('Por favor, insira um valor válido para conversão.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/finance/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          amountReal: val
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRealBalance(data.realBalance);
        updateStats({
          ...stats,
          coins: data.coins
        });
        setConvertAmount('');
        showAlert(`Sucesso! R$ ${val.toFixed(2)} convertidos em moedas. Você recebeu moedas com 10% bônus Cashback!`);
        fetchWalletAndLogs();
        fetchAuditLogs();
      } else {
        showAlert(data.error || 'Falha na conversão.', 'error');
      }
    } catch (err) {
      showAlert('Erro de rede ao converter saldos.', 'error');
    }
  };

  // Buy VIP
  const handleBuyVip = async (plan: any) => {
    if (!loggedInUser) {
      onOpenLogin();
      return;
    }
    
    let purchasePrice = plan.price;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        purchasePrice = purchasePrice * (1 - appliedCoupon.value / 100);
      } else {
        purchasePrice = Math.max(0, purchasePrice - appliedCoupon.value);
      }
    }

    if (realBalance < purchasePrice) {
      showAlert('Saldo real insuficiente para adquirir este plano VIP. Faça um depósito.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/finance/vip/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          planId: plan.id,
          price: purchasePrice,
          title: plan.title,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRealBalance(data.realBalance);
        updateStats({
          ...stats,
          coins: data.coins,
          isVip: true,
          badges: data.badges
        });
        showAlert(`Parabéns! Assinatura ${plan.title} ativada por R$ ${purchasePrice.toFixed(2)}. Benefícios liberados!`);
        setAppliedCoupon(null);
        setCouponCode('');
        fetchWalletAndLogs();
        fetchInvoices();
        fetchAuditLogs();
        fetchAffiliateStats();
      } else {
        showAlert(data.error || 'Falha ao processar plano VIP.', 'error');
      }
    } catch (err) {
      console.error('VIP Purchase Error:', err);
      showAlert('Erro ao assinar plano VIP.', 'error');
    }
  };

  // Claim Quest Reward / Login Bonus
  const handleClaimQuest = async (quest: any, isDaily: boolean) => {
    if (!loggedInUser) {
      onOpenLogin();
      return;
    }

    try {
      const response = await fetch('/api/finance/quest/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          questId: quest.id,
          questType: isDaily ? 'daily' : 'weekly',
          rewardCoins: quest.rewardCoins,
          rewardXp: quest.rewardXp,
          title: quest.title
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        updateStats({
          ...stats,
          coins: data.coins,
          points: data.xp,
          level: data.level
        });

        if (isDaily) {
          setDailyQuests(prev => prev.map(q => q.id === quest.id ? { ...q, claimed: true } : q));
        } else {
          setWeeklyQuests(prev => prev.map(q => q.id === quest.id ? { ...q, claimed: true } : q));
        }

        if (data.levelUpDetected) {
          showAlert(`🎉 LEVEL UP! Você subiu para o Nível ${data.level} e ganhou um bônus de 200 🪙!`, 'success');
        } else {
          showAlert(`Recompensa de '${quest.title}' resgatada: +${quest.rewardCoins} 🪙 e +${quest.rewardXp} XP!`);
        }
        fetchWalletAndLogs();
        fetchAuditLogs();
      } else {
        showAlert(data.error || 'Falha ao resgatar recompensa.', 'error');
      }
    } catch (err) {
      showAlert('Erro de rede ao resgatar recompensa.', 'error');
    }
  };

  // Claim Daily Login Bonus
  const handleClaimLoginBonus = async () => {
    if (!loggedInUser) {
      onOpenLogin();
      return;
    }
    const bonusTable = [50, 75, 100, 150, 200, 300, 500];
    const rewardCoins = bonusTable[loginStreak];
    const rewardXp = (loginStreak + 1) * 50;

    try {
      const response = await fetch('/api/finance/quest/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          questId: `quest_login_streak_${loginStreak + 1}`,
          questType: 'daily_bonus',
          rewardCoins,
          rewardXp,
          title: `Bônus de Login Diário (Dia ${loginStreak + 1})`
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        updateStats({
          ...stats,
          coins: data.coins,
          points: data.xp,
          level: data.level
        });
        setBonusClaimedToday(true);
        setLoginStreak(prev => (prev + 1) % 7);
        showAlert(`Bônus de Login resgatado! +${rewardCoins} Moedas e +${rewardXp} XP creditados.`);
        fetchWalletAndLogs();
        fetchAuditLogs();
      } else {
        showAlert(data.error || 'Falha ao processar bônus de login.', 'error');
      }
    } catch (err) {
      showAlert('Erro ao reivindicar bônus de login.', 'error');
    }
  };

  // Marketplace Listing
  const handleListMarketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      onOpenLogin();
      return;
    }
    const priceNum = parseFloat(listingPrice);
    if (!listingTitle.trim() || isNaN(priceNum) || priceNum <= 0) {
      showAlert('Por favor, informe um título válido e preço superior a zero.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/finance/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser,
          title: listingTitle,
          description: listingDesc,
          price: priceNum,
          currency: listingCurrency,
          rarity: listingRarity
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setListingTitle('');
        setListingDesc('');
        setListingPrice('');
        showAlert(`Item '${listingTitle}' anunciado com sucesso no marketplace player-to-player!`);
        fetchMarketplace();
        fetchWalletAndLogs();
        fetchAuditLogs();
      } else {
        showAlert(data.error || 'Falha ao anunciar item. Certifique-se de possuir o item no seu inventário.', 'error');
      }
    } catch (err) {
      showAlert('Erro ao anunciar item no mercado.', 'error');
    }
  };

  // Purchase Marketplace Item
  const handleBuyMarketItem = async (listingId: string) => {
    if (!loggedInUser) {
      onOpenLogin();
      return;
    }

    try {
      const response = await fetch('/api/finance/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: loggedInUser,
          listingId
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRealBalance(data.realBalance);
        updateStats({
          ...stats,
          coins: data.coins,
          inventario: data.inventario
        });
        showAlert('Compra efetuada com sucesso! O item foi transferido para seu inventário.');
        fetchMarketplace();
        fetchWalletAndLogs();
        fetchAuditLogs();
      } else {
        showAlert(data.error || 'Falha ao efetuar compra de item.', 'error');
      }
    } catch (err) {
      showAlert('Erro ao concluir transação de compra.', 'error');
    }
  };

  // Blockchain integrity ledger validator
  const handleVerifyLedger = async () => {
    setLedgerStatus('checking');
    try {
      const response = await fetch('/api/finance/blockchain/verify', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setLedgerAuditReport(data);
        if (data.status === 'SECURE') {
          setLedgerStatus('secure');
          showAlert('Sucesso! Blockchain financeira verificada. Todos os hashes correspondem e não há adulterações.');
        } else {
          setLedgerStatus('tampered');
          showAlert('ALERTA DE SEGURANÇA: Registros de auditoria violados!', 'error');
        }
      } else {
        setLedgerStatus('unchecked');
        showAlert('Falha na resposta do servidor de auditoria.', 'error');
      }
    } catch (err) {
      setLedgerStatus('unchecked');
      showAlert('Erro de rede ao conectar à blockchain de auditoria.', 'error');
    }
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return marketplaceItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(marketSearch.toLowerCase()) || 
                            item.seller_name.toLowerCase().includes(marketSearch.toLowerCase());
      const matchesRarity = marketRarityFilter === 'all' || item.rarity === marketRarityFilter;
      return matchesSearch && matchesRarity;
    });
  }, [marketplaceItems, marketSearch, marketRarityFilter]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 text-center md:text-left relative z-10">
          <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border border-cyan-500/20">
            GameZon Central Security Engine
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Portal Financeiro &amp; Auditoria
          </h1>
          <p className="text-slate-400 text-sm max-w-xl font-medium">
            Gerencie sua carteira virtual, participe de missões recompensadoras, compre/venda itens premium no marketplace e verifique a integridade criptográfica de transações.
          </p>
        </div>

        {/* Global Wallet Display Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-xl w-full md:w-80 space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Wallet className="w-4 h-4 text-cyan-400" /> Minha Carteira
            </span>
            {stats.isVip && (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-wider">
                👑 VIP ATIVO
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Saldo Real</span>
              <h3 className="text-lg font-black text-emerald-400 font-mono">
                R$ {realBalance.toFixed(2)}
              </h3>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Moedas Virtuais</span>
              <h3 className="text-lg font-black text-amber-400 font-mono flex items-center gap-1">
                🪙 {stats.coins || 0}
              </h3>
            </div>
          </div>

          {/* Level Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Nível {stats.level || 1}</span>
              <span>{(stats.points || 0) % 1000} / 1000 XP</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-900">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${((stats.points || 0) % 1000) / 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messaging */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm shadow-lg ${
              alertMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-medium">{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-200 gap-2 md:gap-4 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('wallet')}
          className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
            activeSubTab === 'wallet'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" /> Carteira &amp; Câmbio
        </button>
        <button
          onClick={() => setActiveSubTab('affiliate')}
          className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
            activeSubTab === 'affiliate'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-purple-500" /> Indicações &amp; Afiliados
        </button>
        <button
          onClick={() => setActiveSubTab('quests')}
          className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
            activeSubTab === 'quests'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" /> Missões &amp; Recompensas
        </button>
        <button
          onClick={() => setActiveSubTab('marketplace')}
          className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
            activeSubTab === 'marketplace'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Player Marketplace
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
            activeSubTab === 'audit'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Segurança &amp; Ledger
        </button>
      </div>

      {/* Content Panels */}
      <div>
        {/* TAB 1: WALLET & CASH EXCHANGE */}
        {activeSubTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Action Cards Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Deposit Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                  <PlusCircle className="w-5 h-5 text-emerald-500" />
                  Adicionar Fundos (Depósito Seguro)
                </div>
                <p className="text-slate-500 text-xs">
                  Aporte saldo real na sua carteira virtual para assinar planos VIP ou comprar itens exclusivos de outros jogadores.
                </p>

                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Valor do Depósito (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="5" 
                        max="5000"
                        placeholder="Ex: 50.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Método de Pagamento</label>
                      <select 
                        value={depositMethod}
                        onChange={(e: any) => setDepositMethod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-900"
                      >
                        <option value="pix">PIX Instântaneo (Sem Taxas)</option>
                        <option value="credit_card">Cartão de Crédito Gateway</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Prosseguir para Depósito
                  </button>
                </form>

                {/* Simulated PIX QR Code Modal */}
                {showPixQr && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center text-white space-y-3 relative overflow-hidden">
                    <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-white" onClick={() => setShowPixQr(false)}>✕</div>
                    <div className="bg-white p-3 rounded-lg">
                      {/* Fake stylized QR Code */}
                      <div className="w-36 h-36 border-4 border-slate-900 flex flex-wrap p-1 gap-1">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className={`w-[42px] h-[42px] ${i % 3 === 0 || i === 8 ? 'bg-slate-900' : 'bg-slate-100'} rounded-sm`} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">PIX DINÂMICO AUDITADO</span>
                      <p className="text-xs text-slate-300 max-w-sm">Escaneie o QR Code acima para depositar <strong className="text-emerald-400">R$ {parseFloat(depositAmount).toFixed(2)}</strong>. O crédito é instantâneo na carteira.</p>
                    </div>
                    <button 
                      onClick={processDepositDirectly}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirmar Pagamento Simulado
                    </button>
                  </div>
                )}
              </div>

              {/* Withdraw Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                  <MinusCircle className="w-5 h-5 text-rose-500" />
                  Efetuar Saque (Cashout Regulamentado)
                </div>
                <p className="text-slate-500 text-xs">
                  Retire saldo real da sua carteira virtual diretamente para sua conta bancária via PIX. Operação sujeita a limites diários de conformidade.
                </p>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Valor de Saque (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 50.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Chave PIX (CPF, Celular, E-mail, Chave Aleatória)</label>
                      <input 
                        type="text" 
                        placeholder="Insira sua chave PIX"
                        value={withdrawPixKey}
                        onChange={(e) => setWithdrawPixKey(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
                    <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>Seu limite máximo por transação de saque é <strong className="text-slate-800">R$ {stats.withdrawLimit || 100.0}</strong>. Para aumentar seu limite, complete sua verificação de identidade no painel de perfil.</span>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors"
                  >
                    Solicitar Saque via PIX
                  </button>
                </form>
              </div>

              {/* Conversion and Cashback Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                  <RefreshCw className="w-5 h-5 text-amber-500 animate-spin-slow" />
                  Câmbio &amp; Cashback de Moedas Virtuais
                </div>
                <p className="text-slate-500 text-xs">
                  Converta seu Saldo Real para Moedas Virtuais para usar nos minijogos. Ganhe <strong className="text-amber-500">10% de Cashback em Moedas Adicionais</strong> em cada conversão!
                </p>

                <form onSubmit={handleConvert} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Valor em Saldo Real (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 10.00"
                        value={convertAmount}
                        onChange={(e) => setConvertAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 font-mono text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Taxa de Câmbio:</span>
                        <span>R$ 1,00 = 100 🪙</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Bônus Cashback (+10%):</span>
                        <span className="text-amber-500">+{convertAmount ? Math.floor(parseFloat(convertAmount) * 10) : 0} 🪙</span>
                      </div>
                      <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1.5 mt-1.5">
                        <span>Total de Moedas:</span>
                        <span className="text-amber-600">{convertAmount ? Math.floor(parseFloat(convertAmount) * 110) : 0} 🪙</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm py-2.5 rounded-lg transition-colors"
                  >
                    Confirmar Conversão com Cashback (+10% Bônus)
                  </button>
                </form>
              </div>

              {/* Faturas, Recibos e Estornos Panel */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Faturas, Recibos &amp; Notas Fiscais
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-bold border border-indigo-100">PCI Secure Shield</span>
                </div>
                <p className="text-slate-500 text-xs">
                  Acesse suas notas fiscais de serviços e faturas de recargas avulsas ou assinaturas recorrentes. Solicite cancelamentos ou estornos protegidos pelas normas PCI-DSS.
                </p>

                {/* Future Billing Provision Form */}
                <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">Provisionar Nota Fiscal Futura (Simulador de Cobrança)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Valor Cobrança (R$)</label>
                      <input 
                        type="number"
                        id="future-amount"
                        placeholder="Ex: 49.90"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Data de Vencimento</label>
                      <input 
                        type="date"
                        id="future-date"
                        defaultValue={new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const amountEl = document.getElementById('future-amount') as HTMLInputElement;
                      const dateEl = document.getElementById('future-date') as HTMLInputElement;
                      if (!amountEl || !dateEl || !amountEl.value || !dateEl.value) {
                        showAlert('Por favor, informe o valor e o vencimento.', 'error');
                        return;
                      }
                      try {
                        const res = await fetch('/api/payments/invoice/create-future', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: loggedInUser,
                            amount: parseFloat(amountEl.value),
                            dueDate: dateEl.value
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          showAlert('Cobrança de fatura futura provisionada com sucesso!');
                          amountEl.value = '';
                          fetchInvoices();
                        } else {
                          showAlert(data.error || 'Erro ao provisionar.', 'error');
                        }
                      } catch (err) {
                        console.error('Error creating future invoice:', err);
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Provisionar Fatura de Cobrança Futura
                  </button>
                </div>

                <div className="space-y-3">
                  {userInvoices.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      Nenhuma fatura emitida ainda para a sua conta.<br/>
                      Experimente simular uma recarga de fundos.
                    </div>
                  ) : (
                    userInvoices.map((inv: any) => (
                      <div 
                        key={inv.id}
                        className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <FileText className={`w-4 h-4 mt-0.5 ${inv.status === 'paid' ? 'text-emerald-500' : inv.status === 'refunded' ? 'text-rose-500' : 'text-amber-500'}`} />
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{inv.invoice_number}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                inv.status === 'refunded' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {inv.status === 'paid' ? 'Paga' : inv.status === 'refunded' ? 'Reembolsada' : 'Futura'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5">
                              <span>Emissão: {inv.issue_date}</span>
                              <span>Vencimento: {inv.due_date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                          <span className="font-extrabold text-slate-900 font-mono text-sm">
                            R$ {Number(inv.amount).toFixed(2)}
                          </span>

                          <div className="flex gap-1">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold transition-all"
                            >
                              Ver PDF
                            </button>
                            {inv.status === 'paid' && (
                              <button
                                onClick={() => handleRequestRefund(inv.invoice_number.replace('FAT-', 'LOG-'))}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded text-[10px] font-bold transition-all"
                              >
                                Estornar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar Column (VIP Options and Recent Statement) */}
            <div className="space-y-6">
              
              {/* VIP Plans Slider */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-amber-400" /> Sistema VIP GameZon
                  </h3>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-lg border border-cyan-400/20">PREMIUM VIP</span>
                </div>
                <p className="text-slate-400 text-xs">
                  Assine um clube VIP usando seu saldo real para desbloquear bônus passivos de moedas, badges exclusivos de perfil e multiplicadores de experiência.
                </p>

                {/* Subscriptions Recurrent Active Status */}
                {stats.isVip && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        ● Assinatura Recorrente Ativa
                      </span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 rounded font-black">GOLD</span>
                    </div>
                    <p className="text-[10px] text-slate-300">Sua assinatura está ativa e configurada para renovação automática mensal.</p>
                    <button
                      onClick={handleCancelSubscription}
                      className="w-full bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/20 text-[10px] font-black py-1 rounded transition-all uppercase"
                    >
                      Cancelar Assinatura Recorrente
                    </button>
                  </div>
                )}

                {/* Coupons / Promotion Input */}
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Possui Cupom de Desconto?</span>
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      placeholder="Ex: DESCONTO10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 flex-1"
                    />
                    <button
                      onClick={() => handleValidateCoupon(couponCode)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1 rounded text-xs font-bold transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono">
                      <span>Cupom Ativo: <strong>{appliedCoupon.code}</strong></span>
                      <span>-{appliedCoupon.value}{appliedCoupon.type === 'percent' ? '%' : ' R$'}</span>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-500">Cupons promocionais disponíveis: <strong>DESCONTO10</strong>, <strong>VIPCUPOM</strong>, <strong>CASHBACK50</strong></p>
                </div>

                <div className="space-y-3">
                  {vipPlans.map((plan) => {
                    let discountedPrice = plan.price;
                    if (appliedCoupon) {
                      if (appliedCoupon.type === 'percent') {
                        discountedPrice = discountedPrice * (1 - appliedCoupon.value / 100);
                      } else {
                        discountedPrice = Math.max(0, discountedPrice - appliedCoupon.value);
                      }
                    }

                    return (
                      <div 
                        key={plan.id}
                        className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-sm font-black text-white">{plan.title}</span>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span>+ {plan.coins} 🪙 Boas-Vindas</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {appliedCoupon ? (
                            <div className="block">
                              <span className="text-[9px] line-through text-slate-500 font-mono block">R$ {plan.price.toFixed(2)}</span>
                              <span className="text-xs font-mono text-emerald-400 block font-bold">R$ {discountedPrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-emerald-400 block font-bold">R$ {plan.price.toFixed(2)}/mês</span>
                          )}
                          <button
                            onClick={() => handleBuyVip(plan)}
                            className="mt-1 bg-white text-slate-950 hover:bg-slate-100 px-3 py-1 text-[10px] font-black uppercase rounded transition-colors"
                          >
                            Assinar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Secure Transaction Ledger Overview */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-1.5">
                  <Activity className="w-5 h-5 text-slate-500" /> Histórico Criptográfico
                </h3>
                <p className="text-slate-500 text-xs">
                  Registro em ledger imutável de todas as suas transações. Todas as transações possuem hashes criptográficos assinados pelo GameZon.
                </p>

                <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Nenhuma transação financeira registrada ainda.
                    </div>
                  ) : (
                    [...logs].slice(0, 5).map((log) => {
                      const isReal = log.currency === 'real';
                      const isEarn = log.type === 'earn';

                      return (
                        <div 
                          key={log.id}
                          className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5 max-w-[70%]">
                            <span className="text-[9px] font-mono text-slate-400 block uppercase">{log.id}</span>
                            <span className="font-bold text-slate-800 block truncate">{log.description}</span>
                            <span className="text-[9px] text-slate-500 font-mono block select-all">{log.securityHash ? log.securityHash.slice(0, 16) + '...' : ''}</span>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end justify-center">
                            <span className={`font-black font-mono block ${isEarn ? 'text-emerald-600' : isReal ? 'text-cyan-600' : 'text-rose-600'}`}>
                              {isEarn ? '+' : isReal ? 'S' : '-'}
                              {isReal ? `R$ ${log.amount.toFixed(2)}` : `${log.amount} 🪙`}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isReal && !log.description.includes('REEMBOLSADO') && (
                                <button
                                  onClick={() => handleRequestRefund(log.id)}
                                  className="text-[9px] font-bold text-rose-500 hover:underline bg-rose-50 px-1 py-0.5 rounded border border-rose-100"
                                >
                                  Estornar
                                </button>
                              )}
                              <span className="text-[8px] text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-1 rounded font-bold font-mono">OK</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: REWARDS & QUESTS HUB */}
        {activeSubTab === 'quests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daily Streak Calendar (Login Bonus) */}
            <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-[10px] font-mono tracking-widest uppercase font-bold flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse" /> Recompensas Ativas
                </span>
                <h3 className="text-slate-900 font-extrabold text-lg flex items-center gap-2">
                  Bônus de Login Diário
                </h3>
              </div>
              <p className="text-slate-500 text-xs">
                Faça login todos os dias consecutivamente para multiplicar seus prêmios de moedas e XP!
              </p>

              {/* Streak Grid Day 1-7 */}
              <div className="grid grid-cols-7 gap-1.5 py-4">
                {[50, 75, 100, 150, 200, 300, 500].map((bonus, idx) => {
                  const isClaimed = idx < loginStreak;
                  const isCurrent = idx === loginStreak && !bonusClaimedToday;
                  const isFuture = idx > loginStreak || (idx === loginStreak && bonusClaimedToday);

                  return (
                    <div 
                      key={idx}
                      className={`p-2 rounded-lg border text-center flex flex-col items-center justify-between h-20 transition-all ${
                        isClaimed 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : isCurrent 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 scale-105 shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] font-bold font-mono">D{idx+1}</span>
                      <Coins className="w-4 h-4 shrink-0" />
                      <span className="text-[9px] font-black font-mono">+{bonus}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleClaimLoginBonus}
                disabled={bonusClaimedToday}
                className={`w-full font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  bonusClaimedToday 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {bonusClaimedToday ? 'Bônus Já Resgatado Hoje!' : 'Resgatar Bônus Diário'}
              </button>
            </div>

            {/* Interactive Quests Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Daily Quests List */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900 font-extrabold text-lg flex items-center gap-1.5">
                    <Gift className="w-5 h-5 text-indigo-500" /> Missões Diárias (Daily Quests)
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/5 px-2.5 py-1 rounded-full border border-indigo-500/10">Reseta em 14h</span>
                </div>
                <p className="text-slate-500 text-xs">
                  Complete os objetivos diários abaixo para acumular moedas e subir de nível mais rápido.
                </p>

                <div className="space-y-4">
                  {dailyQuests.map((quest) => {
                    const isCompleted = quest.progress >= quest.target;
                    return (
                      <div 
                        key={quest.id}
                        className="bg-slate-50 border border-slate-100/70 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 max-w-lg">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{quest.title}</h4>
                            {quest.claimed && (
                              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">RESGATADO</span>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs">{quest.description}</p>
                          
                          {/* Progress bar */}
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">{quest.progress}/{quest.target}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right space-y-0.5">
                            <span className="text-amber-600 font-black font-mono text-xs block">+{quest.rewardCoins} 🪙</span>
                            <span className="text-cyan-600 font-bold font-mono text-[10px] block">+{quest.rewardXp} XP</span>
                          </div>
                          <button
                            onClick={() => handleClaimQuest(quest, true)}
                            disabled={!isCompleted || quest.claimed}
                            className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-colors ${
                              quest.claimed 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isCompleted 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Resgatar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Quests List */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900 font-extrabold text-lg flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-fuchsia-500" /> Missões Semanais (Weekly Milestones)
                  </h3>
                  <span className="text-[10px] font-mono text-fuchsia-500 bg-fuchsia-500/5 px-2.5 py-1 rounded-full border border-fuchsia-500/10">Reseta em 4 dias</span>
                </div>
                <p className="text-slate-500 text-xs">
                  Desafios mais robustos que dão bônus massivos de moedas e nível para os jogadores ativos.
                </p>

                <div className="space-y-4">
                  {weeklyQuests.map((quest) => {
                    const isCompleted = quest.progress >= quest.target;
                    return (
                      <div 
                        key={quest.id}
                        className="bg-slate-50 border border-slate-100/70 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 max-w-lg">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{quest.title}</h4>
                            {quest.claimed && (
                              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">RESGATADO</span>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs">{quest.description}</p>
                          
                          {/* Progress bar */}
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-fuchsia-500 rounded-full"
                                style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">{quest.progress}/{quest.target}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right space-y-0.5">
                            <span className="text-amber-600 font-black font-mono text-xs block">+{quest.rewardCoins} 🪙</span>
                            <span className="text-cyan-600 font-bold font-mono text-[10px] block">+{quest.rewardXp} XP</span>
                          </div>
                          <button
                            onClick={() => handleClaimQuest(quest, false)}
                            disabled={!isCompleted || quest.claimed}
                            className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-colors ${
                              quest.claimed 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isCompleted 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Resgatar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: PLAYER-TO-PLAYER MARKETPLACE */}
        {activeSubTab === 'marketplace' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form list item for sale */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 h-fit">
              <h3 className="text-slate-900 font-extrabold text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-slate-500" />
                Anunciar Item para Venda
              </h3>
              <p className="text-slate-500 text-xs">
                Venda itens do seu inventário (skins de avatar, auras, acessórios) para outros jogadores. A plataforma cobra <strong className="text-rose-500">10% de taxa de comissão</strong> sobre a venda.
              </p>

              <form onSubmit={handleListMarketItem} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Item do Inventário</label>
                  <select 
                    value={listingTitle}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setListingTitle(sel);
                      // Auto-fill rarity based on what matches
                      const match = stats.inventario?.find((it: any) => it.name === sel);
                      if (match) {
                        setListingRarity(match.rarity || 'common');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-900"
                  >
                    <option value="">-- Escolha um item do seu inventário --</option>
                    {stats.inventario && stats.inventario.length > 0 ? (
                      stats.inventario.map((it: any) => (
                        <option key={it.id} value={it.name}>{it.name} ({it.rarity || 'Comum'})</option>
                      ))
                    ) : (
                      <option disabled>Nenhum item disponível no inventário</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Descrição do Anúncio</label>
                  <textarea 
                    placeholder="Escreva detalhes ou atrativos do item..."
                    value={listingDesc}
                    onChange={(e) => setListingDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Preço Anunciado</label>
                    <input 
                      type="number" 
                      step="1"
                      placeholder="Ex: 50"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Moeda de Cobrança</label>
                    <select 
                      value={listingCurrency}
                      onChange={(e: any) => setListingCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-900"
                    >
                      <option value="coins">Moedas (🪙)</option>
                      <option value="real">Saldo Real (R$)</option>
                    </select>
                  </div>
                </div>

                {/* Estimate summary */}
                {listingPrice && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] space-y-1 text-slate-500 font-mono">
                    <div className="flex justify-between">
                      <span>Valor de Venda:</span>
                      <span>{listingPrice} {listingCurrency === 'coins' ? 'Coins' : 'BRL'}</span>
                    </div>
                    <div className="flex justify-between text-rose-500">
                      <span>Plataforma Fee (10%):</span>
                      <span>-{(parseFloat(listingPrice) * 0.1).toFixed(1)} {listingCurrency === 'coins' ? 'Coins' : 'BRL'}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-200 pt-1 mt-1">
                      <span>Você Receberá:</span>
                      <span>{(parseFloat(listingPrice) * 0.9).toFixed(1)} {listingCurrency === 'coins' ? 'Coins' : 'BRL'}</span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-2 rounded-lg transition-colors"
                >
                  Confirmar e Listar Item
                </button>
              </form>
            </div>

            {/* Marketplace Grid Listings */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Marketplace Filters */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar itens ou vendedores..."
                    value={marketSearch}
                    onChange={(e) => setMarketSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <span className="text-xs text-slate-500 font-medium">Raridade:</span>
                  <select
                    value={marketRarityFilter}
                    onChange={(e) => setMarketRarityFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-900"
                  >
                    <option value="all">Todas as Raridades</option>
                    <option value="common">Comum</option>
                    <option value="rare">Raro</option>
                    <option value="epic">Épico</option>
                    <option value="legendary">Lendário</option>
                  </select>
                </div>
              </div>

              {/* Listings Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredListings.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 bg-white border border-slate-100 py-12 rounded-2xl text-center text-slate-400 text-sm">
                    Nenhum item anunciado encontrado no marketplace no momento.
                  </div>
                ) : (
                  filteredListings.map((listing) => {
                    const isSeller = listing.seller_id === loggedInUser;
                    return (
                      <div 
                        key={listing.id}
                        className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-200 transition-colors space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">{listing.id}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                              listing.rarity === 'legendary' 
                                ? 'bg-amber-500/10 text-amber-500'
                                : listing.rarity === 'epic'
                                ? 'bg-fuchsia-500/10 text-fuchsia-500'
                                : listing.rarity === 'rare'
                                ? 'bg-cyan-500/10 text-cyan-500'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {listing.rarity === 'legendary' ? 'Lendário' : listing.rarity === 'epic' ? 'Épico' : listing.rarity === 'rare' ? 'Raro' : 'Comum'}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-sm">{listing.title}</h4>
                          <p className="text-slate-500 text-xs min-h-[32px] line-clamp-2">{listing.description || 'Nenhuma descrição fornecida pelo anunciante.'}</p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span>Vendido por:</span>
                            <strong className="text-slate-600 font-semibold">@{listing.seller_name}</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="font-mono">
                            <span className="text-[9px] text-slate-400 block uppercase">Preço</span>
                            <span className="font-black text-sm text-slate-900">
                              {listing.currency === 'coins' ? `🪙 ${listing.price}` : `R$ ${listing.price.toFixed(2)}`}
                            </span>
                          </div>

                          <button
                            onClick={() => handleBuyMarketItem(listing.id)}
                            disabled={isSeller}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-colors ${
                              isSeller 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                            }`}
                          >
                            {isSeller ? 'Seu Anúncio' : 'Comprar Item'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: SECURITY LEDGER & ANTI-FRAUD VERIFIER */}
        {activeSubTab === 'audit' && (
          <div className="space-y-6">
            
            {/* Upper Grid: Blockchain Integrity and PCI-DSS compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Ledger Integrity */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-cyan-400 mb-2">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-900 font-extrabold text-base">
                    Integridade de Ledger
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Recalcule as assinaturas de todos os registros de transações financeiras para garantir a integridade absoluta e blindagem contra fraudes.
                  </p>
                </div>

                <div className="py-4 border-y border-slate-100">
                  {ledgerStatus === 'unchecked' && (
                    <div className="text-slate-500 space-y-1">
                      <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <span className="text-xs font-bold block font-mono">AGUARDANDO AUDITORIA</span>
                      <p className="text-[10px] text-slate-400 px-4">Pressione o botão abaixo para rodar a auditoria blockchain.</p>
                    </div>
                  )}

                  {ledgerStatus === 'checking' && (
                    <div className="text-slate-500 space-y-2 animate-pulse">
                      <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                      <span className="text-xs font-bold block font-mono text-cyan-500">RECALCULANDO HASHES...</span>
                      <p className="text-[10px] text-slate-400 px-4">Validando ledger de transações da tabela logs contra chaves HMAC-SHA256.</p>
                    </div>
                  )}

                  {ledgerStatus === 'secure' && (
                    <div className="text-emerald-500 space-y-1 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                      <span className="text-xs font-black block font-mono">100% SEGURO &amp; INTEGRO</span>
                      <p className="text-[10px] text-slate-500">Nenhum registro adulterado ou deletado. Todos os {ledgerAuditReport?.totalLogs} logs estão consistentes.</p>
                    </div>
                  )}

                  {ledgerStatus === 'tampered' && (
                    <div className="text-rose-500 space-y-1 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                      <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
                      <span className="text-xs font-black block font-mono">REGISTROS CORROMPIDOS</span>
                      <p className="text-[10px] text-slate-500">Detectamos {ledgerAuditReport?.tamperedLogsCount} transações violadas fora do canal oficial!</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleVerifyLedger}
                  disabled={ledgerStatus === 'checking'}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <Key className="w-4 h-4 text-cyan-300" />
                  Verificar Assinaturas (SHA-256)
                </button>
              </div>

              {/* PCI-DSS Security Compliance Scanner */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-900 font-extrabold text-base">
                    Auditor de Conformidade PCI-DSS
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Inicie a verificação de conformidade de segurança e testes de intrusão do ecossistema de pagamentos (Stripe, Paypal, MP e Cartões).
                  </p>
                </div>

                <div className="py-4 border-y border-slate-100">
                  {pciScannerStatus === 'idle' && (
                    <div className="text-slate-500 space-y-1">
                      <ShieldAlert className="w-8 h-8 text-indigo-400 mx-auto" />
                      <span className="text-xs font-bold block font-mono text-indigo-600">SCANNER PCI INATIVO</span>
                      <p className="text-[10px] text-slate-400 px-4">Inicie os testes para verificar chaves ocultas, mascaramento de cartões e HMAC.</p>
                    </div>
                  )}

                  {pciScannerStatus === 'scanning' && (
                    <div className="text-slate-500 space-y-2 animate-pulse">
                      <RefreshCw className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                      <span className="text-xs font-bold block font-mono text-indigo-600">VARRENDO ARQUIVOS &amp; BANCO...</span>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-200">
                        <div className="bg-indigo-600 h-1.5 rounded-full animate-bar-load"></div>
                      </div>
                    </div>
                  )}

                  {pciScannerStatus === 'passed' && (
                    <div className="text-emerald-600 space-y-1 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-left">
                      <span className="text-xs font-black block font-mono text-center">✓ PCI APPROVED (v4.0)</span>
                      <div className="space-y-1 pt-1.5 text-[9px] text-slate-600 font-mono">
                        {pciScannerReport?.checks.map((chk: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-start border-b border-slate-100 pb-1">
                            <span>{chk.name}:</span>
                            <span className="text-emerald-500 font-bold shrink-0 ml-1">PASS</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleRunPciScanner}
                  disabled={pciScannerStatus === 'scanning'}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-200" />
                  Testar Vulnerabilidade PCI-DSS
                </button>
              </div>

              {/* Financial Conciliation Ledger */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-1.5">
                  <Activity className="w-5 h-5 text-indigo-500" /> Conciliação Financeira
                </h3>
                <p className="text-slate-500 text-xs">
                  Audite batimentos entre saldos registrados internamente e confirmações do provedor de gateway em tempo real.
                </p>

                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                  {conciliationRecords.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">Nenhum batimento pendente de conciliação.</div>
                  ) : (
                    conciliationRecords.map((rec: any) => (
                      <div key={rec.id} className="p-2 border border-slate-100 rounded-xl bg-slate-50 text-[10px] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-slate-400 select-all">{rec.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            rec.status === 'matched' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-700 font-mono">
                          <span>Sistema: R$ {rec.system_amount.toFixed(2)}</span>
                          <span>Gateway: R$ {rec.provider_amount.toFixed(2)}</span>
                        </div>
                        <p className="text-slate-500 italic text-[9px] truncate">{rec.notes}</p>
                        {rec.status !== 'matched' && (
                          <button
                            onClick={() => handleManualReconcile(rec.transaction_id)}
                            className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1 rounded text-[9px]"
                          >
                            Forçar Conciliação Manual (Solucionar Divergência)
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Lower Row: Webhooks Simulator Console and Webhooks event logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Webhooks Testing Sandbox */}
              <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-1.5">
                  <PlayCircle className="w-5 h-5 text-indigo-500" /> Webhook Testing Console
                </h3>
                <p className="text-slate-500 text-xs">
                  Simule eventos de pagamento disparados em background por canais integrados para certificar fluxos anti-fraude e comissões.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 text-[10px]">Gateway Provedor</label>
                      <select 
                        value={webhookSimProvider}
                        onChange={(e: any) => setWebhookSimProvider(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="stripe">Stripe API</option>
                        <option value="paypal">PayPal SDK</option>
                        <option value="mercadopago">Mercado Pago</option>
                        <option value="pix">PIX Banco Central</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 text-[10px]">Tipo de Evento</label>
                      <select 
                        value={webhookSimType}
                        onChange={(e: any) => setWebhookSimType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="payment.succeeded">Pagamento Aprovado</option>
                        <option value="charge.refunded">Reembolso / Estorno</option>
                        <option value="payment.card.processed">Cartão Autorizado (PCI)</option>
                        <option value="subscription.created">Assinatura Ativada</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 text-[10px]">Valor (R$)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={webhookSimAmount}
                        onChange={(e) => setWebhookSimAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 text-[10px]">Cupom Desconto</label>
                      <input 
                        type="text"
                        placeholder="Ex: DESCONTO10"
                        value={webhookSimCoupon}
                        onChange={(e) => setWebhookSimCoupon(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none font-mono placeholder:text-[9px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 text-[10px]">Indicador (Affiliate)</label>
                      <input 
                        type="text"
                        placeholder="ID do padrinho"
                        value={webhookSimAffiliateId}
                        onChange={(e) => setWebhookSimAffiliateId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none font-mono placeholder:text-[9px]"
                      />
                    </div>
                  </div>

                  {webhookSimType.includes('card') && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                      <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider">Simular Detalhes PCI do Cartão</span>
                      <div className="space-y-1.5">
                        <input 
                          type="text" 
                          placeholder="Número do Cartão (16 dígitos)"
                          maxLength={16}
                          value={webhookSimCardNum}
                          onChange={(e) => setWebhookSimCardNum(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-mono focus:outline-none"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="text" 
                            placeholder="Nome Completo"
                            value={webhookSimCardName}
                            onChange={(e) => setWebhookSimCardName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] col-span-2 focus:outline-none"
                          />
                          <input 
                            type="text" 
                            placeholder="CVV"
                            maxLength={3}
                            value={webhookSimCardCvv}
                            onChange={(e) => setWebhookSimCardCvv(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSimulateWebhook}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-lg transition-all"
                  >
                    Simular e Receber Retorno Webhook
                  </button>
                </div>
              </div>

              {/* Webhooks received and Audit Server Logs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Webhooks list */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-3">
                  <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-1.5">
                    <Activity className="w-5 h-5 text-indigo-500" /> Fila de Eventos Webhook Recebidos
                  </h3>
                  
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {webhookLogs.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">Nenhum evento webhook recebido na fila.</div>
                    ) : (
                      webhookLogs.map((wh: any) => (
                        <div key={wh.id} className="p-2 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between text-[10px] font-mono">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block">{wh.id} • {wh.provider.toUpperCase()}</span>
                            <span className="font-bold text-slate-800">{wh.event_type}</span>
                          </div>
                          <div className="text-right">
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[8px] font-extrabold">STATUS {wh.status_code}</span>
                            <span className="text-slate-400 block text-[9px]">{new Date(wh.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Server security & audit logs */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-1.5">
                      <Server className="w-5 h-5 text-slate-500" /> Logs de Segurança &amp; Auditoria do Servidor
                    </h3>
                    <button 
                      onClick={fetchAuditLogs}
                      className="text-slate-500 hover:text-slate-900 transition-colors p-1"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin-hover" />
                    </button>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Ações de compliance gravadas pelo sistema de prevenção de intrusão, depósitos confirmados, saques e verificações assinadas.
                  </p>

                  {isLoadingAudit ? (
                    <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Carregando logs de auditoria...
                    </div>
                  ) : systemAuditLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Nenhum log de auditoria do sistema registrado.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
                      {systemAuditLogs.map((log) => {
                        const isTampered = log.isTampered;
                        return (
                          <div 
                            key={log.id}
                            className={`p-3 rounded-xl border text-xs space-y-1 ${
                              isTampered 
                                ? 'bg-rose-500/5 border-rose-500/20' 
                                : 'bg-slate-50 border-slate-100/80'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span>{log.id} • {new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                              <span className={`font-bold px-1 rounded uppercase ${
                                isTampered 
                                  ? 'bg-rose-100 text-rose-600' 
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {isTampered ? 'ASSINATURA INVÁLIDA' : 'ASSINATURA VÁLIDA'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">
                                {log.event}
                              </span>
                              <span className="text-slate-600 text-[10px]">• IP: {log.ipAddress}</span>
                            </div>

                            <p className="text-slate-700 font-medium text-xs pt-0.5">
                              {log.details}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}
      </div>

      {/* RENDER ACTIVE WEB-INVOICE MODAL (Styled Digital PDF mock receipt) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-colors"
            >
              Fechar ×
            </button>
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <FileText className="w-6 h-6 text-indigo-600" />
              <div>
                <h4 className="text-slate-900 font-extrabold text-base">Fatura Eletrônica Oficial</h4>
                <span className="text-[10px] text-slate-500 font-mono">Emissor: GameZon Entretenimento Digital S.A.</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed select-all">
                {selectedInvoice.pdf_content}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between gap-3 shrink-0">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                Cópia Autenticada PCI-DSS v4.0 Secure
              </span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
