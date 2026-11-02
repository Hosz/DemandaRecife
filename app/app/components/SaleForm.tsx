"use client";

import { useState } from "react";

export type SaleFormData = {
  productId: string;
  quantity: number;
  totalValue: number;
  soldAt: string;
  channel: string;
};

type Product = {
  id: string;
  name: string;
};

type SaleFormProps = {
  onSubmit: (data: SaleFormData) => Promise<boolean>;
};

const products: Product[] = [
  { id: "1", name: "Pão francês" },
  { id: "2", name: "Leite integral" },
  { id: "3", name: "Iogurte natural" },
  { id: "4", name: "Farinha de trigo" },
  { id: "5", name: "Café em grãos" },
];

export function SaleForm({ onSubmit }: SaleFormProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(20);
  const [totalValue, setTotalValue] = useState("16,00");
  const [soldAt, setSoldAt] = useState("");
  const [channel, setChannel] = useState("Balcão");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!productId || quantity <= 0) return;

    setLoading(true);

    const value = Number(
      totalValue.replace(/\./g, "").replace(",", ".")
    );

    const success = await onSubmit({
      productId,
      quantity,
      totalValue: value,
      soldAt: soldAt
        ? new Date(soldAt).toISOString()
        : new Date().toISOString(),
      channel,
    });

    if (success) {
      setQuantity(1);
      setTotalValue("");
    }

    setLoading(false);
  }

  const fieldClass =
    "h-[34px] w-full rounded-lg border border-white/[0.07] bg-[#252525] px-3 text-[11px] text-white outline-none focus:border-[#d6ff00]";

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div>
        <label className="mb-1 block text-[9px] text-neutral-400">
          Produto ou serviço
        </label>

        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className={fieldClass}
          required
        >
          <option value="">Selecione um produto</option>

          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[9px] text-neutral-400">
            Quantidade
          </label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={fieldClass}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-[9px] text-neutral-400">
            Valor total
          </label>

          <input
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            placeholder="16,00"
            className={fieldClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[9px] text-neutral-400">
            Data
          </label>

          <input
            type="datetime-local"
            value={soldAt}
            onChange={(e) => setSoldAt(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-[9px] text-neutral-400">
            Canal
          </label>

          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className={fieldClass}
          >
            <option>Balcão</option>
            <option>Delivery</option>
            <option>WhatsApp</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="primary-button !h-[34px] !rounded-lg !py-1 !text-[11px]"
      >
        {loading ? "Registrando..." : "Registrar venda"}
      </button>
    </form>
  );
}