import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle, X, FileText, Plus, ChevronUp, ChevronDown, Eye, RefreshCw, Edit3, Trash2 } from 'lucide-react';
import { loadOrders, saveOrders, loadMasters, saveMasters, deleteOrderFromStorage } from './storage';

const ORDER_STATUS = {
  IN_PROGRESS: '進行中',
  COMPLETED: '完了'
};

const dateUtils = {
  getDaysUntilDeadline: (deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  },
  getAlertLevel: (daysUntil) => {
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 3) return 'urgent';
    if (daysUntil <= 7) return 'warning';
    return 'normal';
  }
};

const styleUtils = {
  getRowColorClass: (alertLevel) => {
    const colors = { overdue: 'bg-red-50', urgent: 'bg-orange-50', warning: 'bg-yellow-50', normal: 'bg-white' };
    return colors[alertLevel] || colors.normal;
  },
  getDaysTextColorClass: (daysUntil) => {
    if (daysUntil < 0) return 'text-red-600';
    if (daysUntil <= 3) return 'text-orange-600';
    if (daysUntil <= 7) return 'text-yellow-600';
    return 'text-slate-600';
  }
};

const MasterCard = ({ title, type, data, input, setInput, addFunc, moveUp, moveDown, deleteMaster }) => (
  <div className="bg-white border border-slate-200 p-5">
    <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wide uppercase">{title}</h3>
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        placeholder={`${title}を入力`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addFunc()}
        className="flex-1 px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
      />
      <button onClick={addFunc} className="px-4 py-2 bg-slate-900 text-white text-sm hover:bg-slate-800">追加</button>
    </div>
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {data.length === 0 ? (
        <div className="text-center py-6 text-slate-400"><p className="text-xs">未登録</p></div>
      ) : (
        data.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 hover:bg-slate-100 group">
            <span className="text-sm text-slate-700">{item}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
              <button onClick={() => moveUp(type, idx)} disabled={idx === 0} className={`p-1 ${idx === 0 ? 'text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
                <ChevronUp size={14} />
              </button>
              <button onClick={() => moveDown(type, idx)} disabled={idx === data.length - 1} className={`p-1 ${idx === data.length - 1 ? 'text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
                <ChevronDown size={14} />
              </button>
              <button onClick={() => deleteMaster(type, item)} className="p-1 text-slate-600 hover:text-red-600 ml-1">
                <X size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
    <div className="mt-4 pt-4 border-t border-slate-200">
      <p className="text-xs text-slate-500 text-right">{data.length} 件</p>
    </div>
  </div>
);

const OrderAddForm = ({ commonData, setCommonData, items, setItems, masters, onSubmit, onCancel }) => {
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showSizeDropdowns, setShowSizeDropdowns] = useState([false, false, false, false, false]);

  const filteredClients = masters.clients.filter(client => 
    !commonData.clientName || client.toLowerCase().includes(commonData.clientName.toLowerCase())
  );

  const toggleSizeDropdown = (index) => {
    const newDropdowns = [...showSizeDropdowns];
    newDropdowns[index] = !newDropdowns[index];
    setShowSizeDropdowns(newDropdowns);
  };

  const getFilteredProducts = (index) => {
    const searchTerm = items[index].size.toLowerCase();
    return masters.products.filter(product => 
      !items[index].size || product.toLowerCase().includes(searchTerm)
    );
  };

  return (
    <div className="bg-white border border-slate-200 p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wide uppercase">新規注文（5件一括登録）</h3>
      
      {/* 共通項目（1段目） */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide">共通項目</p>
        <div className="grid grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="注文番号 *" 
            value={commonData.orderNumber} 
            onChange={(e) => setCommonData({...commonData, orderNumber: e.target.value})} 
            className="px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" 
          />
          <div className="relative">
            <input 
              type="text" 
              placeholder="顧客名" 
              value={commonData.clientName} 
              onChange={(e) => {
                setCommonData({...commonData, clientName: e.target.value});
                setShowClientDropdown(true);
              }}
              onFocus={() => setShowClientDropdown(true)}
              onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
              className="px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none w-full" 
            />
            {showClientDropdown && filteredClients.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.map((client, i) => (
                  <div
                    key={i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCommonData({...commonData, clientName: client});
                      setShowClientDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                  >
                    {client}
                  </div>
                ))}
              </div>
            )}
          </div>
          <input 
            type="date" 
            value={commonData.deadline} 
            onChange={(e) => setCommonData({...commonData, deadline: e.target.value})} 
            className="px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" 
          />
        </div>
      </div>

      {/* 個別項目（5件分） */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide">個別項目（材質・サイズ・数量）</p>
        <div className="space-y-3">
          {items.map((item, index) => {
            const filteredProducts = getFilteredProducts(index);
            return (
              <div key={index} className="grid grid-cols-4 gap-4 items-center">
                <span className="text-xs text-slate-500 font-medium">#{index + 1}</span>
                <select 
                  value={item.material} 
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].material = e.target.value;
                    setItems(newItems);
                  }} 
                  className="px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                >
                  <option value="">材質</option>
                  {masters.materials.map((m, i) => <option key={i} value={m}>{m}</option>)}
                </select>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="サイズ" 
                    value={item.size} 
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index].size = e.target.value;
                      setItems(newItems);
                      const newDropdowns = [...showSizeDropdowns];
                      newDropdowns[index] = true;
                      setShowSizeDropdowns(newDropdowns);
                    }}
                    onFocus={() => {
                      const newDropdowns = [...showSizeDropdowns];
                      newDropdowns[index] = true;
                      setShowSizeDropdowns(newDropdowns);
                    }}
                    onBlur={() => setTimeout(() => {
                      const newDropdowns = [...showSizeDropdowns];
                      newDropdowns[index] = false;
                      setShowSizeDropdowns(newDropdowns);
                    }, 200)}
                    className="px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none w-full" 
                  />
                  {showSizeDropdowns[index] && filteredProducts.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product, i) => (
                        <div
                          key={i}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const newItems = [...items];
                            newItems[index].size = product;
                            setItems(newItems);
                            const newDropdowns = [...showSizeDropdowns];
                            newDropdowns[index] = false;
                            setShowSizeDropdowns(newDropdowns);
                          }}
                          className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                        >
                          {product}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input 
                  type="number" 
                  placeholder="数量" 
                  value={item.quantity} 
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].quantity = e.target.value;
                    setItems(newItems);
                  }} 
                  className="px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" 
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={onSubmit} className="px-6 py-2 bg-slate-900 text-white text-sm hover:bg-slate-800">追加</button>
        <button onClick={onCancel} className="px-6 py-2 border border-slate-300 text-slate-700 text-sm hover:bg-slate-50">キャンセル</button>
      </div>
    </div>
  );
};

const OrderTable = ({ orders, onRowClick }) => {
  if (orders.length === 0) {
    return (
      <div className="p-16 text-center">
        <FileText size={48} className="mx-auto mb-4 text-slate-300" />
        <p className="text-slate-400 text-sm">注文データがありません</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-slate-900 text-white">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">注文番号</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">顧客名</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">商品名</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">材質</th>
          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">数量</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">納期</th>
          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">残日数</th>
          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">状態</th>
          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">詳細</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
{orders
  .sort((a, b) => {
    // 1. まず「状態」で並び替える（進行中を上に、完了を下に）
    if (a.status !== b.status) {
      return a.status === ORDER_STATUS.COMPLETED ? 1 : -1;
    }
    // 2. 同じ状態の中では「納期」が近い順に並べる
    return new Date(a.deadline) - new Date(b.deadline);
  })
  .map((order) => {
          const daysUntil = dateUtils.getDaysUntilDeadline(order.deadline);
          const alertLevel = dateUtils.getAlertLevel(daysUntil);
          const rowColor = styleUtils.getRowColorClass(alertLevel);
          const daysColor = styleUtils.getDaysTextColorClass(daysUntil);

          return (
            <tr key={order.id} className={`${rowColor} cursor-pointer hover:bg-slate-100`} onClick={() => onRowClick(order)}>
              <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">{order.orderNumber}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{order.clientName || '−'}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{order.productName || '−'}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{order.material || '−'}</td>
              <td className="px-4 py-3 text-sm text-slate-700 text-center font-medium">{order.quantity || '−'}</td>
              <td className="px-4 py-3 text-sm text-slate-700 font-mono">{order.deadline}</td>
              <td className="px-4 py-3 text-center">
                {order.status !== ORDER_STATUS.COMPLETED && (
                  <span className={`text-xs font-semibold ${daysColor}`}>
                    {daysUntil < 0 ? `${Math.abs(daysUntil)}日遅延` : `残り${daysUntil}日`}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`px-3 py-1 text-xs font-medium ${order.status === ORDER_STATUS.COMPLETED ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <button onClick={(e) => { e.stopPropagation(); onRowClick(order); }} className="text-slate-400 hover:text-slate-900">
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const OrderDetailModal = ({ order, masters, onClose, onStatusChange, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState({ ...order });
  const daysUntil = dateUtils.getDaysUntilDeadline(editedOrder.deadline);
  const daysColor = styleUtils.getDaysTextColorClass(daysUntil);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white max-w-2xl w-full p-8 border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-lg font-semibold text-slate-900 tracking-wide uppercase">{isEditing ? '注文編集' : '注文詳細'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase tracking-wide">注文番号</label>
                <input type="text" value={editedOrder.orderNumber} onChange={(e) => setEditedOrder({...editedOrder, orderNumber: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase tracking-wide">状態</label>
                <select value={editedOrder.status} onChange={(e) => setEditedOrder({...editedOrder, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none">
                  <option value={ORDER_STATUS.IN_PROGRESS}>{ORDER_STATUS.IN_PROGRESS}</option>
                  <option value={ORDER_STATUS.COMPLETED}>{ORDER_STATUS.COMPLETED}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase tracking-wide">顧客名</label>
                <input type="text" list="edit-client-list" value={editedOrder.clientName} onChange={(e) => setEditedOrder({...editedOrder, clientName: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" />
                <datalist id="edit-client-list">{masters.clients.map((c, i) => <option key={i} value={c} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase tracking-wide">商品名</label>
                <input type="text" list="edit-product-list" value={editedOrder.productName} onChange={(e) => setEditedOrder({...editedOrder, productName: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" />
                <datalist id="edit-product-list">{masters.products.map((p, i) => <option key={i} value={p} />)}</datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase tracking-wide">材質</label>
                <select value={editedOrder.material} onChange={(e) => setEditedOrder({...editedOrder, material: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none">
                  <option value="">材質を選択</option>
                  {masters.materials.map((m, i) => <option key={i} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase tracking-wide">数量</label>
                <input type="number" value={editedOrder.quantity} onChange={(e) => setEditedOrder({...editedOrder, quantity: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-2 uppercase tracking-wide">納期</label>
              <input type="date" value={editedOrder.deadline} onChange={(e) => setEditedOrder({...editedOrder, deadline: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">注文番号</p>
                <p className="text-lg font-semibold font-mono text-slate-900">{editedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">状態</p>
                <span className={`inline-block px-3 py-1 text-xs font-medium ${editedOrder.status === ORDER_STATUS.COMPLETED ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                  {editedOrder.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">顧客名</p>
                <p className="text-sm text-slate-900">{editedOrder.clientName || '−'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">商品名</p>
                <p className="text-sm text-slate-900">{editedOrder.productName || '−'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">材質</p>
                <p className="text-sm text-slate-900">{editedOrder.material || '−'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">数量</p>
                <p className="text-sm text-slate-900">{editedOrder.quantity || '−'}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">納期</p>
              <div className="flex items-baseline gap-4">
                <p className="text-lg font-mono font-semibold text-slate-900">{editedOrder.deadline}</p>
                {editedOrder.status !== ORDER_STATUS.COMPLETED && (
                  <span className={`text-sm font-semibold ${daysColor}`}>
                    {daysUntil < 0 ? `${Math.abs(daysUntil)}日遅延` : `残り${daysUntil}日`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-slate-200">
          {isEditing ? (
            <>
              <div className="flex gap-3">
                <button onClick={() => { onUpdate(editedOrder); setIsEditing(false); }} className="flex-1 px-6 py-3 bg-slate-900 text-white text-sm hover:bg-slate-800 flex items-center justify-center gap-2">
                  <CheckCircle size={16} />保存
                </button>
                <button onClick={() => { setEditedOrder({...order}); setIsEditing(false); }} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                  <X size={16} />キャンセル
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3">
                <button onClick={() => setIsEditing(true)} className="flex-1 px-6 py-3 bg-slate-900 text-white text-sm hover:bg-slate-800 flex items-center justify-center gap-2">
                  <Edit3 size={16} />編集
                </button>
                {editedOrder.status !== ORDER_STATUS.COMPLETED ? (
                  <button onClick={() => { onStatusChange(editedOrder.id, ORDER_STATUS.COMPLETED); setEditedOrder({...editedOrder, status: ORDER_STATUS.COMPLETED}); }} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                    <CheckCircle size={16} />完了
                  </button>
                ) : (
                  <button onClick={() => { onStatusChange(editedOrder.id, ORDER_STATUS.IN_PROGRESS); setEditedOrder({...editedOrder, status: ORDER_STATUS.IN_PROGRESS}); }} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                    <Calendar size={16} />進行中に戻す
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  if (window.confirm('この注文を削除してもよろしいですか？')) {
                    onDelete(editedOrder.id);
                  }
                }} 
                className="w-full px-6 py-3 bg-red-600 text-white text-sm hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />削除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// お試し版の機能制限
const TRIAL_LIMITS = {
  MAX_ORDERS: 20,
  MAX_MASTERS: 10
};

const OrderDeadlineManager = () => {
  const [orders, setOrders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [masters, setMasters] = useState({ clients: [], products: [], materials: [] });
  const [clientInput, setClientInput] = useState('');
  const [productInput, setProductInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');
  const [commonData, setCommonData] = useState({
    orderNumber: '',
    clientName: '',
    deadline: ''
  });
  const [items, setItems] = useState([
    { material: '', size: '', quantity: '' },
    { material: '', size: '', quantity: '' },
    { material: '', size: '', quantity: '' },
    { material: '', size: '', quantity: '' },
    { material: '', size: '', quantity: '' }
  ]);

  // 初回読み込み：ローカルストレージからデータを読み込む
  useEffect(() => {
    const orderData = loadOrders();
    setOrders(orderData || []);

    const masterData = loadMasters();
    setMasters(masterData || { clients: [], products: [], materials: [] });
  }, []);

  // マスタデータをローカルストレージに保存
  const saveMastersToStorage = (updatedMasters) => {
    try {
      saveMasters(updatedMasters);
    } catch (error) {
      console.error('マスタ保存エラー:', error);
      alert('マスタデータの保存に失敗しました');
    }
  };

  // 注文データをローカルストレージに保存
  const saveOrderToStorage = (order) => {
    try {
      const currentOrders = loadOrders();
      const existingIndex = currentOrders.findIndex(o => o.id === order.id);
      let updatedOrders;
      if (existingIndex >= 0) {
        updatedOrders = [...currentOrders];
        updatedOrders[existingIndex] = order;
      } else {
        updatedOrders = [...currentOrders, order];
      }
      saveOrders(updatedOrders);
      return updatedOrders;
    } catch (error) {
      console.error('注文保存エラー:', error);
      alert('注文データの保存に失敗しました');
      throw error;
    }
  };

  // 更新ボタンを押した時の処理
  const refreshData = () => {
    const orderData = loadOrders();
    setOrders(orderData || []);

    const masterData = loadMasters();
    setMasters(masterData || { clients: [], products: [], materials: [] });
    
    alert('データを更新しました');
  };



  const addClient = () => {
    const value = clientInput.trim();
    if (!value) return;
    if (masters.clients.includes(value)) { 
      alert('既に登録されています'); 
      setClientInput(''); 
      return; 
    }
    // 機能制限チェック
    if (masters.clients.length >= TRIAL_LIMITS.MAX_MASTERS) {
      alert(`お試し版では${TRIAL_LIMITS.MAX_MASTERS}件まで登録できます。`);
      setClientInput('');
      return;
    }
    const updatedMasters = { ...masters, clients: [...masters.clients, value] };
    setMasters(updatedMasters);
    saveMastersToStorage(updatedMasters);
    setClientInput('');
  };

  const addProduct = () => {
    const value = productInput.trim();
    if (!value) return;
    if (masters.products.includes(value)) { 
      alert('既に登録されています'); 
      setProductInput(''); 
      return; 
    }
    // 機能制限チェック
    if (masters.products.length >= TRIAL_LIMITS.MAX_MASTERS) {
      alert(`お試し版では${TRIAL_LIMITS.MAX_MASTERS}件まで登録できます。`);
      setProductInput('');
      return;
    }
    const updatedMasters = { ...masters, products: [...masters.products, value] };
    setMasters(updatedMasters);
    saveMastersToStorage(updatedMasters);
    setProductInput('');
  };

  const addMaterial = () => {
    const value = materialInput.trim();
    if (!value) return;
    if (masters.materials.includes(value)) { 
      alert('既に登録されています'); 
      setMaterialInput(''); 
      return; 
    }
    // 機能制限チェック
    if (masters.materials.length >= TRIAL_LIMITS.MAX_MASTERS) {
      alert(`お試し版では${TRIAL_LIMITS.MAX_MASTERS}件まで登録できます。`);
      setMaterialInput('');
      return;
    }
    const updatedMasters = { ...masters, materials: [...masters.materials, value] };
    setMasters(updatedMasters);
    saveMastersToStorage(updatedMasters);
    setMaterialInput('');
  };

  const moveUp = (type, index) => {
    if (index === 0) return;
    const newArray = [...masters[type]];
    [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
    const updatedMasters = { ...masters, [type]: newArray };
    setMasters(updatedMasters);
    saveMastersToStorage(updatedMasters);
  };

  const moveDown = (type, index) => {
    if (index === masters[type].length - 1) return;
    const newArray = [...masters[type]];
    [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
    const updatedMasters = { ...masters, [type]: newArray };
    setMasters(updatedMasters);
    saveMastersToStorage(updatedMasters);
  };

  const deleteMaster = (type, value) => {
    const updatedMasters = { ...masters, [type]: masters[type].filter(item => item !== value) };
    setMasters(updatedMasters);
    saveMastersToStorage(updatedMasters);
  };


  const handleAddOrder = () => {
    if (!commonData.orderNumber || !commonData.deadline) { 
      alert('注文番号と納期は必須です'); 
      return; 
    }
    
    // 機能制限チェック：注文数が20件に達しているか
    if (orders.length >= TRIAL_LIMITS.MAX_ORDERS) {
      alert(`お試し版では${TRIAL_LIMITS.MAX_ORDERS}件まで登録できます。`);
      return;
    }
    
    // 入力されている項目のみを登録（全て空の行はスキップ）
    const validItems = items.filter(item => {
      const hasMaterial = item.material && item.material.trim() !== '';
      const hasSize = item.size && item.size.trim() !== '';
      const hasQuantity = item.quantity !== '' && item.quantity !== null && item.quantity !== undefined;
      return hasMaterial || hasSize || hasQuantity;
    });
    
    if (validItems.length === 0) {
      alert('少なくとも1件の材質・サイズ・数量を入力してください');
      return;
    }

    // 追加後の注文数が制限を超えないかチェック
    const totalAfterAdd = orders.length + validItems.length;
    if (totalAfterAdd > TRIAL_LIMITS.MAX_ORDERS) {
      const canAdd = TRIAL_LIMITS.MAX_ORDERS - orders.length;
      alert(`お試し版では${TRIAL_LIMITS.MAX_ORDERS}件まで登録できます。現在${orders.length}件登録済みのため、あと${canAdd}件まで追加できます。`);
      return;
    }

    // 5件分の注文を作成
    const newOrders = validItems.map((item, index) => ({
      orderNumber: commonData.orderNumber,
      clientName: commonData.clientName,
      productName: item.size || '', // サイズの値を商品名として設定
      material: item.material,
      size: item.size,
      quantity: item.quantity,
      deadline: commonData.deadline,
      status: ORDER_STATUS.IN_PROGRESS,
      id: Date.now() + index, // ユニークなIDを生成
      uploadedAt: new Date().toISOString()
    }));

    // 全ての注文をローカルストレージに保存
    const updatedOrders = [...orders, ...newOrders];
    saveOrders(updatedOrders);
    setOrders(updatedOrders);
    
    // フォームをリセット
    setCommonData({ orderNumber: '', clientName: '', deadline: '' });
    setItems([
      { material: '', size: '', quantity: '' },
      { material: '', size: '', quantity: '' },
      { material: '', size: '', quantity: '' },
      { material: '', size: '', quantity: '' },
      { material: '', size: '', quantity: '' }
    ]);
    setShowAddForm(false);
    alert(`${newOrders.length}件の注文を追加しました`);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updated = { 
          ...order, 
          status: newStatus,
          // 完了になった瞬間の日付を記録、進行中に戻したら消去
          completedAt: newStatus === ORDER_STATUS.COMPLETED ? new Date().toISOString() : null 
        };
        saveOrderToStorage(updated);
        return updated;
      }
      return order;
    });
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
  };

  const handleUpdateOrder = (updatedOrder) => {
    const updatedOrders = saveOrderToStorage(updatedOrder);
    setOrders(updatedOrders);
    alert('注文を更新しました');
    setSelectedOrder(null);
  };

  const deleteOrder = (orderId) => {
    try {
      const updatedOrders = deleteOrderFromStorage(orderId);
      setOrders(updatedOrders);
      setSelectedOrder(null);
      alert('注文を削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('注文の削除に失敗しました');
    }
  };

  const alertOrders = orders.filter(order => {
    if (order.status === ORDER_STATUS.COMPLETED) return false;
    return dateUtils.getDaysUntilDeadline(order.deadline) <= 7;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="bg-white border border-slate-200 mb-6">
          <div className="flex justify-between items-center p-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">注文書納期管理</h1>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">お試し版</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">Order Deadline Management System</p>
              <p className="text-xs text-slate-400 mt-1">注文: {orders.length}/{TRIAL_LIMITS.MAX_ORDERS}件 | マスタ: 各{Object.values(masters).reduce((sum, arr) => sum + arr.length, 0)}/{TRIAL_LIMITS.MAX_MASTERS * 3}件</p>
            </div>
            <button onClick={refreshData} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 flex items-center gap-2">
              <RefreshCw size={16} />
              更新
            </button>
          </div>

          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'orders' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              注文管理
            </button>
            <button
              onClick={() => setActiveTab('masters')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'masters' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              マスタ登録
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'masters' ? (
              <div>
                <div className="bg-slate-100 border-l-2 border-slate-900 p-4 mb-6">
                  <p className="text-sm text-slate-700">よく使う顧客名・商品名・材質を事前に登録しておくと、注文追加時に選択できます</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <MasterCard title="顧客名" type="clients" data={masters.clients} input={clientInput} setInput={setClientInput} addFunc={addClient} moveUp={moveUp} moveDown={moveDown} deleteMaster={deleteMaster} />
                  <MasterCard title="商品名" type="products" data={masters.products} input={productInput} setInput={setProductInput} addFunc={addProduct} moveUp={moveUp} moveDown={moveDown} deleteMaster={deleteMaster} />
                  <MasterCard title="材質" type="materials" data={masters.materials} input={materialInput} setInput={setMaterialInput} addFunc={addMaterial} moveUp={moveUp} moveDown={moveDown} deleteMaster={deleteMaster} />
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => setShowAddForm(!showAddForm)} className="mb-6 px-4 py-2 bg-slate-900 text-white text-sm hover:bg-slate-800 flex items-center gap-2">
                  <Plus size={16} />新規注文
                </button>
                {showAddForm && <OrderAddForm commonData={commonData} setCommonData={setCommonData} items={items} setItems={setItems} masters={masters} onSubmit={handleAddOrder} onCancel={() => setShowAddForm(false)} />}
                {alertOrders.length > 0 && (
                  <div className="mb-6 bg-red-50 border-l-2 border-red-600 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-red-600" size={20} />
                      <p className="text-sm text-red-800 font-medium">{alertOrders.length}件の注文が納期7日以内です</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200 overflow-hidden">
            <OrderTable orders={orders} onRowClick={setSelectedOrder} />
          </div>
        )}

        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} masters={masters} onClose={() => setSelectedOrder(null)} onStatusChange={updateOrderStatus} onUpdate={handleUpdateOrder} onDelete={deleteOrder} />
        )}
      </div>
    </div>
  );
};

export default OrderDeadlineManager;