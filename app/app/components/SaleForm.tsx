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
  totalValue: number;
  soldAt: string;
  channel: string;
};

type SaleFormProps = {
  products: Product[];
  onSubmit: (data: SaleFormData) => Promise<boolean>;
};

const BLOCKED_KEYS = ["e", "E", "+", "-", ".", ","];
const CHANNELS = ["Balcão", "Delivery", "WhatsApp"];
const VALUE_PATTERN = "(?!0+(?:[.,]0{1,2})?$)[0-9]+(?:[.,][0-9]{1,2})?";

function getNowLocalInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function SaleForm({ products, onSubmit }: SaleFormProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [totalValue, setTotalValue] = useState("");
  const [soldAt, setSoldAt] = useState("");
  const [channel, setChannel] = useState(CHANNELS[0]);
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
        totalValue: Number(totalValue.replace(",", ".")),
        soldAt: new Date(soldAt).toISOString(),
        channel,
      });
    } finally {
      setIsSending(false);
    }

    if (success) {
      setProductId("");
      setQuantity("1");
      setTotalValue("");
      setSoldAt(getNowLocalInput());
      setChannel(CHANNELS[0]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="field-label">Produto ou serviço</span>
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
        <span className="field-label">Valor total</span>
        <input
          className="field text-base"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          pattern={VALUE_PATTERN}
          title="Informe um valor maior que zero, como 16,00"
          value={totalValue}
          onChange={(event) =>
            setTotalValue(event.target.value.replace(/[^\d.,]/g, ""))
          }
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

      <label className="block">
        <span className="field-label">Canal</span>
        <select
          className="field text-base"
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          disabled={isSending}
        >
          {CHANNELS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <button
        className="primary-button sm:col-span-2"
        type="submit"
        disabled={isSending}
      >
        {isSending ? "Registrando..." : "Registrar venda"}
      </button>
    </form>
  );
}