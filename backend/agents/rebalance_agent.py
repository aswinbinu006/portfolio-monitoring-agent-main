"""
Rebalance Agent - detects weight drift and reports (never executes trades).
"""
import sys
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).parent.parent))

import config


class RebalanceAgent:
    """
    Specialist agent for rebalancing recommendations.
    
    CRITICAL: This system NEVER places orders or issues buy/sell directives.
    This agent only REPORTS drift from target weights.
    """
    
    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.name = "RebalanceAgent"
        self.description = "Detects portfolio drift from target allocation"
    
    def check_drift(
        self,
        current_weights: Dict[str, float],
        target_weights: Dict[str, float],
        tolerance: float = None
    ) -> Dict:
        """
        Check if current weights have drifted from targets.
        
        Args:
            current_weights: Current portfolio weights
            target_weights: Target portfolio weights
            tolerance: Drift tolerance (default from config)
        
        Returns:
            Dict with drift analysis
        """
        if tolerance is None:
            tolerance = config.DRIFT_TOLERANCE
        
        drifts = []
        max_drift = 0.0
        
        for ticker in current_weights:
            current = current_weights[ticker]
            target = target_weights.get(ticker, 0.0)
            drift = abs(current - target)
            
            if drift > tolerance:
                drifts.append({
                    "ticker": ticker,
                    "current_weight": current,
                    "target_weight": target,
                    "drift": drift,
                    "drift_pct": (drift / target * 100) if target > 0 else 0
                })
            
            max_drift = max(max_drift, drift)
        
        if drifts:
            return {
                "status": "drift_detected",
                "max_drift": max_drift,
                "tolerance": tolerance,
                "drifting_positions": drifts,
                "message": f"{len(drifts)} position(s) exceed drift tolerance"
            }
        else:
            return {
                "status": "within_tolerance",
                "max_drift": max_drift,
                "tolerance": tolerance,
                "message": "All positions within drift tolerance"
            }
    
    def format_drift_report(self, drift_result: Dict) -> str:
        """Format drift analysis as readable text."""
        if drift_result["status"] == "within_tolerance":
            return "✓ Portfolio weights within tolerance"
        
        lines = []
        lines.append(f"⚠️  {drift_result['message']}")
        lines.append(f"Tolerance: {drift_result['tolerance']:.1%}\n")
        
        for pos in drift_result["drifting_positions"]:
            lines.append(f"{pos['ticker']}:")
            lines.append(f"  Current: {pos['current_weight']:.1%}")
            lines.append(f"  Target:  {pos['target_weight']:.1%}")
            lines.append(f"  Drift:   {pos['drift']:.1%}")
        
        lines.append("\nNOTE: This system does not place orders.")
        lines.append("Review with your advisor to determine if rebalancing is appropriate.")
        
        return "\n".join(lines)


if __name__ == "__main__":
    print("Rebalance Agent - monitoring only, never trades")
