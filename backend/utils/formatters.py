"""
Financial formatters for currency, percentage, and risk metrics.
"""
def format_currency(value: float, currency: str = "₹") -> str:
    """Formats numeric values into localized institutional currency strings."""
    if value is None:
        return f"{currency}0.00"
    return f"{currency}{value:,.2f}"

def format_percentage(value: float, decimals: int = 2) -> str:
    """Formats decimal proportions into percentages."""
    if value is None:
        return "0.00%"
    return f"{value * 100:.{decimals}f}%"
