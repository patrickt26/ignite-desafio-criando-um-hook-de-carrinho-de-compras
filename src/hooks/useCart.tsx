import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const itemStock = await api.get(`/stock/${productId}`)
        .then(response => response.data);
      
      const itemSelected = await api.get(`/products/${productId}`)
        .then(response => response.data);

      const newProductToCart = {
        id: productId,
        amount: 1,
        image: itemSelected.image,
        price: itemSelected.price,
        title: itemSelected.title,
      };

      if (cart.length === 0) {
        setCart([
          newProductToCart
        ]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([newProductToCart]));
        return;
      } else {
        const newCart = cart.slice();

        const productAreadyExists = cart.find((product) => product.id === productId);
        const productAreadyExistsIndex = cart.findIndex((item) => item.id === productId);

        if (!productAreadyExists) {
          setCart([
            ...cart,
            newProductToCart
          ]);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProductToCart]));
          return;
        } else {
          if (productAreadyExists?.amount + 1 > itemStock.amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
          } else {
            newCart[productAreadyExistsIndex].amount++;
            setCart(
              newCart,
            );
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
            return;
          }
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find((product) => product.id === productId);
      if (!productExists) {
        toast.error('Erro na remoção do produto');
        return
      }

      const productItemIndex = cart.findIndex((item) => item.id === productId);
      const newCart = cart.slice();

      newCart.splice(productItemIndex, 1);

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      return;
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const itemStock = await api.get(`/stock/${productId}`)
        .then(response => response.data);

      const newCart = cart.slice();
      const productItemIndex = cart.findIndex((item) => item.id === productId);

      if (amount <= 0) {
        return;
      } else {
        if (amount >= itemStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        } else {
          newCart[productItemIndex].amount = amount;
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          return
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
