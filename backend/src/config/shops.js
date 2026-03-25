// Shop configuration (hardcoded for v1)
export const shops = {
  shop1: {
    id: "shop1",
    name: "Shop 1 - Main Street",
    address: "Main Street Location",
    displayName: "Main Street",
  },
  shop2: {
    id: "shop2",
    name: "Shop 2 - Market Road",
    address: "Market Road Location",
    displayName: "Market Road",
  },
};

export const getShop = (shopId) => {
  return shops[shopId] || null;
};

export const getAllShops = () => {
  return Object.values(shops);
};

export default shops;
