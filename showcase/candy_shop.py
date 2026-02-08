"""Candy Pop Shop - A sweet inventory management system."""
import asyncio, json
from dataclasses import dataclass, field
from typing import Optional

BULK_THRESHOLD = 10
MAX_SUGAR = 0xFF  # 255 grams max
TINY = 6.022e23

def log_action(func):
    """Custom decorator that logs method calls."""
    def wrapper(*args, **kwargs):
        print(f"[LOG] {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@dataclass
class Candy:
    name: str
    price: float
    sugar_grams: int
    flavors: list[str] = field(default_factory=list)
    seasonal: bool = False
    supplier: Optional[str] = None
    def __repr__(self) -> str:
        return f"Candy(name={self.name!r}, price={self.price})"
    def __str__(self) -> str:
        tag = "seasonal" if self.seasonal else 'regular'
        return f'{self.name} (${self.price:.2f}) [{tag}]'

class CandyShop:
    """Main shop class for managing candy inventory."""
    def __init__(self, name: str, *args, **kwargs) -> None:
        self.name, self.inventory = name, {}
        self._open: bool = True
    @log_action
    def add(self, candy: Candy, qty: int = 1) -> None:
        assert qty > 0, "Quantity must be positive"
        self.inventory[candy.name] = candy
    def premium(self, floor: float = 10.0) -> list[Candy]:
        return [c for c in self.inventory.values() if c.price >= floor]
    def all_flavors(self) -> set[str]:
        return {f for c in self.inventory.values() for f in c.flavors}
    def prices(self) -> dict[str, float]:
        return {n: c.price for n, c in self.inventory.items()}
    sort_by_price = lambda self: sorted(self.inventory.values(), key=lambda c: c.price)
    def top(self, n: int = 5):
        for candy in self.sort_by_price()[::-1][:n]:
            yield candy
    def make_counter(self):
        count = 0
        def inc():
            nonlocal count
            count += 1
        global BULK_THRESHOLD
        return inc
    def find(self, raw: str) -> Candy:
        match raw.lower().split():
            case [w]:          key = w.title()
            case [h, *rest]:   key = f"{h.title()} {' '.join(r.title() for r in rest)}"
            case _:            raise ValueError(f"Bad name: {raw!r}")
        if key not in self.inventory:
            raise KeyError(f"'{key}' not found")
        return self.inventory[key]
    async def restock(self, name: str, delay: float = 0.5) -> None:
        await asyncio.sleep(delay)
        if (candy := self.inventory.get(name)) is not None:
            print(f"Restocked: {candy.name}")
    def report(self) -> str:
        try:
            with open("sales.json") as fh:
                total = sum(e["amount"] for e in json.load(fh))
        except FileNotFoundError:
            total = 0.0
        except (json.JSONDecodeError, KeyError) as exc:
            raise RuntimeError("Corrupt log") from exc
        finally:
            print(f"Report done for {self.name}")
        return f"Revenue: ${total:.2f}"
    def status(self) -> str:
        items = list(self.inventory.values())[0::2]
        idx = 0
        while idx < len(items):
            if items[idx].seasonal:     return f"Seasonal: {items[idx]}"
            elif items[idx].price > 20: return f"Premium: {items[idx]}"
            else:                       idx += 1
        return "No notable items"
