import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Moon, 
  Sun, 
  Plus, 
  Trash2, 
  AlertCircle, 
  TrendingUp, 
  Coffee,
  Lightbulb,
  CheckCircle,
  X,
  Edit3,
  User,
  Save,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const TIPS = [
  { title: "Técnica Pomodoro", desc: "Trabalhe 25 min, descanse 5 min. Ideal para manter o foco." },
  { title: "Matriz de Eisenhower", desc: "Priorize por Urgência e Importância. Não confunda os dois!" },
  { title: "Regra dos 2 Minutos", desc: "Se algo leva menos de 2 min, faça agora mesmo." },
  { title: "Foco Único", desc: "Multitasking é um mito. Concentre-se em uma tarefa por vez." }
];

// Mouse Click Animation Component
const RippleEffect = () => {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const handleClick = (e) => {
      const ripple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    };

    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: 'absolute',
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.4)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}
        />
      ))}
    </div>
  );
};

const App = () => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [workHours, setWorkHours] = useState(8);
  const [lunchBreak, setLunchBreak] = useState(1);
  const [darkMode, setDarkMode] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newResponsible, setNewResponsible] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editResponsible, setEditResponsible] = useState("");
  const [currentTip, setCurrentTip] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for the clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist tasks
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalEffectiveHours = useMemo(() => workHours - lunchBreak, [workHours, lunchBreak]);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const productivity = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, productivity };
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(),
      text: newTask,
      deadline: newDeadline || null,
      responsible: newResponsible || "Eu",
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, task]);
    setNewTask("");
    setNewDeadline("");
    setNewResponsible("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditResponsible(task.responsible);
  };

  const saveEdit = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, text: editText, responsible: editResponsible } : t));
    setEditingId(null);
  };

  const finishDay = () => {
    // Keep pending tasks, but we could mark them as "Carried Over" if needed.
    // The user wants to "acumular a demanda para o dia posterior".
    // This usually means keeping uncompleted tasks while potentially logging the completed ones.
    // For now, we'll just keep the tasks and show the report.
    // Completeds could be archived in a real app, but here we'll just keep them.
    setShowReport(true);
  };

  const isDelayed = (deadline) => {
    if (!deadline) return false;
    const [hours, minutes] = deadline.split(':');
    const deadlineDate = new Date();
    deadlineDate.setHours(parseInt(hours), parseInt(minutes), 0);
    return isAfter(currentTime, deadlineDate);
  };

  const chartData = [
    { name: 'Concluídas', value: stats.completed },
    { name: 'Pendentes', value: stats.total - stats.completed },
  ];

  const COLORS = darkMode ? ['#10b981', '#1e293b'] : ['#3b82f6', '#e2e8f0'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 p-4 md:p-8 font-['Inter',sans-serif]">
      <RippleEffect />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <TrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de trabalho</h1>
          </motion.div>

          <div className="hidden md:block h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />

          {/* Date and Time Header */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 text-sm font-medium opacity-70"
          >
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              <span>{format(currentTime, "PPPP", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span className="tabular-nums font-bold text-lg">{format(currentTime, "HH:mm:ss")}</span>
            </div>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 glass-card flex items-center justify-center"
        >
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
        </motion.button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Management */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Dashboard Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="text-blue-500" size={20} /> Gestão de Tempo
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-70">Carga Horária</span>
                  <input 
                    type="number" 
                    value={workHours} 
                    onChange={(e) => setWorkHours(Number(e.target.value))}
                    className="w-16 input-glass text-center font-bold"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-70">Pausa Almoço</span>
                  <input 
                    type="number" 
                    value={lunchBreak} 
                    onChange={(e) => setLunchBreak(Number(e.target.value))}
                    className="w-16 input-glass text-center font-bold"
                  />
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-50">Saldo Real</p>
                    <p className="text-3xl font-bold text-blue-500">{totalEffectiveHours}h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-50">Produtividade</p>
                    <p className="text-xl font-bold">{stats.productivity}%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 flex flex-col items-center justify-center min-h-[220px]"
            >
              <h3 className="text-sm font-medium mb-2 opacity-70">Progresso do Dia</h3>
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs opacity-50">{stats.completed} de {stats.total} tarefas feitas</p>
            </motion.div>
          </section>

          {/* Todo List Section */}
          <section className="glass-card p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={20} /> Checklist Interativo
              </h2>
            </div>

            <form onSubmit={addTask} className="space-y-4 mb-8">
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="O que precisa ser feito?"
                  className="flex-[2] input-glass"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
                <div className="flex-[1] relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                  <input 
                    type="text" 
                    placeholder="Responsável"
                    className="w-full input-glass pl-10"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                  <input 
                    type="time" 
                    className="w-full input-glass pl-10"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>
                <button type="submit" className="flex-[1] btn-primary flex items-center justify-center gap-2">
                  <Plus size={20} /> <span>Adicionar Tarefa</span>
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {tasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 opacity-30"
                  >
                    <CheckCircle size={48} className="mx-auto mb-4" />
                    <p>Nenhuma tarefa pendente. Comece o seu dia!</p>
                  </motion.div>
                ) : (
                  tasks.sort((a,b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1).map((task) => {
                    const delayed = !task.completed && isDelayed(task.deadline);
                    const isEditing = editingId === task.id;

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group p-4 rounded-xl flex items-center gap-4 transition-all duration-300 ${
                          task.completed 
                            ? 'bg-slate-200/20 dark:bg-slate-800/20 opacity-60' 
                            : 'bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10'
                        } border border-white/5`}
                      >
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className={`transition-colors duration-300 ${task.completed ? 'text-emerald-500' : 'text-slate-400'}`}
                        >
                          {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  className="flex-1 input-glass py-1 text-sm font-medium"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                                />
                                <button 
                                  onClick={() => saveEdit(task.id)}
                                  className="p-1 px-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded flex items-center gap-2 text-xs font-bold"
                                >
                                  <Save size={14} /> SALVAR
                                </button>
                              </div>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={12} />
                                <input 
                                  type="text"
                                  className="w-full input-glass py-1 pl-8 text-[10px]"
                                  value={editResponsible}
                                  onChange={(e) => setEditResponsible(e.target.value)}
                                  placeholder="Responsável"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className={`font-medium transition-all duration-300 ${task.completed ? 'line-through' : ''}`}>
                                {task.text}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                {task.deadline && (
                                  <span className="text-[10px] opacity-50 flex items-center gap-1 uppercase tracking-wider">
                                    <Clock size={10} /> {task.deadline}
                                  </span>
                                )}
                                <span className="text-[10px] opacity-70 flex items-center gap-1 font-semibold text-blue-500 uppercase tracking-wider">
                                  <User size={10} /> {task.responsible}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {delayed && (
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="px-2 py-1 bg-rose-500 text-[10px] font-bold text-white rounded-full uppercase tracking-tighter"
                          >
                            Atrasado
                          </motion.div>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {!task.completed && !isEditing && (
                            <button 
                              onClick={() => startEditing(task)}
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                            >
                              <Edit3 size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )
              }
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 bg-gradient-to-br from-blue-600/10 to-emerald-600/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-500" size={20} />
              <h3 className="font-semibold">Dica de Produtividade</h3>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="font-bold text-blue-500 mb-1">{TIPS[currentTip].title}</p>
                <p className="text-sm opacity-70 leading-relaxed">{TIPS[currentTip].desc}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Quick Stats Widget */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> Resumo Rápido
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/30 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase opacity-50">Feitas</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
              <div className="bg-white/30 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase opacity-50">Pendentes</p>
                <p className="text-xl font-bold">{stats.total - stats.completed}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={finishDay}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
          >
            <CheckCircle size={20} /> Finalizar Dia
          </button>
        </aside>
      </main>

      {/* End of Day Modal */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReport(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg p-8 relative z-10"
            >
              <button 
                onClick={() => setShowReport(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold">Relatório de Fechamento</h2>
                <p className="text-sm opacity-50">Bom trabalho hoje!</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] uppercase opacity-50 mb-1">Horas Úteis</p>
                    <p className="text-xl font-bold text-blue-500">{totalEffectiveHours}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase opacity-50 mb-1">Tarefas</p>
                    <p className="text-xl font-bold text-emerald-500">{stats.completed}/{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase opacity-50 mb-1">Eficiência</p>
                    <p className="text-xl font-bold text-blue-500">{stats.productivity}%</p>
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Planejado', val: stats.total },
                      { name: 'Realizado', val: stats.completed }
                    ]}>
                      <XAxis dataKey="name" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                        { [0, 1].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} />
                        ))}
                      </Bar>
                      <Tooltip 
                        contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-sm text-center font-medium text-emerald-600 dark:text-emerald-400">
                    {stats.productivity >= 80 
                      ? "Excelente! Você manteve um alto nível de produtividade." 
                      : stats.productivity >= 50 
                      ? "Bom progresso! Avalie os atrasos para amanhã."
                      : "Dia puxado? Recarregue as energias para o próximo desafio!"}
                  </p>
                  <p className="text-[10px] text-center mt-2 opacity-50 italic">
                    * Tarefas pendentes serão acumuladas para o próximo período.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowReport(false)}
                className="w-full btn-primary py-4 mt-8"
              >
                Concluido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
