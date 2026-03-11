import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Card, ProgressBar } from './common/UIComponents';
import { TransactionType } from '../types';
import { IconArrowUp, IconTrophy, IconSparkles, IconShield, IconBriefcase, IconBuildingOffice, IconAcademicCap } from '../constants';

const LEVEL_NAMES = [
    'Survival',
    'Debt Destroyer',
    'Stability',
    'Investor',
    'Passive Engine',
    'Financial Freedom'
];

const LEVEL_ICONS = [
    '🌱',
    '🧱',
    '💰',
    '📈',
    '⚙️',
    '🏔️'
];

const CHECKLIST_ITEMS = [
    [
        { id: 'l1_1', label: 'Registrar ingresos mensuales', xp: 10 },
        { id: 'l1_2', label: 'Registrar gastos mensuales', xp: 10 },
        { id: 'l1_3', label: 'Reducir gastos innecesarios', xp: 20 },
        { id: 'l1_4', label: 'Lograr ahorro mínimo del 5%', xp: 30 },
    ],
    [
        { id: 'l2_1', label: 'Registrar deudas', xp: 10 },
        { id: 'l2_2', label: 'Crear plan de pago', xp: 20 },
        { id: 'l2_3', label: 'Reducir deuda al menos 30%', xp: 50 },
        { id: 'l2_4', label: 'Pagar una deuda completamente', xp: 100 },
    ],
    [
        { id: 'l3_1', label: 'Definir objetivo de fondo de emergencia', xp: 10 },
        { id: 'l3_2', label: 'Ahorrar 1 mes de gastos', xp: 30 },
        { id: 'l3_3', label: 'Ahorrar 3 meses de gastos', xp: 50 },
        { id: 'l3_4', label: 'Fondo de emergencia = 6 meses de gastos', xp: 100 },
    ],
    [
        { id: 'l4_1', label: 'Abrir cuenta de inversión', xp: 10 },
        { id: 'l4_2', label: 'Registrar primera inversión', xp: 30 },
        { id: 'l4_3', label: 'Invertir al menos 10% de ingresos', xp: 50 },
        { id: 'l4_4', label: 'Mantener inversiones 6 meses', xp: 100 },
    ],
    [
        { id: 'l5_1', label: 'Investigar fuentes de ingresos pasivos', xp: 10 },
        { id: 'l5_2', label: 'Generar primer ingreso pasivo', xp: 50 },
        { id: 'l5_3', label: 'Ingresos pasivos cubren 20% de gastos', xp: 100 },
        { id: 'l5_4', label: 'Ingresos pasivos cubren 50% de gastos', xp: 200 },
    ],
    [
        { id: 'l6_1', label: 'Ingresos pasivos cubren 100% de gastos', xp: 500 },
        { id: 'l6_2', label: 'Diversificar en 3+ fuentes de ingresos', xp: 100 },
        { id: 'l6_3', label: 'Mantener libertad financiera por 1 año', xp: 200 },
        { id: 'l6_4', label: 'Ayudar a otros a alcanzar la libertad', xp: 100 },
    ]
];

const EvolutionPage: React.FC = () => {
    const { transactions, credits, budgets, investmentTransactions, propertyInvestments } = useApp();
    const [checklistState, setChecklistState] = useLocalStorage<Record<string, boolean>>('evolution_checklist', {});
    const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
    const [unlockedLevelName, setUnlockedLevelName] = useState('');

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyIncome = useMemo(() => {
        return transactions
            .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, currentMonth, currentYear]);

    const monthlyExpenses = useMemo(() => {
        return transactions
            .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, currentMonth, currentYear]);

    const totalDebt = useMemo(() => {
        return credits.reduce((sum, c) => sum + c.totalAmount, 0); // Simplified
    }, [credits]);

    const emergencyFund = useMemo(() => {
        return budgets
            .filter(b => b.type === 'saving-fund')
            .reduce((sum, b) => sum + b.currentAmount, 0);
    }, [budgets]);

    const totalInvestments = useMemo(() => {
        const manualInvestments = investmentTransactions.reduce((sum, i) => sum + (i.isSold ? 0 : i.purchaseAmount), 0);
        const propertyValue = propertyInvestments.reduce((sum, p) => sum + p.purchasePrice, 0);
        return manualInvestments + propertyValue;
    }, [investmentTransactions, propertyInvestments]);

    const passiveIncome = useMemo(() => {
        // Simplified: assume some categories are passive
        const passiveCategories = ['Dividendos', 'Intereses', 'Alquiler', 'Rentas'];
        return transactions
            .filter(t => t.type === TransactionType.INCOME && passiveCategories.includes(t.category) && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, currentMonth, currentYear]);

    // Calculate XP and Levels
    let totalXP = 0;
    let maxPossibleXP = 0;
    
    CHECKLIST_ITEMS.forEach(levelItems => {
        levelItems.forEach(item => {
            maxPossibleXP += item.xp;
            if (checklistState[item.id]) {
                totalXP += item.xp;
            }
        });
    });

    const freedomScore = Math.floor((totalXP / maxPossibleXP) * 1000) || 0;
    
    // Determine current level based on completed items per level
    let currentLevelIndex = 0;
    for (let i = 0; i < CHECKLIST_ITEMS.length; i++) {
        const levelItems = CHECKLIST_ITEMS[i];
        const allCompleted = levelItems.every(item => checklistState[item.id]);
        if (allCompleted) {
            currentLevelIndex = Math.min(i + 1, CHECKLIST_ITEMS.length - 1);
        } else {
            break;
        }
    }

    // Check for level up animation
    const [prevLevelIndex, setPrevLevelIndex] = useLocalStorage('evolution_prev_level', currentLevelIndex);
    useEffect(() => {
        if (currentLevelIndex > prevLevelIndex) {
            setUnlockedLevelName(LEVEL_NAMES[currentLevelIndex]);
            setShowUnlockAnimation(true);
            setPrevLevelIndex(currentLevelIndex);
            setTimeout(() => setShowUnlockAnimation(false), 4000);
        }
    }, [currentLevelIndex, prevLevelIndex, setPrevLevelIndex]);

    const globalProgress = (freedomScore / 1000) * 100;

    const handleCheckToggle = (id: string) => {
        setChecklistState(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    // Calculate random comparison percentage based on score
    const aheadOfPercentage = Math.min(99, Math.max(1, Math.floor((freedomScore / 1000) * 90 + 5)));

    return (
        <div className="p-4 max-w-4xl mx-auto space-y-6 pb-24 relative">
            {showUnlockAnimation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="text-center space-y-4 animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        <div className="text-8xl mb-4">🎉</div>
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary uppercase tracking-widest">
                            Level Up!
                        </h2>
                        <p className="text-2xl text-white font-bold">
                            Has desbloqueado: <span className="text-accent">{unlockedLevelName}</span>
                        </p>
                    </div>
                </div>
            )}

            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                    <IconArrowUp className="w-8 h-8 text-primary" />
                    Financial Evolution
                </h1>
                <p className="text-slate-400">Tu camino hacia la libertad financiera, paso a paso.</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-primary/20">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Freedom Score</p>
                            <div className="text-5xl font-black text-white mt-1">{freedomScore}</div>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <IconTrophy className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Progreso Global</span>
                            <span className="text-primary font-bold">{globalProgress.toFixed(1)}%</span>
                        </div>
                        <ProgressBar progress={globalProgress} color="bg-primary" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700/50 text-sm text-center">
                        <span className="text-secondary font-medium">🔥 Estás por delante del {aheadOfPercentage}% de los usuarios</span>
                    </div>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <IconSparkles className="w-5 h-5 text-accent" />
                        Métricas Clave
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase">Ingresos (Mes)</p>
                            <p className="text-lg font-bold text-secondary">{formatCurrency(monthlyIncome)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">Gastos (Mes)</p>
                            <p className="text-lg font-bold text-danger">{formatCurrency(monthlyExpenses)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">Deuda Total</p>
                            <p className="text-lg font-bold text-orange-400">{formatCurrency(totalDebt)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">Fondo Emergencia</p>
                            <p className="text-lg font-bold text-info">{formatCurrency(emergencyFund)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">Inversiones</p>
                            <p className="text-lg font-bold text-purple-400">{formatCurrency(totalInvestments)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">Ingresos Pasivos</p>
                            <p className="text-lg font-bold text-emerald-400">{formatCurrency(passiveIncome)}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Vertical Map and Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Vertical Map */}
                <div className="lg:col-span-1">
                    <Card className="bg-slate-800 border-slate-700 sticky top-4">
                        <h3 className="text-lg font-bold text-white mb-6 text-center">Tu Ascenso</h3>
                        <div className="relative flex flex-col-reverse gap-0">
                            {/* Connecting Line */}
                            <div className="absolute left-1/2 top-4 bottom-4 w-1 bg-slate-700 -translate-x-1/2 rounded-full z-0"></div>
                            
                            {LEVEL_NAMES.map((name, index) => {
                                const isUnlocked = index <= currentLevelIndex;
                                const isCurrent = index === currentLevelIndex;
                                
                                return (
                                    <div key={index} className="relative z-10 flex flex-col items-center py-4">
                                        <div className={`
                                            w-14 h-14 rounded-full flex items-center justify-center text-2xl border-4 shadow-lg transition-all duration-300
                                            ${isCurrent ? 'bg-primary border-slate-900 scale-110 shadow-primary/50' : 
                                              isUnlocked ? 'bg-slate-700 border-primary text-white' : 
                                              'bg-slate-800 border-slate-700 text-slate-600 grayscale'}
                                        `}>
                                            {LEVEL_ICONS[index]}
                                        </div>
                                        <div className={`mt-2 font-bold text-sm text-center ${isCurrent ? 'text-primary' : isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                                            Nivel {index + 1}<br/>{name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Checklist */}
                <div className="lg:col-span-2 space-y-4">
                    {LEVEL_NAMES.map((name, index) => {
                        const isUnlocked = index <= currentLevelIndex;
                        const items = CHECKLIST_ITEMS[index];
                        const completedCount = items.filter(item => checklistState[item.id]).length;
                        const progress = (completedCount / items.length) * 100;

                        if (!isUnlocked && index > currentLevelIndex) {
                            return (
                                <Card key={index} className="bg-slate-800/50 border-slate-700/50 opacity-50">
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl grayscale opacity-50">{LEVEL_ICONS[index]}</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-500">Nivel {index + 1}: {name}</h3>
                                            <p className="text-sm text-slate-600">Bloqueado. Completa el nivel anterior.</p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        }

                        return (
                            <Card key={index} className={`bg-slate-800 border-slate-700 transition-all ${index === currentLevelIndex ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/10' : ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">{LEVEL_ICONS[index]}</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Nivel {index + 1}: {name}</h3>
                                            <p className="text-sm text-slate-400">{completedCount} de {items.length} completados</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-primary">{Math.round(progress)}%</div>
                                    </div>
                                </div>
                                
                                <ProgressBar progress={progress} color={progress === 100 ? 'bg-secondary' : 'bg-primary'} className="mb-6 h-2" />

                                <div className="space-y-3">
                                    {items.map(item => {
                                        const isChecked = !!checklistState[item.id];
                                        return (
                                            <label key={item.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-slate-700/50' : 'bg-slate-700/20 hover:bg-slate-700/40'}`}>
                                                <div className="relative flex items-center justify-center mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={isChecked}
                                                        onChange={() => handleCheckToggle(item.id)}
                                                    />
                                                    <div className="w-6 h-6 rounded border-2 border-slate-500 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-all">
                                                        <svg className={`w-4 h-4 text-slate-900 transition-transform ${isChecked ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium transition-colors ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                                        {item.label}
                                                    </p>
                                                </div>
                                                <div className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">
                                                    +{item.xp} XP
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EvolutionPage;
