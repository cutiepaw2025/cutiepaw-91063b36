import { toast } from "sonner";

interface UniInventoryEntry {
  sku: string;
  facility?: string;
  available?: number;
  reserved?: number;
}

const baseUrl = import.meta.env.VITE_SIB_UNI_COMMERCE_BASE_URL;
const username = import.meta.env.VITE_SIB_UNI_COMMERCE_USERNAME;
const password = import.meta.env.VITE_SIB_UNI_COMMERCE_PASSWORD;
const clientId = import.meta.env.VITE_SIB_UNI_COMMERCE_CLIENT_ID;
const facility = import.meta.env.VITE_SIB_UNI_COMMERCE_FACILITY;

export async function fetchInventorySnapshot(skus?: string[]): Promise<UniInventoryEntry[]> {
  if (!baseUrl || !username || !password || !clientId) {
    throw new Error("Unicommerce credentials missing in .env (VITE_SIB_UNI_*)");
  }

  try {
    // Updated endpoint based on provided info
    const url = `${baseUrl}/services/rest/v1/inventory/fetch`;
    const auth = btoa(`${username}:${password}`);

    const body: any = {
      facilityCodes: facility ? [facility] : undefined,
      itemSkus: skus && skus.length > 0 ? skus : undefined,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'x-client-id': clientId,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Unicommerce error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const items: any[] = data.items || data.data || data || [];

    const entries: UniInventoryEntry[] = (items || []).map((it: any) => ({
      sku: it.sku || it.itemSku || it.code || '',
      facility: it.facility || it.facilityCode || facility,
      available: it.availableQty ?? it.available ?? it.quantityAvailable ?? 0,
      reserved: it.reservedQty ?? it.reserved ?? it.quantityReserved ?? 0,
    })).filter(e => e.sku);

    return entries;
  } catch (error: any) {
    console.error('Unicommerce fetch error:', error);
    toast.error('Failed to fetch inventory from Unicommerce');
    throw error;
  }
}
