"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

export type Product = {
  id: string;
  name: string;
};

export type SaleFormData = {
  productId: string;
  quantity: number;
  soldAt: string;
};

type SaleFormProps = {
  products: Product[];
  onSubmit: (data: SaleFormData) => Promise<boolean>;
};

const BLOCKED_KEYS = ["e", "E", "+", "-", ".", ","];

function getNowLocalInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function SaleForm({ products, onSubmit }: SaleFormProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [soldAt, setSoldAt] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setSoldAt(getNowLocalInput());
  }, []);

  function handleQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (BLOCKED_KEYS.includes(event.key)) {
      event.preventDefault();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;

    setIsSending(true);

    let success = false;
    try {
      success = await onSubmit({
        productId,
        quantity: Number(quantity),
        soldAt: new Date(soldAt).toISOString(),
      });
    } finally {
      setIsSending(false);
    }

    if (success) {
      setProductId("");
      setQuantity("1");
      setSoldAt(getNowLocalInput());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">Produto</span>
        <select
          className="field text-base"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          disabled={isSending}
          required
        >
          <option value="" disabled>
            Selecione um produto
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="field-label">Quantidade</span>
        <input
          className="field text-base"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={quantity}
          onKeyDown={handleQuantityKeyDown}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={isSending}
          required
        />
      </label>

      <label className="block">
        <span className="field-label">Data e hora</span>
        <input
          className="field text-base [color-scheme:dark]"
          type="datetime-local"
          value={soldAt}
          onChange={(event) => setSoldAt(event.target.value)}
          disabled={isSending}
          required
        />
      </label>

      <button className="primary-button" type="submit" disabled={isSending}>
        {isSending ? "Registrando..." : "Registrar venda"}
      </button>
    </form>
  );
}