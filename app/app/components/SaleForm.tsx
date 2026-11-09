"use client";

import {
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";

export type Product = {
  id: string;
  name: string;
};

export type SaleFormData = {
  productId?: string;
  productName?: string;
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

function subscribeToNothing() {
  return () => {};
}

function getNowOnServer() {
  return "";
}

export function SaleForm({ products, onSubmit }: SaleFormProps) {
  const [productId, setProductId] = useState("");
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [totalValue, setTotalValue] = useState("");
  const [editedSoldAt, setEditedSoldAt] = useState<string | null>(null);
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [isSending, setIsSending] = useState(false);

  const defaultSoldAt = useSyncExternalStore(
    subscribeToNothing,
    getNowLocalInput,
    getNowOnServer,
  );
  const soldAt = editedSoldAt ?? defaultSoldAt;

  function handleQuantityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (BLOCKED_KEYS.includes(event.key)) {
      event.preventDefault();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending || !soldAt) return;
    if (isCustomProduct && !customProductName.trim()) return;
    if (!isCustomProduct && !productId) return;

    setIsSending(true);

    let success = false;
    try {
      success = await onSubmit({
        productId: isCustomProduct ? undefined : productId,
        productName: isCustomProduct ? customProductName.trim() : undefined,
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
      setIsCustomProduct(false);
      setCustomProductName("");
      setQuantity("1");
      setTotalValue("");
      setEditedSoldAt(null);
      setChannel(CHANNELS[0]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="field-label mb-0">Produto ou serviço</span>
          <button
            type="button"
            onClick={() => {
              setIsCustomProduct(!isCustomProduct);
              setProductId("");
              setCustomProductName("");
            }}
            className="text-xs text-[#d6ff00] hover:underline"
          >
            {isCustomProduct ? "← Escolher da lista" : "+ Digitar novo produto próprio"}
          </button>
        </div>

        {isCustomProduct ? (
          <div>
            <input
              type="text"
              className="field text-base"
              placeholder="Ex: Bolo de Rolo Tradicional 500g"
              maxLength={120}
              value={customProductName}
              onChange={(e) => setCustomProductName(e.target.value)}
              disabled={isSending}
              required
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              O produto será cadastrado automaticamente no seu catálogo com o valor informado.
            </p>
          </div>
        ) : (
          <select
            className="field text-base"
            value={productId}
            onChange={(event) => {
              if (event.target.value === "__NEW__") {
                setIsCustomProduct(true);
                setProductId("");
              } else {
                setProductId(event.target.value);
              }
            }}
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
            <option value="__NEW__" className="text-[#d6ff00] font-semibold">
              + Digitar outro produto próprio...
            </option>
          </select>
        )}
      </div>

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
          onChange={(event) => setEditedSoldAt(event.target.value)}
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