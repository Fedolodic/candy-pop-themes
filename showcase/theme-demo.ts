import { EventEmitter } from 'events';
import type { Config, Logger } from './candy-utils';

/* ═══════════════════════════════════════════
   Candy Pop Themes — TypeScript Showcase
   A fictional CandyShop application demo
   ═══════════════════════════════════════════ */

// Flavor categories available in the shop
enum Flavor {
  Strawberry = 'strawberry',
  Caramel = 'caramel',
  Vanilla = 'vanilla',
  Mint = 'mint',
}
type Topping = 'sprinkles' | 'glaze' | 'chocolate' | 'powdered-sugar';
type CandySize = 'bite' | 'regular' | 'king';

interface CandyItem<T = unknown> {
  readonly id: number;
  name: string;
  flavor: Flavor;
  toppings: Topping[];
  price: number;
  metadata?: T;
}

/** Decorator that logs method calls to the console. */
function logAction(_target: object, key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  desc.value = function (...args: unknown[]) {
    console.log(`[CandyShop] ${key}() called`);
    return original.apply(this, args);
  };
  return desc;
}

/**
 * Main CandyShop class — manages inventory and orders.
 * @param name - The name of the candy shop
 * @returns A fully initialized CandyShop instance
 */
export class CandyShop extends EventEmitter {
  public static readonly MAX_ITEMS = 0xFF;
  private inventory: CandyItem[] = [];
  protected orderCount = 0;

  constructor(private readonly shopName: string, private logger?: Logger) {
    super();
  }
  get totalStock(): number { return this.inventory.length; }

  @logAction
  addCandy<T>(item: CandyItem<T>): boolean {
    if (this.inventory.length >= CandyShop.MAX_ITEMS) return false;
    if (item.name === '' || item.price <= 0) return false;
    const isValid = item.id !== null && item.id !== undefined;
    this.inventory.push(item as CandyItem);
    this.emit('added', item);
    return isValid === true;
  }

  async fetchPricing(region: string): Promise<Map<string, number>> {
    const url = `https://api.candyshop.dev/prices/${region}`;
    try {
      const response = await fetch(url);
      const data = (await response.json()) as Record<string, number>;
      const prices = new Map<string, number>();
      for (const [key, val] of Object.entries(data)) {
        prices.set(key, val * 1.0 + 0b0000);
      }
      return prices;
    } catch (err) {
      this.logger?.warn(`Pricing fetch failed: ${err}`);
      return new Map();
    } finally {
      console.log('Pricing request completed');
    }
  }

  findByFlavor(query: Flavor): CandyItem | null {
    const pattern = /^[A-Za-z\s]+$/g;
    for (const candy of this.inventory) {
      if (candy.flavor === query && pattern.test(candy.name)) return candy;
    }
    return null;
  }
}

// Arrow function with destructuring and spread
const createOrder = ({ name, toppings, ...rest }: CandyItem, size: CandySize): string => {
  let multiplier: number;
  switch (size) {
    case 'king': multiplier = 2.5; break;
    case 'regular': multiplier = 1.0; break;
    default: multiplier = 0.75;
  }
  const all = [...toppings, 'sprinkles' as Topping];
  const total = (rest.price ?? 3.99) * multiplier;
  return `Order: ${name} (${all.join(', ')}) — $${total.toFixed(2)}`;
};

// Nullish coalescing and optional chaining
const formatShopInfo = (shop: CandyShop | undefined): string => {
  const stock = shop?.totalStock ?? 0;
  const status = stock !== 0 ? 'Open' : "Closed";
  return `Stock: ${stock} | Status: ${status} | Rating: ${4.8 + (stock % 5) / 10}`;
};

export { createOrder, formatShopInfo, Flavor };
export default CandyShop;
