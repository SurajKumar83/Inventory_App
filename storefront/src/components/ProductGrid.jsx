import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore.js';

export default function ProductGrid({ products }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addItem(product, 1);
    alert(`${product.name} added to cart!`);
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => handleProductClick(product.id)}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
        >
          <div className="aspect-square bg-gray-100 flex items-center justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-4xl">📦</div>
            )}
          </div>

          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{product.category}</p>

            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-dukaan-green-600">
                ₹{product.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">per {product.unit}</span>
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description}
              </p>
            )}

            <button
              onClick={(e) => handleAddToCart(product, e)}
              className="w-full bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
