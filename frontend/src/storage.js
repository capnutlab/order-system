// ローカルストレージ用のユーティリティ関数

const STORAGE_KEYS = {
  ORDERS: 'order-system-orders',
  MASTERS: 'order-system-masters'
};

// 注文データをローカルストレージから読み込む
export const loadOrders = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('注文データの読み込みエラー:', error);
    return [];
  }
};

// 注文データをローカルストレージに保存する
export const saveOrders = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error('注文データの保存エラー:', error);
    throw error;
  }
};

// マスタデータをローカルストレージから読み込む
export const loadMasters = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MASTERS);
    if (data) {
      return JSON.parse(data);
    }
    return { clients: [], products: [], materials: [] };
  } catch (error) {
    console.error('マスタデータの読み込みエラー:', error);
    return { clients: [], products: [], materials: [] };
  }
};

// マスタデータをローカルストレージに保存する
export const saveMasters = (masters) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MASTERS, JSON.stringify(masters));
  } catch (error) {
    console.error('マスタデータの保存エラー:', error);
    throw error;
  }
};

// 注文をローカルストレージから削除する
export const deleteOrderFromStorage = (orderId) => {
  try {
    const orders = loadOrders();
    const updatedOrders = orders.filter(order => order.id !== orderId);
    saveOrders(updatedOrders);
    return updatedOrders;
  } catch (error) {
    console.error('注文削除エラー:', error);
    throw error;
  }
};
