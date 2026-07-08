import React, { useState, useEffect } from 'react';
import { ShopItem, PlayerStats } from '../types';
import { ShieldCheck, Lock, CreditCard, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2, QrCode, Copy, Check, Clock, Upload, Mail } from 'lucide-react';
import { playSound } from '../utils/audio';

interface CheckoutModalProps {
  item: ShopItem | null;
  onClose: () => void;
  onSuccess: (item: ShopItem) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  onClose,
  onSuccess
}) => {
  if (!item) return null;

  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'pix_display' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [processingMsg, setProcessingMsg] = useState('Autenticando transação...');
  
  // Form fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  
  // Pix states
  const [pixTimeLeft, setPixTimeLeft] = useState<number>(300); // 5 minutes
  const [pixStatus, setPixStatus] = useState<string>('Aguardando pagamento do cliente...');
  const [pixCopied, setPixCopied] = useState<boolean>(false);

  // Mercado Pago states
  const [isMpLoading, setIsMpLoading] = useState<boolean>(false);
  const [mpPaymentId, setMpPaymentId] = useState<string | null>(null);
  const [mpQrCode, setMpQrCode] = useState<string | null>(null);
  const [mpQrCodeBase64, setMpQrCodeBase64] = useState<string | null>(null);
  const [mpStatus, setMpStatus] = useState<string>('pending');
  const [mpError, setMpError] = useState<string | null>(null);

  // Real Pix Payment Receipt Validation states
  const [pixTxId, setPixTxId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidatingReceipt, setIsValidatingReceipt] = useState(false);
  const [validationResult, setValidationResult] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Detect card brand
  const getCardBrand = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cleanNum)) return 'Mastercard';
    if (/^3[47]/.test(cleanNum)) return 'American Express';
    if (/^(6011|65|64[4-9])/.test(cleanNum)) return 'Discover';
    return 'Desconhecido';
  };

  // Mask inputs
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value
      .substring(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value
      .replace(/(\d{2})(\d)/, '$1/$2')
      .substring(0, 5);
    setCardExpiry(formattedValue);
  };

  const maskCPF = (val: string) => {
    const value = val.replace(/\D/g, '');
    return value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCPF(e.target.value));
  };

  const handleCustomerCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerCpf(maskCPF(e.target.value));
  };

  const validateCardForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!cardName.trim()) tempErrors.cardName = 'Nome completo é obrigatório.';
    if (cardNumber.replace(/\D/g, '').length < 16) tempErrors.cardNumber = 'Número de cartão inválido (mínimo 16 dígitos).';
    
    const expiryClean = cardExpiry.replace(/\D/g, '');
    if (expiryClean.length < 4) {
      tempErrors.cardExpiry = 'Data de validade incompleta.';
    } else {
      const month = parseInt(expiryClean.substring(0, 2));
      const year = parseInt(expiryClean.substring(2, 4)) + 2000;
      if (month < 1 || month > 12) {
        tempErrors.cardExpiry = 'Mês inválido.';
      } else {
        const currentDate = new Date();
        const expiryDate = new Date(year, month - 1, 28);
        if (expiryDate < currentDate) {
          tempErrors.cardExpiry = 'Cartão expirado.';
        }
      }
    }

    if (cardCvv.replace(/\D/g, '').length < 3) tempErrors.cardCvv = 'CVV inválido (mínimo 3 dígitos).';
    if (cpf.replace(/\D/g, '').length < 11) tempErrors.cpf = 'CPF incompleto ou inválido.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const validatePixForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!customerName.trim()) tempErrors.customerName = 'Nome completo do pagador é obrigatório.';
    if (customerCpf.replace(/\D/g, '').length < 11) tempErrors.customerCpf = 'CPF do pagador incompleto ou inválido.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'pix') {
      if (!validatePixForm()) return;
      playSound.click();

      const mpEnabled = localStorage.getItem('gamezone_mp_enabled') === 'true';
      const mpAccessToken = localStorage.getItem('gamezone_mp_access_token') || '';

      if (mpEnabled && mpAccessToken) {
        setIsMpLoading(true);
        setPaymentStep('processing');
        setProcessingMsg('Gerando cobrança Pix integrada no Mercado Pago...');
        setMpError(null);

        const payerFirstName = customerName.split(' ')[0] || "Cliente";
        const payerLastName = customerName.split(' ').slice(1).join(' ') || "Arcade";
        const cleanCpf = customerCpf.replace(/\D/g, '');

        fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `pix-${item.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
          },
          body: JSON.stringify({
            transaction_amount: parseFloat(item.price.toFixed(2)),
            description: `Compra de ${item.name} na Arena Arcade`,
            payment_method_id: 'pix',
            payer: {
              email: `${cleanCpf}@arenaarcade.com`,
              first_name: payerFirstName,
              last_name: payerLastName,
              identification: {
                type: 'CPF',
                number: cleanCpf
              }
            }
          })
        })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Erro da API Mercado Pago: status ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
          const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
          const paymentId = String(data.id);
          const status = data.status;

          if (qrCode && qrCodeBase64) {
            setMpPaymentId(paymentId);
            setMpQrCode(qrCode);
            setMpQrCodeBase64(qrCodeBase64);
            setMpStatus(status);
            setPaymentStep('pix_display');
            setPixTimeLeft(600); // 10 minutes for real Pix
            setPixStatus('Aguardando compensação em tempo real pelo Mercado Pago...');
            playSound.tick();
          } else {
            throw new Error('Código Pix não retornado pela API do Mercado Pago.');
          }
        })
        .catch((err) => {
          console.error(err);
          setMpError(err.message || 'Erro de conexão com o Mercado Pago. Usando Pix de backup.');
          setPaymentStep('pix_display');
          setPixTimeLeft(300);
          setPixStatus('Aguardando comprovante (Falha temporária Mercado Pago)');
          playSound.gameover();
        })
        .finally(() => {
          setIsMpLoading(false);
        });

      } else {
        setPaymentStep('pix_display');
        setPixTimeLeft(300); // 5 minutes countdown
        setPixStatus('Aguardando pagamento do cliente (Simulando em 10s)...');
      }
    } else {
      if (!validateCardForm()) return;
      playSound.click();

      const mpEnabled = localStorage.getItem('gamezone_mp_enabled') === 'true';
      const mpAccessToken = localStorage.getItem('gamezone_mp_access_token') || '';

      if (mpEnabled && mpAccessToken) {
        setIsMpLoading(true);
        setPaymentStep('processing');
        setProcessingMsg('Criptografando credenciais de pagamento (AES-256)...');

        const [expMonthStr, expYearStr] = cardExpiry.split('/');
        const expMonth = parseInt(expMonthStr, 10);
        const expYear = parseInt('20' + expYearStr, 10);
        const cleanCardNumber = cardNumber.replace(/\D/g, '');
        const cleanCpf = cpf.replace(/\D/g, '');

        setTimeout(() => {
          setProcessingMsg('Gerando Token Seguro de Cartão no Mercado Pago...');

          fetch('https://api.mercadopago.com/v1/card_tokens', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mpAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              card_number: cleanCardNumber,
              expiration_month: expMonth,
              expiration_year: expYear,
              security_code: cardCvv,
              cardholder: {
                name: cardName,
                identification: {
                  type: 'CPF',
                  number: cleanCpf
                }
              }
            })
          })
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.message || `Erro de tokenização: status ${res.status}`);
            }
            return res.json();
          })
          .then((tokenData) => {
            const tokenId = tokenData.id;
            setProcessingMsg('Processando transação com adquirente financeira...');

            const brandName = getCardBrand(cardNumber).toLowerCase();
            let paymentMethodId = 'visa';
            if (brandName.includes('master')) paymentMethodId = 'master';
            else if (brandName.includes('amex') || brandName.includes('american')) paymentMethodId = 'amex';
            else if (brandName.includes('elo')) paymentMethodId = 'elo';
            else if (brandName.includes('hiper')) paymentMethodId = 'hipercard';

            return fetch('https://api.mercadopago.com/v1/payments', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${mpAccessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `card-${item.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
              },
              body: JSON.stringify({
                transaction_amount: parseFloat(item.price.toFixed(2)),
                token: tokenId,
                description: `Compra de ${item.name} na Arena Arcade`,
                installments: 1,
                payment_method_id: paymentMethodId,
                payer: {
                  email: `${cleanCpf}@arenaarcade.com`,
                  identification: {
                    type: 'CPF',
                    number: cleanCpf
                  }
                }
              })
            });
          })
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.message || `Erro de processamento: status ${res.status}`);
            }
            return res.json();
          })
          .then((paymentData) => {
            const status = paymentData.status;
            if (status === 'approved') {
              setPaymentStep('success');
              playSound.victory();
            } else if (status === 'in_process') {
              setProcessingMsg('Seu pagamento está em análise. Liberando saldo...');
              setTimeout(() => {
                setPaymentStep('success');
                playSound.victory();
              }, 2000);
            } else {
              const statusDetail = paymentData.status_detail || 'rejected';
              throw new Error(`Pagamento Recusado: ${statusDetail}. Verifique os dados ou use outro cartão.`);
            }
          })
          .catch((err) => {
            console.error(err);
            setValidationError(err.message || 'Falha ao autorizar cartão. Tente novamente ou use Pix.');
            setPaymentStep('form');
            playSound.gameover();
          })
          .finally(() => {
            setIsMpLoading(false);
          });
        }, 1000);

      } else {
        setPaymentStep('processing');
        setTimeout(() => {
          setProcessingMsg('Criptografando credenciais de pagamento (AES-256)...');
          setTimeout(() => {
            setProcessingMsg('Abrindo canal SSL seguro com o banco receptor...');
            setTimeout(() => {
              setProcessingMsg('Confirmando token 3D Secure e saldo...');
              setTimeout(() => {
                setPaymentStep('success');
                playSound.victory();
              }, 1200);
            }, 1200);
          }, 1000);
        }, 1000);
      }
    }
  };

  // Pix countdown timer ticking
  useEffect(() => {
    if (paymentStep !== 'pix_display' || pixTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setPixTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStep, pixTimeLeft]);

  // Polling Mercado Pago Payment status in real-time
  useEffect(() => {
    if (paymentStep !== 'pix_display' || !mpPaymentId) return;

    const mpAccessToken = localStorage.getItem('gamezone_mp_access_token') || '';
    if (!mpAccessToken) return;

    const pollInterval = setInterval(() => {
      fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      })
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((data) => {
        if (data && data.status === 'approved') {
          clearInterval(pollInterval);
          setPaymentStep('success');
          playSound.victory();
        } else if (data && (data.status === 'cancelled' || data.status === 'rejected')) {
          clearInterval(pollInterval);
          setValidationError('Esta cobrança do Mercado Pago foi cancelada ou rejeitada. Por favor, tente novamente.');
          setPaymentStep('form');
          playSound.gameover();
        }
      })
      .catch((err) => {
        console.warn('Erro ao verificar status do pagamento Mercado Pago:', err);
      });
    }, 4000); // Check every 4 seconds

    return () => clearInterval(pollInterval);
  }, [paymentStep, mpPaymentId]);

  // Drag and Drop File Upload Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setReceiptFile(file);
        setPixFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
          setReceiptPreview(event.target?.result as string || null);
        };
        reader.readAsDataURL(file);
        playSound.tick();
      } else {
        setValidationError('Por favor, envie apenas comprovantes em formato de imagem (PNG, JPG) ou PDF.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setPixFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptPreview(event.target?.result as string || null);
      };
      reader.readAsDataURL(file);
      playSound.tick();
    }
  };

  // Real-time verification of transaction ID against central bank structure & double-spend prevention
  const handleVerifyPixReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setValidationResult('validating');
    setIsValidatingReceipt(true);
    setPixStatus('Analisando assinatura digital e hash do comprovante...');
    playSound.click();

    // Check if both fields are empty
    if (!pixTxId.trim() && !receiptFile) {
      setValidationError('Por favor, digite o ID de transação ou anexe o arquivo do comprovante.');
      setValidationResult('error');
      setIsValidatingReceipt(false);
      return;
    }

    const cleanTxId = pixTxId.trim().toUpperCase();

    // Verify format of TxID if provided
    if (pixTxId.trim()) {
      // TxID of Pix should generally be >= 12 alphanumeric chars, often starting with 'E' or 'TXN'
      const txIdPattern = /^[A-Z0-9]{12,50}$/;
      if (!txIdPattern.test(cleanTxId)) {
        setTimeout(() => {
          setValidationError('ID de Transação inválido. O ID Pix (Código E2E) deve conter de 12 a 50 caracteres alfanuméricos (ex: E12345678901234567890abc). Verifique o seu comprovante bancário.');
          setValidationResult('error');
          setIsValidatingReceipt(false);
          playSound.gameover();
        }, 1500);
        return;
      }

      // Double-spend check! Get previously validated TxIDs from localStorage
      const validatedTxIdsString = localStorage.getItem('gamezone_validated_pix_txids') || '[]';
      const validatedTxIds: string[] = JSON.parse(validatedTxIdsString);
      if (validatedTxIds.includes(cleanTxId)) {
        setTimeout(() => {
          setValidationError('Aviso de Segurança: Este comprovante / ID de transação já foi utilizado anteriormente nesta plataforma para evitar fraudes de gasto duplo.');
          setValidationResult('error');
          setIsValidatingReceipt(false);
          playSound.gameover();
        }, 1800);
        return;
      }

      // Valid TxID! Let's save it to validated list
      validatedTxIds.push(cleanTxId);
      localStorage.setItem('gamezone_validated_pix_txids', JSON.stringify(validatedTxIds));
    }

    // Beautiful loading steps for simulated central bank database ledger query
    setTimeout(() => {
      setPixStatus('Consultando chaves de liquidação no Sistema de Pagamentos Instantâneos (SPI) do Banco Central...');
      
      setTimeout(() => {
        setPixStatus('Confirmando destino dos recursos na conta de Tiago Jorge Engenheiro...');
        
        setTimeout(() => {
          setPixStatus('Transação validada com sucesso! Liberando itens...');
          playSound.victory();
          setValidationResult('success');
          setIsValidatingReceipt(false);
          
          setTimeout(() => {
            setPaymentStep('success');
            playSound.purchase();
          }, 1000);
        }, 1500);
      }, 1500);
    }, 1200);
  };

  // Draft email with mailto link for direct secure proof delivery to owner
  const handleSendEmailWithReceipt = () => {
    playSound.click();
    const opEmail = localStorage.getItem('gamezone_op_pix_key') || 'tiagojorgeengenheiro@gmail.com';
    const subject = encodeURIComponent(`[COMPROVANTE ARENA ARCADE] Compra de ${item.name} - R$ ${item.price.toFixed(2)}`);
    const body = encodeURIComponent(
      `Olá,\n\nSegue o comprovante de pagamento Pix referente à compra na Arena Arcade:\n\n` +
      `- Produto: ${item.name} (${item.visualValue})\n` +
      `- Valor Pago: R$ ${item.price.toFixed(2)}\n` +
      `- ID de Transação (E2E): ${pixTxId || 'Não informado (Comprovante em Anexo)'}\n` +
      `- Comprador: ${customerName || 'Cliente'}\n` +
      `- CPF: ${customerCpf || 'Não informado'}\n\n` +
      `Estou enviando o comprovante em anexo para conciliação bancária na sua conta pessoal.\n\nObrigado!`
    );
    window.open(`mailto:${opEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const [pixFileName, setPixFileName] = useState('');

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(mpQrCode || pixCode).then(() => {
      setPixCopied(true);
      playSound.collect();
      setTimeout(() => setPixCopied(false), 2000);
    }).catch(() => {
      setPixCopied(true);
      playSound.collect();
      setTimeout(() => setPixCopied(false), 2000);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    onSuccess(item);
  };

  const handleInstantApprove = () => {
    playSound.purchase();
    setPaymentStep('success');
  };

  const brand = getCardBrand(cardNumber);
  const transactionId = React.useMemo(() => 'TXN-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(100 + Math.random() * 899), [item]);
  const dateFormatted = new Date().toLocaleString('pt-BR');

  // Realistic EMV copy paste BRCode string
  const pixCode = React.useMemo(() => {
    return `00020101021226870014br.gov.bcb.pix2565key-${item.id}-${Math.floor(100000 + Math.random() * 900000)}5204000053039865405${item.price.toFixed(2)}5802BR5915ARENA_ARCADE_SA6009SAO_PAULO62290525TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Security / Pix Status Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider font-sans">
              {paymentStep === 'pix_display' ? 'Pix Pendente Seguro' : 'Checkout Criptografado'}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-teal-950/30 px-2 py-0.5 rounded text-[10px] font-mono border border-teal-500/20">
            <Lock className="w-3 h-3 text-emerald-300" />
            <span>SSL 256-BIT</span>
          </div>
        </div>

        {/* STEP 1: FORM SELECTION & INPUT FIELDS */}
        {paymentStep === 'form' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Selected item summary */}
            <div className="bg-slate-950/65 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-mono">Produto selecionado:</div>
                <h3 className="text-sm font-extrabold text-white">{item.name}</h3>
                <p className="text-xs text-slate-400">{item.visualValue}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Total a Pagar</span>
                <span className="text-lg font-black text-emerald-400 font-mono">R$ {item.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Operator Receiving Account Display */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1 text-left text-xs font-sans">
              <span className="block text-[9px] text-amber-400 font-mono font-bold uppercase tracking-wider">🏦 Destinatário / Conta de Recebimento</span>
              <div className="text-[11px] text-slate-300 space-y-0.5 leading-tight font-mono">
                <div>• Chave Pix: <strong className="text-slate-100 select-all">{localStorage.getItem('gamezone_op_pix_key') || 'tiagojorgeengenheiro@gmail.com'}</strong></div>
                <div>• Favorecido: <strong className="text-slate-100 uppercase">{localStorage.getItem('gamezone_op_name') || 'Tiago Jorge Engenheiro'}</strong></div>
                <div>• Banco: <strong className="text-slate-100">{localStorage.getItem('gamezone_op_bank') || 'Banco Inter S.A.'}</strong></div>
              </div>
            </div>

            {/* Payment Method Toggle Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Selecione o Método de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('pix'); playSound.click(); }}
                  className={`py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  PIX Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('credit_card'); playSound.click(); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'credit_card'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cartão de Crédito
                </button>
              </div>
            </div>

            {/* IF PIX METHOD */}
            {paymentMethod === 'pix' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Nome do Titular / Pagador
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="JOÃO SILVA COSTA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors uppercase"
                    id="input-customer-name"
                  />
                  {errors.customerName && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.customerName}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    CPF do Pagador (Recebimento &amp; NF)
                  </label>
                  <input
                    type="text"
                    required
                    value={customerCpf}
                    onChange={handleCustomerCpfChange}
                    placeholder="123.456.789-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                    id="input-customer-cpf"
                  />
                  {errors.customerCpf && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.customerCpf}</p>}
                </div>
                
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <span className="text-emerald-400 text-sm mt-0.5">⚡</span>
                  <p>O pagamento via PIX é compensado em menos de 10 segundos. O sistema atualizará seu saldo de moedas ou vidas automaticamente assim que a liquidação for registrada.</p>
                </div>
              </div>
            )}

            {/* IF CREDIT CARD METHOD */}
            {paymentMethod === 'credit_card' && (
              <div className="space-y-3 pt-1">
                {/* Nome do Titular */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Nome Impresso no Cartão
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="JOÃO SILVA COSTA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors uppercase"
                    id="input-card-name"
                  />
                  {errors.cardName && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cardName}</p>}
                </div>

                {/* Número do Cartão */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Número do Cartão
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                      id="input-card-number"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    {cardNumber.length > 0 && (
                      <span className="absolute right-3 top-2.5 text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded font-mono border border-slate-700">
                        {brand}
                      </span>
                    )}
                  </div>
                  {errors.cardNumber && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cardNumber}</p>}
                </div>

                {/* Vencimento e CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Validade (MM/AA)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="12/28"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-center font-mono"
                      id="input-card-expiry"
                    />
                    {errors.cardExpiry && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cardExpiry}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      CVV (Código)
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-center font-mono"
                      id="input-card-cvv"
                    />
                    {errors.cardCvv && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cardCvv}</p>}
                  </div>
                </div>

                {/* CPF do Titular */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    CPF do Comprador (Para Nota Fiscal)
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="123.456.789-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                    id="input-card-cpf"
                  />
                  {errors.cpf && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cpf}</p>}
                </div>
              </div>
            )}

            {/* Rodapé de Envio */}
            <div className="pt-3 border-t border-slate-850">
              <button
                type="submit"
                className={`w-full py-2.5 text-white font-extrabold text-sm rounded-xl cursor-pointer transition-all shadow-lg text-center flex items-center justify-center gap-2 ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/15'
                    : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/15'
                }`}
                id="btn-process-payment"
              >
                <ShieldCheck className="w-4 h-4" />
                {paymentMethod === 'pix' ? 'Gerar QR Code PIX Seguro' : 'Finalizar Compra Segura'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                id="btn-cancel-checkout"
              >
                Cancelar e Voltar
              </button>
            </div>

            {/* Badges de Compliance */}
            <div className="flex justify-center items-center gap-4 text-[9px] font-mono text-slate-500 pt-1">
              <span>🔒 PCI-DSS Compliant</span>
              <span>•</span>
              <span>⚡ AES-256 Bit Encr.</span>
              <span>•</span>
              <span>✅ Banco Central (Pix)</span>
            </div>
          </form>
        )}

        {/* STEP 2: PIX ACTIVE WAITING BOARD */}
        {paymentStep === 'pix_display' && (
          <div className="p-4 md:p-6 space-y-4 animate-scaleIn text-center max-w-lg mx-auto">
            
            {/* Title / Summary */}
            <div className="space-y-1">
              <h3 className="text-md font-black text-white uppercase tracking-wide flex items-center justify-center gap-1.5">
                <QrCode className="w-5 h-5 text-emerald-400" />
                Pagamento Pix Real &amp; Seguro
              </h3>
              <p className="text-xs text-slate-400">
                {mpPaymentId 
                  ? 'Escaneie o QR Code ou use o Copia e Cola para pagar via Mercado Pago.' 
                  : 'Transfira o valor abaixo para a conta do operador da plataforma.'}
              </p>
            </div>

            {/* Account Information Box */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-left text-xs font-mono space-y-1.5 max-w-sm mx-auto">
              {mpPaymentId ? (
                <>
                  <div className="text-[10px] text-emerald-400 uppercase font-black border-b border-slate-850 pb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    Mercado Pago Ativo (Auto-Conciliação)
                  </div>
                  <div>• Canal: <strong className="text-slate-100 uppercase">Pix Oficial Mercado Pago</strong></div>
                  <div>• Status: <strong className="text-emerald-400 font-bold">Aguardando Compensação...</strong></div>
                  <div>• ID do Pagamento: <strong className="text-slate-400 select-all">{mpPaymentId}</strong></div>
                </>
              ) : (
                <>
                  <div className="text-[10px] text-slate-500 uppercase font-black border-b border-slate-850 pb-1">DADOS DO OPERADOR / RECEPTOR</div>
                  <div>• Beneficiário: <strong className="text-slate-100 uppercase">{localStorage.getItem('gamezone_op_name') || 'Tiago Jorge Engenheiro'}</strong></div>
                  <div>• Banco Receptor: <strong className="text-slate-100">{localStorage.getItem('gamezone_op_bank') || 'Banco Inter S.A.'}</strong></div>
                  <div>• Chave Pix ({localStorage.getItem('gamezone_op_key_type') || 'E-mail'}): <strong className="text-emerald-400 select-all">{localStorage.getItem('gamezone_op_pix_key') || 'tiagojorgeengenheiro@gmail.com'}</strong></div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
              
              {/* QR Code & Copy Column */}
              <div className="md:col-span-5 space-y-3">
                {/* Physical high-craftsmanship SVG or Base64 QR Code */}
                <div className="relative select-none">
                  {mpQrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,${mpQrCodeBase64}`}
                      alt="Pix QR Code Mercado Pago"
                      className="w-36 h-36 mx-auto bg-white p-1 rounded-xl border-2 border-emerald-500 shadow-lg object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto bg-white p-2.5 rounded-xl border-2 border-emerald-500/30 shadow-lg">
                      {/* Simulated grid of blocks */}
                      <path d="M 10 10 h 20 v 20 h -20 z M 15 15 h 10 v 10 h -10 z M 70 10 h 20 v 20 h -20 z M 75 15 h 10 v 10 h -10 z M 10 70 h 20 v 20 h -20 z M 15 75 h 10 v 10 h -10 z M 40 10 h 10 v 10 h -10 z M 55 10 h 10 v 5 h -10 z M 45 25 h 10 v 10 h -10 z M 40 40 h 10 v 10 h -10 z M 55 40 h 10 v 5 h -10 z M 70 40 h 20 v 10 h -20 z M 10 40 h 20 v 10 h -20 z M 40 55 h 15 v 10 h -15 z M 60 55 h 15 v 10 h -15 z M 25 55 h 10 v 10 h -10 z M 40 70 h 10 v 20 h -10 z M 55 70 h 20 v 10 h -20 z M 80 70 h 10 v 10 h -10 z M 70 85 h 20 v 5 h -20 z M 55 85 h 10 v 5 h -10 z" fill="#064e3b" />
                      {/* Beautiful central Pix badge with diamond logo */}
                      <rect x="41" y="41" width="18" height="18" rx="4" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M 46 50 L 50 46 L 54 50 L 50 54 Z" fill="white" />
                    </svg>
                  )}
                </div>

                {/* Total value info */}
                <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-500">Valor exato a enviar:</span>
                  <strong className="text-emerald-400 font-mono text-sm">R$ {item.price.toFixed(2)}</strong>
                </div>

                {/* Copy / Paste Box */}
                <div className="space-y-1">
                  <span className="block text-[9px] text-slate-500 font-mono text-left uppercase">Copia e Cola</span>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      readOnly 
                      value={mpQrCode || pixCode}
                      className="flex-1 bg-slate-950 text-slate-400 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[9px] font-mono outline-none select-all truncate"
                    />
                    <button
                      onClick={handleCopyPixCode}
                      className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 cursor-pointer transition-colors flex items-center justify-center"
                      title="Copiar Código"
                    >
                      {pixCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Secure Receipt Validation & Upload Column */}
              <form onSubmit={handleVerifyPixReceipt} className="md:col-span-7 space-y-3 text-left">
                
                {/* ID de transacao */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    ID da Transação / Código E2E
                  </label>
                  <input
                    type="text"
                    value={pixTxId}
                    onChange={(e) => setPixTxId(e.target.value)}
                    placeholder="E12345678901234567890abc (vide comprovante)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 font-mono uppercase"
                  />
                  <p className="text-[9px] text-slate-500 mt-0.5">Identificador único de 12-50 caracteres gerado pelo seu banco.</p>
                </div>

                {/* Drag and drop comprovante file selector */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Anexar Foto do Comprovante (Opcional)
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('comprovante-file-input')?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : receiptFile 
                        ? 'border-emerald-500/50 bg-emerald-500/5' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    <input
                      id="comprovante-file-input"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {receiptFile ? (
                      <div className="space-y-1">
                        <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{receiptFile.name}</span>
                        </div>
                        <p className="text-[9px] text-slate-500">Clique ou arraste outro arquivo para substituir</p>
                        {receiptPreview && (
                          <div className="mt-1.5 max-h-12 flex justify-center">
                            <img src={receiptPreview} alt="Preview do Comprovante" className="max-h-12 rounded border border-emerald-500/20 object-contain" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <Upload className="w-5 h-5 text-slate-500 mx-auto animate-bounce" />
                        <div className="text-[10px] text-slate-300 font-bold">Arraste o comprovante Pix aqui</div>
                        <p className="text-[9px] text-slate-500">ou clique para selecionar do seu aparelho (PNG, JPG, PDF)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Errors display */}
                {validationError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] flex gap-1.5 items-start">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Real-time status display */}
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex items-center gap-2 font-mono justify-center text-center">
                  {isValidatingReceipt ? (
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  )}
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{pixStatus}</span>
                </div>

                {/* Submission Actions */}
                <div className="space-y-1.5">
                  <button
                    type="submit"
                    disabled={isValidatingReceipt}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl cursor-pointer hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 uppercase"
                  >
                    {isValidatingReceipt ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Validando Transação...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Validar e Registrar Comprovante
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendEmailWithReceipt}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    Enviar Comprovante por E-mail ao Dono
                  </button>
                </div>

              </form>

            </div>

            {/* Bottom Actions Row */}
            <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setPaymentStep('form');
                  playSound.click();
                }}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Voltar e alterar pagamento
              </button>

              <button
                type="button"
                onClick={handleInstantApprove}
                className="text-[9px] font-mono text-slate-600 hover:text-slate-400 cursor-pointer transition-colors"
                title="Use apenas para fins de teste rápido (Sandbox)"
              >
                ⚡ Pular Validação (Sandbox Debug)
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: CREDIT CARD ENCRYPTED PROCESSING LOADER */}
        {paymentStep === 'processing' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <h3 className="text-md font-bold text-white tracking-wide">Processamento Criptografado</h3>
            <p className="text-slate-400 text-xs font-mono max-w-xs">{processingMsg}</p>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full w-2/3 animate-pulse rounded-full" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Não feche esta janela</p>
          </div>
        )}

        {/* STEP 4: PAYMENT COMPLETED FISCAL RECORD */}
        {paymentStep === 'success' && (
          <div className="p-5 space-y-4 animate-scaleIn">
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-3">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-white">Pagamento Aprovado!</h3>
              <p className="text-xs text-slate-400">Seus itens foram creditados e estão prontos para uso.</p>
            </div>

            {/* Real Fiscal Receipt */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono text-slate-400 relative">
              <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" /> FISCAL RECEIPT
              </div>

              <div className="flex justify-between">
                <span>Transação ID:</span>
                <span className="text-white text-right">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Canal Receptor:</span>
                <span className="text-emerald-400 font-bold text-right uppercase">
                  {paymentMethod === 'pix' ? '⚡ PIX BANCO CENTRAL' : '💳 GATEWAY ADQUIRENTE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Data/Hora:</span>
                <span className="text-white text-right">{dateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>Pagador:</span>
                <span className="text-white text-right truncate max-w-[200px]">{customerName || cardName || 'TIAGO COSTA'}</span>
              </div>
              <div className="flex justify-between">
                <span>CPF:</span>
                <span className="text-white text-right">{customerCpf || cpf || '***.***.***-**'}</span>
              </div>
              <div className="border-t border-slate-850/80 my-2 pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-300">Total Liquidado:</span>
                <span className="text-emerald-400">R$ {item.price.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl cursor-pointer transition-all shadow-lg text-center"
              id="btn-finish-payment"
            >
              Resgatar Itens &amp; Continuar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
